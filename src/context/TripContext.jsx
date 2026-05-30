import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAppSelector } from "../hooks";
import { getAdminTrips, getUserTrips } from "../services/trips";
import { ROLES } from "../constants/enum";
import { tripPhase } from "../components/trip/tripUtils";

const STORAGE_KEY = "syncetra_selected_trip";

function pickDefaultTripId(trips) {
  if (!trips.length) return "";
  const active = trips.find((t) => tripPhase(t) === "active");
  if (active) return active._id;
  const idx = Math.floor(Math.random() * trips.length);
  return trips[idx]._id;
}

const TripContext = createContext(null);

export function TripProvider({ children }) {
  const { isLogin, userInfo } = useAppSelector((s) => s.user);
  const role = userInfo?.user?.role;
  const isAdmin = role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripIdState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || ""
  );
  const [loading, setLoading] = useState(false);
  const manualTripPickRef = useRef(false);

  const loadTrips = useCallback(async () => {
    if (!isLogin) return;
    setLoading(true);
    try {
      const res = isAdmin ? await getAdminTrips() : await getUserTrips();
      const list = res?.data || [];
      const normalized = list.map((t) => ({
        ...t,
        location: t.location ||
          (t.latitude && t.longitude
            ? {
                name: t.locationName || `${t.latitude}, ${t.longitude}`,
                lat: Number(t.latitude),
                lng: Number(t.longitude),
                url: t.mapLink || `https://maps.google.com/?q=${t.latitude},${t.longitude}`,
              }
            : null),
      }));
      setTrips(normalized);
      setSelectedTripIdState((current) => {
        if (!normalized.length) return "";

        const valid = normalized.find((t) => String(t._id) === String(current));

        if (!manualTripPickRef.current) {
          const id = pickDefaultTripId(normalized);
          if (String(id) !== String(current)) {
            localStorage.setItem(STORAGE_KEY, id);
          }
          return id;
        }

        if (!valid) {
          const id = pickDefaultTripId(normalized);
          localStorage.setItem(STORAGE_KEY, id);
          return id;
        }
        return current;
      });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isLogin]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const setSelectedTripId = (id) => {
    manualTripPickRef.current = true;
    setSelectedTripIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const selectedTrip = trips.find((t) => t._id === selectedTripId) || null;

  return (
    <TripContext.Provider
      value={{
        trips,
        selectedTrip,
        selectedTripId,
        setSelectedTripId,
        loadTrips,
        loading,
        isAdmin,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export const useTrip = () => {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrip must be used within TripProvider");
  return ctx;
};
