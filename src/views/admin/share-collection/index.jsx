import { useCallback, useEffect, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import {
  getShareCollections,
  addShareCollection,
  updateShareCollection,
  deleteSharePayment,
  addSharePayment,
  getTripMembers,
} from "../../../services/trips";
import { useActionPopup } from "../../../hooks/useActionPopup";
import { useDeleteConfirm } from "../../../hooks/useDeleteConfirm";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const STATUS_STYLE = {
  pending: "text-amber-400 bg-amber-900/20 border-amber-700/40",
  partial: "text-blue-400  bg-blue-900/20  border-blue-700/40",
  paid:    "text-emerald-400 bg-emerald-900/20 border-emerald-700/40",
  unset:   "text-slate-400 bg-slate-800/60 border-slate-700/50",
};
const STATUS_LABEL = { pending: "Pending", partial: "Partial", paid: "Paid", unset: "Not Set" };

const inputCls =
  "w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-emerald-600/60 focus:outline-none transition-colors";

/* ─── MemberCard ───────────────────────────────────────────────────────────── */
function MemberCard({ member, record, tripId, onRefresh, onSuccess, onError, ask }) {
  const memberId    = String(member._id || member.id);
  const displayName = member.name || member.email || "Unknown";
  const initial     = displayName.charAt(0).toUpperCase();

  const status = record
    ? (record.paymentStatus || "pending")
    : "unset";

  const maxPayable = record
    ? Math.max(0, (record.totalShareAmount || 0) - (record.paidAmount || 0))
    : 0;

  const pct = record?.totalShareAmount > 0
    ? Math.min(100, Math.round(((record.paidAmount || 0) / record.totalShareAmount) * 100))
    : 0;

  /* local state */
  const [expanded,    setExpanded]    = useState(false);
  const [payAmt,      setPayAmt]      = useState("");
  const [payMode,     setPayMode]     = useState("offline");
  const [shareAmt,    setShareAmt]    = useState(String(record?.totalShareAmount || ""));
  const [editShare,   setEditShare]   = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saving,      setSaving]      = useState(false);

  /* ── set / update share amount ── */
  const handleSetShare = async () => {
    const amt = Number(shareAmt);
    if (!amt || amt < 0) { onError("Enter a valid amount."); return; }
    setSaving(true);
    try {
      if (record) {
        await updateShareCollection(tripId, record._id, { totalShareAmount: amt });
        onSuccess("Share amount updated.");
        setEditShare(false);
      } else {
        await addShareCollection(tripId, { userId: memberId, totalShareAmount: amt });
        onSuccess("Share amount set.");
      }
      onRefresh();
    } catch (err) { onError(err.message || "Failed."); }
    finally { setSaving(false); }
  };

  /* ── record payment ── */
  const handleAddPayment = async () => {
    const amt = Number(payAmt);
    if (!amt || amt <= 0) { onError("Enter a valid amount."); return; }
    if (amt > maxPayable)  { onError(`Max payable: ${fmt(maxPayable)}`); return; }
    setSaving(true);
    try {
      await addSharePayment(tripId, record._id, {
        paymentAmount: amt,
        paymentMode:   payMode,
        paymentDate:   new Date().toISOString().slice(0, 10),
      });
      onSuccess("Payment recorded.");
      setPayAmt("");
      onRefresh();
    } catch (err) { onError(err.message || "Payment failed."); }
    finally { setSaving(false); }
  };

  /* ── delete payment ── */
  const handleDeletePayment = async (txId) => {
    const ok = await ask("Delete this payment entry?");
    if (!ok) return;
    try {
      await deleteSharePayment(tripId, record._id, txId);
      onSuccess("Payment deleted.");
      onRefresh();
    } catch (err) { onError(err.message || "Failed."); }
  };

  /* ── mode toggle ── */
  const ModeBtn = ({ mode, icon, label }) => (
    <button
      type="button"
      onClick={() => setPayMode(mode)}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
        payMode === mode
          ? mode === "offline"
            ? "bg-slate-700 text-white border-slate-500"
            : "bg-blue-900/40 text-blue-300 border-blue-700/40"
          : "text-slate-500 border-slate-700 hover:border-slate-600 hover:text-slate-300"
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className={`rounded-xl overflow-hidden border transition-all duration-200 ${
      expanded ? "border-slate-600/70 bg-slate-900" : "border-slate-800 bg-slate-900/80 hover:border-slate-700/80"
    }`}>
      {/* ── Header row ── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border-2 ${
          status === "paid"
            ? "bg-emerald-900/30 border-emerald-600/40 text-emerald-300"
            : status === "partial"
            ? "bg-blue-900/30 border-blue-600/40 text-blue-300"
            : status === "pending"
            ? "bg-amber-900/30 border-amber-600/40 text-amber-300"
            : "bg-slate-800 border-slate-700 text-slate-400"
        }`}>
          {initial}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{displayName}</p>
          {record
            ? (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-emerald-400">{fmt(record.paidAmount)}</span>
                <span className="text-[11px] text-slate-600">/</span>
                <span className="text-[11px] text-slate-400">{fmt(record.totalShareAmount)}</span>
                {maxPayable > 0 && (
                  <span className="text-[11px] text-amber-400">· {fmt(maxPayable)} due</span>
                )}
              </div>
            )
            : <p className="text-[11px] text-slate-500 mt-0.5">Share not set yet</p>
          }
        </div>

        {/* Status badge + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wide ${STATUS_STYLE[status]}`}>
            {STATUS_LABEL[status]}
          </span>
          <svg
            className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* ── Progress bar (always visible once record exists) ── */}
      {record && (
        <div className="px-4 pb-2">
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
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
          <p className="text-right text-[10px] text-slate-500 mt-0.5">{pct}%</p>
        </div>
      )}

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="border-t border-slate-800">

          {/* ─ No record OR editShare: set share amount ─ */}
          {(!record || editShare) && (
            <div className="px-4 py-3 space-y-2 bg-slate-950/40">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {record ? "Edit Share Amount" : "Set Share Amount"}
              </p>
              <div className="flex gap-2">
                <input
                  type="number" min="0"
                  placeholder="₹ 0"
                  value={shareAmt}
                  onChange={(e) => setShareAmt(e.target.value)}
                  className={inputCls}
                  onKeyDown={(e) => e.key === "Enter" && handleSetShare()}
                />
                <button
                  type="button"
                  onClick={handleSetShare}
                  disabled={saving || !shareAmt}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-colors shrink-0"
                >
                  {saving ? "…" : record ? "Update" : "Set"}
                </button>
                {editShare && (
                  <button
                    type="button"
                    onClick={() => { setEditShare(false); setShareAmt(String(record.totalShareAmount || "")); }}
                    className="px-3 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-medium transition-colors shrink-0"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ─ Has record and not editing share: amount summary + payment form ─ */}
          {record && !editShare && (
            <>
              {/* Amount summary */}
              <div className="grid grid-cols-3 px-4 py-3 gap-2 bg-slate-950/30">
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-200">{fmt(record.totalShareAmount)}</p>
                  <p className="text-[10px] text-slate-500 uppercase mt-0.5">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-emerald-400">{fmt(record.paidAmount)}</p>
                  <p className="text-[10px] text-slate-500 uppercase mt-0.5">Paid</p>
                </div>
                <div className="text-center">
                  <p className={`text-sm font-bold ${maxPayable > 0 ? "text-amber-400" : "text-slate-400"}`}>
                    {fmt(record.pendingAmount)}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase mt-0.5">Pending</p>
                </div>
              </div>

              {/* Inline payment entry */}
              {maxPayable > 0 ? (
                <div className="px-4 py-3 border-t border-slate-800/60 bg-slate-950/40 space-y-2">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Record Payment · Balance {fmt(maxPayable)}
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <input
                      type="number" min="1" max={maxPayable}
                      placeholder={`Amount (max ${fmt(maxPayable)})`}
                      value={payAmt}
                      onChange={(e) => setPayAmt(e.target.value)}
                      className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-emerald-600/60 focus:outline-none"
                      onKeyDown={(e) => e.key === "Enter" && handleAddPayment()}
                    />
                    <div className="flex gap-1 shrink-0">
                      <ModeBtn mode="offline" icon="💵" label="Cash" />
                      <ModeBtn mode="online"  icon="💳" label="Online" />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPayment}
                      disabled={saving || !payAmt}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-colors shrink-0"
                    >
                      {saving ? "…" : "Add"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-2 border-t border-slate-800/60 bg-emerald-950/20">
                  <p className="text-xs text-emerald-400 font-medium text-center">✓ Fully paid</p>
                </div>
              )}

              {/* Edit share amount link */}
              <div className="px-4 py-1.5 border-t border-slate-800/40 flex justify-end">
                <button
                  type="button"
                  onClick={() => { setEditShare(true); setShareAmt(String(record.totalShareAmount || "")); }}
                  className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Edit share amount
                </button>
              </div>

              {/* Payment history */}
              {record.transactions?.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setHistoryOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-2 border-t border-slate-800 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <span>Payment History ({record.transactions.length})</span>
                    <span>{historyOpen ? "▲" : "▼"}</span>
                  </button>

                  {historyOpen && (
                    <ul className="border-t border-slate-800 divide-y divide-slate-800/60">
                      {record.transactions.map((tx) => (
                        <li key={tx._id} className="flex items-center gap-3 px-4 py-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                            tx.paymentMode === "online"
                              ? "bg-blue-900/30 text-blue-400"
                              : "bg-slate-800 text-slate-400"
                          }`}>
                            {tx.paymentMode === "online" ? "💳" : "💵"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-emerald-400">{fmt(tx.paymentAmount)}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                tx.paymentMode === "online"
                                  ? "text-blue-400 border-blue-700/40 bg-blue-900/20"
                                  : "text-slate-400 border-slate-700 bg-slate-800/40"
                              }`}>
                                {tx.paymentMode === "online" ? "Online" : "Cash"}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              {tx.paymentDate && (
                                <span className="text-[11px] text-slate-500">
                                  {new Date(tx.paymentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </span>
                              )}
                              {tx.transactionRef && (
                                <span className="text-[11px] text-slate-500 font-mono">#{tx.transactionRef}</span>
                              )}
                            </div>
                            {tx.remarks && <p className="text-[11px] text-slate-400 mt-0.5 italic">{tx.remarks}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeletePayment(tx._id)}
                            className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 text-slate-500 hover:text-red-400 flex items-center justify-center text-xs transition-colors shrink-0"
                            title="Delete payment"
                          >×</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── AdminShareCollection ─────────────────────────────────────────────────── */
export default function AdminShareCollection() {
  const { selectedTripId }                 = useTrip();
  const { popup, showSuccess, showError } = useActionPopup("share");
  const { confirmModal, ask }              = useDeleteConfirm();

  const [members, setMembers] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ── load members + records ── */
  const load = useCallback(async () => {
    if (!selectedTripId) return;
    setLoading(true);
    try {
      const [memRes, recRes] = await Promise.all([
        getTripMembers(selectedTripId),
        getShareCollections(selectedTripId),
      ]);
      setMembers(memRes?.data || []);
      setRecords(recRes?.data || []);
    } catch { setMembers([]); setRecords([]); }
    finally  { setLoading(false); }
  }, [selectedTripId]);

  useEffect(() => {
    if (!selectedTripId) { setMembers([]); setRecords([]); return; }
    load();
  }, [selectedTripId, load]);

  /* ── build record lookup ── */
  const recordByUserId = Object.fromEntries(
    records.map((r) => [String(r.userId?._id || r.userId), r])
  );

  /* ── summary stats ── */
  const totalCollected  = records.reduce((s, r) => s + (r.paidAmount       || 0), 0);
  const totalPending    = records.reduce((s, r) => s + (r.pendingAmount     || 0), 0);
  const totalShareSum   = records.reduce((s, r) => s + (r.totalShareAmount  || 0), 0);
  const paidCount       = records.filter((r) => r.paymentStatus === "paid").length;
  const unsetCount      = members.filter((m) => !recordByUserId[String(m._id || m.id)]).length;

  return (
    <TripModuleShell
      title="Share Collection"
      description="Per-member payment tracking"
      loading={loading && !!selectedTripId}
    >
      {popup}
      {confirmModal}

      {selectedTripId && members.length === 0 && !loading && (
        <div className="text-center py-14 text-slate-500">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-sm">No members found for this trip.</p>
        </div>
      )}

      {selectedTripId && members.length > 0 && (
        <div className="space-y-4">
          {/* ── Summary bar ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Members",   val: members.length,          sub: `${paidCount} fully paid`,      cls: "text-slate-200" },
              { label: "Total",     val: fmt(totalShareSum),       sub: `${unsetCount} not set`,         cls: "text-slate-200" },
              { label: "Collected", val: fmt(totalCollected),      sub: null,                            cls: "text-emerald-400" },
              { label: "Pending",   val: fmt(totalPending),        sub: null,                            cls: totalPending > 0 ? "text-amber-400" : "text-emerald-400" },
            ].map(({ label, val, sub, cls }) => (
              <div key={label} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
                <p className={`text-base font-bold ${cls}`}>{val}</p>
                {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
              </div>
            ))}
          </div>

          {/* ── Member list ── */}
          <div className="space-y-2">
            {members.map((member) => {
              const mId   = String(member._id || member.id);
              const rec   = recordByUserId[mId] || null;
              return (
                <MemberCard
                  key={mId}
                  member={member}
                  record={rec}
                  tripId={selectedTripId}
                  onRefresh={load}
                  onSuccess={showSuccess}
                  onError={showError}
                  ask={ask}
                />
              );
            })}
          </div>
        </div>
      )}
    </TripModuleShell>
  );
}
