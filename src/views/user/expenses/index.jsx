import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getExpenses, getSponsors } from "../../../services/trips";
import ZoomableImage from "../../../components/ui/ZoomableImage";
import SponsorWall from "../../../components/trip/SponsorWall";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const CATEGORY_ICON = {
  food: "🍽️", travel: "✈️", accommodation: "🏨", van: "🚐",
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

  const plannedBudget = Number(selectedTrip?.budget || 0);
  const totalSponsor  = sponsors.reduce((s, sp) => s + (Number(sp.amount) || 0), 0);
  const totalSpent    = items.reduce((s, e) => s + (e.amount || 0), 0);

  // Two independent real-money pools, split by what each expense actually drew from.
  const shareCollectionSpent = items
    .filter((e) => (e.fundSource || "shareCollection") === "shareCollection")
    .reduce((s, e) => s + (e.amount || 0), 0);
  const sponsorSpent = items
    .filter((e) => e.fundSource === "sponsor")
    .reduce((s, e) => s + (e.amount || 0), 0);
  const sponsorRemaining = totalSponsor - sponsorSpent;
  const sponsorPct = totalSponsor > 0 ? Math.min(100, Math.round((sponsorSpent / totalSponsor) * 100)) : 0;

  return (
    <TripModuleShell title="Expenses" description="Trip expense summary" loading={loading && !!selectedTripId}>
      {previewImg && (
        <ImagePreviewModal src={previewImg} onClose={() => setPreviewImg(null)} />
      )}

      {/* ── Budget summary cards ── */}
      {selectedTripId && (
        <div className="space-y-3 mb-4">

          {/* ── Sponsor Fund pool (the only real total this view has full data for) ── */}
          {totalSponsor > 0 && (
            <div className="relative rounded-2xl overflow-hidden border border-violet-500/30 bg-slate-900/80 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest">🏢 Sponsor Fund</p>
                <span className={`text-[10px] font-black ${sponsorPct >= 90 ? "text-red-400" : "text-violet-400"}`}>{sponsorPct}%</span>
              </div>
              <p className="text-xl font-black text-slate-100">{fmt(totalSponsor)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 mb-3">{sponsors.length} sponsor{sponsors.length !== 1 ? "s" : ""} contributing</p>
              <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${sponsorPct}%`,
                    background: sponsorPct >= 90 ? "linear-gradient(90deg,#dc2626,#ef4444)" : "linear-gradient(90deg,#7c3aed,#a78bfa,#c4b5fd)",
                  }} />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                <span>Spent: <span className="text-slate-300 font-semibold">{fmt(sponsorSpent)}</span></span>
                <span className={sponsorRemaining < 0 ? "text-red-400 font-semibold" : "text-emerald-400 font-semibold"}>
                  {sponsorRemaining < 0 ? `${fmt(Math.abs(sponsorRemaining))} over` : `${fmt(sponsorRemaining)} left`}
                </span>
              </div>
              <SponsorWall sponsors={sponsors} onPreview={setPreviewImg} />
            </div>
          )}

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Planned Budget (estimate)", val: fmt(plannedBudget), cls: "text-slate-400" },
              { label: "Spent — Share Collection", val: fmt(shareCollectionSpent), cls: "text-blue-400" },
              { label: "Spent — Sponsor Fund", val: fmt(sponsorSpent), cls: "text-violet-400" },
              { label: "Total Spent", val: fmt(totalSpent), cls: "text-amber-400" },
            ].map(({ label, val, cls }) => (
              <div key={label} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
                <p className={`text-base font-bold ${cls}`}>{val}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 px-1">
            Planned Budget is a planning estimate only. Every expense actually draws from Share Collection or Sponsor Fund.
          </p>
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-200 capitalize">{x.category || "Other"}</p>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide ${
                        x.fundSource === "sponsor"
                          ? "bg-violet-500/15 text-violet-300 border border-violet-700/40"
                          : "bg-blue-500/15 text-blue-300 border border-blue-700/40"
                      }`}>
                        {x.fundSource === "sponsor" ? "Sponsor Fund" : "Share Collection"}
                      </span>
                    </div>
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
