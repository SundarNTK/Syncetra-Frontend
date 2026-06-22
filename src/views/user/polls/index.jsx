import { useCallback, useEffect, useRef, useState } from "react";
import MasterPageShell, { MasterList } from "../../../components/layout/MasterPageShell";
import SyncetraLoader from "../../../components/ui/SyncetraLoader";
import { pollOptionGlowClass, OPT_COLORS, pollOptionHeaderStyle, pollOptionLabelStyle } from "../../../components/polls/pollOptionStyles";
import { useAppSelector } from "../../../hooks";
import { getUserPolls, votePoll } from "../../../services/polls";
import { useOnlineReload } from "../../../hooks/useOnlineReload";
import { useTrip } from "../../../context/TripContext";

// ─── Animation styles ─────────────────────────────────────────────────────────
function PollAnimStyles() {
  return (
    <style>{`
      @keyframes pollFadeUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes pollOptIn {
        from { opacity: 0; transform: translateX(-10px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes pollNumPop {
        0%   { transform: scale(0.6); opacity: 0; }
        70%  { transform: scale(1.15); }
        100% { transform: scale(1);   opacity: 1; }
      }
      @keyframes psCardPop {
        0%   { transform: scale(0.6) translateY(30px); opacity: 0; }
        60%  { transform: scale(1.05) translateY(-4px); opacity: 1; }
        80%  { transform: scale(0.97); }
        100% { transform: scale(1) translateY(0); opacity: 1; }
      }
      @keyframes psBoltEntry {
        0%   { transform: scale(0); opacity: 0; }
        55%  { transform: scale(1.18); opacity: 1; }
        75%  { transform: scale(0.9); }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes psShimmer {
        from { background-position: 0% center; }
        to   { background-position: 220% center; }
      }
      @keyframes psBarDrain {
        from { width: 100%; }
        to   { width: 0%; }
      }
      @keyframes psFadeSlide {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes psRingExpand {
        0%   { transform: scale(0.2); opacity: 0.65; }
        100% { transform: scale(2.4); opacity: 0; }
      }
      @keyframes psLightning {
        0%,100% { opacity: 0.75; filter: brightness(1); }
        50%     { opacity: 1;    filter: brightness(1.5) drop-shadow(0 0 12px rgba(232,121,249,1)); }
      }
      @keyframes psVioletPulse {
        0%,100% { box-shadow: 0 0 20px #a855f7, 0 0 40px #a855f755; }
        50%     { box-shadow: 0 0 40px #d946ef, 0 0 80px #a855f744, 0 0 120px #a855f722; }
      }
    `}</style>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconX    = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;
const IconEye  = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>;

// ─── Animated tap-to-vote icon ────────────────────────────────────────────────
function TapVoteIcon() {
  return (
    <span className="relative inline-flex items-center justify-center shrink-0">
      <span className="absolute inset-0 rounded-lg bg-emerald-500/20 animate-ping" style={{ animationDuration: "1.8s" }} />
      <span
        className="relative z-10 px-2.5 py-1 rounded-lg text-[11px] font-black tracking-widest uppercase"
        style={{
          background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)",
          color: "#fff",
          boxShadow: "0 0 6px rgba(16,185,129,0.4), 0 0 12px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
          textShadow: "0 1px 3px rgba(0,0,0,0.4)",
          letterSpacing: "0.12em",
        }}
      >
        Vote
      </span>
    </span>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6", "#f97316"];

function Confetti({ active }) {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const rafRef    = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    particles.current = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width, y: -10,
      vx: (Math.random() - 0.5) * 6, vy: Math.random() * 4 + 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 7 + 3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      life: 1, decay: Math.random() * 0.008 + 0.004,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter((p) => p.life > 0);
      particles.current.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.rotation += p.rotationSpeed; p.life -= p.decay;
        ctx.save(); ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      if (particles.current.length > 0) rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// ─── Electric particle canvas (Power Surge) ───────────────────────────────────
function ElectricCanvas({ active }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width  = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const cx = W / 2, cy = H / 2;
    const COLS = ["#d946ef","#a855f7","#7c3aed","#ec4899","#c026d3","#f0abfc","#e879f9"];
    const sparks = Array.from({ length: 60 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const spd   = Math.random() * 6 + 3;
      return {
        x: cx, y: cy,
        vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
        col: COLS[Math.floor(Math.random() * COLS.length)],
        sz: Math.random() * 5 + 3,
        life: 1, decay: Math.random() * 0.012 + 0.007,
      };
    });
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      let any = false;
      sparks.forEach((s) => {
        if (s.life <= 0) return;
        any = true;
        s.x += s.vx; s.y += s.vy;
        s.vx *= 0.97; s.vy *= 0.97;
        s.life -= s.decay;
        ctx.save();
        ctx.globalAlpha = s.life;
        ctx.fillStyle   = s.col;
        ctx.translate(s.x, s.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-s.sz / 2, -s.sz / 2, s.sz, s.sz);
        ctx.restore();
      });
      if (any) rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);
  if (!active) return null;
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// ─── Vote Success Overlay — Power Surge ───────────────────────────────────────
function VoteSuccessOverlay({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 5000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)", animation: "pollFadeUp 0.3s ease both" }}
    >
      {/* Violet radial aura */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div style={{ width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, rgba(120,36,172,0.06) 45%, transparent 70%)" }} />
      </div>

      <div
        className="relative w-full max-w-sm mx-4 overflow-hidden rounded-3xl text-center"
        style={{
          background: "linear-gradient(160deg,#0f0515 0%,#05010a 100%)",
          border: "1px solid rgba(168,85,247,0.35)",
          boxShadow: "0 0 60px rgba(168,85,247,0.18), 0 30px 80px rgba(0,0,0,0.8)",
          animation: "psCardPop 0.6s cubic-bezier(0.22,1.2,0.36,1) both",
        }}
      >
        <ElectricCanvas active />
        {/* Top accent line */}
        <div style={{ height: 2, background: "linear-gradient(90deg,transparent,#a855f7,#f0abfc,#a855f7,transparent)" }} />

        <div className="relative z-10 pt-7 pb-6 px-6 space-y-1">
          {/* Lightning bolt + expanding rings */}
          <div className="flex justify-center mb-2">
            <div className="relative flex items-center justify-center" style={{ width: 96, height: 96, animation: "psBoltEntry 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s both" }}>
              {[0, 0.55, 1.1].map((delay, i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{ inset: 0, border: "1px solid rgba(168,85,247,0.45)", animation: `psRingExpand 1.8s ${delay}s ease-out infinite` }}
                />
              ))}
              <div
                style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "radial-gradient(circle at 40% 40%, rgba(217,70,239,0.38), rgba(109,40,217,0.22))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: "psVioletPulse 2s ease-in-out infinite",
                  position: "relative", zIndex: 2,
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor"
                  style={{ color: "#f0abfc", animation: "psLightning 1.5s ease-in-out infinite" }}>
                  <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
                </svg>
              </div>
            </div>
          </div>

          <p
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: "rgba(217,70,239,0.6)", animation: "psFadeSlide 0.4s ease 0.5s both" }}
          >
            Impact Registered
          </p>
          <h2
            className="text-2xl font-black tracking-wide"
            style={{
              background: "linear-gradient(90deg,#c026d3,#a855f7,#f0abfc,#a855f7,#c026d3)",
              backgroundSize: "220% auto",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              animation: "psShimmer 2.5s linear infinite, psFadeSlide 0.4s ease 0.55s both",
            }}
          >
            VOTE REGISTERED!
          </h2>
          <p className="text-sm" style={{ color: "rgba(240,171,252,0.65)", animation: "psFadeSlide 0.4s ease 0.7s both" }}>
            Your impact has been unleashed.
          </p>
          <p className="text-xs" style={{ color: "rgba(192,132,252,0.4)", animation: "psFadeSlide 0.4s ease 0.85s both" }}>
            Thank you for your participation!
          </p>

          {/* Fuchsia drain bar */}
          <div className="pt-5">
            <div style={{ height: 3, background: "rgba(88,28,135,0.35)", borderRadius: 9999, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 9999, background: "linear-gradient(90deg,#581c87,#a855f7,#f0abfc)", animation: "psBarDrain 5s linear forwards" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Vote Confirmation Dialog ─────────────────────────────────────────────────
function VoteConfirmDialog({ poll, optionLabel, onConfirm, onClose, submitting }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Confirm Your Choice</h3>
            <p className="text-slate-400 text-xs mt-0.5">{poll.title}</p>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs text-slate-400 mb-1">Your selected option</p>
          <p className="text-sm font-medium text-white">{optionLabel}</p>
        </div>
        <p className="text-sm text-slate-300 text-center mb-5 leading-relaxed">
          This poll is non-reversible.<br />
          <span className="text-slate-400">Could you please confirm your choice?</span>
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50">
            Close
          </button>
          <button onClick={onConfirm} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Submitting…
              </>
            ) : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** % of eligible members who picked this option (0–100) */
function pctOfEligible(voteCount, eligible) {
  const e = Number(eligible) || 0;
  const v = Number(voteCount) || 0;
  if (e <= 0) return null;
  return Math.min(100, Math.round((v / e) * 100));
}

// ─── FilterBar ────────────────────────────────────────────────────────────────
function FilterBar({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {[
        { value: "all",     label: "All" },
        { value: "general", label: "General" },
        { value: "trip",    label: "Trip" },
      ].map((f) => (
        <button key={f.value} onClick={() => onChange(f.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${value === f.value ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
          {f.label}
        </button>
      ))}
    </div>
  );
}

// ─── Poll View Modal (full detail) ────────────────────────────────────────────
function PollViewModal({ poll, userId, trips, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const userVotedIndex = poll.options?.findIndex(
    (o) => (o.votes || []).some((v) => (typeof v === "object" ? v._id : v) === userId)
  );
  const hasVoted        = userVotedIndex >= 0;
  const isClosed        = poll.pollStatus !== "open";
  const totalVotes      = (poll.options || []).reduce((s, o) => s + (o.votes?.length || 0), 0);
  const maxVotes        = Math.max(...(poll.options || []).map((o) => o.votes?.length || 0), 0);
  const eligible        = poll.eligibleMemberCount ?? 0;
  const uniqueResponded = poll.uniqueVoterCount ?? 0;
  const showBars        = true;

  const leadingOpts = totalVotes > 0
    ? (poll.options || []).filter((o) => (o.votes?.length || 0) === maxVotes)
    : [];

  const STATUS_BADGE = {
    open:      { cls: "bg-red-700/20 text-red-300 border-red-700/40", dot: true },
    paused:    { cls: "bg-yellow-600/20 text-yellow-300 border-yellow-700/40" },
    closed:    { cls: "bg-slate-600/40 text-slate-400 border-slate-600/40" },
    completed: { cls: "bg-amber-950/40 text-amber-200 border-amber-500/50" },
  };
  const TYPE_BADGE = {
    general: "bg-blue-600/20 text-blue-300 border border-blue-700/40",
    trip:    "bg-amber-600/20 text-amber-300 border border-amber-700/40",
  };

  const statusInfo = STATUS_BADGE[poll.pollStatus] || STATUS_BADGE.closed;
  const responsePct = eligible > 0 ? Math.round((uniqueResponded / eligible) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-3 py-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[94vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "pollFadeUp 0.3s ease both" }}
      >
        {/* ── Header ── */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-lg sm:text-xl text-white leading-snug break-words mb-2">
                {poll.title}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE[poll.pollType]}`}>
                  {poll.pollType === "trip" ? "Trip Poll" : "General"}
                </span>
                {poll.pollType === "trip" && poll.tripId && (() => {
                  const tripName = trips?.find((t) => String(t._id) === String(poll.tripId))?.tripName;
                  return tripName ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full"
                      style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", boxShadow: "0 0 8px rgba(139,92,246,0.12)" }}>
                      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(167,139,250,0.65)" }}>Trip</span>
                      <span className="w-px h-2.5 bg-violet-500/30" />
                      <span className="text-[10px] font-semibold" style={{ color: "#c4b5fd" }}>{tripName}</span>
                    </span>
                  ) : null;
                })()}
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize flex items-center gap-1 ${statusInfo.cls}`}>
                  {statusInfo.dot && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
                  {poll.pollStatus === "open" ? "Live" : poll.pollStatus}
                </span>
                {hasVoted && (
                  <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-700/40 px-2 py-0.5 rounded-full">
                    ✓ You Voted
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="shrink-0 p-2 rounded-full hover:bg-slate-800 text-slate-400 transition-colors">
              <IconX />
            </button>
          </div>

          {/* Response stats bar */}
          {eligible > 0 && (
            <div className="mt-3 bg-slate-800/50 rounded-xl px-4 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Member Participation</p>
                <p className="text-xs font-bold text-slate-300">
                  {uniqueResponded}<span className="text-slate-500 font-normal">/{eligible}</span>
                  <span className="ml-1.5 text-emerald-400">{responsePct}%</span>
                </p>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400 transition-all duration-700"
                  style={{ width: `${responsePct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-5 space-y-5">
          {/* ── Question ── */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(16,185,129,0.18)", background: "linear-gradient(135deg,rgba(16,185,129,0.05) 0%,rgba(2,6,23,0.6) 100%)" }}>
            <div className="flex items-center gap-2.5 px-4 py-2.5" style={{ background: "linear-gradient(90deg,rgba(16,185,129,0.14) 0%,rgba(16,185,129,0.03) 80%,transparent 100%)", borderBottom: "1px solid rgba(16,185,129,0.12)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8, flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/>
              </svg>
              <span className="text-[10px] font-black tracking-[0.28em] uppercase" style={{ background: "linear-gradient(90deg,#10b981,#34d399,#6ee7b7,#34d399,#10b981)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "pollOptLabelShimmer 3s linear infinite" }}>
                Question
              </span>
            </div>
            <div className="px-4 py-3.5 flex gap-3">
              <div className="w-0.5 rounded-full shrink-0 mt-1 self-stretch" style={{ background: "linear-gradient(180deg,#10b981,#34d399,transparent)" }} />
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-wrap">{poll.question}</p>
            </div>
          </div>

          {/* ── Leading / Winner banner ── */}
          {leadingOpts.length > 0 && showBars && (
            <p className="poll-highlight-line font-semibold leading-snug">
              {isClosed && poll.pollStatus === "completed" ? (
                <>
                  <span className="text-lg">🏆 </span>
                  <span className="poll-winner-gradient font-bold">
                    Winner{leadingOpts.length > 1 ? "s" : ""}: {leadingOpts.map((o) => o.label).join(", ")}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-lg">⚡ </span>
                  <span className="poll-leading-gradient font-bold">
                    Leading: {leadingOpts.map((o) => o.label).join(", ")}
                  </span>
                  <span className="text-slate-500 text-xs font-normal ml-1.5">
                    ({maxVotes} vote{maxVotes !== 1 ? "s" : ""})
                  </span>
                </>
              )}
            </p>
          )}

          {/* ── Options ── */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-3">
              Options <span className="normal-case text-slate-600">({(poll.options || []).length})</span>
            </p>
            <div className="space-y-3">
              {(poll.options || []).map((o, i) => {
                const count       = o.votes?.length || 0;
                const eligiblePct = pctOfEligible(count, eligible);
                const shareOfCast = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                const barPct      = showBars ? (eligiblePct != null ? eligiblePct : shareOfCast) : 0;
                const isLeading   = count === maxVotes && totalVotes > 0;
                const isVoted     = i === userVotedIndex;
                const isWinner    = isLeading && isClosed && poll.pollStatus === "completed";
                const hasDesc     = o.description && o.description.trim() && o.description !== "<p><br></p>";

                const barGradient = isWinner
                  ? "linear-gradient(90deg,#92400e,#f59e0b,#fde047,#f59e0b)"
                  : isLeading && !isClosed
                  ? "linear-gradient(90deg,#065f46,#10b981,#34d399)"
                  : isVoted
                  ? "linear-gradient(90deg,#065f46,#047857)"
                  : "linear-gradient(90deg,#334155,#475569)";

                return (
                  <div
                    key={i}
                    className={`rounded-2xl overflow-hidden transition-all ${pollOptionGlowClass(i)} ${isVoted ? "ring-2 ring-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.18)]" : ""}`}
                    style={{ animation: "pollOptIn 0.4s ease both", animationDelay: `${i * 70}ms` }}
                  >
                    {/* Option header row — animated gradient bg + styled label */}
                    <div className="px-4 py-3.5" style={pollOptionHeaderStyle(i)}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Colored number circle with pop animation */}
                          <span
                            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                              isVoted ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.55)]" : "text-slate-900 font-black"
                            }`}
                            style={isVoted ? {} : {
                              background: `linear-gradient(135deg, ${OPT_COLORS[i % 8]}, ${OPT_COLORS[i % 8]}99)`,
                              boxShadow: `0 0 12px ${OPT_COLORS[i % 8]}55`,
                              animation: `pollNumPop 0.4s ease both ${i * 70 + 120}ms`,
                            }}
                          >
                            {isVoted ? "✓" : i + 1}
                          </span>
                          {/* Gradient label */}
                          <span className="text-sm font-bold leading-snug break-words min-w-0 tracking-wide">
                            {isWinner ? (
                              <><span className="text-base">🏆 </span><span className="poll-winner-gradient">{o.label}</span></>
                            ) : isLeading && totalVotes > 0 && !isClosed ? (
                              <><span className="text-base">⚡ </span><span className="poll-leading-gradient">{o.label}</span></>
                            ) : (
                              <span style={pollOptionLabelStyle(i)}>{o.label}</span>
                            )}
                          </span>
                        </div>
                        {showBars && (
                          <span className={`shrink-0 text-xs whitespace-nowrap tabular-nums font-semibold ${isWinner ? "text-amber-300" : isLeading && !isClosed ? "text-emerald-400" : "text-slate-400"}`}>
                            {count} vote{count !== 1 ? "s" : ""} · {barPct}%
                          </span>
                        )}
                      </div>
                      {showBars && (
                        <div className="ml-11 h-2.5 bg-black/30 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${barPct}%`,
                              minWidth: barPct > 0 ? "0.25rem" : 0,
                              background: barGradient,
                              boxShadow: isLeading && totalVotes > 0 ? (isWinner ? "0 0 10px rgba(245,158,11,0.5)" : "0 0 10px rgba(16,185,129,0.45)") : "none",
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Description with images */}
                    {hasDesc && (
                      <div className="border-t border-white/[0.05] px-4 py-4 bg-black/10">
                        <div
                          className={`
                            text-sm text-slate-300
                            prose prose-invert prose-sm max-w-none
                            [&_img]:rounded-xl [&_img]:max-w-full [&_img]:my-3 [&_img]:block
                            [&_img]:border [&_img]:border-slate-700/40 [&_img]:shadow-lg
                            [&_img]:max-h-96 [&_img]:w-auto
                            [&_p]:leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0
                            [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:mb-1
                            [&_strong]:text-slate-200 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm
                          `}
                          dangerouslySetInnerHTML={{ __html: o.description }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {!showBars && (
            <p className="text-xs text-slate-500 text-center bg-slate-800/40 rounded-lg py-2.5">
              {poll.pollStatus === "open"
                ? "Vote to see the results"
                : `This poll is ${poll.pollStatus}`}
            </p>
          )}
        </div>

        <div className="px-5 pb-5">
          <button onClick={onClose} className="w-full py-3 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Poll Card ────────────────────────────────────────────────────────────────
function PollCard({ poll, userId, trips, onVoteConfirm, onView, index }) {
  const userVotedIndex = poll.options?.findIndex(
    (o) => (o.votes || []).some((v) => (typeof v === "object" ? v._id : v) === userId)
  );
  const hasVoted        = userVotedIndex >= 0;
  const isClosed        = poll.pollStatus !== "open";
  const totalVotes      = (poll.options || []).reduce((s, o) => s + (o.votes?.length || 0), 0);
  const maxVotes        = Math.max(...(poll.options || []).map((o) => o.votes?.length || 0), 0);
  const eligible        = poll.eligibleMemberCount ?? 0;
  const uniqueResponded = poll.uniqueVoterCount ?? 0;

  const leadingOpts   = totalVotes > 0 ? (poll.options || []).filter((o) => (o.votes?.length || 0) === maxVotes) : [];
  const leadingLabels = leadingOpts.map((o) => o.label).join(", ");
  const canVoteOnPoll = !hasVoted && !isClosed;

  const TYPE_BADGE = {
    general: "bg-blue-600/20 text-blue-300 border border-blue-700/40",
    trip:    "bg-amber-600/20 text-amber-300 border border-amber-700/40",
  };
  const STATUS_BADGE = {
    paused:    "bg-yellow-600/20 text-yellow-300 border-yellow-700/40",
    closed:    "bg-slate-600/40 text-slate-400 border-slate-600/40",
    completed: "bg-amber-950/40 text-amber-200 border-amber-500/50",
  };

  return (
    <li
      className="relative bg-slate-900/90 border border-slate-700/60 rounded-2xl overflow-visible w-full min-w-0 shadow-lg"
      style={{ animation: "pollFadeUp 0.45s ease both", animationDelay: `${index * 80}ms` }}
    >
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <div className="p-4 sm:p-5 flex flex-col gap-3.5 w-full min-w-0">
        {/* ── Header row ── */}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base sm:text-lg text-white leading-snug break-words mb-1.5">
              {poll.title}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE[poll.pollType]}`}>
                {poll.pollType === "trip" ? "Trip Poll" : "General"}
              </span>
              {poll.pollType === "trip" && poll.tripId && (() => {
                const tripName = trips?.find((t) => String(t._id) === String(poll.tripId))?.tripName;
                return tripName ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full"
                    style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", boxShadow: "0 0 8px rgba(139,92,246,0.12)" }}>
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(167,139,250,0.65)" }}>Trip</span>
                    <span className="w-px h-2.5 bg-violet-500/30" />
                    <span className="text-[10px] font-semibold" style={{ color: "#c4b5fd" }}>{tripName}</span>
                  </span>
                ) : null;
              })()}
              {!isClosed ? (
                <span className="flex items-center gap-1 text-[10px] bg-red-700/20 text-red-300 border border-red-700/40 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  Live
                </span>
              ) : (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${STATUS_BADGE[poll.pollStatus] || STATUS_BADGE.closed}`}>
                  {poll.pollStatus}
                </span>
              )}
              {hasVoted && (
                <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-700/40 px-2 py-0.5 rounded-full">
                  ✓ Voted
                </span>
              )}
            </div>
          </div>

          {/* Stats + View button */}
          <div className="shrink-0 flex flex-col items-end gap-2">
            {eligible > 0 && (
              <div className="text-right">
                <p className="text-sm font-bold text-slate-200 tabular-nums leading-tight">
                  {uniqueResponded}<span className="text-slate-500 font-normal text-xs">/{eligible}</span>
                </p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wide">responded</p>
              </div>
            )}
            {eligible <= 0 && totalVotes > 0 && (
              <div className="text-right">
                <p className="text-sm font-bold text-slate-200">{totalVotes}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wide">votes</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => onView(poll)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors border border-slate-700/60"
            >
              <IconEye /> View
            </button>
          </div>
        </div>

        {/* ── Question ── */}
        <p className="text-sm text-slate-400 leading-relaxed break-words whitespace-normal pl-3 border-l-2 border-slate-700/60">
          {poll.question}
        </p>

        {/* ── Leading / Winner banner ── */}
        {leadingOpts.length > 0 && (
          <p className="poll-highlight-line font-semibold leading-snug">
            {isClosed && poll.pollStatus === "completed" ? (
              <>
                <span className="text-base">🏆 </span>
                <span className="poll-winner-gradient font-bold">
                  Winner{leadingOpts.length > 1 ? "s" : ""}: {leadingLabels}
                </span>
              </>
            ) : isClosed ? (
              <>
                <span className="text-base">⏸ </span>
                <span className="poll-paused-gradient font-bold">
                  Leading: {leadingLabels}
                </span>
                <span className="text-slate-500 text-xs font-normal ml-1.5">({maxVotes} vote{maxVotes !== 1 ? "s" : ""})</span>
              </>
            ) : (
              <>
                <span className="text-base">⚡ </span>
                <span className="poll-leading-gradient font-bold">Leading: {leadingLabels}</span>
                <span className="text-slate-500 text-xs font-normal ml-1.5">({maxVotes} vote{maxVotes !== 1 ? "s" : ""})</span>
              </>
            )}
          </p>
        )}

        {/* ── Options ── */}
        <div className="space-y-2 w-full min-w-0">
          {(poll.options || []).map((opt, i) => {
            const count       = opt.votes?.length || 0;
            const eligiblePct = pctOfEligible(count, eligible);
            const shareOfCast = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const barPct      = eligiblePct != null ? eligiblePct : shareOfCast;
            const isLeading   = count === maxVotes && totalVotes > 0;
            const isVoted     = i === userVotedIndex;
            const isWinner    = isLeading && isClosed && poll.pollStatus === "completed";
            const canVote     = canVoteOnPoll;

            const barColor = isWinner
              ? "bg-amber-500"
              : isLeading && !isClosed
              ? "bg-emerald-500"
              : isVoted
              ? "bg-emerald-700"
              : "bg-slate-600";

            const optionInner = (
              <div className="px-3 py-3" style={pollOptionHeaderStyle(i)}>
                <div className="flex items-center gap-2.5 mb-2">
                  <span
                    className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                      isVoted ? "bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "text-slate-900"
                    }`}
                    style={isVoted ? {} : {
                      background: `linear-gradient(135deg, ${OPT_COLORS[i % 8]}, ${OPT_COLORS[i % 8]}88)`,
                      boxShadow: `0 0 8px ${OPT_COLORS[i % 8]}50`,
                    }}
                  >
                    {isVoted ? "✓" : i + 1}
                  </span>
                  <span className="text-sm font-bold leading-snug min-w-0 break-words flex-1 tracking-wide">
                    {isWinner ? (
                      <><span>🏆 </span><span className="poll-winner-gradient">{opt.label}</span></>
                    ) : isLeading && totalVotes > 0 && !isClosed ? (
                      <><span>⚡ </span><span className="poll-leading-gradient">{opt.label}</span></>
                    ) : (
                      <span style={pollOptionLabelStyle(i)}>{opt.label}</span>
                    )}
                  </span>
                  <span className={`shrink-0 text-xs whitespace-nowrap tabular-nums font-semibold ${
                    isWinner ? "text-amber-300" : isLeading && !isClosed ? "text-emerald-400" : "text-slate-400"
                  }`}>
                    {count} · {barPct}%
                  </span>
                  {canVote && <TapVoteIcon />}
                </div>
                <div className="ml-8 h-2 bg-black/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{
                      width: `${barPct}%`,
                      minWidth: barPct > 0 ? "0.25rem" : 0,
                      boxShadow: isWinner ? "0 0 8px rgba(245,158,11,0.5)" : isLeading && !isClosed ? "0 0 8px rgba(16,185,129,0.5)" : "none",
                    }}
                  />
                </div>
              </div>
            );

            return (
              <div
                key={i}
                className={`rounded-xl overflow-hidden transition-all ${pollOptionGlowClass(i)}`}
                style={{ animation: "pollOptIn 0.35s ease both", animationDelay: `${index * 80 + i * 55}ms` }}
              >
                {canVote ? (
                  <button
                    type="button"
                    onClick={() => onVoteConfirm(poll, i)}
                    className="w-full text-left hover:brightness-110 transition-all"
                  >
                    {optionInner}
                  </button>
                ) : optionInner}
              </div>
            );
          })}
        </div>

        {!hasVoted && !isClosed && (
          <p className="text-xs text-slate-500 text-center">Tap an option to cast your vote</p>
        )}
        {isClosed && !hasVoted && (
          <p className="text-xs text-amber-400/70 text-center">This poll is {poll.pollStatus} — no more votes accepted</p>
        )}
      </div>
    </li>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function UserPolls() {
  const { userInfo } = useAppSelector((s) => s.user);
  const { trips }    = useTrip();
  const userId = userInfo?.user?.id || userInfo?.user?._id;

  const [polls, setPolls]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [typeFilter, setTypeFilter]   = useState("all");
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirm, setConfirm]         = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [viewPoll, setViewPoll]       = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (typeFilter !== "all") params.type = typeFilter;
    getUserPolls(params)
      .then((res) => { if (res !== null) setPolls(res?.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);
  useOnlineReload(load);

  const handleVoteConfirm = (poll, optionIndex) => setConfirm({ poll, optionIndex });

  const handleConfirmSubmit = async () => {
    if (!confirm || submitting) return;
    setSubmitting(true);
    try {
      await votePoll(confirm.poll._id, confirm.optionIndex);
      setConfirm(null);
      setShowSuccess(true);
      load();
    } catch (err) {
      alert(err.message || "Failed to vote");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MasterPageShell title="Polls" description="Vote on group decisions">
      <PollAnimStyles />
      <FilterBar value={typeFilter} onChange={setTypeFilter} />

      {loading ? (
        <SyncetraLoader className="py-16" />
      ) : polls.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 flex flex-col items-center gap-3">
          <span className="text-5xl opacity-30">🗳️</span>
          <p className="text-slate-400 text-sm">No polls available right now.</p>
        </div>
      ) : (
        <MasterList className="space-y-4">
          {polls.map((p, index) => (
            <PollCard
              key={p._id}
              poll={p}
              userId={String(userId)}
              trips={trips}
              onVoteConfirm={handleVoteConfirm}
              onView={setViewPoll}
              index={index}
            />
          ))}
        </MasterList>
      )}

      {confirm && (
        <VoteConfirmDialog
          poll={confirm.poll}
          optionLabel={confirm.poll.options[confirm.optionIndex]?.label}
          onConfirm={handleConfirmSubmit}
          onClose={() => !submitting && setConfirm(null)}
          submitting={submitting}
        />
      )}

      {viewPoll && (
        <PollViewModal
          poll={viewPoll}
          userId={String(userId)}
          trips={trips}
          onClose={() => setViewPoll(null)}
        />
      )}

      {showSuccess && <VoteSuccessOverlay onDone={() => setShowSuccess(false)} />}
    </MasterPageShell>
  );
}
