import { useEffect, useState, useCallback, useRef } from "react";
import { useAppSelector } from "../../../hooks";
import { useDeleteConfirm } from "../../../hooks/useDeleteConfirm";
import { useActionPopup } from "../../../hooks/useActionPopup";
import { useTrip } from "../../../context/TripContext";
import { useOnlineReload } from "../../../hooks/useOnlineReload";
import {
  getPolls,
  createPoll,
  updatePoll,
  deletePoll,
  getPollAnalytics,
} from "../../../services/polls";
import { deletePendingItem } from "../../../utils/offlinePendingOps";
import { ROLES } from "../../../constants/enum";
import MasterPageShell, {
  MasterList,
  MasterListItem,
  MasterListEmpty,
} from "../../../components/layout/MasterPageShell";
import SyncetraLoader from "../../../components/ui/SyncetraLoader";
import SearchableSelect from "../../../components/ui/SearchableSelect";
import {
  pollOptionGlowClass,
  OPT_COLORS,
  pollOptionHeaderStyle,
  pollOptionLabelStyle,
} from "../../../components/polls/pollOptionStyles";

// ─── Poll animation styles ────────────────────────────────────────────────────
function PollAnimStyles() {
  return (
    <style>{`
      @keyframes pollNumPop {
        0%   { transform: scale(0.6); opacity: 0; }
        70%  { transform: scale(1.15); }
        100% { transform: scale(1);   opacity: 1; }
      }
      @keyframes pollOptSlideIn {
        from { opacity: 0; transform: translateX(-8px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes qLabelShimmer {
        from { background-position: 0% center; }
        to   { background-position: 200% center; }
      }
      @keyframes qBorderPulse {
        0%,100% { opacity: 0.4; }
        50%     { opacity: 1; }
      }
    `}</style>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const IconEye = () => (
  <svg
    className="w-3.5 h-3.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);
const IconEdit = () => (
  <svg
    className="w-3.5 h-3.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);
const IconTrash = () => (
  <svg
    className="w-3.5 h-3.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);
const IconChart = () => (
  <svg
    className="w-3.5 h-3.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);
const IconX = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);
const IconLock = () => (
  <svg
    className="w-3.5 h-3.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);
const IconChevronDown = () => (
  <svg
    className="w-3.5 h-3.5 shrink-0 text-slate-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

// ─── Status + type meta ───────────────────────────────────────────────────────
const STATUS_META = {
  open: {
    label: "Live",
    icon: "📡",
    cls: "bg-red-700/20 text-red-300 border-red-700/40",
  },
  paused: {
    label: "Paused",
    icon: "⏸",
    cls: "bg-yellow-600/20 text-yellow-300 border-yellow-700/40",
  },
  closed: {
    label: "Closed",
    icon: "🔒",
    cls: "bg-slate-600/40 text-slate-400 border-slate-600/40",
  },
  completed: {
    label: "Completed",
    icon: "🏆",
    cls: "bg-amber-950/40 text-amber-200 border-amber-500/50",
  },
};

function StatusBadge({ status, className = "" }) {
  const meta = STATUS_META[status] || STATUS_META.open;
  return (
    <span
      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${meta.cls} ${className}`}
    >
      {status === "open" ? (
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
      ) : (
        <span>{meta.icon}</span>
      )}
      <span>{meta.label}</span>
    </span>
  );
}

const TYPE_BADGE = {
  general: "bg-blue-600/20 text-blue-300 border border-blue-700/40",
  trip: "bg-amber-600/20 text-amber-300 border border-amber-700/40",
};

/** Equal-width action column on sm+ */
const POLL_BTN_COL = "w-full sm:w-[7.25rem]";
const pollActionBtn = (extra) =>
  `${POLL_BTN_COL} inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${extra}`;

const VALID_POLL_STATUSES = ["open", "paused", "closed", "completed"];

function StatusDropdownRow({ status }) {
  const meta = STATUS_META[status] || STATUS_META.open;
  return (
    <span className="flex items-center gap-1.5 min-w-0">
      {status === "open" ? (
        <span
          className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0"
          aria-hidden
        />
      ) : (
        <span
          className="shrink-0 text-[12px] leading-none w-4 text-center"
          aria-hidden
        >
          {meta.icon}
        </span>
      )}
      <span className="truncate">{meta.label}</span>
    </span>
  );
}

/** % of eligible members who picked this option (0–100) */
function pctOfEligible(voteCount, eligible) {
  const e = Number(eligible) || 0;
  const v = Number(voteCount) || 0;
  if (e <= 0) return null;
  return Math.min(100, Math.round((v / e) * 100));
}

/** Largest-remainder rounding so all option percentages sum to exactly 100 */
function largestRemainderPct(counts, total) {
  if (!total) return counts.map(() => 0);
  const raw = counts.map((c) => (c / total) * 100);
  const floored = raw.map(Math.floor);
  let rem = 100 - floored.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; k < rem; k++) floored[order[k].i]++;
  return floored;
}

// ─── Status: custom dropdown (icons + live dot; native <select> cannot show them) ─
function PollStatusSelect({ status, pollId, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) close();
    };
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (next) => {
    setOpen(false);
    if (next !== status) onStatusChange(pollId, next);
  };

  const triggerId = `poll-status-trigger-${pollId}`;
  const listId = `poll-status-list-${pollId}`;

  return (
    <div ref={rootRef} className={`${POLL_BTN_COL} relative`}>
      <label
        htmlFor={triggerId}
        className="text-[9px] text-slate-500 uppercase tracking-wide text-center mb-1 block"
      >
        Status
      </label>
      <button
        type="button"
        id={triggerId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg bg-slate-950 border text-[11px] text-slate-200 cursor-pointer hover:border-slate-500 focus:outline-none focus:border-emerald-600/70 focus:ring-1 focus:ring-emerald-600/30 ${open ? "border-emerald-600/70 ring-1 ring-emerald-600/30" : "border-slate-600"}`}
      >
        <StatusDropdownRow status={status} />
        <span
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <IconChevronDown />
        </span>
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={triggerId}
          className="absolute left-0 right-0 top-full z-[60] mt-1 py-1 rounded-lg bg-slate-900 border border-slate-600 shadow-xl shadow-black/40 overflow-hidden"
        >
          {VALID_POLL_STATUSES.map((s) => (
            <li key={s} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={s === status}
                onClick={() => pick(s)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-[11px] transition-colors ${
                  s === status
                    ? "bg-slate-800 text-white"
                    : "text-slate-200 hover:bg-slate-800/80"
                }`}
              >
                <StatusDropdownRow status={s} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── AnalyticsModal ───────────────────────────────────────────────────────────
function AnalyticsModal({ pollId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPollAnalytics(pollId)
      .then((r) => setData(r?.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pollId]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isCompleted = data?.poll?.pollStatus === "completed";
  const leadingLabels =
    data?.analytics?.filter((opt) => opt.isLeading).map((opt) => opt.label) ||
    [];
  const leadersText = leadingLabels.join(", ");
  const participationPct =
    data?.eligibleMemberCount > 0
      ? Math.round((data.uniqueVoterCount / data.eligibleMemberCount) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow:
            "0 0 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(148,163,184,0.08)",
        }}
      >
        {/* ── Header ── */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 px-5 pt-5 pb-4 rounded-t-2xl z-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-lg text-white tracking-tight">
                Poll Analytics
              </h3>
              {data?.poll && (
                <StatusBadge status={data.poll.pollStatus} className="mt-1.5" />
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 shrink-0 mt-0.5 transition-colors"
            >
              <IconX />
            </button>
          </div>
        </div>

        {loading ? (
          <SyncetraLoader className="py-16" />
        ) : !data ? (
          <p className="text-red-400 p-6 text-center text-sm">
            Failed to load analytics
          </p>
        ) : (
          <>
            {/* ── Poll info ── */}
            <div className="px-5 pt-4 pb-4 border-b border-slate-800/60">
              <p className="text-xs text-slate-400 leading-relaxed mb-1.5">
                {data.poll.question}
              </p>
              <p className="text-base font-bold text-white leading-snug">
                {data.poll.title}
              </p>
            </div>

            {/* ── Stats summary ── */}
            <div className="px-5 py-4 border-b border-slate-800/60">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-800/60 rounded-xl p-4 text-center border border-slate-700/40">
                  <p className="text-3xl font-black text-slate-300 tabular-nums leading-none mb-1.5">
                    {data.eligibleMemberCount}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Eligible Members
                  </p>
                </div>
                <div
                  className="rounded-xl p-4 text-center border border-emerald-700/30"
                  style={{ background: "rgba(16,185,129,0.06)" }}
                >
                  <p className="text-3xl font-black text-emerald-400 tabular-nums leading-none mb-1.5">
                    {data.totalVotes}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Total Votes
                  </p>
                </div>
              </div>
              {data.eligibleMemberCount > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Participation Rate
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      {participationPct}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400 transition-all duration-700"
                      style={{
                        width: `${participationPct}%`,
                        boxShadow: "0 0 8px rgba(16,185,129,0.4)",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Leading / Winner banner ── */}
            {leadersText && (
              <div className="px-5 py-3 border-b border-slate-800/60">
                <p className="font-semibold text-sm leading-snug">
                  {isCompleted ? (
                    <>
                      <span className="text-base">🏆 </span>
                      <span className="poll-winner-gradient font-bold">
                        Winner{leadingLabels.length > 1 ? "s" : ""}:{" "}
                        {leadersText}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-base">⚡ </span>
                      <span className="poll-leading-gradient font-bold">
                        Leading: {leadersText}
                      </span>
                    </>
                  )}
                </p>
              </div>
            )}

            {/* ── Options ── */}
            <div className="p-5 space-y-3">
              {data.analytics.map((opt) => {
                const isLeadingOpt = opt.isLeading && data.totalVotes > 0;
                const barGradient = isLeadingOpt
                  ? isCompleted
                    ? "linear-gradient(90deg,#92400e,#f59e0b,#fde047,#f59e0b)"
                    : "linear-gradient(90deg,#065f46,#10b981,#34d399)"
                  : "linear-gradient(90deg,#334155,#475569)";

                return (
                  <div
                    key={opt.index}
                    className={`rounded-2xl border overflow-hidden ${
                      isLeadingOpt
                        ? isCompleted
                          ? "border-amber-500/40"
                          : "border-emerald-600/40"
                        : "border-slate-700/50"
                    }`}
                    style={{
                      background: isLeadingOpt
                        ? isCompleted
                          ? "linear-gradient(135deg,rgba(120,53,15,0.15) 0%,rgba(15,23,42,0.9) 100%)"
                          : "linear-gradient(135deg,rgba(6,78,59,0.15) 0%,rgba(15,23,42,0.9) 100%)"
                        : "rgba(30,41,59,0.4)",
                    }}
                  >
                    <div className="p-4">
                      {/* Label + vote count row */}
                      <div className="flex items-start gap-3 mb-3">
                        {isLeadingOpt && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 border ${
                              isCompleted
                                ? "bg-amber-600/20 text-amber-300 border-amber-500/30"
                                : "bg-emerald-600/20 text-emerald-300 border-emerald-500/30"
                            }`}
                          >
                            {isCompleted ? "Winner" : "Leading"}
                          </span>
                        )}
                        <span className="text-sm font-semibold text-white flex-1 leading-snug min-w-0 break-words">
                          {opt.label}
                        </span>
                        <span
                          className={`text-2xl font-black tabular-nums shrink-0 leading-none ${
                            isLeadingOpt
                              ? isCompleted
                                ? "text-amber-300"
                                : "text-emerald-400"
                              : "text-slate-400"
                          }`}
                        >
                          {opt.voteCount}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${opt.percentage}%`,
                            minWidth: opt.percentage > 0 ? "0.5rem" : 0,
                            background: barGradient,
                            boxShadow: isLeadingOpt
                              ? isCompleted
                                ? "0 0 10px rgba(245,158,11,0.5)"
                                : "0 0 10px rgba(16,185,129,0.45)"
                              : "none",
                          }}
                        />
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span
                          className={`font-bold tabular-nums ${
                            isLeadingOpt
                              ? isCompleted
                                ? "text-amber-300"
                                : "text-emerald-400"
                              : "text-slate-300"
                          }`}
                        >
                          {opt.percentage}%
                        </span>
                        <span className="text-slate-600">of members</span>
                        {data.totalVotes > 0 && (
                          <>
                            <span className="text-slate-700 select-none">
                              ·
                            </span>
                            <span className="font-bold tabular-nums text-slate-300">
                              {opt.voteSharePercent}%
                            </span>
                            <span className="text-slate-600">of votes</span>
                          </>
                        )}
                      </div>

                      {/* Voter chips */}
                      {opt.voters.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700/40 flex flex-wrap gap-1.5">
                          {opt.voters.map((v, vi) => (
                            <span
                              key={vi}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-700/50 border border-slate-600/40 text-slate-300 text-xs font-medium"
                            >
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  isLeadingOpt && !isCompleted
                                    ? "bg-emerald-800/70 text-emerald-300"
                                    : isLeadingOpt && isCompleted
                                      ? "bg-amber-800/70 text-amber-300"
                                      : "bg-slate-600 text-slate-300"
                                }`}
                              >
                                {(v.name || "?")[0].toUpperCase()}
                              </span>
                              {v.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── ViewPollModal (read-only) ────────────────────────────────────────────────
function ViewPollModal({ poll, trips, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const status = poll.pollStatus || "open";
  const statusMeta = STATUS_META[status] || STATUS_META.open;
  const trip =
    poll.tripId && trips.find((t) => String(t._id) === String(poll.tripId));
  const eligible = poll.eligibleMemberCount ?? 0;
  const uniqueResponded = poll.uniqueVoterCount ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-slate-800">
          <div className="min-w-0 flex-1 pr-2">
            <h3 className="font-semibold text-lg text-emerald-400 leading-snug break-words">
              {poll.title}
            </h3>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE[poll.pollType]}`}
              >
                {poll.pollType === "trip" ? "Trip Poll" : "General"}
              </span>
              {poll.pollType === "trip" && trip && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full"
                  style={{
                    background: "rgba(139,92,246,0.12)",
                    border: "1px solid rgba(139,92,246,0.3)",
                    boxShadow: "0 0 8px rgba(139,92,246,0.12)",
                  }}
                >
                  <span
                    className="text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: "rgba(167,139,250,0.65)" }}
                  >
                    Trip
                  </span>
                  <span className="w-px h-2.5 bg-violet-500/30" />
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: "#c4b5fd" }}
                  >
                    {trip.tripName}
                  </span>
                </span>
              )}
              <StatusBadge status={status} />
              {eligible > 0 && (
                <span className="text-[10px] text-slate-400 border border-slate-700/50 bg-slate-800/50 px-2 py-0.5 rounded-full">
                  {uniqueResponded}/{eligible} responded
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 shrink-0"
          >
            <IconX />
          </button>
        </div>
        <div className="p-5 space-y-5">
          {/* ── Question section ── */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              border: "1px solid rgba(16,185,129,0.18)",
              background:
                "linear-gradient(135deg,rgba(16,185,129,0.05) 0%,rgba(2,6,23,0.6) 100%)",
            }}
          >
            {/* Header strip */}
            <div
              className="flex items-center gap-2.5 px-4 py-2.5"
              style={{
                background:
                  "linear-gradient(90deg,rgba(16,185,129,0.14) 0%,rgba(16,185,129,0.03) 80%,transparent 100%)",
                borderBottom: "1px solid rgba(16,185,129,0.12)",
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0.8, flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
              </svg>
              <span
                className="text-[10px] font-black tracking-[0.28em] uppercase"
                style={{
                  background:
                    "linear-gradient(90deg,#10b981,#34d399,#6ee7b7,#34d399,#10b981)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "qLabelShimmer 3s linear infinite",
                }}
              >
                Question
              </span>
            </div>
            {/* Question text */}
            <div className="px-4 py-3.5 flex gap-3">
              <div
                className="w-0.5 rounded-full shrink-0 mt-1 self-stretch"
                style={{
                  background:
                    "linear-gradient(180deg,#10b981,#34d399,transparent)",
                  animation: "qBorderPulse 2.5s ease-in-out infinite",
                }}
              />
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {poll.question}
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-3">
              Options{" "}
              <span className="normal-case text-slate-600">
                ({(poll.options || []).length})
              </span>
            </p>
            <div className="space-y-3">
              {(poll.options || []).map((o, i) => {
                const c = o.votes?.length || 0;
                const pct = pctOfEligible(c, eligible);
                const barPct = pct ?? 0;
                const hasDesc =
                  o.description &&
                  o.description.trim() &&
                  o.description !== "<p><br></p>";
                return (
                  <div
                    key={i}
                    className={`rounded-2xl overflow-hidden ${pollOptionGlowClass(i)}`}
                  >
                    {/* Option header + progress — animated bg + gradient label */}
                    <div
                      className="px-4 py-3.5"
                      style={pollOptionHeaderStyle(i)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-slate-900"
                          style={{
                            background: `linear-gradient(135deg, ${OPT_COLORS[i % 8]}, ${OPT_COLORS[i % 8]}88)`,
                            boxShadow: `0 0 10px ${OPT_COLORS[i % 8]}55`,
                          }}
                        >
                          {i + 1}
                        </span>
                        <span
                          className="text-sm font-bold leading-snug break-words flex-1 min-w-0 tracking-wide"
                          style={pollOptionLabelStyle(i)}
                        >
                          {o.label}
                        </span>
                        <span className="shrink-0 text-xs text-slate-400 whitespace-nowrap tabular-nums font-semibold">
                          {c} vote{c !== 1 ? "s" : ""}
                          {pct != null && (
                            <span className="ml-1 text-slate-200">
                              · {pct}%
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="ml-10 h-2 bg-black/30 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${barPct}%`,
                            background: `linear-gradient(90deg, ${OPT_COLORS[i % 8]}88, ${OPT_COLORS[i % 8]})`,
                            boxShadow:
                              barPct > 0
                                ? `0 0 8px ${OPT_COLORS[i % 8]}55`
                                : "none",
                          }}
                        />
                      </div>
                    </div>
                    {/* Description with images */}
                    {hasDesc ? (
                      <div className="border-t border-white/[0.05] px-4 py-3.5 bg-black/10">
                        <div
                          className={`
                            text-sm text-slate-300
                            prose prose-invert prose-sm max-w-none
                            [&_img]:rounded-xl [&_img]:max-w-full [&_img]:my-3 [&_img]:block
                            [&_img]:border [&_img]:border-slate-700/40 [&_img]:shadow-lg
                            [&_img]:max-h-80 [&_img]:w-auto
                            [&_p]:leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0
                            [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:mb-1
                            [&_strong]:text-slate-200
                          `}
                          dangerouslySetInnerHTML={{ __html: o.description }}
                        />
                      </div>
                    ) : (
                      <div className="px-4 py-2.5 border-t border-white/[0.04]">
                        <p className="text-xs text-slate-600 italic">
                          No description
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EditPollModal ────────────────────────────────────────────────────────────
function EditPollModal({ poll, trips, onClose, onSaved, isSuperAdmin }) {
  const totalVotes = (poll.options || []).reduce(
    (s, o) => s + (o.votes?.length || 0),
    0,
  );
  const canEditOptions = totalVotes === 0;

  const [form, setForm] = useState({
    title: poll.title || "",
    question: poll.question || "",
    pollType: poll.pollType || "general",
    tripId: poll.tripId || "",
  });
  const [options, setOptions] = useState(() =>
    (poll.options || []).map((o) => ({
      label: o.label || "",
      description: o.description || "",
    })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [RteComponent, setRteComponent] = useState(null);
  const [rteStatus, setRteStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    import("../../../components/ui/RichTextEditor")
      .then((m) => {
        if (!cancelled) {
          setRteComponent(() => m.default);
          setRteStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setRteStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const setOpt = (i, field, val) =>
    setOptions((prev) =>
      prev.map((o, idx) => (idx === i ? { ...o, [field]: val } : o)),
    );

  const addOption = () =>
    setOptions((p) => [...p, { label: "", description: "" }]);
  const removeOption = (i) =>
    setOptions((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const filled = options.filter((o) => o.label.trim());
    if (filled.length < 2) {
      setError("Add at least 2 options");
      return;
    }
    setSaving(true);
    try {
      const payload = { title: form.title, question: form.question };
      if (canEditOptions) payload.options = filled;
      if (isSuperAdmin) {
        payload.pollType = form.pollType;
        payload.tripId = form.pollType === "trip" ? form.tripId || null : null;
      }
      await updatePoll(poll._id, payload);
      onSaved(false);
    } catch (err) {
      if (err.offline) {
        onSaved(true);
        return;
      }
      setError(err.message || "Failed to update poll");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500";
  const trip =
    poll.tripId && trips.find((t) => String(t._id) === String(poll.tripId));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
          <h3 className="font-semibold text-emerald-400">Edit Poll</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400"
          >
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input
            placeholder="Poll title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputCls}
            required
          />
          <textarea
            placeholder="Question *"
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            className={`${inputCls} resize-none`}
            rows={2}
            required
          />

          {isSuperAdmin ? (
            /* Super admin: poll type/trip always editable (options locked only if votes exist) */
            <div className="flex gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex-1 min-w-[160px]">
                <label className="text-xs text-slate-400 block mb-1">
                  Poll Type
                </label>
                <SearchableSelect
                  value={form.pollType}
                  onChange={(pollType) =>
                    setForm((f) => ({ ...f, pollType, tripId: "" }))
                  }
                  options={[
                    { value: "general", label: "General (all members)" },
                    { value: "trip", label: "Trip-based" },
                  ]}
                  searchable={false}
                  placeholder="Poll type"
                />
              </div>
              {form.pollType === "trip" && (
                <div className="flex-1 min-w-[160px]">
                  <label className="text-xs text-slate-400 block mb-1">
                    Select Trip
                  </label>
                  <SearchableSelect
                    value={form.tripId}
                    onChange={(tripId) => setForm((f) => ({ ...f, tripId }))}
                    options={[
                      { value: "", label: "— Choose trip —" },
                      ...trips.map((t) => ({
                        value: t._id,
                        label: t.tripName,
                      })),
                    ]}
                    placeholder="— Choose trip —"
                    searchPlaceholder="Search trips…"
                  />
                </div>
              )}
            </div>
          ) : (
            /* Read-only type display for non-super-admin */
            <div className="rounded-lg bg-slate-800/40 border border-slate-700/60 px-3 py-2 text-xs text-slate-400">
              <span className="text-slate-300">Type:</span>{" "}
              {poll.pollType === "trip"
                ? `Trip poll${trip ? ` · ${trip.tripName}` : ""}`
                : "General (all members)"}
            </div>
          )}
          {!canEditOptions && (
            <div className="rounded-lg bg-amber-950/20 border border-amber-700/30 px-3 py-2 text-xs text-amber-400/90">
              ⚠ Option labels are locked because votes have been recorded. You
              can still edit the title, question, and poll type/trip assignment.
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-400 uppercase tracking-wide">
                Options
              </label>
              {canEditOptions && (
                <button
                  type="button"
                  onClick={addOption}
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  + Add option
                </button>
              )}
            </div>
            <div className="space-y-3">
              {options.map((opt, i) => (
                <div
                  key={i}
                  className="bg-slate-800/60 rounded-xl p-3 space-y-2"
                >
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-slate-500 w-5 shrink-0">
                      {i + 1}.
                    </span>
                    <input
                      placeholder="Option label *"
                      value={opt.label}
                      onChange={(e) => setOpt(i, "label", e.target.value)}
                      disabled={!canEditOptions}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm disabled:opacity-50"
                    />
                    {canEditOptions && options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <IconTrash />
                      </button>
                    )}
                  </div>
                  {canEditOptions && (
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 block">
                        Description (optional)
                      </label>
                      {rteStatus === "loading" && (
                        <div className="min-h-[120px] rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xs text-slate-500">
                          Loading editor…
                        </div>
                      )}
                      {rteStatus === "ready" && RteComponent && (
                        <RteComponent
                          value={opt.description}
                          onChange={(html) => setOpt(i, "description", html)}
                          placeholder="Option details…"
                          minHeight={120}
                        />
                      )}
                      {rteStatus === "error" && (
                        <textarea
                          placeholder="Description"
                          value={opt.description}
                          onChange={(e) =>
                            setOpt(i, "description", e.target.value)
                          }
                          className="w-full min-h-[120px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300"
                        />
                      )}
                    </div>
                  )}
                  {!canEditOptions && opt.description && (
                    <div
                      className="poll-option-desc text-xs border border-slate-700/50 rounded-lg p-2 bg-slate-950/50"
                      dangerouslySetInnerHTML={{ __html: opt.description }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg font-medium text-sm"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm text-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── CreatePollModal ──────────────────────────────────────────────────────────
function CreatePollModal({ onClose, onCreated, trips }) {
  const [form, setForm] = useState({
    title: "",
    question: "",
    pollType: "general",
    tripId: "",
  });
  const [options, setOptions] = useState([
    { label: "", description: "" },
    { label: "", description: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [RteComponent, setRteComponent] = useState(null);
  const [rteStatus, setRteStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    import("../../../components/ui/RichTextEditor")
      .then((m) => {
        if (!cancelled) {
          setRteComponent(() => m.default);
          setRteStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setRteStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const setOpt = (i, field, val) =>
    setOptions((prev) =>
      prev.map((o, idx) => (idx === i ? { ...o, [field]: val } : o)),
    );

  const addOption = () =>
    setOptions((p) => [...p, { label: "", description: "" }]);
  const removeOption = (i) =>
    setOptions((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const filled = options.filter((o) => o.label.trim());
    if (filled.length < 2) {
      setError("Add at least 2 options");
      return;
    }
    setSaving(true);
    try {
      await createPoll({
        ...form,
        tripId: form.pollType === "trip" ? form.tripId : null,
        options: filled,
      });
      onCreated();
    } catch (err) {
      if (err.queued) {
        onCreated();
      } else {
        setError(err.message || "Failed to create poll");
      }
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
          <h3 className="font-semibold text-emerald-400">New Poll</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400"
          >
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input
            placeholder="Poll title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputCls}
            required
          />
          <textarea
            placeholder="Question *"
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            className={`${inputCls} resize-none`}
            rows={2}
            required
          />

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-400 block mb-1">
                Poll Type
              </label>
              <SearchableSelect
                value={form.pollType}
                onChange={(pollType) => setForm({ ...form, pollType })}
                options={[
                  { value: "general", label: "General (all members)" },
                  { value: "trip", label: "Trip-based" },
                ]}
                searchable={false}
                placeholder="Poll type"
              />
            </div>
            {form.pollType === "trip" && (
              <div className="flex-1">
                <label className="text-xs text-slate-400 block mb-1">
                  Select Trip
                </label>
                <SearchableSelect
                  value={form.tripId}
                  onChange={(tripId) => setForm({ ...form, tripId })}
                  options={[
                    { value: "", label: "— Choose trip —" },
                    ...trips.map((t) => ({ value: t._id, label: t.tripName })),
                  ]}
                  placeholder="— Choose trip —"
                  searchPlaceholder="Search trips…"
                  required
                />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-400 uppercase tracking-wide">
                Options
              </label>
              <button
                type="button"
                onClick={addOption}
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                + Add option
              </button>
            </div>
            <div className="space-y-3">
              {options.map((opt, i) => (
                <div
                  key={i}
                  className="bg-slate-800/60 rounded-xl p-3 space-y-2"
                >
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-slate-500 w-5 shrink-0">
                      {i + 1}.
                    </span>
                    <input
                      placeholder="Option label *"
                      value={opt.label}
                      onChange={(e) => setOpt(i, "label", e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <IconTrash />
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 block">
                      Description (optional)
                    </label>
                    {rteStatus === "loading" && (
                      <div className="min-h-[120px] rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xs text-slate-500">
                        Loading editor…
                      </div>
                    )}
                    {rteStatus === "ready" && RteComponent && (
                      <RteComponent
                        value={opt.description}
                        onChange={(html) => setOpt(i, "description", html)}
                        placeholder="Add details so members understand this option…"
                        minHeight={120}
                      />
                    )}
                    {rteStatus === "error" && (
                      <textarea
                        placeholder="Description (plain text)"
                        value={opt.description}
                        onChange={(e) =>
                          setOpt(i, "description", e.target.value)
                        }
                        className="w-full min-h-[120px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg font-medium text-sm"
            >
              {saving ? "Creating…" : "Create Poll"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm text-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── PollCard ─────────────────────────────────────────────────────────────────
function PollMemberStat({ label, value, variant, className = "" }) {
  return (
    <div className={`poll-admin-stat-col ${className}`}>
      <span className="poll-admin-stat-label">{label}</span>
      <div className={`poll-admin-stat-box poll-admin-stat-box--${variant}`}>
        {value}
      </div>
    </div>
  );
}

function PollPendingBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/50 text-amber-300 text-[10px] font-semibold tracking-wide uppercase">
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_#fbbf24]" />
      Not Synced
    </span>
  );
}

function PollCard({
  poll,
  isAdminUser,
  isSuperAdmin,
  trips,
  onView,
  onEdit,
  onAnalytics,
  onStatusChange,
  onDelete,
}) {
  const status = poll.pollStatus || "open";
  const statusMeta = STATUS_META[status] || STATUS_META.open;
  const totalVotes = (poll.options || []).reduce(
    (s, o) => s + (o.votes?.length || 0),
    0,
  );
  const maxVotes = Math.max(
    ...(poll.options || []).map((o) => o.votes?.length || 0),
    0,
  );
  const leadingOpts =
    totalVotes > 0
      ? (poll.options || []).filter((o) => (o.votes?.length || 0) === maxVotes)
      : [];
  const leadingLabels = leadingOpts.map((o) => o.label).join(", ");
  const eligible = poll.eligibleMemberCount ?? 0;
  const uniqueResponded = poll.uniqueVoterCount ?? 0;

  return (
    <MasterListItem className="w-full min-w-0 !overflow-visible">
      <div className="flex w-full min-w-0 flex-col sm:flex-row sm:items-stretch gap-4 p-4">
        <div className="flex-1 min-w-0">
          {/* Title row — stats pinned top-right */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0 flex-1 pr-1">
              <h3 className="font-semibold text-base sm:text-lg text-white leading-snug break-words">
                {poll.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 border ${TYPE_BADGE[poll.pollType]}`}
                >
                  {poll.pollType === "trip" ? "Trip Poll" : "General"}
                </span>
                {poll.pollType === "trip" &&
                  poll.tripId &&
                  (() => {
                    const tripName = trips?.find(
                      (t) => String(t._id) === String(poll.tripId),
                    )?.tripName;
                    return tripName ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full shrink-0"
                        style={{
                          background: "rgba(139,92,246,0.12)",
                          border: "1px solid rgba(139,92,246,0.3)",
                          boxShadow: "0 0 8px rgba(139,92,246,0.12)",
                        }}
                      >
                        <span
                          className="text-[9px] font-bold uppercase tracking-widest"
                          style={{ color: "rgba(167,139,250,0.65)" }}
                        >
                          Trip
                        </span>
                        <span className="w-px h-2.5 bg-violet-500/30" />
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: "#c4b5fd" }}
                        >
                          {tripName}
                        </span>
                      </span>
                    ) : null;
                  })()}
                <StatusBadge status={status} className="shrink-0" />
                {poll._pending && <PollPendingBadge />}
              </div>
            </div>
            {eligible > 0 && (
              <div className="flex items-start gap-2 shrink-0">
                <PollMemberStat
                  label="Members"
                  value={eligible}
                  variant="members"
                />
                <PollMemberStat
                  label="Voted"
                  value={uniqueResponded}
                  variant="voted"
                />
              </div>
            )}
          </div>

          <p className="text-sm sm:text-base text-slate-300 mb-2.5 whitespace-pre-wrap break-words leading-relaxed">
            {poll.question}
          </p>

          <div className="mt-0.5">
            {leadingOpts.length > 0 && status === "open" && (
              <p className="poll-highlight-line mt-5 mb-8 font-semibold leading-snug">
                <span className="inline">
                  <span className="text-base" aria-hidden>
                    ⚡{" "}
                  </span>
                  <span className="poll-leading-gradient font-bold">
                    Leading: {leadingLabels}
                  </span>
                </span>
                <span className="text-slate-500 text-xs font-normal ml-1.5">
                  ({maxVotes} vote{maxVotes !== 1 ? "s" : ""})
                </span>
              </p>
            )}
            {leadingOpts.length > 0 && status === "completed" && (
              <p className="poll-highlight-line mt-5 mb-8 font-semibold leading-snug">
                <span className="inline">
                  <span className="text-base" aria-hidden>
                    🏆{" "}
                  </span>
                  <span className="poll-winner-gradient font-bold">
                    Winner{leadingOpts.length > 1 ? "s" : ""}: {leadingLabels}
                  </span>
                </span>
              </p>
            )}
            {leadingOpts.length > 0 && status === "paused" && (
              <p className="poll-highlight-line mt-5 mb-8 font-semibold leading-snug">
                <span className="inline">
                  <span className="text-base" aria-hidden>
                    ⏸{" "}
                  </span>
                  <span className="poll-paused-gradient font-bold">
                    Leading (paused): {leadingLabels}
                  </span>
                </span>
              </p>
            )}
            <div className="space-y-2">
              {(() => {
                const optCounts = (poll.options || []).map((o) => o.votes?.length || 0);
                const optPcts = largestRemainderPct(optCounts, totalVotes);
                return (poll.options || []).map((o, i) => {
                const count = optCounts[i];
                const isLeading = count === maxVotes && totalVotes > 0;
                const barPct = optPcts[i];
                const barColor =
                  isLeading && status === "completed"
                    ? "bg-amber-500"
                    : isLeading
                      ? "bg-emerald-500"
                      : "bg-slate-600";

                return (
                  <div
                    key={i}
                    className={`rounded-xl overflow-hidden ${pollOptionGlowClass(i)}`}
                    style={{
                      animation: `pollOptSlideIn 0.35s ease both ${i * 50}ms`,
                    }}
                  >
                    <div className="px-3 py-3" style={pollOptionHeaderStyle(i)}>
                      <div className="flex items-center gap-2.5 mb-2">
                        {/* Colored number circle */}
                        <span
                          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-slate-900"
                          style={{
                            background: `linear-gradient(135deg, ${OPT_COLORS[i % 8]}, ${OPT_COLORS[i % 8]}88)`,
                            boxShadow: `0 0 8px ${OPT_COLORS[i % 8]}50`,
                            animation: `pollNumPop 0.4s ease both ${i * 50 + 100}ms`,
                          }}
                        >
                          {i + 1}
                        </span>
                        {/* Gradient label */}
                        <span className="text-sm font-bold leading-snug min-w-0 break-words flex-1 tracking-wide">
                          {isLeading && status === "completed" ? (
                            <>
                              <span>🏆 </span>
                              <span className="poll-winner-gradient">
                                {o.label}
                              </span>
                            </>
                          ) : isLeading ? (
                            <>
                              <span>⚡ </span>
                              <span className="poll-leading-gradient">
                                {o.label}
                              </span>
                            </>
                          ) : (
                            <span style={pollOptionLabelStyle(i)}>
                              {o.label}
                            </span>
                          )}
                        </span>
                        <span
                          className={`shrink-0 text-xs whitespace-nowrap tabular-nums font-semibold sm:text-right ${
                            isLeading && status === "completed"
                              ? "text-amber-300"
                              : isLeading
                                ? "text-emerald-400"
                                : "text-slate-400"
                          }`}
                        >
                          {count} vote{count !== 1 ? "s" : ""} · {barPct}%
                        </span>
                      </div>
                      <div className="ml-8 h-2 bg-black/30 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                          style={{
                            width: `${barPct}%`,
                            minWidth: barPct > 0 ? "0.25rem" : 0,
                            boxShadow:
                              isLeading && status === "completed"
                                ? "0 0 8px rgba(245,158,11,0.5)"
                                : isLeading
                                  ? "0 0 8px rgba(16,185,129,0.5)"
                                  : "none",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              });
              })()}
            </div>
          </div>

          {eligible <= 0 && totalVotes > 0 && (
            <p className="text-xs text-slate-500 mt-2">
              {totalVotes} total vote{totalVotes !== 1 ? "s" : ""} recorded
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 shrink-0 sm:pl-4 sm:border-l sm:border-slate-700/50 sm:justify-start w-full sm:w-auto sm:items-end sm:ml-auto">
          {isAdminUser && (
            <button
              type="button"
              onClick={() => onView(poll)}
              className={pollActionBtn(
                "bg-slate-700 hover:bg-slate-600 text-slate-200",
              )}
            >
              <IconEye /> View
            </button>
          )}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => onEdit(poll)}
              className={pollActionBtn(
                "bg-slate-700 hover:bg-slate-600 text-slate-200",
              )}
            >
              <IconEdit /> Edit
            </button>
          )}
          {isAdminUser && (
            <button
              type="button"
              onClick={() => onAnalytics(poll._id)}
              className={pollActionBtn(
                "bg-slate-700 hover:bg-slate-600 text-slate-300",
              )}
            >
              <IconChart /> Analytics
            </button>
          )}
          {isAdminUser && (
            <PollStatusSelect
              status={status}
              pollId={poll._id}
              onStatusChange={onStatusChange}
            />
          )}
          {isAdminUser && (
            <button
              type="button"
              onClick={() => onDelete(poll._id)}
              className={pollActionBtn(
                "bg-red-900/40 hover:bg-red-900/60 text-red-400",
              )}
            >
              <IconTrash /> Delete
            </button>
          )}
        </div>
      </div>
    </MasterListItem>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminPolls() {
  const { userInfo } = useAppSelector((s) => s.user);
  const { trips } = useTrip();
  const role = userInfo?.user?.role;
  const isSuperAdmin = role === ROLES.SUPER_ADMIN;
  const isAdminUser = role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;

  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [analyticsId, setAnalyticsId] = useState(null);
  const [viewPoll, setViewPoll] = useState(null);
  const [editPoll, setEditPoll] = useState(null);
  const { confirmDelete, deleteModal } = useDeleteConfirm();
  const { popup, showSuccess, showError } = useActionPopup("polls");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter !== "all") params.type = typeFilter;
      const res = await getPolls(params);
      if (res !== null) setPolls(res?.data || []);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    load();
  }, [load]);
  useOnlineReload(load);

  const handleStatusChange = async (pollId, newStatus) => {
    try {
      await updatePoll(pollId, { pollStatus: newStatus });
      load();
      showSuccess("Poll status updated successfully.");
    } catch (err) {
      showError(err.message || "Failed to update status");
    }
  };

  const handleDelete = (id) => {
    const poll = polls.find((p) => p._id === id);
    confirmDelete({
      recordLabel: poll?.title || poll?.question,
      onConfirm: async () => {
        try {
          if (poll?._pending && poll._queueId) {
            await deletePendingItem(poll);
            load();
            return;
          }
          await deletePoll(id);
          load();
        } catch (err) {
          alert(err.message || "Failed to delete poll");
          throw err;
        }
      },
    });
  };

  return (
    <MasterPageShell
      title="Polls"
      description="Manage group voting polls"
      action={
        isSuperAdmin ? (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-medium transition-colors"
          >
            <IconPlus /> New Poll
          </button>
        ) : null
      }
    >
      <PollAnimStyles />
      {popup}
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 w-full">
        {[
          { value: "all", label: "All Polls" },
          { value: "general", label: "General" },
          { value: "trip", label: "Trip-based" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === f.value ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
          >
            {f.label}
          </button>
        ))}
        <span className="text-xs text-slate-500 w-full sm:w-auto sm:ml-auto pt-1 sm:pt-0">
          {polls.length} poll{polls.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <SyncetraLoader className="py-16" />
      ) : polls.length === 0 ? (
        <MasterListEmpty
          icon="🗳️"
          message={
            isSuperAdmin
              ? "No polls yet. Click New Poll to create one."
              : "No polls found."
          }
        />
      ) : (
        <MasterList>
          {polls.map((p) => (
            <PollCard
              key={p._id}
              poll={p}
              isAdminUser={isAdminUser}
              isSuperAdmin={isSuperAdmin}
              trips={trips}
              onView={setViewPoll}
              onEdit={setEditPoll}
              onAnalytics={setAnalyticsId}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </MasterList>
      )}

      {!isSuperAdmin && isAdminUser && (
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <IconLock /> Super Admins can create and edit poll content. You can
          view polls, delete polls, open analytics, and change poll status.
        </p>
      )}

      {showCreate && (
        <CreatePollModal
          trips={trips}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
            showSuccess("Poll created successfully.");
          }}
        />
      )}

      {analyticsId && (
        <AnalyticsModal
          pollId={analyticsId}
          onClose={() => setAnalyticsId(null)}
        />
      )}

      {viewPoll && (
        <ViewPollModal
          poll={viewPoll}
          trips={trips}
          onClose={() => setViewPoll(null)}
        />
      )}

      {editPoll && (
        <EditPollModal
          poll={editPoll}
          trips={trips}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setEditPoll(null)}
          onSaved={(isOffline) => {
            setEditPoll(null);
            load();
            showSuccess(
              isOffline
                ? "Saved offline — will sync when reconnected."
                : "Poll updated successfully.",
            );
          }}
        />
      )}
      {deleteModal}
    </MasterPageShell>
  );
}
