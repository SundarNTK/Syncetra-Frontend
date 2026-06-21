import { createPortal } from "react-dom";
import { useState, useEffect, useCallback, useRef } from "react";

/* ─── Shared keyframes ───────────────────────────────────────────────────────── */
const KF = `
@keyframes backdropIn   { from { backdrop-filter:blur(0px);background:rgba(0,0,0,0); } to { backdrop-filter:blur(14px);background:rgba(0,0,0,0.9); } }
@keyframes cardEntrance { 0%{transform:scale(0.05) rotate(-18deg);opacity:0} 35%{transform:scale(1.09) rotate(4deg);opacity:1} 58%{transform:scale(0.95) rotate(-2deg)} 76%{transform:scale(1.03) rotate(1deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
@keyframes spinIn       { 0%{transform:rotate(-200deg) scale(0);opacity:0} 65%{transform:rotate(15deg) scale(1.12);opacity:1} 82%{transform:rotate(-5deg) scale(0.97)} 100%{transform:rotate(0deg) scale(1);opacity:1} }
@keyframes floatBob     { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-10px)} }
@keyframes slideUp      { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes progressFill { from{width:100%} to{width:0%} }
@keyframes shimmer      { 0%{background-position:200% center} 100%{background-position:-200% center} }
@keyframes glowPulse    { 0%,100%{opacity:0.6} 50%{opacity:1} }
@keyframes countUp      { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }
@keyframes ring         { 0%{stroke-dashoffset:251} 100%{stroke-dashoffset:0} }
@keyframes bounceIn     { 0%{transform:scale(0);opacity:0} 55%{transform:scale(1.18);opacity:1} 75%{transform:scale(0.92)} 100%{transform:scale(1);opacity:1} }
@keyframes fadeSlideUp  { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes electricPulse{ 0%,100%{box-shadow:0 0 20px #7c3aed,0 0 40px #7c3aed55} 50%{box-shadow:0 0 40px #a78bfa,0 0 80px #7c3aed44,0 0 120px #7c3aed22} }
@keyframes coinRain     { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(100px) rotate(360deg);opacity:0} }
@keyframes spark        { 0%{transform:translate(0,0) scale(1);opacity:1} 100%{transform:translate(var(--tx),var(--ty)) scale(0);opacity:0} }
.card-enter  { animation: cardEntrance 0.85s cubic-bezier(0.22,1.2,0.36,1) both; }
.spin-in     { animation: spinIn 0.75s cubic-bezier(0.34,1.4,0.64,1) 0.55s both; }
.float-bob   { animation: floatBob 3.2s ease-in-out infinite; }
.slide-1     { animation: slideUp 0.45s ease-out 0.7s  both; }
.slide-2     { animation: slideUp 0.45s ease-out 0.85s both; }
.slide-3     { animation: slideUp 0.45s ease-out 1.0s  both; }
.slide-4     { animation: slideUp 0.45s ease-out 1.15s both; }
.bounce-in   { animation: bounceIn 0.6s cubic-bezier(0.34,1.4,0.64,1) 0.3s both; }
`;

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/* ════════════════════════════════════════════════════════════════════════════════
   VARIANT 1 — "Corporate Glory"  (Violet + Gold)
   Confetti coins, spin-in building icon, gold shimmer title
   ════════════════════════════════════════════════════════════════════════════════ */
function CoinParticles({ active }) {
  const canvasRef = useRef(null);
  const raf = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const coins = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 4 + 2,
      r: Math.random() * 10 + 5,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.15,
      color: ["#f59e0b","#fde68a","#fbbf24","#a78bfa","#c4b5fd"][Math.floor(Math.random()*5)],
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
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillStyle = c.color;
        ctx.shadowColor = c.color; ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(0, 0, c.r, c.r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (coins.some((c) => c.life > 0)) raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [active]);
  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 55 }} />;
}

function Variant1({ data, onClose }) {
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
          className="card-enter relative w-full max-w-sm rounded-3xl overflow-hidden my-auto"
          style={{
            background: "linear-gradient(145deg,#0d0a1f,#130d2e,#0f0a1e)",
            border: "1px solid rgba(167,139,250,0.45)",
            boxShadow: "0 0 80px rgba(139,92,246,0.35),0 0 160px rgba(139,92,246,0.12),0 40px 100px rgba(0,0,0,0.7)",
            opacity: closing ? 0 : 1, transform: closing ? "scale(0.9)" : undefined, transition: "opacity 0.34s ease,transform 0.34s ease",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top violet → gold accent line */}
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,transparent,#a78bfa,#f59e0b,#a78bfa,transparent)" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(139,92,246,0.22) 0%,transparent 60%)" }} />

          <div className="p-7 relative">
            <button onClick={handleClose} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors">×</button>

            {/* Title */}
            <div className="text-center mb-4">
              <p className="text-2xl font-black uppercase tracking-[0.18em]" style={{
                background: "linear-gradient(90deg,#f59e0b,#fde68a,#a78bfa,#f59e0b,#fde68a)",
                backgroundSize: "300% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                animation: "shimmer 2.4s linear infinite",
                filter: "drop-shadow(0 0 14px rgba(245,158,11,0.5))",
              }}>
                SPONSORED! 🏆
              </p>
            </div>

            {/* Icon */}
            <div className="flex justify-center mb-5">
              {data.imageUrl ? (
                <img src={data.imageUrl} alt={data.sponsorName}
                  className="spin-in w-24 h-24 rounded-2xl object-contain border-2"
                  style={{ borderColor: "rgba(167,139,250,0.6)", boxShadow: "0 0 40px rgba(139,92,246,0.5),0 0 80px rgba(139,92,246,0.2)" }} />
              ) : (
                <div className="spin-in float-bob w-24 h-24 rounded-2xl flex items-center justify-center text-5xl"
                  style={{ background: "rgba(139,92,246,0.12)", border: "2px solid rgba(167,139,250,0.4)", boxShadow: "0 0 40px rgba(139,92,246,0.35)", animation: "spinIn 0.75s cubic-bezier(0.34,1.4,0.64,1) 0.55s both,floatBob 3.2s ease-in-out 1.3s infinite" }}>
                  🏢
                </div>
              )}
            </div>

            {/* Sponsor name */}
            <div className="slide-1 text-center mb-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Sponsor</p>
              <p className="text-lg font-bold text-white">{data.sponsorName}</p>
            </div>

            {/* Amount */}
            <div className="slide-2 flex justify-center mb-5">
              <div className="px-6 py-3 rounded-2xl text-center" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.4)", boxShadow: "0 0 24px rgba(245,158,11,0.2)" }}>
                <p className="text-[10px] text-amber-500/70 uppercase tracking-widest mb-1">Contribution</p>
                <p className="text-2xl font-black" style={{ color: "#fbbf24", textShadow: "0 0 20px rgba(245,158,11,0.6)" }}>{fmt(data.amount)}</p>
              </div>
            </div>

            {data.notes && (
              <div className="slide-3 text-center mb-4">
                <p className="text-xs text-slate-400 italic">"{data.notes}"</p>
              </div>
            )}

            {/* Progress bar */}
            <div className="bg-slate-800/80 rounded-full h-1 overflow-hidden mb-4">
              <div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#a78bfa,#f59e0b)", animation: `progressFill ${AUTO}ms linear forwards`, width: "100%" }} />
            </div>

            <button onClick={handleClose} className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(167,139,250,0.35)", color: "#c4b5fd" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.28)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.15)"; }}>
              Awesome, Thanks! 🎉
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ════════════════════════════════════════════════════════════════════════════════
   VARIANT 2 — "Money Vault"  (Deep Purple + Emerald checkmark)
   Circular SVG ring, amount count-up, bouncing money bag
   ════════════════════════════════════════════════════════════════════════════════ */
function ProgressRing({ pct, glow }) {
  const R = 40, C = 2 * Math.PI * R;
  return (
    <svg width="96" height="96" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="48" cy="48" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <circle cx="48" cy="48" r={R} fill="none"
        stroke={`rgb(${glow})`}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C * (1 - pct / 100)}
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.34,1.4,0.64,1) 0.6s", filter: `drop-shadow(0 0 6px rgba(${glow},0.8))` }}
      />
    </svg>
  );
}

function Variant2({ data, onClose }) {
  const [closing, setClosing] = useState(false);
  const [ringPct, setRingPct] = useState(0);
  const AUTO = 8000;
  useEffect(() => {
    const t1 = setTimeout(() => setRingPct(100), 200);
    const t2 = setTimeout(() => handleClose(), AUTO);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  const handleClose = useCallback(() => {
    if (closing) return; setClosing(true); setTimeout(onClose, 340);
  }, [closing, onClose]);

  const GLOW = "16,185,129";

  return createPortal(
    <>
      <style>{KF}</style>
      <div className="fixed inset-0 flex items-center justify-center px-4 overflow-y-auto"
        style={{ zIndex: 50, animation: "backdropIn 0.4s ease forwards", opacity: closing ? 0 : 1, transition: "opacity 0.34s ease" }}
        onClick={handleClose}>
        <div className="card-enter relative w-full max-w-sm rounded-3xl overflow-hidden my-auto"
          style={{
            background: "linear-gradient(145deg,#050e0a,#071410,#040c09)",
            border: "1px solid rgba(16,185,129,0.4)",
            boxShadow: "0 0 80px rgba(16,185,129,0.25),0 0 160px rgba(16,185,129,0.08),0 40px 100px rgba(0,0,0,0.7)",
            opacity: closing ? 0 : 1, transform: closing ? "scale(0.9)" : undefined, transition: "opacity 0.34s ease,transform 0.34s ease",
          }}
          onClick={(e) => e.stopPropagation()}>
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,transparent,#10b981,#a78bfa,#10b981,transparent)" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(16,185,129,0.14) 0%,transparent 60%)" }} />

          <div className="p-7 relative">
            <button onClick={handleClose} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors">×</button>

            {/* Ring + icon center */}
            <div className="flex justify-center mb-4 relative">
              <div className="relative w-24 h-24">
                <ProgressRing pct={ringPct} glow={GLOW} />
                <div className="absolute inset-0 flex items-center justify-center">
                  {data.imageUrl ? (
                    <img src={data.imageUrl} alt="" className="w-14 h-14 rounded-xl object-contain bounce-in" />
                  ) : (
                    <span className="bounce-in text-4xl inline-block">💰</span>
                  )}
                </div>
              </div>
            </div>

            {/* Headline */}
            <div className="slide-1 text-center mb-1">
              <p className="text-xl font-black text-white">Fund Received</p>
            </div>
            <div className="slide-1 text-center mb-5">
              <p className="text-[10px] text-emerald-500/70 uppercase tracking-widest">into the trip treasury</p>
            </div>

            {/* Amount big */}
            <div className="slide-2 text-center mb-3">
              <p className="text-4xl font-black" style={{ color: "#34d399", textShadow: "0 0 28px rgba(16,185,129,0.7)", animation: "countUp 0.6s cubic-bezier(0.34,1.4,0.64,1) 0.9s both" }}>
                {fmt(data.amount)}
              </p>
            </div>

            {/* Sponsor name badge */}
            <div className="slide-3 flex justify-center mb-5">
              <span className="px-4 py-1.5 rounded-full text-sm font-semibold" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", color: "#6ee7b7" }}>
                🏢 {data.sponsorName}
              </span>
            </div>

            {data.notes && (
              <div className="slide-4 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 mb-4 text-center">
                <p className="text-xs text-slate-400">"{data.notes}"</p>
              </div>
            )}

            <div className="bg-slate-800/80 rounded-full h-1 overflow-hidden mb-4">
              <div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#10b981,#a78bfa)", animation: `progressFill ${AUTO}ms linear forwards`, width: "100%" }} />
            </div>

            <button onClick={handleClose} className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "rgba(16,185,129,0.13)", border: "1px solid rgba(16,185,129,0.35)", color: "#6ee7b7" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.25)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.13)"; }}>
              Got It! 💸
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ════════════════════════════════════════════════════════════════════════════════
   VARIANT 3 — "Power Boost"  (Electric Violet + Spark burst)
   Spark particles, amount bar boost, electric pulse glow
   ════════════════════════════════════════════════════════════════════════════════ */
function SparkBurst({ active }) {
  const canvasRef = useRef(null);
  const raf = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const cx = canvas.width / 2, cy = canvas.height * 0.42;
    const sparks = Array.from({ length: 80 }, (_, i) => {
      const angle = (i / 80) * Math.PI * 2;
      const speed = Math.random() * 16 + 8;
      return { x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 4,
        color: ["#a78bfa","#7c3aed","#c4b5fd","#f59e0b","#fde68a"][i % 5],
        size: Math.random() * 4 + 1.5, life: 1, decay: Math.random() * 0.02 + 0.012 };
    });
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of sparks) {
        s.x += s.vx; s.y += s.vy; s.vy += 0.15; s.life -= s.decay;
        if (s.life <= 0) continue;
        ctx.save();
        ctx.globalAlpha = Math.min(1, s.life * 1.8);
        ctx.fillStyle = s.color; ctx.shadowColor = s.color; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      if (sparks.some(s => s.life > 0)) raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [active]);
  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 55 }} />;
}

function Variant3({ data, onClose }) {
  const [sparkActive, setSparkActive] = useState(false);
  const [closing, setClosing] = useState(false);
  const [barW, setBarW] = useState(0);
  const AUTO = 8000;
  useEffect(() => {
    const t1 = setTimeout(() => setSparkActive(true), 600);
    const t2 = setTimeout(() => setBarW(100), 800);
    const t3 = setTimeout(() => handleClose(), AUTO);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);
  const handleClose = useCallback(() => {
    if (closing) return; setClosing(true); setTimeout(onClose, 340);
  }, [closing, onClose]);

  return createPortal(
    <>
      <style>{KF}</style>
      <SparkBurst active={sparkActive} />
      <div className="fixed inset-0 flex items-center justify-center px-4 overflow-y-auto"
        style={{ zIndex: 50, animation: "backdropIn 0.4s ease forwards", opacity: closing ? 0 : 1, transition: "opacity 0.34s ease" }}
        onClick={handleClose}>
        <div className="card-enter relative w-full max-w-sm rounded-3xl overflow-hidden my-auto"
          style={{
            background: "linear-gradient(145deg,#0c0618,#120c25,#0a0415)",
            border: "1px solid rgba(124,58,237,0.5)",
            boxShadow: "0 0 80px rgba(124,58,237,0.4),0 0 160px rgba(124,58,237,0.15),0 40px 100px rgba(0,0,0,0.7)",
            opacity: closing ? 0 : 1, transform: closing ? "scale(0.9)" : undefined, transition: "opacity 0.34s ease,transform 0.34s ease",
            animation: closing ? undefined : "electricPulse 2s ease-in-out 1.2s infinite",
          }}
          onClick={(e) => e.stopPropagation()}>
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,transparent,#7c3aed,#c4b5fd,#7c3aed,transparent)" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(124,58,237,0.25) 0%,transparent 65%)" }} />

          <div className="p-7 relative">
            <button onClick={handleClose} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors">×</button>

            {/* Electric bolt icon */}
            <div className="flex justify-center mb-2">
              {data.imageUrl ? (
                <img src={data.imageUrl} alt="" className="spin-in float-bob w-20 h-20 rounded-2xl object-contain border-2"
                  style={{ borderColor: "rgba(167,139,250,0.5)", boxShadow: "0 0 36px rgba(124,58,237,0.6)" }} />
              ) : (
                <span className="spin-in float-bob text-6xl inline-block" style={{ filter: "drop-shadow(0 0 30px rgba(124,58,237,0.9))" }}>⚡</span>
              )}
            </div>

            {/* Title */}
            <div className="slide-1 text-center mb-1">
              <p className="text-2xl font-black uppercase tracking-[0.15em]" style={{
                background: "linear-gradient(90deg,#a78bfa,#c4b5fd,#7c3aed,#a78bfa,#c4b5fd)",
                backgroundSize: "300% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                animation: "shimmer 2s linear infinite", filter: "drop-shadow(0 0 10px rgba(167,139,250,0.6))",
              }}>FUND BOOSTED</p>
            </div>
            <div className="slide-1 text-center mb-5">
              <p className="text-[10px] text-violet-400/60 uppercase tracking-widest">Sponsor power activated</p>
            </div>

            {/* Amount */}
            <div className="slide-2 text-center mb-4">
              <p className="text-4xl font-black" style={{ color: "#c4b5fd", textShadow: "0 0 30px rgba(167,139,250,0.8)", animation: "countUp 0.55s cubic-bezier(0.34,1.4,0.64,1) 0.85s both" }}>
                {fmt(data.amount)}
              </p>
            </div>

            {/* Boost bar */}
            <div className="slide-3 mb-4 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wide">
                <span>Sponsor Boost</span>
                <span className="text-violet-400">{fmt(data.amount)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-[1400ms] ease-out"
                  style={{ width: `${barW}%`, background: "linear-gradient(90deg,#7c3aed,#a78bfa,#f59e0b)" }} />
              </div>
            </div>

            {/* Sponsor badge */}
            <div className="slide-4 flex justify-center mb-5">
              <span className="px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2"
                style={{ background: "rgba(124,58,237,0.14)", border: "1px solid rgba(167,139,250,0.35)", color: "#c4b5fd" }}>
                🏢 {data.sponsorName}
              </span>
            </div>

            <div className="bg-slate-800/80 rounded-full h-1 overflow-hidden mb-4">
              <div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#7c3aed,#a78bfa)", animation: `progressFill ${AUTO}ms linear forwards`, width: "100%" }} />
            </div>

            <button onClick={handleClose} className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(167,139,250,0.35)", color: "#c4b5fd" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.15)"; }}>
              Keep Going! ⚡
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ════════════════════════════════════════════════════════════════════════════════
   Preview Page
   ════════════════════════════════════════════════════════════════════════════════ */
const SAMPLE = { sponsorName: "Netkathir Technologies", amount: 10000, notes: "Office contribution for annual trip", imageUrl: "" };

const VARIANTS = [
  {
    id: 1,
    name: "Corporate Glory",
    desc: "Violet + Gold · Coin rain · Shimmer title · Float icon",
    tag: "🏆 Premium",
    colors: "from-violet-600 to-amber-500",
    Component: Variant1,
  },
  {
    id: 2,
    name: "Money Vault",
    desc: "Emerald ring · SVG progress ring · Count-up amount",
    tag: "💰 Clean",
    colors: "from-emerald-600 to-violet-500",
    Component: Variant2,
  },
  {
    id: 3,
    name: "Power Boost",
    desc: "Electric violet · Spark burst · Boost bar animation",
    tag: "⚡ Electric",
    colors: "from-violet-700 to-purple-400",
    Component: Variant3,
  },
];

export default function SponsorPopupVariants() {
  const [active, setActive] = useState(null);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <style>{KF}</style>

      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <p className="text-xs text-violet-400 uppercase tracking-widest mb-2">Sponsor Master</p>
          <h1 className="text-2xl font-black text-white mb-1">Success Popup Styles</h1>
          <p className="text-sm text-slate-400">Click any style to preview the animated popup — pick your favourite</p>
        </div>

        <div className="space-y-4">
          {VARIANTS.map((v) => (
            <div key={v.id}
              className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-violet-600/50 transition-all cursor-pointer"
              onClick={() => setActive(v.id)}>
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(139,92,246,0.08) 0%,transparent 70%)" }} />
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{v.tag}</span>
                    <h2 className="text-base font-bold text-white">{v.name}</h2>
                  </div>
                  <p className="text-xs text-slate-500">{v.desc}</p>
                </div>
                <button
                  className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r ${v.colors} text-white shadow-lg transition-transform group-hover:scale-105`}
                  onClick={(e) => { e.stopPropagation(); setActive(v.id); }}>
                  Preview
                </button>
              </div>

              {/* Mini colour swatch */}
              <div className="mt-3 h-1 rounded-full" style={{ background: `linear-gradient(90deg,${v.colors.includes("violet-600") && v.colors.includes("amber") ? "#7c3aed,#f59e0b" : v.colors.includes("emerald") ? "#10b981,#7c3aed" : "#6d28d9,#a78bfa"})` }} />
            </div>
          ))}
        </div>

        <div className="mt-8 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-500">Tell me which style you want — I'll wire it into the Sponsor Master immediately.</p>
          <p className="text-xs text-slate-600 mt-1">Route: <span className="text-slate-400">#/sponsor-popup-variants</span></p>
        </div>
      </div>

      {/* Active popup */}
      {active !== null && (() => {
        const V = VARIANTS.find(v => v.id === active);
        return V ? <V.Component data={SAMPLE} onClose={() => setActive(null)} /> : null;
      })()}
    </div>
  );
}
