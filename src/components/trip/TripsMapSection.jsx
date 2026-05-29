import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { tripPhase, fmtTripDateShort } from "./tripUtils";

const DEFAULT_MAP_CENTER = [20.5937, 78.9629];
const DEFAULT_MAP_ZOOM = 5;
/** Esri World Imagery — free satellite tiles (no API key) */
const DASH_MAP_TILES = {
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics, USDA FSA, USGS, AeroGRID, IGN, IGP, and the GIS User Community',
  },
  labels: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
  },
};

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
  const isActive = phase === "active";
  const isUpcoming = phase === "upcoming";
  const mc = isSelected ? "#a78bfa" : isActive ? "#f97316" : isUpcoming ? "#38bdf8" : "#94a3b8";
  const rgb = isSelected ? "167,139,250" : isActive ? "249,115,22" : isUpcoming ? "56,189,248" : "148,163,184";
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
    <div style="width:18px;height:18px;border-radius:50%;background:radial-gradient(circle,#fff9f4 0%,${mc} 48%,${dark} 100%);box-shadow:0 0 0 2.5px rgba(255,255,255,0.22),0 0 8px 3px ${mc},0 0 20px 6px rgba(${rgb},0.6);position:relative;z-index:5;"></div>
  </div>
  <div style="width:1px;height:9px;background:linear-gradient(rgba(${rgb},0.75),rgba(${rgb},0.05));"></div>
  <div style="background:rgba(255,255,255,0.96);color:#0f172a;font-size:10.5px;font-weight:700;font-family:system-ui,sans-serif;padding:3px 10px;border-radius:6px;border:2px solid ${mc};white-space:nowrap;max-width:170px;overflow:hidden;text-overflow:ellipsis;pointer-events:auto;">${name}</div>
</div>`,
    iconSize: [180, 65],
    iconAnchor: [90, 11],
    popupAnchor: [0, -11],
  });
}

function TripPopup({ trip, phase }) {
  const mc = phase === "active" ? "#f97316" : phase === "upcoming" ? "#38bdf8" : "#94a3b8";
  const rgb = phase === "active" ? "249,115,22" : phase === "upcoming" ? "56,189,248" : "148,163,184";
  return (
    <div className="trip-map-popup" style={{ width: 260, fontFamily: "system-ui,sans-serif" }}>
      {trip.coverImage && (
        <div
          className="trip-map-popup__cover"
          style={{ borderBottom: `2px solid rgba(${rgb},0.4)` }}
        >
          <img src={trip.coverImage} alt={trip.tripName} />
        </div>
      )}
      <div className="trip-map-popup__body">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <p style={{ fontWeight: 800, fontSize: 13, color: "#f1f5f9", margin: 0, flex: 1 }}>{trip.tripName}</p>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 99,
              textTransform: "capitalize",
              background: `rgba(${rgb},0.18)`,
              color: mc,
              border: `1px solid rgba(${rgb},0.4)`,
            }}
          >
            {phase}
          </span>
        </div>
        {(trip.startDate || trip.endDate) && (
          <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 8px" }}>
            📅 {fmtTripDateShort(trip.startDate)}
            {trip.endDate ? ` → ${fmtTripDateShort(trip.endDate)}` : ""}
          </p>
        )}
        {trip.location?.name && (
          <p style={{ fontSize: 10, color: "#475569", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            📍 {trip.location.name.split(",").slice(0, 2).join(", ")}
          </p>
        )}
        {trip.location?.url && (
          <a
            href={trip.location.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: mc,
              textDecoration: "none",
              background: `rgba(${rgb},0.12)`,
              border: `1px solid rgba(${rgb},0.35)`,
              padding: "4px 12px",
              borderRadius: 7,
              display: "inline-block",
            }}
          >
            Google Maps ↗
          </a>
        )}
      </div>
    </div>
  );
}

export default function TripsMapSection({ trips, selectedTripId, tripsLink = "/admin/trips", canEdit = true }) {
  const tripsWithLoc = trips.filter((t) => t.location?.lat && t.location?.lng);
  const activeCount = tripsWithLoc.filter((t) => tripPhase(t) === "active").length;
  const upcomingCount = tripsWithLoc.filter((t) => tripPhase(t) === "upcoming").length;
  const selectedTrip = trips.find((t) => String(t._id) === String(selectedTripId));
  const selectedHasLoc = selectedTrip?.location?.lat && selectedTrip?.location?.lng;

  const avgCenter =
    tripsWithLoc.length > 0
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
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{
        border: "1px solid rgba(249,115,22,0.2)",
        boxShadow: "0 0 0 1px rgba(249,115,22,0.06), 0 0 50px rgba(249,115,22,0.08), 0 12px 40px rgba(0,0,0,0.5)",
      }}
    >
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b cmd-header-grad">
        <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0 animate-live-dot" />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#fb923c" }}>
          Trip Locations
        </span>
        <div className="flex items-center gap-3 ml-2">
          {[
            { color: "#f97316", label: "Active", count: activeCount },
            { color: "#38bdf8", label: "Upcoming", count: upcomingCount },
            { color: "#94a3b8", label: "Done", count: tripsWithLoc.filter((t) => tripPhase(t) === "completed").length },
          ]
            .filter((l) => l.count > 0)
            .map((l) => (
              <span key={l.label} className="flex items-center gap-1 text-[10px]" style={{ color: l.color }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: l.color,
                    display: "inline-block",
                    boxShadow: `0 0 6px ${l.color}`,
                  }}
                />
                {l.count} {l.label}
              </span>
            ))}
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-[10px] text-slate-500">
            {tripsWithLoc.length}/{trips.length} mapped
          </span>
          {canEdit && (
            <Link to={tripsLink} className="text-[10px] font-semibold transition-colors" style={{ color: "#fb923c" }}>
              + Add location →
            </Link>
          )}
        </div>
      </div>

      <div style={{ height: 440, position: "relative", background: "#0c1220" }}>
        {tripsWithLoc.length === 0 && (
          <div
            style={{
              position: "absolute",
              top: 14,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 910,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 16px",
              borderRadius: 12,
              background: "rgba(4,8,16,0.82)",
              border: "1px solid rgba(249,115,22,0.25)",
              pointerEvents: "auto",
            }}
          >
            <span style={{ fontSize: 18, opacity: 0.7 }}>🗺️</span>
            <div>
              <p style={{ color: "#94a3b8", fontWeight: 600, margin: 0, fontSize: 12 }}>No trip locations pinned yet</p>
              <p style={{ color: "#475569", fontSize: 11, margin: "2px 0 0" }}>
                {canEdit ? "Add a location on a trip to see markers" : "Locations appear when admin pins them on trips"}
              </p>
            </div>
            {canEdit && (
              <Link
                to={tripsLink}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "5px 12px",
                  borderRadius: 8,
                  background: "rgba(249,115,22,0.15)",
                  border: "1px solid rgba(249,115,22,0.35)",
                  color: "#fb923c",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Add location →
              </Link>
            )}
          </div>
        )}

        <MapContainer
          center={DEFAULT_MAP_CENTER}
          zoom={DEFAULT_MAP_ZOOM}
          minZoom={3}
          maxZoom={18}
          style={{ height: "100%", width: "100%", background: "#0c1220", zIndex: 1 }}
          className="dash-map dash-map--satellite"
          zoomControl
          attributionControl
        >
          <TileLayer url={DASH_MAP_TILES.satellite.url} attribution={DASH_MAP_TILES.satellite.attribution} />
          <TileLayer url={DASH_MAP_TILES.labels.url} attribution="" opacity={0.78} />
          <MapInit />
          {flyTarget && <FlyToSelected center={flyTarget} zoom={flyZoom} />}
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
                <Popup maxWidth={280} closeButton={false}>
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
