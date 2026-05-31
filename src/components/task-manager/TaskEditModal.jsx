import { useEffect, useState } from "react";
import { updateTask } from "../../services/trips";
import MemberMultiSelect from "../ui/MemberMultiSelect";

const IconClose   = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;
const IconSpinner = () => <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round"/></svg>;

const ACK_GLOW = {
  accepted: {
    label: "Accepted",
    box: "border-emerald-400/60 bg-emerald-950/40 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.25)]",
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]",
  },
  refused: {
    label: "Refused",
    box: "border-red-400/60 bg-red-950/40 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.25)]",
    dot: "bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]",
  },
  pending: {
    label: "Pending",
    box: "border-amber-400/50 bg-amber-950/35 text-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.18)]",
    dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]",
  },
  none: {
    label: "Not Assigned",
    box: "border-slate-600/50 bg-slate-900/60 text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
    dot: "bg-slate-500",
  },
};

function memberName(user, members) {
  if (user && typeof user === "object") return user.name || user.email || "Member";
  const m = members.find((x) => String(x.id || x._id) === String(user));
  return m?.name || m?.email || "Member";
}

function TaskAcceptancePanel({ task, members }) {
  const acks = task?.acknowledgments || [];
  const assigned = task?.assignedTo || [];

  if (!assigned.length) {
    const meta = ACK_GLOW.none;
    return (
      <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${meta.box}`}>
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dot}`} />
        <div>
          <p className="text-xs uppercase tracking-widest opacity-80">Member response</p>
          <p className="text-sm font-semibold">{meta.label}</p>
        </div>
      </div>
    );
  }

  const rows = assigned.map((u) => {
    const uid = String(typeof u === "object" ? (u._id || u.id) : u);
    const ack = acks.find((a) => String(a.userId?._id || a.userId) === uid);
    const status = ack?.status || "pending";
    return { uid, name: memberName(u, members), status };
  });

  const summary = rows.some((r) => r.status === "refused")
    ? "refused"
    : rows.every((r) => r.status === "accepted")
    ? "accepted"
    : "pending";

  const summaryMeta = ACK_GLOW[summary];

  return (
    <div className="space-y-2">
      <label className="block text-xs text-slate-400 mb-1">Member response</label>
      <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${summaryMeta.box}`}>
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 animate-pulse ${summaryMeta.dot}`} />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest opacity-80">Overall</p>
          <p className="text-sm font-semibold">
            {summary === "accepted"
              ? "All members accepted"
              : summary === "refused"
              ? "Task refused by member"
              : "Awaiting member acceptance"}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {rows.map((r) => {
          const meta = ACK_GLOW[r.status] || ACK_GLOW.pending;
          return (
            <span
              key={r.uid}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${meta.box}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />
              {r.name} · {meta.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function taskAssignedIds(task) {
  return (task?.assignedTo || []).map((u) =>
    String(typeof u === "object" ? (u._id || u.id) : u)
  );
}

export default function TaskEditModal({ task, tripId, members, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: task.title || "",
    description: task.description || "",
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
      await updateTask(tripId, task._id, {
        title: form.title,
        description: form.description,
        assignedTo: form.assignedTo,
      });
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
            rows={5}
          />
          <TaskAcceptancePanel task={task} members={members} />
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
