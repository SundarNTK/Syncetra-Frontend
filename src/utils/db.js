const DB_NAME = 'syncetra_offline';
const DB_VERSION = 2;

let _db = null;

/**
 * Opens (or re-uses) the shared IndexedDB.
 * Version 2 adds api_cache alongside the existing pending_requests store.
 */
export const openDB = () => {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains('pending_requests')) {
        const s = db.createObjectStore('pending_requests', { keyPath: 'id' });
        s.createIndex('by_user', 'userId', { unique: false });
      }

      if (!db.objectStoreNames.contains('api_cache')) {
        const s = db.createObjectStore('api_cache', { keyPath: 'cacheKey' });
        s.createIndex('by_user', 'userId', { unique: false });
      }
    };

    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror  = (e) => reject(e.target.error);
  });
};
