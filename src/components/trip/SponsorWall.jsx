import ZoomableImage from "../ui/ZoomableImage";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const KF = `
@keyframes swFadeUp    { from{opacity:0;transform:translateY(14px) scale(0.92)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes swHaloSpin  { from{transform:translate(-50%,-50%) rotate(0deg)} to{transform:translate(-50%,-50%) rotate(360deg)} }
@keyframes swShimmer   { 0%{background-position:200% center} 100%{background-position:-200% center} }
.sw-chip-in   { animation: swFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
.sw-halo-spin { animation: swHaloSpin 6s linear infinite; }
.sw-shimmer-text {
  background: linear-gradient(90deg,#fde68a,#f59e0b,#fde68a);
  background-size: 250% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: swShimmer 3s linear infinite;
}
`;

const RING = [
  "linear-gradient(135deg,#fde68a,#f59e0b,#fbbf24)",
  "linear-gradient(135deg,#e5e7eb,#9ca3af,#d1d5db)",
  "linear-gradient(135deg,#f0c294,#c2703d,#e0a872)",
];

/* ─── SponsorWall — grand animated "Sponsors" strip showing name + image ────────── */
export default function SponsorWall({ sponsors = [], onPreview }) {
  const ranked = [...sponsors].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
  if (ranked.length === 0) return null;

  return (
    <div className="mt-3">
      <style>{KF}</style>
      <p className="text-[10px] font-semibold text-amber-300/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <span>🏆</span> Sponsors
      </p>
      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "thin" }}>
        {ranked.map((sp, i) => {
          const isTop = i < 3 && Number(sp.amount) > 0;
          const ringBg = isTop ? RING[i] : "linear-gradient(135deg,#a78bfa,#7c3aed)";
          return (
            <button
              type="button"
              key={sp._id || sp.sponsorName}
              onClick={() => sp.imageUrl && onPreview?.(sp.imageUrl)}
              title={`${sp.sponsorName} — ${fmt(sp.amount)}`}
              className="sw-chip-in shrink-0 flex flex-col items-center gap-1.5 w-[76px] group rounded-2xl px-2 py-2.5 border transition-all duration-300 hover:-translate-y-0.5"
              style={{
                animationDelay: `${Math.min(i, 10) * 60}ms`,
                background: isTop ? "linear-gradient(160deg,rgba(245,158,11,0.1),rgba(30,27,58,0.7))" : "rgba(15,23,42,0.55)",
                borderColor: isTop ? "rgba(245,158,11,0.3)" : "rgba(51,65,85,0.8)",
              }}
            >
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="sw-halo-spin absolute w-[52px] h-[52px] rounded-full" style={{ top: "50%", left: "50%", background: `conic-gradient(from 0deg, ${isTop ? "#f59e0b,#fde68a,transparent,#f59e0b" : "#a78bfa,#7c3aed,transparent,#a78bfa"})`, opacity: 0.6, filter: "blur(1.5px)" }} />
                <div className="relative w-11 h-11 rounded-full p-[2px] transition-transform group-hover:scale-110" style={{ background: ringBg }}>
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                    {sp.imageUrl ? (
                      <ZoomableImage src={sp.imageUrl} alt={sp.sponsorName} className="w-full h-full object-cover" disabled />
                    ) : (
                      <span className="text-base">🏢</span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-200 font-semibold leading-tight text-center truncate w-full">
                {sp.sponsorName}
              </p>
              <p className={`text-[9px] font-bold leading-tight ${isTop ? "sw-shimmer-text" : "text-violet-400"}`}>
                {fmt(sp.amount)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
