import { useEffect, useRef, useState } from "react";
import { useTrip } from "../../context/TripContext";
import { fmtTripDateShort } from "./tripUtils";

function TripThumb({ trip, size = "sm" }) {
  const dims = size === "sm" ? "w-8 h-8" : "w-9 h-9";
  if (trip?.coverImage) {
    return (
      <img
        src={trip.coverImage}
        alt={trip.tripName}
        className={`${dims} rounded-lg object-cover shrink-0 border border-slate-600/80`}
      />
    );
  }
  return (
    <div
      className={`${dims} rounded-lg bg-gradient-to-br from-indigo-800 to-slate-800 flex items-center justify-center shrink-0 border border-slate-600/80`}
    >
      <span className="text-white text-xs font-bold">{trip?.tripName?.[0]?.toUpperCase() || "T"}</span>
    </div>
  );
}

export default function DashboardTripPicker({ className = "" }) {
  const { trips, selectedTripId, selectedTrip, setSelectedTripId } = useTrip();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={`relative flex-1 min-w-0 max-w-md ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-white transition-all"
        style={{
          background: "linear-gradient(135deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.98) 100%)",
          border: "1px solid rgba(99,102,241,0.45)",
          boxShadow: open
            ? "0 0 0 2px rgba(99,102,241,0.25), 0 8px 24px rgba(0,0,0,0.35)"
            : "0 0 0 1px rgba(99,102,241,0.12)",
        }}
      >
        {selectedTrip ? <TripThumb trip={selectedTrip} /> : null}
        <span className="flex-1 text-left truncate font-medium">
          {selectedTrip?.tripName || "— choose a trip —"}
        </span>
        <svg
          className={`w-4 h-4 text-indigo-300 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 z-40 rounded-xl overflow-hidden max-h-72 overflow-y-auto"
          style={{
            background: "rgba(15,23,42,0.98)",
            border: "1px solid rgba(99,102,241,0.35)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
          }}
        >
          {trips.map((t) => {
            const selected = String(t._id) === String(selectedTripId);
            return (
              <button
                key={t._id}
                type="button"
                onClick={() => {
                  setSelectedTripId(t._id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  selected ? "bg-indigo-950/50" : "hover:bg-slate-800/80"
                }`}
              >
                <TripThumb trip={t} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{t.tripName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 capitalize">
                    {t.status || "planned"}
                    {(t.startDate || t.endDate) && (
                      <span className="text-slate-600">
                        {" · "}
                        {fmtTripDateShort(t.startDate)}
                        {t.endDate ? ` → ${fmtTripDateShort(t.endDate)}` : ""}
                      </span>
                    )}
                  </p>
                </div>
                {selected && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 animate-live-dot" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
