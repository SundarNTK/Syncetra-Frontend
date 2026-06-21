import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAppSelector } from "../hooks";
import { useOnlineReload } from "../hooks/useOnlineReload";
import { getAdminTrips, getUserTrips } from "../services/trips";
import { ROLES } from "../constants/enum";
import { tripPhase } from "../components/trip/tripUtils";

const SELECTED_TRIP_KEY = "syncetra_selected_trip";

// Per-user localStorage key for the trips list (survives offline / page refresh)
const tripsLsKey = (userId) => `syncetra_trips_${userId}`;

/** Read trips for the current user from localStorage synchronously. */
const loadCachedTrips = () => {
  try {
    const raw = localStorage.getItem("GROUP_ALARM_USER"); // same as STORAGE_KEYS.USER
    const user = raw ? JSON.parse(raw) : null;
    const userId = user?.user?._id ?? user?.user?.id;
    if (!userId) return [];
    const cached = localStorage.getItem(tripsLsKey(userId));
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
};

function pickDefaultTripId(trips) {
  if (!trips.length) return "";
  const active = trips.find((t) => tripPhase(t) === "active");
  if (active) return active._id;
  return trips[Math.floor(Math.random() * trips.length)]._id;
}

const TripContext = createContext(null);

export function TripProvider({ children }) {
  const { isLogin, userInfo } = useAppSelector((s) => s.user);
  const role    = userInfo?.user?.role;
  const userId  = userInfo?.user?._id ?? userInfo?.user?.id;
  const isAdmin = role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;

  // Seed from localStorage immediately so the UI shows trips on offline refresh
  const [trips, setTrips] = useState(loadCachedTrips);
  const [selectedTripId, setSelectedTripIdState] = useState(
    () => localStorage.getItem(SELECTED_TRIP_KEY) || ""
  );
  const [loading, setLoading] = useState(false);
  const manualTripPickRef = useRef(false);

  const loadTrips = useCallback(async () => {
    if (!isLogin) return;
    setLoading(true);
    try {
      const res  = isAdmin ? await getAdminTrips() : await getUserTrips();

      // apiGet returns null on any connectivity failure (offline, ENOTFOUND, no cache).
      // Preserve current state — could be the localStorage seed or a previously-loaded list.
      if (res === null) return;

      const list = res?.data || [];

      // Empty response from server while offline (cache miss) — keep current state
      if (!list.length && !navigator.onLine) return;

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

      // Persist to localStorage for instant offline availability on next page load
      if (userId && normalized.length > 0) {
        try {
          localStorage.setItem(tripsLsKey(userId), JSON.stringify(normalized));
        } catch { /* storage full — ignore */ }
      }

      setTrips(normalized);
      setSelectedTripIdState((current) => {
        if (!normalized.length) return current; // don't wipe the selected id

        const valid = normalized.find((t) => String(t._id) === String(current));

        if (!manualTripPickRef.current) {
          const id = pickDefaultTripId(normalized);
          if (String(id) !== String(current)) localStorage.setItem(SELECTED_TRIP_KEY, id);
          return id;
        }

        if (!valid) {
          const id = pickDefaultTripId(normalized);
          localStorage.setItem(SELECTED_TRIP_KEY, id);
          return id;
        }
        return current;
      });
    } catch {
      // Network / server error — preserve whatever trips are currently in state
      // (the localStorage seed or a previously-loaded list).
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isLogin, userId]);

  useEffect(() => { loadTrips(); }, [loadTrips]);
  useOnlineReload(loadTrips);

  const setSelectedTripId = (id) => {
    manualTripPickRef.current = true;
    setSelectedTripIdState(id);
    localStorage.setItem(SELECTED_TRIP_KEY, id);
  };

  const selectedTrip = trips.find((t) => t._id === selectedTripId) || null;

  return (
    <TripContext.Provider
      value={{ trips, selectedTrip, selectedTripId, setSelectedTripId, loadTrips, loading, isAdmin }}
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
