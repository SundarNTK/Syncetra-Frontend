import { useCallback, useEffect, useRef, useState } from "react";
import { getUserPendingTasks, acknowledgeTask } from "../../services/trips";
import { getSocket } from "../../services/socketService";

// ── Snooze helpers (10-min remind) ───────────────────────────────────────────
const SNOOZE_KEY = "task_snooze";
const SNOOZE_MS  = 10 * 60 * 1000;

const getSnoozed   = () => { try { return JSON.parse(localStorage.getItem(SNOOZE_KEY) || "{}"); } catch { return {}; } };
const snoozeTask   = (id) => { const m = getSnoozed(); m[id] = Date.now(); localStorage.setItem(SNOOZE_KEY, JSON.stringify(m)); };
const clearSnooze  = (id) => { const m = getSnoozed(); delete m[id]; localStorage.setItem(SNOOZE_KEY, JSON.stringify(m)); };
const isSnoozed    = (id) => { const ts = getSnoozed()[id]; return ts && Date.now() - ts < SNOOZE_MS; };

// ── Notification alert tone (Web Audio API) ───────────────────────────────────
function playAlertTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const play = (freq, start, dur) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    play(880, 0,    0.12);
    play(660, 0.14, 0.12);
    play(880, 0.28, 0.18);
  } catch { /* autoplay policy may block — silently ignored */ }
}

// ── Injected popup keyframes ──────────────────────────────────────────────────
const POPUP_STYLES = `
@keyframes taskSlideUp {
  0%   { transform: translateY(50px) scale(0.94); opacity: 0; }
  55%  { transform: translateY(-5px)  scale(1.02); opacity: 1; }
  75%  { transform: translateY(2px)   scale(0.99); }
  100% { transform: translateY(0)     scale(1);    opacity: 1; }
}
@keyframes amberGlow {
  0%,100% { box-shadow: 0 0 20px rgba(245,158,11,0.2), 0 30px 60px rgba(0,0,0,0.6); }
  50%      { box-shadow: 0 0 40px rgba(245,158,11,0.4), 0 30px 60px rgba(0,0,0,0.6); }
}
@keyframes warnPulse {
  0%,100% { opacity: 1; }
  50%     { opacity: 0.5; }
}
.task-slide-up { animation: taskSlideUp 0.5s cubic-bezier(0.34,1.4,0.64,1) both; }
.task-glow     { animation: amberGlow 2.5s ease-in-out infinite; }
.warn-pulse    { animation: warnPulse 1.2s ease-in-out infinite; }
`;

// ── Mini confetti (on accept) ──────────────────────────────────────────────────
const C_COLORS = ["#10b981","#f59e0b","#3b82f6","#ec4899","#8b5cf6","#f97316"];
function MiniConfetti({ active }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const parts     = useRef([]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    parts.current = Array.from({ length: 50 }, (_, i) => ({
      x: Math.random() * canvas.width, y: -10 - Math.random() * 20,
      vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3 + 1.5,
      color: C_COLORS[i % C_COLORS.length],
      size: Math.random() * 6 + 3,
      rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.12,
      life: 1, decay: Math.random() * 0.012 + 0.006,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      parts.current = parts.current.filter((p) => p.life > 0.02);
      for (const p of parts.current) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.1;
        p.rot += p.rotV; p.life -= p.decay;
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life * 2);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (parts.current.length > 0) rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full" />;
}

// ── TaskCard ──────────────────────────────────────────────────────────────────
function TaskCard({ task, onResponded, onClose }) {
  const [comment,  setComment]  = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [done,     setDone]     = useState(false);
  const [doneAction, setDoneAction] = useState(null);

  const adminName = typeof task.createdBy === "object"
    ? (task.createdBy?.name || task.createdBy?.email || "Admin")
    : "Admin";
  const tripName = typeof task.tripId === "object"
    ? (task.tripId?.tripName || "")
    : "";
  const tripId = typeof task.tripId === "object"
    ? (task.tripId?._id || task.tripId)
    : task.tripId;

  const handleAction = async (action) => {
    if (!comment.trim()) { setError("Comment is required for this action"); return; }
    setSaving(true);
    setError("");
    try {
      await acknowledgeTask(tripId, task._id, { comment: comment.trim(), action });
      clearSnooze(task._id);
      setDoneAction(action);
      setDone(true);
      setTimeout(() => onResponded(task._id), 2200);
    } catch (err) {
      setError(err?.message || "Failed to respond to task");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    const accepted = doneAction === "accepted";
    return (
      <div className={`relative rounded-2xl overflow-hidden border p-5 text-center ${accepted ? "border-emerald-600/40 bg-emerald-900/10" : "border-red-600/40 bg-red-900/10"}`}>
        {accepted && <MiniConfetti active />}
        <div className="text-4xl mb-2">{accepted ? "✅" : "❌"}</div>
        <p className={`font-bold text-base ${accepted ? "text-emerald-400" : "text-red-400"}`}>
          {accepted ? "Task Accepted!" : "Task Refused"}
        </p>
        <p className="text-xs text-slate-500 mt-1">Your response has been recorded.</p>
      </div>
    );
  }

  return (
    <div className="task-slide-up task-glow rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(145deg,#0c1220,#131c2e)",
        border: "1px solid rgba(245,158,11,0.25)",
      }}
    >
      {/* Amber top strip */}
      <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg,transparent,#f59e0b,transparent)" }} />

      {/* Action required banner */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-800/30" style={{ background: "rgba(120,53,15,0.25)" }}>
        <span className="warn-pulse text-amber-400 text-sm">⚠️</span>
        <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">Action Required</p>
        <span className="ml-auto text-[10px] text-amber-600 bg-amber-900/40 px-2 py-0.5 rounded-full border border-amber-700/30">
          Awaiting your response
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Admin + Trip badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] bg-slate-800 text-slate-300 border border-slate-700/40 px-2.5 py-1 rounded-full font-medium">
            👤 {adminName}
          </span>
          {tripName && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-900/30 text-emerald-400 border border-emerald-700/30 px-2.5 py-1 rounded-full font-medium">
              ✈️ {tripName}
            </span>
          )}
        </div>

        {/* Task info card */}
        <div className="rounded-xl p-3.5 border border-amber-700/20" style={{ background: "rgba(120,53,15,0.12)" }}>
          <p className="font-bold text-white text-sm leading-snug">{task.title}</p>
          {task.description && (
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{task.description}</p>
          )}
        </div>

        {/* Comment textarea */}
        <div>
          <label className="block text-[11px] text-slate-400 mb-1.5 font-medium">
            Your comment <span className="text-red-400">*</span>
            <span className="text-slate-600 ml-1">(required for both actions)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => { setComment(e.target.value); setError(""); }}
            placeholder="Add your acknowledgment comment…"
            rows={2}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-amber-600/60 focus:outline-none transition-colors resize-none"
          />
          {error && <p className="text-red-400 text-[11px] mt-1">{error}</p>}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleAction("accepted")}
            disabled={saving || !comment.trim()}
            className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-all"
          >
            {saving ? "…" : "✓ Accept"}
          </button>
          <button
            onClick={() => handleAction("refused")}
            disabled={saving || !comment.trim()}
            className="py-2.5 rounded-xl bg-red-700/80 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-all"
          >
            {saving ? "…" : "✗ Not Accept"}
          </button>
        </div>
        <button
          onClick={() => { snoozeTask(task._id); onClose(task._id); }}
          className="w-full py-2 rounded-xl border border-slate-700/60 text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 text-xs transition-colors"
        >
          Close Now — remind me in 10 min
        </button>
      </div>
    </div>
  );
}

// ── Main Notifier ─────────────────────────────────────────────────────────────
export default function TaskAcknowledgmentNotifier() {
  const [tasks,   setTasks]   = useState([]);
  const [visible, setVisible] = useState(false);
  const reminderRef = useRef(null);
  const stylesInjected = useRef(false);

  const visibleTasks = tasks.filter((t) => !isSnoozed(t._id));

  // Inject CSS once
  useEffect(() => {
    if (stylesInjected.current) return;
    const el = document.createElement("style");
    el.id = "task-notifier-styles";
    el.textContent = POPUP_STYLES;
    document.head.appendChild(el);
    stylesInjected.current = true;
  }, []);

  const fetchPending = useCallback(async () => {
    try {
      const res = await getUserPendingTasks();
      const list = res?.data || [];
      if (list.length > 0) {
        setTasks(list);
        const anyVisible = list.some((t) => !isSnoozed(t._id));
        if (anyVisible) { setVisible(true); playAlertTone(); }
      }
    } catch { /* silent */ }
  }, []);

  // Initial load
  useEffect(() => { fetchPending(); }, [fetchPending]);

  // Socket: new task assigned
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (payload) => {
      const newTask = payload?.task;
      if (!newTask) return;
      setTasks((prev) => {
        const exists = prev.some((t) => t._id === newTask._id);
        return exists ? prev : [newTask, ...prev];
      });
      clearSnooze(newTask._id);
      setVisible(true);
      playAlertTone();
    };
    socket.on("task:assigned", handler);
    return () => socket.off("task:assigned", handler);
  }, []);

  // 60-second interval: re-show any expired snoozes
  useEffect(() => {
    reminderRef.current = setInterval(() => {
      setTasks((prev) => {
        const anyExpired = prev.some((t) => {
          const ts = getSnoozed()[t._id];
          return ts && Date.now() - ts >= SNOOZE_MS;
        });
        if (anyExpired) { setVisible(true); playAlertTone(); }
        return prev;
      });
    }, 60_000);
    return () => clearInterval(reminderRef.current);
  }, []);

  const handleResponded = (taskId) => {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  };

  const handleClose = (taskId) => {
    setTasks((prev) => [...prev]);
    setTimeout(() => {
      setTasks((current) => {
        const anyStillVisible = current.some((t) => !isSnoozed(t._id));
        if (!anyStillVisible) setVisible(false);
        return current;
      });
    }, 50);
  };

  if (!visible || visibleTasks.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm px-3 py-4 sm:px-4">
      <div
        className="w-full max-w-md flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(160deg,#080e1a,#0f1926)",
          border: "1px solid rgba(245,158,11,0.2)",
          boxShadow: "0 0 60px rgba(245,158,11,0.1), 0 40px 80px rgba(0,0,0,0.7)",
          maxHeight: "92vh",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-amber-800/25 shrink-0"
          style={{ background: "rgba(120,53,15,0.15)" }}>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
            <h2 className="font-bold text-sm text-white">Task Assignments</h2>
            <span className="text-[10px] bg-amber-700/30 text-amber-400 border border-amber-700/40 px-2 py-0.5 rounded-full font-semibold">
              {visibleTasks.length} pending
            </span>
          </div>
          <button
            onClick={() => {
              visibleTasks.forEach((t) => snoozeTask(t._id));
              setVisible(false);
            }}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800"
          >
            Remind later
          </button>
        </div>

        {/* Scrollable task list */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {visibleTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onResponded={handleResponded}
              onClose={handleClose}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
