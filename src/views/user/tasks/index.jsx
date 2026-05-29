import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "../../../hooks";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getTasks, acknowledgeTask } from "../../../services/trips";
import { formatDateTimeDisplay } from "../../../utils/dateTimeUtils";

const fmtDate = (iso) => (iso ? formatDateTimeDisplay(iso) : null);

const ACK_BADGE = {
  accepted: "bg-emerald-600/20 text-emerald-400 border border-emerald-600/40",
  pending:  "bg-amber-600/20  text-amber-400  border border-amber-600/40",
  refused:  "bg-red-600/20    text-red-400    border border-red-600/40",
};


const ACK_LABEL = {
  accepted: "Accepted",
  refused:  "Task Refused",
  pending:  "Pending to Accept",
};

// ── Inline action form (shown for pending tasks) ───────────────────────────────
function TaskActionForm({ task, tripId, onDone }) {
  const [comment,  setComment]  = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const handleAction = async (action) => {
    if (!comment.trim()) { setError("Comment is required"); return; }
    setSaving(true);
    setError("");
    try {
      await acknowledgeTask(tripId, task._id, { comment: comment.trim(), action });
      onDone();
    } catch (err) {
      setError(err?.message || "Failed to respond");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-slate-700/40 px-4 py-3 bg-slate-900/30 space-y-3">
      <div className="rounded-xl border border-amber-700/30 bg-amber-900/10 px-3 py-2.5">
        <p className="text-[11px] text-amber-400 font-semibold flex items-center gap-1.5">
          <span className="animate-pulse">⚠️</span> Action Required
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5">Add a comment and accept or refuse this task.</p>
      </div>

      <div>
        <label className="block text-[11px] text-slate-400 mb-1.5 font-medium">
          Your comment <span className="text-red-400">*</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => { setComment(e.target.value); setError(""); }}
          placeholder="Add your comment before responding…"
          rows={2}
          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-amber-600/60 focus:outline-none transition-colors resize-none"
        />
        {error && <p className="text-red-400 text-[11px] mt-1">{error}</p>}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleAction("accepted")}
          disabled={saving || !comment.trim()}
          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-all"
        >
          {saving ? "…" : "✓ Accept"}
        </button>
        <button
          onClick={() => handleAction("refused")}
          disabled={saving || !comment.trim()}
          className="flex-1 py-2.5 rounded-xl bg-red-700/80 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-all"
        >
          {saving ? "…" : "✗ Not Accept"}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function UserTasks() {
  const { selectedTripId, selectedTrip } = useTrip();
  const { userInfo } = useAppSelector((s) => s.user);
  const myId = userInfo?.user?._id || userInfo?.user?.id || "";

  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [expanded, setExpanded] = useState({});

  const load = useCallback(() => {
    if (!selectedTripId) { setItems([]); return; }
    setLoading(true);
    getTasks(selectedTripId, false)
      .then((r) => setItems(r?.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [selectedTripId]);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (id) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const myAck = (task) =>
    (task.acknowledgments || []).find(
      (a) => String(a.userId?._id || a.userId) === String(myId)
    );

  const pendingCount  = items.filter((t) => myAck(t)?.status === "pending").length;
  const acceptedCount = items.filter((t) => myAck(t)?.status === "accepted").length;
  const refusedCount  = items.filter((t) => myAck(t)?.status === "refused").length;

  return (
    <TripModuleShell title="My Tasks" description="Responsibilities assigned to you">

      {/* ── Summary ── */}
      {items.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-slate-200">{items.length}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Total</p>
          </div>
          <div className="bg-emerald-700/10 border border-emerald-700/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{acceptedCount}</p>
            <p className="text-[10px] text-emerald-600/70 uppercase tracking-wider mt-0.5">Accepted</p>
          </div>
          <div className="bg-amber-700/10 border border-amber-700/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
            <p className="text-[10px] text-amber-600/70 uppercase tracking-wider mt-0.5">Pending</p>
          </div>
          <div className="bg-red-700/10 border border-red-700/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{refusedCount}</p>
            <p className="text-[10px] text-red-600/70 uppercase tracking-wider mt-0.5">Refused</p>
          </div>
        </div>
      )}

      {loading && (
        <p className="text-slate-500 text-sm text-center py-6">Loading tasks…</p>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-10 text-slate-500">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm">No tasks assigned to you yet.</p>
        </div>
      )}

      <ul className="space-y-2">
        {items.map((task) => {
          const ack      = myAck(task);
          const ackStatus = ack?.status || "pending";
          const isPending = ackStatus === "pending";
          const isOpen   = expanded[task._id];
          const tripName = typeof task.tripId === "object"
            ? (task.tripId?.tripName || selectedTrip?.tripName || "")
            : (selectedTrip?.tripName || "");
          const adminName = typeof task.createdBy === "object"
            ? (task.createdBy?.name || task.createdBy?.email || "")
            : "";

          const borderColor = ackStatus === "accepted"
            ? "rgba(16,185,129,0.3)"
            : ackStatus === "refused"
            ? "rgba(239,68,68,0.3)"
            : "rgba(100,116,139,0.3)";

          return (
            <li
              key={task._id}
              className="rounded-xl border overflow-hidden transition-all"
              style={{
                background: "linear-gradient(145deg,#0f172a,#1a2336)",
                borderColor,
              }}
            >
              {/* Row header */}
              <button
                onClick={() => toggleExpand(task._id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  ackStatus === "accepted" ? "bg-emerald-500"
                  : ackStatus === "refused"  ? "bg-red-500"
                  : "bg-amber-500 animate-pulse"
                }`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-200 text-sm truncate">{task.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${ACK_BADGE[ackStatus] || ACK_BADGE.pending}`}>
                      {ACK_LABEL[ackStatus] || "Pending to Accept"}
                    </span>
                    {isPending && (
                      <span className="text-[10px] bg-amber-900/30 text-amber-500 border border-amber-700/30 px-2 py-0.5 rounded-full font-medium animate-pulse">
                        Action Needed
                      </span>
                    )}
                  </div>
                  {tripName && (
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <span>✈️</span> {tripName}
                    </p>
                  )}
                </div>

                <svg
                  className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <>
                  <div className="border-t border-slate-700/40 px-4 py-3 space-y-3 bg-slate-900/30">
                    {adminName && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span>👤 Assigned by</span>
                        <span className="font-medium text-slate-300">{adminName}</span>
                      </div>
                    )}
                    {task.description && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Description</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{task.description}</p>
                      </div>
                    )}

                    {/* Accepted info */}
                    {ackStatus === "accepted" && (
                      <div className="rounded-xl border border-emerald-700/30 bg-emerald-900/10 p-3 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400 text-sm">✓</span>
                          <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide">Accepted</p>
                        </div>
                        {ack?.comment && (
                          <div>
                            <p className="text-[10px] text-slate-500 mb-0.5">Your comment</p>
                            <p className="text-xs text-slate-300 italic">"{ack.comment}"</p>
                          </div>
                        )}
                        {(ack?.respondedAt || ack?.acceptedAt) && (
                          <p className="text-[10px] text-slate-500">
                            Accepted at · {fmtDate(ack.respondedAt || ack.acceptedAt)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Refused info */}
                    {ackStatus === "refused" && (
                      <div className="rounded-xl border border-red-700/30 bg-red-900/10 p-3 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-red-400 text-sm">✗</span>
                          <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wide">Task Refused</p>
                        </div>
                        {ack?.comment && (
                          <div>
                            <p className="text-[10px] text-slate-500 mb-0.5">Your reason</p>
                            <p className="text-xs text-slate-300 italic">"{ack.comment}"</p>
                          </div>
                        )}
                        {ack?.respondedAt && (
                          <p className="text-[10px] text-slate-500">
                            Refused at · {fmtDate(ack.respondedAt)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Inline action form — only for pending */}
                  {isPending && (
                    <TaskActionForm
                      task={task}
                      tripId={selectedTripId}
                      onDone={load}
                    />
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </TripModuleShell>
  );
}
