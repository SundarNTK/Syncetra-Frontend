import { Link } from "react-router-dom";
import { TripModuleShell } from "../../../components/trip/TripSelector";

export default function AdminEmergency() {
  return (
    <TripModuleShell title="Emergency SOS" description="Instant group-wide high-priority alert">
      <div className="bg-red-950/50 border border-red-600 rounded-2xl p-6 space-y-4">
        <p className="text-red-200 text-sm">
          Trigger an immediate emergency alarm to all members in a group. Use Active Alarms for
          full controls and stop codes.
        </p>
        <Link to="/admin/alarms/active" className="inline-block px-6 py-3 bg-red-600 rounded-xl font-bold text-white">
          Open Emergency / Active Alarms →
        </Link>
      </div>
    </TripModuleShell>
  );
}
