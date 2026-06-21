import { useEffect, useRef } from 'react';
import { useAppSelector } from './index';
import { ROLES } from '../constants/enum';
import {
  getAdminTrips,
  getUserTrips,
  getExpenses,
  getTasks,
  getAttendance,
  getVehicles,
  getTripMembers,
  getChecklists,
  getTripHub,
  getItinerary,
  getSchedules,
} from '../services/trips';
import { getAdminGroups } from '../services/groups';

const SELECTED_TRIP_KEY = 'syncetra_selected_trip';

/**
 * On login (or when coming back online after login), pre-fetches all key trip
 * data so the app works fully offline on the next disconnection.
 * Every call goes through apiGet which automatically saves responses to IndexedDB.
 */
export const usePrefetchOnLogin = () => {
  const userId  = useAppSelector((s) => s.user.userInfo?.user?._id);
  const role    = useAppSelector((s) => s.user.userInfo?.user?.role);
  const isAdmin = role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
  const didPrefetch = useRef(false);

  useEffect(() => {
    if (!userId || !navigator.onLine) return;
    // Run once per login session; reset when userId changes (re-login)
    didPrefetch.current = false;
  }, [userId]);

  useEffect(() => {
    if (!userId || !navigator.onLine || didPrefetch.current) return;
    didPrefetch.current = true;

    const run = async () => {
      try {
        // 1. Fetch trip list (cached automatically by apiGet)
        const tripsRes = isAdmin ? await getAdminTrips() : await getUserTrips();
        const trips    = tripsRes?.data || [];
        if (!trips.length) return;

        // 2. Also cache groups (used in expenses page)
        if (isAdmin) getAdminGroups().catch(() => {});

        // 3. Determine which trip to deep-prefetch
        //    Priority: last selected → active → first
        const selectedId  = localStorage.getItem(SELECTED_TRIP_KEY);
        const targetTrip  =
          trips.find((t) => String(t._id) === String(selectedId)) ||
          trips.find((t) => t.status === 'active') ||
          trips[0];

        if (!targetTrip) return;
        const id = targetTrip._id;

        // 4. Prefetch all detail pages for the target trip in parallel
        //    All go through apiGet → IndexedDB cache populated
        await Promise.allSettled([
          getTripHub(id),
          getExpenses(id, isAdmin),
          getTasks(id, isAdmin),
          getTripMembers(id, isAdmin),
          getVehicles(id),
          getChecklists(id, isAdmin),
          getItinerary(id, isAdmin),
          getSchedules(id, isAdmin),
          ...(isAdmin ? [getAttendance(id)] : []),
        ]);
      } catch {
        // Prefetch is best-effort; failures are silently ignored
      }
    };

    run();
  }, [userId, isAdmin]); // Runs once per login (userId appears for the first time)
};
