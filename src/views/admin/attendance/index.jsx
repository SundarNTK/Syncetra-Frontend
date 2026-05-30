import { useCallback, useEffect, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import SyncetraLoader from "../../../components/ui/SyncetraLoader";
import {
  getAttendance,
  getAttendanceCheckpoints,
  getTripMembers,
  upsertAttendance,
} from "../../../services/trips";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};
const fmtFull = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};
const fmtTime = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const STATUS_OPTS = [
  { value: "present", label: "P", full: "Present", dot: "bg-emerald-500", cls: "bg-emerald-600/20 text-emerald-400 border-emerald-600/40" },
  { value: "absent",  label: "A", full: "Absent",  dot: "bg-red-500",     cls: "bg-red-600/20 text-red-400 border-red-600/40" },
  { value: "late",    label: "L", full: "Late",    dot: "bg-amber-500",    cls: "bg-amber-600/20 text-amber-400 border-amber-600/40" },
];
const getStatusOpt = (s) => STATUS_OPTS.find((o) => o.value === s) || STATUS_OPTS[0];

/* ─── StatusToggle ────────────────────────────────────────────────────────── */
function StatusToggle({ value, onChange }) {
  return (
    <div className="flex gap-1 shrink-0">
      {STATUS_OPTS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          title={opt.full}
          className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${
            value === opt.value
              ? `${opt.cls} shadow-sm`
              : "bg-slate-800/60 border-slate-700/40 text-slate-500 hover:text-slate-300 hover:border-slate-600"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Checkpoint stat box ─────────────────────────────────────────────────── */
function CpStatBox({ value, variant, label }) {
  const glowCls = {
    members: "animate-cp-glow-sky",
    present: "animate-cp-glow-emerald",
    absent:  "animate-cp-glow-red",
    late:    "animate-cp-glow-amber",
  }[variant];

  return (
    <div className="cp-stat-col">
      <span className="cp-stat-label">{label}</span>
      <div
        className={`cp-stat-box cp-stat-box--${variant} ${glowCls}`}
        aria-label={`${label}: ${value}`}
      >
        {value}
      </div>
    </div>
  );
}

/* ─── CheckpointCard ──────────────────────────────────────────────────────── */
function CheckpointCard({ cp, memberCount, onClick }) {
  const totalMembers = cp.total || memberCount || 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex flex-wrap sm:flex-nowrap items-center gap-3 px-4 py-3.5 bg-slate-900/80 border border-slate-700/60 rounded-xl hover:border-emerald-700/50 hover:bg-slate-900 transition-all text-left group"
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        </svg>
      </div>

      {/* Name + time */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{cp.checkpoint}</p>
        {cp.markedAt && (
          <p className="text-[10px] text-slate-500 mt-0.5">
            {fmt(cp.markedAt)} · {fmtTime(cp.markedAt)}
          </p>
        )}
      </div>

      {/* Per-checkpoint totals */}
      <div className="flex items-end gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto justify-end sm:justify-start order-last sm:order-none">
        <CpStatBox value={totalMembers} variant="members" label="Members" />
        <CpStatBox value={cp.present || 0} variant="present" label="Present" />
        <CpStatBox value={cp.absent || 0} variant="absent" label="Absent" />
        <CpStatBox value={cp.late || 0} variant="late" label="Late" />
      </div>

      {/* Arrow */}
      <svg className="w-4 h-4 text-slate-600 group-hover:text-emerald-500 shrink-0 transition-colors self-center" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

/* ─── AdminAttendance ─────────────────────────────────────────────────────── */
export default function AdminAttendance() {
  const { selectedTrip, selectedTripId } = useTrip();

  /* ── data ── */
  const [members,    setMembers]    = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [cpRecords,  setCpRecords]  = useState([]);

  /* ── view state ── */
  const [view,       setView]       = useState("list");   // "list" | "checkpoint"
  const [selectedCp, setSelectedCp] = useState(null);     // checkpoint name
  const [isNew,      setIsNew]      = useState(false);
  const [newCpName,  setNewCpName]  = useState("");
  const [draft,      setDraft]      = useState({});

  /* ── ui state ── */
  const [loading,   setLoading]   = useState(false);
  const [cpLoading, setCpLoading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);
  const [cpError,   setCpError]   = useState("");

  /* ── toast ── */
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── load members + checkpoints ── */
  const loadBase = useCallback(async () => {
    if (!selectedTripId) return;
    setLoading(true);
    try {
      const [memRes, cpRes] = await Promise.all([
        getTripMembers(selectedTripId),
        getAttendanceCheckpoints(selectedTripId),
      ]);
      setMembers(memRes?.data || []);
      setCheckpoints(cpRes?.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [selectedTripId]);

  useEffect(() => {
    setView("list");
    setSelectedCp(null);
    setIsNew(false);
    loadBase();
  }, [loadBase]);

  /* ── build default draft (all present) ── */
  const defaultDraft = useCallback((memberList) => {
    const d = {};
    memberList.forEach((m) => { d[String(m._id || m.id)] = "present"; });
    return d;
  }, []);

  /* ── load checkpoint records ── */
  const loadCpRecords = useCallback(async (cpName, memberList) => {
    if (!selectedTripId || !cpName) return;
    setCpLoading(true);
    try {
      const res = await getAttendance(selectedTripId, { checkpoint: cpName });
      const records = res?.data || [];
      setCpRecords(records);

      const d = defaultDraft(memberList);
      records.forEach((r) => {
        const uid = typeof r.userId === "object"
          ? String(r.userId?._id || r.userId?.id || "")
          : String(r.userId || "");
        if (uid && d[uid] !== undefined) d[uid] = r.status || "present";
      });
      setDraft(d);
    } catch { /* ignore */ }
    finally { setCpLoading(false); }
  }, [selectedTripId, defaultDraft]);

  /* ── open existing checkpoint ── */
  const openCheckpoint = (cpName) => {
    setSelectedCp(cpName);
    setIsNew(false);
    setCpError("");
    setView("checkpoint");
    loadCpRecords(cpName, members);
  };

  /* ── open new checkpoint form ── */
  const openNew = () => {
    setIsNew(true);
    setSelectedCp(null);
    setNewCpName("");
    setCpError("");
    setCpRecords([]);
    setDraft(defaultDraft(members));
    setView("checkpoint");
  };

  /* ── go back to list ── */
  const goBack = () => {
    setView("list");
    setSelectedCp(null);
    setIsNew(false);
    setCpError("");
  };

  /* ── mark all ── */
  const markAll = (status) => {
    const d = {};
    members.forEach((m) => { d[String(m._id || m.id)] = status; });
    setDraft(d);
  };

  /* ── save attendance ── */
  const handleSave = async () => {
    const cpName = isNew ? newCpName.trim() : selectedCp;
    if (!cpName) { setCpError("Checkpoint name is required."); return; }

    const nameExists = checkpoints.some(
      (c) => c.checkpoint.toLowerCase() === cpName.toLowerCase()
    );
    if (isNew && nameExists) {
      setCpError(`Checkpoint "${cpName}" already exists. Select it from the list to edit.`);
      return;
    }

    setSaving(true);
    setCpError("");
    try {
      await Promise.all(
        members.map((m) => {
          const id = String(m._id || m.id);
          return upsertAttendance(
            selectedTripId,
            { userId: id, status: draft[id] || "present", checkpoint: cpName, markedAt: new Date() },
            true
          );
        })
      );
      showToast(`Attendance saved for "${cpName}"`);
      await loadBase();
      goBack();
    } catch (err) {
      showToast(err.message || "Failed to save attendance.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── summary stats ── */
  const cpHeading = isNew ? "New Checkpoint" : (selectedCp || "");

  /* ══════════════════════ RENDER ══════════════════════ */
  return (
    <TripModuleShell title="Attendance" description="Checkpoint-wise member attendance" loading={loading && !!selectedTripId && view === "list"}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium ${
          toast.type === "error"
            ? "bg-red-950 border-red-700 text-red-300"
            : "bg-emerald-950 border-emerald-700 text-emerald-300"
        }`}>
          <span>{toast.type === "error" ? "✕" : "✓"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {selectedTripId ? (
        <div className="space-y-4">

          {/* ══ TRIP SUMMARY CARD ══ */}
          <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-4 space-y-3">
            {selectedTrip && (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-white font-bold">{selectedTrip.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {fmtFull(selectedTrip.startDate)} — {fmtFull(selectedTrip.endDate)}
                    {selectedTrip.destination && ` · ${selectedTrip.destination}`}
                  </p>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold uppercase shrink-0">
                  {selectedTrip.status || "planned"}
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Members",     value: members.length,     cls: "text-slate-200" },
                { label: "Checkpoints", value: checkpoints.length, cls: "text-blue-300" },
              ].map((s) => (
                <div key={s.label} className="bg-slate-800/60 rounded-xl p-2.5 text-center">
                  <p className={`text-lg font-bold ${s.cls}`}>{s.value}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wide leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ══ LIST VIEW ══ */}
          {view === "list" && (
            <div className="space-y-3">
              {/* Header row */}
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Checkpoints ({checkpoints.length})
                </p>
                <button
                  type="button"
                  onClick={openNew}
                  disabled={loading || members.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/20 border border-emerald-700/40 text-emerald-400 hover:bg-emerald-700/30 disabled:opacity-40 text-xs font-semibold transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  New Checkpoint
                </button>
              </div>

              {checkpoints.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center">
                    <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-slate-300 font-medium text-sm">No checkpoints yet</p>
                    <p className="text-slate-500 text-xs mt-1">
                      {members.length === 0
                        ? "No members found for this trip."
                        : "Create a checkpoint to start marking attendance."}
                    </p>
                  </div>
                  {members.length > 0 && (
                    <button
                      type="button"
                      onClick={openNew}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Create First Checkpoint
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {checkpoints.map((cp) => (
                    <CheckpointCard
                      key={cp.checkpoint}
                      cp={cp}
                      memberCount={members.length}
                      onClick={() => openCheckpoint(cp.checkpoint)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ CHECKPOINT DETAIL / NEW VIEW ══ */}
          {view === "checkpoint" && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <p className="text-base font-bold text-white truncate flex-1">
                  {isNew ? "New Checkpoint" : selectedCp}
                </p>
              </div>

              {/* Checkpoint name input (new only) */}
              {isNew && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Checkpoint Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCpName}
                    onChange={(e) => { setNewCpName(e.target.value); setCpError(""); }}
                    placeholder="e.g. Trip Start · Hotel Check-in · Return Journey"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-emerald-600/60 focus:outline-none transition-colors"
                    autoFocus
                  />
                  {cpError && <p className="text-red-400 text-xs mt-1.5">{cpError}</p>}
                </div>
              )}

              {/* Error for existing checkpoint */}
              {!isNew && cpError && (
                <p className="text-red-400 text-xs">{cpError}</p>
              )}

              {cpLoading ? (
                <SyncetraLoader className="py-10" />
              ) : members.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <p className="text-2xl mb-2">👥</p>
                  <p className="text-sm">No members found for this trip.</p>
                </div>
              ) : (
                <>
                  {/* Bulk actions row */}
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">{members.length} member{members.length !== 1 ? "s" : ""}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => markAll("present")}
                        className="text-[11px] px-3 py-1.5 rounded-lg bg-emerald-700/20 border border-emerald-700/40 text-emerald-400 hover:bg-emerald-700/40 transition-colors font-semibold"
                      >
                        ✓ All Present
                      </button>
                      <button
                        type="button"
                        onClick={() => markAll("absent")}
                        className="text-[11px] px-3 py-1.5 rounded-lg bg-red-700/20 border border-red-700/40 text-red-400 hover:bg-red-700/40 transition-colors font-semibold"
                      >
                        ✗ All Absent
                      </button>
                    </div>
                  </div>

                  {/* Member list */}
                  <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl overflow-hidden">
                    {/* Column headings */}
                    <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/80">
                      <div className="flex items-center">
                        <span className="flex-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Member</span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">P · A · L</span>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-800/60">
                      {members.map((m) => {
                        const id     = String(m._id || m.id);
                        const status = draft[id] || "present";
                        const sOpt   = getStatusOpt(status);

                        return (
                          <div key={id} className="px-4 py-3 flex items-center gap-3">
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border ${sOpt.cls}`}>
                              {(m.name || "?").charAt(0).toUpperCase()}
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-200 font-medium truncate">{m.name || "Unknown"}</p>
                              {m.email && <p className="text-[11px] text-slate-500 truncate">{m.email}</p>}
                            </div>
                            {/* Status badge + toggle */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full border font-semibold ${sOpt.cls}`}>
                                {sOpt.full}
                              </span>
                              <StatusToggle
                                value={status}
                                onChange={(s) => setDraft((p) => ({ ...p, [id]: s }))}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Save button */}
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || (isNew && !newCpName.trim())}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Saving…
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {isNew
                          ? `Create Checkpoint${newCpName.trim() ? ` "${newCpName.trim()}"` : ""}`
                          : `Save Attendance — ${selectedCp}`}
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-10 text-slate-500">
          <p className="text-sm">Select a trip to manage attendance.</p>
        </div>
      )}
    </TripModuleShell>
  );
}
