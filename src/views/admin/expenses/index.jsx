import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getExpenses, addExpense, updateExpense, getTripHub } from "../../../services/trips";
import { getAdminGroups } from "../../../services/groups";

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
function ImageField({ value, onChange }) {
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
        <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-700 group">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-red-600/80 transition-colors"
          >
            ×
          </button>
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
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
}

/* ─── EditModal ──────────────────────────────────────────────────────────────── */
function EditModal({ expense, tripId, onClose, onSaved }) {
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
      await updateExpense(tripId, expense._id, {
        ...form,
        amount:   Number(form.amount),
        imageUrl: form.imageUrl || undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update expense.");
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
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
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
            <ImageField value={form.imageUrl} onChange={(v) => set("imageUrl", v)} />
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
        <img src={src} alt="" className="w-full rounded-2xl shadow-2xl border border-slate-700" />
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
  const [hub,              setHub]              = useState(null);
  const [items,            setItems]            = useState([]);
  const [groupMemberCount, setGroupMemberCount] = useState(null);
  const [form,    setForm]    = useState({
    category: "Food", amount: "", description: "", imageUrl: "",
  });
  const [editExp,    setEditExp]    = useState(null);
  const [previewImg, setPreviewImg] = useState(null);

  const load = useCallback(async () => {
    if (!selectedTripId) return;
    const [h, e, g] = await Promise.all([
      getTripHub(selectedTripId),
      getExpenses(selectedTripId),
      getAdminGroups(),
    ]);
    setHub(h?.data);
    setItems(e?.data || []);
    const linkedGroup = (g?.data || []).find(
      (grp) => String(grp.tripId) === String(selectedTripId)
    );
    setGroupMemberCount(linkedGroup?.members?.length ?? null);
  }, [selectedTripId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (ev) => {
    ev.preventDefault();
    await addExpense(selectedTripId, {
      ...form,
      amount:   Number(form.amount),
      imageUrl: form.imageUrl || undefined,
    });
    setForm({ category: "Food", amount: "", description: "", imageUrl: "" });
    load();
  };

  const s         = hub?.expenseSummary;
  const pct       = s?.totalBudget > 0 ? Math.min(100, Math.round((s.totalSpent / s.totalBudget) * 100)) : 0;
  const remaining = (s?.totalBudget || 0) - (s?.totalSpent || 0);

  return (
    <TripModuleShell title="Expenses" description="Auto-calculated trip budget & splits">
      {editExp && (
        <EditModal
          expense={editExp}
          tripId={selectedTripId}
          onClose={() => setEditExp(null)}
          onSaved={load}
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
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-medium text-slate-400">Budget Usage</p>
                  <p className="text-xs font-bold text-slate-300">{pct}%</p>
                </div>
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 90
                        ? "linear-gradient(90deg,#ef4444,#dc2626)"
                        : pct >= 70
                        ? "linear-gradient(90deg,#f59e0b,#d97706)"
                        : "linear-gradient(90deg,#10b981,#059669)",
                    }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-base font-bold text-slate-200">{fmt(s.totalBudget)}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Budget</p>
                  </div>
                  <div className="text-center border-x border-slate-700/50">
                    <p className={`text-base font-bold ${pct >= 90 ? "text-red-400" : "text-amber-400"}`}>
                      {fmt(s.totalSpent)}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Spent</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-base font-bold ${remaining < 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {fmt(Math.abs(remaining))}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">
                      {remaining < 0 ? "Over" : "Left"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: "Budget",    val: fmt(s.totalBudget),     cls: "text-slate-200"  },
                  { label: "Collected", val: fmt(s.totalCollected),   cls: "text-blue-400"   },
                  { label: "Spent",     val: fmt(s.totalSpent),        cls: pct >= 90 ? "text-red-400" : "text-amber-400" },
                  { label: "Balance",   val: fmt(s.remainingBalance), cls: (s.remainingBalance || 0) < 0 ? "text-red-400" : "text-emerald-400" },
                  { label: "Members",   val: groupMemberCount != null ? groupMemberCount : (s.memberCount ?? "—"), cls: "text-slate-200" },
                ].map(({ label, val, cls }) => (
                  <div key={label} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className={`text-lg font-bold ${cls}`}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Add expense form ── */}
          <form onSubmit={handleAdd} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 mb-4">
            <p className="text-xs text-slate-400 font-medium">Add Expense</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputCls}
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
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
            />
            <button type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors">
              Add Expense
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
                  <li key={x._id} className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* Category icon + info */}
                      <span className="text-xl shrink-0">{icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-200 capitalize">{x.category || "Other"}</p>
                        {x.description && (
                          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{x.description}</p>
                        )}
                      </div>
                      {/* Receipt thumbnail — compact square */}
                      {x.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewImg(x.imageUrl)}
                          title="View receipt"
                          className="shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-slate-700 hover:border-emerald-600/60 transition-colors relative group"
                        >
                          <img src={x.imageUrl} alt="receipt" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                          </div>
                        </button>
                      )}
                      {/* Amount + Edit */}
                      <p className="font-bold text-slate-200 font-mono shrink-0">{fmt(x.amount)}</p>
                      <button
                        type="button"
                        onClick={() => setEditExp(x)}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 text-xs font-medium transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
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
