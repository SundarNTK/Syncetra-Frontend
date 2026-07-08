import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getMyShareCollection } from "../../../services/trips";
import { useOnlineReload } from "../../../hooks/useOnlineReload";
import ZoomableImage from "../../../components/ui/ZoomableImage";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDatePart = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
const fmtTimePart = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
};

const STATUS_STYLE = {
  pending: { text: "text-amber-400",   bg: "bg-amber-900/20",   border: "border-amber-700/30",   glow: "rgba(245,158,11,0.15)" },
  partial: { text: "text-blue-400",    bg: "bg-blue-900/20",    border: "border-blue-700/30",    glow: "rgba(59,130,246,0.15)" },
  paid:    { text: "text-emerald-400", bg: "bg-emerald-900/20", border: "border-emerald-700/30", glow: "rgba(16,185,129,0.15)" },
};

const STATUS_LABEL  = { pending: "Pending",  partial: "Partially Paid", paid: "Fully Paid" };
const STATUS_ICON   = { pending: "⏳",        partial: "🔄",             paid: "✅" };

/* ─── ImagePreviewModal ───────────────────────────────────────────────────── */
function ImagePreviewModal({ src, onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <ZoomableImage src={src} alt="Payment proof" className="w-full rounded-2xl shadow-2xl border border-slate-700" />
        <button type="button" onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600/80 transition-colors">
          ×
        </button>
      </div>
    </div>,
    document.body
  );
}

/* ─── UserShareCollection ──────────────────────────────────────────────────── */
export default function UserShareCollection() {
  const { selectedTripId } = useTrip();
  const [record,  setRecord]  = useState(null);
  const [previewImg, setPreviewImg] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!selectedTripId) return;
    setLoading(true);
    getMyShareCollection(selectedTripId)
      .then((r) => { if (r !== null) setRecord(r?.data || null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedTripId]);

  useEffect(() => {
    if (!selectedTripId) { setRecord(null); return; }
    load();
  }, [selectedTripId, load]);

  useOnlineReload(load);

  const pct = record?.totalShareAmount > 0
    ? Math.min(100, Math.round((record.paidAmount / record.totalShareAmount) * 100))
    : 0;
  const pendingAmount = record
    ? Math.max(0, (record.totalShareAmount || 0) - (record.paidAmount || 0))
    : 0;
  const status = STATUS_STYLE[record?.paymentStatus] || STATUS_STYLE.pending;

  return (
    <TripModuleShell title="My Share" description="Your trip payment details" loading={loading && !!selectedTripId}>
      {previewImg && <ImagePreviewModal src={previewImg} onClose={() => setPreviewImg(null)} />}
      {selectedTripId && (
        record === null && !loading ? (
          <div className="text-center py-14 text-slate-500">
            <p className="text-4xl mb-3">💳</p>
            <p className="text-sm">No share amount has been assigned to you for this trip yet.</p>
          </div>
        ) : record && (
          <div className="space-y-4">
            {/* Status banner */}
            <div className={`relative overflow-hidden flex items-center gap-3 px-4 py-3.5 rounded-2xl border ${status.bg} ${status.border}`}
              style={{ boxShadow: `0 0 24px ${status.glow}` }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 0% 0%, ${status.glow}, transparent 65%)` }} />
              <span className="text-3xl relative">{STATUS_ICON[record.paymentStatus] || "⏳"}</span>
              <div className="relative">
                <p className={`font-bold text-lg ${status.text}`}>{STATUS_LABEL[record.paymentStatus] || record.paymentStatus}</p>
                <p className="text-xs text-slate-400 mt-0.5">Your payment status for this trip</p>
              </div>
            </div>

            {/* Amount breakdown */}
            <div className="relative overflow-hidden bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">💰 Payment Summary</p>
                <span className="text-xs font-black text-slate-300">{pct}%</span>
              </div>

              <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 100
                      ? "linear-gradient(90deg,#10b981,#059669)"
                      : pct >= 50
                      ? "linear-gradient(90deg,#3b82f6,#2563eb)"
                      : "linear-gradient(90deg,#f59e0b,#d97706)",
                    boxShadow: pct > 0 ? "0 0 10px rgba(59,130,246,0.35)" : "none",
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                  <p className="text-lg font-black text-slate-100">{fmt(record.totalShareAmount)}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Total Share</p>
                </div>
                <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-3">
                  <p className="text-lg font-black text-emerald-400">{fmt(record.paidAmount)}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Paid</p>
                </div>
                <div className={`rounded-xl p-3 border ${pendingAmount > 0 ? "bg-amber-900/20 border-amber-700/30" : "bg-slate-800/60 border-slate-700/50"}`}>
                  <p className={`text-lg font-black ${pendingAmount > 0 ? "text-amber-400" : "text-slate-400"}`}>{fmt(pendingAmount)}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Pending</p>
                </div>
              </div>
            </div>

            {/* Payment history */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">🧾 Payment History</p>
                <span className="text-[10px] text-slate-500">{record.transactions?.length || 0} record{(record.transactions?.length || 0) !== 1 ? "s" : ""}</span>
              </div>
              {(!record.transactions || record.transactions.length === 0) ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-3xl mb-2">🧾</p>
                  <p className="text-sm text-slate-500">No payments recorded yet.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-800">
                  {record.transactions.map((tx, idx) => (
                    <li key={tx._id || idx} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0 border-2 ${
                            tx.paymentMode === "online"
                              ? "bg-blue-900/30 border-blue-700/40 text-blue-300"
                              : "bg-emerald-900/30 border-emerald-700/40 text-emerald-300"
                          }`}>
                            {tx.paymentMode === "online" ? "💳" : "💵"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-black text-emerald-400">{fmt(tx.paymentAmount)}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${tx.paymentMode === "online" ? "text-blue-300 border-blue-700/40 bg-blue-900/20" : "text-emerald-300 border-emerald-700/40 bg-emerald-900/20"}`}>
                                {tx.paymentMode === "online" ? "Online" : "Cash"}
                              </span>
                            </div>
                            {tx.transactionRef && (
                              <span className="text-[11px] text-slate-500 font-mono mt-1 block">#{tx.transactionRef}</span>
                            )}
                            {tx.collectedBy?.name && (
                              <p className="text-[11px] text-slate-500 mt-0.5">Collected by {tx.collectedBy.name}</p>
                            )}
                            {tx.remarks && <p className="text-[11px] text-slate-400 mt-1 italic">"{tx.remarks}"</p>}
                          </div>
                        </div>

                        {/* Date/time — glowing pill, right-aligned */}
                        {tx.paymentDate && (
                          <div className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-br from-cyan-950/50 to-slate-900/60 border border-cyan-700/30"
                            style={{ boxShadow: "0 0 16px rgba(34,211,238,0.14), inset 0 1px 0 rgba(255,255,255,0.03)" }}>
                            <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div className="flex flex-col items-end leading-tight">
                              <span className="text-[11px] font-bold text-cyan-300 whitespace-nowrap">{fmtDatePart(tx.paymentDate)}</span>
                              <span className="text-[10px] text-cyan-500/80 whitespace-nowrap">{fmtTimePart(tx.paymentDate)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {tx.imageUrl && (
                        <div className="mt-3 ml-[52px] flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                          <button
                            type="button"
                            onClick={() => setPreviewImg(tx.imageUrl)}
                            className="w-14 h-14 rounded-lg overflow-hidden border border-slate-700 hover:border-blue-500/60 transition-colors relative shrink-0 group"
                          >
                            <ZoomableImage src={tx.imageUrl} alt="Payment proof" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                              </svg>
                            </div>
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-300">Payment Proof</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Screenshot or receipt attached</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPreviewImg(tx.imageUrl)}
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/30 border border-blue-700/40 text-blue-300 hover:bg-blue-900/50 hover:text-blue-200 text-xs font-semibold transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                            View
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )
      )}
    </TripModuleShell>
  );
}
