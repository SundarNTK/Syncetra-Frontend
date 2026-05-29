import http from "../utils/http";
import CONFIG from "../config";
import { isDevEnv } from "../config";
import { testTriggerAlarm } from "./alarms";
import { STORAGE_KEYS } from "../constants/storage";

/**
 * Test trigger — uses public API in DEV (no login), or admin API if logged in as admin.
 */
export const sampleTestTrigger = async ({ mobileNumber, title, description, groupId }) => {
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  const session = raw ? JSON.parse(raw) : null;
  const isAdmin = session?.user?.role === "admin" && session?.token;

  if (isAdmin) {
    return testTriggerAlarm({ mobileNumber, title, description, groupId });
  }

  if (!isDevEnv()) {
    throw new Error(
      "Login as Admin first, or set VITE_ENV=DEV for public test page without login."
    );
  }

  return http.post("/api/v1/alarm/public/test-trigger", {
    mobileNumber,
    title,
    description,
    groupId,
  });
};
