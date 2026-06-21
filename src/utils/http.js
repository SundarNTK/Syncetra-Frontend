import axios from "axios";
import CONFIG from "../config";
import { API_SCOPE } from "../constants/enum";
import { CLEAR_USER } from "../store/userSlice";
import { enqueue } from "./offlineQueue";
import {
  getCache,
  setCache,
  appendPendingToCache,
  updatePendingInCache,
  markDeletePendingInCache,
} from "./localStore";

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

let storeRef = null;

const getUserId = () => storeRef?.getState()?.user?.userInfo?.user?._id ?? null;

export const setupHttpInterceptor = (store) => {
  storeRef = store;

  http.interceptors.request.use((config) => {
    const token = storeRef?.getState()?.user?.userInfo?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  http.interceptors.response.use(
    (res) => res.data,
    async (error) => {
      if (error.response?.status === 401) {
        storeRef?.dispatch(CLEAR_USER());
        window.location.hash = "#/login";
      }

      const method      = error.config?.method?.toUpperCase();
      // Queue when:
      //  a) browser is explicitly offline (navigator.onLine=false), OR
      //  b) no HTTP response came back at all (pure network failure)
      // This covers both production (no internet) and dev (Vite proxy reaches
      // localhost but MongoDB/backend is unavailable and still returns responses).
      const isOffline    = !navigator.onLine;
      const isNetworkErr = !error.response;
      const isWriteOp    = WRITE_METHODS.has(method);
      const isFormData   = error.config?.data instanceof FormData;

      if ((isOffline || isNetworkErr) && isWriteOp && !isFormData) {
        const userId = getUserId();
        if (userId) {
          const rawData = error.config.data;
          const data    = typeof rawData === 'string' ? JSON.parse(rawData) : (rawData ?? {});
          const url     = error.config.url;

          const queueId = await enqueue({ userId, method, url, data });

          // Patch the local cache so the pending item appears in lists immediately
          await _patchCacheForWrite(userId, method, url, data, queueId).catch(() => {});

          const err    = new Error('Offline — saved locally and will sync when reconnected.');
          err.offline  = true;
          err.queued   = true;
          err.queueId  = queueId;
          return Promise.reject(err);
        }
      }

      const message = error.response?.data?.message || error.message || 'Request failed';
      return Promise.reject(new Error(message));
    }
  );
};

/**
 * Patches the local cache to immediately reflect a write that was queued offline.
 * POST  → appends a pending item to the collection cache
 * PUT   → marks the item as pending in the collection cache
 * DELETE → marks the item as pending-delete in the collection cache
 */
async function _patchCacheForWrite(userId, method, url, data, queueId) {
  if (method === 'POST') {
    const pendingItem = { ...data, _id: `offline_${queueId}`, _pending: true, _queueId: queueId };
    await appendPendingToCache(userId, url, pendingItem);
  } else if (method === 'PUT' || method === 'PATCH') {
    const collectionUrl = url.replace(/\/[^/]+$/, '');
    const itemId        = url.split('/').pop();
    await updatePendingInCache(userId, collectionUrl, itemId, { ...data, _queueId: queueId });
  } else if (method === 'DELETE') {
    const collectionUrl = url.replace(/\/[^/]+$/, '');
    const itemId        = url.split('/').pop();
    await markDeletePendingInCache(userId, collectionUrl, itemId);
  }
}

const http = axios.create({
  baseURL: CONFIG.apiBaseUrl,
  timeout: 30000,
});

export const getApiPath = (scope) =>
  scope === API_SCOPE.ADMIN ? CONFIG.adminApiPath : CONFIG.userApiPath;

/** Collapse duplicate in-flight GETs (React Strict Mode double-mount). */
const inflightGets = new Map();

const getInflightKey = (url, config = {}) => {
  const params = config.params != null ? JSON.stringify(config.params) : '';
  return `${url}|${params}`;
};

/**
 * Cache-aware GET.
 * Online  → fetch from server, save to IndexedDB cache, return data.
 * Offline → return IndexedDB cached data (null if no cache yet).
 *
 * Returning null (not throwing) lets callers with ?. and || [] display
 * gracefully and lets the finally block in load() clear the spinner.
 */
export const apiGet = async (scope, path, config = {}) => {
  const url      = `${getApiPath(scope)}${path}`;
  const cacheKey = getInflightKey(url, config);
  const userId   = getUserId();

  if (!navigator.onLine) {
    if (!userId) return null;
    return getCache(userId, cacheKey);   // null if nothing cached yet
  }

  // Online path: dedupe, cache on success, fall back to cache on any failure
  const key = cacheKey;
  if (inflightGets.has(key)) return inflightGets.get(key);

  const request = http.get(url, config)
    .then((data) => {
      if (userId) setCache(userId, cacheKey, data).catch(() => {});
      return data;
    })
    .catch(async (err) => {
      // Server unreachable or returned a hard error — serve stale cache if available
      if (userId) {
        const cached = await getCache(userId, cacheKey);
        if (cached !== null) return cached;
      }
      throw err; // Nothing in cache either — propagate so UI shows empty state
    })
    .finally(() => inflightGets.delete(key));

  inflightGets.set(key, request);
  return request;
};

export const apiPost = (scope, path, data, config = {}) =>
  http.post(`${getApiPath(scope)}${path}`, data, config);

export const apiPut = (scope, path, data, config = {}) =>
  http.put(`${getApiPath(scope)}${path}`, data, config);

export const apiDelete = (scope, path, config = {}) =>
  http.delete(`${getApiPath(scope)}${path}`, config);

export default http;
