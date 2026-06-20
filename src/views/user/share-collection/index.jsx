import { useCallback, useEffect, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getMyShareCollection } from "../../../services/trips";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const STATUS_STYLE = {
  pending: "text-amber-400 bg-amber-900/20 border-amber-700/40",
  partial: "text-blue-400 bg-blue-900/20 border-blue-700/40",
  paid:    "text-emerald-400 bg-emerald-900/20 border-emerald-700/40",
};

const STATUS_LABEL  = { pending: "Pending",  partial: "Partially Paid", paid: "Fully Paid" };
const STATUS_ICON   = { pending: "⏳",        partial: "🔄",             paid: "✅" };

/* ─── UserShareCollection ──────────────────────────────────────────────────── */
export default function UserShareCollection() {
  const { selectedTripId } = useTrip();
  const [record,  setRecord]  = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!selectedTripId) return;
    setLoading(true);
    try {
      const r = await getMyShareCollection(selectedTripId);
      setRecord(r?.data || null);
    } catch { setRecord(null); }
    finally { setLoading(false); }
  }, [selectedTripId]);

  useEffect(() => {
    if (!selectedTripId) { setRecord(null); return; }
    load();
  }, [selectedTripId, load]);

  const pct = record?.totalShareAmount > 0
    ? Math.min(100, Math.round((record.paidAmount / record.totalShareAmount) * 100))
    : 0;

  return (
    <TripModuleShell title="My Share" description="Your trip payment details" loading={loading && !!selectedTripId}>
      {selectedTripId && (
        record === null && !loading ? (
          <div className="text-center py-14 text-slate-500">
            <p className="text-4xl mb-3">💳</p>
            <p className="text-sm">No share amount has been assigned to you for this trip yet.</p>
          </div>
        ) : record && (
          <div className="space-y-4">
            {/* Status banner */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${STATUS_STYLE[record.paymentStatus] || STATUS_STYLE.pending}`}>
              <span className="text-2xl">{STATUS_ICON[record.paymentStatus] || "⏳"}</span>
              <div>
                <p className="font-semibold text-white">{STATUS_LABEL[record.paymentStatus] || record.paymentStatus}</p>
                <p className="text-xs text-slate-400 mt-0.5">Your payment status for this trip</p>
              </div>
            </div>

            {/* Amount breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Payment Summary</p>

              <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 100
                      ? "linear-gradient(90deg,#10b981,#059669)"
                      : pct >= 50
                      ? "linear-gradient(90deg,#3b82f6,#2563eb)"
                      : "linear-gradient(90deg,#f59e0b,#d97706)",
                  }}
                />
              </div>
              <p className="text-right text-xs text-slate-400">{pct}% paid</p>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-800/60 rounded-xl p-3">
                  <p className="text-base font-bold text-slate-200">{fmt(record.totalShareAmount)}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Total Share</p>
                </div>
                <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-3">
                  <p className="text-base font-bold text-emerald-400">{fmt(record.paidAmount)}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Paid</p>
                </div>
                <div className={`rounded-xl p-3 ${record.pendingAmount > 0 ? "bg-amber-900/20 border border-amber-700/30" : "bg-slate-800/60"}`}>
                  <p className={`text-base font-bold ${record.pendingAmount > 0 ? "text-amber-400" : "text-slate-400"}`}>{fmt(record.pendingAmount)}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Pending</p>
                </div>
              </div>
            </div>

            {/* Payment history */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Payment History</p>
              </div>
              {(!record.transactions || record.transactions.length === 0) ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-slate-500">No payments recorded yet.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-800">
                  {record.transactions.map((tx, idx) => (
                    <li key={tx._id || idx} className="flex items-center gap-3 px-4 py-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${tx.paymentMode === "online" ? "bg-blue-900/30 text-blue-400" : "bg-slate-800 text-slate-400"}`}>
                        {tx.paymentMode === "online" ? "💳" : "💵"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-emerald-400">{fmt(tx.paymentAmount)}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${tx.paymentMode === "online" ? "text-blue-400 border-blue-700/40 bg-blue-900/20" : "text-slate-400 border-slate-700 bg-slate-800/40"}`}>
                            {tx.paymentMode === "online" ? "Online" : "Cash"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {tx.paymentDate && (
                            <span className="text-[11px] text-slate-500">
                              {new Date(tx.paymentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          )}
                          {tx.transactionRef && <span className="text-[11px] text-slate-500 font-mono">#{tx.transactionRef}</span>}
                          {tx.collectedBy?.name && <span className="text-[11px] text-slate-500">Collected by {tx.collectedBy.name}</span>}
                        </div>
                        {tx.remarks && <p className="text-[11px] text-slate-400 mt-0.5 italic">{tx.remarks}</p>}
                      </div>
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
