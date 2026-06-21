import { useCallback, useEffect, useRef } from 'react';
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
  getMedia,
  getUserAttendance,
  getUserVehicles,
  getMyShareCollection,
} from '../services/trips';
import { getAdminGroups } from '../services/groups';
import { getPolls, getUserPolls } from '../services/polls';
import { getAdminAlarms, getUserAlarmHistory } from '../services/alarms';
import { getAdmins } from '../services/users';

const SELECTED_TRIP_KEY = 'syncetra_selected_trip';

/**
 * On login AND on every reconnect, pre-fetches ALL trip data so the app works
 * fully offline on the next disconnection.  Every call goes through apiGet which
 * automatically saves responses to IndexedDB.
 *
 * Running on every reconnect (not just login) means a cleared or cold IndexedDB
 * is automatically repopulated the moment connectivity is restored.
 */
export const usePrefetchOnLogin = () => {
  const userId  = useAppSelector((s) => s.user.userInfo?.user?._id ?? s.user.userInfo?.user?.id);
  const role    = useAppSelector((s) => s.user.userInfo?.user?.role);
  const isAdmin = role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
  const running = useRef(false);

  const runPrefetch = useCallback(async () => {
    if (!userId || !navigator.onLine || running.current) return;
    running.current = true;
    try {
      // 1. Fetch + cache the trips list
      const tripsRes = isAdmin ? await getAdminTrips() : await getUserTrips();
      const trips    = tripsRes?.data || [];
      if (!trips.length) return;

      // 2. Cache shared master data
      if (isAdmin) {
        getAdminGroups().catch(() => {});
        getAdminAlarms().catch(() => {});
        getAdmins().catch(() => {});
        getPolls({}).catch(() => {});
      } else {
        getUserPolls({}).catch(() => {});
        getUserAlarmHistory().catch(() => {});
      }

      // 3. Identify the priority trip for deep prefetch
      const selectedId = localStorage.getItem(SELECTED_TRIP_KEY);
      const targetTrip =
        trips.find((t) => String(t._id) === String(selectedId)) ||
        trips.find((t) => t.status === 'active') ||
        trips[0];

      if (!targetTrip) return;
      const primaryId = targetTrip._id;

      // 4. Deep-prefetch the priority trip (all pages)
      await Promise.allSettled([
        getTripHub(primaryId),
        getExpenses(primaryId, isAdmin),
        getTasks(primaryId, isAdmin),
        getTripMembers(primaryId, isAdmin),
        getVehicles(primaryId),
        getChecklists(primaryId, isAdmin),
        getItinerary(primaryId, isAdmin),
        getSchedules(primaryId, isAdmin),
        getMedia(primaryId, {}, isAdmin),
        ...(isAdmin
          ? [getAttendance(primaryId)]
          : [getUserAttendance(primaryId), getUserVehicles(primaryId), getMyShareCollection(primaryId)]
        ),
      ]);

      // 5. Light-prefetch hub + expenses + tasks for all other trips (background,
      //    capped to 9 trips to avoid flooding the network)
      const otherTrips = trips
        .filter((t) => String(t._id) !== String(primaryId))
        .slice(0, 9);

      if (otherTrips.length) {
        Promise.allSettled(
          otherTrips.flatMap((t) => [
            getTripHub(t._id).catch(() => {}),
            getExpenses(t._id, isAdmin).catch(() => {}),
            getTasks(t._id, isAdmin).catch(() => {}),
          ])
        );
      }
    } catch {
      // Prefetch is best-effort; failures are silently ignored
    } finally {
      running.current = false;
    }
  }, [userId, isAdmin]);

  // Run on login (userId becomes available)
  useEffect(() => {
    if (!userId || !navigator.onLine) return;
    runPrefetch();
  }, [userId, isAdmin, runPrefetch]);

  // Re-run every time the browser comes back online so a cleared IndexedDB
  // (incognito, browser data clear, first install) is repopulated automatically.
  useEffect(() => {
    const handleOnline = () => runPrefetch();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [runPrefetch]);
};
