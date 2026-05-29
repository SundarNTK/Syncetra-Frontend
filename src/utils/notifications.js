/**
 * Free browser notifications (no Firebase required).
 * Works when user granted permission and alarm fires via Socket.IO.
 */

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result;
};

export const showAlarmNotification = ({ title, body, alarmId }) => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const notification = new Notification(title || "GROUP ALARM", {
    body: body || "Open the app and enter the stop code.",
    icon: "/alarm-icon.svg",
    badge: "/alarm-icon.svg",
    tag: alarmId ? `alarm-${alarmId}` : "group-alarm",
    requireInteraction: true,
    vibrate: [500, 200, 500],
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
};
