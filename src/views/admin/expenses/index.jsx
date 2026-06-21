import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getExpenses, addExpense, updateExpense, deleteExpense, getTripHub, getSponsors } from "../../../services/trips";
import { getAdminGroups } from "../../../services/groups";
import ZoomableImage from "../../../components/ui/ZoomableImage";
import SearchableSelect from "../../../components/ui/SearchableSelect";
import { useActionPopup } from "../../../hooks/useActionPopup";
import { useDeleteConfirm } from "../../../hooks/useDeleteConfirm";
import { useAppSelector } from "../../../hooks";
import { useOnlineReload } from "../../../hooks/useOnlineReload";
import { ROLES } from "../../../constants/enum";
import { deletePendingItem, updatePendingItem } from "../../../utils/offlinePendingOps";

function PendingBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/50 text-amber-300 text-[10px] font-semibold tracking-wide uppercase">
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_#fbbf24]" />
      Not Synced
    </span>
  );
}

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const CATEGORY_ICON = {
  food:          "🍽️",
  fuel:          "⛽",
  toll:          "🛣️",
  stay:          "🏨",
  entertainment: "🎭",
  shopping:      "🛍️",
  medical:       "💊",
  other:         "💸",
};

const CATEGORIES = ["Food", "Fuel", "Toll", "Stay", "Entertainment", "Shopping", "Medical", "Other"];

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({
  value: c,
  label: c,
  icon: CATEGORY_ICON[c.toLowerCase()] || "💸",
}));

const inputCls = "w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-emerald-600/60 focus:outline-none transition-colors";

/* ─── Image helpers ──────────────────────────────────────────────────────────── */
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const compressImage = (dataUrl, maxBytes = 1.2 * 1024 * 1024) =>
  new Promise((resolve) => {
    if (dataUrl.length * 0.75 <= maxBytes) { resolve(dataUrl); return; }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale  = Math.sqrt(maxBytes / (dataUrl.length * 0.75));
      canvas.width  = Math.floor(img.width  * scale);
      canvas.height = Math.floor(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.src = dataUrl;
  });

/* ─── ImageField — single optional image ─────────────────────────────────────── */
function ImageField({ value, onChange, onPreview }) {
  const inputRef  = useRef(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await compressImage(await toBase64(file)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
          <button
            type="button"
            onClick={() => onPreview?.(value)}
            className="w-full flex items-center justify-center p-3 min-h-[120px] max-h-[260px] cursor-zoom-in hover:bg-slate-900/40 transition-colors"
            title="Click to view full size"
          >
            <ZoomableImage
              src={value}
              alt="Receipt preview"
              className="max-w-full max-h-[240px] w-auto h-auto object-contain rounded-md shadow-lg"
            />
          </button>
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-slate-800 bg-slate-900/90">
            <span className="text-[10px] text-slate-500 truncate">Receipt attached</span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-[10px] px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-[10px] px-2 py-1 rounded-md bg-red-950/50 border border-red-800/50 text-red-400 hover:bg-red-900/40 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-600 hover:border-emerald-600/60 text-slate-400 hover:text-emerald-400 text-xs transition-colors disabled:opacity-50"
        >
          {busy ? "Processing…" : "📷 Attach Receipt / Photo (optional)"}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ─── EditModal ──────────────────────────────────────────────────────────────── */
function EditModal({ expense, tripId, onClose, onSaved, onPreview }) {
  const [form, setForm] = useState({
    category:    expense.category    || "Other",
    amount:      expense.amount      || "",
    description: expense.description || "",
    imageUrl:    expense.imageUrl    || "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.amount) { setError("Amount is required."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, amount: Number(form.amount), imageUrl: form.imageUrl || undefined };
      if (expense._pending && expense._queueId) {
        await updatePendingItem(expense, payload);
        onSaved();
        onClose();
        return;
      }
      await updateExpense(tripId, expense._id, payload);
      onSaved();
      onClose();
    } catch (err) {
      if (err.queued) {
        onSaved();
        onClose();
      } else {
        setError(err.message || "Failed to update expense.");
      }
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70 backdrop-blur-sm px-4 py-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-auto">
        <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-400" />
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <p className="font-bold text-white">Edit Expense</p>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors">
            ×
          </button>
        </div>
        <div className="p-5 space-y-3">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-950/50 border border-red-800/50">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
              <SearchableSelect
                value={form.category}
                onChange={(v) => set("category", v)}
                options={CATEGORY_OPTIONS}
                searchable={false}
                searchThreshold={99}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Amount (₹) <span className="text-red-400">*</span></label>
              <input
                type="number" min="0"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                className={inputCls}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Note</label>
            <input
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={inputCls}
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Receipt / Photo</label>
            <ImageField value={form.imageUrl} onChange={(v) => set("imageUrl", v)} onPreview={onPreview} />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── ImagePreviewModal ──────────────────────────────────────────────────────── */
function ImagePreviewModal({ src, onClose }) {
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = "receipt.jpg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <ZoomableImage src={src} alt="Receipt" className="w-full rounded-2xl shadow-2xl border border-slate-700" />
        <div className="absolute top-2 right-2 flex gap-2">
          <button type="button" onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/70 hover:bg-emerald-700/90 text-white text-xs font-medium transition-colors backdrop-blur-sm">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600/80 transition-colors">
            ×
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── AdminExpenses ──────────────────────────────────────────────────────────── */
export default function AdminExpenses() {
  const { selectedTripId } = useTrip();
  const { popup, showSuccess, showError } = useActionPopup("expenses");
  const { confirmDelete, deleteModal } = useDeleteConfirm();
  const { userInfo } = useAppSelector((s) => s.user);
  const isSuperAdmin = userInfo?.user?.role === ROLES.SUPER_ADMIN;
  const [hub,              setHub]              = useState(null);
  const [items,            setItems]            = useState([]);
  const [sponsors,         setSponsors]         = useState([]);
  const [loading,          setLoading]          = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [groupMemberCount, setGroupMemberCount] = useState(null);
  const [form,    setForm]    = useState({
    category: "Food", amount: "", description: "", imageUrl: "",
  });
  const [editExp,    setEditExp]    = useState(null);
  const [previewImg, setPreviewImg] = useState(null);

  const load = useCallback(async () => {
    if (!selectedTripId) return;
    setLoading(true);
    try {
      const [h, e, g, sp] = await Promise.all([
        getTripHub(selectedTripId),
        getExpenses(selectedTripId),
        getAdminGroups(),
        getSponsors(selectedTripId),
      ]);
      // Only overwrite state when we got real data — null means offline+no cache,
      // so we keep whatever is currently in state (could be a pending item we just added).
      if (h !== null) setHub(h?.data);
      if (e !== null) setItems(e?.data || []);
      if (sp !== null) setSponsors(sp?.data || []);
      if (g !== null) {
        const linkedGroup = (g?.data || []).find(
          (grp) => String(grp.tripId) === String(selectedTripId)
        );
        setGroupMemberCount(linkedGroup?.members?.length ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedTripId]);

  useEffect(() => { load(); }, [load]);
  useOnlineReload(load);

  const handleAdd = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    try {
      await addExpense(selectedTripId, {
        ...form,
        amount:   Number(form.amount),
        imageUrl: form.imageUrl || undefined,
      });
      setForm({ category: "Food", amount: "", description: "", imageUrl: "" });
      load();
      showSuccess("Expense added successfully.");
    } catch (err) {
      if (err.queued) {
        setForm({ category: "Food", amount: "", description: "", imageUrl: "" });
        load(); // Re-reads from cache which now has the pending item
        showSuccess("Saved offline — will sync automatically when reconnected.");
      } else {
        showError(err.message || "Failed to add expense.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (x) => {
    confirmDelete({
      title: "Delete Expense",
      recordLabel: `${x.category} — ₹${Number(x.amount || 0).toLocaleString("en-IN")}`,
      onConfirm: async () => {
        try {
          if (x._pending && x._queueId) {
            await deletePendingItem(x);
            load();
            showSuccess("Unsaved expense removed.");
            return;
          }
          await deleteExpense(selectedTripId, x._id);
          load();
          showSuccess("Expense deleted successfully.");
        } catch (e) {
          if (e.queued) {
            showSuccess("Delete saved offline — will sync when reconnected.");
          } else {
            showError(e.message || "Delete failed.");
          }
        }
      },
    });
  };

  const s             = hub?.expenseSummary;
  const totalSponsor  = sponsors.reduce((acc, sp) => acc + (Number(sp.amount) || 0), 0);
  const totalBudget   = s?.totalBudget   || 0;
  const grandTotal    = totalBudget + totalSponsor;
  const totalSpent    = s?.totalSpent    || 0;
  const totalCollected = s?.totalCollected || 0;
  const grandBalance  = grandTotal - totalSpent;
  const pct           = grandTotal > 0 ? Math.min(100, Math.round((totalSpent / grandTotal) * 100)) : 0;
  const collectionPct = totalBudget > 0 ? Math.min(100, Math.round((totalCollected / totalBudget) * 100)) : 0;

  return (
    <TripModuleShell title="Expenses" description="Auto-calculated trip budget & splits" loading={loading && !!selectedTripId}>
      {popup}
      {deleteModal}
      {editExp && (
        <EditModal
          expense={editExp}
          tripId={selectedTripId}
          onClose={() => setEditExp(null)}
          onSaved={() => { load(); showSuccess("Expense updated successfully."); }}
          onPreview={setPreviewImg}
        />
      )}
      {previewImg && (
        <ImagePreviewModal src={previewImg} onClose={() => setPreviewImg(null)} />
      )}

      {selectedTripId && (
        <>
          {/* ── Summary ── */}
          {s && (
            <div className="space-y-3 mb-4">

              {/* ── Fund glow box ── */}
              {totalSponsor > 0 ? (
                /* Expanded sponsor glow box with progress bars */
                <div className="relative rounded-2xl overflow-hidden border border-violet-500/40 bg-slate-900/80 shadow-[0_0_28px_rgba(139,92,246,0.18)]">
                  <div className="absolute inset-0 pointer-events-none rounded-2xl"
                    style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 65%)" }} />

                  {/* Header row */}
                  <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-4 relative">
                    <div>
                      <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest mb-0.5">🏢 Sponsor Fund</p>
                      <p className="text-2xl font-black"
                        style={{ background: "linear-gradient(90deg,#a78bfa,#c4b5fd,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        {fmt(totalSponsor)}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{sponsors.length} sponsor{sponsors.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Grand Total</p>
                      <p className="text-xl font-black text-emerald-400">{fmt(grandTotal)}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">Budget + Sponsor</p>
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div className="px-5 pb-5 space-y-4 relative border-t border-white/[0.06] pt-4">

                    {/* Bar 1 — Budget Collection from members */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Member Collection</p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="font-bold text-blue-400">{fmt(totalCollected)}</span>
                          <span className="text-slate-600">/</span>
                          <span className="text-slate-400">{fmt(totalBudget)}</span>
                          <span className="ml-1.5 font-black text-blue-400">{collectionPct}%</span>
                        </div>
                      </div>
                      <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${collectionPct}%`,
                            background: "linear-gradient(90deg,#2563eb,#3b82f6,#60a5fa)",
                            boxShadow: collectionPct > 0 ? "0 0 10px rgba(59,130,246,0.55)" : "none",
                          }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <p className="text-[10px] text-slate-600">
                          {fmt(Math.max(0, totalBudget - totalCollected))} pending from members
                        </p>
                        <p className="text-[10px] text-slate-600">
                          {collectionPct >= 100 ? "✓ Fully collected" : `${100 - collectionPct}% remaining`}
                        </p>
                      </div>
                    </div>

                    {/* Bar 2 — Fund Usage (Spent vs Grand Total) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full"
                            style={{ background: pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#10b981", boxShadow: `0 0 6px ${pct >= 90 ? "rgba(239,68,68,0.8)" : pct >= 70 ? "rgba(245,158,11,0.8)" : "rgba(16,185,129,0.8)"}` }} />
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Fund Usage</p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className={`font-bold ${pct >= 90 ? "text-red-400" : pct >= 70 ? "text-amber-400" : "text-emerald-400"}`}>{fmt(totalSpent)}</span>
                          <span className="text-slate-600">/</span>
                          <span className="text-slate-400">{fmt(grandTotal)}</span>
                          <span className={`ml-1.5 font-black ${pct >= 90 ? "text-red-400" : pct >= 70 ? "text-amber-400" : "text-emerald-400"}`}>{pct}%</span>
                        </div>
                      </div>
                      <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: pct >= 90
                              ? "linear-gradient(90deg,#dc2626,#ef4444)"
                              : pct >= 70
                              ? "linear-gradient(90deg,#d97706,#f59e0b)"
                              : "linear-gradient(90deg,#059669,#10b981)",
                            boxShadow: pct > 0 ? `0 0 10px rgba(${pct >= 90 ? "239,68,68" : pct >= 70 ? "245,158,11" : "16,185,129"},0.45)` : "none",
                          }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <p className="text-[10px] text-slate-600">
                          {grandBalance < 0 ? `${fmt(Math.abs(grandBalance))} over fund` : `${fmt(grandBalance)} left`}
                        </p>
                        {pct >= 90 && <p className="text-[10px] text-red-400 font-semibold">⚠ Near limit</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Simple fund usage card — no sponsors */
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-medium text-slate-400">Fund Usage</p>
                    <p className="text-xs font-bold text-slate-300">{pct}%</p>
                  </div>
                  <div className="h-2 rounded-full bg-slate-700 overflow-hidden mb-3">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 90 ? "linear-gradient(90deg,#ef4444,#dc2626)" : pct >= 70 ? "linear-gradient(90deg,#f59e0b,#d97706)" : "linear-gradient(90deg,#10b981,#059669)",
                      }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-base font-bold text-slate-200">{fmt(grandTotal)}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Budget</p>
                    </div>
                    <div className="text-center border-x border-slate-700/50">
                      <p className={`text-base font-bold ${pct >= 90 ? "text-red-400" : "text-amber-400"}`}>{fmt(totalSpent)}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Spent</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-base font-bold ${grandBalance < 0 ? "text-red-400" : "text-emerald-400"}`}>{fmt(Math.abs(grandBalance))}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{grandBalance < 0 ? "Over" : "Left"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Budget",     val: fmt(totalBudget),     cls: "text-slate-200" },
                  { label: "Sponsor",    val: fmt(totalSponsor),    cls: "text-violet-400" },
                  { label: "Collected",  val: fmt(totalCollected),  cls: "text-blue-400"  },
                  { label: "Spent",      val: fmt(totalSpent),      cls: pct >= 90 ? "text-red-400" : "text-amber-400" },
                  { label: "Balance",    val: fmt(Math.abs(grandBalance)), cls: grandBalance < 0 ? "text-red-400" : "text-emerald-400" },
                  { label: "Members",    val: groupMemberCount != null ? groupMemberCount : (s.memberCount ?? "—"), cls: "text-slate-200" },
                ].map(({ label, val, cls }) => (
                  <div key={label}
                    className={`bg-slate-900/80 border rounded-xl p-3 ${label === "Sponsor" && totalSponsor > 0 ? "border-violet-700/40 shadow-[0_0_12px_rgba(139,92,246,0.12)]" : "border-slate-800"}`}>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className={`text-lg font-bold ${cls}`}>{val}</p>
                  </div>
                ))}
              </div>

              {/* Budget breakdown detail */}
              {totalSponsor > 0 && (
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl px-4 py-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Fund Breakdown</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
                    <span>Budget (members share): <span className="text-slate-200 font-semibold">{fmt(totalBudget)}</span></span>
                    <span className="text-slate-600">+</span>
                    <span>Sponsor contributions: <span className="text-violet-400 font-semibold">{fmt(totalSponsor)}</span></span>
                    <span className="text-slate-600">=</span>
                    <span>Grand Total: <span className="text-emerald-400 font-semibold">{fmt(grandTotal)}</span></span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Add expense form ── */}
          <form onSubmit={handleAdd} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 mb-4">
            <p className="text-xs text-slate-400 font-medium">Add Expense</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <SearchableSelect
                value={form.category}
                onChange={(v) => setForm({ ...form, category: v })}
                options={CATEGORY_OPTIONS}
                searchable={false}
                searchThreshold={99}
              />
              <input
                type="number"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className={inputCls}
                required
              />
              <input
                placeholder="Note"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={`${inputCls} col-span-2`}
              />
            </div>
            <ImageField
              value={form.imageUrl}
              onChange={(v) => setForm({ ...form, imageUrl: v })}
              onPreview={setPreviewImg}
            />
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {saving && (
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {saving ? (navigator.onLine ? "Saving…" : "Saving offline…") : "Add Expense"}
            </button>
          </form>

          {/* ── Expense list ── */}
          {items.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <p className="text-3xl mb-2">💸</p>
              <p className="text-sm">No expenses recorded yet.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((x) => {
                const icon = CATEGORY_ICON[x.category?.toLowerCase()] || "💸";
                return (
                  <li
                    key={x._id}
                    className={`border rounded-xl px-4 py-3 transition-all ${
                      x._pending
                        ? "bg-amber-950/20 border-amber-600/40 shadow-[0_0_12px_rgba(251,191,36,0.12)]"
                        : "bg-slate-900/60 border-slate-800"
                    }`}
                  >
                    {/* Row 1 — category icon + name/note + amount */}
                    <div className="flex items-center gap-3">
                      <span className="text-xl shrink-0">{icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-slate-200 capitalize">{x.category || "Other"}</p>
                          {x._pending && <PendingBadge />}
                        </div>
                        {x.description && (
                          <p className="text-xs text-slate-500 mt-0.5 leading-snug truncate">{x.description}</p>
                        )}
                      </div>
                      <p className="font-bold text-slate-200 font-mono shrink-0 text-sm">{fmt(x.amount)}</p>
                    </div>

                    {/* Row 2 — receipt thumbnail (left) + action buttons (right) */}
                    <div className="flex items-center gap-2 mt-2 pl-9">
                      {x.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewImg(x.imageUrl)}
                          title="View receipt"
                          className="shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 hover:border-emerald-600/60 transition-colors relative group"
                        >
                          <img src={x.imageUrl} alt="receipt" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                          </div>
                        </button>
                      )}
                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={() => setEditExp(x)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 text-xs font-medium transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDelete(x)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/40 border border-red-800/50 text-red-400 hover:bg-red-900/60 hover:text-red-300 text-xs font-medium transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </TripModuleShell>
  );
}
