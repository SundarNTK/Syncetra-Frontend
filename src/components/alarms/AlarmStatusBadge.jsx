import { formatAlarmStatus } from "../../utils/alarmUtils";

export const ALARM_STATUS_THEME = {
  active: {
    glow: "239,68,68",
    badge: "bg-red-600/25 text-red-300 border border-red-500/50",
  },
  scheduled: {
    glow: "59,130,246",
    badge: "bg-blue-600/25 text-blue-300 border border-blue-500/50",
  },
  completed: {
    glow: "34,197,94",
    badge: "bg-emerald-600/25 text-emerald-300 border border-emerald-500/50",
  },
  cancelled: {
    glow: "100,116,139",
    badge: "bg-slate-600/25 text-slate-300 border border-slate-500/50",
  },
};

export const getAlarmTheme = (status) =>
  ALARM_STATUS_THEME[(status || "").toLowerCase()] || ALARM_STATUS_THEME.cancelled;

/** Glowing pill badge for alarm status (Active, Scheduled, Cancelled, etc.) */
export default function AlarmStatusBadge({ status, className = "" }) {
  const theme = getAlarmTheme(status);
  return (
    <span
      className={`inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-md shrink-0 ${theme.badge} ${className}`}
      style={{ boxShadow: `0 0 12px rgba(${theme.glow}, 0.45), inset 0 1px 0 rgba(255,255,255,0.06)` }}
    >
      {formatAlarmStatus(status)}
    </span>
  );
}
