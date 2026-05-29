import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import { getAdminDashboard } from "../../../services/dashboard";
import { getTripHub } from "../../../services/trips";
import { getAdminGroups } from "../../../services/groups";
import { useTrip } from "../../../context/TripContext";
import TripsMapSection from "../../../components/trip/TripsMapSection";
import SelectedTripCard from "../../../components/trip/SelectedTripCard";
import { tripPhase, phaseBadge } from "../../../components/trip/tripUtils";

/* ── Trip stat card ───────────────────────────────────────────────────────── */
function TripStatCard({ label, value, icon, delay, variant }) {
  const base = "rounded-2xl p-5 border shadow-xl relative overflow-hidden cursor-default transition-transform hover:scale-[1.03] shimmer-parent";

  if (variant === "gold") {
    return (
      <div className={base} style={{
        background: "linear-gradient(135deg,#78350f 0%,#b45309 20%,#d97706 40%,#fbbf24 60%,#f59e0b 80%,#78350f 100%)",
        backgroundSize: "250% 250%",
        animation: "gold-shift 3s ease-in-out infinite, glow-pulse-gold 2.5s ease-in-out infinite",
        border: "1px solid rgba(251,191,36,0.55)",
      }}>
        <div className="shimmer-child" />
        <div className="relative flex justify-between items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-yellow-100/70">{label}</p>
            <p className="text-4xl font-black text-white mt-1.5"
              style={{ textShadow: "0 0 20px rgba(251,191,36,1), 0 0 45px rgba(245,158,11,0.7), 0 2px 6px rgba(0,0,0,0.6)" }}>
              {value}
            </p>
          </div>
          <span className="text-3xl animate-float-icon" style={{ filter: "drop-shadow(0 0 10px rgba(251,191,36,0.9))" }}>{icon}</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-60" />
      </div>
    );
  }
  if (variant === "active") {
    return (
      <div className={`${base} bg-gradient-to-br from-emerald-600/80 to-teal-900/80 border-emerald-500/40 animate-glow-emerald`}>
        <div className="shimmer-child" />
        <span className="absolute top-3 right-3 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-live-dot" />
          <span className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider">Live</span>
        </span>
        <div className="relative flex justify-between items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">{label}</p>
            <p className="text-4xl font-black text-white mt-1.5"
              style={{ textShadow: "0 0 16px rgba(52,211,153,0.8), 0 2px 4px rgba(0,0,0,0.5)" }}>
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
    <div className={`${base} bg-gradient-to-br ${s.bg} border ${s.border}`}>
      <div className="shimmer-child" />
      <div className="relative flex justify-between items-start">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">{label}</p>
          <p className="text-4xl font-black text-white mt-1.5"
            style={{ textShadow: `0 0 16px ${s.glow}, 0 2px 4px rgba(0,0,0,0.5)` }}>
            {value}
          </p>
        </div>
        <span className="text-3xl opacity-80 animate-float-icon">{icon}</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { trips, selectedTrip, selectedTripId, setSelectedTripId } = useTrip();
  const [alarmData,   setAlarmData]   = useState(null);
  const [hub,         setHub]         = useState(null);
  const [memberCount, setMemberCount] = useState(null);

  useEffect(() => {
    getAdminDashboard().then((r) => setAlarmData(r?.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setHub(null); setMemberCount(null);
    if (!selectedTripId) return;
    getTripHub(selectedTripId).then((r) => setHub(r?.data)).catch(() => {});
    getAdminGroups()
      .then((r) => {
        const linked = (r?.data || []).find((g) => String(g.tripId) === String(selectedTripId));
        setMemberCount(linked?.members?.length ?? null);
      })
      .catch(() => {});
  }, [selectedTripId]);

  const tripStats = trips.reduce(
    (acc, t) => {
      acc.total++;
      const p = tripPhase(t);
      if (p === "cancelled") return acc;
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    },
    { total: 0, active: 0, upcoming: 0, completed: 0 }
  );

  const tripBudget = Number(hub?.totalBudget ?? selectedTrip?.budget ?? 0);
  const tripSpent = Number(hub?.totalSpent ?? 0);
  const tripBalance = tripBudget - tripSpent;

  const selectedTripStats = [
    {
      label: "Members",
      value: memberCount != null ? memberCount : (hub?.memberCount ?? "—"),
      icon: "👥",
      accent: "indigo",
    },
    {
      label: "Budget",
      value: `₹${tripBudget.toLocaleString()}`,
      icon: "💰",
      accent: "amber",
    },
    {
      label: "Balance",
      value: `₹${tripBalance.toLocaleString()}`,
      icon: "💳",
      accent: "emerald",
    },
    {
      label: "Spent",
      value: hub ? `₹${tripSpent.toLocaleString()}` : "—",
      icon: "💸",
      accent: "slate",
    },
  ];

  return (
    <div className="space-y-7 w-full max-w-none">

      {/* title */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-slate-500 text-sm mt-1">Trip overview &amp; operations centre</p>
      </div>

      {/* trip stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <TripStatCard label="Total Trips"  value={tripStats.total}     icon="🗺️"  variant="total"    />
        <TripStatCard label="Active"       value={tripStats.active}    icon="✈️"  variant="active"   />
        <TripStatCard label="Upcoming"     value={tripStats.upcoming}  icon="📅"  variant="upcoming" />
        <TripStatCard label="Completed"    value={tripStats.completed} icon="🏆"  variant="gold"     />
      </div>

      {/* world map */}
      <div className="animate-fade-in">
        <TripsMapSection trips={trips} selectedTripId={selectedTripId} />
      </div>

      <SelectedTripCard
        tripsLink="/admin/trips"
        tripsLinkLabel="Manage trips →"
        stats={selectedTripStats}
      />

      {/* all trips */}
      {trips.length > 0 && (
        <div className="rounded-2xl border border-slate-700/60 p-4 sm:p-5 animate-slide-up" style={{ background: "rgba(15,23,42,0.7)" }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm text-white">All Trips</h3>
            <Link to="/admin/trips" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Manage →</Link>
          </div>
          <div className="space-y-2">
            {trips.map((t) => {
              const phase = tripPhase(t);
              const isSel = String(t._id) === String(selectedTripId);
              return (
                <div
                  key={t._id}
                  onClick={() => setSelectedTripId(t._id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-200 border ${isSel ? "bg-indigo-900/30 border-indigo-600/40" : "border-transparent hover:bg-slate-800/60 hover:border-slate-700/60"}`}
                >
                  {t.coverImage
                    ? <img src={t.coverImage} alt={t.tripName} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                    : <div className="w-9 h-9 rounded-xl bg-slate-700/60 flex items-center justify-center shrink-0"><span>✈️</span></div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{t.tripName}</p>
                    {t.location?.name && <p className="text-[10px] text-slate-500 truncate">📍 {t.location.name.split(",")[0]}</p>}
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full border capitalize font-medium ${phaseBadge(phase)}`}>{phase}</span>
                  {isSel && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 animate-live-dot" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* alarm section */}
      {alarmData && (
        <>
          <div className="flex items-center gap-4 py-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Alarms</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Active Groups", value: alarmData.activeGroups, icon: "👥", from: "from-violet-600/60", to: "to-purple-900/60", border: "border-violet-700/40", glow: "rgba(139,92,246,0.5)" },
              { label: "Total Users",   value: alarmData.totalUsers,   icon: "📱", from: "from-blue-600/60",   to: "to-indigo-900/60", border: "border-blue-700/40",   glow: "rgba(99,102,241,0.5)"  },
              { label: "Total Alarms",  value: alarmData.totalAlarms,  icon: "⏰", from: "from-amber-600/60",  to: "to-orange-900/60", border: "border-amber-700/40",  glow: "rgba(245,158,11,0.5)"  },
              { label: "Active Alarms", value: alarmData.activeAlarms, icon: "🚨", from: "from-red-600/60",    to: "to-red-900/60",    border: "border-red-700/40",    glow: "rgba(239,68,68,0.5)"   },
            ].map((s) => (
              <div key={s.label} className={`rounded-2xl p-4 bg-gradient-to-br ${s.from} ${s.to} border ${s.border} relative overflow-hidden shimmer-parent hover:scale-[1.02] transition-transform`}>
                <div className="shimmer-child" />
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/60 text-xs">{s.label}</p>
                    <p className="text-2xl font-black text-white mt-1" style={{ textShadow: `0 0 12px ${s.glow}` }}>{s.value}</p>
                  </div>
                  <span className="text-xl opacity-80">{s.icon}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-800/80 p-5" style={{ background: "rgba(15,23,42,0.8)" }}>
              <h3 className="font-bold text-sm mb-4 text-white">Alarm status</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={alarmData.statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4}>
                    {alarmData.statusChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-1">
                {alarmData.statusChart.map((s) => (
                  <span key={s.name} className="text-xs flex items-center gap-1.5 text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    {s.name}: <span className="text-white font-semibold">{s.value}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/80 p-5" style={{ background: "rgba(15,23,42,0.8)" }}>
              <div className="flex justify-between mb-4">
                <h3 className="font-bold text-sm text-white">Recent alarms</h3>
                <Link to="/admin/alarms" className="text-xs text-red-400 hover:text-red-300 transition-colors">View all</Link>
              </div>
              <ul className="space-y-1">
                {(alarmData.recentAlarms || []).slice(0, 6).map((a) => (
                  <li key={a._id} className="flex justify-between items-center py-2 border-b border-slate-800/80 last:border-0 group">
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors truncate flex-1 mr-2">{a.title}</span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold shrink-0 ${a.status === "active" ? "bg-red-600/80 text-white" : "bg-slate-700/80 text-slate-400"}`}>{a.status}</span>
                  </li>
                ))}
                {(!alarmData.recentAlarms || alarmData.recentAlarms.length === 0) && (
                  <li className="text-sm text-slate-500 py-3 text-center">No recent alarms.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/80 p-5" style={{ background: "rgba(15,23,42,0.8)" }}>
            <h3 className="font-bold text-sm mb-4 text-white">Alarm actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link to="/admin/alarms/schedule"
                className="p-3.5 rounded-xl border border-red-700/60 text-center text-xs font-bold text-white transition-all hover:scale-[1.03] shimmer-parent"
                style={{ background: "linear-gradient(135deg,rgba(220,38,38,0.5),rgba(185,28,28,0.4))" }}>
                <div className="shimmer-child" />🔔 Schedule Alarm
              </Link>
              {[
                { to: "/admin/alarms/active", label: "⚡ Active Alarms" },
                { to: "/admin/alarms",        label: "📋 Alarm History" },
                { to: "/admin/groups",        label: "👥 Manage Groups" },
              ].map((a) => (
                <Link key={a.to} to={a.to}
                  className="p-3.5 rounded-xl border border-slate-700/60 text-center text-xs font-semibold text-slate-300 hover:bg-slate-700/60 hover:text-white hover:border-slate-600 hover:scale-[1.03] transition-all"
                  style={{ background: "rgba(30,41,59,0.6)" }}>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
