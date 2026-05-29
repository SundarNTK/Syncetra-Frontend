/* ─── Firebase Cloud Messaging — Background Service Worker ──────────────────
 * Handles FCM messages when the app tab is closed or in background.
 * Uses data-only FCM messages (no top-level "notification" on backend)
 * so this handler has full control over notification display and sound.
 * ─────────────────────────────────────────────────────────────────────────── */

importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

// Firebase config is safe to expose here — it is a public client identifier,
// NOT a secret. The real secrets live in the backend service account JSON.
firebase.initializeApp({
  apiKey: self.__FIREBASE_API_KEY__ || "REPLACE_AT_BUILD",
  authDomain: self.__FIREBASE_AUTH_DOMAIN__ || "REPLACE_AT_BUILD",
  projectId: self.__FIREBASE_PROJECT_ID__ || "REPLACE_AT_BUILD",
  storageBucket: self.__FIREBASE_STORAGE_BUCKET__ || "REPLACE_AT_BUILD",
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID__ || "REPLACE_AT_BUILD",
  appId: self.__FIREBASE_APP_ID__ || "REPLACE_AT_BUILD",
});

const messaging = firebase.messaging();

// ─── Background message handler ──────────────────────────────────────────────
// Fires when a data-only FCM message arrives and the tab is not in the foreground.
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = data.title || "GROUP ALARM";
  const body = data.body || "Open the app and enter the stop code.";
  const alarmId = data.alarmId || "alarm";
  const type = data.type || "alarm";

  // Only handle alarm-type messages here
  if (type !== "alarm") return;

  // Store alarm data so the app can read it when it opens
  self.registration.showNotification(title, {
    body,
    icon: "/alarm-icon.svg",
    badge: "/alarm-icon.svg",
    tag: `alarm-${alarmId}`,        // prevents stacking duplicate notifications
    renotify: true,                  // re-alerts even if same tag already shown
    requireInteraction: true,        // stays visible until user interacts
    silent: false,                   // allow the OS to play its notification sound
    vibrate: [500, 200, 500, 200, 500, 200, 500],
    data: { ...data, alarmId, openUrl: "/?alarm=" + alarmId },
    // Note: The "sound" property is defined in the Web Notification spec but
    // browser support is near-zero. OS-level notification sound is controlled
    // by the android channel (set on backend) and device notification volume.
    // To play custom audio: the app must be opened (see notificationclick below).
    actions: [
      { action: "open", title: "Open & Stop Alarm" },
    ],
  });
});

// ─── Notification click handler ──────────────────────────────────────────────
// When the user taps the notification, focus the app or open it with the alarm
// query param so AlarmPopup can show immediately with sound.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const alarmId = event.notification.data?.alarmId;
  const targetUrl = alarmId ? `/?alarm=${alarmId}` : "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If there is already a window open, focus it and send the alarm data
        for (const client of windowClients) {
          if ("focus" in client) {
            client.focus();
            client.postMessage({
              type: "FCM_ALARM_CLICK",
              alarmId,
              data: event.notification.data,
            });
            return;
          }
        }
        // No window open — open a new one. The app reads the query param on mount.
        return clients.openWindow(targetUrl);
      })
  );
});

// ─── Message from app tab ─────────────────────────────────────────────────────
// The app can send a SKIP_WAITING message to activate a new SW immediately.
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
