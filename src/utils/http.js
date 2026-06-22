import axios from "axios";
import CONFIG from "../config";
import { API_SCOPE } from "../constants/enum";
import {
  getCache,
  setCache,
  appendPendingToCache,
  updatePendingInCache,
  markDeletePendingInCache,
} from "./localStore";
import { enqueue } from "./offlineQueue";

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// ── Auth / userId helpers ─────────────────────────────────────────────────────
// Reads directly from localStorage so these functions survive Vite HMR
// (which replaces the http.js module and resets any storeRef to null).

const LS_USER_KEY = 'GROUP_ALARM_USER';

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(LS_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getUserId   = () => {
  const user = getStoredUser()?.user;
  return user?._id ?? user?.id ?? null;
};
const getToken    = () => getStoredUser()?.token ?? null;

// Callback invoked on confirmed 401 so the Redux store can clear user state.
// Set once by main.jsx via setOnUnauthorized; survives as long as the module lives.
let onUnauthorizedCb = null;
export const setOnUnauthorized = (cb) => { onUnauthorizedCb = cb; };

// ── Axios instance ────────────────────────────────────────────────────────────

const http = axios.create({
  baseURL: CONFIG.apiBaseUrl,
  timeout: 30000,
});

// ── Request interceptor — attach Bearer token ─────────────────────────────────
http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor — unwrap data, handle errors ────────────────────────
http.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    // ── 401 handler ──────────────────────────────────────────────────────────
    if (error.response?.status === 401) {
      // Only clear session when the 401 was sent with the current token.
      // Stale in-flight requests (from before login) must not wipe a fresh session.
      const currentToken  = getToken();
      const requestToken  = error.config?.headers?.Authorization?.replace('Bearer ', '');
      if (currentToken && requestToken === currentToken) {
        localStorage.removeItem(LS_USER_KEY);
        onUnauthorizedCb?.();
        window.location.hash = '#/login';
      }
    }

    // ── Offline write queue ───────────────────────────────────────────────────
    const method      = error.config?.method?.toUpperCase();
    // Queue when the request could not reach the database, which can happen in 3 ways:
    //  a) browser is explicitly offline (navigator.onLine = false)
    //  b) no HTTP response came back at all (pure network failure / CORS)
    //  c) the local dev backend responded but MongoDB Atlas was unreachable —
    //     the backend returns HTTP 400/500 with an ENOTFOUND/ECONNREFUSED body
    const isOffline    = !navigator.onLine;
    const isNetworkErr = !error.response;
    const isDbConnErr  = /ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ENETUNREACH|ECONNRESET/i
      .test(error.response?.data?.message || '');
    const isWriteOp    = WRITE_METHODS.has(method);
    const isFormData   = error.config?.data instanceof FormData;

    // _skipQueue: true means this request came from drainQueue — never re-enqueue it.
    if ((isOffline || isNetworkErr || isDbConnErr) && isWriteOp && !isFormData && !error.config?._skipQueue) {
      const userId = getUserId();
      if (userId) {
        const rawData = error.config.data;
        const data    = typeof rawData === 'string' ? JSON.parse(rawData) : (rawData ?? {});
        // Axios prepends baseURL to config.url before dispatching, so error.config.url
        // is the fully-qualified URL (e.g. https://localhost:5173/api/v1/...).
        // Strip the baseURL prefix so our cache keys stay consistent with apiGet,
        // which always stores under the relative path (/api/v1/...).
        const rawUrl  = error.config.url || '';
        const base    = (error.config.baseURL || '').replace(/\/$/, '');
        const url     = (base && rawUrl.startsWith(base)) ? rawUrl.slice(base.length) : rawUrl;

        const queueId = await enqueue({ userId, method, url, data });
        await _patchCacheForWrite(userId, method, url, data, queueId).catch(() => {});

        const err    = new Error('Offline — saved locally and will sync when reconnected.');
        err.offline  = true;
        err.queued   = true;
        err.queueId  = queueId;
        return Promise.reject(err);
      }
    }

    const message = error.response?.data?.message || error.message || 'Request failed';
    const apiErr  = new Error(message);
    // Preserve HTTP status so callers (e.g. drainQueue) can distinguish a server
    // rejection (4xx/5xx, has status) from a pure network failure (no status).
    if (error.response?.status) apiErr.status = error.response.status;
    return Promise.reject(apiErr);
  }
);

// ── Cache key helpers ─────────────────────────────────────────────────────────
// apiGet stores entries under `${url}|${params}`. For param-less collection URLs
// the key is `${url}|` (trailing pipe). Patch helpers must use the same format.
const collectionCacheKey = (url) => url + '|';

async function _patchCacheForWrite(userId, method, url, data, queueId) {
  if (method === 'POST') {
    const cacheKey    = collectionCacheKey(url);
    const pendingItem = { ...data, _id: `offline_${queueId}`, _pending: true, _queueId: queueId, _cacheKey: cacheKey };
    await appendPendingToCache(userId, cacheKey, pendingItem);
  } else if (method === 'PUT' || method === 'PATCH') {
    const cacheKey = collectionCacheKey(url.replace(/\/[^/]+$/, ''));
    const itemId   = url.split('/').pop();
    await updatePendingInCache(userId, cacheKey, itemId, { ...data, _queueId: queueId, _cacheKey: cacheKey });
  } else if (method === 'DELETE') {
    const cacheKey = collectionCacheKey(url.replace(/\/[^/]+$/, ''));
    const itemId   = url.split('/').pop();
    await markDeletePendingInCache(userId, cacheKey, itemId);
  }
}

// ── Public API helpers ────────────────────────────────────────────────────────

export const getApiPath = (scope) =>
  scope === API_SCOPE.ADMIN ? CONFIG.adminApiPath : CONFIG.userApiPath;

/** Collapse duplicate in-flight GETs (React Strict Mode / StrictMode double-mount). */
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
 * Returning null (not throwing) lets callers guard with `if (result !== null)`
 * and display stale UI gracefully.
 */
export const apiGet = async (scope, path, config = {}) => {
  const url      = `${getApiPath(scope)}${path}`;
  const cacheKey = getInflightKey(url, config);
  const userId   = getUserId();

  if (!navigator.onLine) {
    if (!userId) return null;
    return getCache(userId, cacheKey);
  }

  // Online path: dedupe concurrent GETs, cache on success, fall back on failure
  const key = cacheKey;
  if (inflightGets.has(key)) return inflightGets.get(key);

  const request = http.get(url, config)
    .then((data) => {
      if (userId) setCache(userId, cacheKey, data).catch(() => {});
      return data;
    })
    .catch(async (err) => {
      if (userId) {
        const cached = await getCache(userId, cacheKey);
        if (cached !== null) return cached;
      }
      const isConnErr = !navigator.onLine ||
        /ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ENETUNREACH|ECONNRESET/i.test(err.message || '');
      if (isConnErr) return null;
      throw err;
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

// ── Legacy export kept for callers that still import setupHttpInterceptor ─────
// main.jsx now calls setOnUnauthorized instead, but this is kept so old imports
// don't crash if any remain.
export const setupHttpInterceptor = (_store) => {
  // No-op: interceptors are set up at module load above.
  // The store reference is no longer needed — token and userId come from localStorage.
};

export default http;
