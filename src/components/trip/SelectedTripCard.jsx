import { Link } from "react-router-dom";
import { useTrip } from "../../context/TripContext";
import DashboardTripPicker from "./DashboardTripPicker";
import { TripStatBox } from "./TripStatBox";
import { tripPhase, phaseBadge, fmtTripDate } from "./tripUtils";

export default function SelectedTripCard({
  tripsLink = "/admin/trips",
  tripsLinkLabel = "Manage trips →",
  stats = [],
}) {
  const { trips, selectedTrip } = useTrip();

  if (!trips.length) return null;

  const phase = selectedTrip ? tripPhase(selectedTrip) : null;

  return (
    <div
      className="rounded-2xl border overflow-hidden animate-fade-in"
      style={{
        background: "linear-gradient(135deg,rgba(15,23,42,0.95) 0%,rgba(30,41,59,0.9) 100%)",
        border: "1px solid rgba(99,102,241,0.25)",
        boxShadow: "0 0 0 1px rgba(99,102,241,0.1), 0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <div
        className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3 border-b border-slate-800/80"
        style={{ background: "linear-gradient(90deg,rgba(99,102,241,0.08) 0%,transparent 100%)" }}
      >
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-live-dot shrink-0" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">
          Selected Trip
        </span>
        <DashboardTripPicker />
        <Link
          to={tripsLink}
          className="text-xs text-indigo-400 hover:text-indigo-300 shrink-0 transition-colors ml-auto"
        >
          {tripsLinkLabel}
        </Link>
      </div>

      {selectedTrip ? (
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-48 xl:w-52 shrink-0 relative overflow-hidden">
            {selectedTrip.coverImage ? (
              <img
                src={selectedTrip.coverImage}
                alt={selectedTrip.tripName}
                className="w-full h-40 lg:h-full min-h-[10rem] object-cover"
              />
            ) : (
              <div className="w-full h-40 lg:h-full min-h-[10rem] bg-gradient-to-br from-indigo-900/60 to-slate-900 flex items-center justify-center">
                <span className="text-6xl opacity-20">✈️</span>
              </div>
            )}
          </div>

          <div className="flex-1 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-xl font-black text-white truncate">{selectedTrip.tripName}</h2>
                {selectedTrip.location?.name && (
                  <a
                    href={selectedTrip.location.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors mt-0.5 flex items-center gap-1"
                  >
                    📍 {selectedTrip.location.name.split(",")[0]} ↗
                  </a>
                )}
              </div>
              <span
                className={`text-[11px] px-3 py-1 rounded-full border capitalize font-semibold shrink-0 ${phaseBadge(phase)}`}
              >
                {phase}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <TripStatBox label="Start Date" value={fmtTripDate(selectedTrip.startDate)} icon="📅" accent="sky" />
              <TripStatBox label="End Date" value={fmtTripDate(selectedTrip.endDate)} icon="🏁" accent="emerald" />
              {stats.map((s) => (
                <TripStatBox key={s.label} label={s.label} value={s.value} icon={s.icon} accent={s.accent || "slate"} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="px-5 py-10 text-slate-500 text-sm text-center">
          Select a trip above to see its details.
        </p>
      )}
    </div>
  );
}
