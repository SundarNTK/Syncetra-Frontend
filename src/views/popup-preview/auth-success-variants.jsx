import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* ─── Shared keyframes ──────────────────────────────────────────────────────── */
const KF = `
@keyframes as-backdrop   { from{opacity:0} to{opacity:1} }
@keyframes as-card-pop   { 0%{transform:scale(0.55) translateY(40px);opacity:0} 60%{transform:scale(1.04) translateY(-5px);opacity:1} 80%{transform:scale(0.97)} 100%{transform:scale(1) translateY(0);opacity:1} }
@keyframes as-fade-up    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes as-bar-drain  { from{width:100%} to{width:0%} }
@keyframes as-spin       { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes as-pulse-ring { 0%{transform:scale(0.6);opacity:0.8} 100%{transform:scale(2.6);opacity:0} }
@keyframes as-float      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

/* ── Design 1: Cosmic Gate ── */
@keyframes cg-portal     { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.08);opacity:1} 80%{transform:scale(0.96)} 100%{transform:scale(1);opacity:1} }
@keyframes cg-rocket-up  { 0%{transform:translateY(0) rotate(-45deg);opacity:1} 100%{transform:translateY(-80px) rotate(-45deg);opacity:0} }
@keyframes cg-shimmer    { from{background-position:0% center} to{background-position:300% center} }
@keyframes cg-orbit-a    { from{transform:rotate(0deg) translateX(54px)} to{transform:rotate(360deg) translateX(54px)} }
@keyframes cg-orbit-b    { from{transform:rotate(120deg) translateX(38px)} to{transform:rotate(480deg) translateX(38px)} }
@keyframes cg-orbit-c    { from{transform:rotate(240deg) translateX(62px)} to{transform:rotate(600deg) translateX(62px)} }
.cg-title { background:linear-gradient(90deg,#818cf8,#c4b5fd,#67e8f9,#818cf8); background-size:300% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:cg-shimmer 3s linear infinite; }

/* ── Design 2: Neon Pulse ── */
@keyframes np-hex-pop    { 0%{transform:scale(0) rotate(-60deg);opacity:0} 65%{transform:scale(1.12) rotate(5deg);opacity:1} 82%{transform:scale(0.94) rotate(-2deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
@keyframes np-scan       { 0%{top:0%;opacity:1} 80%{opacity:0.6} 100%{top:100%;opacity:0} }
@keyframes np-check      { from{stroke-dashoffset:36} to{stroke-dashoffset:0} }
@keyframes np-glow-pulse { 0%,100%{box-shadow:0 0 16px #10b981,0 0 32px #10b98166} 50%{box-shadow:0 0 32px #10b981,0 0 64px #10b98188,0 0 96px #10b98133} }
@keyframes np-text-in    { 0%{opacity:0;letter-spacing:0.5em} 100%{opacity:1;letter-spacing:0.2em} }
@keyframes np-scanline   { 0%{background-position:0 0} 100%{background-position:0 100px} }
.np-title { animation:np-text-in 0.7s ease 0.6s both; letter-spacing:0.2em; }

/* ── Design 3: Aurora Rise ── */
@keyframes ar-aurora-a   { 0%,100%{transform:rotate(-3deg) scaleY(1)} 50%{transform:rotate(3deg) scaleY(1.06)} }
@keyframes ar-aurora-b   { 0%,100%{transform:rotate(2deg) scaleY(1)} 50%{transform:rotate(-2deg) scaleY(1.04)} }
@keyframes ar-diamond    { 0%{transform:scale(0) rotate(45deg);opacity:0} 60%{transform:scale(1.15) rotate(45deg);opacity:1} 80%{transform:scale(0.92) rotate(45deg)} 100%{transform:scale(1) rotate(45deg);opacity:1} }
@keyframes ar-facet      { 0%,100%{opacity:0.5} 50%{opacity:1} }
@keyframes ar-shimmer    { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
@keyframes ar-particle   { 0%{transform:translateY(0) scale(1);opacity:1} 100%{transform:translateY(-60px) scale(0);opacity:0} }
.ar-title { background:linear-gradient(90deg,#2dd4bf,#a3e635,#34d399,#2dd4bf); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:ar-shimmer 2.5s linear infinite; }

/* ── Design 4: Solar Burst ── */
@keyframes sb-ray        { 0%{transform:scaleX(0);opacity:0} 50%{opacity:1} 100%{transform:scaleX(1);opacity:0.6} }
@keyframes sb-star-pop   { 0%{transform:scale(0) rotate(-20deg);opacity:0} 60%{transform:scale(1.2) rotate(5deg);opacity:1} 80%{transform:scale(0.93) rotate(-2deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
@keyframes sb-shimmer    { from{background-position:0% center} to{background-position:200% center} }
@keyframes sb-ring       { 0%{transform:scale(0.4);opacity:0.9} 100%{transform:scale(2.8);opacity:0} }
@keyframes sb-float      { 0%,100%{transform:rotate(0deg) scale(1)} 50%{transform:rotate(8deg) scale(1.05)} }
.sb-title { background:linear-gradient(90deg,#fbbf24,#fb923c,#fde047,#f59e0b,#fbbf24); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:sb-shimmer 2.5s linear infinite; }
`;

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED CLOSE BUTTON & DRAIN BAR
   ═══════════════════════════════════════════════════════════════════════════ */
function DrainBar({ color = "#818cf8", duration = 5000 }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden rounded-b-3xl" style={{ background: "rgba(255,255,255,0.06)" }}>
      <div style={{ height: "100%", background: color, animation: `as-bar-drain ${duration}ms linear both` }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DESIGN 1 — "COSMIC GATE"
   Indigo/violet space portal · orbiting dots · star canvas · rocket icon
   ═══════════════════════════════════════════════════════════════════════════ */
function CosmicStarCanvas({ active }) {
  const ref = useRef(null);
  const raf = useRef(null);
  useEffect(() => {
    if (!active) return;
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    c.width = c.offsetWidth; c.height = c.offsetHeight;
    const W = c.width, H = c.height, CX = W / 2, CY = H / 2;
    const COLS = ["#818cf8", "#c4b5fd", "#67e8f9", "#a78bfa", "#e0e7ff", "#f0abfc"];
    const stars = Array.from({ length: 80 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 4.5 + 1.5;
      return { x: CX, y: CY, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, col: COLS[Math.floor(Math.random() * COLS.length)], sz: Math.random() * 3 + 1.5, life: 1, decay: Math.random() * 0.009 + 0.004 };
    });
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      let any = false;
      stars.forEach(s => {
        if (s.life <= 0) return; any = true;
        s.x += s.vx; s.y += s.vy; s.vx *= 0.985; s.vy *= 0.985; s.life -= s.decay;
        ctx.save(); ctx.globalAlpha = s.life * 0.8; ctx.fillStyle = s.col;
        ctx.shadowColor = s.col; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.sz, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      });
      if (any) raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [active]);
  if (!active) return null;
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

function CosmicGatePopup({ mode, onClose }) {
  const isReg = mode === "reg";
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(10px)", animation: "as-backdrop 0.3s ease both" }}>
      <div className="relative w-full max-w-sm rounded-3xl text-center overflow-hidden"
        style={{ background: "linear-gradient(160deg,#0a0818 0%,#04020f 100%)", border: "1px solid rgba(129,140,248,0.3)", boxShadow: "0 0 80px rgba(99,102,241,0.22), 0 40px 80px rgba(0,0,0,0.8)", animation: "as-card-pop 0.65s cubic-bezier(0.22,1.2,0.36,1) both" }}>
        <CosmicStarCanvas active />
        {/* Top accent */}
        <div style={{ height: 2, background: "linear-gradient(90deg,transparent,#818cf8,#67e8f9,#818cf8,transparent)" }} />

        <div className="relative z-10 pt-8 pb-7 px-6">
          {/* Portal rings */}
          <div className="relative flex items-center justify-center mx-auto mb-5" style={{ width: 110, height: 110 }}>
            {[0, 0.5, 1].map((d, i) => (
              <div key={i} className="absolute rounded-full"
                style={{ inset: 0, border: "1px solid rgba(129,140,248,0.4)", animation: `as-pulse-ring 2s ${d}s ease-out infinite` }} />
            ))}
            {/* Portal glow disc */}
            <div className="absolute rounded-full" style={{ inset: 12, background: "radial-gradient(circle,rgba(139,92,246,0.3) 0%,rgba(99,102,241,0.08) 70%,transparent 100%)", animation: "cg-portal 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s both", boxShadow: "0 0 40px rgba(139,92,246,0.35), inset 0 0 24px rgba(139,92,246,0.2)" }} />
            {/* Orbiting dots */}
            <div className="absolute" style={{ inset: 0, animation: "as-spin 4s linear infinite" }}>
              {[0, 120, 240].map((deg, i) => (
                <div key={i} className="absolute w-2.5 h-2.5 rounded-full" style={{ top: "50%", left: "50%", marginTop: -5, marginLeft: -5, background: ["#818cf8","#67e8f9","#c4b5fd"][i], boxShadow: `0 0 8px ${["#818cf8","#67e8f9","#c4b5fd"][i]}`, transform: `rotate(${deg}deg) translateX(46px)` }} />
              ))}
            </div>
            {/* Center icon */}
            <div className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "radial-gradient(circle,rgba(139,92,246,0.4) 0%,rgba(99,102,241,0.15) 100%)", border: "1px solid rgba(139,92,246,0.5)", boxShadow: "0 0 20px rgba(139,92,246,0.5)" }}>
              {isReg ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L13.5 8.5L20 9L13.5 10L12 17L10.5 10L4 9L10.5 8.5Z" fill="#c4b5fd" stroke="#818cf8" strokeWidth="0.5" style={{ animation: "as-float 2.5s ease-in-out infinite" }} />
                  <circle cx="5" cy="18" r="1.5" fill="#67e8f9" opacity="0.7" />
                  <circle cx="19" cy="5" r="1" fill="#f0abfc" opacity="0.7" />
                </svg>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2" fill="rgba(139,92,246,0.3)" stroke="#c4b5fd" strokeWidth="1.5" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="12" cy="16" r="1.5" fill="#67e8f9" />
                </svg>
              )}
            </div>
          </div>

          {/* Labels */}
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-400/70 mb-1.5" style={{ animation: "as-fade-up 0.5s ease 0.5s both", opacity: 0 }}>
            {isReg ? "Account Created" : "Password Secured"}
          </p>
          <h2 className="cg-title text-2xl font-black tracking-tight mb-2" style={{ animation: "as-fade-up 0.5s ease 0.6s both" }}>
            {isReg ? "WELCOME ABOARD" : "YOU'RE ALL SET"}
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-5" style={{ animation: "as-fade-up 0.5s ease 0.7s both", opacity: 0 }}>
            {isReg
              ? "Your Syncetra account is live.\nCheck your email for the setup link."
              : "Your password has been set.\nYou can now sign in to your account."}
          </p>

          <button onClick={onClose} className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 0 24px rgba(99,102,241,0.4)", animation: "as-fade-up 0.5s ease 0.85s both", opacity: 0 }}>
            {isReg ? "Check Email →" : "Sign In →"}
          </button>
        </div>
        <DrainBar color="linear-gradient(90deg,#6366f1,#8b5cf6,#67e8f9)" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DESIGN 2 — "NEON PULSE"
   Cyberpunk neon green · hex shield · scan line · electric particles
   ═══════════════════════════════════════════════════════════════════════════ */
function NeonParticleCanvas({ active }) {
  const ref = useRef(null);
  const raf = useRef(null);
  useEffect(() => {
    if (!active) return;
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    c.width = c.offsetWidth; c.height = c.offsetHeight;
    const W = c.width, H = c.height, CX = W / 2, CY = H * 0.42;
    const COLS = ["#10b981","#34d399","#6ee7b7","#059669","#00ffaa","#a7f3d0"];
    const sparks = Array.from({ length: 55 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 5 + 2;
      return { x: CX, y: CY, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, col: COLS[~~(Math.random() * COLS.length)], sz: Math.random() * 4 + 1.5, life: 1, decay: Math.random() * 0.011 + 0.005 };
    });
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      let any = false;
      sparks.forEach(s => {
        if (s.life <= 0) return; any = true;
        s.x += s.vx; s.y += s.vy; s.vx *= 0.978; s.vy *= 0.978; s.life -= s.decay;
        ctx.save(); ctx.globalAlpha = s.life;
        ctx.shadowColor = s.col; ctx.shadowBlur = 10; ctx.fillStyle = s.col;
        // Diamond shape
        ctx.translate(s.x, s.y); ctx.rotate(Math.PI / 4);
        ctx.fillRect(-s.sz / 2, -s.sz / 2, s.sz, s.sz);
        ctx.restore();
      });
      if (any) raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [active]);
  if (!active) return null;
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

function NeonPulsePopup({ mode, onClose }) {
  const isReg = mode === "reg";
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.94)", backdropFilter: "blur(8px)", animation: "as-backdrop 0.3s ease both" }}>
      <div className="relative w-full max-w-sm rounded-2xl text-center overflow-hidden"
        style={{ background: "linear-gradient(170deg,#020c08 0%,#050f0b 100%)", border: "1px solid rgba(16,185,129,0.3)", boxShadow: "0 0 60px rgba(16,185,129,0.15), 0 0 120px rgba(16,185,129,0.06), 0 40px 80px rgba(0,0,0,0.9)", animation: "as-card-pop 0.6s cubic-bezier(0.22,1.2,0.36,1) both" }}>
        <NeonParticleCanvas active />

        {/* Scanline sweep */}
        <div className="absolute left-0 right-0 h-[2px] pointer-events-none z-20"
          style={{ background: "linear-gradient(90deg,transparent,rgba(16,185,129,0.8),transparent)", animation: "np-scan 1.2s ease 0.1s both", top: 0 }} />

        {/* Grid lines bg */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,#10b981 0px,transparent 1px,transparent 24px),repeating-linear-gradient(90deg,#10b981 0px,transparent 1px,transparent 24px)" }} />

        {/* Top accent */}
        <div style={{ height: 2, background: "linear-gradient(90deg,transparent,#10b981,#34d399,#10b981,transparent)" }} />

        <div className="relative z-10 pt-8 pb-7 px-6">
          {/* Hex shield */}
          <div className="flex justify-center mb-5">
            <div className="relative" style={{ width: 90, height: 90, animation: "np-hex-pop 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.2s both" }}>
              {/* Hex SVG backdrop */}
              <svg viewBox="0 0 90 90" className="absolute inset-0 w-full h-full">
                <polygon points="45,4 83,25 83,65 45,86 7,65 7,25"
                  fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.6)" strokeWidth="1.5"
                  style={{ animation: "np-glow-pulse 2s ease-in-out infinite", filter: "drop-shadow(0 0 8px rgba(16,185,129,0.5))" }} />
                <polygon points="45,14 73,29 73,61 45,76 17,61 17,29"
                  fill="none" stroke="rgba(16,185,129,0.2)" strokeWidth="1" />
              </svg>
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                {isReg ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="#10b981" strokeWidth="1.8" />
                    <path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M19 3l2 2-6 6" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="14" style={{ animation: "np-check 0.5s ease 0.9s both" }} />
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7z" stroke="#10b981" strokeWidth="1.5" fill="rgba(16,185,129,0.1)" />
                    <path d="M9 12l2 2 4-4" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="14" style={{ animation: "np-check 0.5s ease 0.9s both" }} />
                  </svg>
                )}
              </div>
            </div>
          </div>

          <p className="text-[9px] font-black uppercase tracking-[0.35em] mb-1.5 text-emerald-600" style={{ animation: "as-fade-up 0.5s ease 0.55s both", opacity: 0 }}>
            {isReg ? "// REGISTRATION COMPLETE" : "// AUTHENTICATION READY"}
          </p>
          <h2 className="np-title text-2xl font-black text-emerald-400 mb-2"
            style={{ textShadow: "0 0 20px rgba(16,185,129,0.6)", letterSpacing: "0.15em" }}>
            {isReg ? "SYSTEM ONLINE" : "ACCESS GRANTED"}
          </h2>
          <p className="text-slate-500 text-[13px] leading-relaxed mb-5 font-mono" style={{ animation: "as-fade-up 0.5s ease 0.8s both", opacity: 0 }}>
            {isReg ? "> Account provisioned successfully\n> Check inbox for setup link" : "> Credentials established\n> Ready to authenticate"}
          </p>

          <button onClick={onClose} className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.5)", color: "#10b981", boxShadow: "0 0 16px rgba(16,185,129,0.2)", animation: "as-fade-up 0.5s ease 0.95s both", opacity: 0 }}>
            {isReg ? "→ Check Email" : "→ Sign In"}
          </button>
        </div>
        <DrainBar color="#10b981" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DESIGN 3 — "AURORA RISE"
   Northern lights · teal/gold/lavender · floating particles · diamond icon
   ═══════════════════════════════════════════════════════════════════════════ */
function AuroraParticles({ active }) {
  const ref = useRef(null);
  const raf = useRef(null);
  useEffect(() => {
    if (!active) return;
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    c.width = c.offsetWidth; c.height = c.offsetHeight;
    const W = c.width, H = c.height;
    const COLS = ["#2dd4bf","#a3e635","#fbbf24","#a78bfa","#34d399","#6ee7b7"];
    const pts = Array.from({ length: 45 }, () => ({
      x: Math.random() * W, y: Math.random() * H + H,
      vx: (Math.random() - 0.5) * 0.7, vy: -(Math.random() * 1.5 + 0.8),
      col: COLS[~~(Math.random() * COLS.length)],
      sz: Math.random() * 3 + 1, life: Math.random() * 0.6 + 0.4, decay: Math.random() * 0.006 + 0.003,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      let any = false;
      pts.forEach(p => {
        if (p.life <= 0) return; any = true;
        p.x += p.vx; p.y += p.vy; p.life -= p.decay;
        ctx.save(); ctx.globalAlpha = p.life * 0.7;
        ctx.shadowColor = p.col; ctx.shadowBlur = 8; ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      });
      if (any) raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [active]);
  if (!active) return null;
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

function AuroraRisePopup({ mode, onClose }) {
  const isReg = mode === "reg";
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(10px)", animation: "as-backdrop 0.3s ease both" }}>
      <div className="relative w-full max-w-sm rounded-3xl text-center overflow-hidden"
        style={{ background: "linear-gradient(170deg,#03120e 0%,#050818 100%)", border: "1px solid rgba(45,212,191,0.25)", boxShadow: "0 0 80px rgba(45,212,191,0.1), 0 0 40px rgba(167,139,250,0.08), 0 40px 80px rgba(0,0,0,0.85)", animation: "as-card-pop 0.65s cubic-bezier(0.22,1.2,0.36,1) both" }}>
        {/* Aurora bands */}
        <div className="absolute inset-x-0 top-0 h-32 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute inset-x-0 h-24 -top-4 rounded-full blur-3xl" style={{ background: "linear-gradient(90deg,#2dd4bf44,#a78bfa55,#34d39944)", animation: "ar-aurora-a 5s ease-in-out infinite" }} />
          <div className="absolute inset-x-0 h-20 top-4 rounded-full blur-2xl" style={{ background: "linear-gradient(90deg,#fbbf2433,#2dd4bf44,#a3e63533)", animation: "ar-aurora-b 6s ease-in-out infinite" }} />
        </div>
        <AuroraParticles active />
        <div style={{ height: 2, background: "linear-gradient(90deg,transparent,#2dd4bf,#a78bfa,#2dd4bf,transparent)" }} />

        <div className="relative z-10 pt-8 pb-7 px-6">
          {/* Diamond icon */}
          <div className="flex justify-center mb-5">
            <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
              {[0, 0.45, 0.9].map((d, i) => (
                <div key={i} className="absolute rounded-full"
                  style={{ inset: 0, border: "1px solid rgba(45,212,191,0.3)", animation: `as-pulse-ring 2.2s ${d}s ease-out infinite` }} />
              ))}
              {/* Diamond shape */}
              <div className="relative flex items-center justify-center w-16 h-16"
                style={{ animation: "ar-diamond 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.15s both" }}>
                <svg viewBox="0 0 64 64" className="w-full h-full" style={{ filter: "drop-shadow(0 0 12px rgba(45,212,191,0.6))" }}>
                  <polygon points="32,4 60,20 60,44 32,60 4,44 4,20"
                    fill="rgba(45,212,191,0.12)" stroke="url(#arGrad)" strokeWidth="1.5" />
                  <polygon points="32,14 50,24 50,40 32,50 14,40 14,24"
                    fill="rgba(167,139,250,0.08)" stroke="rgba(167,139,250,0.4)" strokeWidth="0.8" style={{ animation: "ar-facet 2s ease-in-out infinite" }} />
                  <defs>
                    <linearGradient id="arGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#2dd4bf" />
                      <stop offset="50%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Center dot */}
                <div className="absolute w-4 h-4 rounded-full" style={{ background: "radial-gradient(circle,#2dd4bf,#a78bfa)", boxShadow: "0 0 16px #2dd4bf" }} />
              </div>
            </div>
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-teal-400/60 mb-1.5" style={{ animation: "as-fade-up 0.5s ease 0.5s both", opacity: 0 }}>
            {isReg ? "New Member" : "Verified"}
          </p>
          <h2 className="ar-title text-[1.6rem] font-black mb-2" style={{ animation: "as-fade-up 0.4s ease 0.6s both" }}>
            {isReg ? "ACCOUNT CREATED" : "PASSWORD SECURED"}
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-5" style={{ animation: "as-fade-up 0.5s ease 0.72s both", opacity: 0 }}>
            {isReg
              ? "Your journey with Syncetra begins now.\nA setup link is on its way to your inbox."
              : "Your credentials are locked and loaded.\nWelcome to the Syncetra family."}
          </p>

          <button onClick={onClose} className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full text-sm font-bold transition-all"
            style={{ background: "linear-gradient(135deg,rgba(45,212,191,0.18),rgba(167,139,250,0.14))", border: "1px solid rgba(45,212,191,0.4)", color: "#2dd4bf", boxShadow: "0 0 20px rgba(45,212,191,0.18)", animation: "as-fade-up 0.5s ease 0.88s both", opacity: 0 }}>
            {isReg ? "✈ Check Email" : "✓ Sign In Now"}
          </button>
        </div>
        <DrainBar color="linear-gradient(90deg,#2dd4bf,#a78bfa,#fbbf24)" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DESIGN 4 — "SOLAR BURST"
   Warm amber/orange · radiating rays · ember sparks canvas · star icon
   ═══════════════════════════════════════════════════════════════════════════ */
function EmberCanvas({ active }) {
  const ref = useRef(null);
  const raf = useRef(null);
  useEffect(() => {
    if (!active) return;
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    c.width = c.offsetWidth; c.height = c.offsetHeight;
    const W = c.width, H = c.height, CX = W / 2, CY = H * 0.44;
    const COLS = ["#f59e0b","#fb923c","#fbbf24","#fde047","#f97316","#fcd34d","#fef08a"];
    const embers = Array.from({ length: 70 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 5 + 2;
      return { x: CX, y: CY, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd - 1, col: COLS[~~(Math.random() * COLS.length)], sz: Math.random() * 4 + 1.5, life: 1, decay: Math.random() * 0.01 + 0.005 };
    });
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      let any = false;
      embers.forEach(e => {
        if (e.life <= 0) return; any = true;
        e.x += e.vx; e.y += e.vy; e.vy += 0.04; e.vx *= 0.99; e.life -= e.decay;
        ctx.save(); ctx.globalAlpha = e.life * 0.85;
        ctx.shadowColor = e.col; ctx.shadowBlur = 8; ctx.fillStyle = e.col;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.sz, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      if (any) raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [active]);
  if (!active) return null;
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

function SolarBurstPopup({ mode, onClose }) {
  const isReg = mode === "reg";
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  const RAYS = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.91)", backdropFilter: "blur(10px)", animation: "as-backdrop 0.3s ease both" }}>
      <div className="relative w-full max-w-sm rounded-3xl text-center overflow-hidden"
        style={{ background: "linear-gradient(160deg,#0d0500 0%,#100802 100%)", border: "1px solid rgba(251,191,36,0.25)", boxShadow: "0 0 80px rgba(245,158,11,0.18), 0 0 40px rgba(249,115,22,0.1), 0 40px 80px rgba(0,0,0,0.85)", animation: "as-card-pop 0.65s cubic-bezier(0.22,1.2,0.36,1) both" }}>
        <EmberCanvas active />
        <div style={{ height: 2, background: "linear-gradient(90deg,transparent,#f59e0b,#fb923c,#f59e0b,transparent)" }} />

        <div className="relative z-10 pt-8 pb-7 px-6">
          {/* Radiating rays + star */}
          <div className="flex justify-center mb-5">
            <div className="relative flex items-center justify-center" style={{ width: 110, height: 110 }}>
              {/* Expanding rings */}
              {[0, 0.4, 0.8].map((d, i) => (
                <div key={i} className="absolute rounded-full"
                  style={{ inset: 0, border: "1px solid rgba(245,158,11,0.35)", animation: `sb-ring 2s ${d}s ease-out infinite` }} />
              ))}
              {/* Rotating rays */}
              <div className="absolute inset-0" style={{ animation: "as-spin 18s linear infinite" }}>
                {RAYS.map((i) => (
                  <div key={i} className="absolute" style={{
                    top: "50%", left: "50%", width: 48, height: 2, marginTop: -1, marginLeft: 0,
                    transformOrigin: "0 50%", transform: `rotate(${i * 30}deg)`,
                    background: `linear-gradient(90deg,rgba(245,158,11,${i % 2 === 0 ? 0.5 : 0.25}),transparent)`,
                  }} />
                ))}
              </div>
              {/* Star icon */}
              <div className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "radial-gradient(circle,rgba(245,158,11,0.35),rgba(249,115,22,0.15))", border: "1px solid rgba(245,158,11,0.4)", boxShadow: "0 0 30px rgba(245,158,11,0.45)", animation: "sb-star-pop 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s both" }}>
                {isReg ? (
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style={{ animation: "sb-float 3s ease-in-out infinite" }}>
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" fill="url(#sbGrad)" stroke="rgba(251,191,36,0.5)" strokeWidth="0.5" />
                    <defs><linearGradient id="sbGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse"><stop stopColor="#fbbf24" /><stop offset="1" stopColor="#f97316" /></linearGradient></defs>
                  </svg>
                ) : (
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style={{ animation: "sb-float 3s ease-in-out infinite" }}>
                    <path d="M9 12l2 2 4-4" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="9" stroke="url(#sbGrad2)" strokeWidth="1.5" fill="rgba(245,158,11,0.08)" />
                    <defs><linearGradient id="sbGrad2" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse"><stop stopColor="#fbbf24" /><stop offset="1" stopColor="#f97316" /></linearGradient></defs>
                  </svg>
                )}
              </div>
            </div>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-600/70 mb-1.5" style={{ animation: "as-fade-up 0.5s ease 0.5s both", opacity: 0 }}>
            {isReg ? "Registration" : "Confirmation"}
          </p>
          <h2 className="sb-title text-3xl font-black mb-2" style={{ animation: "as-fade-up 0.45s ease 0.6s both" }}>
            {isReg ? "YOU'RE IN!" : "ALL SET!"}
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-5" style={{ animation: "as-fade-up 0.5s ease 0.72s both", opacity: 0 }}>
            {isReg
              ? "Your account is live and ready.\nA setup link was sent to your email."
              : "Your password is confirmed.\nYou're cleared to enter Syncetra."}
          </p>

          <button onClick={onClose} className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-slate-900 transition-all"
            style={{ background: "linear-gradient(135deg,#fbbf24,#f97316)", boxShadow: "0 0 24px rgba(245,158,11,0.45), 0 4px 12px rgba(249,115,22,0.3)", animation: "as-fade-up 0.5s ease 0.88s both", opacity: 0 }}>
            {isReg ? "🌟 Check Email" : "🚀 Sign In Now"}
          </button>
        </div>
        <DrainBar color="linear-gradient(90deg,#f59e0b,#fb923c,#fbbf24)" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PREVIEW PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
const DESIGNS = [
  {
    id: "cosmic",   label: "Cosmic Gate",   desc: "Space portal · orbiting dots · indigo/violet",
    accent: "#818cf8",  accentBg: "rgba(99,102,241,0.12)", border: "rgba(129,140,248,0.25)",
    Component: CosmicGatePopup,
  },
  {
    id: "neon",     label: "Neon Pulse",    desc: "Cyberpunk · hex shield · neon green",
    accent: "#10b981",  accentBg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)",
    Component: NeonPulsePopup,
  },
  {
    id: "aurora",   label: "Aurora Rise",   desc: "Northern lights · diamond icon · teal/gold",
    accent: "#2dd4bf",  accentBg: "rgba(45,212,191,0.08)", border: "rgba(45,212,191,0.22)",
    Component: AuroraRisePopup,
  },
  {
    id: "solar",    label: "Solar Burst",   desc: "Radiant rays · ember sparks · amber/orange",
    accent: "#f59e0b",  accentBg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)",
    Component: SolarBurstPopup,
  },
];

const MODES = [
  { id: "reg", label: "Registration Success", icon: "✉", subtitle: "After account is created" },
  { id: "pwd", label: "Password Set",         icon: "🔑", subtitle: "After password is confirmed" },
];

export default function AuthSuccessVariants() {
  const [mode, setMode]         = useState("reg");
  const [activePopup, setActive] = useState(null); // { id, mode }

  const ActiveComponent = activePopup
    ? DESIGNS.find(d => d.id === activePopup.id)?.Component
    : null;

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <style>{KF}</style>

      {/* ── Header ── */}
      <div className="border-b border-slate-800/60 px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-black text-white tracking-tight">Auth Success Popup Variants</h1>
          <p className="text-slate-500 text-xs mt-0.5">4 animated designs × 2 scenarios — pick your favorite</p>
        </div>
        <a href="/" className="text-xs text-slate-500 hover:text-slate-300 border border-slate-800 rounded-lg px-3 py-1.5 transition-colors">← Back</a>
      </div>

      {/* ── Mode toggle ── */}
      <div className="px-6 pt-6 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-3">Scenario</p>
        <div className="inline-flex gap-2 p-1.5 bg-slate-900 rounded-2xl border border-slate-800">
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === m.id ? "bg-slate-700 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}>
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-2 ml-1">{MODES.find(m2 => m2.id === mode)?.subtitle}</p>
      </div>

      {/* ── Design grid ── */}
      <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl">
        {DESIGNS.map((d) => (
          <div key={d.id} className="rounded-2xl border overflow-hidden group"
            style={{ background: d.accentBg, borderColor: d.border }}>

            {/* Card header */}
            <div className="px-4 pt-4 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">{d.label}</h3>
                <p className="text-[11px] mt-0.5" style={{ color: d.accent + "aa" }}>{d.desc}</p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.accent, boxShadow: `0 0 8px ${d.accent}` }} />
            </div>

            {/* Preview strip — mini animation hint */}
            <div className="mx-4 mb-3 rounded-xl h-20 flex items-center justify-center relative overflow-hidden"
              style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${d.border}` }}>
              {/* Animated accent line */}
              <div className="absolute top-0 left-0 right-0 h-[1.5px]" style={{ background: `linear-gradient(90deg,transparent,${d.accent},transparent)` }} />
              {[0, 0.4, 0.8].map((delay, i) => (
                <div key={i} className="absolute rounded-full"
                  style={{ width: 48 + i * 20, height: 48 + i * 20, border: `1px solid ${d.accent}33`, animation: `as-pulse-ring ${2 + i * 0.3}s ${delay}s ease-out infinite` }} />
              ))}
              <div className="relative z-10 text-2xl" style={{ filter: `drop-shadow(0 0 8px ${d.accent})` }}>
                {mode === "reg" ? "✉" : "🔑"}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[1.5px]" style={{ background: `linear-gradient(90deg,transparent,${d.accent}66,transparent)` }} />
            </div>

            {/* Play button */}
            <div className="px-4 pb-4">
              <button
                onClick={() => setActive({ id: d.id, mode })}
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: d.accentBg, border: `1px solid ${d.border}`, color: d.accent }}>
                ▶ Preview Full Popup
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tip ── */}
      <div className="px-6 pb-10 max-w-4xl">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-base mt-0.5">💡</span>
          <p className="text-xs text-slate-500 leading-relaxed">
            Each popup auto-dismisses after <strong className="text-slate-400">5 seconds</strong> or click the button to close.
            The drain bar at the bottom shows time remaining. Tell me which design you like!
          </p>
        </div>
      </div>

      {/* ── Active popup overlay ── */}
      {activePopup && ActiveComponent &&
        createPortal(
          <ActiveComponent mode={activePopup.mode} onClose={() => setActive(null)} />,
          document.body
        )
      }
    </div>
  );
}
