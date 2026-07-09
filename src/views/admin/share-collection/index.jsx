import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import {
  getShareCollections,
  addShareCollection,
  updateShareCollection,
  deleteSharePayment,
  addSharePayment,
  updateSharePayment,
  getTripMembers,
  signMediaUpload,
} from "../../../services/trips";
import { validateFile, uploadToCloudinary } from "../../../utils/uploadToCloudinary";
import ZoomableImage from "../../../components/ui/ZoomableImage";
import DateTimePicker12h from "../../../components/ui/DateTimePicker12h";
import { useActionPopup } from "../../../hooks/useActionPopup";
import { useDeleteConfirm } from "../../../hooks/useDeleteConfirm";
import { useOnlineReload } from "../../../hooks/useOnlineReload";
import { updatePendingItem } from "../../../utils/offlinePendingOps";
import { useAppSelector } from "../../../hooks";
import { ROLES } from "../../../constants/enum";

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
  pending: "text-amber-400 bg-amber-900/20 border-amber-700/40",
  partial: "text-blue-400  bg-blue-900/20  border-blue-700/40",
  paid:    "text-emerald-400 bg-emerald-900/20 border-emerald-700/40",
  unset:   "text-slate-400 bg-slate-800/60 border-slate-700/50",
};
const STATUS_LABEL = { pending: "Pending", partial: "Partial", paid: "Paid", unset: "Not Set" };

const inputCls =
  "w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-emerald-600/60 focus:outline-none transition-colors";

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

/* ─── PaymentProofUploader — optional receipt/screenshot, profile-photo-style ── */
function PaymentProofUploader({ tripId, value, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      validateFile(file);
      const signRes = await signMediaUpload(tripId, true);
      const signData = signRes?.data;
      if (!signData?.signature) throw new Error("Could not get upload token");
      const result = await uploadToCloudinary(file, signData);
      onChange(result.url);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-1.5">
      {preview && <ImagePreviewModal src={preview} onClose={() => setPreview(null)} />}
      <div className="flex items-center gap-3">
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shrink-0 flex items-center justify-center">
          {value ? (
            <img src={value} alt="Payment proof" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          )}
        </div>

        {/* Label + actions */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <p className="text-[11px] text-slate-500">Payment Proof <span className="text-slate-600">(optional)</span></p>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-blue-500/50 transition-colors text-xs text-slate-200 font-medium">
              <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              {busy ? "Uploading…" : value ? "Change" : "Upload"}
              <input ref={inputRef} type="file" accept="image/*" className="sr-only" disabled={busy}
                onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
            {value && (
              <>
                <button type="button" onClick={() => setPreview(value)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-blue-300 hover:border-blue-700/50 text-xs font-medium transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  View
                </button>
                <button type="button" onClick={() => onChange("")}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/40 border border-red-800/50 text-red-400 hover:bg-red-900/60 hover:text-red-300 text-xs font-medium transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}

/* ─── MemberCard ───────────────────────────────────────────────────────────── */
function MemberCard({
  member, record, tripId, isSuperAdmin, onRefresh,
  onShareSuccess, onShareError, onPaymentSuccess, onPaymentError, confirmDelete,
}) {
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
  const [payImage,    setPayImage]    = useState("");
  const [payDateTime, setPayDateTime] = useState(() => new Date().toISOString());
  const [shareAmt,    setShareAmt]    = useState(String(record?.totalShareAmount || ""));
  const [editShare,   setEditShare]   = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [previewImg,  setPreviewImg]  = useState(null);

  const setMode = (mode) => {
    setPayMode(mode);
    if (mode !== "online") setPayImage("");
  };

  /* ── set / update share amount ── */
  const handleSetShare = async () => {
    const amt = Number(shareAmt);
    if (!amt || amt < 0) { onShareError("Enter a valid amount."); return; }
    setSaving(true);
    try {
      if (record?._pending && record._queueId) {
        await updatePendingItem(record, { totalShareAmount: amt });
        onShareSuccess("Share amount updated locally — will sync when reconnected.");
        setEditShare(false);
        onRefresh();
        return;
      }
      if (record) {
        await updateShareCollection(tripId, record._id, { totalShareAmount: amt });
        onShareSuccess("Share amount updated.");
        setEditShare(false);
      } else {
        await addShareCollection(tripId, { userId: memberId, totalShareAmount: amt });
        onShareSuccess("Share amount set.");
      }
      onRefresh();
    } catch (err) {
      if (err.queued) {
        onShareSuccess("Saved offline — will sync when reconnected.");
        setEditShare(false);
        onRefresh();
      } else {
        onShareError(err.message || "Failed.");
      }
    }
    finally { setSaving(false); }
  };

  /* ── record payment ── */
  const handleAddPayment = async () => {
    const amt = Number(payAmt);
    if (!amt || amt <= 0) { onPaymentError("Enter a valid amount."); return; }
    if (amt > maxPayable)  { onPaymentError(`Max payable: ${fmt(maxPayable)}`); return; }
    setSaving(true);
    try {
      await addSharePayment(tripId, record._id, {
        paymentAmount: amt,
        paymentMode:   payMode,
        paymentDate:   payDateTime || new Date().toISOString(),
        imageUrl:      payMode === "online" ? (payImage || undefined) : undefined,
      });
      onPaymentSuccess("Payment recorded.");
      setPayAmt("");
      setPayImage("");
      setPayDateTime(new Date().toISOString());
      onRefresh();
    } catch (err) {
      if (err.queued) {
        onPaymentSuccess("Payment saved offline — will sync when reconnected.");
        setPayAmt("");
        setPayImage("");
        setPayDateTime(new Date().toISOString());
        onRefresh();
      } else {
        onPaymentError(err.message || "Payment failed.");
      }
    }
    finally { setSaving(false); }
  };

  /* ── edit payment (super admin only) ── */
  const [editingTxId, setEditingTxId] = useState(null);
  const [editForm,    setEditForm]    = useState(null);

  const startEditPayment = (tx) => {
    setEditingTxId(tx._id);
    setEditForm({
      paymentAmount: String(tx.paymentAmount ?? ""),
      paymentMode:   tx.paymentMode || "offline",
      paymentDate:   tx.paymentDate || new Date().toISOString(),
      remarks:       tx.remarks || "",
      imageUrl:      tx.imageUrl || "",
    });
  };
  const cancelEditPayment = () => { setEditingTxId(null); setEditForm(null); };

  const handleUpdatePayment = async () => {
    const amt = Number(editForm.paymentAmount);
    if (!amt || amt <= 0) { onPaymentError("Enter a valid amount."); return; }
    setSaving(true);
    try {
      await updateSharePayment(tripId, record._id, editingTxId, {
        paymentAmount: amt,
        paymentMode:   editForm.paymentMode,
        paymentDate:   editForm.paymentDate,
        remarks:       editForm.remarks,
        imageUrl:      editForm.paymentMode === "online" ? (editForm.imageUrl || "") : "",
      });
      onPaymentSuccess("Payment updated.");
      cancelEditPayment();
      onRefresh();
    } catch (err) {
      if (err.queued) {
        onPaymentSuccess("Update queued offline — will sync when reconnected.");
        cancelEditPayment();
        onRefresh();
      } else {
        onPaymentError(err.message || "Update failed.");
      }
    }
    finally { setSaving(false); }
  };

  /* ── delete payment ── */
  const handleDeletePayment = (tx) => {
    confirmDelete({
      title: "Delete Payment",
      recordLabel: `${fmt(tx.paymentAmount)} · ${tx.paymentMode === "online" ? "Online" : "Cash"}`,
      onConfirm: async () => {
        try {
          await deleteSharePayment(tripId, record._id, tx._id);
          onPaymentSuccess("Payment deleted.");
          onRefresh();
        } catch (err) {
          if (err.queued) {
            onPaymentSuccess("Delete queued offline — will sync when reconnected.");
            onRefresh();
          } else {
            onPaymentError(err.message || "Failed.");
          }
        }
      },
    });
  };

  /* ── mode toggle ── */
  const ModeBtn = ({ mode, icon, label }) => (
    <button
      type="button"
      onClick={() => setMode(mode)}
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
      {previewImg && <ImagePreviewModal src={previewImg} onClose={() => setPreviewImg(null)} />}
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

        {/* Status badge + pending badge + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          {record?._pending && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/50 text-amber-300 text-[10px] font-semibold tracking-wide uppercase shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Not Synced
            </span>
          )}
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
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
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
          <p className="text-right text-[10px] text-slate-500 mt-0.5 font-semibold">{pct}%</p>
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
              <div className="grid grid-cols-3 gap-2 px-4 py-3 bg-slate-950/30">
                <div className="text-center bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5">
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-sm font-bold text-slate-200">{fmt(record.totalShareAmount)}</p>
                    <button
                      type="button"
                      onClick={() => { setEditShare(true); setShareAmt(String(record.totalShareAmount || "")); }}
                      title="Edit share amount"
                      className="w-5 h-5 rounded-md bg-slate-900 border border-slate-700 text-slate-500 hover:text-emerald-400 hover:border-emerald-600/50 flex items-center justify-center text-[10px] transition-colors shrink-0"
                    >✎</button>
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase mt-0.5">Total</p>
                </div>
                <div className="text-center bg-emerald-900/20 border border-emerald-700/30 rounded-xl py-2.5">
                  <p className="text-sm font-bold text-emerald-400">{fmt(record.paidAmount)}</p>
                  <p className="text-[10px] text-slate-500 uppercase mt-0.5">Paid</p>
                </div>
                <div className={`text-center rounded-xl py-2.5 border ${maxPayable > 0 ? "bg-amber-900/20 border-amber-700/30" : "bg-slate-800/50 border-slate-700/50"}`}>
                  <p className={`text-sm font-bold ${maxPayable > 0 ? "text-amber-400" : "text-slate-400"}`}>
                    {fmt(maxPayable)}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase mt-0.5">Pending</p>
                </div>
              </div>

              {/* Inline payment entry — disabled until share record syncs */}
              {record._pending ? (
                <div className="px-4 py-3 border-t border-slate-800/60 bg-amber-950/20">
                  <p className="text-xs text-amber-400 text-center">Payments available after sync</p>
                </div>
              ) : maxPayable > 0 ? (
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
                  <div>
                    <p className="text-[11px] text-slate-500 mb-1">Payment Date &amp; Time</p>
                    <DateTimePicker12h value={payDateTime} onChange={setPayDateTime} showHint={false} />
                  </div>
                  {payMode === "online" && (
                    <PaymentProofUploader tripId={tripId} value={payImage} onChange={setPayImage} />
                  )}
                </div>
              ) : (
                <div className="px-4 py-2 border-t border-slate-800/60 bg-emerald-950/20">
                  <p className="text-xs text-emerald-400 font-medium text-center">✓ Fully paid</p>
                </div>
              )}

              {/* Payment history */}
              {record.transactions?.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setHistoryOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-2.5 border-t border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                      🧾 Payment History
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-semibold">{record.transactions.length}</span>
                    </span>
                    <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${historyOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {historyOpen && (
                    <ul className="border-t border-slate-800 divide-y divide-slate-800/60">
                      {record.transactions.map((tx) => (
                        <li key={tx._id} className="px-4 py-2.5">
                          {editingTxId === tx._id ? (
                            <div className="space-y-2 bg-slate-950/60 rounded-lg p-2.5 -mx-1">
                              <div className="flex flex-wrap gap-2 items-center">
                                <input
                                  type="number" min="1"
                                  placeholder="Amount"
                                  value={editForm.paymentAmount}
                                  onChange={(e) => setEditForm((p) => ({ ...p, paymentAmount: e.target.value }))}
                                  className="flex-1 min-w-[100px] px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-emerald-600/60 focus:outline-none"
                                />
                                <div className="flex gap-1 shrink-0">
                                  <button type="button"
                                    onClick={() => setEditForm((p) => ({ ...p, paymentMode: "offline", imageUrl: "" }))}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                                      editForm.paymentMode === "offline"
                                        ? "bg-slate-700 text-white border-slate-500"
                                        : "text-slate-500 border-slate-700 hover:border-slate-600 hover:text-slate-300"
                                    }`}
                                  >💵 Cash</button>
                                  <button type="button"
                                    onClick={() => setEditForm((p) => ({ ...p, paymentMode: "online" }))}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                                      editForm.paymentMode === "online"
                                        ? "bg-blue-900/40 text-blue-300 border-blue-700/40"
                                        : "text-slate-500 border-slate-700 hover:border-slate-600 hover:text-slate-300"
                                    }`}
                                  >💳 Online</button>
                                </div>
                              </div>
                              <input
                                placeholder="Remarks (optional)"
                                value={editForm.remarks}
                                onChange={(e) => setEditForm((p) => ({ ...p, remarks: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-emerald-600/60 focus:outline-none"
                              />
                              <div>
                                <p className="text-[11px] text-slate-500 mb-1">Payment Date &amp; Time</p>
                                <DateTimePicker12h
                                  value={editForm.paymentDate}
                                  onChange={(v) => setEditForm((p) => ({ ...p, paymentDate: v }))}
                                  showHint={false}
                                />
                              </div>
                              {editForm.paymentMode === "online" && (
                                <PaymentProofUploader
                                  tripId={tripId}
                                  value={editForm.imageUrl}
                                  onChange={(url) => setEditForm((p) => ({ ...p, imageUrl: url }))}
                                />
                              )}
                              <div className="flex gap-2">
                                <button type="button" onClick={handleUpdatePayment} disabled={saving}
                                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-colors">
                                  {saving ? "…" : "Save"}
                                </button>
                                <button type="button" onClick={cancelEditPayment}
                                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-medium transition-colors">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {/* Row 1 — icon + amount + badge (left), date/time glow badge (right) */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 border-2 ${
                                    tx.paymentMode === "online"
                                      ? "bg-blue-900/30 border-blue-700/40 text-blue-300"
                                      : "bg-emerald-900/30 border-emerald-700/40 text-emerald-300"
                                  }`}>
                                    {tx.paymentMode === "online" ? "💳" : "💵"}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-bold text-emerald-400">{fmt(tx.paymentAmount)}</span>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${
                                        tx.paymentMode === "online"
                                          ? "text-blue-300 border-blue-700/40 bg-blue-900/20"
                                          : "text-emerald-300 border-emerald-700/40 bg-emerald-900/20"
                                      }`}>
                                        {tx.paymentMode === "online" ? "Online" : "Cash"}
                                      </span>
                                    </div>
                                    {tx.transactionRef && (
                                      <span className="text-[11px] text-slate-500 font-mono">#{tx.transactionRef}</span>
                                    )}
                                    {tx.remarks && <p className="text-[11px] text-slate-400 mt-0.5 italic">"{tx.remarks}"</p>}
                                  </div>
                                </div>

                                {tx.paymentDate && (
                                  <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-cyan-950/50 to-slate-900/60 border border-cyan-700/30"
                                    style={{ boxShadow: "0 0 12px rgba(34,211,238,0.12)" }}>
                                    <svg className="w-3 h-3 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <div className="flex flex-col items-end leading-tight">
                                      <span className="text-[10px] font-bold text-cyan-300 whitespace-nowrap">{fmtDatePart(tx.paymentDate)}</span>
                                      <span className="text-[9px] text-cyan-500/80 whitespace-nowrap">{fmtTimePart(tx.paymentDate)}</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Row 2 — proof thumbnail (left) + edit/delete actions (right) */}
                              <div className="flex items-center gap-2 pl-11">
                                {tx.imageUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewImg(tx.imageUrl)}
                                    title="View payment proof"
                                    className="w-9 h-9 rounded-lg overflow-hidden border border-slate-700 hover:border-blue-500/60 transition-colors relative group shrink-0"
                                  >
                                    <ZoomableImage src={tx.imageUrl} alt="Payment proof" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                      </svg>
                                    </div>
                                  </button>
                                )}
                                <div className="flex items-center gap-2 ml-auto">
                                  {isSuperAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => startEditPayment(tx)}
                                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-emerald-300 hover:border-emerald-700/50 text-xs font-medium transition-colors"
                                      title="Edit payment"
                                    >✎ Edit</button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePayment(tx)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/40 border border-red-800/50 text-red-400 hover:bg-red-900/60 hover:text-red-300 text-xs font-medium transition-colors"
                                    title="Delete payment"
                                  >× Delete</button>
                                </div>
                              </div>
                            </div>
                          )}
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
  const { selectedTripId } = useTrip();
  const { userInfo } = useAppSelector((s) => s.user);
  const isSuperAdmin = userInfo?.user?.role === ROLES.SUPER_ADMIN;

  // Single themed "share" popup for both flows — setting a share amount target uses the
  // "target" action override so it gets correct wording instead of the payment copy.
  const { popup, showSuccess, showError } = useActionPopup("share");
  const showShareSuccess   = (message) => showSuccess(message, { action: "target" });
  const showShareError     = showError;
  const showPaymentSuccess = showSuccess;
  const showPaymentError   = showError;
  const { confirmDelete, deleteModal } = useDeleteConfirm();

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
      if (memRes !== null) setMembers(memRes?.data || []);
      if (recRes !== null) setRecords(recRes?.data || []);
    } catch { /* ignore */ }
    finally  { setLoading(false); }
  }, [selectedTripId]);

  useEffect(() => {
    if (!selectedTripId) { setMembers([]); setRecords([]); return; }
    load();
  }, [selectedTripId, load]);

  useOnlineReload(load);

  /* ── build record lookup ── */
  const recordByUserId = Object.fromEntries(
    records.map((r) => [String(r.userId?._id || r.userId), r])
  );

  /* ── summary stats ── */
  const totalCollected  = records.reduce((s, r) => s + (r.paidAmount || 0), 0);
  const totalShareSum   = records.reduce((s, r) => s + (r.totalShareAmount || 0), 0);
  const totalPending    = records.reduce((s, r) => s + Math.max(0, (r.totalShareAmount || 0) - (r.paidAmount || 0)), 0);
  const paidCount       = records.filter((r) => r.paymentStatus === "paid").length;
  const unsetCount      = members.filter((m) => !recordByUserId[String(m._id || m.id)]).length;
  const pendingMembersCount = members.length - paidCount;

  return (
    <TripModuleShell
      title="Share Collection"
      description="Per-member payment tracking"
      loading={loading && !!selectedTripId}
    >
      {popup}
      {deleteModal}

      {selectedTripId && members.length === 0 && !loading && (
        <div className="text-center py-14 text-slate-500">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-sm">No members found for this trip.</p>
        </div>
      )}

      {selectedTripId && members.length > 0 && (
        <div className="space-y-4">
          {/* ── Summary bar ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Members",        icon: "👥", val: members.length,          sub: `${unsetCount} not set`, cls: "text-slate-200",   glow: "rgba(148,163,184,0.12)" },
              { label: "Total",          icon: "🎯", val: fmt(totalShareSum),      sub: null,                     cls: "text-slate-200",   glow: "rgba(148,163,184,0.12)" },
              { label: "Collected",      icon: "✅", val: fmt(totalCollected),     sub: null,                     cls: "text-emerald-400", glow: "rgba(16,185,129,0.14)" },
              { label: "Pending",        icon: "⏳", val: fmt(totalPending),       sub: null,                     cls: totalPending > 0 ? "text-amber-400" : "text-emerald-400", glow: totalPending > 0 ? "rgba(245,158,11,0.14)" : "rgba(16,185,129,0.14)" },
              { label: "Paid Members",   icon: "🙌", val: paidCount,               sub: `of ${members.length}`,  cls: "text-emerald-400", glow: "rgba(16,185,129,0.14)" },
              { label: "Due Members",    icon: "⌛", val: pendingMembersCount,     sub: `of ${members.length}`,  cls: pendingMembersCount > 0 ? "text-amber-400" : "text-emerald-400", glow: pendingMembersCount > 0 ? "rgba(245,158,11,0.14)" : "rgba(16,185,129,0.14)" },
            ].map(({ label, icon, val, sub, cls, glow }) => (
              <div key={label} className="relative overflow-hidden bg-slate-900/80 border border-slate-800 rounded-xl p-3"
                style={{ boxShadow: `0 0 18px ${glow}` }}>
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
                  <span className="text-xs opacity-70">{icon}</span>
                </div>
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
                  isSuperAdmin={isSuperAdmin}
                  onRefresh={load}
                  onShareSuccess={showShareSuccess}
                  onShareError={showShareError}
                  onPaymentSuccess={showPaymentSuccess}
                  onPaymentError={showPaymentError}
                  confirmDelete={confirmDelete}
                />
              );
            })}
          </div>
        </div>
      )}
    </TripModuleShell>
  );
}
