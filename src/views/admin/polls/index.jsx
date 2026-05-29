import { useEffect, useState, useCallback, useRef } from "react";
import { useAppSelector } from "../../../hooks";
import { useDeleteConfirm } from "../../../hooks/useDeleteConfirm";
import { useTrip } from "../../../context/TripContext";
import {
  getPolls, createPoll, updatePoll, deletePoll, getPollAnalytics,
} from "../../../services/polls";
import { ROLES } from "../../../constants/enum";
import MasterPageShell, { MasterList, MasterListItem, MasterListEmpty } from "../../../components/layout/MasterPageShell";

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconPlus  = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>;
const IconEye   = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>;
const IconEdit  = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>;
const IconTrash = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>;
const IconChart = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>;
const IconX     = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;
const IconLock  = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>;
const IconChevronDown = () => (
  <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

// ─── Status + type meta ───────────────────────────────────────────────────────
const STATUS_META = {
  open:      { label: "Live",      icon: "📡", cls: "bg-red-700/20 text-red-300 border-red-700/40" },
  paused:    { label: "Paused",    icon: "⏸", cls: "bg-yellow-600/20 text-yellow-300 border-yellow-700/40" },
  closed:    { label: "Closed",    icon: "🔒", cls: "bg-slate-600/40 text-slate-400 border-slate-600/40" },
  completed: { label: "Completed", icon: "🏆", cls: "bg-amber-950/40 text-amber-200 border-amber-500/50" },
};

function StatusBadge({ status, className = "" }) {
  const meta = STATUS_META[status] || STATUS_META.open;
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${meta.cls} ${className}`}>
      {status === "open" ? <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> : <span>{meta.icon}</span>}
      <span>{meta.label}</span>
    </span>
  );
}

const TYPE_BADGE = {
  general: "bg-blue-600/20 text-blue-300 border border-blue-700/40",
  trip:    "bg-amber-600/20 text-amber-300 border border-amber-700/40",
};

/** View modal: distinct border per option index */
const OPTION_VIEW_BORDERS = [
  "border-2 border-cyan-500/55 ring-1 ring-cyan-500/20",
  "border-2 border-fuchsia-500/55 ring-1 ring-fuchsia-500/20",
  "border-2 border-amber-500/55 ring-1 ring-amber-500/20",
  "border-2 border-emerald-500/55 ring-1 ring-emerald-500/20",
  "border-2 border-rose-500/55 ring-1 ring-rose-500/20",
  "border-2 border-indigo-500/55 ring-1 ring-indigo-500/20",
  "border-2 border-orange-500/55 ring-1 ring-orange-500/20",
  "border-2 border-sky-500/55 ring-1 ring-sky-500/20",
];

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
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" aria-hidden />
      ) : (
        <span className="shrink-0 text-[12px] leading-none w-4 text-center" aria-hidden>
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
      <label htmlFor={triggerId} className="text-[9px] text-slate-500 uppercase tracking-wide text-center mb-1 block">
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
        <span className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
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
                  s === status ? "bg-slate-800 text-white" : "text-slate-200 hover:bg-slate-800/80"
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
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isCompleted = data?.poll?.pollStatus === "completed";
  const leadingLabels = data?.analytics?.filter((opt) => opt.isLeading).map((opt) => opt.label) || [];
  const leadersText = leadingLabels.join(", ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-8" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-semibold text-emerald-400">Poll Analytics</h3>
            {data?.poll && (
              <StatusBadge status={data.poll.pollStatus} className="mt-1" />
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400"><IconX /></button>
        </div>

        {loading ? (
          <p className="text-slate-400 p-6 text-center">Loading analytics…</p>
        ) : !data ? (
          <p className="text-red-400 p-6 text-center">Failed to load analytics</p>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <p className="text-xs text-slate-400">{data.poll.question}</p>
              <p className="text-lg font-bold mt-0.5">{data.poll.title}</p>
              <div className="text-xs text-slate-500 mt-2 space-y-1">
                {data.eligibleMemberCount > 0 && (
                  <p>
                    Responded:{" "}
                    <strong className="text-white">{data.uniqueVoterCount}</strong>
                    {" / "}
                    {data.eligibleMemberCount} eligible members
                  </p>
                )}
                <p>
                  Total votes: <strong className="text-white">{data.totalVotes}</strong>
                  {data.eligibleMemberCount > 0 && (
                    <span className="text-slate-600 ml-2">(percentages below are share of eligible members)</span>
                  )}
                </p>
                {leadersText && !isCompleted && (
                  <p className="text-emerald-400">
                    ⚡ Leading: <strong>{leadersText}</strong>
                  </p>
                )}
                {leadersText && isCompleted && (
                  <p className="inline-flex items-center gap-1 text-xs">
                    <span className="text-amber-400/90">🏆 Winner{leadingLabels.length > 1 ? "s" : ""}:</span>
                    <span className="poll-winner-gradient text-sm font-bold">{leadersText}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {data.analytics.map((opt) => (
                <div
                  key={opt.index}
                  className={`rounded-xl p-3 border ${opt.isLeading && data.totalVotes > 0 ? (isCompleted ? "border-amber-500/50 bg-amber-950/15 ring-1 ring-amber-500/20" : "border-emerald-600/50 bg-emerald-950/20") : "border-slate-800 bg-slate-800/40"}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium flex items-center gap-2">
                      {opt.isLeading && data.totalVotes > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${isCompleted ? "bg-amber-600/25 text-amber-300" : "bg-emerald-600/30 text-emerald-400"}`}>
                          {isCompleted ? "Winner" : "Leading"}
                        </span>
                      )}
                      {opt.label}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {opt.voteCount}{" "}
                      <span className="text-slate-400 font-normal">
                        ({opt.percentage}% of members
                        {data.totalVotes > 0 ? (
                          <span className="text-slate-500"> · {opt.voteSharePercent}% of votes</span>
                        ) : null}
                        )
                      </span>
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${opt.isLeading && data.totalVotes > 0 ? (isCompleted ? "bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-500" : "bg-emerald-500") : "bg-slate-500"}`}
                      style={{ width: `${opt.percentage}%` }}
                    />
                  </div>
                  {opt.voters.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {opt.voters.map((v, vi) => (
                        <span key={vi} className="flex items-center gap-1 text-[10px] bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-full">
                          <span className="w-4 h-4 rounded-full bg-slate-600 flex items-center justify-center text-[9px] font-bold shrink-0">
                            {(v.name || "?")[0].toUpperCase()}
                          </span>
                          {v.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ViewPollModal (read-only) ────────────────────────────────────────────────
function ViewPollModal({ poll, trips, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const status     = poll.pollStatus || "open";
  const statusMeta = STATUS_META[status] || STATUS_META.open;
  const trip       = poll.tripId && trips.find((t) => String(t._id) === String(poll.tripId));
  const eligible   = poll.eligibleMemberCount ?? 0;
  const uniqueResponded = poll.uniqueVoterCount ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-8 overflow-y-auto" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
          <div className="min-w-0 pr-2">
            <h3 className="font-semibold text-emerald-400 truncate">{poll.title}</h3>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE[poll.pollType]}`}>
                {poll.pollType === "trip" ? "Trip Poll" : "General"}
              </span>
              <StatusBadge status={status} />
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 shrink-0"><IconX /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Question</p>
            <p className="text-sm text-slate-200 whitespace-pre-wrap">{poll.question}</p>
          </div>
          {poll.pollType === "trip" && (
            <p className="text-xs text-slate-400">
              Trip: <span className="text-slate-200">{trip?.tripName || "—"}</span>
            </p>
          )}
          {eligible > 0 && (
            <p className="text-xs text-slate-400">
              <span className="text-slate-200 font-medium">{uniqueResponded}</span> of {eligible} eligible members have responded.
            </p>
          )}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">Options</p>
            <ul className="space-y-3">
              {(poll.options || []).map((o, i) => {
                const c = o.votes?.length || 0;
                const pct = pctOfEligible(c, eligible);
                return (
                <li
                  key={i}
                  className={`bg-slate-800/60 rounded-xl p-3 ${OPTION_VIEW_BORDERS[i % OPTION_VIEW_BORDERS.length]}`}
                >
                  <p className="text-sm font-medium text-white mb-1">
                    {i + 1}. {o.label}
                    <span className="text-xs font-normal text-slate-500 ml-2">
                      ({c} vote{c !== 1 ? "s" : ""}
                      {pct != null ? ` · ${pct}% of members` : ""})
                    </span>
                  </p>
                  {o.description ? (
                    <div className="poll-option-desc text-sm" dangerouslySetInnerHTML={{ __html: o.description }} />
                  ) : (
                    <p className="text-xs text-slate-500 italic">No description</p>
                  )}
                </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="px-5 pb-5">
          <button type="button" onClick={onClose} className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── EditPollModal ────────────────────────────────────────────────────────────
function EditPollModal({ poll, trips, onClose, onSaved }) {
  const totalVotes = (poll.options || []).reduce((s, o) => s + (o.votes?.length || 0), 0);
  const canEditOptions = totalVotes === 0;

  const [form, setForm] = useState({
    title: poll.title || "",
    question: poll.question || "",
  });
  const [options, setOptions] = useState(
    () => (poll.options || []).map((o) => ({ label: o.label || "", description: o.description || "" }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [RteComponent, setRteComponent] = useState(null);
  const [rteStatus, setRteStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    import("../../../components/ui/RichTextEditor")
      .then((m) => { if (!cancelled) { setRteComponent(() => m.default); setRteStatus("ready"); } })
      .catch(() => { if (!cancelled) setRteStatus("error"); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const setOpt = (i, field, val) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, [field]: val } : o)));

  const addOption    = () => setOptions((p) => [...p, { label: "", description: "" }]);
  const removeOption = (i) => setOptions((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const filled = options.filter((o) => o.label.trim());
    if (filled.length < 2) { setError("Add at least 2 options"); return; }
    setSaving(true);
    try {
      const payload = { title: form.title, question: form.question };
      if (canEditOptions) payload.options = filled;
      await updatePoll(poll._id, payload);
      onSaved();
    } catch (err) {
      setError(err.message || "Failed to update poll");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500";
  const trip       = poll.tripId && trips.find((t) => String(t._id) === String(poll.tripId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-8 overflow-y-auto" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
          <h3 className="font-semibold text-emerald-400">Edit Poll</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400"><IconX /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input placeholder="Poll title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} required />
          <textarea placeholder="Question *" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className={`${inputCls} resize-none`} rows={2} required />

          <div className="rounded-lg bg-slate-800/40 border border-slate-700/60 px-3 py-2 text-xs text-slate-400">
            <span className="text-slate-300">Type:</span>{" "}
            {poll.pollType === "trip" ? `Trip poll${trip ? ` · ${trip.tripName}` : ""}` : "General (all members)"}
            {!canEditOptions && (
              <span className="block mt-1 text-amber-400/90">Options are locked because votes have been recorded. You can still edit the title and question.</span>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-400 uppercase tracking-wide">Options</label>
              {canEditOptions && (
                <button type="button" onClick={addOption} className="text-xs text-emerald-400 hover:text-emerald-300">+ Add option</button>
              )}
            </div>
            <div className="space-y-3">
              {options.map((opt, i) => (
                <div key={i} className="bg-slate-800/60 rounded-xl p-3 space-y-2">
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-slate-500 w-5 shrink-0">{i + 1}.</span>
                    <input
                      placeholder="Option label *"
                      value={opt.label}
                      onChange={(e) => setOpt(i, "label", e.target.value)}
                      disabled={!canEditOptions}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm disabled:opacity-50"
                    />
                    {canEditOptions && options.length > 2 && (
                      <button type="button" onClick={() => removeOption(i)} className="text-red-400 hover:text-red-300 p-1"><IconTrash /></button>
                    )}
                  </div>
                  {canEditOptions && (
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 block">Description (optional)</label>
                      {rteStatus === "loading" && (
                        <div className="min-h-[120px] rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xs text-slate-500">Loading editor…</div>
                      )}
                      {rteStatus === "ready" && RteComponent && (
                        <RteComponent value={opt.description} onChange={(html) => setOpt(i, "description", html)} placeholder="Option details…" minHeight={120} />
                      )}
                      {rteStatus === "error" && (
                        <textarea placeholder="Description" value={opt.description} onChange={(e) => setOpt(i, "description", e.target.value)} className="w-full min-h-[120px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300" />
                      )}
                    </div>
                  )}
                  {!canEditOptions && opt.description && (
                    <div className="poll-option-desc text-xs border border-slate-700/50 rounded-lg p-2 bg-slate-950/50" dangerouslySetInnerHTML={{ __html: opt.description }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg font-medium text-sm">
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm text-slate-300">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── CreatePollModal ──────────────────────────────────────────────────────────
function CreatePollModal({ onClose, onCreated, trips }) {
  const [form, setForm] = useState({ title: "", question: "", pollType: "general", tripId: "" });
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
      .then((m) => { if (!cancelled) { setRteComponent(() => m.default); setRteStatus("ready"); } })
      .catch(() => { if (!cancelled) setRteStatus("error"); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const setOpt = (i, field, val) =>
    setOptions((prev) => prev.map((o, idx) => idx === i ? { ...o, [field]: val } : o));

  const addOption    = () => setOptions((p) => [...p, { label: "", description: "" }]);
  const removeOption = (i) => setOptions((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const filled = options.filter((o) => o.label.trim());
    if (filled.length < 2) { setError("Add at least 2 options"); return; }
    setSaving(true);
    try {
      await createPoll({ ...form, tripId: form.pollType === "trip" ? form.tripId : null, options: filled });
      onCreated();
    } catch (err) {
      setError(err.message || "Failed to create poll");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-8 overflow-y-auto" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
          <h3 className="font-semibold text-emerald-400">New Poll</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400"><IconX /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input placeholder="Poll title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} required />
          <textarea placeholder="Question *" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className={`${inputCls} resize-none`} rows={2} required />

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-400 block mb-1">Poll Type</label>
              <select value={form.pollType} onChange={(e) => setForm({ ...form, pollType: e.target.value })} className={inputCls}>
                <option value="general">General (all members)</option>
                <option value="trip">Trip-based</option>
              </select>
            </div>
            {form.pollType === "trip" && (
              <div className="flex-1">
                <label className="text-xs text-slate-400 block mb-1">Select Trip</label>
                <select value={form.tripId} onChange={(e) => setForm({ ...form, tripId: e.target.value })} className={inputCls} required>
                  <option value="">— Choose trip —</option>
                  {trips.map((t) => <option key={t._id} value={t._id}>{t.tripName}</option>)}
                </select>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-400 uppercase tracking-wide">Options</label>
              <button type="button" onClick={addOption} className="text-xs text-emerald-400 hover:text-emerald-300">+ Add option</button>
            </div>
            <div className="space-y-3">
              {options.map((opt, i) => (
                <div key={i} className="bg-slate-800/60 rounded-xl p-3 space-y-2">
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-slate-500 w-5 shrink-0">{i + 1}.</span>
                    <input placeholder="Option label *" value={opt.label} onChange={(e) => setOpt(i, "label", e.target.value)} className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
                    {options.length > 2 && (
                      <button type="button" onClick={() => removeOption(i)} className="text-red-400 hover:text-red-300 p-1"><IconTrash /></button>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 block">Description (optional)</label>
                    {rteStatus === "loading" && (
                      <div className="min-h-[120px] rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xs text-slate-500">Loading editor…</div>
                    )}
                    {rteStatus === "ready" && RteComponent && (
                      <RteComponent value={opt.description} onChange={(html) => setOpt(i, "description", html)} placeholder="Add details so members understand this option…" minHeight={120} />
                    )}
                    {rteStatus === "error" && (
                      <textarea placeholder="Description (plain text)" value={opt.description} onChange={(e) => setOpt(i, "description", e.target.value)} className="w-full min-h-[120px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg font-medium text-sm">
              {saving ? "Creating…" : "Create Poll"}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm text-slate-300">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── PollCard ─────────────────────────────────────────────────────────────────
function PollCard({ poll, isAdminUser, isSuperAdmin, trips, onView, onEdit, onAnalytics, onStatusChange, onDelete }) {
  const status     = poll.pollStatus || "open";
  const statusMeta = STATUS_META[status] || STATUS_META.open;
  const totalVotes = (poll.options || []).reduce((s, o) => s + (o.votes?.length || 0), 0);
  const maxVotes   = Math.max(...(poll.options || []).map((o) => o.votes?.length || 0), 0);
  const leadingOpts = totalVotes > 0 ? (poll.options || []).filter((o) => (o.votes?.length || 0) === maxVotes) : [];
  const leadingLabels = leadingOpts.map((o) => o.label).join(", ");
  const eligible       = poll.eligibleMemberCount ?? 0;
  const uniqueResponded = poll.uniqueVoterCount ?? 0;

  return (
    <MasterListItem className="w-full min-w-0 !overflow-visible">
      <div className="flex w-full min-w-0 flex-col sm:flex-row sm:items-stretch gap-4 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 className="font-semibold text-base sm:text-lg text-white truncate min-w-0">{poll.title}</h3>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 border ${TYPE_BADGE[poll.pollType]}`}>
              {poll.pollType === "trip" ? "Trip Poll" : "General"}
            </span>
            <StatusBadge status={status} className="shrink-0" />
          </div>

          <p className="text-sm text-slate-400 mb-2 whitespace-pre-wrap break-words">{poll.question}</p>

          {leadingOpts.length > 0 && status === "open" && (
            <p className="text-xs text-emerald-400 mb-2 flex items-center gap-1 flex-wrap">
              <span>⚡</span>
              <span>Leading: <strong className="text-emerald-300">{leadingLabels}</strong></span>
              <span className="text-slate-500">({maxVotes} vote{maxVotes !== 1 ? "s" : ""})</span>
            </p>
          )}
          {leadingOpts.length > 0 && status === "completed" && (
            <p className="text-xs text-amber-500/90 mb-2 flex items-center gap-1 flex-wrap">
              <span>🏆</span>
              <span>Winner{leadingOpts.length > 1 ? "s" : ""}: </span>
              <span className="poll-winner-gradient text-sm font-bold">{leadingLabels}</span>
            </p>
          )}
          {leadingOpts.length > 0 && status === "paused" && (
            <p className="text-xs text-yellow-400/80 mb-2 flex items-center gap-1">
              <span>⏸</span>
              <span>Leading (paused): <strong className="text-yellow-300">{leadingLabels}</strong></span>
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {(poll.options || []).slice(0, 6).map((o, i) => {
              const count     = o.votes?.length || 0;
              const isLeading = count === maxVotes && totalVotes > 0;
              const optPct    = pctOfEligible(count, eligible);
              return (
                <span
                  key={i}
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    isLeading && status === "open"
                      ? "bg-emerald-700/30 text-emerald-300 border-emerald-700/40"
                      : isLeading && status === "completed"
                      ? "bg-amber-900/35 text-amber-200 border-amber-500/45"
                      : "bg-slate-700/60 text-slate-300 border-transparent"
                  }`}
                >
                  {o.label}{" "}
                  <span className="opacity-60">
                    ({count}
                    {optPct != null ? ` · ${optPct}%` : ""})
                  </span>
                </span>
              );
            })}
            {poll.options?.length > 6 && (
              <span className="text-xs text-slate-500">+{poll.options.length - 6} more</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            {eligible > 0 ? (
              <>
                <span className="text-slate-400">{uniqueResponded}</span> / {eligible} members responded
                <span className="mx-1.5 text-slate-600">·</span>
                {totalVotes} vote{totalVotes !== 1 ? "s" : ""} recorded
              </>
            ) : (
              <>{totalVotes} total vote{totalVotes !== 1 ? "s" : ""}</>
            )}
          </p>
          {poll.pollType === "trip" && poll.tripId && (
            <p className="text-[10px] text-slate-500 mt-1">
              Trip: <span className="text-slate-400">{trips.find((t) => String(t._id) === String(poll.tripId))?.tripName || "—"}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 shrink-0 sm:pl-4 sm:border-l sm:border-slate-700/50 sm:justify-start w-full sm:w-auto sm:items-end sm:ml-auto">
          {isAdminUser && (
            <button type="button" onClick={() => onView(poll)} className={pollActionBtn("bg-slate-700 hover:bg-slate-600 text-slate-200")}>
              <IconEye /> View
            </button>
          )}
          {isSuperAdmin && (
            <button type="button" onClick={() => onEdit(poll)} className={pollActionBtn("bg-slate-700 hover:bg-slate-600 text-slate-200")}>
              <IconEdit /> Edit
            </button>
          )}
          {isAdminUser && (
            <button type="button" onClick={() => onAnalytics(poll._id)} className={pollActionBtn("bg-slate-700 hover:bg-slate-600 text-slate-300")}>
              <IconChart /> Analytics
            </button>
          )}
          {isAdminUser && (
            <PollStatusSelect status={status} pollId={poll._id} onStatusChange={onStatusChange} />
          )}
          {isSuperAdmin && (
            <button type="button" onClick={() => onDelete(poll._id)} className={pollActionBtn("bg-red-900/40 hover:bg-red-900/60 text-red-400")}>
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
  const { trips }    = useTrip();
  const role         = userInfo?.user?.role;
  const isSuperAdmin = role === ROLES.SUPER_ADMIN;
  const isAdminUser  = role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;

  const [polls, setPolls]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [analyticsId, setAnalyticsId] = useState(null);
  const [viewPoll, setViewPoll]       = useState(null);
  const [editPoll, setEditPoll]       = useState(null);
  const { confirmDelete, deleteModal } = useDeleteConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter !== "all") params.type = typeFilter;
      const res = await getPolls(params);
      setPolls(res?.data || []);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (pollId, newStatus) => {
    try {
      await updatePoll(pollId, { pollStatus: newStatus });
      load();
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  const handleDelete = (id) => {
    const poll = polls.find((p) => p._id === id);
    confirmDelete({
      recordLabel: poll?.title || poll?.question,
      onConfirm: async () => {
        try {
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
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-medium transition-colors">
            <IconPlus /> New Poll
          </button>
        ) : null
      }
    >
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { value: "all",     label: "All Polls" },
          { value: "general", label: "General" },
          { value: "trip",    label: "Trip-based" },
        ].map((f) => (
          <button key={f.value} onClick={() => setTypeFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === f.value ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
            {f.label}
          </button>
        ))}
        <span className="text-xs text-slate-500 ml-auto">{polls.length} poll{polls.length !== 1 ? "s" : ""}</span>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-slate-400 text-sm">Loading polls…</p>
      ) : polls.length === 0 ? (
        <MasterListEmpty
          icon="🗳️"
          message={isSuperAdmin ? "No polls yet. Click New Poll to create one." : "No polls found."}
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
          <IconLock /> Super Admins can create, delete, and edit poll content. You can view polls, open analytics, and change poll status.
        </p>
      )}

      {showCreate && (
        <CreatePollModal
          trips={trips}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}

      {analyticsId && (
        <AnalyticsModal pollId={analyticsId} onClose={() => setAnalyticsId(null)} />
      )}

      {viewPoll && (
        <ViewPollModal poll={viewPoll} trips={trips} onClose={() => setViewPoll(null)} />
      )}

      {editPoll && (
        <EditPollModal
          poll={editPoll}
          trips={trips}
          onClose={() => setEditPoll(null)}
          onSaved={() => { setEditPoll(null); load(); }}
        />
      )}
      {deleteModal}
    </MasterPageShell>
  );
}
