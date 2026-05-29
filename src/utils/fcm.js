import { getToken, onMessage } from "firebase/messaging";
import CONFIG from "../config";
import { getFirebaseMessaging } from "../config/firebase";
import { updateFcmToken } from "../services/auth";
import { requestNotificationPermission } from "./notifications";

let foregroundHandlerAttached = false;

/**
 * @returns {Promise<{ ok: boolean, message: string, token?: string }>}
 */
export const registerDeviceForPush = async (onForegroundAlarm, authToken) => {
  if (!CONFIG.firebase.vapidKey || !CONFIG.firebase.apiKey) {
    return {
      ok: false,
      message: "Firebase not configured in .env — ask admin to set VITE_FIREBASE_* keys.",
    };
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    if (protocol === "http:" && !isLocalhost) {
      return {
        ok: false,
        message:
          "Open the app with HTTPS (https://your-pc-ip:5173). Push does not work on http:// from a phone.",
      };
    }
  }

  const permission = await requestNotificationPermission();
  if (permission === "unsupported") {
    return {
      ok: false,
      message: "This browser does not support notifications. Try Chrome on Android.",
    };
  }
  if (permission === "denied") {
    return {
      ok: false,
      message:
        "Notifications are blocked. In browser settings, allow notifications for this site, then tap Enable again.",
    };
  }
  if (permission !== "granted") {
    return {
      ok: false,
      message: "Notification permission was not granted. Tap Allow when prompted.",
    };
  }

  try {
    const supported = await import("firebase/messaging").then((m) =>
      m.isSupported()
    );
    if (!supported) {
      return {
        ok: false,
        message:
          "Push is not supported in this browser. Use Chrome on Android with HTTPS.",
      };
    }

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" }
    );
    await navigator.serviceWorker.ready;

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return { ok: false, message: "Could not start Firebase messaging on this device." };
    }

    const token = await getToken(messaging, {
      vapidKey: CONFIG.firebase.vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      return {
        ok: false,
        message: "No FCM token from Firebase. Check HTTPS and notification permission.",
      };
    }

    await updateFcmToken(token, authToken);
    console.log("FCM token registered with backend");

    if (!foregroundHandlerAttached && onForegroundAlarm) {
      onMessage(messaging, (payload) => {
        const data = payload.data || {};
        onForegroundAlarm({
          alarmId: data.alarmId,
          groupId: data.groupId,
          title: payload.notification?.title || data.title || "GROUP ALARM",
          description: payload.notification?.body || data.body || "",
          soundType: data.soundType || "siren",
          status: "active",
        });
      });
      foregroundHandlerAttached = true;
    }

    return {
      ok: true,
      message: "Phone registered for alarms.",
      token,
    };
  } catch (err) {
    console.error("FCM registration failed:", err);
    return {
      ok: false,
      message: err.message || "FCM registration failed",
    };
  }
};
