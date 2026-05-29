/**
 * Local dev: same host as the page.
 * With Vite HTTPS proxy, API/Socket use page origin (no mixed-content on phone).
 */
const resolveServiceUrl = (envUrl, port = 4010) => {
  const fallback = `http://localhost:${port}`;
  if (import.meta.env.DEV && typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  if (typeof window !== "undefined" && window.location?.hostname) {
    const fromPage = `http://${window.location.hostname}:${port}`;
    if (!envUrl || /localhost|127\.0\.0\.1/.test(envUrl)) {
      return fromPage;
    }
    return envUrl;
  }
  return envUrl || fallback;
};

const CONFIG = {
  appEnv: import.meta.env.VITE_ENV || "DEV",
  get apiBaseUrl() {
    return resolveServiceUrl(import.meta.env.VITE_API_BASE_URL, 4010);
  },
  adminApiPath: import.meta.env.VITE_ADMIN_API_PATH || "/api/v1/alarm/admin",
  userApiPath: import.meta.env.VITE_USER_API_PATH || "/api/v1/alarm/user",
  get socketUrl() {
    return resolveServiceUrl(import.meta.env.VITE_SOCKET_URL, 4010);
  },
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || "",
  },
};

export const isDevEnv = () => CONFIG.appEnv === "DEV";

export default CONFIG;
