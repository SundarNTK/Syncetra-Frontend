import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminAlarms, getAlarmLogs } from "../../../services/alarms";
import { formatDateTimeDisplay, formatTime12hDisplay } from "../../../utils/dateTimeUtils";
import MasterPageShell, { MasterList, MasterListItem } from "../../../components/layout/MasterPageShell";

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

export default function AlarmList() {
  const [alarms, setAlarms] = useState([]);
  const [logs, setLogs] = useState(null);

  useEffect(() => {
    getAdminAlarms().then((res) => setAlarms(res?.data || []));
  }, []);

  const viewLogs = async (id) => {
    const res = await getAlarmLogs(id);
    setLogs({ alarmId: id, items: res?.data || [] });
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
        {alarms.map((a) => (
          <MasterListItem key={a._id} className="master-list-item flex-col">
            <div className="p-4 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
              <h3 className="font-semibold text-base sm:text-lg">{a.title}</h3>
              <span
                className={`text-xs px-2 py-1 rounded self-start sm:self-auto ${
                  a.status === "active"
                    ? "bg-red-600"
                    : a.status === "scheduled"
                    ? "bg-blue-600"
                    : "bg-slate-600"
                }`}
              >
                {a.status}
              </span>
            </div>
            <p className="text-sm text-slate-400">
              {a.schedules?.length
                ? formatScheduleSummary(a.schedules)
                : a.alarmTime
                ? formatDateTimeDisplay(a.alarmTime)
                : "—"}
            </p>
            <button
              onClick={() => viewLogs(a._id)}
              className="text-sm text-red-400 mt-2 hover:text-red-300 transition-colors"
            >
              View logs
            </button>
            </div>
          </MasterListItem>
        ))}
      </MasterList>

      {logs && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-4 w-full max-w-md max-h-[70vh] overflow-auto">
            <h3 className="font-bold mb-3">Alarm Response Logs</h3>
            <ul className="space-y-2 text-sm">
              {logs.items.map((l) => (
                <li key={l._id} className="flex justify-between border-b border-slate-700 py-2">
                  <span className="truncate mr-2">{l.user?.name || l.userId}</span>
                  <span className={l.status === "stopped" ? "text-green-400" : "text-slate-400"}>
                    {l.status}
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setLogs(null)}
              className="w-full mt-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </MasterPageShell>
  );
}
