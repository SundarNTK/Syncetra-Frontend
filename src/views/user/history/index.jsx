import { useEffect, useState } from "react";
import { getUserAlarmHistory } from "../../../services/alarms";

export default function UserAlarmHistory() {
  const [alarms, setAlarms] = useState([]);

  useEffect(() => {
    getUserAlarmHistory().then((res) => setAlarms(res?.data || []));
  }, []);

  return (
    <div className="w-full">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Alarm History</h2>
      {alarms.length === 0 ? (
        <p className="text-slate-400">No past alarms.</p>
      ) : (
        <ul className="space-y-3">
          {alarms.map((a) => (
            <li key={a._id} className="bg-slate-800 rounded-xl p-4">
              <h3 className="font-semibold text-base sm:text-lg">{a.title}</h3>
              <p className="text-sm text-slate-400">{a.description}</p>
              <p className="text-xs text-slate-500 mt-2">
                {new Date(a.alarmTime).toLocaleString()} · {a.status}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
