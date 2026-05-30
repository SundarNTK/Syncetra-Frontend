import { useEffect, useMemo, useRef, useState } from "react";
import { useTrip } from "../../context/TripContext";
import { fmtTripDateShort, tripPhase } from "./tripUtils";
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

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    if (!isMobile) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const tripList = filteredTrips.map((t) => {
    const selected = String(t._id) === String(selectedTripId);
    return (
      <button
        key={t._id}
        type="button"
        onClick={() => {
          setSelectedTripId(t._id);
          setOpen(false);
          setQuery("");
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 sm:px-3 sm:py-2.5 text-left transition-colors border-b border-cyan-500/10 last:border-b-0 ${
          selected ? "bg-cyan-950/45 text-cyan-200" : "text-slate-200 hover:bg-slate-800/70 active:bg-slate-800"
        }`}
      >
        <TripThumb trip={t} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white leading-snug break-words">{t.tripName}</p>
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
          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-live-dot" />
        )}
      </button>
    );
  });

  const searchField = (
    <div className="p-2 border-b border-cyan-500/10 shrink-0">
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
  );

  const emptySearch = (
    <p className="px-4 py-6 text-sm text-slate-500 text-center">No trips match your search.</p>
  );

  return (
    <div ref={ref} className={`relative w-full min-w-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${SYNC_SELECT_LAYOUT} ${SYNC_SELECT_TRIGGER} gap-2.5 ${open ? SYNC_SELECT_TRIGGER_OPEN : ""}`}
      >
        {selectedTrip ? <TripThumb trip={selectedTrip} /> : null}
        <span className={`${SYNC_SELECT_TRIGGER_LABEL} font-medium`}>
          {selectedTrip?.tripName || "— choose a trip —"}
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
        <>
          {/* Mobile — bottom sheet */}
          <div className="sm:hidden fixed inset-0 z-[200] flex flex-col justify-end">
            <button
              type="button"
              aria-label="Close trip list"
              className="absolute inset-0 bg-black/55"
              onClick={() => setOpen(false)}
            />
            <div
              className="relative z-10 w-full max-h-[min(70vh,520px)] rounded-t-2xl overflow-hidden flex flex-col"
              style={{
                background: "rgba(15,23,42,0.98)",
                border: "1px solid rgba(99,102,241,0.35)",
                boxShadow: "0 -8px 40px rgba(0,0,0,0.55)",
              }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
                <p className="text-sm font-semibold text-white">Select trip</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {searchField}
              <div className="overflow-y-auto flex-1">
                {filteredTrips.length === 0 ? emptySearch : tripList}
              </div>
            </div>
          </div>

          {/* Desktop — anchored dropdown */}
          <div
            className="hidden sm:block absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl overflow-hidden"
            style={{
              background: "rgba(15,23,42,0.98)",
              border: "1px solid rgba(99,102,241,0.35)",
              boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
            }}
          >
            {searchField}
            <div className="max-h-72 overflow-y-auto">
              {filteredTrips.length === 0 ? emptySearch : tripList}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
