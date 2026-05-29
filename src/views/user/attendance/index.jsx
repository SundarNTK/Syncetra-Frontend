import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getUserAttendance, upsertAttendance } from "../../../services/trips";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const todayDate = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const toDateOnly = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d;
};

const fmt = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const fmtTime = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const STATUS_CLS = {
  present: "bg-emerald-600/20 text-emerald-400 border-emerald-600/40",
  absent:  "bg-red-600/20 text-red-400 border-red-600/40",
  late:    "bg-amber-600/20 text-amber-400 border-amber-600/40",
};
const STATUS_ICON = { present: "✓", absent: "✗", late: "~" };
const STATUS_LABEL = { present: "Present", absent: "Absent", late: "Late" };

/* ─── Confirmation Portal ─────────────────────────────────────────────────── */
function ConfirmModal({ onConfirm, onClose, loading }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-950 border border-emerald-800/50 flex items-center justify-center shrink-0 text-xl">
              ✅
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Mark Attendance</p>
              <p className="text-emerald-400 text-xs">Self check-in · Trip Start</p>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
            <p className="text-slate-200 text-sm leading-relaxed">
              Confirm to proceed with marking your attendance as{" "}
              <span className="text-emerald-400 font-semibold">Present</span> for the Trip Start checkpoint?
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition-colors disabled:opacity-50 shadow-lg shadow-emerald-900/40"
            >
              {loading ? "Marking…" : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── Trip Status Banner ──────────────────────────────────────────────────── */
function TripBanner({ trip }) {
  if (!trip) return null;

  const STATUS_COLORS = {
    active:    "bg-emerald-950/60 border-emerald-800/60 text-emerald-300",
    planned:   "bg-blue-950/60 border-blue-800/60 text-blue-300",
    completed: "bg-slate-800/60 border-slate-700/60 text-slate-300",
    cancelled: "bg-red-950/60 border-red-800/60 text-red-300",
  };

  return (
    <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-4 mb-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-base">{trip.name}</h2>
          {trip.destination && (
            <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {trip.destination}
            </p>
          )}
        </div>
        <span className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold uppercase tracking-wide ${STATUS_COLORS[trip.status] || STATUS_COLORS.planned}`}>
          {trip.status || "planned"}
        </span>
      </div>

      <div className="flex gap-4 text-xs text-slate-400">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">Start Date</p>
          <p className="text-slate-200 font-medium mt-0.5">{fmt(trip.startDate)}</p>
        </div>
        <div className="w-px bg-slate-700/60" />
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">End Date</p>
          <p className="text-slate-200 font-medium mt-0.5">{fmt(trip.endDate)}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── CheckpointGroup ─────────────────────────────────────────────────────── */
function CheckpointGroup({ checkpoint, entries }) {
  const latestRecord = [...entries].sort((a, b) => {
    const ta = new Date(a.markedAt || a.checkInAt || a.createdAt || 0).getTime();
    const tb = new Date(b.markedAt || b.checkInAt || b.createdAt || 0).getTime();
    return tb - ta;
  })[0];

  const status = latestRecord?.status || "present";
  const when   = latestRecord?.markedAt || latestRecord?.checkInAt || latestRecord?.createdAt;
  const sOpt   = STATUS_CLS[status] || STATUS_CLS.present;

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors ${
      status === "present"
        ? "bg-emerald-950/20 border-emerald-800/30"
        : status === "absent"
        ? "bg-red-950/20 border-red-800/30"
        : "bg-amber-950/20 border-amber-800/30"
    }`}>
      {/* Pin icon */}
      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${sOpt}`}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        </svg>
      </div>

      {/* Name + time */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{checkpoint}</p>
        {when && (
          <p className="text-[11px] text-slate-500 mt-0.5">
            {fmt(when)} · {fmtTime(when)}
          </p>
        )}
      </div>

      {/* Status badge */}
      <span className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold shrink-0 ${sOpt}`}>
        {STATUS_ICON[status]} {STATUS_LABEL[status] || status}
      </span>
    </div>
  );
}

/* ─── UserAttendance ──────────────────────────────────────────────────────── */
export default function UserAttendance() {
  const { selectedTrip, selectedTripId } = useTrip();

  const [records,     setRecords]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [toast,       setToast]       = useState(null);

  /* ── date logic ── */
  const today     = todayDate();
  const startDate = toDateOnly(selectedTrip?.startDate);
  const endDate   = toDateOnly(selectedTrip?.endDate);

  const tripNotStarted = startDate && today < startDate;
  const tripEnded      = endDate && today > endDate;
  const isStartDay     = startDate && today.getTime() === startDate.getTime();

  /* ── already self-checked-in for "Trip Start" today ── */
  const alreadyCheckedIn = records.some(
    (r) =>
      (r.checkpoint || "Trip Start") === "Trip Start" &&
      toDateOnly(r.checkInAt || r.createdAt)?.getTime() === today.getTime()
  );

  /* ── load ── */
  const load = useCallback(async () => {
    if (!selectedTripId) return;
    setLoading(true);
    try {
      const res = await getUserAttendance(selectedTripId);
      setRecords(res?.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [selectedTripId]);

  useEffect(() => { load(); }, [load]);

  /* ── toast helper ── */
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── confirm self check-in ── */
  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await upsertAttendance(
        selectedTripId,
        { status: "present", checkpoint: "Trip Start", checkInAt: new Date() },
        false
      );
      setShowConfirm(false);
      showToast("Attendance marked as Present!");
      load();
    } catch (err) {
      showToast(err.message || "Failed to mark attendance.", "error");
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── group records by checkpoint ── */
  const grouped = records.reduce((acc, r) => {
    const key = r.checkpoint || "Trip Start";
    (acc[key] = acc[key] || []).push(r);
    return acc;
  }, {});

  /* ── summary counts ── */
  const checkpointCount = Object.keys(grouped).length;
  const latestPerCp = Object.values(grouped).map((entries) =>
    [...entries].sort((a, b) =>
      new Date(b.markedAt || b.checkInAt || b.createdAt || 0) -
      new Date(a.markedAt || a.checkInAt || a.createdAt || 0)
    )[0]
  );
  const presentCount = latestPerCp.filter((r) => r.status === "present").length;
  const absentCount  = latestPerCp.filter((r) => r.status === "absent").length;

  /* ── self check-in section ── */
  const renderCheckInSection = () => {
    if (tripNotStarted) {
      return (
        <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-4 text-center">
          <p className="text-blue-300 text-sm font-medium">Trip hasn't started yet</p>
          <p className="text-slate-400 text-xs mt-1">Check-in opens on {fmt(selectedTrip?.startDate)}</p>
        </div>
      );
    }

    if (tripEnded) {
      return (
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 text-center">
          <p className="text-slate-400 text-sm">This trip has ended.</p>
        </div>
      );
    }

    if (!isStartDay) {
      return (
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 text-center">
          <p className="text-slate-400 text-sm">Self check-in was available on the trip start date.</p>
          <p className="text-slate-500 text-xs mt-1">Admin marks checkpoint-wise attendance during the trip.</p>
        </div>
      );
    }

    if (alreadyCheckedIn) {
      return (
        <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-600/40 flex items-center justify-center text-emerald-400 text-lg shrink-0">
            ✓
          </div>
          <div>
            <p className="text-emerald-300 font-semibold text-sm">Checked In</p>
            <p className="text-slate-400 text-xs mt-0.5">Your attendance is marked as Present for Trip Start.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-emerald-400 text-xs font-medium">Trip starts today — Self check-in available</p>
        </div>
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Check In — Mark Present
        </button>
      </div>
    );
  };

  return (
    <TripModuleShell title="Attendance" description="Your checkpoint-wise attendance history">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium transition-all duration-300 ${
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
          <TripBanner trip={selectedTrip} />

          {/* Summary pills */}
          {checkpointCount > 0 && (
            <div className="flex gap-2 flex-wrap">
              <span className="text-[11px] px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                {checkpointCount} checkpoint{checkpointCount !== 1 ? "s" : ""}
              </span>
              {presentCount > 0 && (
                <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-600/10 border border-emerald-600/30 text-emerald-400 font-medium">
                  ✓ {presentCount} present
                </span>
              )}
              {absentCount > 0 && (
                <span className="text-[11px] px-3 py-1 rounded-full bg-red-600/10 border border-red-600/30 text-red-400 font-medium">
                  ✗ {absentCount} absent
                </span>
              )}
            </div>
          )}

          {/* Self check-in section */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Self Check-In</h3>
            {loading ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-center">
                <p className="text-slate-500 text-sm animate-pulse">Loading…</p>
              </div>
            ) : renderCheckInSection()}
          </div>

          {/* Checkpoint-wise history */}
          {Object.keys(grouped).length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
                Attendance by Checkpoint
              </h3>
              <div className="space-y-3">
                {Object.entries(grouped).map(([checkpoint, entries]) => (
                  <CheckpointGroup
                    key={checkpoint}
                    checkpoint={checkpoint}
                    entries={entries}
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && records.length === 0 && (
            <div className="text-center py-10 text-slate-500">
              <p className="text-3xl mb-2">🗓️</p>
              <p className="text-sm">No attendance records yet.</p>
              <p className="text-xs mt-1 text-slate-600">Records appear after self check-in or admin marks attendance.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-10 text-slate-500">
          <p className="text-sm">Select a trip to view attendance.</p>
        </div>
      )}

      {showConfirm && (
        <ConfirmModal
          onConfirm={handleConfirm}
          onClose={() => setShowConfirm(false)}
          loading={submitting}
        />
      )}
    </TripModuleShell>
  );
}
