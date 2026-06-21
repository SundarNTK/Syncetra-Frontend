import { openDB } from './db';

const STORE = 'pending_requests';

/** Save a pending write to the queue. Returns the generated id. */
export const enqueue = async ({ userId, method, url, data }) => {
  const db = await openDB();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ id, userId, method, url, data, timestamp: Date.now() });
    tx.oncomplete = () => resolve(id);
    tx.onerror   = (e) => reject(e.target.error);
  });
};

/** All pending requests for a user, sorted oldest-first. */
export const getQueueForUser = async (userId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).index('by_user').getAll(userId);
    req.onsuccess = (e) => resolve(e.target.result.sort((a, b) => a.timestamp - b.timestamp));
    req.onerror   = (e) => reject(e.target.error);
  });
};

/** Remove a request from the queue after it has been successfully synced. */
export const dequeue = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror   = (e) => reject(e.target.error);
  });
};

/** Update the data payload of a queued request (for offline edits of pending items). */
export const updateQueueData = async (id, newData) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req   = store.get(id);
    req.onsuccess = (e) => {
      const item = e.target.result;
      if (item) store.put({ ...item, data: newData });
    };
    tx.oncomplete = () => resolve();
    tx.onerror    = (e) => reject(e.target.error);
  });
};

/** Count pending requests for a user. */
export const countForUser = async (userId) => {
  const items = await getQueueForUser(userId);
  return items.length;
};
