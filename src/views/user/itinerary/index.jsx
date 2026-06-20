import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const fmt12h = (t) => {
  if (!t) return "";
  const [hs, ms] = t.split(":");
  const h24 = parseInt(hs, 10); const m = parseInt(ms, 10);
  const ap = h24 >= 12 ? "PM" : "AM";
  return `${h24 % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
};
const parseDuration = (str) => {
  if (!str) return { h: 0, m: 0 };
  const hM = str.match(/(\d+)\s*(?:h|hr|hrs|hour)/i);
  const mM = str.match(/(\d+)\s*(?:m|min|mins|minute)/i);
  return { h: hM ? parseInt(hM[1], 10) : 0, m: mM ? parseInt(mM[1], 10) : 0 };
};
const calcEndTime = (time24, dh, dm) => {
  if (!time24 || (!dh && !dm)) return null;
  const [hs = "0", ms = "0"] = time24.split(":");
  const h24 = parseInt(hs, 10); const m = parseInt(ms, 10);
  const total = h24 * 60 + m + (dh || 0) * 60 + (dm || 0);
  const eh = Math.floor(total / 60) % 24; const em = total % 60;
  const ap = eh >= 12 ? "PM" : "AM";
  return `${eh % 12 || 12}:${String(em).padStart(2, "0")} ${ap}`;
};
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getItinerary } from "../../../services/trips";
import ZoomableImage from "../../../components/ui/ZoomableImage";

/* ─── ImagePreview ─────────────────────────────────────────────────────────── */
function ImagePreview({ src, onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <ZoomableImage src={src} alt="Preview" className="w-full rounded-2xl shadow-2xl border border-slate-700" />
        <button type="button" onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600/80 transition-colors">
          ×
        </button>
      </div>
    </div>,
    document.body
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
          <div className="w-10 h-10 rounded-full bg-emerald-600/20 border-2 border-emerald-500/60 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
            {item.sequenceOrder ?? item.orderNo ?? 0}
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

/* ─── UserTimelineCard ─────────────────────────────────────────────────────── */
function UserTimelineCard({ item, index, total, onView, onPreview }) {
  const [expanded, setExpanded] = useState(false);
  const reached = !!item.isReached;

  const endTime = useMemo(() => {
    if (!item.visitTime || !item.duration) return null;
    const hM = item.duration.match(/(\d+)\s*(?:h|hr|hrs|hour)/i);
    const mM = item.duration.match(/(\d+)\s*(?:m|min|mins|minute)/i);
    const dh = hM ? parseInt(hM[1], 10) : 0;
    const dm = mM ? parseInt(mM[1], 10) : 0;
    const [hs = "0", ms = "0"] = item.visitTime.split(":");
    const h24 = parseInt(hs, 10); const m = parseInt(ms, 10);
    const tot = h24 * 60 + m + dh * 60 + dm;
    const eh = Math.floor(tot / 60) % 24; const em = tot % 60;
    return `${eh % 12 || 12}:${String(em).padStart(2, "0")} ${eh >= 12 ? "PM" : "AM"}`;
  }, [item.visitTime, item.duration]);

  return (
    <div className="relative flex gap-4">

      {/* ── LEFT SIDE — progress bar (unchanged) ── */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-9 h-9 rounded-full bg-emerald-600/20 border-2 border-emerald-500/60 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
          {item.sequenceOrder}
        </div>
        {index < total - 1 && <div className="w-0.5 flex-1 bg-slate-700/60 mt-1" />}
      </div>

      {/* ── RIGHT SIDE — card ── */}
      <div className="flex-1 min-w-0 pb-6">
        <div className={`rounded-xl overflow-hidden border transition-all ${
          reached
            ? "border-emerald-600/40 bg-emerald-950/10 shadow-[0_0_16px_rgba(16,185,129,0.1)]"
            : "border-slate-800 bg-slate-900"
        }`}>

          {/* Card header */}
          <div className="px-4 pt-4 pb-3 flex flex-col gap-2.5">

            {/* Name + location + view button */}
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
                  <p className="text-xs text-slate-400 mt-1 truncate">📍 {item.locationName}</p>
                )}
              </div>
              <div className="shrink-0 self-stretch flex items-center">
                <button type="button" onClick={onView}
                  className="w-9 self-stretch rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-blue-400 flex items-center justify-center transition-colors text-sm" title="View">
                  👁️
                </button>
              </div>
            </div>

            {/* Glow chips with labels — right-aligned, flex-wrap for mobile */}
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

          {/* Photos strip — with label (matches admin style) */}
          {item.images?.length > 0 && (
            <div className="border-t border-slate-800/60 pt-2.5 pb-3 pl-4 pr-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">📸 Photos</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                  {item.images.length}
                </span>
              </div>
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

          {/* Expand toggle — button style */}
          {(item.description || item.notes || item.location?.lat != null || item.location?.url) && (
            <>
              <div className="px-4 pb-3 pt-1">
                <button type="button" onClick={() => setExpanded((v) => !v)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    reached
                      ? "bg-emerald-900/20 border-emerald-700/40 text-emerald-400 hover:bg-emerald-900/35 hover:border-emerald-600/60"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
                  }`}>
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7" />
                  </svg>
                  <span>{expanded ? "Hide details" : "Show details & map"}</span>
                  <svg className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
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
                  {/* URL-only fallback when no lat/lng stored */}
                  {!item.location?.lat && item.location?.url && (
                    <a href={item.location.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                      📍 View on Google Maps ↗
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── UserItinerary ────────────────────────────────────────────────────────── */
export default function UserItinerary() {
  const { selectedTripId } = useTrip();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);

  const load = useCallback(async () => {
    if (!selectedTripId) return;
    setLoading(true);
    try {
      const r = await getItinerary(selectedTripId, false);
      setItems((r?.data || []).slice().sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0)));
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [selectedTripId]);

  useEffect(() => {
    if (!selectedTripId) { setItems([]); return; }
    load();
  }, [selectedTripId, load]);

  return (
    <TripModuleShell title="Itinerary" description="Trip schedule & route points" loading={loading && !!selectedTripId}>
      {previewImg && <ImagePreview src={previewImg} onClose={() => setPreviewImg(null)} />}
      {viewItem && <ItineraryViewModal item={viewItem} onClose={() => setViewItem(null)} onPreview={setPreviewImg} />}

      {selectedTripId && (
        items.length === 0 ? (
          <div className="text-center py-14 text-slate-500">
            <p className="text-4xl mb-3">🗺️</p>
            <p className="text-sm">No itinerary published yet for this trip.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {items.map((item, idx) => (
              <UserTimelineCard
                key={item._id}
                item={item}
                index={idx}
                total={items.length}
                onView={() => setViewItem(item)}
                onPreview={setPreviewImg}
              />
            ))}
          </div>
        )
      )}
    </TripModuleShell>
  );
}
