import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppSelector } from './index';
import { getQueueForUser, dequeue } from '../utils/offlineQueue';
import { removePendingFromCache, clearPendingFlag } from '../utils/localStore';
import { getApiPath } from '../utils/http';
import http from '../utils/http';

/** Fired after the queue is fully drained so any mounted list re-fetches fresh data. */
const SYNC_EVENT = 'syncetra:synced';

export const useOfflineSync = () => {
  const userId   = useAppSelector((s) => s.user.userInfo?.user?._id ?? s.user.userInfo?.user?.id);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing,    setIsSyncing]    = useState(false);
  const [isOnline,     setIsOnline]     = useState(navigator.onLine);
  const syncing = useRef(false);

  const refreshCount = useCallback(async () => {
    if (!userId) { setPendingCount(0); return; }
    const items = await getQueueForUser(userId);
    setPendingCount(items.length);
  }, [userId]);

  const drainQueue = useCallback(async () => {
    if (!userId || syncing.current || !navigator.onLine) return;

    const items = await getQueueForUser(userId);
    if (items.length === 0) return;

    syncing.current = true;
    setIsSyncing(true);

    // Map "offline_<queueId>" → real MongoDB _id, built from POST responses.
    // Lets subsequent PUT/PATCH/DELETE items in the same session use the real id.
    const offlineToReal = {};

    let synced = 0;
    for (const item of items) {
      try {
        // Rewrite URL if the last path segment is an offline placeholder id.
        // e.g. /api/v1/trip_checklists/offline_1782051303982_huu0z6 → real mongo id
        let url = item.url;
        const pathPart   = url.split('?')[0];
        const pathSegs   = pathPart.split('/');
        const lastSeg    = pathSegs[pathSegs.length - 1];
        if (lastSeg.startsWith('offline_')) {
          const realId = offlineToReal[lastSeg];
          if (!realId) {
            // Parent POST was never synced (dropped or from a previous session).
            // We have no real id to target — drop this item to avoid a 400 cast error.
            await dequeue(item.id);
            continue;
          }
          pathSegs[pathSegs.length - 1] = realId;
          const qs = url.includes('?') ? url.slice(url.indexOf('?')) : '';
          url = pathSegs.join('/') + qs;
        }

        const res = await http.request({ method: item.method, url, data: item.data, _skipQueue: true });

        // After a successful POST, remember the server-assigned _id so later items
        // that reference this offline placeholder can be rewritten.
        if (item.method === 'POST') {
          const realId = res?._id ?? res?.data?._id ?? res?.id ?? res?.data?.id;
          if (realId) offlineToReal[`offline_${item.id}`] = String(realId);
        }

        await dequeue(item.id);

        // Clean up the pending flag from the local cache for this item.
        // Cache keys use the `${url}|` format (matching apiGet's getInflightKey),
        // so we must append '|' to make the lookup land on the right entry.
        const baseUrl    = item.method === 'POST'
          ? url
          : url.replace(/\/[^/]+$/, '');
        const cacheKey   = baseUrl + '|';

        if (item.method === 'POST') {
          // The server assigned a real _id — remove the offline placeholder
          await removePendingFromCache(userId, cacheKey, item.id).catch(() => {});
        } else {
          await clearPendingFlag(userId, cacheKey, item.id).catch(() => {});
        }

        synced++;
      } catch (err) {
        if (!err.status) break;  // No HTTP status → network failure → stop and retry later
        await dequeue(item.id);  // Has HTTP status (4xx/5xx) → server rejected → drop it
      }
    }

    syncing.current = false;
    setIsSyncing(false);
    await refreshCount();

    if (synced > 0) {
      window.dispatchEvent(new Event(SYNC_EVENT));
    }

    // If items remain and we're still online, schedule a retry
    if (navigator.onLine) {
      const remaining = await getQueueForUser(userId);
      if (remaining.length > 0) {
        setTimeout(() => {
          if (navigator.onLine && !syncing.current) drainQueue();
        }, 3000);
      }
    }
  }, [userId, refreshCount]);

  useEffect(() => {
    const goOnline  = () => {
      setIsOnline(true);
      // Pre-set syncing flag synchronously so the banner immediately shows
      // "Syncing…" (blue) instead of briefly flashing "Back online — syncing…" (green).
      setIsSyncing(true);
      drainQueue().finally(() => setIsSyncing(false));
    };
    const goOffline = () => { setIsOnline(false); };
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [drainQueue]);

  // On login (userId becomes available) — count + drain
  useEffect(() => {
    if (!userId) return;
    refreshCount();
    if (navigator.onLine) drainQueue();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { pendingCount, isSyncing, isOnline };
};
