import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import {
  getItinerary,
  addItinerary,
  updateItinerary,
  deleteItinerary,
  reorderItinerary,
} from "../../../services/trips";
import DatePickerField from "../../../components/ui/DatePickerField";
import LocationPicker from "../../../components/location-picker/LocationPicker";
import ZoomableImage from "../../../components/ui/ZoomableImage";
import { useActionPopup } from "../../../hooks/useActionPopup";
import { useDeleteConfirm } from "../../../hooks/useDeleteConfirm";

/* ─── Time helpers ─────────────────────────────────────────────────────────── */
const parse24 = (v) => {
  if (!v) return { h12: 9, m: 0, ap: "AM" };
  const [hs = "9", ms = "0"] = v.split(":");
  const h24 = parseInt(hs, 10) || 0;
  const m   = Math.min(59, Math.max(0, parseInt(ms, 10) || 0));
  return { h12: h24 % 12 || 12, m, ap: h24 >= 12 ? "PM" : "AM" };
};
const to24str = (h12, m, ap) => {
  let h24 = (parseInt(h12, 10) || 0) % 12;
  if (ap === "PM") h24 += 12;
  const mi = Math.min(59, Math.max(0, parseInt(m, 10) || 0));
  return `${String(h24).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
};
const fmt12h = (time24) => {
  if (!time24) return "";
  const { h12, m, ap } = parse24(time24);
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
};

/* ─── Duration helpers ─────────────────────────────────────────────────────── */
const parseDuration = (str) => {
  if (!str) return { h: 0, m: 0 };
  const hM = str.match(/(\d+)\s*(?:h|hr|hrs|hour)/i);
  const mM = str.match(/(\d+)\s*(?:m|min|mins|minute)/i);
  return { h: hM ? parseInt(hM[1], 10) : 0, m: mM ? parseInt(mM[1], 10) : 0 };
};
const formatDuration = (h, m) => {
  if (!h && !m) return "";
  if (h && m) return `${h} hrs ${m} min`;
  if (h) return `${h} ${h === 1 ? "hr" : "hrs"}`;
  return `${m} min`;
};
const calcEndTime = (time24, dh, dm) => {
  if (!time24 || (!dh && !dm)) return null;
  const { h12, m, ap } = parse24(time24);
  let h24 = h12 % 12 + (ap === "PM" ? 12 : 0);
  const totalMins = h24 * 60 + m + (dh || 0) * 60 + (dm || 0);
  const endH24 = Math.floor(totalMins / 60) % 24;
  const endM   = totalMins % 60;
  const endAp  = endH24 >= 12 ? "PM" : "AM";
  const endH12 = endH24 % 12 || 12;
  return `${endH12}:${String(endM).padStart(2, "0")} ${endAp}`;
};

const inputCls =
  "w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-emerald-600/60 focus:outline-none transition-colors";

const EMPTY_FORM = {
  pointName: "", locationName: "", description: "",
  visitDate: "", visitTime: "", duration: "", notes: "",
  images: [], location: null,
  orderNo: 0, isReached: false,
};

/* ─── Image utilities ──────────────────────────────────────────────────────── */
const toBase64 = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

const compressImage = (dataUrl, maxBytes = 1.2 * 1024 * 1024) =>
  new Promise((resolve) => {
    if (dataUrl.length * 0.75 <= maxBytes) { resolve(dataUrl); return; }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale  = Math.sqrt(maxBytes / (dataUrl.length * 0.75));
      canvas.width  = Math.floor(img.width  * scale);
      canvas.height = Math.floor(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.src = dataUrl;
  });

/* ─── ClockTimeInput ───────────────────────────────────────────────────────── */
function ClockTimeInput({ value, onChange }) {
  const { h12, m, ap } = parse24(value);
  const emit  = (h, min, ampm) => onChange(to24str(h, min, ampm));
  const stepH = (d) => { let n = h12 + d; if (n > 12) n = 1; if (n < 1) n = 12; emit(n, m, ap); };
  const stepM = (d) => { let n = m + d;   if (n > 59) n = 0; if (n < 0) n = 59; emit(h12, n, ap); };
  const adj = "w-6 h-6 flex items-center justify-center text-slate-500 hover:text-emerald-400 transition-colors text-sm rounded-md hover:bg-slate-800 select-none shrink-0";
  const num = "w-8 text-center bg-transparent text-white font-bold text-base outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
  return (
    <div className="flex items-center h-11 gap-1.5 px-3 rounded-lg bg-slate-950 border border-slate-700 focus-within:border-emerald-600/60 transition-colors overflow-hidden">
      <div className="w-6 h-6 rounded-md bg-emerald-900/30 border border-emerald-700/30 flex items-center justify-center shrink-0 mr-1">
        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
        </svg>
      </div>
      <button type="button" onClick={() => stepH(-1)} className={adj} tabIndex={-1}>−</button>
      <input type="number" min={1} max={12} value={h12} onFocus={(e) => e.target.select()}
        onChange={(e) => { const n = parseInt(e.target.value, 10); if (n >= 1 && n <= 12) emit(n, m, ap); }} className={num} />
      <button type="button" onClick={() => stepH(1)} className={adj} tabIndex={-1}>+</button>
      <span className="text-emerald-400/60 font-bold text-base leading-none select-none mx-0.5">:</span>
      <button type="button" onClick={() => stepM(-5)} className={adj} tabIndex={-1}>−</button>
      <input type="number" min={0} max={59} value={String(m).padStart(2, "0")} onFocus={(e) => e.target.select()}
        onChange={(e) => { const n = parseInt(e.target.value, 10); if (n >= 0 && n <= 59) emit(h12, n, ap); }} className={num} />
      <button type="button" onClick={() => stepM(5)} className={adj} tabIndex={-1}>+</button>
      <div className="flex-1 min-w-0" />
      <div className="flex rounded-md overflow-hidden border border-slate-700 shrink-0">
        {["AM", "PM"].map((opt) => (
          <button key={opt} type="button" onClick={() => emit(h12, m, opt)}
            className={`px-2.5 py-1 text-[11px] font-bold border-r last:border-r-0 border-slate-700 transition-colors ${
              ap === opt
                ? opt === "AM" ? "bg-amber-500 text-white" : "bg-indigo-500 text-white"
                : "bg-slate-900 text-slate-500 hover:text-slate-200 hover:bg-slate-800"
            }`}>{opt}</button>
        ))}
      </div>
    </div>
  );
}

/* ─── FormSection ──────────────────────────────────────────────────────────── */
function FormSection({ icon, label, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-base leading-none">{icon}</span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
        <div className="flex-1 h-px bg-slate-800" />
      </div>
      {children}
    </div>
  );
}

/* ─── MultiImageUpload ─────────────────────────────────────────────────────── */
function MultiImageUpload({ images, onChange, onPreview }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const handleFiles = async (files) => {
    if (!files.length) return;
    setBusy(true);
    try {
      const compressed = await Promise.all(Array.from(files).map(async (f) => compressImage(await toBase64(f))));
      onChange([...images, ...compressed]);
    } finally { setBusy(false); }
  };
  const remove = (idx) => onChange(images.filter((_, i) => i !== idx));
  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((src, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-950 aspect-square">
              <button type="button" onClick={() => onPreview?.(src)} className="w-full h-full cursor-zoom-in">
                <ZoomableImage src={src} alt={`img-${idx}`} className="w-full h-full object-cover" />
              </button>
              <button type="button" onClick={() => remove(idx)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/90 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">×</button>
            </div>
          ))}
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-600/60 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-emerald-400 transition-colors disabled:opacity-40">
            <span className="text-lg">+</span><span className="text-[10px]">Add</span>
          </button>
        </div>
      )}
      {images.length === 0 && (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
          className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-600/60 text-slate-500 hover:text-emerald-400 transition-colors disabled:opacity-50">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-medium">{busy ? "Processing…" : "Click to upload photos"}</span>
          <span className="text-[10px] text-slate-600">JPG, PNG · Multiple allowed</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
    </div>
  );
}

/* ─── ImagePreview ─────────────────────────────────────────────────────────── */
function ImagePreview({ src, onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <ZoomableImage src={src} alt="Preview" className="w-full rounded-2xl shadow-2xl border border-slate-700" />
        <button type="button" onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600/80 transition-colors">×</button>
      </div>
    </div>,
    document.body
  );
}

/* ─── LocationCard ─────────────────────────────────────────────────────────── */
function LocationCard({ value, onChange }) {
  const [open, setOpen] = useState(!!value);
  return (
    <div className={`rounded-xl overflow-hidden border transition-all duration-200 ${open ? "border-emerald-700/40" : "border-slate-700/50"}`}>
      <button type="button" onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${open ? "bg-emerald-950/40" : "bg-slate-800/50 hover:bg-slate-800"}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${open ? "bg-emerald-500/20 shadow-[0_0_14px_rgba(16,185,129,0.25)]" : "bg-slate-700/80"}`}>
          <svg className={`w-5 h-5 transition-colors ${open ? "text-emerald-400" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">{value?.name ? "Location Pinned" : "Pin on Map"}</p>
          <p className="text-xs text-slate-400 truncate mt-0.5">{value?.name ? value.name.split(",").slice(0, 2).join(",") : "Search or click on the map to drop a pin"}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {value && <span className="text-[10px] font-semibold text-emerald-400 border border-emerald-700/40 bg-emerald-900/20 px-2 py-0.5 rounded-full">Pinned ✓</span>}
          <svg className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {open && (
        <div className="border-t border-emerald-700/20">
          {value && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-900/10 border-b border-emerald-700/20">
              <span className="text-emerald-400 text-sm shrink-0">📍</span>
              <p className="text-xs text-emerald-300 flex-1 truncate min-w-0">{value.name}</p>
              <p className="text-[11px] text-slate-500 font-mono shrink-0">{value.lat?.toFixed(4)}, {value.lng?.toFixed(4)}</p>
              <button type="button" onClick={() => onChange(null)}
                className="text-[11px] text-slate-500 hover:text-red-400 transition-colors ml-1 shrink-0">Clear</button>
            </div>
          )}
          <div className="p-3 bg-slate-950/40"><LocationPicker value={value} onChange={onChange} /></div>
        </div>
      )}
    </div>
  );
}

/* ─── SatelliteMapView — read-only Leaflet with Esri satellite tiles ────────── */
function SatelliteMapView({ lat, lng, name }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!lat || !lng || !containerRef.current) return;
    let mapInstance = null;

    import("leaflet").then((L) => {
      if (!containerRef.current) return;

      // Leaflet CSS guard
      if (!document.getElementById("leaflet-css-sat")) {
        const link = document.createElement("link");
        link.id   = "leaflet-css-sat";
        link.rel  = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      mapInstance = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        attributionControl: false,
        keyboard: false,
        boxZoom: false,
        touchZoom: false,
      });

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 20 }
      ).addTo(mapInstance);

      // Labels overlay
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 20, opacity: 0.7 }
      ).addTo(mapInstance);

      const icon = L.divIcon({
        html: `<div style="width:14px;height:14px;background:#10b981;border:2.5px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(16,185,129,0.35);"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7], className: "",
      });
      L.marker([lat, lng], { icon, interactive: false }).addTo(mapInstance);
    });

    return () => {
      if (mapInstance) { mapInstance.remove(); mapInstance = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  return (
    <div className="rounded-xl overflow-hidden border border-emerald-700/30 relative">
      <div ref={containerRef} className="w-full h-44" />
      {/* Corner label */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1 pointer-events-none">
        <span className="text-emerald-400 text-[10px]">🛰</span>
        <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wide">Satellite View</span>
      </div>
      {name && (
        <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1.5 pointer-events-none">
          <p className="text-xs text-white/80 truncate">📍 {name}</p>
        </div>
      )}
    </div>
  );
}

/* ─── ItineraryFormModal ───────────────────────────────────────────────────── */
function ItineraryFormModal({ initial, onClose, onSave }) {
  const initDur = parseDuration(initial?.duration || "");
  const [form,       setForm]      = useState(initial || EMPTY_FORM);
  const [durH,       setDurH]      = useState(initDur.h);
  const [durM,       setDurM]      = useState(initDur.m);
  const [saving,     setSaving]    = useState(false);
  const [error,      setError]     = useState("");
  const [previewImg, setPreviewImg] = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => { set("duration", formatDuration(durH, durM)); }, [durH, durM]); // eslint-disable-line

  const endTime = useMemo(() => calcEndTime(form.visitTime, durH, durM), [form.visitTime, durH, durM]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.pointName.trim()) { setError("Point name is required."); return; }
    setSaving(true); setError("");
    try { await onSave(form); onClose(); }
    catch (err) { setError(err.message || "Failed to save."); }
    finally { setSaving(false); }
  };

  const durAdj = "w-6 h-6 flex items-center justify-center text-slate-500 hover:text-emerald-400 transition-colors text-sm rounded-md hover:bg-slate-800 select-none shrink-0";
  const durNum = "w-10 text-center bg-transparent text-white font-bold text-base outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/75 backdrop-blur-sm px-4 py-6 overflow-y-auto">
      {previewImg && <ImagePreview src={previewImg} onClose={() => setPreviewImg(null)} />}
      <div className="bg-[#0d1117] border border-slate-700/50 rounded-2xl w-full max-w-[560px] shadow-[0_25px_60px_rgba(0,0,0,0.6)] overflow-hidden my-auto">
        <div className="h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-900/40 border border-emerald-700/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-white text-sm">{initial ? "Edit Itinerary Point" : "Add Itinerary Point"}</p>
              <p className="text-[11px] text-slate-500">Fill in the stop details below</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-950/40 border border-red-800/50">
              <span className="text-red-400 text-sm shrink-0">⚠</span>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* ── BASIC INFO ── */}
          <FormSection icon="📌" label="Basic Info">
            {/* Order No + Reached row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Stop No.</label>
                <input
                  type="number" min={0}
                  value={form.orderNo ?? 0}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => set("orderNo", parseInt(e.target.value, 10) || 0)}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Reached?</label>
                <button
                  type="button"
                  onClick={() => set("isReached", !form.isReached)}
                  className={`w-full h-[38px] rounded-lg border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    form.isReached
                      ? "bg-emerald-900/30 border-emerald-500/60 text-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.35)]"
                      : "bg-slate-950 border-slate-700 text-slate-500 hover:border-slate-600"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    form.isReached ? "bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]" : "border-slate-600"
                  }`}>
                    {form.isReached && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  {form.isReached ? "Reached ✓" : "Not Reached"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Point Name <span className="text-red-400">*</span>
              </label>
              <input value={form.pointName} onChange={(e) => set("pointName", e.target.value)}
                className={inputCls} placeholder="e.g. Eiffel Tower Visit" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Location Name</label>
              <input value={form.locationName} onChange={(e) => set("locationName", e.target.value)}
                className={inputCls} placeholder="e.g. Champ de Mars, Paris" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                className={inputCls} rows={2} placeholder="Brief description of the visit" />
            </div>
          </FormSection>

          {/* ── SCHEDULE ── */}
          <FormSection icon="🗓️" label="Schedule">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Visit Date</label>
              <DatePickerField value={form.visitDate} onChange={(v) => set("visitDate", v)} showHint={false} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Visit Time</label>
              <ClockTimeInput value={form.visitTime || "09:00"} onChange={(v) => set("visitTime", v)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Duration</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center h-11 gap-1 px-3 rounded-lg bg-slate-950 border border-slate-700 focus-within:border-emerald-600/60 transition-colors">
                  <button type="button" onClick={() => setDurH((v) => Math.max(0, v - 1))} className={durAdj} tabIndex={-1}>−</button>
                  <input type="number" min={0} max={23} value={durH} onFocus={(e) => e.target.select()}
                    onChange={(e) => { const n = parseInt(e.target.value, 10); if (!isNaN(n)) setDurH(Math.min(23, Math.max(0, n))); }} className={durNum} />
                  <button type="button" onClick={() => setDurH((v) => Math.min(23, v + 1))} className={durAdj} tabIndex={-1}>+</button>
                </div>
                <span className="text-slate-500 text-xs font-medium shrink-0">hrs</span>
                <div className="flex items-center h-11 gap-1 px-3 rounded-lg bg-slate-950 border border-slate-700 focus-within:border-emerald-600/60 transition-colors">
                  <button type="button" onClick={() => setDurM((v) => v <= 0 ? 55 : v - 5)} className={durAdj} tabIndex={-1}>−</button>
                  <input type="number" min={0} max={59} value={String(durM).padStart(2, "0")} onFocus={(e) => e.target.select()}
                    onChange={(e) => { const n = parseInt(e.target.value, 10); if (!isNaN(n)) setDurM(Math.min(59, Math.max(0, n))); }} className={durNum} />
                  <button type="button" onClick={() => setDurM((v) => v >= 55 ? 0 : v + 5)} className={durAdj} tabIndex={-1}>+</button>
                </div>
                <span className="text-slate-500 text-xs font-medium shrink-0">min</span>
                {endTime && (
                  <div className="ml-auto flex items-center gap-2.5 px-4 py-2 h-11 rounded-lg bg-teal-900/20 border border-teal-700/30 shrink-0">
                    <svg className="w-3.5 h-3.5 text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-[9px] text-teal-500 uppercase tracking-widest leading-none mb-0.5">Ends at</p>
                      <p className="text-sm font-bold text-teal-300 leading-none">{endTime}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </FormSection>

          {/* ── NOTES ── */}
          <FormSection icon="📝" label="Notes">
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
              className={inputCls} rows={2} placeholder="Special instructions, things to carry, dress code…" />
          </FormSection>

          {/* ── PHOTOS ── */}
          <FormSection icon="📷" label="Photos">
            <MultiImageUpload images={form.images} onChange={(v) => set("images", v)} onPreview={setPreviewImg} />
          </FormSection>

          {/* ── MAP LOCATION ── */}
          <FormSection icon="🗺️" label="Map Location">
            <LocationCard value={form.location} onChange={(v) => set("location", v)} />
          </FormSection>

          <div className="flex gap-3 pt-2 border-t border-slate-800">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-[0_4px_14px_rgba(16,185,129,0.25)]">
              {saving ? "Saving…" : initial ? "Save Changes" : "Add Itinerary Point"}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold text-sm transition-colors border border-slate-700">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/* ─── ItineraryCard ────────────────────────────────────────────────────────── */
function ItineraryCard({ item, onEdit, onDelete, onPreview }) {
  const [expanded, setExpanded] = useState(false);
  const reached = !!item.isReached;
  const hasDetail = item.description || item.notes || item.location?.lat != null;

  const endTime = useMemo(() => {
    if (!item.visitTime || !item.duration) return null;
    const { h, m } = parseDuration(item.duration);
    return calcEndTime(item.visitTime, h, m);
  }, [item.visitTime, item.duration]);

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
      reached
        ? "border-emerald-600/50 shadow-[0_0_20px_rgba(16,185,129,0.15),0_2px_12px_rgba(0,0,0,0.4)] bg-emerald-950/10"
        : "border-slate-800 bg-slate-900/80 shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
    }`}>

      {/* Card header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        {/* Stop number badge */}
        <div className={`shrink-0 self-start w-10 h-10 rounded-xl flex flex-col items-center justify-center border font-black text-sm transition-all ${
          reached
            ? "bg-emerald-900/40 border-emerald-600/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
            : "bg-slate-800 border-slate-700 text-slate-400"
        }`}>
          <span className="text-[10px] font-bold leading-none opacity-60">#</span>
          <span className="leading-none">{item.orderNo ?? 0}</span>
        </div>

        {/* Content column — 2 rows: [name + buttons] then [glow chips] */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">

          {/* Row 1 — name / location + action buttons (buttons self-stretch to match left height) */}
          <div className="flex items-stretch gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`font-bold text-base leading-tight ${reached ? "line-through text-slate-400" : "text-white"}`}>
                  {item.pointName}
                </p>
                {reached && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-600/50 text-emerald-400 shrink-0">
                    ✓ Reached
                  </span>
                )}
              </div>
              {item.locationName && (
                <p className="text-xs text-slate-500 mt-1 truncate">📍 {item.locationName}</p>
              )}
            </div>
            {/* Action buttons — self-stretch so height = left-side name+location area */}
            <div className="shrink-0 flex gap-1 self-stretch items-center">
              <button type="button" onClick={onEdit}
                className="w-9 self-stretch rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-emerald-400 flex items-center justify-center transition-colors text-sm" title="Edit">
                ✏️
              </button>
              <button type="button" onClick={onDelete}
                className="w-9 self-stretch rounded-lg bg-slate-800 hover:bg-red-900/40 border border-slate-700 hover:border-red-700/50 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors text-sm" title="Delete">
                🗑️
              </button>
            </div>
          </div>

          {/* Row 2 — glow chips, right-aligned, flex-wrap so they stack on mobile */}
          {(item.visitDate || item.visitTime || item.duration) && (
            <div className="flex items-end gap-2 flex-wrap justify-end">
              {item.visitDate && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-blue-500/70">Date</span>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/20 border border-blue-600/40 shadow-[0_0_10px_rgba(59,130,246,0.25)]">
                    <svg className="w-3 h-3 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    <span className="text-[11px] font-semibold text-blue-300 tabular-nums whitespace-nowrap">
                      {new Date(item.visitDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              )}
              {item.visitTime && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/70">Start Time</span>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/20 border border-emerald-600/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                    <svg className="w-3 h-3 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 7v5l3 3" />
                    </svg>
                    <span className="text-[11px] font-semibold text-emerald-300 tabular-nums">{fmt12h(item.visitTime)}</span>
                  </div>
                </div>
              )}
              {item.duration && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500/80">Duration</span>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-600/60 shadow-[0_0_8px_rgba(0,0,0,0.3)]">
                    <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 7v5" />
                    </svg>
                    <span className="text-[11px] font-semibold text-slate-300 tabular-nums">{item.duration}</span>
                  </div>
                </div>
              )}
              {endTime && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-teal-500/70">End Time</span>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-900/20 border border-teal-600/40 shadow-[0_0_10px_rgba(20,184,166,0.25)]">
                    <svg className="w-3 h-3 text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 9l3 3-3 3m3-3H8" />
                    </svg>
                    <span className="text-[11px] font-semibold text-teal-300 tabular-nums">{endTime}</span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Photos strip */}
      {item.images?.length > 0 && (
        <div className="border-t border-slate-800/60 pt-2.5 pb-3 pl-4 pr-2">
          {/* Label */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">📸 Photos</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
              {item.images.length}
            </span>
          </div>
          {/* Thumbnails */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {item.images.slice(0, 6).map((src, i) => (
              <button key={i} type="button" onClick={() => onPreview(src)}
                className="shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 cursor-zoom-in hover:border-emerald-600/60 transition-colors shadow-[0_0_8px_rgba(16,185,129,0.12)]">
                <ZoomableImage src={src} alt={`photo-${i}`} className="w-full h-full object-cover" />
              </button>
            ))}
            {item.images.length > 6 && (
              <div className="shrink-0 w-14 h-14 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                <span className="text-[11px] text-slate-500 font-bold">+{item.images.length - 6}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expand toggle */}
      {hasDetail && (
        <button type="button" onClick={() => setExpanded((v) => !v)}
          className={`w-full flex items-center justify-between px-4 py-2.5 border-t text-xs transition-colors ${
            reached
              ? "border-emerald-800/30 text-emerald-600 hover:text-emerald-400 hover:bg-emerald-900/10"
              : "border-slate-800 text-slate-600 hover:text-slate-400 hover:bg-slate-800/50"
          }`}>
          <span className="font-medium">{expanded ? "Hide details" : "Show details & map"}</span>
          <svg className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className={`px-4 pb-4 pt-3 space-y-3 border-t ${reached ? "border-emerald-800/20" : "border-slate-800/50"}`}>
          {item.description && (
            <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
          )}
          {item.notes && (
            <div className="px-3 py-2.5 rounded-xl bg-amber-900/10 border border-amber-700/20">
              <p className="text-[10px] text-amber-400 uppercase tracking-wide font-bold mb-1">Notes</p>
              <p className="text-xs text-slate-300">{item.notes}</p>
            </div>
          )}

          {/* Satellite map */}
          {item.location?.lat != null && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Location</p>
              <SatelliteMapView lat={item.location.lat} lng={item.location.lng} name={item.location.name} />
              <div className="flex items-center gap-3 mt-2">
                <p className="text-[10px] text-slate-600 font-mono flex-1">
                  {item.location.lat.toFixed(5)}, {item.location.lng.toFixed(5)}
                </p>
                {item.location?.url && (
                  <a href={item.location.url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                    Open Maps ↗
                  </a>
                )}
              </div>
            </div>
          )}
          {/* location without lat (only URL) */}
          {!item.location?.lat && item.location?.url && (
            <a href={item.location.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              📍 View on Google Maps ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── AdminItinerary ───────────────────────────────────────────────────────── */
export default function AdminItinerary() {
  const { selectedTripId } = useTrip();
  const { popup, showSuccess, showError } = useActionPopup("itinerary");
  const { confirmModal, ask } = useDeleteConfirm();
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [previewImg, setPreviewImg] = useState(null);

  const load = useCallback(async () => {
    if (!selectedTripId) return;
    setLoading(true);
    try {
      const r = await getItinerary(selectedTripId);
      const sorted = (r?.data || []).slice().sort((a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0));
      setItems(sorted);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [selectedTripId]);

  useEffect(() => {
    if (!selectedTripId) { setItems([]); return; }
    load();
  }, [selectedTripId, load]);

  const handleAdd = async (form) => {
    await addItinerary(selectedTripId, form);
    load();
    showSuccess("Itinerary point added.");
  };

  const handleEdit = async (form) => {
    await updateItinerary(selectedTripId, editItem._id, form);
    setEditItem(null);
    load();
    showSuccess("Itinerary point updated.");
  };

  const handleDelete = async (item) => {
    const confirmed = await ask(`Delete "${item.pointName}"?`);
    if (!confirmed) return;
    try {
      await deleteItinerary(selectedTripId, item._id);
      load();
      showSuccess("Itinerary point deleted.");
    } catch (e) { showError(e.message || "Delete failed."); }
  };

  const reachedCount = items.filter((i) => i.isReached).length;

  return (
    <TripModuleShell title="Itinerary" description="Trip route stops sorted by order number" loading={loading && !!selectedTripId}>
      {popup}
      {confirmModal}
      {previewImg && <ImagePreview src={previewImg} onClose={() => setPreviewImg(null)} />}
      {showForm && <ItineraryFormModal onClose={() => setShowForm(false)} onSave={handleAdd} />}
      {editItem && (
        <ItineraryFormModal
          initial={{ ...editItem, visitDate: editItem.visitDate ? editItem.visitDate.slice(0, 10) : "" }}
          onClose={() => setEditItem(null)}
          onSave={handleEdit}
        />
      )}

      {selectedTripId && (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
            {/* Progress summary */}
            {items.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-xs text-slate-400">{items.length} stops</span>
                  {reachedCount > 0 && (
                    <>
                      <span className="w-px h-3 bg-slate-700" />
                      <span className="text-xs text-emerald-400 font-semibold">{reachedCount} reached</span>
                    </>
                  )}
                </div>
                {items.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${(reachedCount / items.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500">{Math.round((reachedCount / items.length) * 100)}%</span>
                  </div>
                )}
              </div>
            )}

            <button type="button" onClick={() => setShowForm(true)}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium transition-all shadow-[0_4px_14px_rgba(16,185,129,0.2)]">
              + Add Itinerary Point
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <p className="text-5xl mb-4">🗺️</p>
              <p className="text-base font-semibold text-slate-400 mb-1">No itinerary points yet</p>
              <p className="text-sm">Add the first stop to start building your route!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <ItineraryCard
                  key={item._id}
                  item={item}
                  onEdit={() => setEditItem(item)}
                  onDelete={() => handleDelete(item)}
                  onPreview={setPreviewImg}
                />
              ))}
            </div>
          )}
        </>
      )}
    </TripModuleShell>
  );
}
