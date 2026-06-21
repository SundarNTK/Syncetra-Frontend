import { removePendingFromCache, updateItemByQueueId } from './localStore';
import { dequeue, updateQueueData } from './offlineQueue';

const getStoredUserId = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem('GROUP_ALARM_USER') || 'null');
    const user = parsed?.user;
    return user?._id ?? user?.id ?? null;
  } catch { return null; }
};

/**
 * Permanently discard a locally-created pending item (was never synced to server).
 * Removes from both the IndexedDB api_cache and the pending_requests queue.
 * Call this when the user explicitly deletes a NOT SYNCED item while offline.
 */
export const deletePendingItem = async (item) => {
  const userId = getStoredUserId();
  if (!userId || !item._queueId || !item._cacheKey) return;
  await Promise.all([
    removePendingFromCache(userId, item._cacheKey, item._queueId),
    dequeue(item._queueId),
  ]);
};

/**
 * Update a locally-created pending item's fields before it syncs.
 * Updates both the api_cache entry and the queue payload so the correct
 * data is sent to the server when connectivity is restored.
 */
export const updatePendingItem = async (item, updates) => {
  const userId = getStoredUserId();
  if (!userId || !item._queueId || !item._cacheKey) return;
  // Strip internal offline fields from the queue payload
  // eslint-disable-next-line no-unused-vars
  const { _id, _pending, _queueId, _cacheKey, ...baseData } = item;
  await Promise.all([
    updateItemByQueueId(userId, item._cacheKey, item._queueId, updates),
    updateQueueData(item._queueId, { ...baseData, ...updates }),
  ]);
};
