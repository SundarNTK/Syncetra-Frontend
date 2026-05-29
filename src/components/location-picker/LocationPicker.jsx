import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ── Custom pin icon (no image dependency) ────────────────────────────────── */
const PIN_ICON = L.divIcon({
  className: "",
  html: `<div style="
    width:28px;height:28px;
    background:linear-gradient(135deg,#ef4444,#dc2626);
    border:3px solid #fff;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    box-shadow:0 2px 14px rgba(239,68,68,0.7),0 0 0 4px rgba(239,68,68,0.2);
    position:relative;
  "><div style="
    position:absolute;inset:3px;
    border-radius:50%;
    background:rgba(255,255,255,0.3);
  "></div></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -30],
});

/* ── Helper: pan map to new center ───────────────────────────────────────── */
function PanTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom || 13, { animate: true });
  }, [center, zoom, map]);
  return null;
}

/* ── Helper: fix size after modal open ───────────────────────────────────── */
function MapReady() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 120);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

/* ── Click handler ───────────────────────────────────────────────────────── */
function ClickHandler({ onClick }) {
  useMapEvents({ click: (e) => onClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

/* ── Nominatim helpers ───────────────────────────────────────────────────── */
async function searchPlaces(q) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`,
    { headers: { "Accept-Language": "en" } }
  );
  return res.json();
}

async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { "Accept-Language": "en" } }
  );
  return res.json();
}

/* ── LocationPicker ──────────────────────────────────────────────────────── */
export default function LocationPicker({ value, onChange }) {
  const [query,     setQuery]     = useState(value?.name?.split(",")[0] || "");
  const [results,   setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [panTo,     setPanTo]     = useState(
    value ? [value.lat, value.lng] : null
  );
  const debounce = useRef(null);

  const DEFAULT_CENTER = [20.5937, 78.9629]; // India
  const mapCenter      = value ? [value.lat, value.lng] : DEFAULT_CENTER;

  /* Search */
  const doSearch = useCallback(async (q) => {
    if (q.length < 3) { setResults([]); return; }
    setSearching(true);
    try {
      const data = await searchPlaces(q);
      setResults(data || []);
    } catch { setResults([]); }
    finally { setSearching(false); }
  }, []);

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => doSearch(q), 380);
  };

  const pickResult = (r) => {
    const lat  = parseFloat(r.lat);
    const lng  = parseFloat(r.lon);
    const name = r.display_name;
    const url  = `https://maps.google.com/?q=${lat},${lng}`;
    setResults([]);
    setQuery(name.split(",")[0]);
    setPanTo([lat, lng]);
    onChange({ name, lat, lng, url });
  };

  const handleMapClick = async (lat, lng) => {
    const url = `https://maps.google.com/?q=${lat},${lng}`;
    let name  = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    try {
      const data = await reverseGeocode(lat, lng);
      if (data?.display_name) name = data.display_name;
    } catch {}
    setQuery(name.split(",")[0]);
    setPanTo([lat, lng]);
    onChange({ name, lat, lng, url });
  };

  const clear = () => {
    setQuery("");
    setResults([]);
    setPanTo(null);
    onChange(null);
  };

  return (
    <div className="space-y-2.5">
      {/* Search input */}
      <div className="relative">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">🔍</span>
          <input
            type="text"
            value={query}
            onChange={handleInput}
            onFocus={() => query.length >= 3 && doSearch(query)}
            placeholder="Search location (city, landmark…)"
            className="w-full pl-9 pr-8 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-emerald-600/60 focus:outline-none transition-colors"
          />
          {(searching) && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs animate-pulse">…</span>
          )}
          {value && !searching && (
            <button
              type="button"
              onClick={clear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {results.length > 0 && (
          <ul className="absolute z-[9999] top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            {results.map((r) => (
              <li key={r.place_id}>
                <button
                  type="button"
                  onMouseDown={() => pickResult(r)}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-800 transition-colors border-b border-slate-800 last:border-0"
                >
                  <p className="text-sm text-white truncate">{r.display_name.split(",")[0]}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{r.display_name}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          height: 300,
          position: "relative",
          border: "2px solid rgba(99,102,241,0.35)",
          boxShadow: "0 0 0 1px rgba(99,102,241,0.1), 0 4px 20px rgba(0,0,0,0.3)",
        }}
        onClick={() => setResults([])}
      >
        <MapContainer
          center={mapCenter}
          zoom={value ? 14 : 5}
          style={{ height: "100%", width: "100%", background: "#e8f4f8" }}
          className="location-picker-map"
          zoomControl={true}
          attributionControl={false}
        >
          {/* Colorful OSM standard tiles with good detail */}
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapReady />
          <ClickHandler onClick={handleMapClick} />
          {panTo && <PanTo center={panTo} zoom={13} />}
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={PIN_ICON}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  handleMapClick(lat, lng);
                },
              }}
            />
          )}
        </MapContainer>
        <p className="absolute bottom-2 right-2 z-[1000] text-[10px] text-white/50 pointer-events-none bg-black/40 px-2 py-0.5 rounded">
          Click map to pin · drag to adjust
        </p>
      </div>

      {/* Selected location preview */}
      {value && (
        <div className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-emerald-900/20 border border-emerald-700/30 animate-fade-in">
          <span className="text-emerald-400 text-lg shrink-0 mt-0.5">📍</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{value.name.split(",")[0]}</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{value.name}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <a
              href={value.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              Google Maps ↗
            </a>
            <button
              type="button"
              onClick={clear}
              className="text-[11px] text-slate-500 hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
