import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminAlarms, getAlarmLogs, deleteAlarm } from "../../../services/alarms";
import { formatDateTimeDisplay, formatTime12hDisplay } from "../../../utils/dateTimeUtils";
import MasterPageShell, { MasterList, MasterListItem } from "../../../components/layout/MasterPageShell";
import { useAppSelector } from "../../../hooks";
import { ROLES } from "../../../constants/enum";
import { useDeleteConfirm } from "../../../hooks/useDeleteConfirm";

const formatScheduleSummary = (schedules) => {
  if (!schedules?.length) return "—";
  return schedules
    .map((s) => {
      const times = (s.times || [])
        .map((t) => formatTime12hDisplay(t.time))
        .join(", ");
      return `${s.date}${times ? ` · ${times}` : ""}`;
    })
    .join(" | ");
};

const IconClose = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconTrash = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const formatStatus = (status) => {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const ALARM_STATUS_THEME = {
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

const getAlarmTheme = (status) =>
  ALARM_STATUS_THEME[(status || "").toLowerCase()] || ALARM_STATUS_THEME.cancelled;

function AlarmStatusBadge({ status }) {
  const theme = getAlarmTheme(status);
  return (
    <span
      className={`inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-md shrink-0 ${theme.badge}`}
      style={{ boxShadow: `0 0 10px rgba(${theme.glow}, 0.35)` }}
    >
      {formatStatus(status)}
    </span>
  );
}

const LOG_STATUS_BADGE = {
  pending: "bg-amber-600/20 text-amber-300 border border-amber-600/40",
  stopped: "bg-emerald-600/20 text-emerald-300 border border-emerald-600/40",
  failed: "bg-red-600/20 text-red-300 border border-red-600/40",
};

function LogStatusBadge({ status }) {
  const key = (status || "").toLowerCase();
  const cls =
    LOG_STATUS_BADGE[key] ||
    "bg-slate-600/20 text-slate-300 border border-slate-600/40";
  return (
    <span
      className={`inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-md shrink-0 ${cls}`}
    >
      {formatStatus(status)}
    </span>
  );
}

export default function AlarmList() {
  const [alarms, setAlarms] = useState([]);
  const [logs, setLogs] = useState(null);
  const { userInfo } = useAppSelector((s) => s.user);
  const isSuperAdmin = userInfo?.user?.role === ROLES.SUPER_ADMIN;
  const { confirmDelete, deleteModal } = useDeleteConfirm();

  const load = () => getAdminAlarms().then((res) => setAlarms(res?.data || []));

  useEffect(() => { load(); }, []);

  const viewLogs = async (id) => {
    const res = await getAlarmLogs(id);
    setLogs({ alarmId: id, items: res?.data || [] });
  };

  const handleDelete = (alarm) => {
    confirmDelete({
      title: "Delete Alarm",
      recordLabel: alarm.title,
      message: "This alarm and its history will be permanently removed.",
      onConfirm: async () => {
        await deleteAlarm(alarm._id);
        load();
      },
    });
  };

  return (
    <MasterPageShell
      title="All Alarms"
      action={
        <Link
          to="/admin/alarms/schedule"
          className="text-sm px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 rounded-lg text-white font-medium hover:shadow-lg hover:shadow-red-900/30 transition-all"
        >
          + Schedule new
        </Link>
      }
    >
      <MasterList>
        {alarms.map((a) => {
          const theme = getAlarmTheme(a.status);
          return (
            <MasterListItem
              key={a._id}
              className="master-list-item flex-col overflow-hidden transition-shadow"
              style={{
                border: `1px solid rgba(${theme.glow}, 0.5)`,
                boxShadow: `0 0 18px rgba(${theme.glow}, 0.28), inset 0 0 24px rgba(${theme.glow}, 0.07)`,
                background: `linear-gradient(135deg, rgba(${theme.glow}, 0.1) 0%, rgb(15 23 42 / 0.92) 55%)`,
              }}
            >
              <div className="p-4 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                  <h3 className="font-semibold text-base sm:text-lg">{a.title}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <AlarmStatusBadge status={a.status} />
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDelete(a)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors"
                        title="Delete alarm"
                      >
                        <IconTrash />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-400">
                  {a.schedules?.length
                    ? formatScheduleSummary(a.schedules)
                    : a.alarmTime
                    ? formatDateTimeDisplay(a.alarmTime)
                    : "—"}
                </p>
                <button
                  type="button"
                  onClick={() => viewLogs(a._id)}
                  className="text-sm text-red-400 mt-2 hover:text-red-300 transition-colors"
                >
                  View logs
                </button>
              </div>
            </MasterListItem>
          );
        })}
      </MasterList>

      {deleteModal}

      {logs && (
        <div
          className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center p-4 z-50"
          onClick={() => setLogs(null)}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-700 shrink-0">
              <h3 className="font-bold text-white">Alarm Response Logs</h3>
              <button
                type="button"
                onClick={() => setLogs(null)}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <IconClose />
              </button>
            </div>
            <ul className="flex-1 overflow-auto px-4 py-2 text-sm">
              {logs.items.map((l) => (
                <li
                  key={l._id}
                  className="flex items-center justify-between gap-3 border-b border-slate-700 py-2.5"
                >
                  <span className="truncate text-slate-200">
                    {l.user?.name || l.userId}
                  </span>
                  <LogStatusBadge status={l.status} />
                </li>
              ))}
            </ul>
            <div className="px-4 pb-4 pt-2 shrink-0">
              <button
                type="button"
                onClick={() => setLogs(null)}
                className="w-full py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </MasterPageShell>
  );
}
