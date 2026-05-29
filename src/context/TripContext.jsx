import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAppSelector } from "../hooks";
import { getAdminTrips, getUserTrips } from "../services/trips";
import { ROLES } from "../constants/enum";

const STORAGE_KEY = "syncetra_selected_trip";

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
        if (normalized.length && !normalized.find((t) => t._id === current)) {
          const first = normalized[0]._id;
          localStorage.setItem(STORAGE_KEY, first);
          return first;
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
