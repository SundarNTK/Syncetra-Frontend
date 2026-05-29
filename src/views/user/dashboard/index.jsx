import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getUserDashboard } from "../../../services/dashboard";
import PhoneAlarmSetup from "../../../components/phone-alarm-setup/PhoneAlarmSetup";
import { useTrip } from "../../../context/TripContext";

/* ── helpers ─────────────────────────────────────────────────────────────── */
function tripPhase(trip) {
  const now   = Date.now();
  const start = trip.startDate ? new Date(trip.startDate).getTime() : null;
  const end   = trip.endDate   ? new Date(trip.endDate).getTime()   : null;
  if (!start)         return "upcoming";
  if (now < start)    return "upcoming";
  if (!end || now <= end) return "active";
  return "completed";
}

function phaseBadge(phase) {
  if (phase === "active")   return "bg-emerald-600/30 text-emerald-300 border-emerald-500/50";
  if (phase === "upcoming") return "bg-sky-600/30 text-sky-300 border-sky-500/50";
  return "bg-yellow-900/40 text-yellow-300 border-yellow-600/50";
}

function BudgetBar({ spent, total }) {
  const pct   = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0;
  const color = pct > 85 ? "from-red-500 to-rose-600" : pct > 60 ? "from-amber-500 to-orange-500" : "from-emerald-500 to-teal-500";
  return (
    <div className="w-full">
      <div className="flex justify-between text-[11px] mb-1.5">
        <span className="text-slate-300">₹{(spent || 0).toLocaleString()} collected</span>
        <span className={pct > 85 ? "text-red-400 font-bold" : "text-slate-400"}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-700/80 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} shimmer-parent transition-all duration-700`}
          style={{ width: `${pct}%` }}
        >
          <div className="shimmer-child" />
        </div>
      </div>
      <p className="text-[11px] text-slate-500 mt-1.5">Budget ₹{(total || 0).toLocaleString()}</p>
    </div>
  );
}

/* ── Trip stat card ───────────────────────────────────────────────────────── */
function TripStatCard({ label, value, icon, delay, variant }) {
  const base = "rounded-2xl p-5 border shadow-xl relative overflow-hidden cursor-default transition-transform hover:scale-[1.03] shimmer-parent";

  if (variant === "gold") {
    return (
      <div
        className={`${base} animate-glow-gold`}
        style={{
          background: "linear-gradient(135deg,#78350f 0%,#b45309 20%,#d97706 40%,#fbbf24 60%,#f59e0b 80%,#78350f 100%)",
          backgroundSize: "250% 250%",
          animation: "gold-shift 3s ease-in-out infinite, glow-pulse-gold 2.5s ease-in-out infinite",
          border: "1px solid rgba(251,191,36,0.55)",
        }}
      >
        <div className="shimmer-child" />
        <div className="relative flex justify-between items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-yellow-100/70">{label}</p>
            <p
              className="text-4xl font-black text-white mt-1.5 animate-counter-pop"
              style={{
                animationDelay: `${delay + 100}ms`,
                textShadow: "0 0 20px rgba(251,191,36,1), 0 0 45px rgba(245,158,11,0.7), 0 2px 6px rgba(0,0,0,0.6)",
              }}
            >
              {value}
            </p>
          </div>
          <span className="text-3xl animate-float-icon" style={{ filter: "drop-shadow(0 0 10px rgba(251,191,36,0.9))" }}>
            {icon}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-60" />
      </div>
    );
  }

  if (variant === "active") {
    return (
      <div
        className={`${base} animate-glow-emerald bg-gradient-to-br from-emerald-600/80 to-teal-900/80 border-emerald-500/40`}
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="shimmer-child" />
        <span className="absolute top-3 right-3 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-live-dot" />
          <span className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider">Live</span>
        </span>
        <div className="relative flex justify-between items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">{label}</p>
            <p
              className="text-4xl font-black text-white mt-1.5 animate-counter-pop"
              style={{ animationDelay: `${delay + 100}ms`, textShadow: "0 0 16px rgba(52,211,153,0.8), 0 2px 4px rgba(0,0,0,0.5)" }}
            >
              {value}
            </p>
          </div>
          <span className="text-3xl opacity-90 animate-float-icon">{icon}</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-50" />
      </div>
    );
  }

  const styles = {
    total:    { bg: "from-violet-600/80 to-purple-900/80", border: "border-violet-500/30", glow: "rgba(139,92,246,0.6)" },
    upcoming: { bg: "from-sky-600/80 to-blue-900/80",      border: "border-sky-500/30",    glow: "rgba(56,189,248,0.6)"  },
  };
  const s = styles[variant] || styles.total;

  return (
    <div className={`${base} bg-gradient-to-br ${s.bg} border ${s.border}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="shimmer-child" />
      <div className="relative flex justify-between items-start">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">{label}</p>
          <p
            className="text-4xl font-black text-white mt-1.5 animate-counter-pop"
            style={{ animationDelay: `${delay + 100}ms`, textShadow: `0 0 16px ${s.glow}, 0 2px 4px rgba(0,0,0,0.5)` }}
          >
            {value}
          </p>
        </div>
        <span className="text-3xl opacity-80 animate-float-icon">{icon}</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

const MODULE_COLORS = {
  Expenses:   "hover:border-yellow-500/60 hover:shadow-yellow-500/20",
  Tasks:      "hover:border-violet-500/60 hover:shadow-violet-500/20",
  Vehicles:   "hover:border-sky-500/60 hover:shadow-sky-500/20",
  Attendance: "hover:border-emerald-500/60 hover:shadow-emerald-500/20",
  Gallery:    "hover:border-pink-500/60 hover:shadow-pink-500/20",
  Checklist:  "hover:border-orange-500/60 hover:shadow-orange-500/20",
  Polls:      "hover:border-red-500/60 hover:shadow-red-500/20",
  History:    "hover:border-cyan-500/60 hover:shadow-cyan-500/20",
};

const TRIP_MODULES = [
  { label: "Expenses",   icon: "💰", path: "/user/expenses"   },
  { label: "Tasks",      icon: "📋", path: "/user/tasks"      },
  { label: "Vehicles",   icon: "🚌", path: "/user/vehicles"   },
  { label: "Attendance", icon: "✅", path: "/user/attendance" },
  { label: "Gallery",    icon: "📷", path: "/user/gallery"    },
  { label: "Checklist",  icon: "🎒", path: "/user/checklist"  },
  { label: "Polls",      icon: "🗳️", path: "/user/polls"      },
  { label: "History",    icon: "⏰", path: "/user/history"    },
];

/* ── Main component ───────────────────────────────────────────────────────── */
export default function UserDashboard() {
  const { trips, selectedTrip, selectedTripId, setSelectedTripId } = useTrip();
  const [data, setData] = useState(null);

  useEffect(() => {
    getUserDashboard().then((r) => setData(r?.data)).catch(() => {});
  }, []);

  const tripStats = trips.reduce(
    (acc, t) => { const p = tripPhase(t); acc.total++; acc[p] = (acc[p] || 0) + 1; return acc; },
    { total: 0, active: 0, upcoming: 0, completed: 0 }
  );

  return (
    <div className="space-y-7">

      {/* title */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-slate-500 text-sm mt-1">Your trips &amp; alarm overview</p>
      </div>

      <PhoneAlarmSetup />

      {/* active alarm banner */}
      {data?.activeAlarm && (
        <div className="rounded-2xl p-4 sm:p-5 border border-red-500/80 animate-glow-red shimmer-parent"
          style={{ background: "linear-gradient(135deg,rgba(220,38,38,0.8),rgba(185,28,28,0.7))" }}>
          <div className="shimmer-child" />
          <p className="font-black text-base sm:text-lg">🚨 Active alarm now</p>
          <p className="text-white/90 text-sm sm:text-base">{data.activeAlarm.title}</p>
          <p className="text-xs sm:text-sm text-white/70 mt-1">Open the app to enter stop code</p>
        </div>
      )}

      {/* trip stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <TripStatCard label="Total Trips"  value={tripStats.total}     icon="🗺️"  delay={0}   variant="total"    />
        <TripStatCard label="Active"       value={tripStats.active}    icon="✈️"  delay={60}  variant="active"   />
        <TripStatCard label="Upcoming"     value={tripStats.upcoming}  icon="📅"  delay={120} variant="upcoming" />
        <TripStatCard label="Completed"    value={tripStats.completed} icon="🏆"  delay={180} variant="gold"     />
      </div>

      {/* selected trip card */}
      {trips.length > 0 && (
        <div
          className="rounded-2xl border overflow-hidden animate-fade-in"
          style={{
            background: "linear-gradient(135deg,rgba(15,23,42,0.95) 0%,rgba(30,41,59,0.9) 100%)",
            border: "1px solid rgba(99,102,241,0.25)",
            boxShadow: "0 0 0 1px rgba(99,102,241,0.1), 0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <div
            className="flex items-center gap-3 px-5 py-3 border-b border-slate-800/80"
            style={{ background: "linear-gradient(90deg,rgba(99,102,241,0.08) 0%,transparent 100%)" }}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-live-dot" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selected Trip</span>
            <select
              value={selectedTripId || ""}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="flex-1 max-w-xs px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-600/60 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
            >
              <option value="">— choose a trip —</option>
              {trips.map((t) => <option key={t._id} value={t._id}>{t.tripName}</option>)}
            </select>
            <Link to="/user/trips" className="text-xs text-indigo-400 hover:text-indigo-300 shrink-0 transition-colors ml-auto">
              My trips →
            </Link>
          </div>

          {selectedTrip ? (
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-44 shrink-0 relative overflow-hidden">
                {selectedTrip.coverImage ? (
                  <img src={selectedTrip.coverImage} alt={selectedTrip.tripName} className="w-full h-36 sm:h-full object-cover" />
                ) : (
                  <div className="w-full h-36 sm:h-full bg-gradient-to-br from-indigo-900/60 to-slate-900 flex items-center justify-center">
                    <span className="text-5xl opacity-20">✈️</span>
                  </div>
                )}
              </div>
              <div className="flex-1 p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-black text-white">{selectedTrip.tripName}</h2>
                    {(selectedTrip.startDate || selectedTrip.endDate) && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selectedTrip.startDate ? new Date(selectedTrip.startDate).toLocaleDateString() : "?"}{" "}→{" "}
                        {selectedTrip.endDate ? new Date(selectedTrip.endDate).toLocaleDateString() : "ongoing"}
                      </p>
                    )}
                  </div>
                  <span className={`text-[11px] px-3 py-1 rounded-full border capitalize font-semibold ${phaseBadge(tripPhase(selectedTrip))}`}>
                    {tripPhase(selectedTrip)}
                  </span>
                </div>
                {selectedTrip.budget > 0 && (
                  <BudgetBar spent={selectedTrip.collectedAmount || 0} total={selectedTrip.budget} />
                )}
              </div>
            </div>
          ) : (
            <p className="px-5 py-10 text-slate-500 text-sm text-center">Select a trip above to see its details.</p>
          )}
        </div>
      )}

      {/* trip modules */}
      {selectedTrip && (
        <div className="animate-slide-up">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Trip Modules</p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {TRIP_MODULES.map((m, i) => (
              <Link
                key={m.label}
                to={m.path}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/50 hover:bg-slate-800/90 hover:shadow-lg transition-all duration-200 group ${MODULE_COLORS[m.label] || ""}`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span className="text-2xl group-hover:scale-125 group-hover:-translate-y-0.5 transition-transform duration-200">{m.icon}</span>
                <span className="text-[10px] text-slate-400 group-hover:text-white transition-colors text-center leading-tight font-medium">{m.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* all trips list */}
      {trips.length > 0 && (
        <div
          className="rounded-2xl border border-slate-700/60 p-4 sm:p-5 animate-slide-up"
          style={{ background: "rgba(15,23,42,0.7)" }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm text-white">My Trips</h3>
            <Link to="/user/trips" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">View all →</Link>
          </div>
          <div className="space-y-2">
            {trips.map((t) => {
              const phase      = tripPhase(t);
              const isSelected = String(t._id) === String(selectedTripId);
              return (
                <div
                  key={t._id}
                  onClick={() => setSelectedTripId(t._id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                    isSelected
                      ? "bg-indigo-900/30 border-indigo-600/40 shadow-md shadow-indigo-900/20"
                      : "border-transparent hover:bg-slate-800/60 hover:border-slate-700/60"
                  }`}
                >
                  {t.coverImage ? (
                    <img src={t.coverImage} alt={t.tripName} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-slate-700/60 flex items-center justify-center shrink-0">
                      <span className="text-base">✈️</span>
                    </div>
                  )}
                  <span className="flex-1 text-sm font-medium text-slate-200 truncate">{t.tripName}</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full border capitalize font-medium ${phaseBadge(phase)}`}>{phase}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 animate-live-dot" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* alarm section */}
      {data && (
        <>
          <div className="flex items-center gap-4 py-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Alarms</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "My Groups",    value: data.totalGroups,    icon: "👥", from: "from-violet-600/60", to: "to-purple-900/60", border: "border-violet-700/40", glow: "rgba(139,92,246,0.5)" },
              { label: "Total Alarms", value: data.totalAlarms,    icon: "⏰", from: "from-amber-600/60",  to: "to-orange-900/60", border: "border-amber-700/40",  glow: "rgba(245,158,11,0.5)"  },
              { label: "Active",       value: data.activeAlarms,   icon: "🚨", from: "from-red-600/60",    to: "to-red-900/60",    border: "border-red-700/40",    glow: "rgba(239,68,68,0.5)"   },
              { label: "Completed",    value: data.completedAlarms, icon: "✓", from: "from-slate-600/60", to: "to-slate-800/60",  border: "border-slate-600/40",  glow: "rgba(148,163,184,0.4)" },
            ].map((s, i) => (
              <div
                key={s.label}
                className={`rounded-2xl p-4 bg-gradient-to-br ${s.from} ${s.to} border ${s.border} relative overflow-hidden shimmer-parent hover:scale-[1.02] transition-transform`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="shimmer-child" />
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/60 text-xs">{s.label}</p>
                    <p className="text-2xl font-black text-white mt-1" style={{ textShadow: `0 0 12px ${s.glow}` }}>
                      {s.value}
                    </p>
                  </div>
                  <span className="text-xl opacity-80">{s.icon}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-800/80 p-4 sm:p-5" style={{ background: "rgba(15,23,42,0.8)" }}>
              <h3 className="font-bold text-sm mb-4 text-white">Alarm status</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={data.statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65}>
                    {data.statusChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-1">
                {data.statusChart.map((s) => (
                  <span key={s.name} className="text-xs flex items-center gap-1.5 text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    {s.name}: <span className="text-white font-semibold">{s.value}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/80 p-4 sm:p-5" style={{ background: "rgba(15,23,42,0.8)" }}>
              <h3 className="font-bold text-sm mb-3 text-white">My groups</h3>
              <ul className="space-y-1">
                {(data.groups || []).slice(0, 5).map((g) => (
                  <li key={g._id} className="text-sm py-2 border-b border-slate-800/80 last:border-0 text-slate-300 hover:text-white transition-colors">
                    {g.groupName}
                  </li>
                ))}
                {(!data.groups || data.groups.length === 0) && (
                  <li className="text-sm text-slate-500 py-3 text-center">No groups assigned.</li>
                )}
              </ul>
              <Link to="/user/groups" className="text-xs text-cyan-400 mt-3 inline-block hover:text-cyan-300 transition-colors">
                View all groups →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
