import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getSponsors } from "../../../services/trips";
import { useOnlineReload } from "../../../hooks/useOnlineReload";
import ZoomableImage from "../../../components/ui/ZoomableImage";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

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
        className="bg-slate-900 border border-violet-700/40 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 0 40px rgba(139,92,246,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent stripe */}
        <div className="h-1 w-full"
          style={{ background: "linear-gradient(90deg,transparent,#a78bfa,#f59e0b,#a78bfa,transparent)" }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏢</span>
            <p className="font-bold text-white">Sponsor Details</p>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors">
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Image */}
          {sponsor.imageUrl && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setPreviewImg(sponsor.imageUrl)}
                className="relative rounded-2xl overflow-hidden border-2 cursor-zoom-in hover:opacity-90 transition-opacity"
                style={{ borderColor: "rgba(167,139,250,0.5)", boxShadow: "0 0 24px rgba(139,92,246,0.3)" }}
              >
                <ZoomableImage src={sponsor.imageUrl} alt={sponsor.sponsorName}
                  className="w-32 h-32 object-contain p-1" />
              </button>
            </div>
          )}

          {/* Name */}
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Sponsor</p>
            <p className="text-xl font-bold text-white">{sponsor.sponsorName}</p>
          </div>

          {/* Amount glow card */}
          <div className="rounded-xl p-4 text-center"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)" }}>
            <p className="text-[10px] text-amber-500/70 uppercase tracking-widest mb-1">Contribution Amount</p>
            <p className="text-3xl font-black"
              style={{ color: "#fbbf24", textShadow: "0 0 16px rgba(245,158,11,0.5)" }}>
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
      {viewSp && (
        <SponsorViewModal sponsor={viewSp} onClose={() => setViewSp(null)} />
      )}
      {previewImg && (
        <ImagePreviewModal src={previewImg} onClose={() => setPreviewImg(null)} />
      )}

      {selectedTripId && (
        <>
          {/* ── Total glow box ── */}
          {items.length > 0 && (
            <div className="mb-4 relative rounded-2xl overflow-hidden border border-violet-500/40 bg-slate-900/80"
              style={{ boxShadow: "0 0 32px rgba(139,92,246,0.18)" }}>
              <div className="absolute inset-0 pointer-events-none rounded-2xl"
                style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(139,92,246,0.12) 0%,transparent 70%)" }} />
              <div className="px-5 py-4 flex items-center justify-between gap-4 relative">
                <div>
                  <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-1">
                    🏢 Total Sponsor Fund
                  </p>
                  <p className="text-3xl font-black"
                    style={{
                      background: "linear-gradient(90deg,#a78bfa,#c4b5fd,#8b5cf6)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}>
                    {fmt(totalSponsor)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {items.length} sponsor{items.length !== 1 ? "s" : ""} contributing to this trip
                  </p>
                </div>
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0"
                  style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}>
                  🏢
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
              {items.map((sp) => (
                <li key={sp._id}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden hover:border-violet-700/40 transition-colors">
                  <div className="px-4 py-3 flex items-center gap-3">
                    {/* Logo / icon */}
                    {sp.imageUrl ? (
                      <button type="button" onClick={() => setPreviewImg(sp.imageUrl)}
                        className="shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 hover:border-violet-500/60 transition-colors relative group flex items-center justify-center">
                        <ZoomableImage src={sp.imageUrl} alt={sp.sponsorName}
                          className="max-w-full max-h-full object-contain p-0.5" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </div>
                      </button>
                    ) : (
                      <div className="shrink-0 w-12 h-12 rounded-xl border border-slate-700 bg-slate-800 flex items-center justify-center text-xl">
                        🏢
                      </div>
                    )}

                    {/* Name + notes */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-200">{sp.sponsorName}</p>
                      {sp.notes && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{sp.notes}</p>
                      )}
                    </div>

                    {/* Amount */}
                    <p className="font-bold text-violet-400 font-mono shrink-0 text-sm">
                      {fmt(sp.amount)}
                    </p>

                    {/* View button */}
                    <button type="button" onClick={() => setViewSp(sp)}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-violet-300 hover:border-violet-700/50 text-xs font-medium transition-colors">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                      View
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </TripModuleShell>
  );
}
