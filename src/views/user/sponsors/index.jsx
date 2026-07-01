import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getSponsors } from "../../../services/trips";
import { useOnlineReload } from "../../../hooks/useOnlineReload";
import ZoomableImage from "../../../components/ui/ZoomableImage";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/* ─── Keyframes (injected once) ─────────────────────────────────────────────── */
const KF = `
@keyframes royalGlow      { 0%,100%{box-shadow:0 0 20px rgba(245,158,11,0.22),0 0 45px rgba(139,92,246,0.16)} 50%{box-shadow:0 0 34px rgba(245,158,11,0.45),0 0 80px rgba(139,92,246,0.32)} }
@keyframes crownFloat     { 0%,100%{transform:translateY(0) rotate(-5deg)} 50%{transform:translateY(-7px) rotate(5deg)} }
@keyframes sparkleTwinkle { 0%,100%{opacity:0.15;transform:scale(0.6)} 50%{opacity:1;transform:scale(1.2)} }
@keyframes fadeUpCard     { from{opacity:0;transform:translateY(18px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes haloSpin       { from{transform:translate(-50%,-50%) rotate(0deg)} to{transform:translate(-50%,-50%) rotate(360deg)} }
@keyframes shimmer        { 0%{background-position:200% center} 100%{background-position:-200% center} }
@keyframes cardEntrance   { 0%{transform:scale(0.05) rotate(-18deg);opacity:0} 35%{transform:scale(1.09) rotate(4deg);opacity:1} 58%{transform:scale(0.95) rotate(-2deg)} 76%{transform:scale(1.03) rotate(1deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
@keyframes countUp        { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }
.sp-royal-glow  { animation: royalGlow 3.2s ease-in-out infinite; }
.sp-crown-float { animation: crownFloat 2.8s ease-in-out infinite; }
.sp-sparkle     { animation: sparkleTwinkle 2.1s ease-in-out infinite; }
.sp-card-in     { animation: fadeUpCard 0.5s cubic-bezier(0.22,1,0.36,1) both; }
.sp-halo-spin   { animation: haloSpin 8s linear infinite; }
.sp-card-enter  { animation: cardEntrance 0.85s cubic-bezier(0.22,1.2,0.36,1) both; }
.sp-shimmer-text {
  background: linear-gradient(90deg,#a78bfa,#f59e0b,#fde68a,#a78bfa,#c4b5fd);
  background-size: 300% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 3.5s linear infinite;
}
`;

/* ─── Sparkle decoration ─────────────────────────────────────────────────────── */
function Sparkles({ className = "" }) {
  const dots = [
    { top: "8%", left: "6%", size: 5, delay: "0s" },
    { top: "18%", left: "92%", size: 4, delay: "0.5s" },
    { top: "72%", left: "4%", size: 3, delay: "1.1s" },
    { top: "82%", left: "88%", size: 5, delay: "0.8s" },
    { top: "40%", left: "97%", size: 3, delay: "1.5s" },
  ];
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {dots.map((d, i) => (
        <span key={i} className="sp-sparkle absolute rounded-full"
          style={{ top: d.top, left: d.left, width: d.size, height: d.size, background: "#fde68a", boxShadow: "0 0 8px 2px rgba(253,230,138,0.8)", animationDelay: d.delay }} />
      ))}
    </div>
  );
}

const RANK_RING = [
  "linear-gradient(135deg,#fde68a,#f59e0b,#fbbf24)",
  "linear-gradient(135deg,#e5e7eb,#9ca3af,#d1d5db)",
  "linear-gradient(135deg,#f0c294,#c2703d,#e0a872)",
];

/* ─── ImagePreviewModal ───────────────────────────────────────────────────────── */
function ImagePreviewModal({ src, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = src; a.download = "sponsor-image.jpg";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 backdrop-blur-sm px-4"
      onClick={onClose}>
      <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <ZoomableImage src={src} alt="Sponsor" className="w-full rounded-2xl shadow-2xl border border-slate-700" />
        <div className="absolute top-2 right-2 flex gap-2">
          <button type="button" onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/70 hover:bg-violet-700/90 text-white text-xs font-medium transition-colors backdrop-blur-sm">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600/80 transition-colors">×</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── SponsorViewModal ────────────────────────────────────────────────────────── */
function SponsorViewModal({ sponsor, onClose }) {
  const [previewImg, setPreviewImg] = useState(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-8"
      onClick={onClose}>
      <div
        className="sp-card-enter sp-royal-glow relative border border-amber-400/30 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ background: "linear-gradient(160deg,#150f2e,#1c1440,#150f2e)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent stripe */}
        <div className="h-1 w-full"
          style={{ background: "linear-gradient(90deg,transparent,#a78bfa,#f59e0b,#a78bfa,transparent)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(245,158,11,0.14) 0%,transparent 60%)" }} />
        <Sparkles />

        {/* Header */}
        <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="sp-crown-float inline-block text-lg">👑</span>
            <p className="font-bold text-white uppercase tracking-wide text-sm">Sponsor Details</p>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors">
            ×
          </button>
        </div>

        <div className="relative p-5 space-y-4">
          {/* Image */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="sp-halo-spin absolute w-24 h-24 rounded-full" style={{ top: "50%", left: "50%", background: "conic-gradient(from 0deg,#f59e0b,#a78bfa,transparent,#f59e0b)", opacity: 0.55, filter: "blur(3px)" }} />
              {sponsor.imageUrl ? (
                <button
                  type="button"
                  onClick={() => setPreviewImg(sponsor.imageUrl)}
                  className="relative rounded-2xl overflow-hidden border-2 cursor-zoom-in hover:opacity-90 transition-opacity bg-slate-950"
                  style={{ borderColor: "rgba(245,158,11,0.5)", boxShadow: "0 0 30px rgba(245,158,11,0.35)" }}
                >
                  <ZoomableImage src={sponsor.imageUrl} alt={sponsor.sponsorName}
                    className="w-32 h-32 object-contain p-1" />
                </button>
              ) : (
                <div className="relative w-32 h-32 rounded-2xl flex items-center justify-center text-6xl bg-slate-950"
                  style={{ border: "2px solid rgba(245,158,11,0.4)", boxShadow: "0 0 30px rgba(245,158,11,0.25)" }}>
                  🏢
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="text-center">
            <p className="text-[10px] text-amber-400/70 uppercase tracking-widest mb-1">Sponsor</p>
            <p className="sp-shimmer-text text-2xl font-black">{sponsor.sponsorName}</p>
          </div>

          {/* Amount glow card */}
          <div className="rounded-xl p-4 text-center"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)" }}>
            <p className="text-[10px] text-amber-500/70 uppercase tracking-widest mb-1">Contribution Amount</p>
            <p className="text-3xl font-black"
              style={{ color: "#fbbf24", textShadow: "0 0 16px rgba(245,158,11,0.5)", animation: "countUp 0.5s cubic-bezier(0.34,1.4,0.64,1) both" }}>
              {fmt(sponsor.amount)}
            </p>
          </div>

          {/* Notes */}
          {sponsor.notes && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Notes</p>
              <p className="text-sm text-slate-300">{sponsor.notes}</p>
            </div>
          )}
        </div>

        <div className="px-5 pb-5">
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors">
            Close
          </button>
        </div>
      </div>

      {previewImg && (
        <ImagePreviewModal src={previewImg} onClose={() => setPreviewImg(null)} />
      )}
    </div>,
    document.body
  );
}

/* ─── UserSponsors ────────────────────────────────────────────────────────────── */
export default function UserSponsors() {
  const { selectedTripId } = useTrip();
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [viewSp,   setViewSp]   = useState(null);
  const [previewImg, setPreviewImg] = useState(null);

  const load = useCallback(async () => {
    if (!selectedTripId) return;
    setLoading(true);
    try {
      const res = await getSponsors(selectedTripId, false); // false = user scope
      if (res !== null) setItems(res?.data || []);
    } finally {
      setLoading(false);
    }
  }, [selectedTripId]);

  useEffect(() => { load(); }, [load]);
  useOnlineReload(load);

  const totalSponsor = items.reduce((s, sp) => s + (Number(sp.amount) || 0), 0);

  return (
    <TripModuleShell
      title="Sponsors"
      description="Organisations and individuals sponsoring this trip"
      loading={loading && !!selectedTripId}
    >
      <style>{KF}</style>
      {viewSp && (
        <SponsorViewModal sponsor={viewSp} onClose={() => setViewSp(null)} />
      )}
      {previewImg && (
        <ImagePreviewModal src={previewImg} onClose={() => setPreviewImg(null)} />
      )}

      {selectedTripId && (
        <>
          {/* ── Total — royal hero banner ── */}
          {items.length > 0 && (
            <div className="sp-royal-glow mb-4 relative rounded-3xl overflow-hidden border border-amber-400/30"
              style={{ background: "linear-gradient(145deg,#150f2e,#1c1440,#150f2e)" }}>
              <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,transparent,#f59e0b,#a78bfa,#f59e0b,transparent)" }} />
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 15% 0%,rgba(245,158,11,0.16) 0%,transparent 55%), radial-gradient(ellipse at 85% 100%,rgba(139,92,246,0.22) 0%,transparent 55%)" }} />
              <Sparkles />
              <div className="px-5 py-5 flex items-center justify-between gap-4 relative">
                <div>
                  <p className="text-xs font-bold text-amber-300 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-1.5">
                    <span className="sp-crown-float inline-block">👑</span> Total Sponsor Fund
                  </p>
                  <p className="sp-shimmer-text text-4xl font-black tracking-tight" style={{ filter: "drop-shadow(0 0 18px rgba(245,158,11,0.35))" }}>
                    {fmt(totalSponsor)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    {items.length} sponsor{items.length !== 1 ? "s" : ""} contributing to this trip
                  </p>
                </div>
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <div className="sp-halo-spin absolute w-full h-full rounded-full" style={{ top: "50%", left: "50%", background: "conic-gradient(from 0deg,#f59e0b,#a78bfa,transparent,#f59e0b)", opacity: 0.5, filter: "blur(2px)" }} />
                  <div className="relative w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                    style={{ background: "rgba(139,92,246,0.18)", border: "1px solid rgba(245,158,11,0.4)", boxShadow: "0 0 24px rgba(245,158,11,0.25)" }}>🏢</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Sponsor list ── */}
          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-4xl mb-3">🏢</p>
              <p className="text-sm font-medium">No sponsors yet</p>
              <p className="text-xs text-slate-600 mt-1">
                Sponsor information will appear here once added by the admin.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {[...items]
                .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
                .map((sp, i) => {
                  const isTop = i < 3 && Number(sp.amount) > 0;
                  const ringBg = isTop ? RANK_RING[i] : "linear-gradient(135deg,#a78bfa,#7c3aed)";
                  return (
                    <li key={sp._id}
                      className="sp-card-in relative rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5"
                      style={{
                        animationDelay: `${Math.min(i, 8) * 70}ms`,
                        background: isTop ? "linear-gradient(135deg,rgba(245,158,11,0.08),rgba(30,27,58,0.9))" : "rgba(15,23,42,0.6)",
                        borderColor: isTop ? "rgba(245,158,11,0.35)" : "rgba(51,65,85,1)",
                        boxShadow: isTop ? "0 0 24px rgba(245,158,11,0.12)" : "none",
                      }}
                    >
                      <div className="px-4 pt-3.5 pb-3">
                        {/* Top row — ranked avatar + name/notes (left) + View icon (top-right) */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => sp.imageUrl && setPreviewImg(sp.imageUrl)}
                              title={sp.imageUrl ? "View sponsor image" : sp.sponsorName}
                              className={`shrink-0 relative w-12 h-12 rounded-full p-[2px] transition-transform hover:scale-105 ${sp.imageUrl ? "cursor-zoom-in" : "cursor-default"}`}
                              style={{ background: ringBg, boxShadow: isTop ? "0 0 16px rgba(245,158,11,0.45)" : "0 0 10px rgba(139,92,246,0.25)" }}
                            >
                              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                                {sp.imageUrl ? (
                                  <ZoomableImage src={sp.imageUrl} alt={sp.sponsorName} className="w-full h-full object-cover" disabled />
                                ) : (
                                  <span className="text-lg">🏢</span>
                                )}
                              </div>
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-200 truncate">{sp.sponsorName}</p>
                              {sp.notes && (
                                <p className="text-xs text-slate-500 mt-0.5 truncate">{sp.notes}</p>
                              )}
                            </div>
                          </div>

                          {/* View icon — top-right corner */}
                          <button type="button" onClick={() => setViewSp(sp)} title="View sponsor"
                            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-violet-300 hover:border-violet-700/50 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                          </button>
                        </div>

                        {/* Big golden animated amount — under name/notes */}
                        <div className="mt-3 pl-[60px]">
                          <p className="sp-shimmer-text text-lg font-black tracking-tight" style={{ filter: "drop-shadow(0 0 14px rgba(245,158,11,0.4))" }}>
                            {fmt(sp.amount)}
                          </p>
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
