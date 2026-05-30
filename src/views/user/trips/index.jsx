import { useEffect, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import useTripMemberCount from "../../../hooks/useTripMemberCount";
import ZoomableImage from "../../../components/ui/ZoomableImage";
import TripLocationMap from "../../../components/trip/TripLocationMap";
import MasterPageShell, { MasterList, MasterListItem, MasterListEmpty } from "../../../components/layout/MasterPageShell";
import { formatDateTimeDisplay } from "../../../utils/dateTimeUtils";

// ─── Trip type metadata ───────────────────────────────────────────────────────
const TRIP_TYPES = [
  { value: "group",     label: "Group Tour",  icon: "👥", glow: "59,130,246" },
  { value: "adventure", label: "Adventure",   icon: "🏔️", glow: "249,115,22" },
  { value: "family",    label: "Family",      icon: "👨‍👩‍👧‍👦", glow: "16,185,129" },
  { value: "solo",      label: "Solo",        icon: "🧳", glow: "139,92,246" },
  { value: "beach",     label: "Beach",       icon: "🏖️", glow: "6,182,212" },
  { value: "mountain",  label: "Mountain",    icon: "⛰️", glow: "100,116,139" },
  { value: "road_trip", label: "Road Trip",   icon: "🚗", glow: "234,179,8" },
  { value: "business",  label: "Business",    icon: "💼", glow: "99,102,241" },
  { value: "cultural",  label: "Cultural",    icon: "🏛️", glow: "236,72,153" },
  { value: "religious", label: "Religious",   icon: "🛕", glow: "167,139,250" },
  { value: "other",     label: "Other",       icon: "✈️", glow: "16,185,129" },
];
const tripTypeMap = Object.fromEntries(TRIP_TYPES.map((t) => [t.value, t]));

const STATUS_BADGE = {
  planned:   "bg-blue-600/20 text-blue-400 border border-blue-700/40",
  active:    "bg-emerald-600/20 text-emerald-400 border border-emerald-700/40",
  completed: "bg-amber-600/20 text-amber-300 border border-amber-700/40",
  cancelled: "bg-red-600/20 text-red-400 border border-red-700/40",
};

const STATUS_COVER_GLOW = {
  planned:   "trip-cover-glow--planned",
  active:    "trip-cover-glow--active",
  completed: "trip-cover-glow--completed",
  cancelled: "trip-cover-glow--cancelled",
};

const COUNTDOWN_THEME = {
  planned:   { glow: "59,130,246", label: "Starts in", textCls: "text-blue-300" },
  active:    { glow: "16,185,129", label: "Starts in", textCls: "text-emerald-300" },
  completed: { glow: "100,116,139", label: "Completed", textCls: "text-slate-400" },
  cancelled: { glow: "239,68,68", label: "Cancelled", textCls: "text-red-400" },
};

function getCountdownTheme(trip) {
  return COUNTDOWN_THEME[trip?.status] || COUNTDOWN_THEME.planned;
}

const KEYFRAMES = `
@keyframes digitDrop {
  0%   { transform: translateY(-40%) scale(0.8); opacity: 0; }
  100% { transform: translateY(0)    scale(1);   opacity: 1; }
}
@keyframes floatBob {
  0%,100% { transform: translateY(0px); }
  50%     { transform: translateY(-8px); }
}
@keyframes gradShift {
  0%,100% { background-position: 0% 50%; }
  50%     { background-position: 100% 50%; }
}
@keyframes shimmerText {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
.digit-drop { animation: digitDrop 0.22s cubic-bezier(0.22,0.61,0.36,1) forwards; }
.float-bob  { animation: floatBob 3.5s ease-in-out infinite; }
`;

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
function CountdownTile({ value, label, glow, size = "sm" }) {
  const isLg = size === "lg";
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl ${isLg ? "w-20 h-20 sm:w-24 sm:h-24" : "w-12 h-12"} relative overflow-hidden`}
      style={{
        background: `rgba(${glow}, 0.07)`,
        border: `1px solid rgba(${glow}, 0.35)`,
        boxShadow: `0 0 ${isLg ? 20 : 10}px rgba(${glow}, 0.25), inset 0 0 ${isLg ? 20 : 8}px rgba(${glow}, 0.05)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, transparent 40%, rgba(${glow}, 0.3) 50%, transparent 60%)`,
          backgroundSize: "200% 200%",
          animation: "gradShift 3s ease infinite",
        }}
      />
      <span
        key={value}
        className={`digit-drop font-bold tabular-nums leading-none ${isLg ? "text-3xl sm:text-4xl" : "text-lg"}`}
        style={{
          color: `rgb(${glow})`,
          textShadow: `0 0 12px rgba(${glow}, 0.6)`,
        }}
      >
        {pad2(value)}
      </span>
      <span
        className={`${isLg ? "text-[11px] mt-1" : "text-[9px] mt-0.5"} uppercase tracking-widest font-medium`}
        style={{ color: `rgba(${glow}, 0.7)` }}
      >
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

  if (compact) {
    return (
      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ border, background: bg }}>
        <span className="text-sm leading-none">{icon}</span>
        <span style={{ ...shimmer, fontSize: "0.72rem" }}>{text}</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 flex items-center gap-4" style={{ border, background: `linear-gradient(135deg,${bg} 0%,rgba(15,23,42,0.9) 100%)` }}>
      <span className="text-3xl leading-none">{icon}</span>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5 font-semibold">Trip Status</p>
        <span style={{ ...shimmer, fontSize: "1.4rem" }}>{text}</span>
      </div>
    </div>
  );
}

// ─── Compact countdown strip (TripCard) ──────────────────────────────────────
function TripCountdownStrip({ trip }) {
  const { phase, targetDate } = getTripPhase(trip);
  const time = useCountdown(phase === "upcoming" ? targetDate : null);
  const theme = getCountdownTheme(trip);

  if (phase === "cancelled" || phase === "no-dates") return null;
  if (phase === "completed") return <TripStatusText type="completed" compact />;
  if (phase === "begun")     return <TripStatusText type="begun"     compact />;
  if (!time) return null;

  return (
    <div className="mt-2 sm:mt-2.5">
      <p className={`text-[10px] uppercase tracking-widest font-medium mb-1 sm:mb-1.5 ${theme.textCls}`}>
        {theme.label}
      </p>
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
        <CountdownTile value={time.days}    label="D" glow={theme.glow} size="sm" />
        <CountdownTile value={time.hours}   label="H" glow={theme.glow} size="sm" />
        <CountdownTile value={time.minutes} label="M" glow={theme.glow} size="sm" />
        <CountdownTile value={time.seconds} label="S" glow={theme.glow} size="sm" />
      </div>
    </div>
  );
}

function TripCountdownFull({ trip }) {
  const { phase, targetDate } = getTripPhase(trip);
  const time = useCountdown(phase === "upcoming" ? targetDate : null);
  const theme = getCountdownTheme(trip);

  if (phase === "cancelled" || phase === "no-dates") return null;
  if (phase === "completed") return <TripStatusText type="completed" compact={false} />;
  if (phase === "begun")     return <TripStatusText type="begun"     compact={false} />;
  if (!time) return null;

  const glow = theme.glow;
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgba(${glow}, 0.12) 0%, rgba(15,23,42,0.9) 60%, rgba(${glow}, 0.06) 100%)`,
        border: `1px solid rgba(${glow}, 0.25)`,
        boxShadow: `0 0 30px rgba(${glow}, 0.1)`,
        backgroundSize: "300% 300%",
        animation: "gradShift 6s ease infinite",
      }}
    >
      <p className={`text-xs uppercase tracking-widest font-semibold mb-4 flex items-center gap-2 ${theme.textCls}`}>
        <span className="animate-pulse">⏱</span>
        {theme.label}
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { value: time.days,    label: "Days" },
          { value: time.hours,   label: "Hours" },
          { value: time.minutes, label: "Minutes" },
          { value: time.seconds, label: "Seconds" },
        ].map(({ value, label }) => (
          <CountdownTile key={label} value={value} label={label} glow={glow} size="lg" />
        ))}
      </div>
    </div>
  );
}

// ─── TripViewModal ─────────────────────────────────────────────────────────────
function TripViewModal({ trip, onClose }) {
  const tripType = tripTypeMap[trip.tripType] || tripTypeMap.group;
  const memberCount = useTripMemberCount(trip._id, (trip.members || []).length, false);
  const collectedAmount = Number(trip.budget) || Number(trip.collectedAmount) || 0;

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
            <ZoomableImage src={trip.coverImage} alt={trip.tripName} className="w-full h-52 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors"
            >
              <IconClose />
            </button>
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 pointer-events-none">
              <h2 className="text-2xl font-bold text-white">{trip.tripName}</h2>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white">{trip.tripName}</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 transition-colors">
              <IconClose />
            </button>
          </div>
        )}

        <div className="px-5 pt-4 flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[trip.status] || STATUS_BADGE.planned}`}>
            {trip.status}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-800/60 border border-slate-700/60 px-2.5 py-1 rounded-full">
            👥 {memberCount} member{memberCount !== 1 ? "s" : ""}
          </span>
          <span className="text-xs text-slate-500">{tripType.icon} {tripType.label}</span>
        </div>

        <div className="p-5 pt-3 space-y-4">
          {trip.description && (
            <p className="text-slate-300 text-sm leading-relaxed">{trip.description}</p>
          )}

          <TripLocationMap trip={trip} />

          <TripCountdownFull trip={trip} />

          {/* Info tiles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/60 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Budget</p>
              <p className="text-sm font-medium text-slate-200">₹{(trip.budget || 0).toLocaleString()}</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Collected</p>
              <p className="text-sm font-medium text-slate-200">₹{collectedAmount.toLocaleString()}</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Members</p>
              <p className="text-sm font-medium text-slate-200">
                {memberCount} member{memberCount !== 1 ? "s" : ""}
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
  const tripType = tripTypeMap[trip.tripType] || tripTypeMap.group;
  const coverGlowClass = STATUS_COVER_GLOW[trip.status] || STATUS_COVER_GLOW.planned;
  const actionBtn =
    "flex items-center justify-center gap-1.5 px-2.5 py-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition-colors w-full sm:w-auto";

  return (
    <MasterListItem className="master-list-item trip-card flex-col sm:flex-row">
      {/* Cover — full-width banner on mobile; left column with curved glow on sm+ */}
      <div className="trip-cover-column relative shrink-0 w-full h-40 sm:h-auto sm:w-36 md:w-40 sm:min-h-[7.5rem] sm:self-stretch bg-slate-950 border-b sm:border-b-0 sm:border-r border-slate-800/60 p-1 sm:p-1.5">
        <div className={`trip-cover-glow-wrap trip-cover-glow-wrap--card h-full w-full ${coverGlowClass}`}>
          <span className="trip-cover-glow-shimmer" aria-hidden="true" />
          {trip.coverImage ? (
            <ZoomableImage
              src={trip.coverImage}
              alt={trip.tripName}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-1"
              style={{
                background: `linear-gradient(135deg, rgba(${tripType.glow},0.15) 0%, #1e293b 100%)`,
              }}
            >
              <span className="text-3xl opacity-50">{tripType.icon}</span>
            </div>
          )}
        </div>
      </div>

      {/* Info + actions — stacked on mobile like admin */}
      <div className="flex-1 flex flex-col sm:flex-row min-w-0 w-full">
        <div className="flex-1 p-3 sm:p-4 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1.5">
            <h3 className="font-semibold text-base sm:text-lg leading-snug break-words w-full sm:w-auto sm:truncate sm:flex-1 min-w-0">
              {trip.tripName}
            </h3>
            <span
              className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_BADGE[trip.status] || STATUS_BADGE.planned}`}
            >
              {trip.status}
            </span>
            <span className="text-[10px] text-slate-500 shrink-0">
              {tripType.icon} {tripType.label}
            </span>
          </div>
          <p className="text-sm text-slate-400 mb-1.5 line-clamp-2 sm:line-clamp-none leading-relaxed">
            {trip.description || "No description"}
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Budget ₹{(trip.budget || 0).toLocaleString()}
            {trip.startDate && <> · {fmtDate(trip.startDate)}</>}
            {trip.endDate && <> → {fmtDate(trip.endDate)}</>}
          </p>

          <TripCountdownStrip trip={trip} />
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-col gap-1.5 p-3 pt-0 sm:p-4 sm:pt-4 sm:pl-2 sm:shrink-0 sm:self-start border-t sm:border-t-0 sm:border-l border-slate-700/40">
          <button
            type="button"
            onClick={() => onView(trip)}
            className={`${actionBtn} col-span-2 sm:col-span-1 bg-slate-700 hover:bg-slate-600 text-slate-300`}
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

  useEffect(() => {
    const id = "user-trip-keyframes";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = KEYFRAMES;
      document.head.appendChild(s);
    }
  }, []);

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
