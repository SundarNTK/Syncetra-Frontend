import { useCallback, useEffect, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getUserAttendance } from "../../../services/trips";
import { TripDateRangeBoxes } from "../../../components/trip/TripStatBox";
import { fmtTripDate, tripPhase, phaseBadge } from "../../../components/trip/tripUtils";

const fmt = fmtTripDate;

const fmtTime = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const STATUS_CLS = {
  present: "bg-emerald-600/20 text-emerald-400 border-emerald-600/40",
  absent:  "bg-red-600/20 text-red-400 border-red-600/40",
  late:    "bg-amber-600/20 text-amber-400 border-amber-600/40",
  checked_out: "bg-slate-600/20 text-slate-300 border-slate-600/40",
};
const STATUS_ICON = { present: "✓", absent: "✗", late: "~", checked_out: "↪" };
const STATUS_LABEL = { present: "Present", absent: "Absent", late: "Late", checked_out: "Checked out" };

const IconClose = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

function CheckpointInfoButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View checkpoint details for ${label}`}
      title="View checkpoint details"
      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-emerald-600/15 border border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.4)] hover:shadow-[0_0_16px_rgba(52,211,153,0.65)] hover:bg-emerald-600/25 hover:text-emerald-200 transition-all"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="bg-slate-800/60 rounded-xl p-3">
      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-200 break-words">{value}</p>
    </div>
  );
}

function CheckpointDetailModal({ checkpoint, entries, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sorted = [...entries].sort((a, b) => {
    const ta = new Date(a.markedAt || a.checkInAt || a.createdAt || 0).getTime();
    const tb = new Date(b.markedAt || b.checkInAt || b.createdAt || 0).getTime();
    return tb - ta;
  });
  const latest = sorted[0];
  const status = latest?.status || "present";
  const sOpt = STATUS_CLS[status] || STATUS_CLS.present;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-slate-700 shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-1">
              Checkpoint Details
            </p>
            <h3 className="text-base font-bold text-white leading-snug break-words">{checkpoint}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
            aria-label="Close"
          >
            <IconClose />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold ${sOpt}`}>
              {STATUS_ICON[status]} {STATUS_LABEL[status] || status}
            </span>
            <span className="text-[11px] text-slate-500">
              {sorted.length} record{sorted.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DetailRow
              label="Marked At"
              value={
                latest?.markedAt
                  ? `${fmt(latest.markedAt)} · ${fmtTime(latest.markedAt)}`
                  : null
              }
            />
            <DetailRow
              label="Check-in"
              value={
                latest?.checkInAt
                  ? `${fmt(latest.checkInAt)} · ${fmtTime(latest.checkInAt)}`
                  : null
              }
            />
            <DetailRow
              label="Check-out"
              value={
                latest?.checkOutAt
                  ? `${fmt(latest.checkOutAt)} · ${fmtTime(latest.checkOutAt)}`
                  : null
              }
            />
            <DetailRow label="Note" value={latest?.note?.trim() || null} />
          </div>

          {sorted.length > 1 && (
            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                History
              </h4>
              <ul className="space-y-2">
                {sorted.map((entry) => {
                  const entryStatus = entry.status || "present";
                  const entryCls = STATUS_CLS[entryStatus] || STATUS_CLS.present;
                  const when = entry.markedAt || entry.checkInAt || entry.createdAt;
                  return (
                    <li
                      key={entry._id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50"
                    >
                      <div className="min-w-0">
                        <p className="text-xs text-slate-300">
                          {when ? `${fmt(when)} · ${fmtTime(when)}` : "—"}
                        </p>
                        {entry.note?.trim() && (
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">{entry.note}</p>
                        )}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0 ${entryCls}`}>
                        {STATUS_LABEL[entryStatus] || entryStatus}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="px-4 pb-4 pt-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-slate-200 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function TripBanner({ trip }) {
  if (!trip) return null;

  const phase = tripPhase(trip);
  const status = trip.status || phase;

  return (
    <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-4 sm:p-5 mb-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-white font-bold text-base truncate">{trip.tripName || trip.name}</h2>
          {trip.location?.name && (
            <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1 truncate">
              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {trip.location.name.split(",")[0]}
            </p>
          )}
        </div>
        <span className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold uppercase tracking-wide shrink-0 ${phaseBadge(phase)}`}>
          {status}
        </span>
      </div>

      <TripDateRangeBoxes startDate={fmt(trip.startDate)} endDate={fmt(trip.endDate)} />
    </div>
  );
}

function CheckpointGroup({ checkpoint, entries }) {
  const [showDetail, setShowDetail] = useState(false);

  const latestRecord = [...entries].sort((a, b) => {
    const ta = new Date(a.markedAt || a.checkInAt || a.createdAt || 0).getTime();
    const tb = new Date(b.markedAt || b.checkInAt || b.createdAt || 0).getTime();
    return tb - ta;
  })[0];

  const status = latestRecord?.status || "present";
  const when   = latestRecord?.markedAt || latestRecord?.checkInAt || latestRecord?.createdAt;
  const sOpt   = STATUS_CLS[status] || STATUS_CLS.present;

  return (
    <>
      <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors ${
        status === "present"
          ? "bg-emerald-950/20 border-emerald-800/30"
          : status === "absent"
          ? "bg-red-950/20 border-red-800/30"
          : "bg-amber-950/20 border-amber-800/30"
      }`}>
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${sOpt}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-snug break-words">{checkpoint}</p>
          {when && (
            <p className="text-[11px] text-slate-500 mt-0.5">
              {fmt(when)} · {fmtTime(when)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 self-center">
          <CheckpointInfoButton onClick={() => setShowDetail(true)} label={checkpoint} />
          <span className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold whitespace-nowrap ${sOpt}`}>
            {STATUS_ICON[status]} {STATUS_LABEL[status] || status}
          </span>
        </div>
      </div>

      {showDetail && (
        <CheckpointDetailModal
          checkpoint={checkpoint}
          entries={entries}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
}

export default function UserAttendance() {
  const { selectedTrip, selectedTripId } = useTrip();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const grouped = records.reduce((acc, r) => {
    const key = r.checkpoint || "Trip Start";
    (acc[key] = acc[key] || []).push(r);
    return acc;
  }, {});

  const checkpointCount = Object.keys(grouped).length;
  const latestPerCp = Object.values(grouped).map((entries) =>
    [...entries].sort((a, b) =>
      new Date(b.markedAt || b.checkInAt || b.createdAt || 0) -
      new Date(a.markedAt || a.checkInAt || a.createdAt || 0)
    )[0]
  );
  const presentCount = latestPerCp.filter((r) => r.status === "present").length;
  const absentCount  = latestPerCp.filter((r) => r.status === "absent").length;

  return (
    <TripModuleShell title="Attendance" description="Your checkpoint-wise attendance history" loading={loading && !!selectedTripId}>
      {selectedTripId ? (
        <div className="space-y-4">
          <TripBanner trip={selectedTrip} />

          {!loading && (
            <>
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

              {Object.keys(grouped).length > 0 ? (
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
              ) : (
                <div className="text-center py-10 text-slate-500">
                  <p className="text-3xl mb-2">🗓️</p>
                  <p className="text-sm">No attendance records yet.</p>
                  <p className="text-xs mt-1 text-slate-600">Records appear when admin marks your attendance.</p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="text-center py-10 text-slate-500">
          <p className="text-sm">Select a trip to view attendance.</p>
        </div>
      )}
    </TripModuleShell>
  );
}
