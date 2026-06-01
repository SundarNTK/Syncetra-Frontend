/** Title-case alarm status for display (e.g. cancelled → Cancelled). */
export function formatAlarmStatus(status) {
  if (!status) return "Unknown";
  const s = String(status).trim();
  if (!s) return "Unknown";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
