import { useCallback, useEffect, useRef, useState } from "react";
import MasterPageShell, { MasterList } from "../../../components/layout/MasterPageShell";
import SyncetraLoader from "../../../components/ui/SyncetraLoader";
import { pollOptionGlowClass } from "../../../components/polls/pollOptionStyles";
import { useAppSelector } from "../../../hooks";
import { getUserPolls, votePoll } from "../../../services/polls";

// ─── Confetti burst ───────────────────────────────────────────────────────────
const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6", "#f97316"];

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
      x: Math.random() * canvas.width,
      y: -10,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 4 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 7 + 3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      life: 1,
      decay: Math.random() * 0.008 + 0.004,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter((p) => p.life > 0);
      particles.current.forEach((p) => {
        p.x        += p.vx;
        p.y        += p.vy;
        p.rotation += p.rotationSpeed;
        p.life     -= p.decay;
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle   = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      if (particles.current.length > 0) rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  if (!active) return null;
  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
  );
}

// ─── Vote Success Overlay ─────────────────────────────────────────────────────
function VoteSuccessOverlay({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative bg-slate-900 border border-emerald-600/50 rounded-2xl p-10 text-center shadow-2xl overflow-hidden max-w-sm w-full mx-4">
        <Confetti active />
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <h3 className="text-xl font-bold text-white mb-2">Response Confirmed!</h3>
        <p className="text-emerald-400 font-medium text-sm leading-relaxed">
          Your response has been confirmed.<br />Thank you for your participation!
        </p>
        <div className="mt-5 flex justify-center">
          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%", animation: "progress 3.2s linear forwards" }} />
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
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Close
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
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

// ─── Poll Description Modal ───────────────────────────────────────────────────
function PollDescriptionModal({ poll, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hasAnyDescription = (poll.options || []).some((o) => o.description && o.description.trim() !== "" && o.description !== "<p><br></p>");

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-8" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-slate-800 gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-base">{poll.title}</h3>
            <p className="text-sm text-slate-400 mt-0.5">{poll.question}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {!hasAnyDescription ? (
            <p className="text-slate-400 text-sm text-center py-4">No additional description provided for this poll.</p>
          ) : (
            (poll.options || []).map((opt, i) => (
              <div key={i} className={`rounded-xl p-4 ${pollOptionGlowClass(i)}`}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Option {i + 1}</p>
                <p className="text-sm font-medium text-white mb-2">{opt.label}</p>
                {opt.description && opt.description.trim() && opt.description !== "<p><br></p>" ? (
                  <div
                    className="text-sm text-slate-300 prose prose-invert prose-sm max-w-none poll-description-body"
                    dangerouslySetInnerHTML={{ __html: opt.description }}
                  />
                ) : (
                  <p className="text-xs text-slate-500 italic">No description</p>
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-slate-800">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/** % of eligible members (general = all users; trip = trip members). */
function pctOfEligible(voteCount, eligible) {
  const e = Number(eligible) || 0;
  const v = Number(voteCount) || 0;
  if (e <= 0) return null;
  return Math.min(100, Math.round((v / e) * 100));
}

// ─── FilterBar ────────────────────────────────────────────────────────────────
function FilterBar({ value, onChange }) {
  const FILTERS = [
    { value: "all",     label: "All" },
    { value: "general", label: "General" },
    { value: "trip",    label: "Trip" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => (
        <button key={f.value} onClick={() => onChange(f.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${value === f.value ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
          {f.label}
        </button>
      ))}
    </div>
  );
}

// ─── PollCard ─────────────────────────────────────────────────────────────────
function PollCard({ poll, userId, onVoteConfirm, onViewDescription }) {
  const userVotedIndex = poll.options?.findIndex((o) =>
    (o.votes || []).some((v) => (typeof v === "object" ? v._id : v) === userId)
  );
  const hasVoted   = userVotedIndex >= 0;
  const isClosed   = poll.pollStatus !== "open";
  const totalVotes = (poll.options || []).reduce((s, o) => s + (o.votes?.length || 0), 0);
  const maxVotes   = Math.max(...(poll.options || []).map((o) => o.votes?.length || 0), 0);
  const eligible   = poll.eligibleMemberCount ?? 0;
  const uniqueResponded = poll.uniqueVoterCount ?? 0;

  const hasDescriptions = (poll.options || []).some(
    (o) => o.description && o.description.trim() && o.description !== "<p><br></p>"
  );

  const TYPE_BADGE = {
    general: "bg-blue-600/20 text-blue-300 border border-blue-700/40",
    trip:    "bg-amber-600/20 text-amber-300 border border-amber-700/40",
  };

  return (
    <li className="bg-slate-800 rounded-xl overflow-hidden w-full min-w-0">
      <div className="p-4 sm:p-5 flex flex-col gap-3 w-full min-w-0">
        {/* Header */}
        <div className="flex flex-col gap-2 w-full min-w-0">
          <h3 className="font-semibold text-base sm:text-lg text-white leading-snug break-words">
            {poll.title}
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${TYPE_BADGE[poll.pollType]}`}>
              {poll.pollType === "trip" ? "Trip" : "General"}
            </span>
            {isClosed && (
              <span className="text-[10px] bg-slate-600/40 text-slate-400 px-2 py-0.5 rounded-full border border-slate-600/40 capitalize shrink-0">
                {poll.pollStatus}
              </span>
            )}
            <span className="text-xs text-slate-500 shrink-0 sm:ml-auto">
              {eligible > 0 ? (
                <>{uniqueResponded}/{eligible} responded</>
              ) : (
                <>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</>
              )}
            </span>
          </div>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed break-words whitespace-normal">
          {poll.question}
        </p>

        {hasDescriptions && (
          <button
            type="button"
            onClick={() => onViewDescription(poll)}
            className="poll-view-desc-btn w-full sm:w-auto justify-center sm:justify-start"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View Description
          </button>
        )}

        {/* Options */}
        <div className="space-y-2 w-full min-w-0">
          {(poll.options || []).map((opt, i) => {
            const count    = opt.votes?.length || 0;
            const eligiblePct = pctOfEligible(count, eligible);
            const shareOfCast = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const barPct    = eligiblePct != null ? eligiblePct : shareOfCast;
            const isVoted  = i === userVotedIndex;
            const isWinner = hasVoted && count === maxVotes && maxVotes > 0;

            return (
              <button
                key={i}
                type="button"
                disabled={hasVoted || isClosed}
                onClick={() => !hasVoted && !isClosed && onVoteConfirm(poll, i)}
                className={`w-full min-w-0 text-left rounded-xl border transition-all overflow-hidden ${
                  isVoted
                    ? "border-emerald-600/60 bg-emerald-950/30"
                    : hasVoted || isClosed
                    ? "border-slate-700 bg-slate-900/40 opacity-70 cursor-default"
                    : "border-slate-700 bg-slate-900/40 hover:border-emerald-600/40 hover:bg-emerald-950/10 cursor-pointer active:scale-[0.99]"
                }`}
              >
                <div className="px-3 sm:px-4 py-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 sm:gap-2">
                    <span className={`text-sm font-medium leading-snug break-words min-w-0 ${isVoted ? "text-emerald-300" : "text-slate-200"}`}>
                      {isVoted && "✓ "}{opt.label}
                      {isWinner && (
                        <span className="ml-1.5 text-[10px] bg-emerald-600/30 text-emerald-400 px-1.5 py-0.5 rounded-full whitespace-nowrap">Leading</span>
                      )}
                    </span>
                    {(hasVoted || isClosed) && (
                      <span className="text-xs text-slate-400 shrink-0 whitespace-nowrap">
                        {count} ({barPct}%
                        {eligiblePct != null ? " of members" : " of votes"})
                      </span>
                    )}
                  </div>

                  {(hasVoted || isClosed) && (
                    <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isWinner ? "bg-emerald-500" : isVoted ? "bg-emerald-700" : "bg-slate-600"}`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {!hasVoted && !isClosed && (
          <p className="text-xs text-slate-500 text-center">Tap an option to cast your vote</p>
        )}
        {isClosed && !hasVoted && (
          <p className="text-xs text-amber-400/70 text-center">This poll is {poll.pollStatus}</p>
        )}
      </div>
    </li>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function UserPolls() {
  const { userInfo } = useAppSelector((s) => s.user);
  const userId = userInfo?.user?.id || userInfo?.user?._id;

  const [polls, setPolls]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [showSuccess, setShowSuccess] = useState(false);

  // Confirmation state: { poll, optionIndex } | null
  const [confirm, setConfirm]         = useState(null);
  const [submitting, setSubmitting]   = useState(false);

  // Description modal
  const [descPoll, setDescPoll] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter !== "all") params.type = typeFilter;
      const res = await getUserPolls(params);
      setPolls(res?.data || []);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleVoteConfirm = (poll, optionIndex) => {
    setConfirm({ poll, optionIndex });
  };

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
          {polls.map((p) => (
            <PollCard
              key={p._id}
              poll={p}
              userId={String(userId)}
              onVoteConfirm={handleVoteConfirm}
              onViewDescription={setDescPoll}
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

      {descPoll && (
        <PollDescriptionModal poll={descPoll} onClose={() => setDescPoll(null)} />
      )}

      {showSuccess && <VoteSuccessOverlay onDone={() => setShowSuccess(false)} />}
    </MasterPageShell>
  );
}
