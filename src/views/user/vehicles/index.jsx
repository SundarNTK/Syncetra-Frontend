import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getUserVehicles } from "../../../services/trips";

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

const fmtINR  = (n) => n ? `₹${Number(n).toLocaleString("en-IN")}` : "—";
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
function VehicleDetailModal({ vehicle, onClose }) {
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
        <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />

        {fullscreen && imgs.length > 0 && (
          <ImageFullscreenModal images={imgs} initialIndex={imgIdx} onClose={() => setFullscreen(false)} />
        )}

        {/* Image carousel */}
        {imgs.length > 0 ? (
          <div className="relative">
            {/* object-contain — no distortion */}
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
          {/* Name + badges */}
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

          <button type="button" onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── VehicleCard ────────────────────────────────────────────────────────────── */
function VehicleCard({ vehicle, onView }) {
  const [imgIdx,     setImgIdx]     = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const imgs      = vehicle.images || [];
  const icon      = TYPE_ICON[vehicle.type] || "🚗";
  const typeLabel = VEHICLE_TYPES.find((t) => t.value === vehicle.type)?.label || vehicle.type;
  const duration  = calcDuration(vehicle.tripStartDate, vehicle.tripEndDate);

  return (
    <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl overflow-hidden">
      {/* Image carousel */}
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
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {imgs.length === 0 && <span className="text-2xl shrink-0">{icon}</span>}
            <div className="min-w-0">
              <p className="font-bold text-white text-base truncate">{vehicle.name || typeLabel}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
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
          </div>
          <button type="button" onClick={onView}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            View
          </button>
        </div>

        {/* Booking info */}
        {(vehicle.bookedDate || vehicle.advanceAmount > 0 || vehicle.totalAmount > 0) && (
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

        {/* Trip date range + duration */}
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

/* ─── UserVehicles ───────────────────────────────────────────────────────────── */
export default function UserVehicles() {
  const { selectedTripId } = useTrip();
  const [items,   setItems]   = useState([]);
  const [viewVeh, setViewVeh] = useState(null);

  useEffect(() => {
    if (selectedTripId)
      getUserVehicles(selectedTripId).then((r) => setItems(r?.data || []));
    else
      setItems([]);
  }, [selectedTripId]);

  return (
    <TripModuleShell title="Vehicles" description="Trip vehicle & booking details">
      {viewVeh && (
        <VehicleDetailModal vehicle={viewVeh} onClose={() => setViewVeh(null)} />
      )}

      {selectedTripId && (
        items.length === 0 ? (
          <div className="text-center py-14 text-slate-500">
            <p className="text-4xl mb-3">🚌</p>
            <p className="text-sm">No vehicles assigned to this trip yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((v) => (
              <VehicleCard key={v._id} vehicle={v} onView={() => setViewVeh(v)} />
            ))}
          </div>
        )
      )}
    </TripModuleShell>
  );
}
