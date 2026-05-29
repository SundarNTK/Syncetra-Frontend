import { useEffect, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getSyncStatus } from "../../../services/trips";

export default function AdminSyncStatus() {
  const { selectedTripId } = useTrip();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (selectedTripId) getSyncStatus(selectedTripId).then((r) => setRows(r?.data || []));
  }, [selectedTripId]);

  return (
    <TripModuleShell title="Sync Status" description="Online, FCM, alarm received/opened/stopped">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-800">
              <th className="py-2">Member</th>
              <th>Mobile</th>
              <th>FCM</th>
              <th>Online</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId} className="border-b border-slate-900">
                <td className="py-3">{r.name}</td>
                <td className="font-mono text-xs">{r.mobileNumber}</td>
                <td>{r.hasFcmToken ? <span className="text-green-400">Ready</span> : <span className="text-amber-400">No</span>}</td>
                <td>{r.isOnline ? <span className="text-green-400">Yes</span> : <span className="text-slate-500">No</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-slate-500 text-sm mt-4">Add members to the trip to see sync status.</p>}
      </div>
    </TripModuleShell>
  );
}
