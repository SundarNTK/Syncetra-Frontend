import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getVehicles, addVehicle, updateVehicle } from "../../../services/trips";
import DatePickerField from "../../../components/ui/DatePickerField";

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const VEHICLE_TYPES = [
  { value: "bus",             label: "Bus" },
  { value: "van",             label: "Van" },
  { value: "car",             label: "Car" },
  { value: "tempo_traveller", label: "Tempo Traveller" },
  { value: "minibus",         label: "Mini Bus" },
  { value: "jeep",            label: "Jeep" },
  { value: "auto",            label: "Auto" },
  { value: "bike",            label: "Bike" },
];

const TYPE_ICON = {
  bus: "🚌", van: "🚐", car: "🚗", tempo_traveller: "🚌",
  minibus: "🚐", jeep: "🚙", auto: "🛺", bike: "🏍️",
};

const fmtINR = (n) => n ? `₹${Number(n).toLocaleString("en-IN")}` : "—";
const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const calcDuration = (start, end) => {
  if (!start || !end) return null;
  const diff = new Date(end) - new Date(start);
  if (diff <= 0) return null;
  const totalHours = Math.round(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hrs  = totalHours % 24;
  if (days === 0) return `${totalHours} hour${totalHours !== 1 ? "s" : ""}`;
  if (hrs === 0)  return `${days} day${days !== 1 ? "s" : ""}`;
  return `${days}d ${hrs}h`;
};

const MAX_IMAGES = 5;
const IMAGE_MAX_BYTES = 1.5 * 1024 * 1024; // 1.5 MB per image

/* ─── Image helpers ──────────────────────────────────────────────────────────── */
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const compressImage = (dataUrl, maxBytes = IMAGE_MAX_BYTES) =>
  new Promise((resolve) => {
    if (dataUrl.length * 0.75 <= maxBytes) { resolve(dataUrl); return; }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      const scale = Math.sqrt(maxBytes / (dataUrl.length * 0.75));
      canvas.width  = Math.floor(width  * scale);
      canvas.height = Math.floor(height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.src = dataUrl;
  });

/* ─── ImageUploader ──────────────────────────────────────────────────────────── */
function ImageUploader({ images, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files) => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;
    setUploading(true);
    try {
      const picked = Array.from(files).slice(0, remaining);
      const encoded = await Promise.all(
        picked.map(async (f) => compressImage(await toBase64(f)))
      );
      onChange([...images, ...encoded]);
    } finally {
      setUploading(false);
    }
  };

  const remove = (i) => onChange(images.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {/* Preview grid */}
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((src, i) => (
            <div key={i} className="relative w-20 h-16 rounded-xl overflow-hidden border border-slate-700 shrink-0 group">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-white text-lg"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < MAX_IMAGES && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-600 hover:border-emerald-600/60 text-slate-400 hover:text-emerald-400 text-sm transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
          {uploading ? "Processing…" : `Upload Photos (${images.length}/${MAX_IMAGES})`}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

/* ─── VehicleForm ─────────────────────────────────────────────────────────────── */
const EMPTY_FORM = {
  name: "", type: "bus", plateNumber: "", totalSeats: "",
  images: [], bookedDate: "", advanceAmount: "", totalAmount: "",
  tripStartDate: "", tripEndDate: "",
};

function VehicleForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const duration = calcDuration(form.tripStartDate, form.tripEndDate);

  const inputCls = "w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-emerald-600/60 focus:outline-none transition-colors";
  const labelCls = "block text-xs font-medium text-slate-400 mb-1.5";

  return (
    <div className="space-y-5">
      {/* Images */}
      <div>
        <p className={labelCls}>Vehicle Photos (up to {MAX_IMAGES})</p>
        <ImageUploader images={form.images} onChange={(v) => set("images", v)} />
      </div>

      {/* Name + Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Vehicle Name <span className="text-red-400">*</span></label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Valparai Express" className={inputCls} required />
        </div>
        <div>
          <label className={labelCls}>Vehicle Type</label>
          <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputCls}>
            {VEHICLE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Plate + Seats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Plate Number</label>
          <input value={form.plateNumber} onChange={(e) => set("plateNumber", e.target.value)}
            placeholder="TN-01-AB-1234" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Total Seats</label>
          <input type="number" min="1" value={form.totalSeats} onChange={(e) => set("totalSeats", e.target.value)}
            placeholder="45" className={inputCls} />
        </div>
      </div>

      {/* Booked Date */}
      <div>
        <label className={labelCls}>Booking Date</label>
        <DatePickerField value={form.bookedDate} onChange={(v) => set("bookedDate", v)} showHint={false} />
      </div>

      {/* Advance + Total Amount */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Advance Amount (₹)</label>
          <input type="number" min="0" value={form.advanceAmount} onChange={(e) => set("advanceAmount", e.target.value)}
            placeholder="0" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Total Amount (₹)</label>
          <input type="number" min="0" value={form.totalAmount} onChange={(e) => set("totalAmount", e.target.value)}
            placeholder="0" className={inputCls} />
        </div>
      </div>

      {/* Trip Date Range */}
      <div>
        <label className={labelCls}>Trip Date Range</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] text-slate-500 mb-1">Start Date</p>
            <DatePickerField value={form.tripStartDate} onChange={(v) => set("tripStartDate", v)}
              max={form.tripEndDate || undefined} showHint={false} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 mb-1">End Date</p>
            <DatePickerField value={form.tripEndDate} onChange={(v) => set("tripEndDate", v)}
              min={form.tripStartDate || undefined} showHint={false} />
          </div>
        </div>
        {duration && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-950/30 border border-emerald-800/30">
            <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-emerald-400">
              Trip Duration: <span className="font-semibold">{duration}</span>
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={saving || !form.name.trim()}
          className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Saving…
            </>
          ) : (
            initial ? "Save Changes" : "Add Vehicle"
          )}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold text-sm transition-colors">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── EditModal ──────────────────────────────────────────────────────────────── */
function EditModal({ vehicle, tripId, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleSave = async (form) => {
    setSaving(true);
    setError("");
    try {
      await updateVehicle(tripId, vehicle._id, {
        ...form,
        totalSeats:    Number(form.totalSeats)    || vehicle.totalSeats,
        advanceAmount: Number(form.advanceAmount) || 0,
        totalAmount:   Number(form.totalAmount)   || 0,
        bookedDate:    form.bookedDate    || undefined,
        tripStartDate: form.tripStartDate || undefined,
        tripEndDate:   form.tripEndDate   || undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update vehicle.");
    } finally {
      setSaving(false);
    }
  };

  const toDateInput = (iso) => (iso ? iso.substring(0, 10) : "");

  const initial = {
    name:          vehicle.name          || "",
    type:          vehicle.type          || "bus",
    plateNumber:   vehicle.plateNumber   || "",
    totalSeats:    vehicle.totalSeats    || "",
    images:        vehicle.images        || [],
    bookedDate:    toDateInput(vehicle.bookedDate),
    advanceAmount: vehicle.advanceAmount || "",
    totalAmount:   vehicle.totalAmount   || "",
    tripStartDate: toDateInput(vehicle.tripStartDate),
    tripEndDate:   toDateInput(vehicle.tripEndDate),
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70 backdrop-blur-sm px-4 py-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto">
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <p className="font-bold text-white">Edit Vehicle</p>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors">
            ×
          </button>
        </div>
        <div className="p-5">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-950/50 border border-red-800/50">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <VehicleForm initial={initial} onSave={handleSave} onCancel={onClose} saving={saving} />
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── ImageFullscreenModal ───────────────────────────────────────────────────── */
function ImageFullscreenModal({ images, initialIndex = 0, onClose }) {
  const [idx, setIdx] = useState(initialIndex);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft"  && idx > 0)               setIdx((p) => p - 1);
      if (e.key === "ArrowRight" && idx < images.length - 1) setIdx((p) => p + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, images.length, onClose]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = images[idx];
    a.download = `vehicle-photo-${idx + 1}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return createPortal(
    <div className="fixed inset-0 z-[500] bg-black flex flex-col animate-lightbox-in" onClick={onClose}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className={`text-sm text-white/60 font-medium tabular-nums ${images.length <= 1 ? "invisible" : ""}`}>
          {idx + 1} / {images.length}
        </span>
        <button type="button" onClick={onClose}
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-red-500 text-white flex items-center justify-center transition-all text-2xl font-light leading-none">
          ×
        </button>
      </div>

      {/* Image area */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden px-14 min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          key={idx}
          src={images[idx]}
          alt=""
          className="max-w-full max-h-full object-contain select-none animate-fade-in"
        />
        {idx > 0 && (
          <button type="button" onClick={() => setIdx((p) => p - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white text-3xl flex items-center justify-center transition-colors">
            ‹
          </button>
        )}
        {idx < images.length - 1 && (
          <button type="button" onClick={() => setIdx((p) => p + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white text-3xl flex items-center justify-center transition-colors">
            ›
          </button>
        )}
      </div>

      {/* Dot nav */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 pt-3 pb-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {images.map((_, i) => (
            <button key={i} type="button" onClick={() => setIdx(i)}
              className={`rounded-full transition-all ${i === idx ? "bg-white w-5 h-2" : "bg-white/30 hover:bg-white/60 w-2 h-2"}`} />
          ))}
        </div>
      )}

      {/* Bottom action bar */}
      <div className="shrink-0 flex items-center justify-center gap-3 px-4 pb-8 pt-4" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={handleDownload}
          className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-sm transition-all shadow-xl shadow-emerald-900/40 min-w-[150px] justify-center">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
        <button type="button" onClick={onClose}
          className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-red-600/70 hover:bg-red-600 active:scale-95 text-white font-semibold text-sm transition-all shadow-xl min-w-[120px] justify-center">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Close
        </button>
      </div>
    </div>,
    document.body
  );
}

/* ─── VehicleDetailModal ─────────────────────────────────────────────────────── */
function VehicleDetailModal({ vehicle, onClose, onEdit }) {
  const [imgIdx,     setImgIdx]     = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const imgs      = vehicle.images || [];
  const icon      = TYPE_ICON[vehicle.type] || "🚗";
  const typeLabel = VEHICLE_TYPES.find((t) => t.value === vehicle.type)?.label || vehicle.type;
  const duration  = calcDuration(vehicle.tripStartDate, vehicle.tripEndDate);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/75 backdrop-blur-sm px-4 py-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />

        {fullscreen && imgs.length > 0 && (
          <ImageFullscreenModal images={imgs} initialIndex={imgIdx} onClose={() => setFullscreen(false)} />
        )}

        {/* Image carousel */}
        {imgs.length > 0 ? (
          <div className="relative">
            {/* Fixed-height container with dark bg — no distortion */}
            <div
              className="w-full h-56 bg-slate-950 flex items-center justify-center overflow-hidden cursor-zoom-in"
              onClick={() => setFullscreen(true)}
            >
              <img src={imgs[imgIdx]} alt="" className="max-w-full max-h-56 object-contain select-none" />
            </div>
            {imgs.length > 1 && (
              <>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {imgs.map((_, i) => (
                    <button key={i} type="button" onClick={(e) => { e.stopPropagation(); setImgIdx(i); }}
                      className={`w-2 h-2 rounded-full transition-all ${i === imgIdx ? "bg-white" : "bg-white/40"}`} />
                  ))}
                </div>
                {imgIdx > 0 && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); setImgIdx((p) => p - 1); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
                    ‹
                  </button>
                )}
                {imgIdx < imgs.length - 1 && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); setImgIdx((p) => p + 1); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
                    ›
                  </button>
                )}
              </>
            )}
            {/* Type badge */}
            <div className="absolute top-2 left-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm">
                {icon} {typeLabel}
              </span>
            </div>
            {/* Top-right: download + fullscreen + close */}
            <div className="absolute top-2 right-2 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button type="button" title="Download"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = imgs[imgIdx];
                  a.download = `vehicle-photo-${imgIdx + 1}.jpg`;
                  document.body.appendChild(a); a.click(); document.body.removeChild(a);
                }}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-emerald-700/80 text-white flex items-center justify-center transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              <button type="button" title="Fullscreen" onClick={() => setFullscreen(true)}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-slate-600/80 text-white flex items-center justify-center transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              <button type="button" onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/50 hover:bg-red-700/80 text-white flex items-center justify-center transition-colors text-lg">
                ×
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{icon}</span>
              <div>
                <p className="font-bold text-white">{vehicle.name || typeLabel}</p>
                <p className="text-xs text-slate-400">{typeLabel}</p>
              </div>
            </div>
            <button type="button" onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors">
              ×
            </button>
          </div>
        )}

        <div className="p-5 space-y-4">
          {/* Name + plate + seats */}
          <div>
            {imgs.length > 0 && (
              <h3 className="font-bold text-white text-lg mb-1">{vehicle.name || typeLabel}</h3>
            )}
            <div className="flex flex-wrap gap-2 mt-1">
              {vehicle.plateNumber && (
                <span className="text-xs font-mono text-slate-300 bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg">
                  🪪 {vehicle.plateNumber}
                </span>
              )}
              {vehicle.totalSeats && (
                <span className="text-xs text-slate-300 bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg">
                  💺 {vehicle.totalSeats} Seats
                </span>
              )}
            </div>
          </div>

          {/* Booking info */}
          {(vehicle.bookedDate || vehicle.advanceAmount > 0 || vehicle.totalAmount > 0) && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2">Booking Details</p>
              <div className="grid grid-cols-3 gap-3 bg-slate-800/50 rounded-xl p-3">
                {vehicle.bookedDate && (
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wide">Booked On</p>
                    <p className="text-xs text-slate-200 font-medium mt-0.5">{fmtDate(vehicle.bookedDate)}</p>
                  </div>
                )}
                {vehicle.advanceAmount > 0 && (
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wide">Advance</p>
                    <p className="text-xs text-emerald-400 font-bold mt-0.5">{fmtINR(vehicle.advanceAmount)}</p>
                  </div>
                )}
                {vehicle.totalAmount > 0 && (
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wide">Total</p>
                    <p className="text-xs text-amber-400 font-bold mt-0.5">{fmtINR(vehicle.totalAmount)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trip date range + duration */}
          {(vehicle.tripStartDate || vehicle.tripEndDate) && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2">Trip Schedule</p>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm text-slate-200">
                    {fmtDate(vehicle.tripStartDate)}
                    {vehicle.tripEndDate && ` → ${fmtDate(vehicle.tripEndDate)}`}
                  </p>
                  {duration && (
                    <p className="text-xs text-blue-400 font-medium mt-0.5">Duration: {duration}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            {onEdit && (
              <button type="button" onClick={onEdit}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Vehicle
              </button>
            )}
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── VehicleCard ────────────────────────────────────────────────────────────── */
function VehicleCard({ vehicle, onView, onEdit }) {
  const [imgIdx,     setImgIdx]     = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const imgs     = vehicle.images || [];
  const icon     = TYPE_ICON[vehicle.type] || "🚗";
  const duration = calcDuration(vehicle.tripStartDate, vehicle.tripEndDate);
  const typeLabel = VEHICLE_TYPES.find((t) => t.value === vehicle.type)?.label || vehicle.type;

  return (
    <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl overflow-hidden">
      {/* Images */}
      {imgs.length > 0 && (
        <div className="relative">
          {fullscreen && (
            <ImageFullscreenModal images={imgs} initialIndex={imgIdx} onClose={() => setFullscreen(false)} />
          )}
          {/* object-contain — no distortion */}
          <div
            className="w-full h-44 bg-slate-950 flex items-center justify-center overflow-hidden cursor-zoom-in"
            onClick={() => setFullscreen(true)}
          >
            <img src={imgs[imgIdx]} alt="" className="max-w-full max-h-44 object-contain select-none" />
          </div>
          {imgs.length > 1 && (
            <>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {imgs.map((_, i) => (
                  <button key={i} type="button" onClick={(e) => { e.stopPropagation(); setImgIdx(i); }}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIdx ? "bg-white" : "bg-white/40"}`}
                  />
                ))}
              </div>
              {imgIdx > 0 && (
                <button type="button" onClick={(e) => { e.stopPropagation(); setImgIdx((p) => p - 1); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-sm hover:bg-black/80 transition-colors">
                  ‹
                </button>
              )}
              {imgIdx < imgs.length - 1 && (
                <button type="button" onClick={(e) => { e.stopPropagation(); setImgIdx((p) => p + 1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-sm hover:bg-black/80 transition-colors">
                  ›
                </button>
              )}
            </>
          )}
          <div className="absolute top-2 left-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm">
              {icon} {typeLabel}
            </span>
          </div>
          {/* Download + fullscreen buttons */}
          <div className="absolute top-2 right-2 flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button type="button" title="Download"
              onClick={() => {
                const a = document.createElement("a");
                a.href = imgs[imgIdx];
                a.download = `vehicle-photo-${imgIdx + 1}.jpg`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
              }}
              className="w-7 h-7 rounded-full bg-black/60 hover:bg-emerald-700/80 text-white flex items-center justify-center transition-colors">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button type="button" title="Fullscreen" onClick={() => setFullscreen(true)}
              className="w-7 h-7 rounded-full bg-black/60 hover:bg-slate-600/80 text-white flex items-center justify-center transition-colors">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {imgs.length === 0 && <span className="text-xl">{icon}</span>}
              <p className="font-bold text-white text-base truncate">{vehicle.name}</p>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {imgs.length === 0 && (
                <span className="text-[11px] text-slate-400">{typeLabel}</span>
              )}
              {vehicle.plateNumber && (
                <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {vehicle.plateNumber}
                </span>
              )}
              {vehicle.totalSeats && (
                <span className="text-[11px] text-slate-500">{vehicle.totalSeats} seats</span>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={onView}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              View
            </button>
            <button type="button" onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800/30 border border-emerald-700/40 text-emerald-400 hover:bg-emerald-800/50 text-xs font-medium transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>
        </div>

        {/* Booking info */}
        {(vehicle.bookedDate || vehicle.advanceAmount || vehicle.totalAmount) && (
          <div className="grid grid-cols-3 gap-2 bg-slate-800/50 rounded-xl p-3">
            {vehicle.bookedDate && (
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wide">Booked</p>
                <p className="text-xs text-slate-300 font-medium mt-0.5">{fmtDate(vehicle.bookedDate)}</p>
              </div>
            )}
            {vehicle.advanceAmount > 0 && (
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wide">Advance</p>
                <p className="text-xs text-emerald-400 font-semibold mt-0.5">{fmtINR(vehicle.advanceAmount)}</p>
              </div>
            )}
            {vehicle.totalAmount > 0 && (
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wide">Total</p>
                <p className="text-xs text-amber-400 font-semibold mt-0.5">{fmtINR(vehicle.totalAmount)}</p>
              </div>
            )}
          </div>
        )}

        {/* Trip range + duration */}
        {(vehicle.tripStartDate || vehicle.tripEndDate) && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-300">
                {fmtDate(vehicle.tripStartDate)}
                {vehicle.tripEndDate && ` → ${fmtDate(vehicle.tripEndDate)}`}
              </p>
              {duration && (
                <p className="text-[11px] text-blue-400 font-medium mt-0.5">Duration: {duration}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── AdminVehicles ──────────────────────────────────────────────────────────── */
export default function AdminVehicles() {
  const { selectedTripId } = useTrip();
  const [items,    setItems]    = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [toast,    setToast]    = useState(null);
  const [viewVeh,  setViewVeh]  = useState(null);
  const [editVeh,  setEditVeh]  = useState(null);
  const [showForm, setShowForm] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(() => {
    if (!selectedTripId) return;
    getVehicles(selectedTripId).then((r) => setItems(r?.data || []));
  }, [selectedTripId]);

  useEffect(() => { load(); setShowForm(false); }, [load]);

  const handleAdd = async (form) => {
    if (!form.name.trim()) { setError("Vehicle name is required."); return; }
    setSaving(true);
    setError("");
    try {
      await addVehicle(selectedTripId, {
        ...form,
        totalSeats:    Number(form.totalSeats)    || 4,
        advanceAmount: Number(form.advanceAmount) || 0,
        totalAmount:   Number(form.totalAmount)   || 0,
        bookedDate:    form.bookedDate    || undefined,
        tripStartDate: form.tripStartDate || undefined,
        tripEndDate:   form.tripEndDate   || undefined,
      });
      showToast("Vehicle added successfully.");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message || "Failed to add vehicle.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <TripModuleShell title="Vehicles" description="Bus, van, car & booking details">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium ${
          toast.type === "error"
            ? "bg-red-950 border-red-700 text-red-300"
            : "bg-emerald-950 border-emerald-700 text-emerald-300"
        }`}>
          <span>{toast.type === "error" ? "✕" : "✓"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {selectedTripId && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Vehicles ({items.length})
            </p>
            <button
              type="button"
              onClick={() => { setShowForm((p) => !p); setError(""); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/20 border border-emerald-700/40 text-emerald-400 hover:bg-emerald-700/30 text-xs font-semibold transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
              </svg>
              {showForm ? "Cancel" : "Add Vehicle"}
            </button>
          </div>

          {/* Add form */}
          {showForm && (
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-5">
              <p className="text-sm font-bold text-white mb-4">New Vehicle</p>
              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-950/50 border border-red-800/50">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              <VehicleForm onSave={handleAdd} saving={saving} />
            </div>
          )}

          {/* Vehicle list */}
          {items.length === 0 && !showForm ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-2xl">
                🚌
              </div>
              <div>
                <p className="text-slate-300 font-medium text-sm">No vehicles added yet</p>
                <p className="text-slate-500 text-xs mt-1">Add vehicles with booking and trip details.</p>
              </div>
              <button type="button" onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors">
                Add First Vehicle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((v) => (
                <VehicleCard
                  key={v._id}
                  vehicle={v}
                  onView={() => setViewVeh(v)}
                  onEdit={() => setEditVeh(v)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* View modal */}
      {viewVeh && (
        <VehicleDetailModal
          vehicle={viewVeh}
          onClose={() => setViewVeh(null)}
          onEdit={() => { setViewVeh(null); setEditVeh(viewVeh); }}
        />
      )}

      {/* Edit modal */}
      {editVeh && (
        <EditModal
          vehicle={editVeh}
          tripId={selectedTripId}
          onClose={() => setEditVeh(null)}
          onSaved={() => { load(); showToast("Vehicle updated."); }}
        />
      )}
    </TripModuleShell>
  );
}
