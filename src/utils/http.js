import axios from "axios";
import CONFIG from "../config";
import { API_SCOPE } from "../constants/enum";
import { CLEAR_USER } from "../store/userSlice";

let storeRef = null;

export const setupHttpInterceptor = (store) => {
  storeRef = store;

  http.interceptors.request.use((config) => {
    const state = storeRef?.getState();
    const token = state?.user?.userInfo?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  http.interceptors.response.use(
    (res) => res.data,
    (error) => {
      if (error.response?.status === 401) {
        storeRef?.dispatch(CLEAR_USER());
        window.location.hash = "#/login";
      }
      const message =
        error.response?.data?.message || error.message || "Request failed";
      return Promise.reject(new Error(message));
    }
  );
};

const http = axios.create({
  baseURL: CONFIG.apiBaseUrl,
  timeout: 30000,
});

export const getApiPath = (scope) =>
  scope === API_SCOPE.ADMIN ? CONFIG.adminApiPath : CONFIG.userApiPath;

/** Collapse duplicate in-flight GETs (e.g. React Strict Mode double mount). */
const inflightGets = new Map();

const getInflightKey = (url, config = {}) => {
  const params = config.params != null ? JSON.stringify(config.params) : "";
  return `${url}|${params}`;
};

const dedupeGet = (url, config = {}) => {
  const key = getInflightKey(url, config);
  if (inflightGets.has(key)) return inflightGets.get(key);
  const request = http.get(url, config).finally(() => {
    inflightGets.delete(key);
  });
  inflightGets.set(key, request);
  return request;
};

export const apiGet = (scope, path, config = {}) =>
  dedupeGet(`${getApiPath(scope)}${path}`, config);

export const apiPost = (scope, path, data, config = {}) =>
  http.post(`${getApiPath(scope)}${path}`, data, config);

export const apiPut = (scope, path, data, config = {}) =>
  http.put(`${getApiPath(scope)}${path}`, data, config);

export const apiDelete = (scope, path, config = {}) =>
  http.delete(`${getApiPath(scope)}${path}`, config);

export default http;
