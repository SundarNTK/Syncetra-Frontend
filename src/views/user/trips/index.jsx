import { useEffect, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import MasterPageShell, { MasterList, MasterListItem, MasterListEmpty } from "../../../components/layout/MasterPageShell";
import { formatDateTimeDisplay } from "../../../utils/dateTimeUtils";

// ─── Trip type metadata ───────────────────────────────────────────────────────
const TRIP_TYPES = [
  { value: "group",     label: "Group Tour",  icon: "👥" },
  { value: "adventure", label: "Adventure",   icon: "🏔️" },
  { value: "family",    label: "Family",      icon: "👨‍👩‍👧‍👦" },
  { value: "solo",      label: "Solo",        icon: "🧳" },
  { value: "beach",     label: "Beach",       icon: "🏖️" },
  { value: "mountain",  label: "Mountain",    icon: "⛰️" },
  { value: "road_trip", label: "Road Trip",   icon: "🚗" },
  { value: "business",  label: "Business",    icon: "💼" },
  { value: "cultural",  label: "Cultural",    icon: "🏛️" },
  { value: "religious", label: "Religious",   icon: "🛕" },
  { value: "other",     label: "Other",       icon: "✈️" },
];
const tripTypeMap = Object.fromEntries(TRIP_TYPES.map((t) => [t.value, t]));

const STATUS_BADGE = {
  planned:   "bg-blue-600/20 text-blue-400 border border-blue-700/40",
  active:    "bg-emerald-600/20 text-emerald-400 border border-emerald-700/40",
  completed: "bg-slate-600/20 text-slate-300 border border-slate-600/40",
  cancelled: "bg-red-600/20 text-red-400 border border-red-700/40",
};

const fmtDate = (iso) => (iso ? formatDateTimeDisplay(iso).split(",")[0] : null);
const pad2 = (n) => String(Math.max(0, n)).padStart(2, "0");

// ─── Countdown helpers ────────────────────────────────────────────────────────
function calcCountdown(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    isPast:  false,
  };
}

function useCountdown(dateStr) {
  const [time, setTime] = useState(() => calcCountdown(dateStr));
  useEffect(() => {
    if (!dateStr) { setTime(null); return; }
    setTime(calcCountdown(dateStr));
    const id = setInterval(() => setTime(calcCountdown(dateStr)), 1000);
    return () => clearInterval(id);
  }, [dateStr]);
  return time;
}

function getTripPhase(trip) {
  if (trip.status === "cancelled") return { phase: "cancelled" };
  if (trip.status === "completed") return { phase: "completed" };
  const now   = Date.now();
  const start = trip.startDate ? new Date(trip.startDate).getTime() : null;
  const end   = trip.endDate   ? new Date(trip.endDate).getTime()   : null;
  if (end && now > end)      return { phase: "completed" };
  if (start && now >= start) return { phase: "begun" };
  if (start)                 return { phase: "upcoming", targetDate: trip.startDate };
  return { phase: "no-dates" };
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconEye   = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>;
const IconClose = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;

// ─── Compact countdown tile ───────────────────────────────────────────────────
function CountdownTile({ value, label, large }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl bg-emerald-900/20 border border-emerald-700/30 ${large ? "w-16 h-16 sm:w-20 sm:h-20" : "w-12 h-12"}`}>
      <span key={value} className={`font-bold tabular-nums leading-none text-emerald-400 ${large ? "text-2xl sm:text-3xl" : "text-lg"}`}>
        {pad2(value)}
      </span>
      <span className={`uppercase tracking-widest text-emerald-600/70 mt-0.5 ${large ? "text-[10px] sm:text-[11px]" : "text-[9px]"}`}>
        {label}
      </span>
    </div>
  );
}

// ─── TripStatusText ─── "Trip Begins" (green) or "Trip Completed" (gold) ──────
function TripStatusText({ type, compact = false }) {
  const isCompleted = type === "completed";
  const text = isCompleted ? "Trip Completed" : "Trip Begins";
  const icon = isCompleted ? "🏁" : "🚀";
  const grad = isCompleted
    ? "linear-gradient(90deg,#f59e0b,#fcd34d,#f59e0b,#d97706,#f59e0b)"
    : "linear-gradient(90deg,#10b981,#6ee7b7,#10b981,#059669,#10b981)";
  const border = isCompleted ? "1px solid rgba(245,158,11,0.35)"  : "1px solid rgba(16,185,129,0.35)";
  const bg     = isCompleted ? "rgba(245,158,11,0.07)"            : "rgba(16,185,129,0.07)";
  const shimmer = {
    background: grad,
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    animation: "shimmerText 2s linear infinite",
    fontWeight: 700,
  };

  return (
    <>
      <style>{`@keyframes shimmerText{0%{background-position:200% center}100%{background-position:-200% center}}`}</style>
      {compact ? (
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ border, background: bg }}>
          <span className="text-sm leading-none">{icon}</span>
          <span style={{ ...shimmer, fontSize: "0.72rem" }}>{text}</span>
        </div>
      ) : (
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ border, background: `linear-gradient(135deg,${bg} 0%,rgba(15,23,42,0.9) 100%)` }}>
          <span className="text-3xl leading-none">{icon}</span>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5 font-semibold">Trip Status</p>
            <span style={{ ...shimmer, fontSize: "1.4rem" }}>{text}</span>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Compact countdown strip (TripCard) ──────────────────────────────────────
function TripCountdownStrip({ trip }) {
  const { phase, targetDate } = getTripPhase(trip);
  const time = useCountdown(phase === "upcoming" ? targetDate : null);

  if (phase === "cancelled" || phase === "no-dates") return null;
  if (phase === "completed") return <TripStatusText type="completed" compact />;
  if (phase === "begun")     return <TripStatusText type="begun"     compact />;
  if (!time) return null;

  return (
    <div className="mt-2.5">
      <p className="text-[10px] uppercase tracking-widest font-medium mb-1.5 text-emerald-500">
        Starts in
      </p>
      <div className="flex items-center gap-1.5">
        <CountdownTile value={time.days}    label="D" />
        <CountdownTile value={time.hours}   label="H" />
        <CountdownTile value={time.minutes} label="M" />
        <CountdownTile value={time.seconds} label="S" />
      </div>
    </div>
  );
}

// ─── TripViewModal ─────────────────────────────────────────────────────────────
function TripViewModal({ trip, onClose }) {
  const tripType = tripTypeMap[trip.tripType] || TRIP_TYPES[10];
  const { phase, targetDate } = getTripPhase(trip);
  const time = useCountdown(phase === "upcoming" ? targetDate : null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-8"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover banner */}
        {trip.coverImage ? (
          <div className="relative">
            <img src={trip.coverImage} alt={trip.tripName} className="w-full h-52 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors"
            >
              <IconClose />
            </button>
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[trip.status] || STATUS_BADGE.planned}`}>
                  {trip.status}
                </span>
                <span className="text-xs text-white/70">{tripType.icon} {tripType.label}</span>
              </div>
              <h2 className="text-2xl font-bold text-white">{trip.tripName}</h2>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[trip.status] || STATUS_BADGE.planned}`}>
                  {trip.status}
                </span>
                <span className="text-xs text-slate-400">{tripType.icon} {tripType.label}</span>
              </div>
              <h2 className="text-xl font-bold text-white">{trip.tripName}</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 transition-colors">
              <IconClose />
            </button>
          </div>
        )}

        <div className="p-5 space-y-4">
          {trip.description && (
            <p className="text-slate-300 text-sm leading-relaxed">{trip.description}</p>
          )}

          {/* Status / countdown block */}
          {phase === "completed" && <TripStatusText type="completed" compact={false} />}
          {phase === "begun"     && <TripStatusText type="begun"     compact={false} />}
          {phase === "upcoming" && time && (
            <div className="rounded-2xl p-4 bg-emerald-900/10 border border-emerald-700/25">
              <p className="text-xs uppercase tracking-widest font-semibold mb-3 text-emerald-400 flex items-center gap-2">
                <span className="animate-pulse">⏱</span>
                Starts in
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <CountdownTile value={time.days}    label="Days"  large />
                <CountdownTile value={time.hours}   label="Hours" large />
                <CountdownTile value={time.minutes} label="Mins"  large />
                <CountdownTile value={time.seconds} label="Secs"  large />
              </div>
            </div>
          )}

          {/* Info tiles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/60 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Budget</p>
              <p className="text-sm font-medium text-slate-200">₹{(trip.budget || 0).toLocaleString()}</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Members</p>
              <p className="text-sm font-medium text-slate-200">
                {(trip.members || []).length} member{(trip.members || []).length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Start Date</p>
              <p className="text-sm font-medium text-slate-200">{fmtDate(trip.startDate) || "—"}</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">End Date</p>
              <p className="text-sm font-medium text-slate-200">{fmtDate(trip.endDate) || "—"}</p>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TripCard ─────────────────────────────────────────────────────────────────
function TripCard({ trip, onView }) {
  const tripType = tripTypeMap[trip.tripType] || TRIP_TYPES[10];

  return (
    <MasterListItem>
      {/* Cover image */}
      <div className="w-32 sm:w-40 shrink-0 relative self-stretch min-h-[7.5rem] bg-slate-950 border-r border-slate-800/60 overflow-hidden">
        {trip.coverImage ? (
          <img
            src={trip.coverImage}
            alt={trip.tripName}
            className="absolute inset-0 w-full h-full object-contain p-1.5"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex flex-col items-center justify-center gap-1">
            <span className="text-3xl opacity-40">{tripType.icon}</span>
          </div>
        )}
        {trip.coverImage && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
            <p className="text-[10px] text-white/90 truncate">{trip.tripName}</p>
          </div>
        )}
      </div>

      {/* Info + actions */}
      <div className="flex-1 p-4 flex flex-col sm:flex-row justify-between items-start gap-3 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-base sm:text-lg truncate">{trip.tripName}</h3>
            <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_BADGE[trip.status] || STATUS_BADGE.planned}`}>
              {trip.status}
            </span>
            <span className="text-[10px] text-slate-500 shrink-0">{tripType.icon} {tripType.label}</span>
          </div>
          <p className="text-sm text-slate-400 mb-1">{trip.description || "No description"}</p>
          <p className="text-xs text-slate-500">
            Budget ₹{(trip.budget || 0).toLocaleString()}
            {trip.startDate && <> · {fmtDate(trip.startDate)}</>}
            {trip.endDate   && <> → {fmtDate(trip.endDate)}</>}
          </p>
          <TripCountdownStrip trip={trip} />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1.5 shrink-0 self-start">
          <button
            onClick={() => onView(trip)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-colors"
          >
            <IconEye /> View
          </button>
        </div>
      </div>
    </MasterListItem>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function UserTrips() {
  const { trips } = useTrip();
  const [viewTrip, setViewTrip] = useState(null);

  return (
    <MasterPageShell title="My Trips" description="Trips you are assigned to">
      {trips.length === 0 ? (
        <MasterListEmpty
          icon="🗺️"
          message="No trips assigned yet. Contact your admin to be added to a trip."
        />
      ) : (
        <MasterList>
          {trips.map((t) => (
            <TripCard key={t._id} trip={t} onView={setViewTrip} />
          ))}
        </MasterList>
      )}

      {viewTrip && (
        <TripViewModal trip={viewTrip} onClose={() => setViewTrip(null)} />
      )}
    </MasterPageShell>
  );
}
