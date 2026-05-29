import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getAdminDashboard } from "../../../services/dashboard";
import { getTripHub } from "../../../services/trips";
import { getAdminGroups } from "../../../services/groups";
import { useTrip } from "../../../context/TripContext";

/* ── helpers ─────────────────────────────────────────────────────────────── */
function tripPhase(trip) {
  const now   = Date.now();
  const start = trip.startDate ? new Date(trip.startDate).getTime() : null;
  const end   = trip.endDate   ? new Date(trip.endDate).getTime()   : null;
  if (!start)             return "upcoming";
  if (now < start)        return "upcoming";
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
        <span className="text-slate-300">₹{(spent || 0).toLocaleString()} spent</span>
        <span className={pct > 85 ? "text-red-400 font-bold" : "text-slate-400"}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-700/80 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${color} shimmer-parent`} style={{ width: `${pct}%` }}>
          <div className="shimmer-child" />
        </div>
      </div>
      <p className="text-[11px] text-slate-500 mt-1.5">Budget ₹{(total || 0).toLocaleString()}</p>
    </div>
  );
}

/* ── Leaflet helpers ──────────────────────────────────────────────────────── */
function MapInit() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 120);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function FlyToSelected({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.flyTo(center, zoom ?? 11, { duration: 1.1 });
  }, [map, center, zoom]);
  return null;
}

function createTripMarker(trip, phase, isSelected = false) {
  const isActive   = phase === "active";
  const isUpcoming = phase === "upcoming";
  const mc   = isSelected ? "#a78bfa" : isActive ? "#f97316" : isUpcoming ? "#38bdf8" : "#94a3b8";
  const rgb  = isSelected ? "167,139,250" : isActive ? "249,115,22" : isUpcoming ? "56,189,248" : "148,163,184";
  const dark = isSelected ? "#4c1d95" : isActive ? "#7c2d12" : isUpcoming ? "#0c4a6e" : "#334155";

  const makeRing = (sz, op, delay) =>
    `<div style="position:absolute;width:${sz}px;height:${sz}px;border-radius:50%;border:${isSelected ? 2 : 1.5}px solid rgba(${rgb},${op});top:50%;left:50%;transform:translate(-50%,-50%);animation:markerPulse ${isSelected ? 2.2 : 2.8}s ease-out ${delay}s infinite;"></div>`;

  const rings = isSelected
    ? makeRing(120, 0.22, 0) + makeRing(88, 0.38, 0.4) + makeRing(60, 0.52, 0.9) + makeRing(36, 0.7, 1.4) + makeRing(20, 0.85, 2)
    : isActive
    ? makeRing(100, 0.18, 0) + makeRing(72, 0.32, 0.6) + makeRing(48, 0.48, 1.2) + makeRing(28, 0.65, 1.8)
    : isUpcoming
    ? makeRing(70, 0.2, 0) + makeRing(44, 0.38, 0.8)
    : makeRing(50, 0.18, 0);

  const name = trip.tripName.length > 15 ? trip.tripName.slice(0, 14) + "…" : trip.tripName;

  return L.divIcon({
    className: "",
    html: `
<div style="width:180px;position:relative;display:flex;flex-direction:column;align-items:center;pointer-events:none;">
  <div style="position:relative;width:22px;height:22px;display:flex;align-items:center;justify-content:center;">
    ${rings}
    <div style="position:absolute;width:90px;height:90px;border-radius:50%;top:50%;left:50%;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(${rgb},0.16) 0%,transparent 65%);"></div>
    <div style="
      width:18px;height:18px;border-radius:50%;
      background:radial-gradient(circle,#fff9f4 0%,${mc} 48%,${dark} 100%);
      box-shadow:0 0 0 2.5px rgba(255,255,255,0.22),0 0 8px 3px ${mc},0 0 20px 6px rgba(${rgb},0.6),0 0 40px 12px rgba(${rgb},0.18);
      position:relative;z-index:5;
    "></div>
  </div>
  <div style="width:1px;height:9px;background:linear-gradient(rgba(${rgb},0.75),rgba(${rgb},0.05));"></div>
  <div style="
    background:rgba(255,255,255,0.96);color:#0f172a;
    font-size:10.5px;font-weight:700;font-family:system-ui,-apple-system,sans-serif;
    padding:3px 10px;border-radius:6px;border:2px solid ${mc};
    white-space:nowrap;max-width:170px;overflow:hidden;text-overflow:ellipsis;
    letter-spacing:0.4px;
    box-shadow:0 0 0 1px rgba(255,255,255,0.8),0 0 16px rgba(${rgb},0.45),0 4px 14px rgba(15,23,42,0.35);
    pointer-events:auto;
  ">${name}</div>
</div>`,
    iconSize: [180, 65],
    iconAnchor: [90, 11],
    popupAnchor: [0, -11],
  });
}

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

const DEFAULT_MAP_CENTER = [20.5937, 78.9629];
const DEFAULT_MAP_ZOOM = 5;
const DASH_MAP_TILES = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

/* ── Map section ──────────────────────────────────────────────────────────── */
function TripsMapSection({ trips, selectedTripId }) {
  const tripsWithLoc  = trips.filter((t) => t.location?.lat && t.location?.lng);
  const activeCount   = tripsWithLoc.filter((t) => tripPhase(t) === "active").length;
  const upcomingCount = tripsWithLoc.filter((t) => tripPhase(t) === "upcoming").length;
  const selectedTrip  = trips.find((t) => String(t._id) === String(selectedTripId));
  const selectedHasLoc = selectedTrip?.location?.lat && selectedTrip?.location?.lng;

  const avgCenter = tripsWithLoc.length > 0
    ? [
        tripsWithLoc.reduce((s, t) => s + t.location.lat, 0) / tripsWithLoc.length,
        tripsWithLoc.reduce((s, t) => s + t.location.lng, 0) / tripsWithLoc.length,
      ]
    : DEFAULT_MAP_CENTER;

  const flyTarget = selectedHasLoc
    ? [selectedTrip.location.lat, selectedTrip.location.lng]
    : tripsWithLoc.length > 0
    ? avgCenter
    : null;

  const flyZoom = selectedHasLoc ? 11 : tripsWithLoc.length === 1 ? 10 : tripsWithLoc.length > 1 ? 6 : DEFAULT_MAP_ZOOM;

  return (
    <div className="rounded-2xl overflow-hidden relative"
      style={{
        border: "1px solid rgba(249,115,22,0.2)",
        boxShadow: "0 0 0 1px rgba(249,115,22,0.06), 0 0 50px rgba(249,115,22,0.08), 0 12px 40px rgba(0,0,0,0.5)",
      }}
    >
      {/* header */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b cmd-header-grad">
        <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0 animate-live-dot" />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#fb923c" }}>
          Trip Locations
        </span>
        <div className="flex items-center gap-3 ml-2">
          {[
            { color: "#f97316", label: "Active",   count: activeCount   },
            { color: "#38bdf8", label: "Upcoming", count: upcomingCount },
            { color: "#94a3b8", label: "Done",     count: tripsWithLoc.filter((t) => tripPhase(t) === "completed").length },
          ].filter((l) => l.count > 0).map((l) => (
            <span key={l.label} className="flex items-center gap-1 text-[10px]" style={{ color: l.color }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: l.color, display: "inline-block", boxShadow: `0 0 6px ${l.color}` }} />
              {l.count} {l.label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-[10px] text-slate-500">{tripsWithLoc.length}/{trips.length} mapped</span>
          <Link to="/admin/trips" className="text-[10px] font-semibold transition-colors" style={{ color: "#fb923c" }}>
            + Add location →
          </Link>
        </div>
      </div>

      {/* map — always visible; colorful OSM tiles with light UI chrome */}
      <div style={{ height: 440, position: "relative", background: "#dce6f0" }}>
        <div style={{
          position: "absolute", inset: 0, zIndex: 900, pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(15,23,42,0.06) 0%, transparent 12%, transparent 88%, rgba(15,23,42,0.08) 100%)",
        }} />
        <div style={{
          position: "absolute", inset: 0, zIndex: 901, pointerEvents: "none",
          boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.08), inset 0 0 80px rgba(15,23,42,0.12)",
        }} />
        {[
          { top: 8, left: 8,   borderTop: "2px solid rgba(249,115,22,0.65)", borderLeft:   "2px solid rgba(249,115,22,0.65)" },
          { top: 8, right: 8,  borderTop: "2px solid rgba(249,115,22,0.65)", borderRight:  "2px solid rgba(249,115,22,0.65)" },
          { bottom: 8, left: 8,  borderBottom: "2px solid rgba(249,115,22,0.65)", borderLeft:  "2px solid rgba(249,115,22,0.65)" },
          { bottom: 8, right: 8, borderBottom: "2px solid rgba(249,115,22,0.65)", borderRight: "2px solid rgba(249,115,22,0.65)" },
        ].map((c, i) => (
          <div key={i} style={{ position: "absolute", zIndex: 903, pointerEvents: "none", width: 18, height: 18, ...c }} />
        ))}

        {tripsWithLoc.length === 0 && (
          <div style={{
            position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 910,
            display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderRadius: 12,
            background: "rgba(4,8,16,0.82)", border: "1px solid rgba(249,115,22,0.25)",
            boxShadow: "0 0 24px rgba(249,115,22,0.12)", pointerEvents: "auto",
          }}>
            <span style={{ fontSize: 18, opacity: 0.7 }}>🗺️</span>
            <div>
              <p style={{ color: "#94a3b8", fontWeight: 600, margin: 0, fontSize: 12 }}>No trip locations pinned yet</p>
              <p style={{ color: "#475569", fontSize: 11, margin: "2px 0 0" }}>Map is live — add a location on a trip to see markers</p>
            </div>
            <Link to="/admin/trips" style={{ fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 8, background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.35)", color: "#fb923c", textDecoration: "none", whiteSpace: "nowrap" }}>
              Add location →
            </Link>
          </div>
        )}

        <MapContainer
          center={DEFAULT_MAP_CENTER}
          zoom={DEFAULT_MAP_ZOOM}
          minZoom={3}
          maxZoom={18}
          style={{ height: "100%", width: "100%", background: "#dce6f0", zIndex: 1 }}
          className="dash-map dash-map--colorful"
          zoomControl
          attributionControl
        >
          <TileLayer url={DASH_MAP_TILES.url} attribution={DASH_MAP_TILES.attribution} />
          <MapInit />
          {flyTarget && <FlyToSelected center={flyTarget} zoom={flyZoom} />}
          {tripsWithLoc.length > 1 && tripsWithLoc.map((t, i) => {
            if (i === tripsWithLoc.length - 1) return null;
            const next = tripsWithLoc[i + 1];
            return (
              <Polyline
                key={`route-${t._id}`}
                positions={[[t.location.lat, t.location.lng], [next.location.lat, next.location.lng]]}
                pathOptions={{ color: "#ea580c", weight: 2.5, opacity: 0.75, dashArray: "10 6", className: "animated-route-line" }}
              />
            );
          })}
          {tripsWithLoc.map((t) => {
            const phase = tripPhase(t);
            const isSelected = String(t._id) === String(selectedTripId);
            return (
              <Marker
                key={t._id}
                position={[t.location.lat, t.location.lng]}
                icon={createTripMarker(t, phase, isSelected)}
                zIndexOffset={isSelected ? 1000 : 0}
              >
                <Popup maxWidth={240} closeButton={false}>
                  <TripPopup trip={t} phase={phase} />
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

function TripPopup({ trip, phase }) {
  const mc  = phase === "active" ? "#f97316" : phase === "upcoming" ? "#38bdf8" : "#94a3b8";
  const rgb = phase === "active" ? "249,115,22" : phase === "upcoming" ? "56,189,248" : "148,163,184";
  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : null;
  return (
    <div style={{ minWidth: 210, fontFamily: "system-ui,-apple-system,sans-serif" }}>
      {trip.coverImage && (
        <img src={trip.coverImage} alt={trip.tripName}
          style={{ width: "calc(100% + 20px)", height: 80, objectFit: "cover", borderRadius: "8px 8px 0 0", display: "block", margin: "-10px -10px 12px", borderBottom: `2px solid rgba(${rgb},0.4)` }}
        />
      )}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <p style={{ fontWeight: 800, fontSize: 13, color: "#f1f5f9", margin: 0, flex: 1 }}>{trip.tripName}</p>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, textTransform: "capitalize", background: `rgba(${rgb},0.18)`, color: mc, border: `1px solid rgba(${rgb},0.4)`, whiteSpace: "nowrap" }}>{phase}</span>
        </div>
        {(trip.startDate || trip.endDate) && (
          <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 8px" }}>📅 {fmt(trip.startDate)}{trip.endDate ? ` → ${fmt(trip.endDate)}` : ""}</p>
        )}
        {trip.location?.name && (
          <p style={{ fontSize: 10, color: "#475569", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {trip.location.name.split(",").slice(0, 2).join(", ")}</p>
        )}
        <p style={{ fontSize: 9, color: "#334155", fontFamily: "monospace", margin: "0 0 10px" }}>
          {trip.location?.lat?.toFixed(4)}, {trip.location?.lng?.toFixed(4)}
        </p>
        <a href={trip.location?.url} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 10, fontWeight: 700, color: mc, textDecoration: "none", background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.35)`, padding: "4px 12px", borderRadius: 7, display: "inline-block" }}>
          Google Maps ↗
        </a>
      </div>
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
    (acc, t) => { const p = tripPhase(t); acc.total++; acc[p] = (acc[p] || 0) + 1; return acc; },
    { total: 0, active: 0, upcoming: 0, completed: 0 }
  );

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

      {/* selected trip */}
      {trips.length > 0 && (
        <div className="rounded-2xl border overflow-hidden animate-fade-in"
          style={{ background: "linear-gradient(135deg,rgba(15,23,42,0.95) 0%,rgba(30,41,59,0.9) 100%)", border: "1px solid rgba(99,102,241,0.25)", boxShadow: "0 0 0 1px rgba(99,102,241,0.1),0 8px 32px rgba(0,0,0,0.4)" }}
        >
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800/80"
            style={{ background: "linear-gradient(90deg,rgba(99,102,241,0.08) 0%,transparent 100%)" }}
          >
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-live-dot" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selected Trip</span>
            <select
              value={selectedTripId || ""}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="flex-1 max-w-xs px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-600/60 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
            >
              <option value="">— choose a trip —</option>
              {trips.map((t) => <option key={t._id} value={t._id}>{t.tripName}</option>)}
            </select>
            <Link to="/admin/trips" className="text-xs text-indigo-400 hover:text-indigo-300 shrink-0 transition-colors ml-auto">
              Manage trips →
            </Link>
          </div>

          {selectedTrip ? (
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-52 shrink-0 relative overflow-hidden">
                {selectedTrip.coverImage
                  ? <img src={selectedTrip.coverImage} alt={selectedTrip.tripName} className="w-full h-40 sm:h-full object-cover" />
                  : <div className="w-full h-40 sm:h-full bg-gradient-to-br from-indigo-900/60 to-slate-900 flex items-center justify-center"><span className="text-6xl opacity-20">✈️</span></div>
                }
              </div>
              <div className="flex-1 p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-black text-white">{selectedTrip.tripName}</h2>
                    {(selectedTrip.startDate || selectedTrip.endDate) && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selectedTrip.startDate ? new Date(selectedTrip.startDate).toLocaleDateString() : "?"}
                        {" → "}
                        {selectedTrip.endDate ? new Date(selectedTrip.endDate).toLocaleDateString() : "ongoing"}
                      </p>
                    )}
                    {selectedTrip.location?.name && (
                      <a href={selectedTrip.location.url} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors mt-0.5 flex items-center gap-1">
                        📍 {selectedTrip.location.name.split(",")[0]} ↗
                      </a>
                    )}
                  </div>
                  <span className={`text-[11px] px-3 py-1 rounded-full border capitalize font-semibold ${phaseBadge(tripPhase(selectedTrip))}`}>
                    {tripPhase(selectedTrip)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Members",   value: memberCount != null ? memberCount : (hub?.memberCount ?? "—"), icon: "👥" },
                    { label: "Collected", value: hub ? `₹${(hub.totalCollected || 0).toLocaleString()}` : "—",  icon: "💳" },
                    { label: "Spent",     value: hub ? `₹${(hub.totalSpent || 0).toLocaleString()}`     : "—",  icon: "💸" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl px-3 py-2.5 border border-slate-700/60 shimmer-parent" style={{ background: "rgba(30,41,59,0.7)" }}>
                      <div className="shimmer-child" />
                      <p className="text-[10px] text-slate-500">{s.icon} {s.label}</p>
                      <p className="text-base font-bold text-white mt-0.5">{s.value}</p>
                    </div>
                  ))}
                </div>
                {hub && <BudgetBar spent={hub.totalSpent} total={hub.totalBudget || selectedTrip.budget} />}
              </div>
            </div>
          ) : (
            <p className="px-5 py-10 text-slate-500 text-sm text-center">Select a trip above to see its details.</p>
          )}
        </div>
      )}

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
