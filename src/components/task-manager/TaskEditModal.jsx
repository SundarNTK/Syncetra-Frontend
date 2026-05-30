import { useEffect, useState } from "react";
import { updateTask } from "../../services/trips";
import MemberMultiSelect from "../ui/MemberMultiSelect";
import { SYNC_NATIVE_SELECT } from "../ui/formControlStyles";

const IconClose   = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;
const IconSpinner = () => <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round"/></svg>;

const STATUS_OPTS = [
  { value: "pending",     label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed",   label: "Completed" },
];

function taskAssignedIds(task) {
  return (task?.assignedTo || []).map((u) =>
    String(typeof u === "object" ? (u._id || u.id) : u)
  );
}

export default function TaskEditModal({ task, tripId, members, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: task.title || "",
    description: task.description || "",
    status: task.status || "pending",
    assignedTo: taskAssignedIds(task),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) { setError("Task title is required"); return; }
    setSaving(true);
    try {
      await updateTask(tripId, task._id, form);
      onSaved();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-emerald-600/60 focus:outline-none transition-colors";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-8"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
          <h3 className="font-semibold text-emerald-400">Edit Task</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400">
            <IconClose />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <input
            placeholder="Task title *"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className={inputCls}
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className={`${inputCls} resize-none`}
            rows={2}
          />
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              className={SYNC_NATIVE_SELECT}
            >
              {STATUS_OPTS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Assign to members</label>
            <MemberMultiSelect
              options={members}
              value={form.assignedTo}
              onChange={(ids) => setForm((p) => ({ ...p, assignedTo: ids }))}
              emptyMeansAll={false}
              placeholder="Select members to assign"
              emptyHint="No members in this trip"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? <><IconSpinner /> Saving…</> : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm text-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
