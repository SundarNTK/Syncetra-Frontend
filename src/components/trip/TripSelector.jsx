import { useEffect, useMemo, useRef, useState } from "react";
import { useTrip } from "../../context/TripContext";
import {
  SYNC_SELECT_LAYOUT,
  SYNC_SELECT_TRIGGER,
  SYNC_SELECT_TRIGGER_OPEN,
  SYNC_SELECT_PANEL,
  SYNC_SELECT_SEARCH,
  SYNC_SELECT_TRIGGER_LABEL,
  SYNC_SELECT_OPTION_LABEL,
  SYNC_SELECT_CHEVRON,
} from "../ui/formControlStyles";
import SyncetraLoader from "../ui/SyncetraLoader";
import { fmtTripDateShort, tripPhase } from "./tripUtils";

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
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const searchRef = useRef(null);

  const filteredTrips = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trips;
    return trips.filter((t) => {
      const hay = [
        t.tripName,
        t.status,
        tripPhase(t),
        fmtTripDateShort(t.startDate),
        fmtTripDateShort(t.endDate),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [trips, query]);

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  if (loading && !trips.length) {
    return <SyncetraLoader size="sm" className="py-4" />;
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
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${SYNC_SELECT_LAYOUT} ${SYNC_SELECT_TRIGGER} gap-3 px-3.5 py-2.5 ${open ? SYNC_SELECT_TRIGGER_OPEN : ""}`}
      >
        {selectedTrip && <TripAvatar trip={selectedTrip} size="md" />}
        <span className={`${SYNC_SELECT_TRIGGER_LABEL} min-w-0`}>
          <span className="block truncate font-semibold text-slate-100">
            {selectedTrip?.tripName || "Select a trip…"}
          </span>
          {selectedTrip && (
            <span className="block text-[10px] text-slate-500 mt-0.5 capitalize truncate">
              {selectedTrip.status || tripPhase(selectedTrip)}
              {(selectedTrip.startDate || selectedTrip.endDate) && (
                <span>
                  {" · "}
                  {fmtTripDateShort(selectedTrip.startDate)}
                  {selectedTrip.endDate ? ` → ${fmtTripDateShort(selectedTrip.endDate)}` : ""}
                </span>
              )}
            </span>
          )}
        </span>
        <svg
          className={`${SYNC_SELECT_CHEVRON} ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className={SYNC_SELECT_PANEL}>
          <div className="p-2 border-b border-cyan-500/10">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trips…"
              className={SYNC_SELECT_SEARCH}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filteredTrips.length === 0 ? (
              <p className="px-4 py-4 text-sm text-slate-500 text-center">No trips match your search.</p>
            ) : (
              filteredTrips.map((t) => (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => {
                    setSelectedTripId(t._id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    t._id === selectedTripId
                      ? "bg-cyan-950/45 text-cyan-200"
                      : "text-slate-200 hover:bg-slate-800/70"
                  }`}
                >
                  <TripAvatar trip={t} size="md" />
                  <div className={`${SYNC_SELECT_OPTION_LABEL} min-w-0 flex-1`}>
                    <p className="text-sm font-semibold text-slate-100">{t.tripName}</p>
                    <p className="text-[10px] text-slate-500 capitalize mt-0.5">
                      {t.status || tripPhase(t)}
                      {(t.startDate || t.endDate) && (
                        <span className="text-slate-600">
                          {" · "}
                          {fmtTripDateShort(t.startDate)}
                          {t.endDate ? ` → ${fmtTripDateShort(t.endDate)}` : ""}
                        </span>
                      )}
                    </p>
                  </div>
                  {t._id === selectedTripId && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-live-dot" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function TripModuleShell({ title, description, children, loading = false }) {
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
      {loading ? (
        <SyncetraLoader className="py-16 min-h-[200px]" />
      ) : (
        children
      )}
    </div>
  );
}
