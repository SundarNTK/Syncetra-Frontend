import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getExpenses } from "../../../services/trips";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const CATEGORY_ICON = {
  food: "🍽️", travel: "✈️", accommodation: "🏨",
  entertainment: "🎭", shopping: "🛍️", medical: "💊", other: "💸",
};

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

export default function UserExpenses() {
  const { selectedTripId, selectedTrip } = useTrip();
  const [items,      setItems]      = useState([]);
  const [previewImg, setPreviewImg] = useState(null);

  useEffect(() => {
    if (selectedTripId)
      getExpenses(selectedTripId, false).then((r) => setItems(r?.data || []));
    else
      setItems([]);
  }, [selectedTripId]);

  const totalBudget    = Number(selectedTrip?.budget || 0);
  const totalCollected = Number(selectedTrip?.collectedAmount || 0);
  const totalSpent     = items.reduce((s, e) => s + (e.amount || 0), 0);
  const remaining      = totalBudget - totalSpent;
  const pct            = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;

  return (
    <TripModuleShell title="Expenses" description="Trip expense summary">
      {previewImg && (
        <ImagePreviewModal src={previewImg} onClose={() => setPreviewImg(null)} />
      )}

      {/* ── Budget summary cards ── */}
      {selectedTripId && (
        <div className="space-y-3 mb-4">
          {/* Progress bar */}
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
                <p className="text-base font-bold text-slate-200">{fmt(totalBudget)}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Budget</p>
              </div>
              <div className="text-center border-x border-slate-700/50">
                <p className={`text-base font-bold ${pct >= 90 ? "text-red-400" : "text-amber-400"}`}>
                  {fmt(totalSpent)}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Spent</p>
              </div>
              <div className="text-center">
                <p className={`text-base font-bold ${remaining < 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {fmt(remaining)}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">
                  {remaining < 0 ? "Over" : "Left"}
                </p>
              </div>
            </div>
          </div>

          {/* Collected */}
          {totalCollected > 0 && (
            <div className="flex items-center justify-between bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-2.5">
              <p className="text-xs text-slate-400">Total Collected</p>
              <p className="text-sm font-semibold text-blue-400">{fmt(totalCollected)}</p>
            </div>
          )}
        </div>
      )}

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
                  <span className="text-xl shrink-0">{icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-200 capitalize">{x.category || "Other"}</p>
                    {x.description && (
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">{x.description}</p>
                    )}
                  </div>
                  {/* Receipt thumbnail */}
                  {x.imageUrl && (
                    <button type="button" onClick={() => setPreviewImg(x.imageUrl)} title="View receipt"
                      className="shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-slate-700 hover:border-emerald-600/60 transition-colors relative group">
                      <img src={x.imageUrl} alt="receipt" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                      </div>
                    </button>
                  )}
                  <p className="font-bold text-slate-200 font-mono shrink-0">{fmt(x.amount)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </TripModuleShell>
  );
}
