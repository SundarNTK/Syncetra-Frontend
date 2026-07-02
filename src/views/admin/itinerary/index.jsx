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
import { useOnlineReload } from "../../../hooks/useOnlineReload";
import { deletePendingItem, updatePendingItem } from "../../../utils/offlinePendingOps";
import { groupItineraryByDay } from "../../../utils/itineraryDays";

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

/* ─── Keyframes (injected once) ─────────────────────────────────────────────── */
const ITIN_KF = `
@keyframes itinFadeUpCard   { from{opacity:0;transform:translateY(16px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes itinDayContentIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
@keyframes itinTabGlow      { 0%,100%{box-shadow:0 8px 20px -4px rgba(16,185,129,0.45)} 50%{box-shadow:0 10px 30px -2px rgba(16,185,129,0.7)} }
@keyframes itinTabGlowAmber { 0%,100%{box-shadow:0 8px 20px -4px rgba(245,158,11,0.45)} 50%{box-shadow:0 10px 30px -2px rgba(245,158,11,0.7)} }
@keyframes itinShimmerSweep { 0%{transform:translateX(-120%)} 100%{transform:translateX(280%)} }
@keyframes itinReachedPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
@keyframes itinTravelDot    { 0%{top:-4%;opacity:0} 14%{opacity:1} 86%{opacity:1} 100%{top:100%;opacity:0} }
.itin-card-enter      { animation: itinFadeUpCard 0.5s cubic-bezier(0.22,1,0.36,1) both; }
.itin-day-enter        { animation: itinDayContentIn 0.35s ease-out both; }
.itin-tab-glow         { animation: itinTabGlow 2.4s ease-in-out infinite; }
.itin-tab-glow-amber   { animation: itinTabGlowAmber 2.4s ease-in-out infinite; }
.itin-shimmer          { animation: itinShimmerSweep 2s ease-in-out infinite; }
.itin-reached-pulse    { animation: itinReachedPulse 1.6s ease-in-out infinite; }
.itin-dash-track       { background-image: repeating-linear-gradient(to bottom, #475569 0, #475569 5px, transparent 5px, transparent 11px); }
.itin-travel-dot       { animation: itinTravelDot 1.5s ease-in-out infinite; }
@keyframes itinTabPopIn { 0%{opacity:0;transform:translateY(10px) scale(0.88)} 60%{opacity:1;transform:translateY(-3px) scale(1.05)} 100%{opacity:1;transform:translateY(0) scale(1)} }
.itin-tab-pop           { animation: itinTabPopIn 0.5s cubic-bezier(0.22,1.2,0.36,1) both; }
`;

/* ─── PathConnector — destination-progress line between stops ───────────────── */
function PathConnector({ reached }) {
  return (
    <div className="relative w-9 flex-1 min-h-[20px] flex justify-center mt-1">
      <div className="relative w-[3px] h-full rounded-full bg-slate-800/80 overflow-hidden">
        {reached ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500 via-emerald-400 to-teal-400 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            <div className="itin-travel-dot absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_3px_rgba(16,185,129,0.75)]" />
          </>
        ) : (
          <div className="absolute inset-0 itin-dash-track" />
        )}
      </div>
    </div>
  );
}

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
function SatelliteMapView({ lat, lng, name, compact = false }) {
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
      <div ref={containerRef} className={`w-full ${compact ? "h-24" : "h-44"}`} />
      {/* Corner label */}
      {!compact && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1 pointer-events-none">
          <span className="text-emerald-400 text-[10px]">🛰</span>
          <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wide">Satellite View</span>
        </div>
      )}
      {name && (
        <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1.5 pointer-events-none">
          <p className="text-xs text-white/80 truncate">📍 {name}</p>
        </div>
      )}
    </div>
  );
}

/* ─── ItineraryFormModal ───────────────────────────────────────────────────── */
function ItineraryFormModal({ initial, defaultVisitDate, onClose, onSave }) {
  const initDur = parseDuration(initial?.duration || "");
  const [form,       setForm]      = useState(initial || { ...EMPTY_FORM, visitDate: defaultVisitDate || "" });
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

/* ─── ItineraryViewModal ───────────────────────────────────────────────────── */
function ItineraryViewModal({ item, onClose, onPreview }) {
  const reached = !!item.isReached;

  const endTime = useMemo(() => {
    if (!item.visitTime || !item.duration) return null;
    const { h, m } = parseDuration(item.duration);
    return calcEndTime(item.visitTime, h, m);
  }, [item.visitTime, item.duration]);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/75 backdrop-blur-sm px-4 py-6 overflow-y-auto" onClick={onClose}>
      <div className="bg-[#0d1117] border border-slate-700/50 rounded-2xl w-full max-w-[560px] shadow-[0_25px_60px_rgba(0,0,0,0.6)] overflow-hidden my-auto" onClick={(e) => e.stopPropagation()}>
        <div className={`h-[3px] ${reached ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" : "bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600"}`} />

        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-slate-800/80">
          <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm shrink-0 ${
            reached ? "bg-emerald-600/20 border-emerald-500/60 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                    : "bg-slate-800/80 border-slate-600 text-slate-300"
          }`}>
            {item.orderNo ?? 0}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-bold text-lg leading-tight ${reached ? "line-through text-slate-400" : "text-white"}`}>{item.pointName}</p>
            {item.locationName && <p className="text-xs text-slate-500 mt-0.5 truncate">📍 {item.locationName}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {reached && (
              <span className="text-sm font-bold px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-600/50 text-emerald-400">✓ Reached</span>
            )}
            <button type="button" onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">×</button>
          </div>
        </div>

        {/* Glow chips */}
        {(item.visitDate || item.visitTime || item.duration || endTime) && (
          <div className="px-5 py-4 border-b border-slate-800/60">
            <div className="flex items-end gap-2 flex-wrap">
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
          </div>
        )}

        {/* Description & Notes */}
        {(item.description || item.notes) && (
          <div className="px-5 py-4 space-y-3 border-b border-slate-800/60">
            {item.description && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Description</p>
                <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
              </div>
            )}
            {item.notes && (
              <div className="px-3 py-2.5 rounded-xl bg-amber-900/10 border border-amber-700/20">
                <p className="text-[10px] text-amber-400 uppercase tracking-wide font-bold mb-1">Notes</p>
                <p className="text-xs text-slate-300">{item.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Photos */}
        {item.images?.length > 0 && (
          <div className="px-5 py-4 border-b border-slate-800/60">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">📸 Photos</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">{item.images.length}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {item.images.map((src, i) => (
                <button key={i} type="button" onClick={() => onPreview?.(src)}
                  className="aspect-square rounded-xl overflow-hidden border border-slate-700 bg-slate-950 cursor-zoom-in hover:border-emerald-600/60 transition-colors">
                  <ZoomableImage src={src} alt={`photo-${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Map */}
        {item.location?.lat != null && (
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Location</p>
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
        {!item.location?.lat && item.location?.url && (
          <div className="px-5 py-4">
            <a href={item.location.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              📍 View on Google Maps ↗
            </a>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ─── MetaPill — compact icon+text chip used in the dense card meta row ─────── */
function MetaPill({ icon, text, tone }) {
  const tones = {
    blue:    "bg-blue-900/20 border-blue-700/40 text-blue-300",
    emerald: "bg-emerald-900/20 border-emerald-700/40 text-emerald-300",
    slate:   "bg-slate-800/70 border-slate-600/50 text-slate-300",
    teal:    "bg-teal-900/20 border-teal-700/40 text-teal-300",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold tabular-nums whitespace-nowrap ${tones[tone]}`}>
      <span className="text-[10px] leading-none">{icon}</span>{text}
    </span>
  );
}

/* ─── ItineraryCard — compact, always-expanded ───────────────────────────────── */
function ItineraryCard({ item, index, total, onView, onEdit, onDelete, onPreview }) {
  const reached = !!item.isReached;

  const endTime = useMemo(() => {
    if (!item.visitTime || !item.duration) return null;
    const { h, m } = parseDuration(item.duration);
    return calcEndTime(item.visitTime, h, m);
  }, [item.visitTime, item.duration]);

  return (
    <div className="relative flex gap-3 itin-card-enter" style={{ animationDelay: `${Math.min(index, 10) * 70}ms` }}>

      {/* ── LEFT — timeline progress bar ── */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-[11px] shrink-0 transition-all duration-300 hover:scale-110 ${
          reached
            ? "bg-emerald-600/20 border-emerald-500/60 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.35)]"
            : "bg-slate-800/80 border-slate-600 text-slate-400"
        }`}>
          {item.orderNo ?? 0}
        </div>
        {index < total - 1 && <PathConnector reached={reached} />}
      </div>

      {/* ── RIGHT — card ── */}
      <div className="flex-1 min-w-0 pb-2.5">
        <div className={`flex items-start gap-2.5 rounded-xl border p-2.5 transition-all duration-300 hover:-translate-y-0.5 ${
          reached
            ? "border-emerald-600/50 shadow-[0_0_14px_rgba(16,185,129,0.12)] bg-emerald-950/10"
            : "border-slate-800 bg-slate-900/80 shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
        }`}>

          {/* Cover — the stop's first photo, a fixed-size thumbnail (never stretched by card height) */}
          <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-slate-950">
            {item.images?.[0] ? (
              <button type="button" onClick={() => onPreview(item.images[0])} className="absolute inset-0 group cursor-zoom-in">
                <ZoomableImage src={item.images[0]} alt={item.pointName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-900/25 to-slate-900">
                <span className="text-xl opacity-40">📍</span>
              </div>
            )}
            {item.images?.length > 1 && (
              <span className="absolute bottom-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/70 text-white pointer-events-none">
                +{item.images.length - 1}
              </span>
            )}
          </div>

          {/* Content column */}
          <div className="flex-1 min-w-0 space-y-2">

          {/* Header row — name/location + action buttons, single compact row */}
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className={`font-bold text-sm leading-tight ${reached ? "line-through text-slate-400" : "text-white"}`}>
                  {item.pointName}
                </p>
                {reached && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-900/40 border border-emerald-600/50 text-emerald-400 shrink-0">
                    <span className="itin-reached-pulse inline-block">✓</span>
                  </span>
                )}
                {item._pending && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/50 text-amber-300 text-[9px] font-semibold tracking-wide uppercase shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Not Synced
                  </span>
                )}
              </div>
              {item.locationName && (
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">📍 {item.locationName}</p>
              )}
            </div>
            <div className="shrink-0 flex gap-1">
              <button type="button" onClick={onView}
                className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-blue-400 flex items-center justify-center transition-colors text-xs" title="View">
                👁️
              </button>
              <button type="button" onClick={onEdit}
                className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-emerald-400 flex items-center justify-center transition-colors text-xs" title="Edit">
                ✏️
              </button>
              <button type="button" onClick={onDelete}
                className="w-7 h-7 rounded-md bg-slate-800 hover:bg-red-900/40 border border-slate-700 hover:border-red-700/50 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors text-xs" title="Delete">
                🗑️
              </button>
            </div>
          </div>

          {/* Meta pills — date / start / duration / end, single compact row */}
          {(item.visitDate || item.visitTime || item.duration) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.visitDate && (
                <MetaPill icon="📅" tone="blue" text={new Date(item.visitDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} />
              )}
              {item.visitTime && <MetaPill icon="🕐" tone="emerald" text={fmt12h(item.visitTime)} />}
              {item.duration && <MetaPill icon="⏱" tone="slate" text={item.duration} />}
              {endTime && <MetaPill icon="🏁" tone="teal" text={endTime} />}
            </div>
          )}

          {/* Description / notes — always visible, compact */}
          {(item.description || item.notes) && (
            <div className="space-y-1.5 border-t border-slate-800/50 pt-2">
              {item.description && (
                <p className="text-xs text-slate-300 leading-snug">{item.description}</p>
              )}
              {item.notes && (
                <p className="text-[11px] text-amber-300 bg-amber-900/10 border border-amber-700/20 rounded-lg px-2 py-1 leading-snug">
                  📝 {item.notes}
                </p>
              )}
            </div>
          )}

          {/* Additional photos — beyond the cover, compact thumbnail row */}
          {item.images?.length > 1 && (
            <div className="flex gap-1 overflow-x-auto">
              {item.images.slice(1, 9).map((src, i) => (
                <button key={i} type="button" onClick={() => onPreview(src)}
                  className="shrink-0 w-10 h-10 rounded-md overflow-hidden border border-slate-700 bg-slate-950 cursor-zoom-in hover:border-emerald-600/60 transition-colors">
                  <ZoomableImage src={src} alt={`photo-${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
              {item.images.length > 9 && (
                <div className="shrink-0 w-10 h-10 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <span className="text-[10px] text-slate-500 font-bold">+{item.images.length - 9}</span>
                </div>
              )}
            </div>
          )}

          {/* Map — compact, always visible when a location is pinned */}
          {item.location?.lat != null && (
            <div>
              <SatelliteMapView lat={item.location.lat} lng={item.location.lng} name={item.location.name} compact />
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[9px] text-slate-600 font-mono flex-1 truncate">
                  {item.location.lat.toFixed(4)}, {item.location.lng.toFixed(4)}
                </p>
                {item.location?.url && (
                  <a href={item.location.url} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors shrink-0">
                    Open Maps ↗
                  </a>
                )}
              </div>
            </div>
          )}
          {!item.location?.lat && item.location?.url && (
            <div>
              <a href={item.location.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors">
                📍 View on Google Maps ↗
              </a>
            </div>
          )}

          </div>{/* end content column */}
        </div>{/* end card inner */}
      </div>{/* end RIGHT */}
    </div>  /* end timeline row */
  );
}

/* ─── DayTabs ───────────────────────────────────────────────────────────────── */
function DayTabs({ days, unscheduled, activeDay, onSelect }) {
  if (days.length === 0 && unscheduled.length === 0) return null;

  const tabBase = "itin-tab-pop relative shrink-0 flex flex-col items-center gap-1 min-w-[86px] px-4 py-3 rounded-2xl border transition-all duration-200 ease-out overflow-hidden";
  const activeEmerald = "bg-gradient-to-br from-emerald-600 to-teal-600 border-emerald-400/60 text-white -translate-y-0.5 scale-[1.03] itin-tab-glow";
  const activeAmber   = "bg-gradient-to-br from-amber-600 to-orange-600 border-amber-400/60 text-white -translate-y-0.5 scale-[1.03] itin-tab-glow-amber";
  const inactive      = "bg-slate-800 border-slate-700 text-slate-400 hover:border-emerald-700/50 hover:bg-slate-700/80 hover:text-slate-200 hover:-translate-y-0.5 hover:scale-[1.02]";

  const Shine = () => <span className="absolute inset-y-0 w-1/3 bg-white/25 blur-sm itin-shimmer pointer-events-none" />;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
      <div className="flex items-center gap-2.5 overflow-x-auto pb-0.5 -mx-1 px-1">
        {days.map((d, i) => {
          const active = activeDay === d.dayNo;
          const allReached = d.items.length > 0 && d.items.every((it) => it.isReached);
          return (
            <button key={d.dayNo} type="button" onClick={() => onSelect(d.dayNo)}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`${tabBase} ${active ? activeEmerald : inactive}`}>
              {active && <Shine />}
              <span className={`relative z-10 text-[9px] font-bold uppercase tracking-widest ${active ? "text-emerald-100" : "text-slate-500"}`}>Day {d.dayNo}</span>
              <span className={`relative z-10 text-sm font-bold leading-none ${active ? "text-white" : "text-slate-300"}`}>
                {d.date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
              {d.items.length > 0 ? (
                <span className={`relative z-10 mt-0.5 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-slate-700/70 text-slate-300"}`}>
                  {allReached && <span className={`${active ? "text-white" : "text-emerald-400"} itin-reached-pulse inline-block`}>✓</span>}
                  {d.items.length} stop{d.items.length !== 1 ? "s" : ""}
                </span>
              ) : (
                <span className={`relative z-10 mt-0.5 text-[10px] ${active ? "text-emerald-100/70" : "text-slate-600"}`}>Empty</span>
              )}
            </button>
          );
        })}
        {unscheduled.length > 0 && (
          <button type="button" onClick={() => onSelect("unscheduled")}
            style={{ animationDelay: `${days.length * 60}ms` }}
            className={`${tabBase} ${activeDay === "unscheduled" ? activeAmber : "bg-slate-800 border-slate-700 text-slate-400 hover:border-amber-700/50 hover:bg-slate-700/80 hover:text-slate-200 hover:-translate-y-0.5"}`}>
            {activeDay === "unscheduled" && <Shine />}
            <span className={`relative z-10 text-[9px] font-bold uppercase tracking-widest ${activeDay === "unscheduled" ? "text-amber-100" : "text-slate-500"}`}>Other</span>
            <span className="relative z-10 text-sm font-bold leading-none">Unscheduled</span>
            <span className={`relative z-10 mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${activeDay === "unscheduled" ? "bg-white/20 text-white" : "bg-slate-700/70 text-slate-300"}`}>
              {unscheduled.length} stop{unscheduled.length !== 1 ? "s" : ""}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── AdminItinerary ───────────────────────────────────────────────────────── */
export default function AdminItinerary() {
  const { selectedTripId, selectedTrip } = useTrip();
  const { popup, showSuccess, showError } = useActionPopup("itinerary");
  const { deleteModal, confirmDelete } = useDeleteConfirm();
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [viewItem,   setViewItem]   = useState(null);
  const [previewImg, setPreviewImg] = useState(null);
  const [activeDay,  setActiveDay]  = useState(1);

  const load = useCallback(async () => {
    if (!selectedTripId) return;
    setLoading(true);
    try {
      const r = await getItinerary(selectedTripId);
      if (r !== null) {
        const sorted = (r?.data || []).slice().sort((a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0));
        setItems(sorted);
      }
    } catch { /* ignore — connectivity errors return null */ }
    finally { setLoading(false); }
  }, [selectedTripId]);

  useEffect(() => {
    if (!selectedTripId) { setItems([]); return; }
    load();
  }, [selectedTripId, load]);
  useOnlineReload(load);

  useEffect(() => { setActiveDay(1); }, [selectedTripId]);

  const grouped = useMemo(() => groupItineraryByDay(items, selectedTrip), [items, selectedTrip]);

  useEffect(() => {
    if (activeDay === "unscheduled") return;
    if (grouped.days.some((d) => d.dayNo === activeDay)) return;
    setActiveDay(grouped.days[0]?.dayNo ?? "unscheduled");
  }, [grouped, activeDay]);

  const activeDayInfo = activeDay !== "unscheduled" ? grouped.days.find((d) => d.dayNo === activeDay) : null;
  const activeItems   = activeDay === "unscheduled" ? grouped.unscheduled : (activeDayInfo?.items || []);

  const handleAdd = async (form) => {
    try {
      await addItinerary(selectedTripId, form);
      load();
      showSuccess("Itinerary point added.");
    } catch (err) {
      if (err.queued) {
        load();
        showSuccess("Itinerary point saved offline — will sync when reconnected.");
      } else {
        throw err;
      }
    }
  };

  const handleEdit = async (form) => {
    try {
      if (editItem._pending && editItem._queueId) {
        await updatePendingItem(editItem, form);
        setEditItem(null);
        load();
        showSuccess("Itinerary point updated.");
        return;
      }
      await updateItinerary(selectedTripId, editItem._id, form);
      setEditItem(null);
      load();
      showSuccess("Itinerary point updated.");
    } catch (err) {
      if (err.queued) {
        setEditItem(null);
        load();
        showSuccess("Itinerary update saved offline — will sync when reconnected.");
      } else {
        throw err;
      }
    }
  };

  const handleDelete = (item) => {
    confirmDelete({
      title: "Delete Itinerary Point",
      recordLabel: item.pointName,
      onConfirm: async () => {
        try {
          if (item._pending && item._queueId) {
            await deletePendingItem(item);
            load();
            showSuccess("Unsaved itinerary point removed.");
            return;
          }
          await deleteItinerary(selectedTripId, item._id);
          load();
          showSuccess("Itinerary point deleted.");
        } catch (err) {
          if (err.queued) {
            load();
            showSuccess("Delete queued offline — will sync when reconnected.");
          } else {
            showError(err.message || "Delete failed.");
          }
        }
      },
    });
  };

  const reachedCount = items.filter((i) => i.isReached).length;
  const dayLabel = activeDay === "unscheduled" ? "Unscheduled" : `Day ${activeDay}`;

  return (
    <TripModuleShell title="Itinerary" description="Trip route plan, day by day" loading={loading && !!selectedTripId}>
      <style>{ITIN_KF}</style>
      {popup}
      {deleteModal}
      {previewImg && <ImagePreview src={previewImg} onClose={() => setPreviewImg(null)} />}
      {viewItem && <ItineraryViewModal item={viewItem} onClose={() => setViewItem(null)} onPreview={setPreviewImg} />}
      {showForm && (
        <ItineraryFormModal
          defaultVisitDate={activeDayInfo?.dateKey || ""}
          onClose={() => setShowForm(false)}
          onSave={handleAdd}
        />
      )}
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
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3">
            {items.length > 0 ? (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-900/30 border border-emerald-700/30 flex items-center justify-center shrink-0">
                    <svg className="w-4.5 h-4.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-none">{items.length} Stop{items.length !== 1 ? "s" : ""}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{reachedCount} reached · {grouped.days.length || 0} day{grouped.days.length !== 1 ? "s" : ""} planned</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 min-w-[130px]">
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="relative h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 overflow-hidden"
                      style={{ width: `${(reachedCount / items.length) * 100}%` }}
                    >
                      {reachedCount > 0 && <div className="absolute inset-y-0 w-1/3 bg-white/50 blur-[2px] itin-shimmer" />}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 shrink-0">{Math.round((reachedCount / items.length) * 100)}%</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Plan the trip route, one day at a time.</p>
            )}

            <button type="button" onClick={() => setShowForm(true)}
              className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold transition-all shadow-[0_4px_14px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_18px_rgba(16,185,129,0.35)] hover:-translate-y-0.5">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Stop to {dayLabel}
            </button>
          </div>

          {/* Day tabs */}
          <div className="mb-5">
            <DayTabs days={grouped.days} unscheduled={grouped.unscheduled} activeDay={activeDay} onSelect={setActiveDay} />
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <p className="text-5xl mb-4">🗺️</p>
              <p className="text-base font-semibold text-slate-400 mb-1">No itinerary points yet</p>
              <p className="text-sm">Add the first stop to start building your route!</p>
            </div>
          ) : activeItems.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <p className="text-5xl mb-4">📅</p>
              <p className="text-base font-semibold text-slate-400 mb-1">No stops planned for {dayLabel} yet</p>
              <p className="text-sm">Add a stop above to start building this day's plan.</p>
            </div>
          ) : (
            <div key={activeDay} className="space-y-0 itin-day-enter">
              {activeItems.map((item, idx) => (
                <ItineraryCard
                  key={item._id}
                  item={item}
                  index={idx}
                  total={activeItems.length}
                  onView={() => setViewItem(item)}
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
