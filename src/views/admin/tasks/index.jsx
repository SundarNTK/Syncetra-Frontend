import { useEffect, useRef, useState, useCallback } from "react";
import { useAppSelector } from "../../../hooks";
import { ROLES } from "../../../constants/enum";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getTasks, addTask } from "../../../services/trips";
import { getAdminGroups, getGroupById } from "../../../services/groups";
import { getSocket } from "../../../services/socketService";
import { formatDateTimeDisplay } from "../../../utils/dateTimeUtils";
import TaskEditModal from "../../../components/task-manager/TaskEditModal";
import AssignedMemberChips from "../../../components/task-manager/AssignedMemberChips";

const IconEdit = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const fmtDate = (iso) => (iso ? formatDateTimeDisplay(iso) : "—");

const ACK_STATUS_CLS = {
  pending:  "bg-amber-600/15 text-amber-400 border border-amber-600/30",
  accepted: "bg-emerald-600/15 text-emerald-400 border border-emerald-600/30",
  refused:  "bg-red-600/15 text-red-400 border border-red-600/30",
};

const ACK_LABEL = {
  accepted: "Accepted",
  refused:  "Task Refused",
  pending:  "Pending",
};

// ─── MemberDropdown ───────────────────────────────────────────────────────────
function MemberDropdown({ members, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allSelected = members.length > 0 && selected.length === members.length;
  const someSelected = selected.length > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) onChange([]);
    else onChange(members.map((m) => String(m.id || m._id)));
  };

  const toggleOne = (id) => {
    if (selected.includes(id)) onChange(selected.filter((s) => s !== id));
    else onChange([...selected, id]);
  };

  const label =
    selected.length === 0
      ? "Select members to assign"
      : selected.length === members.length
      ? "All members selected"
      : `${selected.length} member${selected.length > 1 ? "s" : ""} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-left transition-colors hover:border-slate-600 focus:outline-none focus:border-emerald-600/60"
      >
        <span className={selected.length === 0 ? "text-slate-500" : "text-slate-200"}>
          {label}
        </span>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!open && selected.length > 0 && selected.length < members.length && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {selected.map((id) => {
            const m = members.find((x) => String(x.id || x._id) === id);
            return m ? (
              <span
                key={id}
                className="inline-flex items-center gap-1 text-[11px] bg-emerald-700/20 text-emerald-400 border border-emerald-700/30 px-2 py-0.5 rounded-full"
              >
                {m.name}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleOne(id); }}
                  className="hover:text-red-400 leading-none"
                >
                  ×
                </button>
              </span>
            ) : null;
          })}
        </div>
      )}

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          {members.length === 0 ? (
            <p className="px-4 py-3 text-xs text-slate-500">No members in this trip</p>
          ) : (
            <>
              <label className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-700/60 cursor-pointer hover:bg-slate-800/60 transition-colors">
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    allSelected
                      ? "bg-emerald-600 border-emerald-600"
                      : someSelected
                      ? "bg-emerald-600/40 border-emerald-600"
                      : "border-slate-600"
                  }`}
                  onClick={toggleAll}
                >
                  {allSelected && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M1 4l3 3 5-5" />
                    </svg>
                  )}
                  {someSelected && !allSelected && (
                    <div className="w-2 h-0.5 bg-white rounded" />
                  )}
                </div>
                <span className="text-sm font-medium text-slate-200 select-none" onClick={toggleAll}>
                  Select All
                </span>
                <span className="ml-auto text-[10px] text-slate-500">{members.length} members</span>
              </label>
              <div className="max-h-52 overflow-y-auto">
                {members.map((m) => {
                  const id = String(m.id || m._id);
                  const checked = selected.includes(id);
                  return (
                    <label
                      key={id}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                        checked ? "bg-emerald-700/10" : "hover:bg-slate-800/60"
                      }`}
                    >
                      <div
                        onClick={() => toggleOne(id)}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          checked ? "bg-emerald-600 border-emerald-600" : "border-slate-600"
                        }`}
                      >
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M1 4l3 3 5-5" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1" onClick={() => toggleOne(id)}>
                        <p className="text-sm text-slate-200 truncate select-none">{m.name}</p>
                        <p className="text-[11px] text-slate-500 truncate select-none">{m.email}</p>
                      </div>
                      {checked && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                    </label>
                  );
                })}
              </div>

              {/* Okay button */}
              <div className="border-t border-slate-700/60 px-3 py-2.5 flex items-center justify-between gap-3 bg-slate-900/60">
                <span className="text-xs text-slate-500">
                  {selected.length === 0 ? "None selected" : `${selected.length} selected`}
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors"
                >
                  Okay
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MemberResponseCard ───────────────────────────────────────────────────────
function MemberResponseCard({ ack }) {
  const user = ack.userId;
  const name = typeof user === "object" ? (user?.name || user?.email || "Unknown") : "Unknown";
  const initial = name.charAt(0).toUpperCase();
  const status = ack.status || "pending";

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs
        ${status === "accepted" ? "bg-emerald-700/40 text-emerald-300"
        : status === "refused"  ? "bg-red-700/40 text-red-300"
        : "bg-slate-700 text-slate-300"}`}
      >
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-200">{name}</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${ACK_STATUS_CLS[status] || ACK_STATUS_CLS.pending}`}>
            {ACK_LABEL[status] || "Pending"}
          </span>
        </div>
        {ack.comment ? (
          <p className="text-xs text-slate-400 mt-1 italic leading-relaxed">"{ack.comment}"</p>
        ) : (
          <p className="text-[11px] text-slate-600 mt-0.5 italic">No comment yet</p>
        )}
        {(ack.respondedAt || ack.acceptedAt) && (
          <p className="text-[10px] text-slate-600 mt-1">
            {status === "accepted" ? "Accepted" : status === "refused" ? "Refused" : "Responded"} at · {fmtDate(ack.respondedAt || ack.acceptedAt)}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── TaskRow ──────────────────────────────────────────────────────────────────
function TaskRow({ task, members, isSuperAdmin, onEdit }) {
  const [expanded, setExpanded] = useState(false);

  const acks    = task.acknowledgments || [];
  const accepted = acks.filter((a) => a.status === "accepted").length;
  const refused  = acks.filter((a) => a.status === "refused").length;
  const pending  = acks.filter((a) => a.status === "pending").length;
  const total    = acks.length;

  return (
    <li className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-200">{task.title}</p>
          {task.description && (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{task.description}</p>
          )}

          <AssignedMemberChips task={task} members={members} />

          {/* Ack summary pills */}
          {total > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {accepted > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border bg-emerald-600/15 text-emerald-400 border-emerald-600/30">
                  ✓ {accepted} Accepted
                </span>
              )}
              {refused > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border bg-red-600/15 text-red-400 border-red-600/30">
                  ✗ {refused} Refused
                </span>
              )}
              {pending > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border bg-amber-600/15 text-amber-400 border-amber-600/30 animate-pulse">
                  ⏳ {pending} Pending
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 shrink-0">
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 border border-slate-700/60 transition-colors"
              title="Edit task"
            >
              <IconEdit />
            </button>
          )}
          {total > 0 && (
            <button
              onClick={() => setExpanded((p) => !p)}
              className="text-[10px] px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors whitespace-nowrap"
            >
              {expanded ? "Hide" : `Responses (${total})`}
            </button>
          )}
        </div>
      </div>

      {/* Member responses panel */}
      {expanded && total > 0 && (
        <div className="border-t border-slate-800 px-4 py-3 bg-slate-950/40">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2.5">
            Member Responses
          </p>
          <div className="space-y-2">
            {acks.map((a, i) => (
              <MemberResponseCard key={i} ack={a} />
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminTasks() {
  const { selectedTripId } = useTrip();
  const { userInfo } = useAppSelector((s) => s.user);
  const isSuperAdmin = userInfo?.user?.role === ROLES.SUPER_ADMIN;
  const [items,   setItems]   = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", assignedTo: [] });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const [editTask, setEditTask] = useState(null);

  const load = useCallback(() => {
    if (!selectedTripId) return;
    getTasks(selectedTripId).then((r) => setItems(r?.data || []));
  }, [selectedTripId]);

  const loadMembers = useCallback(async () => {
    if (!selectedTripId) { setMembers([]); return; }
    try {
      const groupsRes = await getAdminGroups();
      const allGroups = groupsRes?.data || [];
      const tripGroups = allGroups.filter(
        (g) => g.tripId && String(g.tripId) === String(selectedTripId)
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
      setMembers([]);
    }
  }, [selectedTripId]);

  useEffect(() => {
    if (!selectedTripId) { setItems([]); setMembers([]); return undefined; }
    let ignore = false;
    setLoading(true);
    (async () => {
      try {
        const tasksRes = await getTasks(selectedTripId);
        if (!ignore) setItems(tasksRes?.data || []);
        await loadMembers();
      } catch {
        if (!ignore) setItems([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [selectedTripId, loadMembers]);

  // Real-time ack updates from members
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = ({ task: updated }) => {
      if (!updated?._id) return;
      setItems((prev) =>
        prev.map((t) => String(t._id) === String(updated._id) ? updated : t)
      );
    };
    socket.on("task:acknowledged", handler);
    return () => socket.off("task:acknowledged", handler);
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) { setError("Task title is required"); return; }
    setSaving(true);
    try {
      await addTask(selectedTripId, form);
      setForm({ title: "", description: "", assignedTo: [] });
      load();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <TripModuleShell title="Tasks" description="Assign food, tent, medical, navigation duties" loading={loading && !!selectedTripId}>
      {selectedTripId && (
        <>
          {/* ── Create form ── */}
          <form onSubmit={handleAdd} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 mb-4">
            <input
              placeholder="Task title *"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-emerald-600/60 focus:outline-none transition-colors"
              required
            />
            <input
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-emerald-600/60 focus:outline-none transition-colors"
            />
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Assign to members</label>
              <MemberDropdown
                members={members}
                selected={form.assignedTo}
                onChange={(ids) => setForm((p) => ({ ...p, assignedTo: ids }))}
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? "Saving…" : "Assign task"}
            </button>
          </form>

          {/* ── Task list ── */}
          <ul className="space-y-2">
            {items.map((t) => (
              <TaskRow
                key={t._id}
                task={t}
                members={members}
                isSuperAdmin={isSuperAdmin}
                onEdit={setEditTask}
              />
            ))}
            {items.length === 0 && (
              <li className="text-center py-10 text-slate-500">
                <p className="text-2xl mb-2">📋</p>
                <p className="text-sm">No tasks yet. Create one above.</p>
              </li>
            )}
          </ul>

          {!isSuperAdmin && items.length > 0 && (
            <p className="text-[11px] text-slate-500 text-center mt-3">
              Super Admins can edit existing tasks.
            </p>
          )}

          {editTask && selectedTripId && (
            <TaskEditModal
              task={editTask}
              tripId={selectedTripId}
              members={members}
              onClose={() => setEditTask(null)}
              onSaved={load}
            />
          )}
        </>
      )}
    </TripModuleShell>
  );
}
