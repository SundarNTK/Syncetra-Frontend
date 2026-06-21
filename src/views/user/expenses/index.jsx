import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getExpenses, getSponsors } from "../../../services/trips";
import ZoomableImage from "../../../components/ui/ZoomableImage";

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

export default function UserExpenses() {
  const { selectedTripId, selectedTrip } = useTrip();
  const [items,      setItems]      = useState([]);
  const [sponsors,   setSponsors]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [previewImg, setPreviewImg] = useState(null);

  useEffect(() => {
    if (!selectedTripId) {
      setItems([]);
      setSponsors([]);
      return undefined;
    }
    let ignore = false;
    setLoading(true);
    Promise.all([
      getExpenses(selectedTripId, false),
      getSponsors(selectedTripId, false),
    ])
      .then(([expRes, spRes]) => {
        if (!ignore) {
          setItems(expRes?.data || []);
          setSponsors(spRes?.data || []);
        }
      })
      .catch(() => {
        if (!ignore) { setItems([]); setSponsors([]); }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => { ignore = true; };
  }, [selectedTripId]);

  const totalBudget   = Number(selectedTrip?.budget || 0);
  const totalSponsor  = sponsors.reduce((s, sp) => s + (Number(sp.amount) || 0), 0);
  const grandTotal    = totalBudget + totalSponsor;
  const totalSpent    = items.reduce((s, e) => s + (e.amount || 0), 0);
  const remaining     = grandTotal - totalSpent;
  const pct           = grandTotal > 0 ? Math.min(100, Math.round((totalSpent / grandTotal) * 100)) : 0;

  return (
    <TripModuleShell title="Expenses" description="Trip expense summary" loading={loading && !!selectedTripId}>
      {previewImg && (
        <ImagePreviewModal src={previewImg} onClose={() => setPreviewImg(null)} />
      )}

      {/* ── Budget summary cards ── */}
      {selectedTripId && (
        <div className="space-y-3 mb-4">

          {/* ── Fund glow box ── */}
          {totalSponsor > 0 ? (
            /* Expanded sponsor glow box with Fund Usage progress */
            <div className="relative rounded-2xl overflow-hidden border border-violet-500/40 bg-slate-900/80 shadow-[0_0_24px_rgba(139,92,246,0.16)]">
              <div className="absolute inset-0 pointer-events-none rounded-2xl"
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.10) 0%, transparent 65%)" }} />

              {/* Header */}
              <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-3 relative">
                <div>
                  <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest mb-0.5">🏢 Sponsor Fund</p>
                  <p className="text-xl font-black"
                    style={{ background: "linear-gradient(90deg,#a78bfa,#c4b5fd,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {fmt(totalSponsor)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{sponsors.length} sponsor{sponsors.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Grand Total</p>
                  <p className="text-lg font-black text-emerald-400">{fmt(grandTotal)}</p>
                  <p className="text-[10px] text-slate-600">Budget + Sponsor</p>
                </div>
              </div>

              {/* Progress bars */}
              <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06] pt-3 relative">
                {/* Fund Usage */}
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
                        background: pct >= 90 ? "linear-gradient(90deg,#dc2626,#ef4444)" : pct >= 70 ? "linear-gradient(90deg,#d97706,#f59e0b)" : "linear-gradient(90deg,#059669,#10b981)",
                        boxShadow: pct > 0 ? `0 0 10px rgba(${pct >= 90 ? "239,68,68" : pct >= 70 ? "245,158,11" : "16,185,129"},0.45)` : "none",
                      }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <p className="text-[10px] text-slate-600">
                      {remaining < 0 ? `${fmt(Math.abs(remaining))} over fund` : `${fmt(remaining)} left`}
                    </p>
                    {pct >= 90 && <p className="text-[10px] text-red-400 font-semibold">⚠ Near limit</p>}
                  </div>
                </div>

                {/* Mini budget vs grand total breakdown */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 text-center bg-slate-800/60 rounded-lg py-2">
                    <p className="text-sm font-bold text-slate-200">{fmt(totalBudget)}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Members Budget</p>
                  </div>
                  <span className="text-slate-600 text-xs">+</span>
                  <div className="flex-1 text-center bg-slate-800/60 rounded-lg py-2" style={{ border: "1px solid rgba(139,92,246,0.2)" }}>
                    <p className="text-sm font-bold text-violet-400">{fmt(totalSponsor)}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Sponsor</p>
                  </div>
                  <span className="text-slate-600 text-xs">=</span>
                  <div className="flex-1 text-center bg-slate-800/60 rounded-lg py-2" style={{ border: "1px solid rgba(16,185,129,0.2)" }}>
                    <p className="text-sm font-bold text-emerald-400">{fmt(grandTotal)}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Total</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Simple fund usage — no sponsors */
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
                  <p className="text-base font-bold text-slate-200">{fmt(totalBudget)}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Budget</p>
                </div>
                <div className="text-center border-x border-slate-700/50">
                  <p className={`text-base font-bold ${pct >= 90 ? "text-red-400" : "text-amber-400"}`}>{fmt(totalSpent)}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Spent</p>
                </div>
                <div className="text-center">
                  <p className={`text-base font-bold ${remaining < 0 ? "text-red-400" : "text-emerald-400"}`}>{fmt(Math.abs(remaining))}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{remaining < 0 ? "Over" : "Left"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Fund breakdown */}
          {totalSponsor > 0 && (
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl px-4 py-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Fund Breakdown</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
                <span>Members budget: <span className="text-slate-200 font-semibold">{fmt(totalBudget)}</span></span>
                <span className="text-slate-600">+</span>
                <span>Sponsors: <span className="text-violet-400 font-semibold">{fmt(totalSponsor)}</span></span>
                <span className="text-slate-600">=</span>
                <span>Total: <span className="text-emerald-400 font-semibold">{fmt(grandTotal)}</span></span>
              </div>
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
                      <ZoomableImage src={x.imageUrl} alt="receipt" className="w-full h-full object-cover" />
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
