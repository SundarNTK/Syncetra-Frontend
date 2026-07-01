import { useCallback, useEffect, useRef, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getHotels, addHotel, updateHotel, deleteHotel, signMediaUpload, resolveMapLink } from "../../../services/trips";
import { getAdminGroups } from "../../../services/groups";
import { validateFile, uploadToCloudinary } from "../../../utils/uploadToCloudinary";
import SearchableSelect from "../../../components/ui/SearchableSelect";
import ZoomableImage from "../../../components/ui/ZoomableImage";
import LocationPicker from "../../../components/location-picker/LocationPicker";
import DateTimePicker12h from "../../../components/ui/DateTimePicker12h";
import { toDateInputValue } from "../../../utils/dateTimeUtils";
import { useActionPopup } from "../../../hooks/useActionPopup";
import { useDeleteConfirm } from "../../../hooks/useDeleteConfirm";
import { useOnlineReload } from "../../../hooks/useOnlineReload";
import HotelDetailModal, {
  fmt,
  MEALS,
  MEAL_LABEL,
  MEAL_ICON,
  PAYMENT_STATUS,
  getPaymentStatusKey,
  PaymentStatusBadge,
  GlowStat,
  nightsBetween,
} from "../../../components/hotels/HotelDetailModal";

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const BED_TYPES = [
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
  { value: "twin",   label: "Twin" },
  { value: "queen",  label: "Queen" },
  { value: "king",   label: "King" },
  { value: "bunk",   label: "Bunk" },
];

const MAX_MEDIA = 10;

// Matches the height/shape of SearchableSelect's trigger (SYNC_SELECT_TRIGGER) so
// dropdowns and text/number inputs line up in the same grid row.
const inputCls = "w-full min-h-[2.75rem] px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-emerald-600/60 focus:outline-none transition-colors";
const labelCls = "block text-xs font-medium text-slate-400 mb-1.5";

const emptyFood = () => ({ available: false, menu: [], perPersonCost: "" });
const EMPTY_FORM = {
  hotelName: "", location: null,
  images: [], videos: [],
  perDayCost: "", advanceAmount: "", advancePaid: false, paymentCompleted: false,
  checkInAt: "", checkOutAt: "",
  roomsCount: "1", bedsCount: "1", bedType: "double",
  complimentary: [],
  foodDetails: { breakfast: emptyFood(), lunch: emptyFood(), dinner: emptyFood() },
  notes: "",
};

/* ─── ToggleSwitch ────────────────────────────────────────────────────────────── */
function ToggleSwitch({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        {description && <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full shrink-0 transition-colors duration-200 ${checked ? "bg-emerald-600" : "bg-slate-700"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

/* ─── SectionHeader ───────────────────────────────────────────────────────────── */
function SectionHeader({ icon, title }) {
  return (
    <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 pt-1">
      <span>{icon}</span>{title}
    </p>
  );
}

/* ─── MapLinkPaste — paste any Google Maps link (incl. shortened maps.app.goo.gl)
   and drop the pin automatically, resolved server-side to dodge browser CORS ──── */
async function reverseGeocode(lat, lng) {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
    headers: { "Accept-Language": "en" },
  });
  return res.json();
}

function MapLinkPaste({ onResolved }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleResolve = async () => {
    const pasted = url.trim();
    if (!pasted || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await resolveMapLink(pasted);
      const lat = res?.data?.lat;
      const lng = res?.data?.lng;
      if (lat == null || lng == null) throw new Error("Could not detect a location from that link");

      let name = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      try {
        const geo = await reverseGeocode(lat, lng);
        if (geo?.display_name) name = geo.display_name;
      } catch {
        /* reverse geocode is a nice-to-have, coordinates already resolved fine without it */
      }

      onResolved({ name, lat, lng, url: pasted });
      setUrl("");
    } catch (err) {
      setError(err.message || "Couldn't read that link — try pinning the location on the map instead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleResolve(); } }}
          placeholder="Paste a Google Maps link — e.g. https://maps.app.goo.gl/…"
          className={inputCls}
        />
        <button type="button" onClick={handleResolve} disabled={loading || !url.trim()}
          className="shrink-0 px-4 min-h-[2.75rem] rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors">
          {loading ? "Locating…" : "Locate"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

/* ─── MediaUploader — images or videos, capped at MAX_MEDIA, Cloudinary-backed ── */
function MediaUploader({ tripId, kind, items, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = async (files) => {
    const remaining = MAX_MEDIA - items.length;
    if (remaining <= 0) return;
    setError("");
    const picked = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of picked) {
        try {
          const mediaType = validateFile(file);
          if ((kind === "image" && mediaType !== "image") || (kind === "video" && mediaType !== "video")) {
            throw new Error(kind === "image" ? "Only image files allowed here" : "Only video files allowed here");
          }
          const signRes = await signMediaUpload(tripId, true);
          const signData = signRes?.data;
          if (!signData?.signature) throw new Error("Could not get upload token");
          const result = await uploadToCloudinary(file, signData);
          uploaded.push(result.url);
        } catch (err) {
          setError(err.message || "Upload failed");
        }
      }
      if (uploaded.length) onChange([...items, ...uploaded]);
    } finally {
      setUploading(false);
    }
  };

  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-400">{error}</p>}
      {items.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {items.map((src, i) => (
            <div key={i} className="relative w-20 h-16 rounded-xl overflow-hidden border border-slate-700 shrink-0 group bg-black">
              {kind === "video" ? (
                <video src={src} className="w-full h-full object-cover" muted />
              ) : (
                <ZoomableImage src={src} alt="" className="w-full h-full object-cover" />
              )}
              <button type="button" onClick={() => remove(i)}
                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-white text-lg">
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {items.length < MAX_MEDIA && (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-600 hover:border-emerald-600/60 text-slate-400 hover:text-emerald-400 text-sm transition-colors disabled:opacity-50">
          {uploading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : null}
          {uploading ? "Uploading…" : `Upload ${kind === "video" ? "Videos" : "Photos"} (${items.length}/${MAX_MEDIA})`}
        </button>
      )}
      <input ref={inputRef} type="file" accept={kind === "video" ? "video/*" : "image/*"} multiple className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
    </div>
  );
}

/* ─── Single-file uploader — used for complimentary item images ─────────────── */
function SingleImageUploader({ tripId, value, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      validateFile(file);
      const signRes = await signMediaUpload(tripId, true);
      const signData = signRes?.data;
      if (!signData?.signature) throw new Error("Could not get upload token");
      const result = await uploadToCloudinary(file, signData);
      onChange(result.url);
    } catch {
      /* silently ignored — image is optional */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      {value ? (
        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-700 group">
          <ZoomableImage src={value} alt="" className="w-full h-full object-cover" />
          <button type="button" onClick={() => onChange("")}
            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm">×</button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
          className="w-10 h-10 rounded-lg border border-dashed border-slate-600 hover:border-emerald-600/60 text-slate-500 hover:text-emerald-400 flex items-center justify-center text-xs transition-colors disabled:opacity-50">
          {busy ? "…" : "📷"}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}

/* ─── ComplimentaryEditor ─────────────────────────────────────────────────────── */
function ComplimentaryEditor({ tripId, items, onChange }) {
  const [name, setName] = useState("");
  const [pendingImage, setPendingImage] = useState("");

  const add = () => {
    if (!name.trim()) return;
    onChange([...items, { name: name.trim(), imageUrl: pendingImage }]);
    setName("");
    setPendingImage("");
  };
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const setImage = (i, url) => onChange(items.map((it, idx) => (idx === i ? { ...it, imageUrl: url } : it)));

  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <div className="space-y-1.5">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <SingleImageUploader tripId={tripId} value={it.imageUrl} onChange={(url) => setImage(i, url)} />
              <span className="text-sm text-slate-200 flex-1 truncate">{it.name}</span>
              <button type="button" onClick={() => remove(i)} className="text-slate-500 hover:text-red-400 text-sm shrink-0">✕</button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2">
        <SingleImageUploader tripId={tripId} value={pendingImage} onChange={setPendingImage} />
        <input value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Amenity name (e.g. Free WiFi)" className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none" />
        <button type="button" onClick={add} disabled={!name.trim()}
          className="shrink-0 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-colors">
          Add
        </button>
      </div>
      <p className="text-[10px] text-slate-600">Attach a photo (optional) before adding, or add it later from the list above.</p>
    </div>
  );
}

/* ─── MenuItemEditor — each dish is its own record: add, edit, remove ───────── */
function MenuItemEditor({ items, onChange }) {
  const [draft, setDraft] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");

  const add = () => {
    if (!draft.trim()) return;
    onChange([...items, draft.trim()]);
    setDraft("");
  };
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const startEdit = (i) => { setEditingIndex(i); setEditValue(items[i]); };
  const saveEdit = () => {
    if (editValue.trim()) onChange(items.map((it, idx) => (idx === editingIndex ? editValue.trim() : it)));
    setEditingIndex(null);
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950 focus-within:border-emerald-600/60 transition-colors p-2.5 space-y-2">
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) =>
            editingIndex === i ? (
              <div key={i} className="flex items-center gap-1 bg-slate-900 border border-emerald-500/60 rounded-full pl-3 pr-1 py-1">
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); saveEdit(); }
                    if (e.key === "Escape") setEditingIndex(null);
                  }}
                  className="bg-transparent text-xs text-white focus:outline-none w-20"
                />
                <button type="button" onClick={saveEdit} title="Save"
                  className="w-5 h-5 rounded-full bg-emerald-600/80 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 transition-colors">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button type="button" onClick={() => setEditingIndex(null)} title="Cancel"
                  className="w-5 h-5 rounded-full bg-slate-800 hover:bg-red-900/60 text-slate-400 hover:text-red-300 flex items-center justify-center shrink-0 transition-colors">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <span key={i}
                className="group flex items-center gap-1.5 bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-800/40 rounded-full pl-3 pr-1 py-1 text-xs font-medium text-emerald-100">
                {item}
                <span className="flex items-center gap-0.5">
                  <button type="button" onClick={() => startEdit(i)} title="Edit"
                    className="w-5 h-5 rounded-full text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-900/60 flex items-center justify-center transition-colors">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => remove(i)} title="Remove"
                    className="w-5 h-5 rounded-full text-emerald-400/70 hover:text-red-300 hover:bg-red-900/50 flex items-center justify-center transition-colors">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              </span>
            )
          )}
        </div>
      )}
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" />
        </svg>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Type a dish name and press Enter…"
          className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none py-1"
        />
        <button type="button" onClick={add} disabled={!draft.trim()}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </div>
    </div>
  );
}

/* ─── FoodDetailsEditor ───────────────────────────────────────────────────────── */
function FoodDetailsEditor({ value, onChange }) {
  const setMeal = (meal, patch) => onChange({ ...value, [meal]: { ...value[meal], ...patch } });

  return (
    <div className="space-y-2">
      {MEALS.map((meal) => {
        const m = value[meal] || emptyFood();
        return (
          <div key={meal} className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={m.available}
                  onChange={(e) => setMeal(meal, { available: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600" />
                <span className="text-sm font-medium text-slate-200">{MEAL_ICON[meal]} {MEAL_LABEL[meal]}</span>
              </label>
              {m.available && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 whitespace-nowrap">Per person cost for {MEAL_LABEL[meal].toLowerCase()} (₹)</span>
                  <input
                    type="number" min="0"
                    placeholder="e.g. 150"
                    value={m.perPersonCost}
                    onChange={(e) => setMeal(meal, { perPersonCost: e.target.value })}
                    className="w-28 min-h-[2.25rem] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-emerald-600/60 focus:outline-none transition-colors"
                  />
                </div>
              )}
            </div>
            {m.available && (
              <div className="pl-6">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Menu Items</p>
                <MenuItemEditor items={m.menu || []} onChange={(v) => setMeal(meal, { menu: v })} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── HotelForm ───────────────────────────────────────────────────────────────── */
function HotelForm({ tripId, initial, memberCount, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Advance Paid and Payment Completed cascade: completing payment implies the advance
  // was paid too; un-marking advance as paid means the balance can't be complete either.
  const setAdvancePaid = (val) => setForm((p) => ({ ...p, advancePaid: val, paymentCompleted: val ? p.paymentCompleted : false }));
  const setPaymentCompleted = (val) => setForm((p) => ({ ...p, paymentCompleted: val, advancePaid: val ? true : p.advancePaid }));

  const nights = nightsBetween(form.checkInAt, form.checkOutAt);
  const totalCost = (Number(form.perDayCost) || 0) * nights;
  const balanceDue = totalCost - (Number(form.advanceAmount) || 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-5">
      <SectionHeader icon="🏨" title="Basic Info" />
      <div>
        <label className={labelCls}>Hotel Name <span className="text-red-400">*</span></label>
        <input placeholder="e.g. Fortune Grand, Kodaikanal" value={form.hotelName} onChange={(e) => set("hotelName", e.target.value)} className={inputCls} required />
      </div>
      <div className="rounded-xl border border-slate-700/60 bg-slate-950/40 p-3.5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-base">📍</span>
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Hotel Location</p>
          <span className="text-xs text-slate-600 font-normal normal-case">(optional)</span>
        </div>
        <MapLinkPaste onResolved={(loc) => set("location", loc)} />
        <p className="text-[11px] text-slate-600">— or search / tap the map below to pin, drag to adjust —</p>
        <LocationPicker value={form.location} onChange={(loc) => set("location", loc)} />
      </div>

      <SectionHeader icon="🖼️" title="Media" />
      <div>
        <label className={labelCls}>Photos <span className="text-slate-600">(up to 10)</span></label>
        <MediaUploader tripId={tripId} kind="image" items={form.images} onChange={(v) => set("images", v)} />
      </div>
      <div>
        <label className={labelCls}>Videos <span className="text-slate-600">(up to 10)</span></label>
        <MediaUploader tripId={tripId} kind="video" items={form.videos} onChange={(v) => set("videos", v)} />
      </div>

      <SectionHeader icon="💰" title="Cost & Payment" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Per Day Cost (₹)</label>
          <input type="number" min="0" placeholder="e.g. 2500" value={form.perDayCost} onChange={(e) => set("perDayCost", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Advance Amount (₹)</label>
          <input type="number" min="0" placeholder="e.g. 3000" value={form.advanceAmount} onChange={(e) => set("advanceAmount", e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <ToggleSwitch
          checked={form.advancePaid}
          onChange={setAdvancePaid}
          label="Advance Paid"
          description="Turn on once the advance amount above has actually been paid"
        />
        <ToggleSwitch
          checked={form.paymentCompleted}
          onChange={setPaymentCompleted}
          label="Balance Payment Completed"
          description="Turn on once the full remaining balance has been settled"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Current status:</span>
        <PaymentStatusBadge hotel={form} />
      </div>

      <SectionHeader icon="📅" title="Stay Dates" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Check-in</label>
          <DateTimePicker12h value={form.checkInAt} onChange={(v) => set("checkInAt", v)} showHint={false} />
        </div>
        <div>
          <label className={labelCls}>Check-out</label>
          <DateTimePicker12h
            value={form.checkOutAt}
            onChange={(v) => set("checkOutAt", v)}
            dateMin={form.checkInAt ? toDateInputValue(form.checkInAt) : undefined}
            showHint={false}
          />
        </div>
      </div>

      <SectionHeader icon="🛏️" title="Rooms & Beds" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Rooms</label>
          <input type="number" min="1" placeholder="1" value={form.roomsCount} onChange={(e) => set("roomsCount", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Beds</label>
          <input type="number" min="1" placeholder="1" value={form.bedsCount} onChange={(e) => set("bedsCount", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Bed Type</label>
          <SearchableSelect value={form.bedType} onChange={(v) => set("bedType", v)} options={BED_TYPES} searchable={false} searchThreshold={99} />
        </div>
      </div>

      <SectionHeader icon="🎁" title="Complimentary Amenities" />
      <ComplimentaryEditor tripId={tripId} items={form.complimentary} onChange={(v) => set("complimentary", v)} />

      <SectionHeader icon="🍽️" title="Food Details" />
      <FoodDetailsEditor value={form.foodDetails} onChange={(v) => set("foodDetails", v)} />

      <SectionHeader icon="📝" title="More Details" />
      <textarea rows={2} placeholder="Any other notes about this hotel booking (e.g. contact person, special instructions)"
        value={form.notes} onChange={(e) => set("notes", e.target.value)} className={inputCls} />

      {/* Computed summary */}
      <div className="relative rounded-xl overflow-hidden border border-emerald-700/30 bg-slate-950/80 p-3">
        <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest mb-2">Auto-calculated Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Nights", val: nights },
            { label: "Total Cost", val: fmt(totalCost) },
            { label: "Balance Due", val: fmt(Math.max(0, balanceDue)) },
            { label: "Members (auto)", val: memberCount != null ? memberCount : "—" },
          ].map(({ label, val }) => (
            <div key={label} className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">{val}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" disabled={saving || !form.hotelName}
          onClick={() => {
            const { location, ...rest } = form;
            onSave({
              ...rest,
              locationName: location?.name || "",
              latitude: location?.lat ?? undefined,
              longitude: location?.lng ?? undefined,
              mapLink: location?.url || "",
              perDayCost: Number(form.perDayCost) || 0,
              advanceAmount: Number(form.advanceAmount) || 0,
              roomsCount: Number(form.roomsCount) || 1,
              bedsCount: Number(form.bedsCount) || 1,
            });
          }}
          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
          {saving ? "Saving…" : "Save Hotel"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold text-sm transition-colors">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── HotelCard ───────────────────────────────────────────────────────────────── */
function HotelCard({ hotel, memberCount, onView, onEdit, onDelete }) {
  const nights = nightsBetween(hotel.checkInAt, hotel.checkOutAt);
  const totalCost = (Number(hotel.perDayCost) || 0) * nights;
  const cover = hotel.images?.[0];
  const statusStyle = PAYMENT_STATUS[getPaymentStatusKey(hotel)];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 transition-all duration-200"
      style={{ boxShadow: `0 0 22px rgba(${statusStyle.rgb},0.18)` }}>
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        {/* Cover */}
        <div className="relative shrink-0 w-full h-36 sm:w-32 sm:h-32 rounded-xl overflow-hidden border"
          style={{ borderColor: `rgba(${statusStyle.rgb},0.35)` }}>
          {cover ? (
            <ZoomableImage src={cover} alt={hotel.hotelName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-3xl">🏨</div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-base font-bold text-white truncate">{hotel.hotelName}</p>
              {hotel.locationName && <p className="text-xs text-slate-500 mt-0.5 truncate">📍 {hotel.locationName}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <PaymentStatusBadge hotel={hotel} />
              <div className="text-right px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-600/30"
                style={{ boxShadow: "0 0 14px rgba(16,185,129,0.16)" }}>
                <p className="text-[9px] text-emerald-400/80 uppercase tracking-wide">Total Cost</p>
                <p className="font-black text-emerald-400 font-mono text-base leading-tight">{fmt(totalCost)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <GlowStat icon="🛏️" label="Rooms" value={hotel.roomsCount || 1} color="59,130,246" />
            <GlowStat icon="🛌" label="Beds" value={`${hotel.bedsCount || 1} · ${hotel.bedType || "double"}`} color="139,92,246" />
            <GlowStat icon="🌙" label="Nights" value={nights || "—"} color="6,182,212" />
            <GlowStat icon="👥" label="Members" value={memberCount != null ? memberCount : "—"} color="236,72,153" />
          </div>

          <div className="flex items-center gap-2 mt-auto pt-3">
            <div className="flex items-center gap-2 ml-auto">
              <button type="button" onClick={() => onView(hotel)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-600 text-xs font-medium transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                View
              </button>
              <button type="button" onClick={() => onEdit(hotel)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-600 text-xs font-medium transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button type="button" onClick={() => onDelete(hotel)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-800/50 text-red-400 hover:bg-red-900/60 hover:text-red-300 text-xs font-medium transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── AdminHotels ─────────────────────────────────────────────────────────────── */
export default function AdminHotels() {
  const { selectedTripId } = useTrip();
  const { popup, showSuccess, showError } = useActionPopup("hotels");
  const { confirmDelete, deleteModal } = useDeleteConfirm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editHotel, setEditHotel] = useState(null);
  const [viewHotel, setViewHotel] = useState(null);
  const [memberCount, setMemberCount] = useState(null);

  const load = useCallback(async () => {
    if (!selectedTripId) return;
    setLoading(true);
    try {
      const [h, g] = await Promise.all([getHotels(selectedTripId), getAdminGroups()]);
      if (h !== null) setItems(h?.data || []);
      if (g !== null) {
        const linkedGroup = (g?.data || []).find((grp) => String(grp.tripId) === String(selectedTripId));
        setMemberCount(linkedGroup?.members?.length ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedTripId]);

  useEffect(() => { load(); }, [load]);
  useOnlineReload(load);

  const toEditForm = (h) => ({
    hotelName: h.hotelName || "",
    location: h.locationName && h.latitude != null && h.longitude != null
      ? { name: h.locationName, lat: h.latitude, lng: h.longitude, url: h.mapLink }
      : null,
    images: h.images || [], videos: h.videos || [],
    perDayCost: h.perDayCost ?? "", advanceAmount: h.advanceAmount ?? "",
    advancePaid: !!h.advancePaid, paymentCompleted: !!h.paymentCompleted,
    checkInAt: h.checkInAt || "", checkOutAt: h.checkOutAt || "",
    roomsCount: String(h.roomsCount ?? 1), bedsCount: String(h.bedsCount ?? 1), bedType: h.bedType || "double",
    complimentary: h.complimentary || [],
    foodDetails: {
      breakfast: { ...emptyFood(), ...(h.foodDetails?.breakfast || {}) },
      lunch: { ...emptyFood(), ...(h.foodDetails?.lunch || {}) },
      dinner: { ...emptyFood(), ...(h.foodDetails?.dinner || {}) },
    },
    notes: h.notes || "",
  });

  const handleAdd = async (payload) => {
    setSaving(true);
    try {
      await addHotel(selectedTripId, payload);
      setShowForm(false);
      load();
      showSuccess("Hotel added successfully.");
    } catch (err) {
      showError(err.message || "Failed to add hotel.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload) => {
    setSaving(true);
    try {
      await updateHotel(selectedTripId, editHotel._id, payload);
      setEditHotel(null);
      load();
      showSuccess("Hotel updated successfully.");
    } catch (err) {
      showError(err.message || "Failed to update hotel.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (h) => {
    confirmDelete({
      title: "Delete Hotel",
      recordLabel: h.hotelName,
      onConfirm: async () => {
        try {
          await deleteHotel(selectedTripId, h._id);
          load();
          showSuccess("Hotel deleted successfully.");
        } catch (e) {
          showError(e.message || "Delete failed.");
        }
      },
    });
  };

  return (
    <TripModuleShell title="Hotels" description="Hotel bookings & stay details" loading={loading && !!selectedTripId}>
      {popup}
      {deleteModal}

      {selectedTripId && (
        <>
          {editHotel && (
            <div className="mb-4">
              <p className="text-xs text-slate-400 font-medium mb-2">Edit Hotel</p>
              <HotelForm
                tripId={selectedTripId}
                initial={toEditForm(editHotel)}
                memberCount={memberCount}
                saving={saving}
                onSave={handleUpdate}
                onCancel={() => setEditHotel(null)}
              />
            </div>
          )}

          {!editHotel && (
            showForm ? (
              <div className="mb-4">
                <p className="text-xs text-slate-400 font-medium mb-2">Add Hotel</p>
                <HotelForm
                  tripId={selectedTripId}
                  memberCount={memberCount}
                  saving={saving}
                  onSave={handleAdd}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            ) : (
              <button type="button" onClick={() => setShowForm(true)}
                className="mb-4 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors">
                + Add Hotel
              </button>
            )
          )}

          {items.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <p className="text-3xl mb-2">🏨</p>
              <p className="text-sm">No hotels added yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((h) => (
                <HotelCard key={h._id} hotel={h} memberCount={memberCount} onView={setViewHotel} onEdit={setEditHotel} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </>
      )}

      {viewHotel && <HotelDetailModal hotel={viewHotel} onClose={() => setViewHotel(null)} />}
    </TripModuleShell>
  );
}
