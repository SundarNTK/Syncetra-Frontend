import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import ZoomableImage from "../ui/ZoomableImage";

/* ─── Shared hotel constants/helpers — used by admin + member Hotel pages ────── */
export const BED_TYPE_LABEL = { single: "Single", double: "Double", twin: "Twin", queen: "Queen", king: "King", bunk: "Bunk" };
export const MEALS = ["breakfast", "lunch", "dinner"];
export const MEAL_LABEL = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };
export const MEAL_ICON = { breakfast: "🍳", lunch: "🍛", dinner: "🍽️" };

export const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
export const fmtDateTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export const PAYMENT_STATUS = {
  not_paid:  { label: "Not Paid",          dot: "bg-red-500",     text: "text-red-300",     bg: "bg-red-500/15 border-red-700/40",     rgb: "239,68,68" },
  advance:   { label: "Advance Paid",      dot: "bg-amber-400",   text: "text-amber-300",   bg: "bg-amber-500/15 border-amber-700/40", rgb: "245,158,11" },
  completed: { label: "Payment Completed", dot: "bg-emerald-400", text: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-700/40", rgb: "16,185,129" },
};
export const getPaymentStatusKey = (h) => {
  if (h?.paymentCompleted) return "completed";
  if (h?.advancePaid) return "advance";
  return "not_paid";
};
export function PaymentStatusBadge({ hotel, className = "" }) {
  const s = PAYMENT_STATUS[getPaymentStatusKey(hotel)];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold whitespace-nowrap ${s.bg} ${s.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} shrink-0`} />
      {s.label}
    </span>
  );
}

export function GlowStat({ icon, label, value, color = "100,116,139" }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/70 border shrink-0"
      style={{ borderColor: `rgba(${color},0.35)`, boxShadow: `0 0 10px rgba(${color},0.12)` }}>
      <span className="text-xs leading-none shrink-0">{icon}</span>
      <div className="leading-tight">
        <p className="text-[9px] uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-xs font-bold text-slate-200">{value}</p>
      </div>
    </div>
  );
}

function DetailSection({ icon, title, children }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <span>{icon}</span>{title}
      </p>
      {children}
    </div>
  );
}

export const nightsBetween = (inAt, outAt) => {
  if (!inAt || !outAt) return 0;
  const diff = new Date(outAt) - new Date(inAt);
  if (diff <= 0) return 0;
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

/* ─── MediaFullscreenModal — full-view slider for hotel photos + videos ─────── */
function MediaFullscreenModal({ media, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const total = media.length;
  const item = media[idx];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((p) => (p - 1 + total) % total);
      if (e.key === "ArrowRight") setIdx((p) => (p + 1) % total);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total, onClose]);

  const goPrev = () => setIdx((p) => (p - 1 + total) % total);
  const goNext = () => setIdx((p) => (p + 1) % total);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = item.url;
    a.download = `hotel-${item.type}-${idx + 1}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return createPortal(
    <div className="fixed inset-0 z-[500] bg-black flex flex-col animate-lightbox-in" onClick={onClose}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className={`text-sm text-white/60 font-medium tabular-nums ${total <= 1 ? "invisible" : ""}`}>
          {idx + 1} / {total}
        </span>
        <button type="button" onClick={onClose}
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-red-500 text-white flex items-center justify-center transition-all text-2xl font-light leading-none">
          ×
        </button>
      </div>

      {/* Media area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden px-14 min-h-0" onClick={(e) => e.stopPropagation()}>
        {item.type === "video" ? (
          <video key={idx} src={item.url} controls autoPlay className="max-w-full max-h-full object-contain animate-fade-in" />
        ) : (
          <ZoomableImage key={idx} src={item.url} alt="" className="max-w-full max-h-full object-contain select-none animate-fade-in" />
        )}

        {total > 1 && (
          <>
            <button type="button" onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white text-3xl flex items-center justify-center transition-colors">
              ‹
            </button>
            <button type="button" onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white text-3xl flex items-center justify-center transition-colors">
              ›
            </button>
          </>
        )}
      </div>

      {/* Dot nav */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-2 pt-3 pb-1 shrink-0 flex-wrap px-4" onClick={(e) => e.stopPropagation()}>
          {media.map((m, i) => (
            <button key={i} type="button" onClick={() => setIdx(i)}
              title={m.type === "video" ? "Video" : "Photo"}
              className={`rounded-full transition-all flex items-center justify-center ${i === idx ? "bg-white w-5 h-2" : "bg-white/30 hover:bg-white/60 w-2 h-2"}`} />
          ))}
        </div>
      )}

      {/* Bottom action bar */}
      <div className="shrink-0 flex items-center justify-center gap-3 px-4 pb-8 pt-4" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={handleDownload}
          className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-sm transition-all shadow-xl shadow-emerald-900/40 min-w-[150px] justify-center">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
        <button type="button" onClick={onClose}
          className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-red-600/70 hover:bg-red-600 active:scale-95 text-white font-semibold text-sm transition-all shadow-xl min-w-[120px] justify-center">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Close
        </button>
      </div>
    </div>,
    document.body
  );
}

/* ─── HotelDetailModal — shared read-only detail view (admin + member) ──────── */
export default function HotelDetailModal({ hotel, onClose }) {
  const media = [
    ...(hotel.images || []).map((url) => ({ type: "image", url })),
    ...(hotel.videos || []).map((url) => ({ type: "video", url })),
  ];
  const [idx, setIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const current = media[idx];

  const nights = nightsBetween(hotel.checkInAt, hotel.checkOutAt);
  const totalCost = (Number(hotel.perDayCost) || 0) * nights;
  const balanceDue = totalCost - (Number(hotel.advanceAmount) || 0);
  const statusStyle = PAYMENT_STATUS[getPaymentStatusKey(hotel)];

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !fullscreen) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, fullscreen]);

  const goPrev = () => setIdx((p) => (p - 1 + media.length) % media.length);
  const goNext = () => setIdx((p) => (p + 1) % media.length);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center bg-black/75 backdrop-blur-sm px-2 sm:px-4 py-4 sm:py-6 overflow-y-auto" onClick={onClose}>
      {fullscreen && (
        <MediaFullscreenModal media={media} startIndex={idx} onClose={() => setFullscreen(false)} />
      )}

      <div className="animate-modal-pop bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95vh]"
        style={{ boxShadow: `0 30px 90px rgba(0,0,0,.7), 0 0 60px rgba(${statusStyle.rgb},0.1)` }}
        onClick={(e) => e.stopPropagation()}>
        <div className="h-1 shrink-0" style={{ background: `linear-gradient(90deg, rgba(${statusStyle.rgb},0.9), rgba(${statusStyle.rgb},0.4))` }} />

        <div className="flex flex-col lg:flex-row min-h-0 flex-1">
          {/* ── Media column ── */}
          <div className="lg:w-[42%] shrink-0 lg:border-r border-slate-800 flex flex-col">
            {media.length > 0 ? (
              <div className="relative shrink-0 group">
                <div className="w-full h-56 sm:h-64 lg:h-80 bg-slate-950 flex items-center justify-center overflow-hidden">
                  {current.type === "video" ? (
                    <video key={idx} src={current.url} controls className="max-w-full max-h-full object-contain" />
                  ) : (
                    <ZoomableImage src={current.url} alt="" className="max-w-full max-h-full object-contain select-none" />
                  )}
                </div>

                {/* Fullscreen toggle */}
                <button type="button" onClick={() => setFullscreen(true)} title="View full screen"
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>

                {/* Prev / next arrows */}
                {media.length > 1 && (
                  <>
                    <button type="button" onClick={goPrev} title="Previous"
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors text-lg">
                      ‹
                    </button>
                    <button type="button" onClick={goNext} title="Next"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors text-lg">
                      ›
                    </button>
                  </>
                )}

                {/* Media type badge */}
                {current.type === "video" && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold uppercase tracking-wide">▶ Video</span>
                )}

                {media.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {media.map((m, i) => (
                      <button key={i} type="button" onClick={() => setIdx(i)}
                        className={`rounded-full transition-all ${i === idx ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"}`} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-40 lg:h-64 bg-slate-800 flex items-center justify-center text-4xl shrink-0">🏨</div>
            )}

            {media.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3 border-t border-slate-800/60">
                {media.map((m, i) => (
                  <button key={i} type="button" onClick={() => setIdx(i)}
                    className={`relative w-16 h-12 rounded-lg overflow-hidden border shrink-0 transition-colors ${i === idx ? "border-emerald-500" : "border-slate-700 hover:border-slate-600"}`}>
                    {m.type === "video" ? (
                      <>
                        <video src={m.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs">▶</div>
                      </>
                    ) : (
                      <img src={m.url} alt="" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Details column ── */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            <div className="flex items-start justify-between gap-3 px-4 sm:px-6 pt-5 pb-3 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-white text-lg sm:text-xl truncate">{hotel.hotelName}</h3>
                  <PaymentStatusBadge hotel={hotel} />
                </div>
                {hotel.locationName && (
                  <p className="text-sm text-slate-400 mt-1 break-words">
                    📍 {hotel.locationName}
                    {hotel.mapLink && (
                      <a href={hotel.mapLink} target="_blank" rel="noreferrer" className="ml-2 text-emerald-400 hover:underline whitespace-nowrap">Map ↗</a>
                    )}
                  </p>
                )}
              </div>
              <button type="button" onClick={onClose}
                className="shrink-0 w-8 h-8 rounded-full bg-slate-800 hover:bg-red-700/80 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-lg">×</button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-6 pb-6 space-y-5">
              <div className="flex flex-wrap gap-2">
                <GlowStat icon="🛏️" label="Rooms" value={hotel.roomsCount || 1} color="59,130,246" />
                <GlowStat icon="🛌" label="Bed Type" value={`${hotel.bedsCount || 1} · ${BED_TYPE_LABEL[hotel.bedType] || hotel.bedType}`} color="139,92,246" />
                <GlowStat icon="🌙" label="Nights" value={nights || "—"} color="6,182,212" />
              </div>

              <DetailSection icon="💰" title="Stay & Cost">
                <div className="grid grid-cols-2 gap-3 bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
                  <div><p className="text-[9px] text-slate-500 uppercase tracking-wide">Check-in</p><p className="text-xs text-slate-200 font-medium mt-0.5">{fmtDateTime(hotel.checkInAt)}</p></div>
                  <div><p className="text-[9px] text-slate-500 uppercase tracking-wide">Check-out</p><p className="text-xs text-slate-200 font-medium mt-0.5">{fmtDateTime(hotel.checkOutAt)}</p></div>
                  <div><p className="text-[9px] text-slate-500 uppercase tracking-wide">Per Day Cost</p><p className="text-xs text-slate-200 font-medium mt-0.5">{fmt(hotel.perDayCost)}</p></div>
                  <div><p className="text-[9px] text-slate-500 uppercase tracking-wide">Advance Paid</p><p className="text-xs text-amber-400 font-bold mt-0.5">{fmt(hotel.advanceAmount)}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="rounded-xl p-3 border border-emerald-700/30 bg-emerald-500/10" style={{ boxShadow: "0 0 14px rgba(16,185,129,0.14)" }}>
                    <p className="text-[9px] text-emerald-400/80 uppercase tracking-wide">Total Cost</p>
                    <p className="text-sm font-black text-emerald-400 mt-0.5">{fmt(totalCost)}</p>
                  </div>
                  <div className="rounded-xl p-3 border border-red-700/30 bg-red-500/10" style={{ boxShadow: "0 0 14px rgba(239,68,68,0.12)" }}>
                    <p className="text-[9px] text-red-400/80 uppercase tracking-wide">Balance Due</p>
                    <p className="text-sm font-black text-red-400 mt-0.5">{fmt(Math.max(0, balanceDue))}</p>
                  </div>
                </div>
              </DetailSection>

              {hotel.complimentary?.length > 0 && (
                <DetailSection icon="🎁" title="Complimentary">
                  <div className="flex flex-wrap gap-2">
                    {hotel.complimentary.map((c, i) => (
                      <span key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-800/60 border border-slate-700 text-xs text-slate-300">
                        {c.imageUrl && <img src={c.imageUrl} alt="" className="w-5 h-5 rounded-full object-cover" />}
                        {c.name}
                      </span>
                    ))}
                  </div>
                </DetailSection>
              )}

              {MEALS.some((m) => hotel.foodDetails?.[m]?.available) && (
                <DetailSection icon="🍽️" title="Food Details">
                  <div className="space-y-2">
                    {MEALS.filter((m) => hotel.foodDetails?.[m]?.available).map((m) => {
                      const meal = hotel.foodDetails[m];
                      return (
                        <div key={m} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
                          <p className="text-xs font-medium text-slate-200">{MEAL_ICON[m]} {MEAL_LABEL[m]} — <span className="text-emerald-400 font-bold">{fmt(meal.perPersonCost)}</span> / person</p>
                          {meal.menu?.length > 0 && <p className="text-[11px] text-slate-400 mt-1">{meal.menu.join(", ")}</p>}
                        </div>
                      );
                    })}
                  </div>
                </DetailSection>
              )}

              {hotel.notes && (
                <DetailSection icon="📝" title="More Details">
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">{hotel.notes}</p>
                </DetailSection>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
