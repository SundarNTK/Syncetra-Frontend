import { useEffect, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getSchedules, addSchedule } from "../../../services/trips";
import DateTimePicker12h from "../../../components/ui/DateTimePicker12h";
import { formatDateTimeDisplay } from "../../../utils/dateTimeUtils";

export default function AdminItinerary() {
  const { selectedTripId } = useTrip();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    title: "",
    checkpoint: "",
    scheduledAt: "",
    notes: "",
  });

  const load = () =>
    selectedTripId && getSchedules(selectedTripId).then((r) => setItems(r?.data || []));

  useEffect(() => {
    load();
  }, [selectedTripId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.scheduledAt) return;
    await addSchedule(selectedTripId, form);
    setForm({ title: "", checkpoint: "", scheduledAt: "", notes: "" });
    load();
  };

  return (
    <TripModuleShell title="Itinerary" description="Trip checkpoints with date & 12-hour time">
      {selectedTripId && (
        <>
          <form onSubmit={handleAdd} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 mb-4">
            <input
              placeholder="Title (e.g. Breakfast stop)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700"
              required
            />
            <input
              placeholder="Checkpoint / location"
              value={form.checkpoint}
              onChange={(e) => setForm({ ...form, checkpoint: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700"
            />
            <div>
              <label className="block text-xs text-slate-400 mb-2">Scheduled date & time (12-hour)</label>
              <DateTimePicker12h
                value={form.scheduledAt}
                onChange={(v) => setForm({ ...form, scheduledAt: v })}
              />
            </div>
            <textarea
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700"
              rows={2}
            />
            <button type="submit" className="px-4 py-2 bg-emerald-600 rounded-lg text-sm" disabled={!form.scheduledAt}>
              Add checkpoint
            </button>
          </form>
          <ul className="space-y-2">
            {items.length === 0 && (
              <p className="text-slate-500 text-sm">No itinerary items yet.</p>
            )}
            {items.map((s) => (
              <li key={s._id} className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3">
                <p className="font-medium">{s.title}</p>
                {s.checkpoint && <p className="text-sm text-slate-400">{s.checkpoint}</p>}
                <p className="text-xs text-emerald-400/90 mt-1">
                  {formatDateTimeDisplay(s.scheduledAt)}
                </p>
                {s.notes && <p className="text-xs text-slate-500 mt-1">{s.notes}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </TripModuleShell>
  );
}
