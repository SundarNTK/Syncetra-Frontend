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

    let synced = 0;
    for (const item of items) {
      try {
        await http.request({ method: item.method, url: item.url, data: item.data });
        await dequeue(item.id);

        // Clean up the pending flag from the local cache for this item.
        // Cache keys use the `${url}|` format (matching apiGet's getInflightKey),
        // so we must append '|' to make the lookup land on the right entry.
        const baseUrl    = item.method === 'POST'
          ? item.url
          : item.url.replace(/\/[^/]+$/, '');
        const cacheKey   = baseUrl + '|';

        if (item.method === 'POST') {
          // The server assigned a real _id — remove the offline placeholder
          await removePendingFromCache(userId, cacheKey, item.id).catch(() => {});
        } else {
          await clearPendingFlag(userId, cacheKey, item.id).catch(() => {});
        }

        synced++;
      } catch (err) {
        if (!err.response) break; // Still offline — stop
        await dequeue(item.id);   // Server rejected (4xx) — drop it, can't retry
      }
    }

    syncing.current = false;
    setIsSyncing(false);
    await refreshCount();

    if (synced > 0) {
      window.dispatchEvent(new Event(SYNC_EVENT));
    }
  }, [userId, refreshCount]);

  useEffect(() => {
    const goOnline  = () => { setIsOnline(true);  drainQueue(); };
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
