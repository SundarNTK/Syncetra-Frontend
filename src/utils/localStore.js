import { openDB } from './db';

const STORE = 'api_cache';

const key = (userId, cacheKey) => `${userId}:${cacheKey}`;

/* ── Primitives ──────────────────────────────────────────────────────────── */

export const getCache = async (userId, cacheKey) => {
  const db  = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key(userId, cacheKey));
    req.onsuccess = (e) => resolve(e.target.result?.data ?? null);
    req.onerror   = (e) => reject(e.target.error);
  });
};

export const setCache = async (userId, cacheKey, data) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ cacheKey: key(userId, cacheKey), userId, data, updatedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror   = (e) => reject(e.target.error);
  });
};

/* ── Helpers to read/write the nested .data array ─────────────────────── */

const getArray = (cached) => {
  if (!cached) return null;
  if (Array.isArray(cached?.data)) return { wrapper: cached, arr: cached.data, mode: 'object' };
  if (Array.isArray(cached))       return { wrapper: null,   arr: cached,      mode: 'array'  };
  return null;
};

const rebuildCache = (parsed, newArr) =>
  parsed.mode === 'object' ? { ...parsed.wrapper, data: newArr } : newArr;

/* ── Patch helpers called from http.js when a write is queued offline ─── */

/** Append a pending item (with _pending:true) to the cached collection list. */
export const appendPendingToCache = async (userId, cacheKey, pendingItem) => {
  const cached = await getCache(userId, cacheKey);
  const parsed = getArray(cached);
  if (!parsed) return;
  await setCache(userId, cacheKey, rebuildCache(parsed, [...parsed.arr, pendingItem]));
};

/** Update a specific item inside the cached list (for offline PUT). */
export const updatePendingInCache = async (userId, cacheKey, itemId, updates) => {
  const cached = await getCache(userId, cacheKey);
  const parsed = getArray(cached);
  if (!parsed) return;
  const newArr = parsed.arr.map((item) =>
    String(item._id) === String(itemId) ? { ...item, ...updates, _pending: true } : item
  );
  await setCache(userId, cacheKey, rebuildCache(parsed, newArr));
};

/** Mark an item as pending-delete in the cached list (for offline DELETE). */
export const markDeletePendingInCache = async (userId, cacheKey, itemId) => {
  const cached = await getCache(userId, cacheKey);
  const parsed = getArray(cached);
  if (!parsed) return;
  const newArr = parsed.arr.map((item) =>
    String(item._id) === String(itemId) ? { ...item, _pendingDelete: true, _pending: true } : item
  );
  await setCache(userId, cacheKey, rebuildCache(parsed, newArr));
};

/** Remove a pending item by its queue id (called after successful sync). */
export const removePendingFromCache = async (userId, cacheKey, queueId) => {
  const cached = await getCache(userId, cacheKey);
  const parsed = getArray(cached);
  if (!parsed) return;
  const newArr = parsed.arr.filter((item) => item._queueId !== queueId);
  await setCache(userId, cacheKey, rebuildCache(parsed, newArr));
};

/** Remove the _pending flag from an item (restore it to normal after sync). */
export const clearPendingFlag = async (userId, cacheKey, queueId) => {
  const cached = await getCache(userId, cacheKey);
  const parsed = getArray(cached);
  if (!parsed) return;
  const newArr = parsed.arr.map((item) => {
    if (item._queueId !== queueId) return item;
    // eslint-disable-next-line no-unused-vars
    const { _pending, _pendingDelete, _queueId, ...clean } = item;
    return clean;
  });
  await setCache(userId, cacheKey, rebuildCache(parsed, newArr));
};
