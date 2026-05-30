import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getTripLocation } from "./tripUtils";

const SATELLITE_TILES = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution:
    '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
};

const LABEL_TILES = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
};

const PIN_ICON = L.divIcon({
  className: "",
  html: `<div style="
    width:28px;height:28px;
    background:linear-gradient(135deg,#10b981,#059669);
    border:3px solid #fff;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    box-shadow:0 2px 14px rgba(16,185,129,0.7),0 0 0 4px rgba(16,185,129,0.2);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function MapReady() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function TripLocationMap({ trip, className = "" }) {
  const location = getTripLocation(trip);

  if (!location?.lat || !location?.lng) {
    return (
      <div className={`rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-6 text-center ${className}`}>
        <p className="text-xs text-slate-500">No location pinned for this trip</p>
      </div>
    );
  }

  const center = [location.lat, location.lng];

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="rounded-xl overflow-hidden border border-slate-700/60 h-44 sm:h-48">
        <MapContainer
          center={center}
          zoom={12}
          scrollWheelZoom={false}
          className="h-full w-full"
          style={{ background: "#0f172a" }}
        >
          <MapReady />
          <TileLayer url={SATELLITE_TILES.url} attribution={SATELLITE_TILES.attribution} />
          <TileLayer url={LABEL_TILES.url} />
          <Marker position={center} icon={PIN_ICON} />
        </MapContainer>
      </div>
      {location.name && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <p className="text-slate-400 truncate">📍 {location.name}</p>
          {location.url && (
            <a
              href={location.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-emerald-400 hover:text-emerald-300"
            >
              Open in Maps ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}
