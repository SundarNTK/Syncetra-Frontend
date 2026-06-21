import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTrip } from "../../../context/TripContext";
import { TripModuleShell } from "../../../components/trip/TripSelector";
import { getSponsors, addSponsor, updateSponsor, deleteSponsor } from "../../../services/trips";
import { useActionPopup } from "../../../hooks/useActionPopup";
import { useDeleteConfirm } from "../../../hooks/useDeleteConfirm";
import { useAppSelector } from "../../../hooks";
import { useOnlineReload } from "../../../hooks/useOnlineReload";
import { ROLES } from "../../../constants/enum";
import ZoomableImage from "../../../components/ui/ZoomableImage";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const inputCls =
  "w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-violet-500/60 focus:outline-none transition-colors";

/* ─── Keyframes (injected once) ─────────────────────────────────────────────── */
const KF = `
@keyframes backdropIn   { from{backdrop-filter:blur(0px);background:rgba(0,0,0,0)} to{backdrop-filter:blur(14px);background:rgba(0,0,0,0.9)} }
@keyframes cardEntrance { 0%{transform:scale(0.05) rotate(-18deg);opacity:0} 35%{transform:scale(1.09) rotate(4deg);opacity:1} 58%{transform:scale(0.95) rotate(-2deg)} 76%{transform:scale(1.03) rotate(1deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
@keyframes spinIn       { 0%{transform:rotate(-200deg) scale(0);opacity:0} 65%{transform:rotate(15deg) scale(1.12);opacity:1} 82%{transform:rotate(-5deg) scale(0.97)} 100%{transform:rotate(0deg) scale(1);opacity:1} }
@keyframes floatBob     { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-10px)} }
@keyframes slideUp      { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes progressFill { from{width:100%} to{width:0%} }
@keyframes shimmer      { 0%{background-position:200% center} 100%{background-position:-200% center} }
@keyframes glowPulse    { 0%,100%{opacity:0.6} 50%{opacity:1} }
@keyframes countUp      { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }
.sp-card-enter { animation: cardEntrance 0.85s cubic-bezier(0.22,1.2,0.36,1) both; }
.sp-spin-in    { animation: spinIn 0.75s cubic-bezier(0.34,1.4,0.64,1) 0.55s both; }
.sp-float-bob  { animation: floatBob 3.2s ease-in-out 1.3s infinite; }
.sp-slide-1    { animation: slideUp 0.45s ease-out 0.7s  both; }
.sp-slide-2    { animation: slideUp 0.45s ease-out 0.85s both; }
.sp-slide-3    { animation: slideUp 0.45s ease-out 1.0s  both; }
.sp-slide-4    { animation: slideUp 0.45s ease-out 1.15s both; }
`;

/* ─── Coin particles ─────────────────────────────────────────────────────────── */
function CoinParticles({ active }) {
  const canvasRef = useRef(null);
  const raf = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const coins = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 4 + 2,
      r: Math.random() * 10 + 5,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.15,
      color: ["#f59e0b","#fde68a","#fbbf24","#a78bfa","#c4b5fd"][Math.floor(Math.random() * 5)],
      life: 1,
      decay: Math.random() * 0.005 + 0.003,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const c of coins) {
        c.x += c.vx; c.y += c.vy; c.vy += 0.08;
        c.rot += c.rotV; c.life -= c.decay;
        if (c.life <= 0) continue;
        ctx.save();
        ctx.globalAlpha = Math.min(1, c.life * 2);
        ctx.translate(c.x, c.y); ctx.rotate(c.rot);
        ctx.fillStyle = c.color; ctx.shadowColor = c.color; ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(0, 0, c.r, c.r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (coins.some(c => c.life > 0)) raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [active]);
  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 55 }} />;
}

/* ─── SponsorSuccessPopup ────────────────────────────────────────────────────── */
function SponsorSuccessPopup({ sponsor, mode, onClose }) {
  const [coinsActive, setCoinsActive] = useState(false);
  const [closing, setClosing] = useState(false);
  const AUTO = 8000;

  useEffect(() => {
    const t1 = setTimeout(() => setCoinsActive(true), 900);
    const t2 = setTimeout(() => handleClose(), AUTO);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 340);
  }, [closing, onClose]);

  const isEdit = mode === "edit";

  return createPortal(
    <>
      <style>{KF}</style>
      <CoinParticles active={coinsActive} />
      <div
        className="fixed inset-0 flex items-center justify-center px-4 overflow-y-auto"
        style={{ zIndex: 50, animation: "backdropIn 0.4s ease forwards", opacity: closing ? 0 : 1, transition: "opacity 0.34s ease" }}
        onClick={handleClose}
      >
        <div
          className="sp-card-enter relative w-full max-w-sm rounded-3xl overflow-hidden my-auto"
          style={{
            background: "linear-gradient(145deg,#0d0a1f,#130d2e,#0f0a1e)",
            border: "1px solid rgba(167,139,250,0.45)",
            boxShadow: "0 0 80px rgba(139,92,246,0.35),0 0 160px rgba(139,92,246,0.12),0 40px 100px rgba(0,0,0,0.7)",
            opacity: closing ? 0 : 1,
            transform: closing ? "scale(0.9)" : undefined,
            transition: "opacity 0.34s ease,transform 0.34s ease",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Accent line */}
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,transparent,#a78bfa,#f59e0b,#a78bfa,transparent)" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(139,92,246,0.22) 0%,transparent 60%)" }} />

          <div className="p-7 relative">
            <button onClick={handleClose} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors">×</button>

            {/* Title shimmer */}
            <div className="text-center mb-5">
              <p className="text-2xl font-black uppercase tracking-[0.18em]" style={{
                background: "linear-gradient(90deg,#f59e0b,#fde68a,#a78bfa,#f59e0b,#fde68a)",
                backgroundSize: "300% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 2.4s linear infinite",
                filter: "drop-shadow(0 0 14px rgba(245,158,11,0.5))",
              }}>
                {isEdit ? "UPDATED! ✏️" : "SPONSORED! 🏆"}
              </p>
            </div>

            {/* Icon / Image */}
            <div className="flex justify-center mb-5">
              {sponsor.imageUrl ? (
                <img
                  src={sponsor.imageUrl}
                  alt={sponsor.sponsorName}
                  className="sp-spin-in sp-float-bob w-24 h-24 rounded-2xl object-contain border-2"
                  style={{ borderColor: "rgba(167,139,250,0.6)", boxShadow: "0 0 40px rgba(139,92,246,0.5),0 0 80px rgba(139,92,246,0.2)" }}
                />
              ) : (
                <div
                  className="sp-spin-in sp-float-bob w-24 h-24 rounded-2xl flex items-center justify-center text-5xl"
                  style={{ background: "rgba(139,92,246,0.12)", border: "2px solid rgba(167,139,250,0.4)", boxShadow: "0 0 40px rgba(139,92,246,0.35)" }}
                >
                  🏢
                </div>
              )}
            </div>

            {/* Sponsor name */}
            <div className="sp-slide-1 text-center mb-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                {isEdit ? "Sponsor Updated" : "New Sponsor"}
              </p>
              <p className="text-lg font-bold text-white">{sponsor.sponsorName}</p>
            </div>

            {/* Amount badge */}
            <div className="sp-slide-2 flex justify-center mb-5">
              <div className="px-6 py-3 rounded-2xl text-center"
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.4)", boxShadow: "0 0 24px rgba(245,158,11,0.2)" }}>
                <p className="text-[10px] text-amber-500/70 uppercase tracking-widest mb-1">Contribution</p>
                <p className="text-2xl font-black" style={{ color: "#fbbf24", textShadow: "0 0 20px rgba(245,158,11,0.6)", animation: "countUp 0.55s cubic-bezier(0.34,1.4,0.64,1) 0.9s both" }}>
                  {fmt(sponsor.amount)}
                </p>
              </div>
            </div>

            {sponsor.notes && (
              <div className="sp-slide-3 text-center mb-4">
                <p className="text-xs text-slate-400 italic">"{sponsor.notes}"</p>
              </div>
            )}

            {/* Auto-dismiss bar */}
            <div className="bg-slate-800/80 rounded-full h-1 overflow-hidden mb-4">
              <div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#a78bfa,#f59e0b)", animation: `progressFill ${AUTO}ms linear forwards`, width: "100%" }} />
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(167,139,250,0.35)", color: "#c4b5fd" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.28)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.15)"; }}
            >
              {isEdit ? "Changes Saved! 🎉" : "Awesome, Thanks! 🎉"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

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

/* ─── ImageField ─────────────────────────────────────────────────────────────── */
function ImageField({ value, onChange, onPreview }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    try { onChange(await compressImage(await toBase64(file))); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
          <button type="button" onClick={() => onPreview?.(value)}
            className="w-full flex items-center justify-center p-3 min-h-[100px] max-h-[220px] cursor-zoom-in hover:bg-slate-900/40 transition-colors">
            <ZoomableImage src={value} alt="Sponsor" className="max-w-full max-h-[200px] w-auto h-auto object-contain rounded-md shadow-lg" />
          </button>
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-slate-800 bg-slate-900/90">
            <span className="text-[10px] text-slate-500 truncate">Image attached</span>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={() => inputRef.current?.click()}
                className="text-[10px] px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors">Replace</button>
              <button type="button" onClick={() => onChange("")}
                className="text-[10px] px-2 py-1 rounded-md bg-red-950/50 border border-red-800/50 text-red-400 hover:bg-red-900/40 transition-colors">Remove</button>
            </div>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-600 hover:border-violet-500/60 text-slate-400 hover:text-violet-400 text-xs transition-colors disabled:opacity-50">
          {busy ? "Processing…" : "🖼️ Attach Sponsor Image / Logo (optional)"}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}

/* ─── ImagePreviewModal ──────────────────────────────────────────────────────── */
function ImagePreviewModal({ src, onClose }) {
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = src; a.download = "sponsor-image.jpg";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <ZoomableImage src={src} alt="Sponsor" className="w-full rounded-2xl shadow-2xl border border-slate-700" />
        <div className="absolute top-2 right-2 flex gap-2">
          <button type="button" onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/70 hover:bg-violet-700/90 text-white text-xs font-medium transition-colors backdrop-blur-sm">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
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

/* ─── SponsorViewModal ───────────────────────────────────────────────────────── */
function SponsorViewModal({ sponsor, onClose, onEdit }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const [previewImg, setPreviewImg] = useState(null);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-8" onClick={onClose}>
      <div className="bg-slate-900 border border-violet-700/40 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 0 40px rgba(139,92,246,0.15)" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Accent */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,transparent,#a78bfa,#f59e0b,#a78bfa,transparent)" }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏢</span>
            <p className="font-bold text-white">Sponsor Details</p>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Image */}
          {sponsor.imageUrl && (
            <div className="flex justify-center">
              <button type="button" onClick={() => setPreviewImg(sponsor.imageUrl)}
                className="relative rounded-2xl overflow-hidden border-2 cursor-zoom-in hover:opacity-90 transition-opacity"
                style={{ borderColor: "rgba(167,139,250,0.5)", boxShadow: "0 0 24px rgba(139,92,246,0.3)" }}>
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

          {/* Amount glow */}
          <div className="rounded-xl p-4 text-center"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)" }}>
            <p className="text-[10px] text-amber-500/70 uppercase tracking-widest mb-1">Contribution Amount</p>
            <p className="text-3xl font-black" style={{ color: "#fbbf24", textShadow: "0 0 16px rgba(245,158,11,0.5)" }}>
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

        <div className="px-5 pb-5 flex gap-3">
          {onEdit && (
            <button onClick={onEdit}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Sponsor
            </button>
          )}
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors">
            Close
          </button>
        </div>
      </div>

      {previewImg && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 backdrop-blur-sm px-4" onClick={() => setPreviewImg(null)}>
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <ZoomableImage src={previewImg} alt="Sponsor" className="w-full rounded-2xl shadow-2xl border border-slate-700" />
            <button onClick={() => setPreviewImg(null)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600/80 transition-colors">×</button>
          </div>
        </div>,
        document.body
      )}
    </div>,
    document.body
  );
}

/* ─── EditModal ──────────────────────────────────────────────────────────────── */
function EditModal({ sponsor, tripId, onClose, onSaved, onPreview }) {
  const [form, setForm] = useState({
    sponsorName: sponsor.sponsorName || "",
    amount:      sponsor.amount      || "",
    notes:       sponsor.notes       || "",
    imageUrl:    sponsor.imageUrl    || "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.sponsorName.trim()) { setError("Sponsor name is required."); return; }
    if (!form.amount)              { setError("Amount is required."); return; }
    setSaving(true); setError("");
    try {
      await updateSponsor(tripId, sponsor._id, { ...form, amount: Number(form.amount), imageUrl: form.imageUrl || undefined });
      onSaved({ ...sponsor, ...form, amount: Number(form.amount) });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update sponsor.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70 backdrop-blur-sm px-4 py-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-auto">
        <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-400" />
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <p className="font-bold text-white">Edit Sponsor</p>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors">×</button>
        </div>
        <div className="p-5 space-y-3">
          {error && <div className="px-4 py-3 rounded-xl bg-red-950/50 border border-red-800/50"><p className="text-red-400 text-sm">{error}</p></div>}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Sponsor Name <span className="text-red-400">*</span></label>
            <input value={form.sponsorName} onChange={(e) => set("sponsorName", e.target.value)} className={inputCls} placeholder="e.g. ABC Company" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Sponsor Amount (₹) <span className="text-red-400">*</span></label>
            <input type="number" min="0" value={form.amount} onChange={(e) => set("amount", e.target.value)} className={inputCls} placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Notes</label>
            <input value={form.notes} onChange={(e) => set("notes", e.target.value)} className={inputCls} placeholder="Optional notes" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Sponsor Image / Logo</label>
            <ImageField value={form.imageUrl} onChange={(v) => set("imageUrl", v)} onPreview={onPreview} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold text-sm transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── AdminSponsors ──────────────────────────────────────────────────────────── */
export default function AdminSponsors() {
  const { selectedTripId } = useTrip();
  const { popup, showSuccess, showError } = useActionPopup("sponsors");
  const { confirmDelete, deleteModal } = useDeleteConfirm();
  const { userInfo } = useAppSelector((s) => s.user);
  const isSuperAdmin = userInfo?.user?.role === ROLES.SUPER_ADMIN;

  const [items,        setItems]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [editSp,       setEditSp]       = useState(null);
  const [viewSp,       setViewSp]       = useState(null);
  const [previewImg,   setPreviewImg]   = useState(null);
  const [successPopup, setSuccessPopup] = useState(null); // { sponsor, mode }
  const [form, setForm] = useState({ sponsorName: "", amount: "", notes: "", imageUrl: "" });
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    if (!selectedTripId) return;
    setLoading(true);
    try {
      const res = await getSponsors(selectedTripId);
      if (res !== null) setItems(res?.data || []);
    } finally {
      setLoading(false);
    }
  }, [selectedTripId]);

  useEffect(() => { load(); }, [load]);
  useOnlineReload(load);

  const totalSponsor = items.reduce((s, sp) => s + (Number(sp.amount) || 0), 0);

  const handleAdd = async (ev) => {
    ev.preventDefault();
    setFormError("");
    if (!form.sponsorName.trim()) { setFormError("Sponsor name is required."); return; }
    if (!form.amount)              { setFormError("Amount is required."); return; }
    setSaving(true);
    try {
      const res = await addSponsor(selectedTripId, { ...form, amount: Number(form.amount), imageUrl: form.imageUrl || undefined });
      const created = res?.data || { ...form, amount: Number(form.amount) };
      setForm({ sponsorName: "", amount: "", notes: "", imageUrl: "" });
      load();
      setSuccessPopup({ sponsor: created, mode: "add" });
    } catch (err) {
      showError(err.message || "Failed to add sponsor.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (sp) => {
    confirmDelete({
      title: "Delete Sponsor",
      recordLabel: `${sp.sponsorName} — ${fmt(sp.amount)}`,
      onConfirm: async () => {
        try {
          await deleteSponsor(selectedTripId, sp._id);
          load();
          showSuccess("Sponsor deleted.");
        } catch (e) {
          showError(e.message || "Delete failed.");
        }
      },
    });
  };

  return (
    <TripModuleShell title="Sponsors" description="Manage trip sponsors and additional funding" loading={loading && !!selectedTripId}>
      <style>{KF}</style>
      {popup}
      {deleteModal}

      {editSp && (
        <EditModal
          sponsor={editSp}
          tripId={selectedTripId}
          onClose={() => setEditSp(null)}
          onSaved={(updated) => {
            setEditSp(null);
            load();
            setSuccessPopup({ sponsor: updated, mode: "edit" });
          }}
          onPreview={setPreviewImg}
        />
      )}
      {viewSp && (
        <SponsorViewModal
          sponsor={viewSp}
          onClose={() => setViewSp(null)}
          onEdit={() => { setViewSp(null); setEditSp(viewSp); }}
        />
      )}
      {previewImg && <ImagePreviewModal src={previewImg} onClose={() => setPreviewImg(null)} />}
      {successPopup && (
        <SponsorSuccessPopup
          sponsor={successPopup.sponsor}
          mode={successPopup.mode}
          onClose={() => setSuccessPopup(null)}
        />
      )}

      {selectedTripId && (
        <>
          {/* ── Sponsor total glow box ── */}
          {items.length > 0 && (
            <div className="mb-4 relative rounded-2xl overflow-hidden border border-violet-500/40 bg-slate-900/80 shadow-[0_0_32px_rgba(139,92,246,0.18)]">
              <div className="absolute inset-0 pointer-events-none rounded-2xl"
                style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(139,92,246,0.12) 0%,transparent 70%)" }} />
              <div className="px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-1">🏢 Total Sponsor Fund</p>
                  <p className="text-3xl font-black" style={{ background: "linear-gradient(90deg,#a78bfa,#c4b5fd,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {fmt(totalSponsor)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">{items.length} sponsor{items.length !== 1 ? "s" : ""} contributing</p>
                </div>
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0"
                  style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}>🏢</div>
              </div>
            </div>
          )}

          {/* ── Add form ── */}
          <form onSubmit={handleAdd} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 mb-4">
            <p className="text-xs text-slate-400 font-medium">Add Sponsor</p>
            {formError && (
              <div className="px-3 py-2 rounded-lg bg-red-950/50 border border-red-800/50">
                <p className="text-red-400 text-xs">{formError}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input placeholder="Sponsor Name *" value={form.sponsorName} onChange={(e) => setForm({ ...form, sponsorName: e.target.value })} className={inputCls} required />
              <input type="number" placeholder="Amount *" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} required />
              <input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
            </div>
            <ImageField value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} onPreview={setPreviewImg} />
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              {saving && <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>}
              {saving ? "Adding…" : "Add Sponsor"}
            </button>
          </form>

          {/* ── Sponsor list ── */}
          {items.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <p className="text-3xl mb-2">🏢</p>
              <p className="text-sm">No sponsors added yet.</p>
              <p className="text-xs text-slate-600 mt-1">Add sponsors to track additional trip funding.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((sp) => (
                <li key={sp._id} className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 hover:border-violet-700/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl shrink-0">🏢</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-200">{sp.sponsorName}</p>
                      {sp.notes && <p className="text-xs text-slate-500 mt-0.5 leading-snug">{sp.notes}</p>}
                    </div>

                    {/* Image thumbnail */}
                    {sp.imageUrl && (
                      <button type="button" onClick={() => setPreviewImg(sp.imageUrl)} title="View sponsor image"
                        className="shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 hover:border-violet-500/60 transition-colors relative group flex items-center justify-center">
                        <ZoomableImage src={sp.imageUrl} alt="sponsor" className="max-w-full max-h-full object-contain p-0.5" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </div>
                      </button>
                    )}

                    <p className="font-bold text-violet-400 font-mono shrink-0">{fmt(sp.amount)}</p>

                    {/* View */}
                    <button type="button" onClick={() => setViewSp(sp)}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-violet-300 hover:border-violet-700/50 text-xs font-medium transition-colors">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      View
                    </button>

                    {/* Edit */}
                    <button type="button" onClick={() => setEditSp(sp)}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 text-xs font-medium transition-colors">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      Edit
                    </button>

                    {/* Delete */}
                    {isSuperAdmin && (
                      <button type="button" onClick={() => handleDelete(sp)}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/40 border border-red-800/50 text-red-400 hover:bg-red-900/60 hover:text-red-300 text-xs font-medium transition-colors">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                      </button>
                    )}
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
