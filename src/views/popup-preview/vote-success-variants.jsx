import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

/* ─── Shared keyframes ─────────────────────────────────────────────────────── */
const KF = `
@keyframes vsBackdrop   { from{opacity:0} to{opacity:1} }
@keyframes vsCardPop    { 0%{transform:scale(0.6) translateY(30px);opacity:0} 60%{transform:scale(1.05) translateY(-4px);opacity:1} 80%{transform:scale(0.97)} 100%{transform:scale(1) translateY(0);opacity:1} }
@keyframes vsBarDrain   { from{width:100%} to{width:0%} }
@keyframes vsTrophy     { 0%{transform:scale(0) rotate(-25deg);opacity:0} 60%{transform:scale(1.2) rotate(5deg);opacity:1} 80%{transform:scale(0.93) rotate(-2deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
@keyframes vsGoldShimmer{ from{background-position:0% center} to{background-position:200% center} }
@keyframes vsCoinFall   { 0%{transform:translateY(-10px) rotateX(0deg);opacity:1} 100%{transform:translateY(200px) rotateX(720deg);opacity:0} }
@keyframes vsScanLine   { 0%{top:-2px;opacity:1} 80%{opacity:1} 100%{top:100%;opacity:0} }
@keyframes vsHexPop     { 0%{transform:scale(0) rotate(-45deg);opacity:0} 70%{transform:scale(1.15) rotate(6deg);opacity:1} 100%{transform:scale(1) rotate(0deg);opacity:1} }
@keyframes vsCheckDraw  { from{stroke-dashoffset:40} to{stroke-dashoffset:0} }
@keyframes vsBlinkCursor{ 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes vsOrbit      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes vsStarPop    { 0%{transform:scale(0) translateY(20px);opacity:0} 70%{transform:scale(1.1);opacity:1} 100%{transform:scale(1);opacity:1} }
@keyframes vsPowerEntry { 0%{transform:scale(0);opacity:0} 55%{transform:scale(1.18);opacity:1} 75%{transform:scale(0.9)} 100%{transform:scale(1);opacity:1} }
@keyframes vsRingExpand { 0%{transform:scale(0.2);opacity:0.7} 100%{transform:scale(2.2);opacity:0} }
@keyframes vsLightning  { 0%{opacity:0.3;filter:brightness(0.7)} 50%{opacity:1;filter:brightness(1.4)} 100%{opacity:0.8;filter:brightness(1)} }
@keyframes vsFadeSlide  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes vsNeonPulse  { 0%,100%{text-shadow:0 0 10px #10b981,0 0 20px #10b98188} 50%{text-shadow:0 0 20px #10b981,0 0 40px #10b98188,0 0 60px #10b98144} }
@keyframes vsVioletPulse{ 0%,100%{box-shadow:0 0 20px #a855f7,0 0 40px #a855f755} 50%{box-shadow:0 0 40px #d946ef,0 0 80px #a855f744,0 0 120px #a855f722} }
`;

/* ══════════════════════════════════════════════════════════════════════════════
   DESIGN 1 — "THE CHAMPION"
   Gold trophy · coin rain · shimmer title · amber progress bar
   ══════════════════════════════════════════════════════════════════════════════ */

function GoldCoinCanvas({ active }) {
  const ref = useRef(null);
  const raf = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const W = canvas.width, H = canvas.height;
    const GOLDS = ["#f59e0b", "#fbbf24", "#fde047", "#d97706", "#fcd34d", "#fef08a"];
    const coins = Array.from({ length: 70 }, () => ({
      x: Math.random() * W,
      y: Math.random() * -H,
      vx: (Math.random() - 0.5) * 2.5,
      vy: Math.random() * 2.5 + 1.5,
      rx: Math.random() * 10 + 5,
      ry: 0,
      angle: Math.random() * Math.PI * 2,
      rotSpd: (Math.random() - 0.5) * 0.15,
      col: GOLDS[Math.floor(Math.random() * GOLDS.length)],
      life: Math.random() * 0.5 + 0.5,
      decay: Math.random() * 0.004 + 0.002,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      coins.forEach(c => {
        c.x += c.vx; c.y += c.vy;
        c.angle += c.rotSpd;
        c.life -= c.decay;
        c.ry = Math.abs(Math.sin(c.angle)) * c.rx;
        if (c.y > H) { c.y = -20; c.x = Math.random() * W; c.life = Math.random() * 0.5 + 0.5; }
        if (c.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = c.life;
        ctx.fillStyle = c.col;
        ctx.strokeStyle = "#92400e";
        ctx.lineWidth = 0.5;
        ctx.translate(c.x, c.y);
        ctx.beginPath();
        ctx.ellipse(0, 0, c.rx, Math.max(c.ry, 1), 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.restore();
      });
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [active]);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

function ChampionPopup({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 5000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ animation: "vsBackdrop 0.35s ease both", background: "rgba(0,0,0,0.87)", backdropFilter: "blur(8px)" }}>
      {/* Radial gold aura */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div style={{ width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.18) 0%, rgba(217,119,6,0.06) 50%, transparent 70%)" }} />
      </div>
      <div className="relative w-full max-w-sm mx-4 overflow-hidden rounded-3xl"
        style={{ background: "linear-gradient(160deg,#1c1008 0%,#0f0a01 100%)", border: "1px solid rgba(245,158,11,0.35)", boxShadow: "0 0 60px rgba(245,158,11,0.18), 0 30px 80px rgba(0,0,0,0.7)", animation: "vsCardPop 0.65s cubic-bezier(0.22,1.2,0.36,1) both" }}>
        <GoldCoinCanvas active />
        {/* Gold top bar */}
        <div style={{ height: 3, background: "linear-gradient(90deg,transparent,#f59e0b,#fde047,#f59e0b,transparent)" }} />

        <div className="relative z-10 pt-8 pb-6 px-6 text-center space-y-1">
          {/* Trophy */}
          <div className="flex justify-center mb-2">
            <span className="text-7xl select-none" style={{ animation: "vsTrophy 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s both", filter: "drop-shadow(0 0 24px rgba(245,158,11,0.7))" }}>🏆</span>
          </div>
          {/* Label */}
          <p className="text-[10px] font-bold tracking-[0.35em] uppercase mb-1"
            style={{ color: "#d97706", animation: "vsFadeSlide 0.4s ease 0.5s both" }}>Champion Vote</p>
          {/* Title shimmer */}
          <h2 className="text-3xl font-black tracking-wider"
            style={{ background: "linear-gradient(90deg,#92400e,#f59e0b,#fde047,#fbbf24,#f59e0b,#92400e)", backgroundSize: "250% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "vsGoldShimmer 2.5s linear infinite", letterSpacing: "0.06em" }}>
            VOTED!
          </h2>
          <p className="text-amber-300/75 text-sm" style={{ animation: "vsFadeSlide 0.4s ease 0.7s both" }}>
            Your choice has been registered.
          </p>
          <p className="text-amber-500/50 text-xs" style={{ animation: "vsFadeSlide 0.4s ease 0.85s both" }}>
            Thank you for your participation!
          </p>
          {/* Gold progress drain bar */}
          <div className="pt-5">
            <div style={{ height: 3, background: "rgba(120,53,15,0.5)", borderRadius: 9999, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 9999, background: "linear-gradient(90deg,#78350f,#f59e0b,#fde047)", animation: "vsBarDrain 5s linear forwards" }} />
            </div>
          </div>
          <button onClick={onDone} className="mt-1 text-xs text-amber-600/50 hover:text-amber-400 transition-colors cursor-pointer">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   DESIGN 2 — "CYBER CONFIRM"
   Dark grid · neon hexagon · animated SVG checkmark · scan line · terminal feel
   ══════════════════════════════════════════════════════════════════════════════ */

function CyberPopup({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 5000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ animation: "vsBackdrop 0.3s ease both", background: "rgba(0,0,0,0.92)", backdropFilter: "blur(6px)" }}>
      {/* Green grid backdrop */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(16,185,129,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,0.06) 1px,transparent 1px)", backgroundSize: "32px 32px", opacity: 0.8 }} />
      {/* Glow center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div style={{ width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 65%)" }} />
      </div>

      <div className="relative w-full max-w-sm mx-4 overflow-hidden rounded-2xl text-center"
        style={{ background: "rgba(2,10,6,0.97)", border: "1px solid rgba(16,185,129,0.3)", boxShadow: "0 0 50px rgba(16,185,129,0.1), 0 0 100px rgba(16,185,129,0.05)", animation: "vsCardPop 0.55s cubic-bezier(0.22,1.2,0.36,1) both" }}>

        {/* Scan line sweeping top→bottom */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent 0%,rgba(16,185,129,0.6) 40%,rgba(52,211,153,0.9) 50%,rgba(16,185,129,0.6) 60%,transparent 100%)", animation: "vsScanLine 2.2s linear infinite" }} />
        </div>

        {/* Top accent line */}
        <div style={{ height: 2, background: "linear-gradient(90deg,transparent,#10b981,#34d399,#10b981,transparent)" }} />

        <div className="relative z-10 pt-8 pb-6 px-6 space-y-1">
          {/* Hexagon + animated checkmark */}
          <div className="flex justify-center mb-3">
            <div className="relative" style={{ animation: "vsHexPop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.15s both" }}>
              {/* Hex shape via clip-path */}
              <div style={{ width: 90, height: 90, clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)", background: "linear-gradient(145deg,rgba(16,185,129,0.2),rgba(5,46,22,0.9))", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="42" height="42" viewBox="0 0 28 28" fill="none">
                  <polyline points="5,14 11,20 23,8" stroke="#34d399" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
                    style={{ strokeDasharray: 40, strokeDashoffset: 40, animation: "vsCheckDraw 0.6s ease 0.6s forwards" }} />
                </svg>
              </div>
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" style={{ animationDuration: "2.5s" }} />
            </div>
          </div>

          <p className="text-[9px] font-mono tracking-[0.4em] uppercase" style={{ color: "rgba(16,185,129,0.5)", animation: "vsFadeSlide 0.4s ease 0.5s both" }}>
            SYSTEM RESPONSE
          </p>
          <h2 className="text-2xl font-black font-mono tracking-widest" style={{ color: "#10b981", animation: "vsNeonPulse 2s ease-in-out infinite, vsFadeSlide 0.4s ease 0.55s both" }}>
            CONFIRMED
          </h2>
          <div className="flex items-center justify-center gap-1.5 text-xs font-mono" style={{ color: "rgba(16,185,129,0.6)", animation: "vsFadeSlide 0.4s ease 0.7s both" }}>
            <span style={{ animation: "vsBlinkCursor 1s step-end infinite" }}>█</span>
            <span>Vote signal processed</span>
          </div>
          <p className="text-slate-600 text-xs font-mono" style={{ animation: "vsFadeSlide 0.4s ease 0.85s both" }}>
            TS :: {new Date().toLocaleTimeString()}
          </p>

          <div className="pt-4">
            <div style={{ height: 2, background: "rgba(16,185,129,0.08)", borderRadius: 9999, overflow: "hidden", position: "relative" }}>
              <div style={{ height: "100%", background: "linear-gradient(90deg,#064e3b,#10b981,#34d399)", borderRadius: 9999, animation: "vsBarDrain 5s linear forwards" }} />
            </div>
          </div>
          <button onClick={onDone} className="mt-1 text-xs font-mono transition-colors cursor-pointer" style={{ color: "rgba(16,185,129,0.4)" }}
            onMouseEnter={e => e.target.style.color = "#10b981"} onMouseLeave={e => e.target.style.color = "rgba(16,185,129,0.4)"}>
            [DISMISS]
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   DESIGN 3 — "GALACTIC VOTE"
   Deep space · twinkling stars canvas · shooting stars · orbiting ballot icon
   ══════════════════════════════════════════════════════════════════════════════ */

function StarCanvas({ active }) {
  const ref = useRef(null);
  const raf = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const stars = Array.from({ length: 130 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      alpha: Math.random(),
      speed: Math.random() * 0.025 + 0.008,
      phase: Math.random() * Math.PI * 2,
    }));
    const shots = [];
    let shotTick = 0, t = 0;
    const draw = () => {
      ctx.fillStyle = "rgba(2,6,23,0.18)";
      ctx.fillRect(0, 0, W, H);
      stars.forEach(s => {
        const a = 0.35 + 0.65 * Math.abs(Math.sin(t * s.speed + s.phase));
        ctx.save(); ctx.globalAlpha = a;
        ctx.fillStyle = "#c7d2fe";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      shotTick++;
      if (shotTick > 80 && shots.length < 4) {
        shots.push({ x: W * 0.05, y: Math.random() * H * 0.55, vx: 9 + Math.random() * 4, vy: 2 + Math.random() * 3, life: 1 });
        shotTick = 0;
      }
      shots.forEach(s => {
        ctx.save(); ctx.globalAlpha = s.life;
        const g = ctx.createLinearGradient(s.x - 80, s.y - 25, s.x, s.y);
        g.addColorStop(0, "transparent"); g.addColorStop(1, "#818cf8");
        ctx.strokeStyle = g; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(s.x - 80, s.y - 25); ctx.lineTo(s.x, s.y); ctx.stroke();
        ctx.restore();
        s.x += s.vx; s.y += s.vy; s.life -= 0.018;
      });
      shots.splice(0, shots.length, ...shots.filter(s => s.life > 0 && s.x < W + 100));
      t++;
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [active]);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

function GalacticPopup({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 5000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ animation: "vsBackdrop 0.4s ease both", background: "radial-gradient(ellipse at 50% 40%, #1e1b4b 0%, #020617 65%)" }}>
      <StarCanvas active />
      <div className="relative w-full max-w-sm mx-4 overflow-hidden rounded-3xl text-center"
        style={{ background: "rgba(7,8,30,0.82)", border: "1px solid rgba(99,102,241,0.28)", boxShadow: "0 0 70px rgba(99,102,241,0.12), 0 40px 100px rgba(0,0,0,0.7)", backdropFilter: "blur(20px)", animation: "vsCardPop 0.65s cubic-bezier(0.22,1.2,0.36,1) 0.1s both" }}>
        {/* Top accent */}
        <div style={{ height: 2, background: "linear-gradient(90deg,transparent,#6366f1,#a78bfa,#6366f1,transparent)" }} />
        <div className="relative z-10 pt-8 pb-6 px-6 space-y-1">
          {/* Orbit ring + ballot */}
          <div className="flex justify-center mb-3" style={{ animation: "vsStarPop 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.15s both" }}>
            <div className="relative" style={{ width: 90, height: 90 }}>
              {/* Outer orbit ring */}
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(99,102,241,0.35)", animation: "vsOrbit 6s linear infinite" }}>
                {/* Orbiting dot */}
                <div style={{ position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)", width: 8, height: 8, borderRadius: "50%", background: "#818cf8", boxShadow: "0 0 8px #818cf8" }} />
              </div>
              {/* Inner orbit */}
              <div style={{ position: "absolute", inset: 10, borderRadius: "50%", border: "1px solid rgba(167,139,250,0.2)", animation: "vsOrbit 4s linear infinite reverse" }}>
                <div style={{ position: "absolute", bottom: -3, left: "50%", transform: "translateX(-50%)", width: 5, height: 5, borderRadius: "50%", background: "#a78bfa", boxShadow: "0 0 6px #a78bfa" }} />
              </div>
              {/* Center icon */}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="text-4xl" style={{ filter: "drop-shadow(0 0 14px rgba(99,102,241,0.7))" }}>🗳️</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] tracking-[0.35em] uppercase font-semibold" style={{ color: "rgba(99,102,241,0.6)", animation: "vsFadeSlide 0.4s ease 0.5s both" }}>
            Signal Transmitted
          </p>
          <h2 className="text-2xl font-black" style={{ background: "linear-gradient(90deg,#6366f1,#a78bfa,#c4b5fd,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "vsFadeSlide 0.4s ease 0.6s both", letterSpacing: "0.04em" }}>
            VOTE CAPTURED
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(165,180,252,0.7)", animation: "vsFadeSlide 0.4s ease 0.75s both" }}>
            Your voice echoes across the cosmos.<br />
            <span style={{ color: "rgba(165,180,252,0.45)", fontSize: 11 }}>The universe has taken note.</span>
          </p>
          <div className="pt-5">
            <div style={{ height: 2, background: "rgba(49,46,129,0.5)", borderRadius: 9999, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 9999, background: "linear-gradient(90deg,#312e81,#6366f1,#c4b5fd)", animation: "vsBarDrain 5s linear forwards" }} />
            </div>
          </div>
          <button onClick={onDone} className="mt-1 text-xs transition-colors cursor-pointer" style={{ color: "rgba(99,102,241,0.45)" }}
            onMouseEnter={e => e.target.style.color = "#818cf8"} onMouseLeave={e => e.target.style.color = "rgba(99,102,241,0.45)"}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   DESIGN 4 — "POWER SURGE"
   Electric violet · diamond particle burst · expanding rings · lightning bolt
   ══════════════════════════════════════════════════════════════════════════════ */

function ElectricCanvas({ active }) {
  const ref = useRef(null);
  const raf = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const cx = W / 2, cy = H / 2;
    const COLS = ["#d946ef", "#a855f7", "#7c3aed", "#ec4899", "#c026d3", "#f0abfc", "#e879f9"];
    const sparks = Array.from({ length: 55 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 6 + 3;
      return { x: cx, y: cy, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, col: COLS[Math.floor(Math.random() * COLS.length)], sz: Math.random() * 5 + 3, life: 1, decay: Math.random() * 0.012 + 0.007 };
    });
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      let any = false;
      sparks.forEach(s => {
        if (s.life <= 0) return; any = true;
        s.x += s.vx; s.y += s.vy; s.vx *= 0.97; s.vy *= 0.97; s.life -= s.decay;
        ctx.save(); ctx.globalAlpha = s.life;
        ctx.fillStyle = s.col;
        ctx.translate(s.x, s.y); ctx.rotate(Math.PI / 4);
        ctx.fillRect(-s.sz / 2, -s.sz / 2, s.sz, s.sz);
        ctx.restore();
      });
      if (any) raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [active]);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

function PowerPopup({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 5000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ animation: "vsBackdrop 0.35s ease both", background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)" }}>
      {/* Violet aura */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div style={{ width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.16) 0%, rgba(120,36,172,0.05) 45%, transparent 70%)" }} />
      </div>

      <div className="relative w-full max-w-sm mx-4 overflow-hidden rounded-3xl text-center"
        style={{ background: "linear-gradient(160deg,#0f0515 0%,#05010a 100%)", border: "1px solid rgba(168,85,247,0.32)", boxShadow: "0 0 60px rgba(168,85,247,0.15), 0 30px 80px rgba(0,0,0,0.8)", animation: "vsCardPop 0.6s cubic-bezier(0.22,1.2,0.36,1) both" }}>
        <ElectricCanvas active />
        {/* Top accent */}
        <div style={{ height: 2, background: "linear-gradient(90deg,transparent,#a855f7,#f0abfc,#a855f7,transparent)" }} />

        <div className="relative z-10 pt-7 pb-6 px-6 space-y-1">
          {/* Lightning + rings */}
          <div className="flex justify-center mb-2">
            <div className="relative flex items-center justify-center" style={{ width: 96, height: 96, animation: "vsPowerEntry 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s both" }}>
              {/* Expanding rings */}
              {[0, 0.55, 1.1].map((delay, i) => (
                <div key={i} className="absolute rounded-full"
                  style={{ inset: 0, border: "1px solid rgba(168,85,247,0.4)", animation: `vsRingExpand 1.8s ${delay}s ease-out infinite` }} />
              ))}
              {/* Circle bg */}
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "radial-gradient(circle at 40% 40%, rgba(217,70,239,0.35), rgba(109,40,217,0.2))", display: "flex", alignItems: "center", justifyContent: "center", animation: "vsVioletPulse 2s ease-in-out infinite", position: "relative", zIndex: 2 }}>
                {/* Lightning SVG */}
                <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor"
                  style={{ color: "#f0abfc", filter: "drop-shadow(0 0 10px rgba(232,121,249,0.9))", animation: "vsLightning 1.5s ease-in-out infinite" }}>
                  <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
                </svg>
              </div>
            </div>
          </div>

          <p className="text-[10px] font-bold tracking-[0.35em] uppercase" style={{ color: "rgba(217,70,239,0.55)", animation: "vsFadeSlide 0.4s ease 0.5s both" }}>
            Impact Registered
          </p>
          <h2 className="text-2xl font-black tracking-wide" style={{ background: "linear-gradient(90deg,#c026d3,#a855f7,#f0abfc,#a855f7,#c026d3)", backgroundSize: "220% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "vsGoldShimmer 2.5s linear infinite, vsFadeSlide 0.4s ease 0.55s both" }}>
            VOTE REGISTERED!
          </h2>
          <p className="text-sm" style={{ color: "rgba(240,171,252,0.65)", animation: "vsFadeSlide 0.4s ease 0.7s both" }}>
            Your impact has been unleashed.
          </p>
          <p className="text-xs" style={{ color: "rgba(192,132,252,0.4)", animation: "vsFadeSlide 0.4s ease 0.85s both" }}>
            Thank you for your vote!
          </p>

          <div className="pt-5">
            <div style={{ height: 3, background: "rgba(88,28,135,0.35)", borderRadius: 9999, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 9999, background: "linear-gradient(90deg,#581c87,#a855f7,#f0abfc)", animation: "vsBarDrain 5s linear forwards" }} />
            </div>
          </div>
          <button onClick={onDone} className="mt-1 text-xs transition-colors cursor-pointer" style={{ color: "rgba(168,85,247,0.4)" }}
            onMouseEnter={e => e.target.style.color = "#c084fc"} onMouseLeave={e => e.target.style.color = "rgba(168,85,247,0.4)"}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PREVIEW PAGE
   ══════════════════════════════════════════════════════════════════════════════ */

const DESIGNS = [
  {
    id: 1,
    name: "The Champion",
    tag: "Warm · Celebratory",
    desc: "Golden trophy with animated coin rain. Rich amber gradient with shimmer text — feels exciting & prestigious.",
    emoji: "🏆",
    accent: "#f59e0b",
    bg: "radial-gradient(ellipse at 60% 0%, #1c1008 0%, #090601 100%)",
    border: "rgba(245,158,11,0.35)",
    component: ChampionPopup,
  },
  {
    id: 2,
    name: "Cyber Confirm",
    tag: "Tech · Precise",
    desc: "Neon hexagon with an animated SVG checkmark that draws in. Green grid, scan-line sweep & terminal timestamp.",
    emoji: "⬡",
    accent: "#10b981",
    bg: "radial-gradient(ellipse at 60% 0%, #021208 0%, #020617 100%)",
    border: "rgba(16,185,129,0.3)",
    component: CyberPopup,
  },
  {
    id: 3,
    name: "Galactic Vote",
    tag: "Epic · Cosmic",
    desc: "Deep space with twinkling stars & shooting stars canvas. Dual orbiting rings around a ballot icon — grand scale.",
    emoji: "🌌",
    accent: "#818cf8",
    bg: "radial-gradient(ellipse at 50% 0%, #1e1b4b 0%, #020617 100%)",
    border: "rgba(99,102,241,0.3)",
    component: GalacticPopup,
  },
  {
    id: 4,
    name: "Power Surge",
    tag: "Bold · Electric",
    desc: "Lightning bolt with diamond particle burst & 3 expanding sonar rings. Fuchsia-violet electric theme — high energy.",
    emoji: "⚡",
    accent: "#a855f7",
    bg: "radial-gradient(ellipse at 60% 0%, #180824 0%, #020617 100%)",
    border: "rgba(168,85,247,0.32)",
    component: PowerPopup,
  },
];

export default function VoteSuccessVariants() {
  const [active, setActive] = useState(null);
  const ActiveComp = active ? DESIGNS.find(d => d.id === active)?.component : null;

  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "#f1f5f9", fontFamily: "system-ui,sans-serif" }}>
      <style>{KF}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(100,116,139,0.8)", marginBottom: 8 }}>
            Preview · Vote Confirmation
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#f8fafc", lineHeight: 1.2, marginBottom: 8 }}>
            Vote Success Popup — Design Samples
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.5 }}>
            Click <strong style={{ color: "#94a3b8" }}>▶ Play Demo</strong> on any card to preview the full animated popup.
            Choose your favourite and let me know!
          </p>
        </div>

        {/* 2×2 grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(380px,1fr))", gap: 18 }}>
          {DESIGNS.map((d, i) => (
            <div key={d.id} style={{ background: d.bg, border: `1px solid ${d.border}`, borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {/* Preview hero */}
              <div style={{ height: 130, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, position: "relative", borderBottom: `1px solid ${d.border}`, padding: "0 24px" }}>
                {/* Accent glow */}
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, ${d.accent}15 0%, transparent 65%)`, pointerEvents: "none" }} />
                <span style={{ fontSize: 52, filter: `drop-shadow(0 0 18px ${d.accent}88)`, position: "relative", zIndex: 1 }}>{d.emoji}</span>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: `${d.accent}99`, marginBottom: 4 }}>{d.tag}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "#f8fafc", letterSpacing: "0.02em" }}>{d.name}</p>
                  <p style={{ fontSize: 11, color: "rgba(148,163,184,0.5)", marginTop: 3 }}>Design {String(i + 1).padStart(2, "0")}</p>
                </div>
              </div>
              {/* Description + button */}
              <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
                <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, flex: 1 }}>{d.desc}</p>
                <button
                  onClick={() => setActive(d.id)}
                  style={{ width: "100%", padding: "11px 0", borderRadius: 12, background: `linear-gradient(135deg,${d.accent}22,${d.accent}0a)`, border: `1px solid ${d.border}`, color: d.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.target.style.background = `${d.accent}22`; e.target.style.boxShadow = `0 0 20px ${d.accent}22`; }}
                  onMouseLeave={e => { e.target.style.background = `linear-gradient(135deg,${d.accent}22,${d.accent}0a)`; e.target.style.boxShadow = "none"; }}
                >
                  ▶ Play Demo
                </button>
              </div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#334155", marginTop: 40 }}>
          Each popup auto-dismisses after 5 seconds · Progress bar shows time remaining
        </p>
      </div>

      {ActiveComp && createPortal(
        <ActiveComp onDone={() => setActive(null)} />,
        document.body
      )}
    </div>
  );
}
