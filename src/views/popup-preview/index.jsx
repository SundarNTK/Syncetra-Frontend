import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

/* ─── Shared layout data ─────────────────────────────────────────────────────── */
const STARS = Array.from({ length: 28 }, (_, i) => ({
  x:    ((i * 37 + 11) % 97) + 1,
  y:    ((i * 53 + 7)  % 91) + 3,
  size: 1.0 + (i % 4) * 0.7,
  delay:`${((i * 0.41) % 3).toFixed(2)}s`,
  dur:  `${(1.5 + (i % 5) * 0.4).toFixed(1)}s`,
}));

/* ─── All CSS keyframes ──────────────────────────────────────────────────────── */
const KF = `
@keyframes starTwinkle{0%,100%{opacity:.1;transform:scale(.7);}50%{opacity:1;transform:scale(1.4);}}
@keyframes planeFly{0%{transform:translate(-55vw,0)rotate(-12deg);opacity:0;}6%{opacity:1;}50%{transform:translate(0,-30px)rotate(-14deg);}94%{opacity:1;}100%{transform:translate(55vw,-70px)rotate(-22deg);opacity:0;}}
@keyframes trailFade{0%{width:0;opacity:0;}22%{width:160px;opacity:.5;}70%{width:110px;opacity:.25;}100%{width:30px;opacity:0;}}
@keyframes busRide{0%{transform:translateX(-58vw);opacity:0;}7%{opacity:1;}93%{opacity:1;}100%{transform:translateX(58vw);opacity:0;}}
@keyframes wheelSpin{100%{transform:rotate(360deg);}}
@keyframes busBounce{0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);}}
@keyframes roadScroll{100%{background-position:200px 0;}}
@keyframes cardLand{0%{transform:translateY(60px)scale(.92);opacity:0;}55%{transform:translateY(-8px)scale(1.01);opacity:1;}76%{transform:translateY(4px);}100%{transform:translateY(0)scale(1);opacity:1;}}
@keyframes cardSlideUp{0%{transform:translateY(80px);opacity:0;}100%{transform:translateY(0);opacity:1;}}
@keyframes spinFlip{0%{transform:perspective(900px)rotateY(-180deg)scale(.22);opacity:0;}55%{transform:perspective(900px)rotateY(18deg)scale(1.04);opacity:1;}75%{transform:perspective(900px)rotateY(-9deg)scale(.97);}90%{transform:perspective(900px)rotateY(4deg);}100%{transform:perspective(900px)rotateY(0)scale(1);opacity:1;}}
@keyframes fadeUp{0%{transform:translateY(16px);opacity:0;}100%{transform:translateY(0);opacity:1;}}
@keyframes pinDrop{0%{transform:translateY(-100px)scale(.85);opacity:0;}60%{transform:translateY(12px)scale(1.05);opacity:1;}78%{transform:translateY(-8px);}90%{transform:translateY(4px);}100%{transform:translateY(0)scale(1);opacity:1;}}
@keyframes ripplePing{0%{transform:scale(.15);opacity:.85;}100%{transform:scale(3.2);opacity:0;}}
@keyframes bounceIn{0%{transform:scale(0)rotate(-18deg);opacity:0;}55%{transform:scale(1.28)rotate(6deg);opacity:1;}72%{transform:scale(.9)rotate(-2deg);}87%{transform:scale(1.05);}100%{transform:scale(1)rotate(0);opacity:1;}}
@keyframes shieldDrop{0%{transform:translateY(-120px)scale(.8);opacity:0;}60%{transform:translateY(8px)scale(1.05);opacity:1;}78%{transform:translateY(-5px);}100%{transform:translateY(0)scale(1);opacity:1;}}
@keyframes lockClick{0%{transform:rotate(-15deg);}40%{transform:rotate(10deg);}70%{transform:rotate(-5deg);}100%{transform:rotate(0);}}
@keyframes shieldPulse{0%,100%{box-shadow:0 0 16px rgba(239,68,68,.25);}50%{box-shadow:0 0 32px rgba(239,68,68,.5),0 0 60px rgba(239,68,68,.2);}}
@keyframes scanLine{0%{top:0%;}50%{top:90%;}100%{top:0%;}}
@keyframes scanPulse{0%,100%{opacity:.5;}50%{opacity:1;}}
@keyframes checkTick{0%{stroke-dashoffset:40;}100%{stroke-dashoffset:0;}}
@keyframes barGrow{0%{transform:scaleY(0);}100%{transform:scaleY(1);}}
@keyframes coinFall{0%{transform:translateY(-60px)rotate(0deg);opacity:1;}80%{opacity:1;}100%{transform:translateY(0)rotate(var(--cr,180deg));opacity:0.7;}}
@keyframes shutterOpen{0%{transform:scaleX(1);}100%{transform:scaleX(0);}}
@keyframes flashBurst{0%,100%{opacity:0;}50%{opacity:.7;}}
@keyframes bellSwing{0%{transform:rotate(0);}15%{transform:rotate(18deg);}30%{transform:rotate(-16deg);}45%{transform:rotate(12deg);}60%{transform:rotate(-8deg);}75%{transform:rotate(5deg);}90%{transform:rotate(-2deg);}100%{transform:rotate(0);}}
@keyframes soundWave{0%{transform:scale(.4);opacity:.9;}100%{transform:scale(2.4);opacity:0;}}
@keyframes personWalk{0%{transform:translateX(-30px);opacity:0;}100%{transform:translateX(0);opacity:1;}}
@keyframes orbitSpin{100%{transform:rotate(360deg);}}
@keyframes walletOpen{0%{transform:rotateX(-60deg)scale(.8);opacity:0;}70%{transform:rotateX(8deg)scale(1.03);opacity:1;}100%{transform:rotateX(0)scale(1);opacity:1;}}
@keyframes coinSpin{0%{transform:rotateY(0);}100%{transform:rotateY(360deg);}}
@keyframes stampSeal{0%{transform:translateY(-180px)rotate(-5deg)scale(1.2);opacity:0;}65%{transform:translateY(4px)rotate(1deg)scale(1);opacity:1;}82%{transform:translateY(-5px);}100%{transform:translateY(0)rotate(0)scale(1);opacity:1;}}
@keyframes stampFlash{0%,60%{opacity:0;}65%{opacity:.4;}100%{opacity:0;}}
@keyframes shimmer{0%{background-position:-300% center;}100%{background-position:300% center;}}
@keyframes cardSwipe{0%{transform:translateX(-80px)rotate(-8deg);opacity:0;}60%{transform:translateX(6px)rotate(1deg);opacity:1;}80%{transform:translateX(-3px);}100%{transform:translateX(0)rotate(0);opacity:1;}}
@keyframes payWave{0%{transform:scale(.2);opacity:.8;}100%{transform:scale(2.6);opacity:0;}}
@keyframes backpackDrop{0%{transform:translateY(-80px)scale(.9);opacity:0;}60%{transform:translateY(8px)scale(1.04);opacity:1;}80%{transform:translateY(-5px);}100%{transform:translateY(0)scale(1);opacity:1;}}
@keyframes compassSpin{0%{transform:rotate(-180deg);}100%{transform:rotate(0);}}
@keyframes cloudFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-7px);}}
`;

/* ═══════════════════════════════════════════════════════
   REALISTIC SVG ILLUSTRATIONS
══════════════════════════════════════════════════════ */

/* Commercial Airliner — detailed realistic SVG */
function PlaneIllustration() {
  return (
    <svg width="200" height="72" viewBox="0 0 200 72" style={{ filter:"drop-shadow(0 6px 16px rgba(0,0,0,.6))" }}>
      <defs>
        <linearGradient id="pBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f0f4ff" />
          <stop offset="50%"  stopColor="#dde8ff" />
          <stop offset="100%" stopColor="#b4c8e8" />
        </linearGradient>
        <linearGradient id="pWing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#c8d8f0" />
          <stop offset="100%" stopColor="#7a9cbd" />
        </linearGradient>
        <linearGradient id="pEng" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#9ca3af" />
          <stop offset="60%"  stopColor="#4b5563" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>
        <radialGradient id="pGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#bfdbfe" stopOpacity=".7" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="pShadow"><feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity=".35"/></filter>
      </defs>
      {/* Engine exhaust glow */}
      <ellipse cx="14" cy="38" rx="10" ry="5" fill="url(#pGlow)" opacity=".55" />
      <ellipse cx="14" cy="52" rx="7"  ry="3.5" fill="url(#pGlow)" opacity=".38" />
      {/* Fuselage */}
      <path d="M22 30 Q12 30 7 36 Q4 38 7 42 Q12 46 22 44 L172 38 Q185 37 192 36 Q196 36 198 36 Q196 37 192 38 L172 40 Z"
        fill="url(#pBody)" filter="url(#pShadow)" />
      {/* Nose cone */}
      <path d="M190 36 Q197 36 200 37 Q197 38 190 38" fill="#d1dff5" />
      {/* Main wings */}
      <path d="M88 37 L42 10 L62 36 L42 62 Z" fill="url(#pWing)" filter="url(#pShadow)" />
      {/* Left engine */}
      <ellipse cx="52" cy="50" rx="14" ry="5.5" fill="url(#pEng)" />
      <ellipse cx="52" cy="50" rx="7"  ry="4.5" fill="#1f2937" />
      <ellipse cx="52" cy="50" rx="3"  ry="3" fill="#374151" />
      <ellipse cx="63" cy="50" rx="3.5" ry="5" fill="#6b7280" stroke="#9ca3af" strokeWidth=".5" />
      {/* Right mini-wing (far side, perspective) */}
      <path d="M88 37 L95 28 L100 36 L95 44 Z" fill="url(#pWing)" opacity=".6" />
      {/* Right engine (far) */}
      <ellipse cx="91" cy="44" rx="7" ry="2.5" fill="url(#pEng)" opacity=".6" />
      {/* Tail */}
      <path d="M24 37 L12 18 L30 36 Z" fill="url(#pWing)" filter="url(#pShadow)" />
      <path d="M24 37 L12 56 L30 38 Z" fill="url(#pWing)" filter="url(#pShadow)" />
      {/* Vertical stabiliser */}
      <path d="M20 37 L14 16 L26 36" fill="url(#pWing)" opacity=".85" />
      {/* Livery blue stripe */}
      <path d="M30 36.5 L170 34.5 L170 36 L30 38 Z" fill="rgba(59,130,246,.6)" />
      <path d="M30 38 L170 36 L170 37.5 L30 39.5 Z" fill="rgba(37,99,235,.38)" />
      {/* Windows */}
      {[100,113,126,139,152,163].map((x, i) => (
        <rect key={i} x={x} y="33" width="7" height="5" rx="2"
          fill={`rgba(186,230,253,${.7 - i*.04})`} />
      ))}
      {/* Nose window */}
      <ellipse cx="178" cy="36" rx="5" ry="3.5" fill="rgba(186,230,253,.5)" />
      {/* Anti-collision lights */}
      <circle cx="62" cy="10" r="2" fill="#ef4444" opacity=".75"
        style={{ animation:"soundWave 1.5s ease-out 3s infinite" }} />
      {/* Landing light */}
      <circle cx="197" cy="37" r="3" fill="rgba(253,224,71,.95)"
        style={{ filter:"blur(1px) drop-shadow(0 0 5px rgba(253,224,71,.8))" }} />
    </svg>
  );
}

/* Realistic Bus */
function BusIllustration() {
  return (
    <svg width="110" height="56" viewBox="0 0 110 56" style={{ filter:"drop-shadow(0 5px 12px rgba(0,0,0,.55))" }}>
      <defs>
        <linearGradient id="bBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1a6b2e" />
          <stop offset="40%"  stopColor="#16542c" />
          <stop offset="100%" stopColor="#0f3d1f" />
        </linearGradient>
        <linearGradient id="bRoof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#27824a" />
          <stop offset="100%" stopColor="#1a6b2e" />
        </linearGradient>
        <linearGradient id="bWheel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#374151" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
      </defs>
      {/* Shadow */}
      <ellipse cx="55" cy="54" rx="48" ry="3" fill="rgba(0,0,0,.3)" />
      {/* Body */}
      <rect x="2" y="7" width="106" height="36" rx="5" fill="url(#bBody)" />
      {/* Roof */}
      <rect x="2" y="7" width="106" height="14" rx="5" fill="url(#bRoof)" />
      {/* Front face */}
      <rect x="90" y="12" width="16" height="22" rx="3" fill="rgba(255,255,255,.08)" />
      {/* Front windshield */}
      <rect x="92" y="14" width="12" height="10" rx="2" fill="rgba(147,210,190,.5)" />
      {/* Front lights */}
      <ellipse cx="104" cy="30" rx="4" ry="3" fill="rgba(253,224,71,.85)"
        style={{ filter:"blur(.8px)" }} />
      {/* Windows */}
      {[8,24,40,56,72].map((x, i) => (
        <rect key={i} x={x} y="11" width="13" height="9" rx="2"
          fill={`rgba(167,226,200,${.5 - i*.03})`} />
      ))}
      {/* Side door */}
      <rect x="22" y="22" width="10" height="18" rx="2" fill="rgba(255,255,255,.07)" />
      <line x1="27" y1="22" x2="27" y2="40" stroke="rgba(255,255,255,.15)" strokeWidth="1" />
      {/* Destination board */}
      <rect x="7" y="7.5" width="55" height="5" rx="1.5" fill="rgba(0,0,0,.35)" />
      <rect x="9" y="8.5" width="30" height="3" rx="1" fill="rgba(74,222,128,.4)" />
      {/* Stripe */}
      <rect x="2" y="28" width="88" height="2.5" fill="rgba(74,222,128,.25)" />
      {/* Wheels */}
      {[20, 76].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy="46" r="9" fill="url(#bWheel)" />
          <circle cx={cx} cy="46" r="5" fill="#1f2937" />
          <circle cx={cx} cy="46" r="3" fill="#374151" />
          {/* Hubcap details */}
          {[0,60,120,180,240,300].map(angle => (
            <line key={angle}
              x1={cx + Math.cos(angle*Math.PI/180)*3}
              y1={46 + Math.sin(angle*Math.PI/180)*3}
              x2={cx + Math.cos(angle*Math.PI/180)*7.5}
              y2={46 + Math.sin(angle*Math.PI/180)*7.5}
              stroke="rgba(74,222,128,.4)" strokeWidth=".8" />
          ))}
          <circle cx={cx} cy="46" r="9" fill="none" stroke="#4ade80" strokeWidth="1" opacity=".5" />
        </g>
      ))}
      {/* Exhaust pipe */}
      <rect x="3" y="38" width="5" height="3" rx="1" fill="#374151" />
    </svg>
  );
}

/* Camera with aperture */
function CameraIllustration() {
  return (
    <svg width="90" height="72" viewBox="0 0 90 72">
      <defs>
        <radialGradient id="lens" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#1e40af" />
          <stop offset="40%"  stopColor="#1e3a8a" />
          <stop offset="80%"  stopColor="#172554" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
        <radialGradient id="lensShine" cx="35%" cy="30%" r="40%">
          <stop offset="0%"   stopColor="rgba(255,255,255,.35)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="camBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#374151" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
      </defs>
      {/* Camera body */}
      <rect x="5" y="18" width="80" height="50" rx="8" fill="url(#camBody)" />
      <rect x="5" y="18" width="80" height="12" rx="8" fill="#4b5563" />
      {/* Viewfinder bump */}
      <rect x="28" y="10" width="34" height="10" rx="4" fill="#374151" />
      {/* Shutter button */}
      <circle cx="68" cy="14" r="5" fill="#6b7280" />
      <circle cx="68" cy="14" r="3" fill="#9ca3af" />
      {/* Lens ring */}
      <circle cx="42" cy="45" r="24" fill="#1f2937" />
      <circle cx="42" cy="45" r="22" fill="#111827" stroke="#374151" strokeWidth="1" />
      {/* Lens glass */}
      <circle cx="42" cy="45" r="18" fill="url(#lens)" />
      {/* Lens shine */}
      <circle cx="42" cy="45" r="18" fill="url(#lensShine)" />
      {/* Lens rings */}
      <circle cx="42" cy="45" r="14" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1" />
      <circle cx="42" cy="45" r="10" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="1" />
      {/* Aperture blades */}
      {[0,45,90,135].map((angle, i) => (
        <line key={i}
          x1={42 + Math.cos(angle*Math.PI/180)*6}
          y1={45 + Math.sin(angle*Math.PI/180)*6}
          x2={42 + Math.cos((angle+90)*Math.PI/180)*6}
          y2={45 + Math.sin((angle+90)*Math.PI/180)*6}
          stroke="rgba(255,255,255,.25)" strokeWidth="1.5" strokeLinecap="round" />
      ))}
      {/* Center dot */}
      <circle cx="42" cy="45" r="3" fill="rgba(147,197,253,.4)" />
      <circle cx="36" cy="39" r="2.5" fill="rgba(255,255,255,.18)" />
      {/* Flash indicator */}
      <rect x="72" y="30" width="8" height="12" rx="2" fill="rgba(253,224,71,.6)"
        style={{ animation:"flashBurst 2s ease-in-out 1.5s infinite" }} />
    </svg>
  );
}

/* Shield */
function ShieldIllustration() {
  return (
    <svg width="80" height="90" viewBox="0 0 80 90">
      <defs>
        <linearGradient id="shGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#dc2626" />
          <stop offset="50%"  stopColor="#b91c1c" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
        <linearGradient id="shShine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="rgba(255,255,255,.2)" />
          <stop offset="60%"  stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id="shGlow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Shadow */}
      <ellipse cx="40" cy="87" rx="26" ry="3" fill="rgba(0,0,0,.3)" />
      {/* Shield outer */}
      <path d="M40 4 L74 18 L74 46 Q74 72 40 84 Q6 72 6 46 L6 18 Z" fill="url(#shGrad)" />
      {/* Shield shine */}
      <path d="M40 8 L70 20 L70 44 Q70 66 44 78 L44 8 Z" fill="url(#shShine)" />
      {/* Shield inner border */}
      <path d="M40 10 L68 22 L68 46 Q68 68 40 80 Q12 68 12 46 L12 22 Z"
        fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1.5" />
      {/* Lock icon */}
      <rect x="26" y="44" width="28" height="22" rx="4" fill="rgba(255,255,255,.2)" />
      <rect x="26" y="44" width="28" height="10" rx="4" fill="rgba(255,255,255,.28)" />
      <path d="M30 44 Q30 32 40 32 Q50 32 50 44" fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="40" cy="53" r="4" fill="rgba(255,255,255,.9)" />
      <rect x="38" y="54" width="4" height="6" rx="1" fill="rgba(255,255,255,.9)" />
      {/* Emblem stars */}
      {[-16,0,16].map((dx, i) => (
        <text key={i} x={40+dx} y="36" fontSize="6" fill="rgba(255,255,255,.4)" textAnchor="middle">★</text>
      ))}
    </svg>
  );
}

/* Wallet + coins */
function WalletIllustration() {
  return (
    <svg width="90" height="76" viewBox="0 0 90 76">
      <defs>
        <linearGradient id="wMain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#065f46" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
        <linearGradient id="wTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#059669" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
        <linearGradient id="coinG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#fbbf24" />
          <stop offset="50%"  stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      {/* Falling coins */}
      {[20,42,62].map((x, i) => (
        <g key={i} style={{ "--cr":`${(i+1)*120}deg`,
          animation:`coinFall .7s cubic-bezier(.34,1.2,.64,1) ${.1+i*.15}s both`, opacity:0 }}>
          <ellipse cx={x} cy={18-i*6} rx="10" ry="5" fill="url(#coinG)" />
          <ellipse cx={x} cy={18-i*6-1} rx="10" ry="5" fill="url(#coinG)" />
          <ellipse cx={x} cy={18-i*6-1} rx="7" ry="3" fill="rgba(255,255,255,.2)" />
          <text x={x} y={18-i*6+2} fontSize="5" fill="rgba(255,255,255,.7)" textAnchor="middle">$</text>
        </g>
      ))}
      {/* Wallet body */}
      <rect x="4" y="30" width="82" height="44" rx="8" fill="url(#wMain)"
        style={{ filter:"drop-shadow(0 4px 12px rgba(0,0,0,.4))" }} />
      {/* Wallet top flap open */}
      <path d="M4 30 Q4 18 12 16 L78 16 Q86 18 86 30"
        fill="url(#wTop)" stroke="rgba(255,255,255,.1)" strokeWidth="1" />
      {/* Card slots */}
      <rect x="12" y="36" width="30" height="18" rx="3" fill="rgba(255,255,255,.07)" />
      <rect x="15" y="40" width="20" height="3" rx="1.5" fill="rgba(255,255,255,.2)" />
      <rect x="15" y="46" width="14" height="2" rx="1" fill="rgba(255,255,255,.12)" />
      {/* Bills */}
      <rect x="48" y="36" width="32" height="12" rx="2" fill="rgba(74,222,128,.3)" />
      <rect x="50" y="38" width="28" height="8" rx="1.5" fill="rgba(74,222,128,.25)" />
      {/* Clasp */}
      <ellipse cx="45" cy="30" rx="8" ry="4" fill="#047857" stroke="rgba(255,255,255,.2)" strokeWidth="1" />
      <circle cx="45" cy="30" r="2" fill="rgba(255,255,255,.3)" />
      {/* Money amount */}
      <text x="64" y="62" fontSize="9" fill="rgba(74,222,128,.8)" textAnchor="middle" fontWeight="bold">₹ 500</text>
    </svg>
  );
}

/* Clock Bell */
function BellIllustration() {
  return (
    <svg width="80" height="88" viewBox="0 0 80 88" style={{ overflow:"visible" }}>
      <defs>
        <linearGradient id="bellG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f59e0b" />
          <stop offset="50%"  stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <radialGradient id="bellShine" cx="35%" cy="25%" r="45%">
          <stop offset="0%"   stopColor="rgba(255,255,255,.35)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      {/* Sound waves */}
      {[22,34,46].map((r, i) => (
        <circle key={i} cx="40" cy="38" r={r} fill="none"
          stroke="rgba(245,158,11,.4)" strokeWidth="1.5"
          style={{ animation:`soundWave 2s ease-out ${.3+i*.35}s infinite`, transformOrigin:"40px 38px" }} />
      ))}
      {/* Bell body */}
      <g style={{ transformOrigin:"40px 30px", animation:"bellSwing 1.2s ease-in-out .2s both" }}>
        {/* Hanger */}
        <path d="M34 6 Q34 2 40 2 Q46 2 46 6" fill="none" stroke="url(#bellG)" strokeWidth="4" strokeLinecap="round" />
        <rect x="37" y="5" width="6" height="8" rx="2" fill="url(#bellG)" />
        {/* Bell dome */}
        <path d="M8 62 Q8 16 40 14 Q72 16 72 62 Z" fill="url(#bellG)" />
        <path d="M8 62 Q8 16 40 14 Q72 16 72 62 Z" fill="url(#bellShine)" />
        {/* Dome details */}
        <path d="M20 50 Q20 24 40 22 Q60 24 60 50" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1" />
        {/* Base rim */}
        <ellipse cx="40" cy="62" rx="32" ry="6" fill="#92400e" />
        <ellipse cx="40" cy="61" rx="32" ry="5" fill="#b45309" />
        {/* Clapper */}
        <circle cx="40" cy="68" r="5" fill="#78350f" />
        <circle cx="40" cy="66" r="3" fill="#92400e" />
      </g>
    </svg>
  );
}

/* Checklist / Tasks */
function ChecklistIllustration() {
  return (
    <svg width="80" height="90" viewBox="0 0 80 90">
      <defs>
        <linearGradient id="clipGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#5b21b6" />
        </linearGradient>
      </defs>
      {/* Clipboard */}
      <rect x="8" y="12" width="64" height="76" rx="6" fill="#1e1b4b"
        style={{ filter:"drop-shadow(0 4px 12px rgba(0,0,0,.4))" }} />
      <rect x="8" y="12" width="64" height="8" rx="6" fill="url(#clipGrad)" />
      {/* Clip */}
      <rect x="28" y="8" width="24" height="10" rx="4" fill="#4c1d95" stroke="rgba(167,139,250,.3)" strokeWidth="1" />
      <rect x="32" y="10" width="16" height="6" rx="2" fill="#3b0764" />
      {/* Checklist items */}
      {[
        { y:30, done:true,  label:"Members booked" },
        { y:46, done:true,  label:"Vehicles arranged" },
        { y:62, done:false, label:"Itinerary set" },
      ].map((item, i) => (
        <g key={i} style={{ animation:`fadeUp .5s ease ${.4+i*.25}s both`, opacity:0 }}>
          {/* Checkbox */}
          <rect x="16" y={item.y-5} width="12" height="12" rx="2.5"
            fill={item.done ? "rgba(124,58,237,.4)" : "rgba(255,255,255,.06)"}
            stroke={item.done ? "#7c3aed" : "rgba(255,255,255,.15)"} strokeWidth="1" />
          {item.done && (
            <path d={`M18 ${item.y+1} L20 ${item.y+3} L26 ${item.y-2}`}
              stroke="#a78bfa" strokeWidth="2" fill="none" strokeLinecap="round"
              strokeLinejoin="round" strokeDasharray="15"
              style={{ animation:`checkTick .4s ease ${.5+i*.25}s both`, strokeDashoffset:15 }} />
          )}
          {/* Label */}
          <rect x="32" y={item.y-4} width={item.done ? 36 : 30} height="10" rx="2"
            fill="rgba(255,255,255,.04)" />
          <rect x="34" y={item.y-1} width={item.done ? 26 : 20} height="4" rx="1.5"
            fill={item.done ? "rgba(167,139,250,.5)" : "rgba(255,255,255,.15)"} />
        </g>
      ))}
    </svg>
  );
}

/* Bar chart for polls */
function BarChartIllustration() {
  const bars = [
    { h:55, label:"A", color:"#3b82f6", pct:"54%" },
    { h:32, label:"B", color:"#8b5cf6", pct:"31%" },
    { h:15, label:"C", color:"#06b6d4", pct:"15%" },
  ];
  return (
    <svg width="88" height="80" viewBox="0 0 88 80">
      {/* Grid lines */}
      {[20,40,60].map(y => <line key={y} x1="8" y1={80-y} x2="82" y2={80-y} stroke="rgba(255,255,255,.06)" strokeWidth="1" />)}
      {/* Bars */}
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={14+i*26} y={80-b.h-4} width="18" height={b.h} rx="4" fill={b.color}
            style={{
              transformOrigin:`${14+i*26+9}px 76px`,
              animation:`barGrow .7s cubic-bezier(.34,1.2,.64,1) ${.2+i*.18}s both`,
              opacity:0,
              filter:`drop-shadow(0 0 8px ${b.color}60)`,
            }} />
          <text x={14+i*26+9} y={80-b.h-8} fontSize="8" fill={b.color} textAnchor="middle" fontWeight="bold"
            style={{ animation:`fadeUp .4s ease ${.55+i*.18}s both`, opacity:0 }}>
            {b.pct}
          </text>
          <text x={14+i*26+9} y="76" fontSize="8" fill="rgba(255,255,255,.4)" textAnchor="middle">{b.label}</text>
        </g>
      ))}
      {/* Axis */}
      <line x1="8" y1="76" x2="82" y2="76" stroke="rgba(255,255,255,.15)" strokeWidth="1.5" />
    </svg>
  );
}

/* People / Group */
function GroupIllustration() {
  return (
    <svg width="96" height="72" viewBox="0 0 96 72">
      {/* Person 1 – left */}
      <g style={{ animation:"personWalk .6s cubic-bezier(.34,1.2,.64,1) .1s both", opacity:0 }}>
        <circle cx="20" cy="18" r="10" fill="#0e7490" />
        <circle cx="20" cy="16" r="6" fill="#06b6d4" />
        <path d="M8 50 Q8 32 20 30 Q32 32 32 50" fill="#0e7490" />
      </g>
      {/* Person 2 – center */}
      <g style={{ animation:"bounceIn .6s cubic-bezier(.34,1.56,.64,1) .3s both", opacity:0 }}>
        <circle cx="48" cy="14" r="12" fill="#7c3aed" />
        <circle cx="48" cy="11" r="7" fill="#8b5cf6" />
        <path d="M33 50 Q33 28 48 26 Q63 28 63 50" fill="#7c3aed" />
      </g>
      {/* Person 3 – right */}
      <g style={{ animation:"personWalk .6s cubic-bezier(.34,1.2,.64,1) .2s both", opacity:0 }}>
        <circle cx="76" cy="18" r="10" fill="#0e7490" />
        <circle cx="76" cy="16" r="6" fill="#06b6d4" />
        <path d="M64 50 Q64 32 76 30 Q88 32 88 50" fill="#0e7490" />
      </g>
      {/* Connecting arc */}
      <path d="M20 28 Q48 20 76 28" fill="none" stroke="rgba(139,92,246,.4)" strokeWidth="1.5" strokeDasharray="4 3" />
      {/* Check mark above */}
      <circle cx="48" cy="58" r="9" fill="rgba(5,150,105,.3)" stroke="#10b981" strokeWidth="1.5"
        style={{ animation:"bounceIn .5s ease .7s both", opacity:0 }} />
      <path d="M43 58 L46 62 L54 54" fill="none" stroke="#10b981" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="20"
        style={{ animation:"checkTick .4s ease .9s both", strokeDashoffset:20 }} />
    </svg>
  );
}

/* Payment / Share Collection */
function PaymentIllustration() {
  return (
    <svg width="90" height="72" viewBox="0 0 90 72">
      <defs>
        <linearGradient id="cardG" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%"   stopColor="#0891b2" />
          <stop offset="50%"  stopColor="#0e7490" />
          <stop offset="100%" stopColor="#164e63" />
        </linearGradient>
        <radialGradient id="cardShine" cx="25%" cy="30%" r="55%">
          <stop offset="0%"   stopColor="rgba(255,255,255,.2)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      {/* Pay waves */}
      {[16,26,36].map((r, i) => (
        <circle key={i} cx="45" cy="40" r={r} fill="none"
          stroke="rgba(6,182,212,.45)" strokeWidth="1.5"
          style={{ animation:`payWave 2s ease-out ${.1+i*.35}s infinite`, transformOrigin:"45px 40px" }} />
      ))}
      {/* Card shadow */}
      <ellipse cx="46" cy="70" rx="32" ry="3" fill="rgba(0,0,0,.3)" />
      {/* Card body */}
      <rect x="8" y="18" width="74" height="46" rx="8" fill="url(#cardG)"
        style={{ animation:"cardSwipe .6s cubic-bezier(.34,1.2,.64,1) .15s both",
          filter:"drop-shadow(0 4px 16px rgba(8,145,178,.4))", opacity:0 }} />
      <rect x="8" y="18" width="74" height="46" rx="8" fill="url(#cardShine)" />
      {/* Chip */}
      <rect x="18" y="28" width="16" height="12" rx="2.5" fill="rgba(245,158,11,.7)"
        stroke="rgba(245,158,11,.4)" strokeWidth=".5" />
      <line x1="24" y1="28" x2="24" y2="40" stroke="rgba(0,0,0,.2)" strokeWidth=".7" />
      <line x1="28" y1="28" x2="28" y2="40" stroke="rgba(0,0,0,.2)" strokeWidth=".7" />
      <line x1="18" y1="33" x2="34" y2="33" stroke="rgba(0,0,0,.2)" strokeWidth=".7" />
      {/* Card number */}
      {[20,36,52,66].map((x, i) => (
        <rect key={i} x={x} y={46} width="9" height="4" rx="1" fill="rgba(255,255,255,.3)" />
      ))}
      {/* Bank logo */}
      <circle cx="68" cy="32" r="8" fill="rgba(245,158,11,.4)" />
      <circle cx="72" cy="32" r="8" fill="rgba(239,68,68,.35)" />
      {/* Contactless */}
      {[4,7,10].map((r, i) => (
        <path key={i} d={`M14 ${24+r} Q14 ${24+r} 10 ${28}`}
          fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1" />
      ))}
      {/* Confirmed badge */}
      <g style={{ animation:"bounceIn .5s ease .7s both", opacity:0 }}>
        <circle cx="72" cy="55" r="9" fill="#059669" stroke="rgba(255,255,255,.3)" strokeWidth="1" />
        <path d="M67 55 L70 58 L77 51" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/* Fingerprint scanner / Attendance */
function ScannerIllustration() {
  return (
    <svg width="80" height="88" viewBox="0 0 80 88">
      <defs>
        <linearGradient id="fpGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      {/* Device frame */}
      <rect x="4" y="8" width="72" height="72" rx="10" fill="#111827"
        style={{ filter:"drop-shadow(0 4px 12px rgba(0,0,0,.5))" }} />
      <rect x="4" y="8" width="72" height="8" rx="10" fill="#1f2937" />
      <rect x="6" y="10" width="68" height="4" rx="6" fill="#374151" />
      {/* Screen */}
      <rect x="10" y="18" width="60" height="58" rx="6" fill="#030712" />
      {/* Fingerprint arcs (simplified) */}
      {[8,14,20,26,32].map((r, i) => (
        <path key={i}
          d={`M40 ${52+r} Q${40-r} ${52} 40 ${52-r} Q${40+r} ${52} 40 ${52+r}`}
          fill="none" stroke="rgba(245,158,11,.35)" strokeWidth="1.2"
          style={{ animation:`fadeUp .3s ease ${.3+i*.1}s both`, opacity:0 }} />
      ))}
      <circle cx="40" cy="52" r="5" fill="rgba(245,158,11,.25)" />
      {/* Scan line */}
      <rect x="12" y="20" width="56" height="2" rx="1"
        style={{
          background:"linear-gradient(90deg,transparent,rgba(245,158,11,.8),transparent)",
          fill:"rgba(245,158,11,.7)",
          animation:"scanLine 2s ease-in-out .5s infinite",
          position:"relative",
        }} />
      {/* Status indicator */}
      <circle cx="40" cy="72" r="4" fill="rgba(16,185,129,.7)"
        style={{ animation:"soundWave 1.5s ease-out 1.5s infinite", transformOrigin:"40px 72px" }} />
      <circle cx="40" cy="72" r="2.5" fill="#10b981" />
    </svg>
  );
}

/* Backpack / Checklist master */
function BackpackIllustration() {
  return (
    <svg width="80" height="90" viewBox="0 0 80 90">
      <defs>
        <linearGradient id="bpGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="bpFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#fb923c" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      {/* Straps */}
      <path d="M24 14 Q16 14 16 26 L16 70" stroke="#c2410c" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M56 14 Q64 14 64 26 L64 70" stroke="#c2410c" strokeWidth="7" strokeLinecap="round" fill="none" />
      {/* Main bag */}
      <rect x="10" y="12" width="60" height="68" rx="12" fill="url(#bpGrad)"
        style={{ filter:"drop-shadow(0 4px 14px rgba(0,0,0,.4))" }} />
      {/* Front pocket */}
      <rect x="16" y="52" width="48" height="24" rx="8" fill="url(#bpFront)" />
      {/* Pocket zipper */}
      <path d="M22 60 Q40 58 58 60" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="2" strokeLinecap="round" />
      {/* Zipper pull */}
      <circle cx="40" cy="59" r="3" fill="rgba(255,255,255,.6)" />
      {/* Handle */}
      <path d="M30 10 Q30 4 40 4 Q50 4 50 10" fill="none" stroke="#c2410c" strokeWidth="5" strokeLinecap="round" />
      {/* Logo area */}
      <circle cx="40" cy="34" r="14" fill="rgba(255,255,255,.08)" />
      <text x="40" y="39" fontSize="18" textAnchor="middle">🧳</text>
      {/* Check badge */}
      <g style={{ animation:"bounceIn .5s ease .8s both", opacity:0 }}>
        <circle cx="58" cy="18" r="9" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
        <path d="M53 18 L56 21 L63 14" fill="none" stroke="#fff" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/* Members / profile */
function MemberIllustration() {
  return (
    <svg width="80" height="86" viewBox="0 0 80 86">
      <defs>
        <radialGradient id="avatarGrad" cx="40%" cy="30%" r="55%">
          <stop offset="0%"   stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0369a1" />
        </radialGradient>
        <linearGradient id="cardBgGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0c4a6e" />
          <stop offset="100%" stopColor="#082f49" />
        </linearGradient>
      </defs>
      {/* ID Card shadow */}
      <rect x="7" y="16" width="66" height="68" rx="8" fill="rgba(0,0,0,.3)"
        style={{ transform:"translateY(3px)" }} />
      {/* ID Card */}
      <rect x="7" y="14" width="66" height="68" rx="8" fill="url(#cardBgGrad)"
        style={{ filter:"drop-shadow(0 4px 12px rgba(0,0,0,.4))" }} />
      <rect x="7" y="14" width="66" height="10" rx="8" fill="#0369a1" />
      {/* Card label */}
      <text x="40" y="22" fontSize="7" fill="rgba(186,230,253,.8)" textAnchor="middle" fontWeight="bold" letterSpacing="1">MEMBER</text>
      {/* Avatar circle */}
      <circle cx="40" cy="44" r="18" fill="url(#avatarGrad)" />
      {/* Avatar person */}
      <circle cx="40" cy="39" r="8" fill="rgba(255,255,255,.3)" />
      <path d="M24 58 Q24 46 40 44 Q56 46 56 58" fill="rgba(255,255,255,.2)" />
      {/* Name bar */}
      <rect x="16" y="66" width="48" height="5" rx="2.5" fill="rgba(186,230,253,.25)" />
      <rect x="22" y="73" width="36" height="4" rx="2" fill="rgba(186,230,253,.15)" />
      {/* Badge */}
      <g style={{ animation:"bounceIn .5s ease .6s both", opacity:0 }}>
        <circle cx="58" cy="28" r="9" fill="#0284c7" stroke="rgba(255,255,255,.4)" strokeWidth="1.5" />
        <text x="58" y="32" fontSize="10" textAnchor="middle">+</text>
      </g>
    </svg>
  );
}

/* Compass for Itinerary */
function CompassIllustration() {
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <defs>
        <radialGradient id="compassFace" cx="50%" cy="40%" r="55%">
          <stop offset="0%"   stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="44" cy="44" r="42" fill="none" stroke="rgba(16,185,129,.25)" strokeWidth="2" />
      <circle cx="44" cy="44" r="40" fill="url(#compassFace)"
        style={{ filter:"drop-shadow(0 4px 16px rgba(0,0,0,.5))" }} />
      <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(16,185,129,.15)" strokeWidth="1" />
      {/* Degree ticks */}
      {Array.from({length:36}, (_, i) => {
        const angle = i * 10 * Math.PI / 180;
        const r1 = i%9===0 ? 30 : i%3===0 ? 32 : 34;
        return (
          <line key={i}
            x1={44+Math.cos(angle)*r1} y1={44+Math.sin(angle)*r1}
            x2={44+Math.cos(angle)*37} y2={44+Math.sin(angle)*37}
            stroke={i%9===0?"rgba(16,185,129,.6)":"rgba(255,255,255,.12)"}
            strokeWidth={i%9===0?1.5:0.8} />
        );
      })}
      {/* Cardinal labels */}
      {[{l:"N",a:-90,c:"#10b981"},{l:"S",a:90,c:"#94a3b8"},{l:"E",a:0,c:"#94a3b8"},{l:"W",a:180,c:"#94a3b8"}].map(({l,a,c})=>(
        <text key={l}
          x={44+Math.cos(a*Math.PI/180)*26} y={44+Math.sin(a*Math.PI/180)*26+4}
          fontSize="9" fill={c} textAnchor="middle" fontWeight="bold">{l}</text>
      ))}
      {/* Needle – spinning to North */}
      <g style={{ transformOrigin:"44px 44px", animation:"compassSpin .8s cubic-bezier(.34,1.2,.64,1) .3s both" }}>
        {/* North (red) */}
        <path d="M44 44 L40 24 L44 18 L48 24 Z" fill="#ef4444" />
        {/* South (white) */}
        <path d="M44 44 L40 64 L44 70 L48 64 Z" fill="rgba(255,255,255,.7)" />
      </g>
      {/* Center jewel */}
      <circle cx="44" cy="44" r="5" fill="#1e293b" stroke="rgba(16,185,129,.5)" strokeWidth="1.5" />
      <circle cx="44" cy="44" r="2.5" fill="#10b981" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   BASE POPUP WRAPPER (shared card structure)
══════════════════════════════════════════════════════ */
function BasePopup({ bg, cardStyle, barStyle, children, onClose, bgChildren }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-hidden" style={{ background:bg }}>
      {bgChildren}
      <button className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-[340px] rounded-2xl overflow-hidden" style={cardStyle}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3, ...barStyle }} />
        <div className="px-7 py-8 text-center">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

function PopText({ text, size=13, color, weight=400, lsp, up, mt=0, mb=8, delay }) {
  return (
    <p style={{ fontSize:size, color, fontWeight:weight, letterSpacing:lsp,
      textTransform:up?"uppercase":undefined, marginTop:mt, marginBottom:mb,
      animation:`fadeUp .5s ease ${delay}s both`, opacity:0 }}>
      {text}
    </p>
  );
}
function PopBtn({ text, bg, shadow, color="#fff", delay }) {
  return null; // placeholder — each popup renders its own button
}

/* ═══════════════════════════════════════════════════════
   14 MASTER POPUPS
══════════════════════════════════════════════════════ */

/* 1. TRIP ──────────── realistic airplane, night sky */
function TripPopup({ type, onClose }) {
  const t = type === "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] overflow-hidden"
      style={{ background:"linear-gradient(165deg,#04091f 0%,#091640 55%,#07102e 100%)" }}>
      {STARS.map((s,i)=>(
        <div key={i} className="absolute rounded-full bg-white pointer-events-none"
          style={{ left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,
            animation:`starTwinkle ${s.dur} ease-in-out ${s.delay} infinite` }}/>
      ))}
      {/* Clouds */}
      {[{x:"15%",y:"25%",w:80},{x:"65%",y:"15%",w:60},{x:"78%",y:"50%",w:50}].map((c,i)=>(
        <div key={i} className="absolute pointer-events-none opacity-10"
          style={{ left:c.x, top:c.y, width:c.w, height:28, borderRadius:14,
            background:"white", animation:`cloudFloat ${3+i}s ease-in-out ${i*.5}s infinite` }} />
      ))}
      {/* Contrail */}
      <div className="absolute pointer-events-none" style={{ top:"39%",left:"18%",height:2,borderRadius:1,
        background:"linear-gradient(90deg,rgba(99,179,237,.5),transparent)",
        animation:"trailFade 2.2s ease-out .3s both",width:0 }} />
      {/* Plane */}
      <div className="absolute pointer-events-none" style={{ top:"34%", animation:"planeFly 2.8s cubic-bezier(.4,0,.55,1) .1s both", opacity:0 }}>
        <PlaneIllustration />
      </div>
      <button className="absolute inset-0" onClick={onClose} />
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
        <div className="pointer-events-auto w-full max-w-[338px] rounded-2xl overflow-hidden"
          style={{ background:"linear-gradient(145deg,#0c1a42,#0f2258)",
            border:"1px solid rgba(99,130,255,.38)",
            boxShadow:"0 24px 64px rgba(0,0,0,.8),0 0 50px rgba(59,130,246,.14)",
            animation:"cardLand .85s cubic-bezier(.3,1.4,.6,1) 2.1s both" }}>
          <div style={{ height:3,background:"linear-gradient(90deg,#3b82f6,#06b6d4,#10b981)" }} />
          <div className="px-7 py-8 text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background:"rgba(59,130,246,.14)",border:"1px solid rgba(59,130,246,.38)",
                boxShadow:"0 0 26px rgba(59,130,246,.3)", animation:"cloudFloat 3s ease-in-out 2.6s infinite" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.27 3.13A59.77 59.77 0 0121.49 12a59.77 59.77 0 01-18.22 8.87L6 12zm0 0h7.5"/>
              </svg>
            </div>
            <p style={{ fontSize:10,letterSpacing:"0.3em",color:"#60a5fa",fontWeight:700,textTransform:"uppercase",animation:"fadeUp .5s ease 2.3s both",opacity:0 }}>Trip {t?"Updated":"Created"}</p>
            <p style={{ color:"#fff",fontWeight:800,fontSize:18,margin:"6px 0 4px",animation:"fadeUp .5s ease 2.45s both",opacity:0 }}>{t?"Changes Saved!":"Trip Scheduled!"}</p>
            <p style={{ color:"rgba(148,163,184,1)",fontSize:13,marginBottom:24,animation:"fadeUp .5s ease 2.6s both",opacity:0 }}>{t?"Your trip details have been updated.":"Your trip has been added to the list."}</p>
            <button onClick={onClose} style={{ width:"100%",padding:"11px",borderRadius:12,fontWeight:700,fontSize:13,background:"linear-gradient(90deg,#3b82f6,#06b6d4)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 8px 24px rgba(59,130,246,.45)",animation:"fadeUp .5s ease 2.75s both",opacity:0 }}>✈️ {t?"Confirmed!":"Let's Go!"}</button>
          </div>
        </div>
      </div>
    </div>, document.body
  );
}

/* 2. VEHICLES ────────── realistic bus + road */
function VehiclesPopup({ type, onClose }) {
  const t = type === "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] overflow-hidden"
      style={{ background:"linear-gradient(180deg,#0a1a08 0%,#0d2210 55%,#071208 100%)" }}>
      {STARS.slice(0,16).map((s,i)=>(
        <div key={i} className="absolute rounded-full bg-white/50 pointer-events-none"
          style={{ left:`${s.x}%`,top:`${s.y*.5}%`,width:s.size*.8,height:s.size*.8,
            animation:`starTwinkle ${s.dur} ease-in-out ${s.delay} infinite` }}/>
      ))}
      {/* Mountain silhouettes */}
      <div className="absolute pointer-events-none bottom-[28%]" style={{ left:0,right:0 }}>
        <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none">
          <path d="M0 60 L80 15 L160 50 L240 5 L320 40 L400 20 L400 60 Z" fill="rgba(5,46,22,.8)" />
        </svg>
      </div>
      {/* Road */}
      <div className="absolute pointer-events-none" style={{ bottom:"29%",left:0,right:0,height:8,
        background:"rgba(255,255,255,.06)",borderTop:"1px solid rgba(255,255,255,.04)" }}>
        <div style={{ position:"absolute",top:3,left:0,right:0,height:2,overflow:"hidden" }}>
          <div style={{ height:"100%",backgroundImage:"repeating-linear-gradient(90deg,rgba(245,158,11,.5) 0,rgba(245,158,11,.5) 24px,transparent 24px,transparent 48px)",animation:"roadScroll 1s linear infinite" }} />
        </div>
      </div>
      {/* Bus */}
      <div className="absolute pointer-events-none" style={{ bottom:"29%",marginBottom:7,animation:"busRide 2.8s cubic-bezier(.4,0,.55,1) .1s both",opacity:0 }}>
        <div style={{ animation:"busBounce .4s ease-in-out infinite" }}>
          <BusIllustration />
        </div>
      </div>
      <button className="absolute inset-0" onClick={onClose} />
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
        <div className="pointer-events-auto w-full max-w-[338px] rounded-2xl overflow-hidden"
          style={{ background:"linear-gradient(145deg,#0b1f0e,#102918)",
            border:"1px solid rgba(74,222,128,.32)",
            boxShadow:"0 24px 64px rgba(0,0,0,.82),0 0 40px rgba(74,222,128,.1)",
            animation:"cardLand .8s cubic-bezier(.3,1.4,.6,1) 2.1s both" }}>
          <div style={{ height:3,background:"linear-gradient(90deg,#4ade80,#10b981,#06b6d4)" }} />
          <div className="px-7 py-8 text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.32)",boxShadow:"0 0 22px rgba(74,222,128,.22)" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
            </div>
            <p style={{ fontSize:10,letterSpacing:"0.3em",color:"#4ade80",fontWeight:700,textTransform:"uppercase",animation:"fadeUp .5s ease 2.3s both",opacity:0 }}>Vehicle {t?"Updated":"Added"}</p>
            <p style={{ color:"#fff",fontWeight:800,fontSize:18,margin:"6px 0 4px",animation:"fadeUp .5s ease 2.45s both",opacity:0 }}>{t?"Details Updated!":"Vehicle Added!"}</p>
            <p style={{ color:"rgba(134,239,172,.7)",fontSize:13,marginBottom:24,animation:"fadeUp .5s ease 2.6s both",opacity:0 }}>The vehicle is now {t?"updated in":"part of"} your trip fleet.</p>
            <button onClick={onClose} style={{ width:"100%",padding:"11px",borderRadius:12,fontWeight:700,fontSize:13,background:"linear-gradient(90deg,#16a34a,#15803d)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 8px 24px rgba(22,163,74,.44)",animation:"fadeUp .5s ease 2.75s both",opacity:0 }}>🚌 Great!</button>
          </div>
        </div>
      </div>
    </div>, document.body
  );
}

/* 3. ITINERARY ──────── compass + route map */
function ItineraryPopup({ type, onClose }) {
  const t = type === "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(3,8,16,.93)" }} onClick={onClose}>
      <div className="absolute inset-0 pointer-events-none" style={{ opacity:.05,
        backgroundImage:"linear-gradient(#10b981 1px,transparent 1px),linear-gradient(90deg,#10b981 1px,transparent 1px)",
        backgroundSize:"36px 36px" }} />
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#061510,#0b2018)",border:"1px solid rgba(16,185,129,.25)",
          boxShadow:"0 28px 70px rgba(0,0,0,.88),0 0 45px rgba(16,185,129,.1)",
          animation:"cardSlideUp .7s cubic-bezier(.3,1.3,.6,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#10b981,#059669,#0d9488)" }} />
        <div className="px-7 py-8 text-center">
          <div className="relative mx-auto mb-5 w-20 h-20 flex items-center justify-center"
            style={{ animation:"bounceIn .7s cubic-bezier(.34,1.5,.64,1) .2s both",opacity:0 }}>
            <CompassIllustration />
          </div>
          {[0,.4,.8].map((d,i)=>(
            <div key={i} className="absolute pointer-events-none" style={{
              borderRadius:"50%",border:"2px solid rgba(16,185,129,.4)",
              inset:"calc(50% - 40px)",
              animation:`ripplePing 2.2s ease-out ${1.2+d}s infinite` }} />
          ))}
          <p style={{ fontSize:10,letterSpacing:"0.3em",color:"#34d399",fontWeight:700,textTransform:"uppercase",animation:"fadeUp .5s ease .6s both",opacity:0 }}>Route {t?"Updated":"Logged"}</p>
          <p style={{ color:"#fff",fontWeight:800,fontSize:18,margin:"6px 0 4px",animation:"fadeUp .5s ease .75s both",opacity:0 }}>{t?"Stop Updated!":"Stop Added!"}</p>
          <p style={{ color:"rgba(100,190,140,.75)",fontSize:13,marginBottom:22,animation:"fadeUp .5s ease .9s both",opacity:0 }}>This stop is now {t?"updated on":"marked on"} your route map.</p>
          <button onClick={onClose} style={{ width:"100%",padding:"11px",borderRadius:12,fontWeight:700,fontSize:13,background:"linear-gradient(90deg,#10b981,#059669)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 8px 24px rgba(16,185,129,.44)",animation:"fadeUp .5s ease 1.05s both",opacity:0 }}>📍 Next Stop!</button>
        </div>
      </div>
    </div>, document.body
  );
}

/* 4. GROUPS ─────────── team formation */
function GroupsPopup({ type, onClose }) {
  const t = type === "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(5,10,24,.92)" }} onClick={onClose}>
      <div className="absolute w-80 h-80 rounded-full pointer-events-none"
        style={{ background:"radial-gradient(circle,rgba(6,182,212,.12),transparent 70%)" }} />
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#0c1824,#0e2436)",border:"1px solid rgba(6,182,212,.28)",
          boxShadow:"0 28px 70px rgba(0,0,0,.85),0 0 45px rgba(6,182,212,.1)",
          animation:"spinFlip .9s cubic-bezier(.2,1.2,.5,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#06b6d4,#0891b2,#7c3aed)" }} />
        <div className="px-7 py-8 text-center">
          <div className="relative mx-auto mb-5 flex items-center justify-center h-20"
            style={{ animation:"bounceIn .6s ease .15s both",opacity:0 }}>
            <GroupIllustration />
          </div>
          <p style={{ fontSize:10,letterSpacing:"0.3em",color:"#22d3ee",fontWeight:700,textTransform:"uppercase",animation:"fadeUp .5s ease .5s both",opacity:0 }}>Group {t?"Updated":"Created"}</p>
          <p style={{ color:"#fff",fontWeight:800,fontSize:18,margin:"6px 0 4px",animation:"fadeUp .5s ease .65s both",opacity:0 }}>{t?"Group Updated!":"Squad's Ready!"}</p>
          <p style={{ color:"rgba(103,232,249,.7)",fontSize:13,marginBottom:22,animation:"fadeUp .5s ease .8s both",opacity:0 }}>Your group has been {t?"updated":"created"} successfully.</p>
          <button onClick={onClose} style={{ width:"100%",padding:"11px",borderRadius:12,fontWeight:700,fontSize:13,background:"linear-gradient(90deg,#0891b2,#0e7490)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 8px 24px rgba(8,145,178,.44)",animation:"fadeUp .5s ease .95s both",opacity:0 }}>👥 Awesome!</button>
        </div>
      </div>
    </div>, document.body
  );
}

/* 5. MEMBERS ────────── profile card */
function MembersPopup({ type, onClose }) {
  const t = type === "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(4,8,20,.92)" }} onClick={onClose}>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#0c1834,#101e44)",border:"1px solid rgba(56,189,248,.28)",
          boxShadow:"0 28px 64px rgba(0,0,0,.85),0 0 40px rgba(56,189,248,.1)",
          animation:"cardLand .75s cubic-bezier(.3,1.4,.6,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#0ea5e9,#38bdf8,#7dd3fc)" }} />
        <div className="px-7 py-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center h-22" style={{ height:88 }}>
            <MemberIllustration />
          </div>
          <p style={{ fontSize:10,letterSpacing:"0.3em",color:"#38bdf8",fontWeight:700,textTransform:"uppercase",animation:"fadeUp .5s ease .4s both",opacity:0 }}>Member {t?"Updated":"Added"}</p>
          <p style={{ color:"#fff",fontWeight:800,fontSize:18,margin:"6px 0 4px",animation:"fadeUp .5s ease .55s both",opacity:0 }}>{t?"Profile Updated!":"Welcome Aboard!"}</p>
          <p style={{ color:"rgba(125,211,252,.7)",fontSize:13,marginBottom:22,animation:"fadeUp .5s ease .7s both",opacity:0 }}>Member {t?"details have been updated.":"has been added to the trip."}</p>
          <button onClick={onClose} style={{ width:"100%",padding:"11px",borderRadius:12,fontWeight:700,fontSize:13,background:"linear-gradient(90deg,#0284c7,#0369a1)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 8px 24px rgba(2,132,199,.44)",animation:"fadeUp .5s ease .85s both",opacity:0 }}>👤 Great!</button>
        </div>
      </div>
    </div>, document.body
  );
}

/* 6. ADMINS ─────────── shield drop */
function AdminsPopup({ type, onClose }) {
  const t = type === "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(12,2,2,.92)" }} onClick={onClose}>
      <div className="absolute w-72 h-72 rounded-full pointer-events-none"
        style={{ background:"radial-gradient(circle,rgba(239,68,68,.12),transparent 70%)" }} />
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#1c0808,#220e0e)",border:"1px solid rgba(239,68,68,.32)",
          boxShadow:"0 28px 70px rgba(0,0,0,.88),0 0 45px rgba(239,68,68,.12)",
          animation:"cardSlideUp .7s cubic-bezier(.3,1.3,.6,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#dc2626,#b91c1c,#7f1d1d)" }} />
        <div className="px-7 py-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ width:80,height:90,animation:"shieldDrop .7s cubic-bezier(.34,1.2,.64,1) .2s both",opacity:0 }}>
            <ShieldIllustration />
          </div>
          <p style={{ fontSize:10,letterSpacing:"0.3em",color:"#f87171",fontWeight:700,textTransform:"uppercase",animation:"fadeUp .5s ease .65s both",opacity:0 }}>Admin {t?"Updated":"Granted"}</p>
          <p style={{ color:"#fff",fontWeight:800,fontSize:18,margin:"6px 0 4px",animation:"fadeUp .5s ease .8s both",opacity:0 }}>{t?"Permissions Updated!":"Access Granted!"}</p>
          <p style={{ color:"rgba(252,165,165,.7)",fontSize:13,marginBottom:22,animation:"fadeUp .5s ease .95s both",opacity:0 }}>Admin {t?"profile has been updated.":"has been added with full access."}</p>
          <button onClick={onClose} style={{ width:"100%",padding:"11px",borderRadius:12,fontWeight:700,fontSize:13,background:"linear-gradient(90deg,#dc2626,#b91c1c)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 8px 24px rgba(220,38,38,.44)",animation:"fadeUp .5s ease 1.1s both",opacity:0 }}>🛡️ Confirmed!</button>
        </div>
      </div>
    </div>, document.body
  );
}

/* 7. ATTENDANCE ─────── scanner check-in */
function AttendancePopup({ type, onClose }) {
  const t = type === "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(4,8,4,.93)" }} onClick={onClose}>
      <div className="absolute inset-0 pointer-events-none" style={{ opacity:.04,
        backgroundImage:"linear-gradient(#f59e0b 1px,transparent 1px),linear-gradient(90deg,#f59e0b 1px,transparent 1px)",
        backgroundSize:"24px 24px" }} />
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#171208,#1e1810)",border:"1px solid rgba(245,158,11,.28)",
          boxShadow:"0 28px 70px rgba(0,0,0,.85),0 0 40px rgba(245,158,11,.1)",
          animation:"cardSlideUp .7s cubic-bezier(.3,1.3,.6,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#f59e0b,#d97706,#fbbf24)" }} />
        <div className="px-7 py-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ width:80,height:88,animation:"bounceIn .7s cubic-bezier(.34,1.4,.64,1) .2s both",opacity:0 }}>
            <ScannerIllustration />
          </div>
          <p style={{ fontSize:10,letterSpacing:"0.3em",color:"#fbbf24",fontWeight:700,textTransform:"uppercase",animation:"fadeUp .5s ease .6s both",opacity:0 }}>Attendance {t?"Updated":"Marked"}</p>
          <p style={{ color:"#fff",fontWeight:800,fontSize:18,margin:"6px 0 4px",animation:"fadeUp .5s ease .75s both",opacity:0 }}>{t?"Record Updated!":"Checked In!"}</p>
          <p style={{ color:"rgba(253,230,138,.7)",fontSize:13,marginBottom:22,animation:"fadeUp .5s ease .9s both",opacity:0 }}>Attendance has been {t?"updated in":"recorded in"} the system.</p>
          <button onClick={onClose} style={{ width:"100%",padding:"11px",borderRadius:12,fontWeight:700,fontSize:13,background:"linear-gradient(90deg,#d97706,#b45309)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 8px 24px rgba(217,119,6,.44)",animation:"fadeUp .5s ease 1.05s both",opacity:0 }}>✅ Confirmed!</button>
        </div>
      </div>
    </div>, document.body
  );
}

/* 8. TASKS ──────────── animated checklist */
function TasksPopup({ type, onClose }) {
  const t = type === "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(5,2,12,.92)" }} onClick={onClose}>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#130e2a,#190d36)",border:"1px solid rgba(124,58,237,.3)",
          boxShadow:"0 28px 70px rgba(0,0,0,.88),0 0 45px rgba(124,58,237,.12)",
          animation:"spinFlip .9s cubic-bezier(.2,1.2,.5,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#7c3aed,#6d28d9,#8b5cf6)" }} />
        <div className="px-7 py-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ animation:"bounceIn .6s ease .1s both",opacity:0 }}>
            <ChecklistIllustration />
          </div>
          <p style={{ fontSize:10,letterSpacing:"0.3em",color:"#a78bfa",fontWeight:700,textTransform:"uppercase",animation:"fadeUp .5s ease .6s both",opacity:0 }}>Task {t?"Updated":"Created"}</p>
          <p style={{ color:"#fff",fontWeight:800,fontSize:18,margin:"6px 0 4px",animation:"fadeUp .5s ease .75s both",opacity:0 }}>{t?"Task Updated!":"Task Added!"}</p>
          <p style={{ color:"rgba(196,181,253,.7)",fontSize:13,marginBottom:22,animation:"fadeUp .5s ease .9s both",opacity:0 }}>Task has been {t?"updated in":"added to"} the trip to-do list.</p>
          <button onClick={onClose} style={{ width:"100%",padding:"11px",borderRadius:12,fontWeight:700,fontSize:13,background:"linear-gradient(90deg,#7c3aed,#6d28d9)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 8px 24px rgba(124,58,237,.45)",animation:"fadeUp .5s ease 1.05s both",opacity:0 }}>✅ Let's Do It!</button>
        </div>
      </div>
    </div>, document.body
  );
}

/* 9. EXPENSES ────────── wallet & coins */
function ExpensesPopup({ type, onClose }) {
  const t = type === "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(2,8,4,.93)" }} onClick={onClose}>
      <div className="absolute w-72 h-72 rounded-full pointer-events-none"
        style={{ background:"radial-gradient(circle,rgba(5,150,105,.12),transparent 70%)" }} />
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#062d20,#083d2c)",border:"1px solid rgba(5,150,105,.3)",
          boxShadow:"0 28px 70px rgba(0,0,0,.85),0 0 40px rgba(5,150,105,.1)",
          animation:"cardLand .75s cubic-bezier(.3,1.4,.6,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#059669,#047857,#10b981)" }} />
        <div className="px-7 py-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ height:80,animation:"walletOpen .7s cubic-bezier(.34,1.3,.64,1) .1s both",opacity:0 }}>
            <WalletIllustration />
          </div>
          <p style={{ fontSize:10,letterSpacing:"0.3em",color:"#34d399",fontWeight:700,textTransform:"uppercase",animation:"fadeUp .5s ease .55s both",opacity:0 }}>Expense {t?"Updated":"Logged"}</p>
          <p style={{ color:"#fff",fontWeight:800,fontSize:18,margin:"6px 0 4px",animation:"fadeUp .5s ease .7s both",opacity:0 }}>{t?"Expense Updated!":"Expense Recorded!"}</p>
          <p style={{ color:"rgba(110,231,183,.7)",fontSize:13,marginBottom:22,animation:"fadeUp .5s ease .85s both",opacity:0 }}>Amount has been {t?"updated in":"added to"} the trip ledger.</p>
          <button onClick={onClose} style={{ width:"100%",padding:"11px",borderRadius:12,fontWeight:700,fontSize:13,background:"linear-gradient(90deg,#059669,#047857)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 8px 24px rgba(5,150,105,.44)",animation:"fadeUp .5s ease 1s both",opacity:0 }}>💰 Got It!</button>
        </div>
      </div>
    </div>, document.body
  );
}

/* 10. GALLERY ──────── camera shutter flash */
function GalleryPopup({ type, onClose }) {
  const t = type === "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(2,4,10,.93)" }} onClick={onClose}>
      {/* Flash effect */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background:"rgba(255,255,255,.12)",animation:"flashBurst .5s ease .3s both" }} />
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#0f1520,#141d2e)",border:"1px solid rgba(99,102,241,.3)",
          boxShadow:"0 28px 70px rgba(0,0,0,.88),0 0 40px rgba(99,102,241,.12)",
          animation:"cardSlideUp .7s cubic-bezier(.3,1.3,.6,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#6366f1,#8b5cf6,#a78bfa)" }} />
        <div className="px-7 py-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ animation:"bounceIn .6s cubic-bezier(.34,1.4,.64,1) .25s both",opacity:0 }}>
            <CameraIllustration />
          </div>
          <p style={{ fontSize:10,letterSpacing:"0.3em",color:"#a78bfa",fontWeight:700,textTransform:"uppercase",animation:"fadeUp .5s ease .6s both",opacity:0 }}>Photo {t?"Updated":"Captured"}</p>
          <p style={{ color:"#fff",fontWeight:800,fontSize:18,margin:"6px 0 4px",animation:"fadeUp .5s ease .75s both",opacity:0 }}>{t?"Photo Updated!":"Photo Saved!"}</p>
          <p style={{ color:"rgba(196,181,253,.7)",fontSize:13,marginBottom:22,animation:"fadeUp .5s ease .9s both",opacity:0 }}>{t?"The photo has been updated.":"Captured and saved to the trip gallery."}</p>
          <button onClick={onClose} style={{ width:"100%",padding:"11px",borderRadius:12,fontWeight:700,fontSize:13,background:"linear-gradient(90deg,#6366f1,#4f46e5)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 8px 24px rgba(99,102,241,.45)",animation:"fadeUp .5s ease 1.05s both",opacity:0 }}>📷 Click!</button>
        </div>
      </div>
    </div>, document.body
  );
}

/* 11. CHECKLIST ─────── backpack packing */
function ChecklistPopup({ type, onClose }) {
  const t = type === "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(8,4,2,.93)" }} onClick={onClose}>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#1c100a,#241510)",border:"1px solid rgba(249,115,22,.3)",
          boxShadow:"0 28px 70px rgba(0,0,0,.88),0 0 40px rgba(249,115,22,.1)",
          animation:"cardSlideUp .7s cubic-bezier(.3,1.3,.6,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#f97316,#ea580c,#fb923c)" }} />
        <div className="px-7 py-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ animation:"backpackDrop .7s cubic-bezier(.34,1.3,.64,1) .2s both",opacity:0 }}>
            <BackpackIllustration />
          </div>
          <p style={{ fontSize:10,letterSpacing:"0.3em",color:"#fb923c",fontWeight:700,textTransform:"uppercase",animation:"fadeUp .5s ease .65s both",opacity:0 }}>Packing List {t?"Updated":"Added"}</p>
          <p style={{ color:"#fff",fontWeight:800,fontSize:18,margin:"6px 0 4px",animation:"fadeUp .5s ease .8s both",opacity:0 }}>{t?"Item Updated!":"Item Added!"}</p>
          <p style={{ color:"rgba(253,186,116,.7)",fontSize:13,marginBottom:22,animation:"fadeUp .5s ease .95s both",opacity:0 }}>Checklist item has been {t?"updated.":"added to the packing list."}</p>
          <button onClick={onClose} style={{ width:"100%",padding:"11px",borderRadius:12,fontWeight:700,fontSize:13,background:"linear-gradient(90deg,#f97316,#ea580c)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 8px 24px rgba(249,115,22,.44)",animation:"fadeUp .5s ease 1.1s both",opacity:0 }}>🧳 Packed!</button>
        </div>
      </div>
    </div>, document.body
  );
}

/* 12. POLLS ──────────── bar chart reveal */
function PollsPopup({ type, onClose }) {
  const t = type === "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(2,6,16,.93)" }} onClick={onClose}>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#0a1228,#0e1838)",border:"1px solid rgba(59,130,246,.28)",
          boxShadow:"0 28px 70px rgba(0,0,0,.88),0 0 40px rgba(59,130,246,.1)",
          animation:"cardSlideUp .7s cubic-bezier(.3,1.3,.6,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#3b82f6,#6366f1,#8b5cf6)" }} />
        <div className="px-7 py-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ animation:"bounceIn .5s ease .1s both",opacity:0 }}>
            <BarChartIllustration />
          </div>
          <p style={{ fontSize:10,letterSpacing:"0.3em",color:"#60a5fa",fontWeight:700,textTransform:"uppercase",animation:"fadeUp .5s ease .55s both",opacity:0 }}>Poll {t?"Updated":"Published"}</p>
          <p style={{ color:"#fff",fontWeight:800,fontSize:18,margin:"6px 0 4px",animation:"fadeUp .5s ease .7s both",opacity:0 }}>{t?"Poll Updated!":"Vote's Live!"}</p>
          <p style={{ color:"rgba(147,197,253,.7)",fontSize:13,marginBottom:22,animation:"fadeUp .5s ease .85s both",opacity:0 }}>Poll has been {t?"updated for":"published to"} all trip members.</p>
          <button onClick={onClose} style={{ width:"100%",padding:"11px",borderRadius:12,fontWeight:700,fontSize:13,background:"linear-gradient(90deg,#3b82f6,#2563eb)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 8px 24px rgba(59,130,246,.44)",animation:"fadeUp .5s ease 1s both",opacity:0 }}>🗳️ Perfect!</button>
        </div>
      </div>
    </div>, document.body
  );
}

/* 13. SHARE COLLECTION ─ payment card */
function ShareCollectionPopup({ type, onClose }) {
  const t = type === "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(2,8,12,.93)" }} onClick={onClose}>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#051824,#081e2e)",border:"1px solid rgba(8,145,178,.3)",
          boxShadow:"0 28px 70px rgba(0,0,0,.88),0 0 40px rgba(8,145,178,.12)",
          animation:"cardLand .75s cubic-bezier(.3,1.4,.6,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#0891b2,#0e7490,#06b6d4)" }} />
        <div className="px-7 py-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ height:80,animation:"bounceIn .6s ease .1s both",opacity:0 }}>
            <PaymentIllustration />
          </div>
          <p style={{ fontSize:10,letterSpacing:"0.3em",color:"#22d3ee",fontWeight:700,textTransform:"uppercase",animation:"fadeUp .5s ease .55s both",opacity:0 }}>Share {t?"Updated":"Collected"}</p>
          <p style={{ color:"#fff",fontWeight:800,fontSize:18,margin:"6px 0 4px",animation:"fadeUp .5s ease .7s both",opacity:0 }}>{t?"Share Updated!":"Payment Confirmed!"}</p>
          <p style={{ color:"rgba(103,232,249,.7)",fontSize:13,marginBottom:22,animation:"fadeUp .5s ease .85s both",opacity:0 }}>Share collection has been {t?"updated.":"recorded successfully."}</p>
          <button onClick={onClose} style={{ width:"100%",padding:"11px",borderRadius:12,fontWeight:700,fontSize:13,background:"linear-gradient(90deg,#0891b2,#0e7490)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 8px 24px rgba(8,145,178,.44)",animation:"fadeUp .5s ease 1s both",opacity:0 }}>💳 Collected!</button>
        </div>
      </div>
    </div>, document.body
  );
}

/* 14. ALARMS ──────────── bell + sound waves */
function AlarmsPopup({ type, onClose }) {
  const t = type === "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(6,4,2,.93)" }} onClick={onClose}>
      <div className="absolute w-72 h-72 rounded-full pointer-events-none"
        style={{ background:"radial-gradient(circle,rgba(245,158,11,.1),transparent 70%)" }} />
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#1a1004,#201406)",border:"1px solid rgba(245,158,11,.3)",
          boxShadow:"0 28px 70px rgba(0,0,0,.88),0 0 40px rgba(245,158,11,.1)",
          animation:"cardSlideUp .7s cubic-bezier(.3,1.3,.6,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#f59e0b,#d97706,#fbbf24)" }} />
        <div className="px-7 py-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ width:80,height:88,animation:"bounceIn .6s cubic-bezier(.34,1.4,.64,1) .2s both",opacity:0 }}>
            <BellIllustration />
          </div>
          <p style={{ fontSize:10,letterSpacing:"0.3em",color:"#fbbf24",fontWeight:700,textTransform:"uppercase",animation:"fadeUp .5s ease .65s both",opacity:0 }}>Alarm {t?"Updated":"Set"}</p>
          <p style={{ color:"#fff",fontWeight:800,fontSize:18,margin:"6px 0 4px",animation:"fadeUp .5s ease .8s both",opacity:0 }}>{t?"Alarm Updated!":"Alarm Set!"}</p>
          <p style={{ color:"rgba(253,230,138,.7)",fontSize:13,marginBottom:22,animation:"fadeUp .5s ease .95s both",opacity:0 }}>Your alarm has been {t?"updated.":"scheduled successfully."}</p>
          <button onClick={onClose} style={{ width:"100%",padding:"11px",borderRadius:12,fontWeight:700,fontSize:13,background:"linear-gradient(90deg,#d97706,#b45309)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 8px 24px rgba(217,119,6,.44)",animation:"fadeUp .5s ease 1.1s both",opacity:0 }}>⏰ All Set!</button>
        </div>
      </div>
    </div>, document.body
  );
}

/* ─── Master config ──────────────────────────────────────────────────────────── */
const MASTERS = [
  { key:"trip",      label:"Trip",             icon:"✈️", color:"#3b82f6", bg:"from-[#091640]",  Popup:TripPopup,           desc:"Realistic airplane flies across night sky · Card lands" },
  { key:"vehicles",  label:"Vehicles",          icon:"🚌", color:"#4ade80", bg:"from-[#0d2210]",  Popup:VehiclesPopup,       desc:"Detailed bus drives across mountain road at night" },
  { key:"itinerary", label:"Itinerary",         icon:"🧭", color:"#10b981", bg:"from-[#0b2018]",  Popup:ItineraryPopup,      desc:"Animated compass spins · Ripple rings · Map grid" },
  { key:"groups",    label:"Groups",            icon:"👥", color:"#06b6d4", bg:"from-[#0e2436]",  Popup:GroupsPopup,         desc:"3 person SVGs walk in and form a team · 3D spin card" },
  { key:"members",   label:"Members",           icon:"👤", color:"#38bdf8", bg:"from-[#101e44]",  Popup:MembersPopup,        desc:"Realistic ID card with avatar and member badge" },
  { key:"admins",    label:"Admins",            icon:"🛡️", color:"#f87171", bg:"from-[#220e0e]",  Popup:AdminsPopup,         desc:"Detailed shield drops with lock & pulsing red glow" },
  { key:"attendance",label:"Attendance",        icon:"🔍", color:"#fbbf24", bg:"from-[#1e1810]",  Popup:AttendancePopup,     desc:"Fingerprint scanner with animated scan beam" },
  { key:"tasks",     label:"Tasks",             icon:"📋", color:"#a78bfa", bg:"from-[#190d36]",  Popup:TasksPopup,          desc:"Clipboard with animated items checking off one by one" },
  { key:"expenses",  label:"Expenses",          icon:"💰", color:"#34d399", bg:"from-[#083d2c]",  Popup:ExpensesPopup,       desc:"Wallet opens · Coins fall into it · Amount shows" },
  { key:"gallery",   label:"Gallery",           icon:"📷", color:"#a78bfa", bg:"from-[#141d2e]",  Popup:GalleryPopup,        desc:"Realistic camera with lens aperture · Screen flash" },
  { key:"checklist", label:"Checklist",         icon:"🧳", color:"#fb923c", bg:"from-[#241510]",  Popup:ChecklistPopup,      desc:"Detailed backpack drops in · Check badge pops on" },
  { key:"polls",     label:"Polls",             icon:"📊", color:"#60a5fa", bg:"from-[#0e1838]",  Popup:PollsPopup,          desc:"Bar chart bars grow from zero with percentage labels" },
  { key:"share",     label:"Share Collection",  icon:"💳", color:"#22d3ee", bg:"from-[#081e2e]",  Popup:ShareCollectionPopup,desc:"Credit card swipes in · Pay waves radiate · Confirmed" },
  { key:"alarms",    label:"Alarms",            icon:"⏰", color:"#fbbf24", bg:"from-[#201406]",  Popup:AlarmsPopup,         desc:"Bell swings realistically · Sound waves pulse outward" },
];

/* ─── Sample preview page ────────────────────────────────────────────────────── */
export default function PopupPreviewPage() {
  const [active, setActive] = useState(null); // { key, type }
  const ActiveConfig = active ? MASTERS.find(m => m.key === active.key) : null;

  useEffect(() => {
    const id = "popup-preview-kf";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id; s.textContent = KF;
      document.head.appendChild(s);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#07090f] text-white p-5 md:p-10">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-900/40 border border-emerald-700/30 flex items-center justify-center text-lg">✈️</div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Master Success Popups — Preview</p>
        </div>
        <h1 className="text-3xl font-black text-white mb-2">All Master Popup Designs</h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Each master has its own themed, animated success popup with realistic SVG illustrations.
          Click <span className="text-emerald-400 font-semibold">Add</span> or <span className="text-emerald-400 font-semibold">Edit</span> to preview the live animation.
          Confirm and I'll implement all of them.
        </p>
      </div>

      {/* Master cards grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MASTERS.map((m) => (
          <div key={m.key}
            className={`rounded-2xl border border-slate-800 bg-gradient-to-br ${m.bg} to-slate-900/40 overflow-hidden hover:border-slate-700 transition-all group`}>
            {/* Thumbnail */}
            <div className="h-28 relative flex items-center justify-center border-b border-slate-800/60 overflow-hidden">
              <div className="text-5xl opacity-30 select-none group-hover:opacity-50 transition-opacity">{m.icon}</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background:`${m.color}18`, border:`1.5px solid ${m.color}40`,
                    boxShadow:`0 0 18px ${m.color}30` }}>
                  {m.icon}
                </div>
              </div>
              <div className="absolute bottom-2 left-3">
                <span className="text-[10px] font-black text-white/25">{m.label.toUpperCase()}</span>
              </div>
            </div>
            {/* Info */}
            <div className="p-4 space-y-2.5">
              <p className="font-bold text-white text-sm">{m.label} Master</p>
              <p className="text-slate-500 text-[11px] leading-relaxed">{m.desc}</p>
              <div className="flex gap-2">
                <button onClick={() => setActive({ key:m.key, type:"add" })}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background:`${m.color}22`, color:m.color, border:`1px solid ${m.color}35` }}
                  onMouseEnter={e=>e.target.style.background=`${m.color}38`}
                  onMouseLeave={e=>e.target.style.background=`${m.color}22`}>
                  + Add
                </button>
                <button onClick={() => setActive({ key:m.key, type:"edit" })}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors">
                  ✎ Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="max-w-6xl mx-auto mt-10 text-center text-slate-700 text-xs">
        14 masters · 28 popup variations (Add + Edit) · Realistic SVG illustrations · Pure CSS animations
      </p>

      {/* Active popup */}
      {active && ActiveConfig && (
        <ActiveConfig.Popup
          type={active.type}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}
