import { useEffect, useRef, useState } from "react";
import { useTrip } from "../../context/TripContext";

// Small thumbnail or initial-letter avatar for a trip
function TripAvatar({ trip, size = "sm" }) {
  const dims = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  if (trip.coverImage) {
    return (
      <img
        src={trip.coverImage}
        alt={trip.tripName}
        className={`${dims} rounded-lg object-cover shrink-0 border border-slate-700`}
      />
    );
  }
  return (
    <div
      className={`${dims} rounded-lg bg-gradient-to-br from-emerald-800 to-slate-800 flex items-center justify-center shrink-0 border border-slate-700`}
    >
      <span className="text-white text-xs font-bold leading-none">
        {trip.tripName?.[0]?.toUpperCase() || "T"}
      </span>
    </div>
  );
}

export default function TripSelector({ label = "Select trip", className = "" }) {
  const { trips, selectedTripId, selectedTrip, setSelectedTripId, loading } = useTrip();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (loading && !trips.length) {
    return <p className="text-sm text-slate-400">Loading trips…</p>;
  }

  if (!trips.length) {
    return (
      <p className="text-sm text-amber-400/90 bg-amber-950/30 border border-amber-700/40 rounded-lg px-3 py-2">
        No trips yet. Create a trip first (Admin → Trips).
      </p>
    );
  }

  return (
    <div ref={ref} className={`relative mb-4 w-full max-w-none ${className}`}>
      {label && (
        <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">
          {label}
        </label>
      )}

      {/* trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm hover:border-slate-600 transition-colors"
      >
        {selectedTrip && <TripAvatar trip={selectedTrip} size="sm" />}
        <span className="flex-1 text-left truncate text-slate-100">
          {selectedTrip?.tripName || "Select a trip…"}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
          {trips.map((t) => (
            <button
              key={t._id}
              type="button"
              onClick={() => {
                setSelectedTripId(t._id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-800 transition-colors ${
                t._id === selectedTripId ? "bg-slate-800" : ""
              }`}
            >
              <TripAvatar trip={t} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-100 truncate">{t.tripName}</p>
                <p className="text-[10px] text-slate-500 capitalize">{t.status}</p>
              </div>
              {t._id === selectedTripId && (
                <svg
                  className="w-4 h-4 text-emerald-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function TripModuleShell({ title, description, children }) {
  const { selectedTrip } = useTrip();

  return (
    <div className="master-page w-full max-w-none space-y-4">
      <div className="flex items-center gap-3">
        {selectedTrip?.coverImage && (
          <img
            src={selectedTrip.coverImage}
            alt={selectedTrip.tripName}
            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-700 shadow-md"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {description && <p className="text-slate-400 text-sm mt-0.5">{description}</p>}
        </div>
      </div>
      <TripSelector />
      {children}
    </div>
  );
}
