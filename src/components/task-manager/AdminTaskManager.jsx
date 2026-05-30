import { useEffect, useState, useCallback } from "react";
import { useAppSelector } from "../../hooks";
import { ROLES } from "../../constants/enum";
import { getTasks, addTask, deleteTask } from "../../services/trips";
import { getAdminGroups, getGroupById } from "../../services/groups";
import { getSocket } from "../../services/socketService";
import { formatDateTimeDisplay } from "../../utils/dateTimeUtils";
import SyncetraLoader from "../ui/SyncetraLoader";
import MemberMultiSelect from "../ui/MemberMultiSelect";
import TaskEditModal from "./TaskEditModal";
import AssignedMemberChips from "./AssignedMemberChips";

const IconClose   = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;
const IconTrash   = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>;
const IconEdit    = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>;
const IconPlus    = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>;
const IconSpinner = () => <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round"/></svg>;

const fmtDateTime = (iso) => (iso ? formatDateTimeDisplay(iso) : "—");

const STATUS_CLS = {
  pending:  "bg-amber-600/20 text-amber-400 border border-amber-600/30",
  accepted: "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30",
  refused:  "bg-red-600/20 text-red-400 border border-red-600/30",
};

const TASK_STATUS_CLS = {
  pending:     "bg-amber-600/20 text-amber-400",
  in_progress: "bg-blue-600/20 text-blue-400",
  completed:   "bg-emerald-600/20 text-emerald-400",
};

// ─── AckTable ──────────────────────────────────────────────────────────────
function AckTable({ acknowledgments }) {
  if (!acknowledgments?.length) {
    return <p className="text-xs text-slate-500 italic">No members assigned</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-500 text-[10px] uppercase tracking-wide border-b border-slate-700/50">
            <th className="text-left pb-1.5 pr-3 font-medium">Member</th>
            <th className="text-left pb-1.5 pr-3 font-medium">Status</th>
            <th className="text-left pb-1.5 pr-3 font-medium">Comment</th>
            <th className="text-left pb-1.5 font-medium">Responded At</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {acknowledgments.map((a, i) => {
            const user = a.userId;
            const name = typeof user === "object" ? (user?.name || user?.email || "Unknown") : "Unknown";
            const label = a.status === "accepted" ? "Accepted" : a.status === "refused" ? "Task Refused" : "Pending";
            return (
              <tr key={i} className="text-slate-300">
                <td className="py-2 pr-3 font-medium">{name}</td>
                <td className="py-2 pr-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_CLS[a.status] || STATUS_CLS.pending}`}>
                    {label}
                  </span>
                </td>
                <td className="py-2 pr-3 text-slate-400 max-w-[140px] truncate">{a.comment || "—"}</td>
                <td className="py-2 text-slate-500">{fmtDateTime(a.respondedAt || a.acceptedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── TaskRow ────────────────────────────────────────────────────────────────
function TaskRow({ task, members, isSuperAdmin, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-slate-200 text-sm truncate">{task.title}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium ${TASK_STATUS_CLS[task.status] || TASK_STATUS_CLS.pending}`}>
              {task.status?.replace("_", " ") || "pending"}
            </span>
          </div>
          {task.description && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>
          )}
          <AssignedMemberChips task={task} members={members} />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setExpanded((p) => !p)}
            className="text-[10px] px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          >
            {expanded ? "Hide" : "Members"}
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
              title="Edit task"
            >
              <IconEdit />
            </button>
          )}
          <button
            onClick={() => onDelete(task._id)}
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors"
          >
            <IconTrash />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-slate-700/50 px-4 py-3 bg-slate-900/40">
          <AckTable acknowledgments={task.acknowledgments} />
        </div>
      )}
    </div>
  );
}

// ─── AdminTaskManager ───────────────────────────────────────────────────────
export default function AdminTaskManager({ trip, onClose }) {
  const tripId = trip._id;
  const { userInfo } = useAppSelector((s) => s.user);
  const isSuperAdmin = userInfo?.user?.role === ROLES.SUPER_ADMIN;
  const [tasks,   setTasks]   = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [editTask, setEditTask] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: [],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [taskRes, groupsRes] = await Promise.all([
        getTasks(tripId, true),
        getAdminGroups(),
      ]);
      setTasks(taskRes?.data || []);

      const allGroups = groupsRes?.data || [];
      const tripGroups = allGroups.filter(
        (g) => g.tripId && String(g.tripId) === String(tripId)
      );
      const memberMap = new Map();
      for (const g of tripGroups) {
        const detail = await getGroupById(g._id);
        for (const m of detail?.data?.memberDetails || []) {
          memberMap.set(String(m._id), {
            id: m._id,
            name: m.name,
            email: m.email,
            mobileNumber: m.mobileNumber,
          });
        }
      }
      setMembers([...memberMap.values()]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Real-time ack updates from members
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = ({ task: updated }) => {
      if (!updated?._id) return;
      setTasks((prev) =>
        prev.map((t) => String(t._id) === String(updated._id) ? updated : t)
      );
    };
    socket.on("task:acknowledged", handler);
    return () => socket.off("task:acknowledged", handler);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) { setError("Task title is required"); return; }
    setSaving(true);
    try {
      await addTask(tripId, form);
      setForm({ title: "", description: "", assignedTo: [] });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await deleteTask(tripId, taskId);
      setTasks((p) => p.filter((t) => t._id !== taskId));
    } catch {
      // silent
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-emerald-600/60 focus:outline-none transition-colors";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-8"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="font-semibold text-emerald-400">Task Master</h2>
            <p className="text-xs text-slate-500 mt-0.5">{trip.tripName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 transition-colors">
            <IconClose />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* ── Create task form ── */}
          <form onSubmit={handleSubmit} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <IconPlus /> Assign New Task
            </h3>
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

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? <><IconSpinner /> Saving…</> : <><IconPlus /> Assign Task</>}
            </button>
          </form>

          {/* ── Task list ── */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Tasks ({tasks.length})
            </h3>
            {loading ? (
              <SyncetraLoader size="sm" className="py-6" />
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-2xl mb-2">📋</p>
                <p className="text-sm">No tasks yet. Create one above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <TaskRow
                    key={task._id}
                    task={task}
                    members={members}
                    isSuperAdmin={isSuperAdmin}
                    onEdit={setEditTask}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {editTask && (
        <TaskEditModal
          task={editTask}
          tripId={tripId}
          members={members}
          onClose={() => setEditTask(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
