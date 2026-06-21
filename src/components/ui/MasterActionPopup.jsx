/**
 * Themed success popups for each master module.
 * Usage: <MasterActionPopup master="trip" action="add" onClose={fn} />
 * action: "add" | "edit"
 */
import { useEffect } from "react";
import { createPortal } from "react-dom";

/* ─── Shared star field ───────────────────────────────────── */
const STARS = Array.from({ length: 28 }, (_, i) => ({
  x:    ((i * 37 + 11) % 97) + 1,
  y:    ((i * 53 + 7)  % 91) + 3,
  size: 1.0 + (i % 4) * 0.7,
  delay:`${((i * 0.41) % 3).toFixed(2)}s`,
  dur:  `${(1.5 + (i % 5) * 0.4).toFixed(1)}s`,
}));

/* ─── All CSS keyframes (injected once) ───────────────────── */
const KF = `
@keyframes mapKfStarTwinkle{0%,100%{opacity:.1;transform:scale(.7);}50%{opacity:1;transform:scale(1.4);}}
@keyframes mapKfPlaneFly{0%{transform:translate(-55vw,0)rotate(-12deg);opacity:0;}6%{opacity:1;}50%{transform:translate(0,-30px)rotate(-14deg);}94%{opacity:1;}100%{transform:translate(55vw,-70px)rotate(-22deg);opacity:0;}}
@keyframes mapKfTrailFade{0%{width:0;opacity:0;}22%{width:160px;opacity:.5;}70%{width:110px;opacity:.25;}100%{width:30px;opacity:0;}}
@keyframes mapKfBusRide{0%{transform:translateX(-58vw);opacity:0;}7%{opacity:1;}93%{opacity:1;}100%{transform:translateX(58vw);opacity:0;}}
@keyframes mapKfBusBounce{0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);}}
@keyframes mapKfRoadScroll{100%{background-position:200px 0;}}
@keyframes mapKfCardLand{0%{transform:translateY(60px)scale(.92);opacity:0;}55%{transform:translateY(-8px)scale(1.01);opacity:1;}76%{transform:translateY(4px);}100%{transform:translateY(0)scale(1);opacity:1;}}
@keyframes mapKfCardSlide{0%{transform:translateY(80px);opacity:0;}100%{transform:translateY(0);opacity:1;}}
@keyframes mapKfSpinFlip{0%{transform:perspective(900px)rotateY(-180deg)scale(.22);opacity:0;}55%{transform:perspective(900px)rotateY(18deg)scale(1.04);opacity:1;}75%{transform:perspective(900px)rotateY(-9deg)scale(.97);}90%{transform:perspective(900px)rotateY(4deg);}100%{transform:perspective(900px)rotateY(0)scale(1);opacity:1;}}
@keyframes mapKfFadeUp{0%{transform:translateY(16px);opacity:0;}100%{transform:translateY(0);opacity:1;}}
@keyframes mapKfPinDrop{0%{transform:translateY(-100px)scale(.85);opacity:0;}60%{transform:translateY(12px)scale(1.05);opacity:1;}78%{transform:translateY(-8px);}90%{transform:translateY(4px);}100%{transform:translateY(0)scale(1);opacity:1;}}
@keyframes mapKfRipple{0%{transform:scale(.15);opacity:.85;}100%{transform:scale(3.2);opacity:0;}}
@keyframes mapKfBounceIn{0%{transform:scale(0)rotate(-18deg);opacity:0;}55%{transform:scale(1.28)rotate(6deg);opacity:1;}72%{transform:scale(.9)rotate(-2deg);}87%{transform:scale(1.05);}100%{transform:scale(1)rotate(0);opacity:1;}}
@keyframes mapKfShieldDrop{0%{transform:translateY(-120px)scale(.8);opacity:0;}60%{transform:translateY(8px)scale(1.05);opacity:1;}78%{transform:translateY(-5px);}100%{transform:translateY(0)scale(1);opacity:1;}}
@keyframes mapKfScanLine{0%{top:0%;}50%{top:90%;}100%{top:0%;}}
@keyframes mapKfCheckTick{0%{stroke-dashoffset:40;}100%{stroke-dashoffset:0;}}
@keyframes mapKfBarGrow{0%{transform:scaleY(0);}100%{transform:scaleY(1);}}
@keyframes mapKfCoinFall{0%{transform:translateY(-60px)rotate(0deg);opacity:1;}80%{opacity:1;}100%{transform:translateY(0)rotate(var(--cr,180deg));opacity:0.7;}}
@keyframes mapKfFlash{0%,100%{opacity:0;}50%{opacity:.7;}}
@keyframes mapKfBellSwing{0%{transform:rotate(0);}15%{transform:rotate(18deg);}30%{transform:rotate(-16deg);}45%{transform:rotate(12deg);}60%{transform:rotate(-8deg);}75%{transform:rotate(5deg);}90%{transform:rotate(-2deg);}100%{transform:rotate(0);}}
@keyframes mapKfSoundWave{0%{transform:scale(.4);opacity:.9;}100%{transform:scale(2.4);opacity:0;}}
@keyframes mapKfPersonWalk{0%{transform:translateX(-30px);opacity:0;}100%{transform:translateX(0);opacity:1;}}
@keyframes mapKfWalletOpen{0%{transform:rotateX(-60deg)scale(.8);opacity:0;}70%{transform:rotateX(8deg)scale(1.03);opacity:1;}100%{transform:rotateX(0)scale(1);opacity:1;}}
@keyframes mapKfCardSwipe{0%{transform:translateX(-80px)rotate(-8deg);opacity:0;}60%{transform:translateX(6px)rotate(1deg);opacity:1;}80%{transform:translateX(-3px);}100%{transform:translateX(0)rotate(0);opacity:1;}}
@keyframes mapKfPayWave{0%{transform:scale(.2);opacity:.8;}100%{transform:scale(2.6);opacity:0;}}
@keyframes mapKfBackpackDrop{0%{transform:translateY(-80px)scale(.9);opacity:0;}60%{transform:translateY(8px)scale(1.04);opacity:1;}80%{transform:translateY(-5px);}100%{transform:translateY(0)scale(1);opacity:1;}}
@keyframes mapKfCompassSpin{0%{transform:rotate(-180deg);}100%{transform:rotate(0);}}
@keyframes mapKfCloudFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-7px);}}
@keyframes mapKfRocketLaunch{0%{transform:translateY(80vh);opacity:0;}6%{opacity:1;transform:translateY(70vh);}40%{transform:translateY(0)scale(1.05);}70%{transform:translateY(-40vh)scale(.9);opacity:1;}100%{transform:translateY(-110vh)scale(.4);opacity:0;}}
@keyframes mapKfFlameDance{0%,100%{transform:scaleY(1)scaleX(1);}50%{transform:scaleY(1.35)scaleX(.78);}}
@keyframes mapKfSpeedLine{0%{transform:translateY(0);opacity:0;}15%{opacity:.65;}100%{transform:translateY(110vh);opacity:0;}}
@keyframes mapKfOceanWave{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
@keyframes mapKfSonar{0%{transform:scale(.15);opacity:.8;}100%{transform:scale(3.2);opacity:0;}}
@keyframes mapKfShipBob{0%,100%{transform:translateY(0)rotate(-1.5deg);}50%{transform:translateY(-10px)rotate(2deg);}}
@keyframes mapKfWakeLine{0%{width:0;opacity:0;}40%{opacity:.7;}100%{width:120px;opacity:0;}}
@keyframes mapKfVaultOpen{0%{transform:perspective(600px)rotateY(-90deg);opacity:0;}60%{transform:perspective(600px)rotateY(8deg);opacity:1;}80%{transform:perspective(600px)rotateY(-4deg);}100%{transform:perspective(600px)rotateY(0);opacity:1;}}
@keyframes mapKfWheelSpin{0%{transform:rotate(-720deg);}100%{transform:rotate(0);}}
@keyframes mapKfCoinBlast{0%{transform:translate(var(--ox),var(--oy))scale(0)rotate(0deg);opacity:0;}35%{transform:translate(0,0)scale(1.3)rotate(var(--r));opacity:1;}52%{transform:translate(0,0)scale(.92)rotate(var(--r));}65%{transform:translate(0,0)scale(1)rotate(var(--r));}100%{transform:translate(0,0)scale(1)rotate(var(--r));opacity:.88;}}
@keyframes mapKfCoinPulse{0%,100%{opacity:.75;transform:translate(0,0)rotate(var(--r));}50%{opacity:1;transform:translate(0,-7px)rotate(var(--r));}}
`;

function useKF() {
  useEffect(() => {
    const id = "master-popup-kf";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id; s.textContent = KF;
      document.head.appendChild(s);
    }
  }, []);
}

/* ─── SVG Illustrations ───────────────────────────────────── */
function PlaneIllustration() {
  return (
    <svg width="200" height="72" viewBox="0 0 200 72" style={{ filter:"drop-shadow(0 6px 16px rgba(0,0,0,.6))" }}>
      <defs>
        <linearGradient id="mpBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f0f4ff" />
          <stop offset="50%"  stopColor="#dde8ff" />
          <stop offset="100%" stopColor="#b4c8e8" />
        </linearGradient>
        <linearGradient id="mpWing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#c8d8f0" />
          <stop offset="100%" stopColor="#7a9cbd" />
        </linearGradient>
        <linearGradient id="mpEng" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#9ca3af" />
          <stop offset="60%"  stopColor="#4b5563" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>
        <radialGradient id="mpGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#bfdbfe" stopOpacity=".7" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="mpShadow"><feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity=".35"/></filter>
      </defs>
      <ellipse cx="14" cy="38" rx="10" ry="5" fill="url(#mpGlow)" opacity=".55" />
      <ellipse cx="14" cy="52" rx="7"  ry="3.5" fill="url(#mpGlow)" opacity=".38" />
      <path d="M22 30 Q12 30 7 36 Q4 38 7 42 Q12 46 22 44 L172 38 Q185 37 192 36 Q196 36 198 36 Q196 37 192 38 L172 40 Z" fill="url(#mpBody)" filter="url(#mpShadow)" />
      <path d="M190 36 Q197 36 200 37 Q197 38 190 38" fill="#d1dff5" />
      <path d="M88 37 L42 10 L62 36 L42 62 Z" fill="url(#mpWing)" filter="url(#mpShadow)" />
      <ellipse cx="52" cy="50" rx="14" ry="5.5" fill="url(#mpEng)" />
      <ellipse cx="52" cy="50" rx="7"  ry="4.5" fill="#1f2937" />
      <ellipse cx="52" cy="50" rx="3"  ry="3" fill="#374151" />
      <ellipse cx="63" cy="50" rx="3.5" ry="5" fill="#6b7280" stroke="#9ca3af" strokeWidth=".5" />
      <path d="M88 37 L95 28 L100 36 L95 44 Z" fill="url(#mpWing)" opacity=".6" />
      <ellipse cx="91" cy="44" rx="7" ry="2.5" fill="url(#mpEng)" opacity=".6" />
      <path d="M24 37 L12 18 L30 36 Z" fill="url(#mpWing)" filter="url(#mpShadow)" />
      <path d="M24 37 L12 56 L30 38 Z" fill="url(#mpWing)" filter="url(#mpShadow)" />
      <path d="M20 37 L14 16 L26 36" fill="url(#mpWing)" opacity=".85" />
      <path d="M30 36.5 L170 34.5 L170 36 L30 38 Z" fill="rgba(59,130,246,.6)" />
      <path d="M30 38 L170 36 L170 37.5 L30 39.5 Z" fill="rgba(37,99,235,.38)" />
      {[100,113,126,139,152,163].map((x, i) => (
        <rect key={i} x={x} y="33" width="7" height="5" rx="2" fill={`rgba(186,230,253,${.7-i*.04})`} />
      ))}
      <ellipse cx="178" cy="36" rx="5" ry="3.5" fill="rgba(186,230,253,.5)" />
      <circle cx="197" cy="37" r="3" fill="rgba(253,224,71,.95)" style={{ filter:"blur(1px) drop-shadow(0 0 5px rgba(253,224,71,.8))" }} />
    </svg>
  );
}

function BusIllustration() {
  return (
    <svg width="110" height="56" viewBox="0 0 110 56" style={{ filter:"drop-shadow(0 5px 12px rgba(0,0,0,.55))" }}>
      <defs>
        <linearGradient id="mpBBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1a6b2e" />
          <stop offset="40%"  stopColor="#16542c" />
          <stop offset="100%" stopColor="#0f3d1f" />
        </linearGradient>
        <linearGradient id="mpBRoof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#27824a" />
          <stop offset="100%" stopColor="#1a6b2e" />
        </linearGradient>
        <linearGradient id="mpBWheel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#374151" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
      </defs>
      <ellipse cx="55" cy="54" rx="48" ry="3" fill="rgba(0,0,0,.3)" />
      <rect x="2" y="7" width="106" height="36" rx="5" fill="url(#mpBBody)" />
      <rect x="2" y="7" width="106" height="14" rx="5" fill="url(#mpBRoof)" />
      <rect x="90" y="12" width="16" height="22" rx="3" fill="rgba(255,255,255,.08)" />
      <rect x="92" y="14" width="12" height="10" rx="2" fill="rgba(147,210,190,.5)" />
      <ellipse cx="104" cy="30" rx="4" ry="3" fill="rgba(253,224,71,.85)" style={{ filter:"blur(.8px)" }} />
      {[8,24,40,56,72].map((x,i) => (
        <rect key={i} x={x} y="11" width="13" height="9" rx="2" fill={`rgba(167,226,200,${.5-i*.03})`} />
      ))}
      <rect x="22" y="22" width="10" height="18" rx="2" fill="rgba(255,255,255,.07)" />
      <line x1="27" y1="22" x2="27" y2="40" stroke="rgba(255,255,255,.15)" strokeWidth="1" />
      <rect x="7" y="7.5" width="55" height="5" rx="1.5" fill="rgba(0,0,0,.35)" />
      <rect x="9" y="8.5" width="30" height="3" rx="1" fill="rgba(74,222,128,.4)" />
      <rect x="2" y="28" width="88" height="2.5" fill="rgba(74,222,128,.25)" />
      {[20,76].map((cx,i) => (
        <g key={i}>
          <circle cx={cx} cy="46" r="9" fill="url(#mpBWheel)" />
          <circle cx={cx} cy="46" r="5" fill="#1f2937" />
          <circle cx={cx} cy="46" r="3" fill="#374151" />
          {[0,60,120,180,240,300].map(a => (
            <line key={a}
              x1={cx+Math.cos(a*Math.PI/180)*3} y1={46+Math.sin(a*Math.PI/180)*3}
              x2={cx+Math.cos(a*Math.PI/180)*7.5} y2={46+Math.sin(a*Math.PI/180)*7.5}
              stroke="rgba(74,222,128,.4)" strokeWidth=".8" />
          ))}
          <circle cx={cx} cy="46" r="9" fill="none" stroke="#4ade80" strokeWidth="1" opacity=".5" />
        </g>
      ))}
      <rect x="3" y="38" width="5" height="3" rx="1" fill="#374151" />
    </svg>
  );
}

function CompassSVG() {
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <defs>
        <radialGradient id="mpCFace" cx="50%" cy="40%" r="55%">
          <stop offset="0%"   stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
      </defs>
      <circle cx="44" cy="44" r="42" fill="none" stroke="rgba(16,185,129,.25)" strokeWidth="2" />
      <circle cx="44" cy="44" r="40" fill="url(#mpCFace)" style={{ filter:"drop-shadow(0 4px 16px rgba(0,0,0,.5))" }} />
      <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(16,185,129,.15)" strokeWidth="1" />
      {Array.from({length:36},(_,i)=>{
        const a=i*10*Math.PI/180,r1=i%9===0?30:i%3===0?32:34;
        return <line key={i} x1={44+Math.cos(a)*r1} y1={44+Math.sin(a)*r1} x2={44+Math.cos(a)*37} y2={44+Math.sin(a)*37} stroke={i%9===0?"rgba(16,185,129,.6)":"rgba(255,255,255,.12)"} strokeWidth={i%9===0?1.5:.8}/>;
      })}
      {[{l:"N",a:-90,c:"#10b981"},{l:"S",a:90,c:"#94a3b8"},{l:"E",a:0,c:"#94a3b8"},{l:"W",a:180,c:"#94a3b8"}].map(({l,a,c})=>(
        <text key={l} x={44+Math.cos(a*Math.PI/180)*26} y={44+Math.sin(a*Math.PI/180)*26+4} fontSize="9" fill={c} textAnchor="middle" fontWeight="bold">{l}</text>
      ))}
      <g style={{ transformOrigin:"44px 44px", animation:"mapKfCompassSpin .8s cubic-bezier(.34,1.2,.64,1) .3s both" }}>
        <path d="M44 44 L40 24 L44 18 L48 24 Z" fill="#ef4444" />
        <path d="M44 44 L40 64 L44 70 L48 64 Z" fill="rgba(255,255,255,.7)" />
      </g>
      <circle cx="44" cy="44" r="5" fill="#1e293b" stroke="rgba(16,185,129,.5)" strokeWidth="1.5" />
      <circle cx="44" cy="44" r="2.5" fill="#10b981" />
    </svg>
  );
}

function ShieldSVG() {
  return (
    <svg width="80" height="90" viewBox="0 0 80 90">
      <defs>
        <linearGradient id="mpShGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#dc2626" />
          <stop offset="50%"  stopColor="#b91c1c" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
        <linearGradient id="mpShShine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="rgba(255,255,255,.2)" />
          <stop offset="60%"  stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <ellipse cx="40" cy="87" rx="26" ry="3" fill="rgba(0,0,0,.3)" />
      <path d="M40 4 L74 18 L74 46 Q74 72 40 84 Q6 72 6 46 L6 18 Z" fill="url(#mpShGrad)" />
      <path d="M40 8 L70 20 L70 44 Q70 66 44 78 L44 8 Z" fill="url(#mpShShine)" />
      <path d="M40 10 L68 22 L68 46 Q68 68 40 80 Q12 68 12 46 L12 22 Z" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1.5" />
      <rect x="26" y="44" width="28" height="22" rx="4" fill="rgba(255,255,255,.2)" />
      <rect x="26" y="44" width="28" height="10" rx="4" fill="rgba(255,255,255,.28)" />
      <path d="M30 44 Q30 32 40 32 Q50 32 50 44" fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="40" cy="53" r="4" fill="rgba(255,255,255,.9)" />
      <rect x="38" y="54" width="4" height="6" rx="1" fill="rgba(255,255,255,.9)" />
    </svg>
  );
}

function ScannerSVG() {
  return (
    <svg width="80" height="88" viewBox="0 0 80 88">
      <rect x="4" y="8" width="72" height="72" rx="10" fill="#111827" style={{ filter:"drop-shadow(0 4px 12px rgba(0,0,0,.5))" }} />
      <rect x="4" y="8" width="72" height="8" rx="10" fill="#1f2937" />
      <rect x="6" y="10" width="68" height="4" rx="6" fill="#374151" />
      <rect x="10" y="18" width="60" height="58" rx="6" fill="#030712" />
      {[8,14,20,26,32].map((r,i)=>(
        <path key={i} d={`M40 ${52+r} Q${40-r} ${52} 40 ${52-r} Q${40+r} ${52} 40 ${52+r}`}
          fill="none" stroke="rgba(245,158,11,.35)" strokeWidth="1.2"
          style={{ animation:`mapKfFadeUp .3s ease ${.3+i*.1}s both`, opacity:0 }} />
      ))}
      <circle cx="40" cy="52" r="5" fill="rgba(245,158,11,.25)" />
      <rect x="12" y="20" width="56" height="2" rx="1" fill="rgba(245,158,11,.7)"
        style={{ animation:"mapKfScanLine 2s ease-in-out .5s infinite", position:"relative" }} />
      <circle cx="40" cy="72" r="4" fill="rgba(16,185,129,.7)"
        style={{ animation:"mapKfSoundWave 1.5s ease-out 1.5s infinite", transformOrigin:"40px 72px" }} />
      <circle cx="40" cy="72" r="2.5" fill="#10b981" />
    </svg>
  );
}

function ChecklistSVG() {
  return (
    <svg width="80" height="90" viewBox="0 0 80 90">
      <defs>
        <linearGradient id="mpClipGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#5b21b6" />
        </linearGradient>
      </defs>
      <rect x="8" y="12" width="64" height="76" rx="6" fill="#1e1b4b" style={{ filter:"drop-shadow(0 4px 12px rgba(0,0,0,.4))" }} />
      <rect x="8" y="12" width="64" height="8" rx="6" fill="url(#mpClipGrad)" />
      <rect x="28" y="8" width="24" height="10" rx="4" fill="#4c1d95" stroke="rgba(167,139,250,.3)" strokeWidth="1" />
      <rect x="32" y="10" width="16" height="6" rx="2" fill="#3b0764" />
      {[{y:30,done:true},{y:46,done:true},{y:62,done:false}].map((item,i)=>(
        <g key={i} style={{ animation:`mapKfFadeUp .5s ease ${.4+i*.25}s both`, opacity:0 }}>
          <rect x="16" y={item.y-5} width="12" height="12" rx="2.5"
            fill={item.done?"rgba(124,58,237,.4)":"rgba(255,255,255,.06)"}
            stroke={item.done?"#7c3aed":"rgba(255,255,255,.15)"} strokeWidth="1" />
          {item.done&&(
            <path d={`M18 ${item.y+1} L20 ${item.y+3} L26 ${item.y-2}`}
              stroke="#a78bfa" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="15"
              style={{ animation:`mapKfCheckTick .4s ease ${.5+i*.25}s both`, strokeDashoffset:15 }} />
          )}
          <rect x="32" y={item.y-4} width={item.done?36:30} height="10" rx="2" fill="rgba(255,255,255,.04)" />
          <rect x="34" y={item.y-1} width={item.done?26:20} height="4" rx="1.5"
            fill={item.done?"rgba(167,139,250,.5)":"rgba(255,255,255,.15)"} />
        </g>
      ))}
    </svg>
  );
}

function BarChartSVG() {
  const bars=[{h:55,color:"#3b82f6",pct:"54%"},{h:32,color:"#8b5cf6",pct:"31%"},{h:15,color:"#06b6d4",pct:"15%"}];
  return (
    <svg width="88" height="80" viewBox="0 0 88 80">
      {[20,40,60].map(y=><line key={y} x1="8" y1={80-y} x2="82" y2={80-y} stroke="rgba(255,255,255,.06)" strokeWidth="1"/>)}
      {bars.map((b,i)=>(
        <g key={i}>
          <rect x={14+i*26} y={80-b.h-4} width="18" height={b.h} rx="4" fill={b.color}
            style={{ transformOrigin:`${14+i*26+9}px 76px`,animation:`mapKfBarGrow .7s cubic-bezier(.34,1.2,.64,1) ${.2+i*.18}s both`,opacity:0,filter:`drop-shadow(0 0 8px ${b.color}60)` }} />
          <text x={14+i*26+9} y={80-b.h-8} fontSize="8" fill={b.color} textAnchor="middle" fontWeight="bold"
            style={{ animation:`mapKfFadeUp .4s ease ${.55+i*.18}s both`, opacity:0 }}>{b.pct}</text>
        </g>
      ))}
      <line x1="8" y1="76" x2="82" y2="76" stroke="rgba(255,255,255,.15)" strokeWidth="1.5"/>
    </svg>
  );
}

function GroupSVG() {
  return (
    <svg width="96" height="72" viewBox="0 0 96 72">
      <g style={{ animation:"mapKfPersonWalk .6s cubic-bezier(.34,1.2,.64,1) .1s both",opacity:0 }}>
        <circle cx="20" cy="18" r="10" fill="#0e7490"/><circle cx="20" cy="16" r="6" fill="#06b6d4"/>
        <path d="M8 50 Q8 32 20 30 Q32 32 32 50" fill="#0e7490"/>
      </g>
      <g style={{ animation:"mapKfBounceIn .6s cubic-bezier(.34,1.56,.64,1) .3s both",opacity:0 }}>
        <circle cx="48" cy="14" r="12" fill="#7c3aed"/><circle cx="48" cy="11" r="7" fill="#8b5cf6"/>
        <path d="M33 50 Q33 28 48 26 Q63 28 63 50" fill="#7c3aed"/>
      </g>
      <g style={{ animation:"mapKfPersonWalk .6s cubic-bezier(.34,1.2,.64,1) .2s both",opacity:0 }}>
        <circle cx="76" cy="18" r="10" fill="#0e7490"/><circle cx="76" cy="16" r="6" fill="#06b6d4"/>
        <path d="M64 50 Q64 32 76 30 Q88 32 88 50" fill="#0e7490"/>
      </g>
      <path d="M20 28 Q48 20 76 28" fill="none" stroke="rgba(139,92,246,.4)" strokeWidth="1.5" strokeDasharray="4 3"/>
      <g style={{ animation:"mapKfBounceIn .5s ease .7s both",opacity:0 }}>
        <circle cx="48" cy="58" r="9" fill="rgba(5,150,105,.3)" stroke="#10b981" strokeWidth="1.5"/>
        <path d="M43 58 L46 62 L54 54" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="20" style={{ animation:"mapKfCheckTick .4s ease .9s both",strokeDashoffset:20 }}/>
      </g>
    </svg>
  );
}

function MemberSVG() {
  return (
    <svg width="80" height="86" viewBox="0 0 80 86">
      <defs>
        <radialGradient id="mpAvGrad" cx="40%" cy="30%" r="55%">
          <stop offset="0%" stopColor="#38bdf8"/><stop offset="100%" stopColor="#0369a1"/>
        </radialGradient>
        <linearGradient id="mpCardBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c4a6e"/><stop offset="100%" stopColor="#082f49"/>
        </linearGradient>
      </defs>
      <rect x="7" y="14" width="66" height="68" rx="8" fill="url(#mpCardBg)" style={{ filter:"drop-shadow(0 4px 12px rgba(0,0,0,.4))" }}/>
      <rect x="7" y="14" width="66" height="10" rx="8" fill="#0369a1"/>
      <text x="40" y="22" fontSize="7" fill="rgba(186,230,253,.8)" textAnchor="middle" fontWeight="bold" letterSpacing="1">MEMBER</text>
      <circle cx="40" cy="44" r="18" fill="url(#mpAvGrad)"/>
      <circle cx="40" cy="39" r="8" fill="rgba(255,255,255,.3)"/>
      <path d="M24 58 Q24 46 40 44 Q56 46 56 58" fill="rgba(255,255,255,.2)"/>
      <rect x="16" y="66" width="48" height="5" rx="2.5" fill="rgba(186,230,253,.25)"/>
      <rect x="22" y="73" width="36" height="4" rx="2" fill="rgba(186,230,253,.15)"/>
      <g style={{ animation:"mapKfBounceIn .5s ease .6s both",opacity:0 }}>
        <circle cx="58" cy="28" r="9" fill="#0284c7" stroke="rgba(255,255,255,.4)" strokeWidth="1.5"/>
        <text x="58" y="32" fontSize="10" textAnchor="middle" fill="#fff">+</text>
      </g>
    </svg>
  );
}

function WalletSVG() {
  return (
    <svg width="90" height="76" viewBox="0 0 90 76">
      <defs>
        <linearGradient id="mpWMain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#065f46"/><stop offset="100%" stopColor="#064e3b"/>
        </linearGradient>
        <linearGradient id="mpWTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#059669"/><stop offset="100%" stopColor="#065f46"/>
        </linearGradient>
        <linearGradient id="mpCoinG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24"/><stop offset="50%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#d97706"/>
        </linearGradient>
      </defs>
      {[20,42,62].map((x,i)=>(
        <g key={i} style={{ "--cr":`${(i+1)*120}deg`,animation:`mapKfCoinFall .7s cubic-bezier(.34,1.2,.64,1) ${.1+i*.15}s both`,opacity:0 }}>
          <ellipse cx={x} cy={18-i*6} rx="10" ry="5" fill="url(#mpCoinG)"/>
          <ellipse cx={x} cy={18-i*6-1} rx="10" ry="5" fill="url(#mpCoinG)"/>
          <ellipse cx={x} cy={18-i*6-1} rx="7" ry="3" fill="rgba(255,255,255,.2)"/>
          <text x={x} y={18-i*6+2} fontSize="5" fill="rgba(255,255,255,.7)" textAnchor="middle">$</text>
        </g>
      ))}
      <rect x="4" y="30" width="82" height="44" rx="8" fill="url(#mpWMain)" style={{ filter:"drop-shadow(0 4px 12px rgba(0,0,0,.4))" }}/>
      <path d="M4 30 Q4 18 12 16 L78 16 Q86 18 86 30" fill="url(#mpWTop)" stroke="rgba(255,255,255,.1)" strokeWidth="1"/>
      <rect x="12" y="36" width="30" height="18" rx="3" fill="rgba(255,255,255,.07)"/>
      <rect x="15" y="40" width="20" height="3" rx="1.5" fill="rgba(255,255,255,.2)"/>
      <rect x="15" y="46" width="14" height="2" rx="1" fill="rgba(255,255,255,.12)"/>
      <rect x="48" y="36" width="32" height="12" rx="2" fill="rgba(74,222,128,.3)"/>
      <text x="64" y="62" fontSize="9" fill="rgba(74,222,128,.8)" textAnchor="middle" fontWeight="bold">₹ 500</text>
    </svg>
  );
}

function CameraSVG() {
  return (
    <svg width="90" height="72" viewBox="0 0 90 72">
      <defs>
        <radialGradient id="mpLens" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1e40af"/>
          <stop offset="40%" stopColor="#1e3a8a"/>
          <stop offset="80%" stopColor="#172554"/>
          <stop offset="100%" stopColor="#0f172a"/>
        </radialGradient>
        <radialGradient id="mpLensShine" cx="35%" cy="30%" r="40%">
          <stop offset="0%" stopColor="rgba(255,255,255,.35)"/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
        <linearGradient id="mpCamBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#374151"/><stop offset="100%" stopColor="#111827"/>
        </linearGradient>
      </defs>
      <rect x="5" y="18" width="80" height="50" rx="8" fill="url(#mpCamBody)"/>
      <rect x="5" y="18" width="80" height="12" rx="8" fill="#4b5563"/>
      <rect x="28" y="10" width="34" height="10" rx="4" fill="#374151"/>
      <circle cx="68" cy="14" r="5" fill="#6b7280"/>
      <circle cx="68" cy="14" r="3" fill="#9ca3af"/>
      <circle cx="42" cy="45" r="24" fill="#1f2937"/>
      <circle cx="42" cy="45" r="22" fill="#111827" stroke="#374151" strokeWidth="1"/>
      <circle cx="42" cy="45" r="18" fill="url(#mpLens)"/>
      <circle cx="42" cy="45" r="18" fill="url(#mpLensShine)"/>
      <circle cx="42" cy="45" r="14" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1"/>
      <circle cx="42" cy="45" r="10" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="1"/>
      {[0,45,90,135].map((a,i)=>(
        <line key={i}
          x1={42+Math.cos(a*Math.PI/180)*6} y1={45+Math.sin(a*Math.PI/180)*6}
          x2={42+Math.cos((a+90)*Math.PI/180)*6} y2={45+Math.sin((a+90)*Math.PI/180)*6}
          stroke="rgba(255,255,255,.25)" strokeWidth="1.5" strokeLinecap="round"/>
      ))}
      <circle cx="42" cy="45" r="3" fill="rgba(147,197,253,.4)"/>
      <circle cx="36" cy="39" r="2.5" fill="rgba(255,255,255,.18)"/>
      <rect x="72" y="30" width="8" height="12" rx="2" fill="rgba(253,224,71,.6)"
        style={{ animation:"mapKfFlash 2s ease-in-out 1.5s infinite" }}/>
    </svg>
  );
}

function BackpackSVG() {
  return (
    <svg width="80" height="90" viewBox="0 0 80 90">
      <defs>
        <linearGradient id="mpBpGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316"/><stop offset="100%" stopColor="#ea580c"/>
        </linearGradient>
        <linearGradient id="mpBpFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fb923c"/><stop offset="100%" stopColor="#f97316"/>
        </linearGradient>
      </defs>
      <path d="M24 14 Q16 14 16 26 L16 70" stroke="#c2410c" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M56 14 Q64 14 64 26 L64 70" stroke="#c2410c" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <rect x="10" y="12" width="60" height="68" rx="12" fill="url(#mpBpGrad)" style={{ filter:"drop-shadow(0 4px 14px rgba(0,0,0,.4))" }}/>
      <rect x="16" y="52" width="48" height="24" rx="8" fill="url(#mpBpFront)"/>
      <path d="M22 60 Q40 58 58 60" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="40" cy="59" r="3" fill="rgba(255,255,255,.6)"/>
      <path d="M30 10 Q30 4 40 4 Q50 4 50 10" fill="none" stroke="#c2410c" strokeWidth="5" strokeLinecap="round"/>
      <circle cx="40" cy="34" r="14" fill="rgba(255,255,255,.08)"/>
      <text x="40" y="39" fontSize="18" textAnchor="middle">🧳</text>
      <g style={{ animation:"mapKfBounceIn .5s ease .8s both",opacity:0 }}>
        <circle cx="58" cy="18" r="9" fill="#10b981" stroke="#fff" strokeWidth="1.5"/>
        <path d="M53 18 L56 21 L63 14" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  );
}

function PaymentSVG() {
  return (
    <svg width="90" height="72" viewBox="0 0 90 72">
      <defs>
        <linearGradient id="mpPayCard" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#0891b2"/><stop offset="50%" stopColor="#0e7490"/><stop offset="100%" stopColor="#164e63"/>
        </linearGradient>
        <radialGradient id="mpPayShine" cx="25%" cy="30%" r="55%">
          <stop offset="0%" stopColor="rgba(255,255,255,.2)"/><stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>
      {[16,26,36].map((r,i)=>(
        <circle key={i} cx="45" cy="40" r={r} fill="none" stroke="rgba(6,182,212,.45)" strokeWidth="1.5"
          style={{ animation:`mapKfPayWave 2s ease-out ${.1+i*.35}s infinite`,transformOrigin:"45px 40px" }}/>
      ))}
      <ellipse cx="46" cy="70" rx="32" ry="3" fill="rgba(0,0,0,.3)"/>
      <rect x="8" y="18" width="74" height="46" rx="8" fill="url(#mpPayCard)"
        style={{ animation:"mapKfCardSwipe .6s cubic-bezier(.34,1.2,.64,1) .15s both",filter:"drop-shadow(0 4px 16px rgba(8,145,178,.4))",opacity:0 }}/>
      <rect x="8" y="18" width="74" height="46" rx="8" fill="url(#mpPayShine)"/>
      <rect x="18" y="28" width="16" height="12" rx="2.5" fill="rgba(245,158,11,.7)" stroke="rgba(245,158,11,.4)" strokeWidth=".5"/>
      <line x1="24" y1="28" x2="24" y2="40" stroke="rgba(0,0,0,.2)" strokeWidth=".7"/>
      <line x1="28" y1="28" x2="28" y2="40" stroke="rgba(0,0,0,.2)" strokeWidth=".7"/>
      <line x1="18" y1="33" x2="34" y2="33" stroke="rgba(0,0,0,.2)" strokeWidth=".7"/>
      {[20,36,52,66].map((x,i)=>(
        <rect key={i} x={x} y={46} width="9" height="4" rx="1" fill="rgba(255,255,255,.3)"/>
      ))}
      <circle cx="68" cy="32" r="8" fill="rgba(245,158,11,.4)"/>
      <circle cx="72" cy="32" r="8" fill="rgba(239,68,68,.35)"/>
      <g style={{ animation:"mapKfBounceIn .5s ease .7s both",opacity:0 }}>
        <circle cx="72" cy="55" r="9" fill="#059669" stroke="rgba(255,255,255,.3)" strokeWidth="1"/>
        <path d="M67 55 L70 58 L77 51" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  );
}

function BellSVG() {
  return (
    <svg width="80" height="88" viewBox="0 0 80 88" style={{ overflow:"visible" }}>
      <defs>
        <linearGradient id="mpBellG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b"/><stop offset="50%" stopColor="#d97706"/><stop offset="100%" stopColor="#b45309"/>
        </linearGradient>
        <radialGradient id="mpBellShine" cx="35%" cy="25%" r="45%">
          <stop offset="0%" stopColor="rgba(255,255,255,.35)"/><stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>
      {[22,34,46].map((r,i)=>(
        <circle key={i} cx="40" cy="38" r={r} fill="none" stroke="rgba(245,158,11,.4)" strokeWidth="1.5"
          style={{ animation:`mapKfSoundWave 2s ease-out ${.3+i*.35}s infinite`,transformOrigin:"40px 38px" }}/>
      ))}
      <g style={{ transformOrigin:"40px 30px",animation:"mapKfBellSwing 1.2s ease-in-out .2s both" }}>
        <path d="M34 6 Q34 2 40 2 Q46 2 46 6" fill="none" stroke="url(#mpBellG)" strokeWidth="4" strokeLinecap="round"/>
        <rect x="37" y="5" width="6" height="8" rx="2" fill="url(#mpBellG)"/>
        <path d="M8 62 Q8 16 40 14 Q72 16 72 62 Z" fill="url(#mpBellG)"/>
        <path d="M8 62 Q8 16 40 14 Q72 16 72 62 Z" fill="url(#mpBellShine)"/>
        <path d="M20 50 Q20 24 40 22 Q60 24 60 50" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1"/>
        <ellipse cx="40" cy="62" rx="32" ry="6" fill="#92400e"/>
        <ellipse cx="40" cy="61" rx="32" ry="5" fill="#b45309"/>
        <circle cx="40" cy="68" r="5" fill="#78350f"/>
        <circle cx="40" cy="66" r="3" fill="#92400e"/>
      </g>
    </svg>
  );
}

/* ─── Shared card wrapper ─────────────────────────────────── */
function PopCard({ bar, bg, border, shadow, glow, delay, children }) {
  return (
    <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
      style={{ background:bg, border:`1px solid ${border}`,
        boxShadow:`0 28px 70px rgba(0,0,0,.88),0 0 45px ${glow}`,
        animation:`${delay} .85s cubic-bezier(.3,1.4,.6,1) both` }}
      onClick={e=>e.stopPropagation()}>
      <div style={{ height:3, background:bar }} />
      <div className="px-7 py-8 text-center">{children}</div>
    </div>
  );
}

function FU({ children, delay, size=13, color, weight=400, lsp, upper, mt=0, mb=8 }) {
  return (
    <p style={{ fontSize:size, color, fontWeight:weight, letterSpacing:lsp,
      textTransform:upper?"uppercase":undefined, marginTop:mt, marginBottom:mb,
      animation:`mapKfFadeUp .5s ease ${delay}s both`, opacity:0 }}>
      {children}
    </p>
  );
}

function Btn({ label, bg, shadow, delay, onClose }) {
  return (
    <button onClick={onClose} style={{ width:"100%",padding:"11px",borderRadius:12,fontWeight:700,
      fontSize:13,background:bg,color:"#fff",border:"none",cursor:"pointer",
      boxShadow:shadow,animation:`mapKfFadeUp .5s ease ${delay}s both`,opacity:0 }}>
      {label}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════
   14 THEMED POPUPS
════════════════════════════════════════════════════════════ */

function TripPopup({ action, onClose }) {
  const add = action !== "edit";
  const speedLines = Array.from({length:10},(_,i)=>({ left:`${6+i*9}%`, h:35+i%3*25, delay:`${i*.09}s` }));
  return createPortal(
    <div className="fixed inset-0 z-[300] overflow-hidden"
      style={{ background:"linear-gradient(180deg,#00010a 0%,#04062a 40%,#080c3a 100%)" }}>
      {/* Stars */}
      {STARS.map((s,i)=>(
        <div key={i} className="absolute rounded-full bg-white pointer-events-none"
          style={{ left:`${s.x}%`,top:`${s.y}%`,width:s.size*.8,height:s.size*.8,
            animation:`mapKfStarTwinkle ${s.dur} ease-in-out ${s.delay} infinite` }}/>
      ))}
      {/* Moon */}
      <div className="absolute pointer-events-none"
        style={{ top:"8%",right:"12%",width:46,height:46,borderRadius:"50%",
          background:"linear-gradient(130deg,#e8e0c8,#c8bfa0)",
          boxShadow:"0 0 26px rgba(240,228,180,.26)" }}/>
      {/* Speed lines streaming down */}
      {speedLines.map((l,i)=>(
        <div key={i} className="absolute pointer-events-none"
          style={{ left:l.left,top:"-10%",width:1.5,height:l.h,
            background:"linear-gradient(to bottom,transparent,rgba(130,160,255,.5),transparent)",
            animation:`mapKfSpeedLine 1.2s ease-out ${l.delay} infinite` }}/>
      ))}
      {/* Rocket — outer div drives launch; inner div is the size/positioning reference */}
      <div className="absolute pointer-events-none"
        style={{ left:"calc(50% - 35px)",animation:"mapKfRocketLaunch 2.4s cubic-bezier(.4,0,.2,1) .1s both",opacity:0 }}>
        <div style={{ position:"relative",width:70,height:154 }}>
          <svg width="70" height="154" viewBox="0 0 40 88"
            style={{ display:"block",filter:"drop-shadow(0 0 14px rgba(59,130,246,.6))" }}>
            <defs>
              <linearGradient id="mpRocket" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#c0cfe8"/><stop offset="50%" stopColor="#eef4ff"/><stop offset="100%" stopColor="#c0cfe8"/>
              </linearGradient>
              <linearGradient id="mpNose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444"/><stop offset="100%" stopColor="#b91c1c"/>
              </linearGradient>
              <radialGradient id="mpWin" cx="35%" cy="35%" r="55%">
                <stop offset="0%" stopColor="rgba(186,230,255,.8)"/><stop offset="100%" stopColor="rgba(37,99,235,.5)"/>
              </radialGradient>
            </defs>
            {/* Nose cone */}
            <path d="M10 22 Q20 0 30 22Z" fill="url(#mpNose)"/>
            {/* Body */}
            <rect x="10" y="22" width="20" height="46" rx="3" fill="url(#mpRocket)"/>
            <rect x="10" y="22" width="3" height="46" rx="2" fill="rgba(0,0,0,.08)"/>
            {/* Porthole window */}
            <circle cx="20" cy="38" r="8" fill="url(#mpWin)" stroke="rgba(147,197,253,.5)" strokeWidth="1.5"/>
            <circle cx="20" cy="38" r="5" fill="rgba(37,99,235,.4)"/>
            <circle cx="17" cy="35" r="2" fill="rgba(255,255,255,.35)"/>
            {/* Stripes */}
            <rect x="10" y="51" width="20" height="3.5" fill="rgba(239,68,68,.6)"/>
            <rect x="10" y="58" width="20" height="2.5" fill="rgba(148,163,184,.25)"/>
            {/* Fins */}
            <path d="M10 57 L1 78 L10 68Z" fill="url(#mpNose)"/>
            <path d="M30 57 L39 78 L30 68Z" fill="url(#mpNose)"/>
            <path d="M10 57 L4 72 L10 64Z" fill="rgba(0,0,0,.15)"/>
            <path d="M30 57 L36 72 L30 64Z" fill="rgba(0,0,0,.15)"/>
            {/* Exhaust bell — bottom edge at y=78 */}
            <path d="M13 68 L8 78 L32 78 L27 68Z" fill="#1e2a3a"/>
            <ellipse cx="20" cy="68" rx="7.5" ry="2.8" fill="#0f172a"/>
            {/* Nozzle throat glow */}
            <ellipse cx="20" cy="68" rx="4.5" ry="1.8" fill="rgba(255,140,0,.4)"/>
          </svg>
          {/* Flames anchored at nozzle exit: y=78 → 78/88×154 ≈ 136px from top */}
          {/* NOTE: centering via left:calc(50% - halfWidth) — NOT transform:translateX(-50%)
              because the flameDance animation sets transform and would override the centering. */}
          {/* Outer flame — width 40, half=20 → left=35-20=15 */}
          <div style={{ position:"absolute",top:133,left:15,
            width:40,height:62,borderRadius:"0 0 55% 55%",
            background:"linear-gradient(to bottom,rgba(255,210,30,.95),rgba(255,80,0,.8),rgba(255,40,0,.3),transparent)",
            filter:"blur(1px)",animation:"mapKfFlameDance .18s ease-in-out infinite" }}/>
          {/* Mid flame — width 24, half=12 → left=35-12=23 */}
          <div style={{ position:"absolute",top:133,left:23,
            width:24,height:48,borderRadius:"0 0 50% 50%",
            background:"linear-gradient(to bottom,rgba(255,255,180,.9),rgba(255,160,20,.8),transparent)",
            filter:"blur(.5px)",animation:"mapKfFlameDance .22s ease-in-out .05s infinite" }}/>
          {/* White hot core — width 12, half=6 → left=35-6=29 */}
          <div style={{ position:"absolute",top:133,left:29,
            width:12,height:30,borderRadius:"0 0 50% 50%",
            background:"linear-gradient(to bottom,rgba(255,255,255,.95),rgba(255,220,100,.7),transparent)",
            animation:"mapKfFlameDance .15s ease-in-out .03s infinite" }}/>
          {/* Nozzle glow halo — width 60, half=30 → left=35-30=5 */}
          <div style={{ position:"absolute",top:122,left:5,
            width:60,height:24,borderRadius:"50%",
            background:"radial-gradient(ellipse,rgba(255,120,0,.4),rgba(255,60,0,.15),transparent 70%)",
            animation:"mapKfFlameDance .28s ease-in-out .08s infinite" }}/>
        </div>
      </div>
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
        {/* Card appears after rocket launches — animationDelay 1.8s */}
        <div className="pointer-events-auto w-full max-w-[338px] rounded-2xl overflow-hidden"
          style={{ background:"linear-gradient(145deg,#060a28,#090d38)",
            border:"1px solid rgba(99,130,255,.35)",
            boxShadow:"0 28px 70px rgba(0,0,0,.88),0 0 45px rgba(59,80,255,.15)",
            animation:"mapKfCardLand .85s cubic-bezier(.3,1.4,.6,1) 1.8s both",opacity:0 }}
          onClick={e=>e.stopPropagation()}>
          <div style={{ height:3,background:"linear-gradient(90deg,#ef4444,#8b5cf6,#3b82f6,#06b6d4)" }}/>
          <div className="px-7 py-8 text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background:"rgba(139,92,246,.14)",border:"1px solid rgba(139,92,246,.38)",boxShadow:"0 0 28px rgba(139,92,246,.3)" }}>
              <svg width="32" height="32" viewBox="0 0 40 88">
                <path d="M10 22 Q20 0 30 22Z" fill="#ef4444"/>
                <rect x="10" y="22" width="20" height="46" rx="3" fill="rgba(192,207,232,.9)"/>
                <circle cx="20" cy="38" r="7" fill="rgba(96,165,250,.55)"/>
                <path d="M10 57 L1 78 L10 68Z" fill="#ef4444"/>
                <path d="M30 57 L39 78 L30 68Z" fill="#ef4444"/>
                <path d="M13 68 L8 78 L32 78 L27 68Z" fill="#374151"/>
              </svg>
            </div>
            <FU delay={2.1} size={10} color="#a78bfa" weight={700} lsp="0.3em" upper>Trip {add?"Created":"Updated"}</FU>
            <FU delay={2.25} size={18} color="#fff" weight={800} mt={6} mb={4}>{add?"Trip is Live! 🚀":"Changes Saved! 🚀"}</FU>
            <FU delay={2.4} color="rgba(148,163,184,1)" mb={24}>{add?"Your trip has been launched into the system.":"Your trip details have been updated."}</FU>
            <Btn delay={2.55} label={add?"🌌 To The Stars!":"🚀 Confirmed!"} bg="linear-gradient(90deg,#7c3aed,#4f46e5)" shadow="0 8px 24px rgba(124,58,237,.44)" onClose={onClose}/>
          </div>
        </div>
      </div>
    </div>, document.body
  );
}

function VehiclesPopup({ action, onClose }) {
  const add = action !== "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] overflow-hidden"
      style={{ background:"linear-gradient(180deg,#0a1a08 0%,#0d2210 55%,#071208 100%)" }}>
      {STARS.slice(0,16).map((s,i)=>(
        <div key={i} className="absolute rounded-full bg-white/50 pointer-events-none"
          style={{ left:`${s.x}%`,top:`${s.y*.5}%`,width:s.size*.8,height:s.size*.8,
            animation:`mapKfStarTwinkle ${s.dur} ease-in-out ${s.delay} infinite` }}/>
      ))}
      <div className="absolute pointer-events-none bottom-[28%]" style={{ left:0,right:0 }}>
        <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none">
          <path d="M0 60 L80 15 L160 50 L240 5 L320 40 L400 20 L400 60 Z" fill="rgba(5,46,22,.8)"/>
        </svg>
      </div>
      <div className="absolute pointer-events-none" style={{ bottom:"29%",left:0,right:0,height:8,background:"rgba(255,255,255,.06)",borderTop:"1px solid rgba(255,255,255,.04)" }}>
        <div style={{ position:"absolute",top:3,left:0,right:0,height:2,overflow:"hidden" }}>
          <div style={{ height:"100%",backgroundImage:"repeating-linear-gradient(90deg,rgba(245,158,11,.5) 0,rgba(245,158,11,.5) 24px,transparent 24px,transparent 48px)",animation:"mapKfRoadScroll 1s linear infinite" }}/>
        </div>
      </div>
      <div className="absolute pointer-events-none" style={{ bottom:"29%",marginBottom:7,animation:"mapKfBusRide 2.8s cubic-bezier(.4,0,.55,1) .1s both",opacity:0 }}>
        <div style={{ animation:"mapKfBusBounce .4s ease-in-out infinite" }}><BusIllustration/></div>
      </div>
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
        <PopCard
          bar="linear-gradient(90deg,#4ade80,#10b981,#06b6d4)"
          bg="linear-gradient(145deg,#0b1f0e,#102918)"
          border="rgba(74,222,128,.32)"
          glow="rgba(74,222,128,.1)"
          delay="mapKfCardLand"
        >
          <div className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.32)",boxShadow:"0 0 22px rgba(74,222,128,.22)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          </div>
          <FU delay={2.3} size={10} color="#4ade80" weight={700} lsp="0.3em" upper>Vehicle {add?"Added":"Updated"}</FU>
          <FU delay={2.45} size={18} color="#fff" weight={800} mt={6} mb={4}>{add?"Vehicle Added!":"Details Updated!"}</FU>
          <FU delay={2.6} color="rgba(134,239,172,.7)" mb={24}>The vehicle is now {add?"part of":"updated in"} your trip fleet.</FU>
          <Btn delay={2.75} label="🚌 Great!" bg="linear-gradient(90deg,#16a34a,#15803d)" shadow="0 8px 24px rgba(22,163,74,.44)" onClose={onClose}/>
        </PopCard>
      </div>
    </div>, document.body
  );
}

function ItineraryPopup({ action, onClose }) {
  const add = action !== "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"linear-gradient(180deg,#010612 0%,#020d2e 45%,#010a22 100%)" }} onClick={onClose}>
      {/* Night sky stars */}
      {STARS.slice(0,14).map((s,i)=>(
        <div key={i} className="absolute rounded-full bg-white pointer-events-none"
          style={{ left:`${s.x}%`,top:`${s.y*.35}%`,width:s.size*.7,height:s.size*.7,
            animation:`mapKfStarTwinkle ${s.dur} ease-in-out ${s.delay} infinite` }}/>
      ))}
      {/* Ocean wave layers */}
      <div className="absolute pointer-events-none" style={{ bottom:0,left:0,right:0,height:"38%",overflow:"hidden" }}>
        {[0,1,2].map(i=>(
          <div key={i} className="absolute left-0" style={{ bottom:`${i*22}%`,width:"200%",height:"80px",
            backgroundImage:`radial-gradient(ellipse 120px 40px at center,rgba(${i===0?"6,182,212":i===1?"3,105,161":"1,67,120"},.${i===0?"18":"12"}),transparent)`,
            animation:`mapKfOceanWave ${3.5+i*.8}s linear ${i*.4}s infinite` }}/>
        ))}
        <div className="absolute inset-0" style={{ background:"linear-gradient(0deg,rgba(1,22,80,.8),rgba(2,20,62,.4))" }}/>
      </div>
      {/* Sonar rings */}
      {[0,.6,1.2].map((d,i)=>(
        <div key={i} className="absolute pointer-events-none" style={{
          width:60,height:60,bottom:"35%",left:"50%",transform:"translate(-50%,50%)",
          borderRadius:"50%",border:`1.5px solid rgba(6,182,212,${.55-i*.12})`,
          animation:`mapKfSonar 2.5s ease-out ${d}s infinite` }}/>
      ))}
      {/* Ship */}
      <div className="absolute pointer-events-none" style={{ bottom:"36%",left:"50%",
        transform:"translateX(-50%)",animation:"mapKfShipBob 3s ease-in-out infinite" }}>
        <svg width="90" height="48" viewBox="0 0 90 48">
          <defs>
            <linearGradient id="mpOcHull" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e3a5f"/><stop offset="100%" stopColor="#0c1f3d"/>
            </linearGradient>
          </defs>
          <path d="M8 28 L82 28 L74 44 L16 44 Z" fill="url(#mpOcHull)"/>
          <path d="M8 28 L82 28 L78 36 L12 36 Z" fill="#0e7490" opacity=".5"/>
          <rect x="18" y="20" width="54" height="10" rx="2" fill="#1e3a5f"/>
          <rect x="30" y="10" width="30" height="12" rx="3" fill="#1e3a5f"/>
          <rect x="33" y="12" width="8" height="6" rx="1" fill="rgba(186,230,253,.4)"/>
          <rect x="49" y="12" width="8" height="6" rx="1" fill="rgba(186,230,253,.4)"/>
          <line x1="45" y1="2" x2="45" y2="18" stroke="rgba(255,255,255,.5)" strokeWidth="2"/>
          <line x1="36" y1="8" x2="54" y2="8" stroke="rgba(255,255,255,.35)" strokeWidth="1.5"/>
          <path d="M45 2 L52 5 L45 8 Z" fill="#06b6d4"/>
          <circle cx="82" cy="27" r="3" fill="rgba(253,224,71,.85)" style={{ filter:"blur(.8px)" }}/>
        </svg>
      </div>
      {/* Ship wake trail */}
      <div className="absolute pointer-events-none" style={{ bottom:"37%",left:"50%",height:4,
        background:"linear-gradient(90deg,transparent,rgba(6,182,212,.5),transparent)",
        animation:"mapKfWakeLine 2.5s ease-out .5s infinite",borderRadius:2 }}/>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#020d2e,#031540)",border:"1px solid rgba(6,182,212,.38)",
          boxShadow:"0 28px 70px rgba(0,0,0,.92),0 0 55px rgba(6,182,212,.14)",
          animation:"mapKfCardLand .8s cubic-bezier(.3,1.4,.6,1) .5s both",opacity:0 }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#0ea5e9,#06b6d4,#0891b2)" }}/>
        <div className="px-7 py-8 text-center">
          {/* Nautical compass */}
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ width:88,height:88,animation:"mapKfBounceIn .7s cubic-bezier(.34,1.5,.64,1) .6s both",opacity:0 }}>
            <svg width="88" height="88" viewBox="0 0 88 88">
              <defs>
                <radialGradient id="mpOcFace" cx="50%" cy="40%" r="55%">
                  <stop offset="0%" stopColor="#0c2a4a"/>
                  <stop offset="100%" stopColor="#020d24"/>
                </radialGradient>
                <linearGradient id="mpOcNeedle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9"/>
                  <stop offset="100%" stopColor="#0369a1"/>
                </linearGradient>
              </defs>
              <circle cx="44" cy="44" r="43" fill="none" stroke="rgba(6,182,212,.2)" strokeWidth="1"/>
              <circle cx="44" cy="44" r="41" fill="url(#mpOcFace)" style={{ filter:"drop-shadow(0 4px 16px rgba(0,0,0,.5))" }}/>
              <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(6,182,212,.15)" strokeWidth="1"/>
              <circle cx="44" cy="44" r="30" fill="none" stroke="rgba(6,182,212,.1)" strokeWidth="1" strokeDasharray="4 4"/>
              {Array.from({length:16},(_,i)=>{
                const a=i*(360/16)*Math.PI/180;
                const r1=i%4===0?28:i%2===0?32:35;
                return <line key={i}
                  x1={44+Math.cos(a)*r1} y1={44+Math.sin(a)*r1}
                  x2={44+Math.cos(a)*39} y2={44+Math.sin(a)*39}
                  stroke={i%4===0?"rgba(6,182,212,.7)":"rgba(255,255,255,.15)"}
                  strokeWidth={i%4===0?2:.8}/>;
              })}
              {[{l:"N",a:-90},{l:"E",a:0},{l:"S",a:90},{l:"W",a:180}].map(({l,a})=>(
                <text key={l} x={44+Math.cos(a*Math.PI/180)*24} y={44+Math.sin(a*Math.PI/180)*24+4}
                  fontSize="8" fill="#7dd3fc" textAnchor="middle" fontWeight="bold">{l}</text>
              ))}
              <g style={{ transformOrigin:"44px 44px",animation:"mapKfCompassSpin .9s cubic-bezier(.34,1.2,.64,1) .7s both" }}>
                <path d="M44 44 L40 22 L44 16 L48 22 Z" fill="url(#mpOcNeedle)" style={{ filter:"drop-shadow(0 0 6px rgba(6,182,212,.6))" }}/>
                <path d="M44 44 L40 66 L44 72 L48 66 Z" fill="rgba(255,255,255,.45)"/>
              </g>
              <circle cx="44" cy="44" r="5" fill="#020d24" stroke="rgba(6,182,212,.6)" strokeWidth="1.5"/>
              <circle cx="44" cy="44" r="2.5" fill="#0ea5e9"/>
              {[0,.5,1].map((d,i)=>(
                <circle key={i} cx="44" cy="44" r={14+i*8} fill="none"
                  stroke="rgba(6,182,212,.2)" strokeWidth=".8"
                  style={{ animation:`mapKfRipple 2s ease-out ${1.2+d}s infinite`,transformOrigin:"44px 44px" }}/>
              ))}
            </svg>
          </div>
          <FU delay={1.1} size={10} color="#38bdf8" weight={700} lsp="0.3em" upper>Port {add?"Logged":"Updated"}</FU>
          <FU delay={1.25} size={18} color="#fff" weight={800} mt={6} mb={4}>{add?"Anchors Away! ⚓":"Course Corrected! 🌊"}</FU>
          <FU delay={1.4} color="rgba(125,211,252,.7)" mb={22}>{add?"A new stop has been charted on your voyage.":"The stop details have been updated in the ship's log."}</FU>
          <Btn delay={1.55} label={add?"⚓ Set Sail!":"🧭 Aye Aye!"} bg="linear-gradient(90deg,#0284c7,#0369a1)" shadow="0 8px 26px rgba(2,132,199,.48)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

function GroupsPopup({ action, onClose }) {
  const add = action !== "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(5,10,24,.92)" }} onClick={onClose}>
      <div className="absolute w-80 h-80 rounded-full pointer-events-none"
        style={{ background:"radial-gradient(circle,rgba(6,182,212,.12),transparent 70%)" }}/>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#0c1824,#0e2436)",border:"1px solid rgba(6,182,212,.28)",
          boxShadow:"0 28px 70px rgba(0,0,0,.85),0 0 45px rgba(6,182,212,.1)",
          animation:"mapKfSpinFlip .9s cubic-bezier(.2,1.2,.5,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#06b6d4,#0891b2,#7c3aed)" }}/>
        <div className="px-7 py-8 text-center">
          <div className="relative mx-auto mb-5 flex items-center justify-center h-20"
            style={{ animation:"mapKfBounceIn .6s ease .15s both",opacity:0 }}>
            <GroupSVG/>
          </div>
          <FU delay={0.5} size={10} color="#22d3ee" weight={700} lsp="0.3em" upper>Group {add?"Created":"Updated"}</FU>
          <FU delay={0.65} size={18} color="#fff" weight={800} mt={6} mb={4}>{add?"Squad's Ready!":"Group Updated!"}</FU>
          <FU delay={0.8} color="rgba(103,232,249,.7)" mb={22}>Your group has been {add?"created":"updated"} successfully.</FU>
          <Btn delay={0.95} label="👥 Awesome!" bg="linear-gradient(90deg,#0891b2,#0e7490)" shadow="0 8px 24px rgba(8,145,178,.44)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

function MembersPopup({ action, onClose }) {
  const add = action !== "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(4,8,20,.92)" }} onClick={onClose}>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#0c1834,#101e44)",border:"1px solid rgba(56,189,248,.28)",
          boxShadow:"0 28px 64px rgba(0,0,0,.85),0 0 40px rgba(56,189,248,.1)",
          animation:"mapKfCardLand .75s cubic-bezier(.3,1.4,.6,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#0ea5e9,#38bdf8,#7dd3fc)" }}/>
        <div className="px-7 py-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center" style={{ height:88 }}>
            <MemberSVG/>
          </div>
          <FU delay={0.4} size={10} color="#38bdf8" weight={700} lsp="0.3em" upper>Member {add?"Added":"Updated"}</FU>
          <FU delay={0.55} size={18} color="#fff" weight={800} mt={6} mb={4}>{add?"Welcome Aboard!":"Profile Updated!"}</FU>
          <FU delay={0.7} color="rgba(125,211,252,.7)" mb={22}>Member {add?"has been added to the trip.":"details have been updated."}</FU>
          <Btn delay={0.85} label="👤 Great!" bg="linear-gradient(90deg,#0284c7,#0369a1)" shadow="0 8px 24px rgba(2,132,199,.44)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

function AdminsPopup({ action, onClose }) {
  const add = action !== "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(12,2,2,.92)" }} onClick={onClose}>
      <div className="absolute w-72 h-72 rounded-full pointer-events-none"
        style={{ background:"radial-gradient(circle,rgba(239,68,68,.12),transparent 70%)" }}/>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#1c0808,#220e0e)",border:"1px solid rgba(239,68,68,.32)",
          boxShadow:"0 28px 70px rgba(0,0,0,.88),0 0 45px rgba(239,68,68,.12)",
          animation:"mapKfCardSlide .7s cubic-bezier(.3,1.3,.6,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#dc2626,#b91c1c,#7f1d1d)" }}/>
        <div className="px-7 py-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ width:80,height:90,animation:"mapKfShieldDrop .7s cubic-bezier(.34,1.2,.64,1) .2s both",opacity:0 }}>
            <ShieldSVG/>
          </div>
          <FU delay={0.65} size={10} color="#f87171" weight={700} lsp="0.3em" upper>Admin {add?"Granted":"Updated"}</FU>
          <FU delay={0.8} size={18} color="#fff" weight={800} mt={6} mb={4}>{add?"Access Granted!":"Permissions Updated!"}</FU>
          <FU delay={0.95} color="rgba(252,165,165,.7)" mb={22}>Admin {add?"has been added with full access.":"profile has been updated."}</FU>
          <Btn delay={1.1} label="🛡️ Confirmed!" bg="linear-gradient(90deg,#dc2626,#b91c1c)" shadow="0 8px 24px rgba(220,38,38,.44)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

function AttendancePopup({ action, onClose }) {
  const add = action !== "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(4,8,4,.93)" }} onClick={onClose}>
      <div className="absolute inset-0 pointer-events-none" style={{ opacity:.04,
        backgroundImage:"linear-gradient(#f59e0b 1px,transparent 1px),linear-gradient(90deg,#f59e0b 1px,transparent 1px)",
        backgroundSize:"24px 24px" }}/>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#171208,#1e1810)",border:"1px solid rgba(245,158,11,.28)",
          boxShadow:"0 28px 70px rgba(0,0,0,.85),0 0 40px rgba(245,158,11,.1)",
          animation:"mapKfCardSlide .7s cubic-bezier(.3,1.3,.6,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#f59e0b,#d97706,#fbbf24)" }}/>
        <div className="px-7 py-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ width:80,height:88,animation:"mapKfBounceIn .7s cubic-bezier(.34,1.4,.64,1) .2s both",opacity:0 }}>
            <ScannerSVG/>
          </div>
          <FU delay={0.6} size={10} color="#fbbf24" weight={700} lsp="0.3em" upper>Attendance {add?"Marked":"Updated"}</FU>
          <FU delay={0.75} size={18} color="#fff" weight={800} mt={6} mb={4}>{add?"Checked In!":"Record Updated!"}</FU>
          <FU delay={0.9} color="rgba(253,230,138,.7)" mb={22}>Attendance has been {add?"recorded in":"updated in"} the system.</FU>
          <Btn delay={1.05} label="✅ Confirmed!" bg="linear-gradient(90deg,#d97706,#b45309)" shadow="0 8px 24px rgba(217,119,6,.44)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

function TasksPopup({ action, onClose }) {
  const add = action !== "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(5,2,12,.92)" }} onClick={onClose}>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#130e2a,#190d36)",border:"1px solid rgba(124,58,237,.3)",
          boxShadow:"0 28px 70px rgba(0,0,0,.88),0 0 45px rgba(124,58,237,.12)",
          animation:"mapKfSpinFlip .9s cubic-bezier(.2,1.2,.5,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#7c3aed,#6d28d9,#8b5cf6)" }}/>
        <div className="px-7 py-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ animation:"mapKfBounceIn .6s ease .1s both",opacity:0 }}>
            <ChecklistSVG/>
          </div>
          <FU delay={0.6} size={10} color="#a78bfa" weight={700} lsp="0.3em" upper>Task {add?"Created":"Updated"}</FU>
          <FU delay={0.75} size={18} color="#fff" weight={800} mt={6} mb={4}>{add?"Task Added!":"Task Updated!"}</FU>
          <FU delay={0.9} color="rgba(196,181,253,.7)" mb={22}>Task has been {add?"added to":"updated in"} the trip to-do list.</FU>
          <Btn delay={1.05} label="✅ Let's Do It!" bg="linear-gradient(90deg,#7c3aed,#6d28d9)" shadow="0 8px 24px rgba(124,58,237,.45)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

function ExpensesPopup({ action, onClose }) {
  const add = action !== "edit";
  /* Coins spread across the full viewport — blast origin is 50vw/50vh */
  const coins = [
    { left:14, top:8,  size:22, delay:.04, r:30,  gold:true  },
    { left:36, top:6,  size:16, delay:.10, r:-18, gold:true  },
    { left:58, top:9,  size:20, delay:.07, r:14,  gold:false },
    { left:80, top:11, size:18, delay:.12, r:-34, gold:true  },
    { left:5,  top:30, size:20, delay:.06, r:46,  gold:true  },
    { left:8,  top:56, size:16, delay:.14, r:-10, gold:false },
    { left:88, top:28, size:22, delay:.09, r:26,  gold:true  },
    { left:91, top:55, size:16, delay:.16, r:-42, gold:true  },
    { left:20, top:80, size:20, delay:.11, r:20,  gold:false },
    { left:50, top:84, size:18, delay:.08, r:-24, gold:true  },
    { left:76, top:78, size:22, delay:.13, r:36,  gold:true  },
    { left:3,  top:14, size:14, delay:.17, r:-16, gold:true  },
    { left:93, top:15, size:14, delay:.19, r:22,  gold:false },
    { left:44, top:3,  size:12, delay:.21, r:10,  gold:true  },
    { left:28, top:52, size:16, delay:.05, r:-28, gold:true  },
    { left:70, top:48, size:14, delay:.15, r:42,  gold:false },
  ].map(c => ({ ...c, ox:`${50-c.left}vw`, oy:`${50-c.top}vh` }));

  return createPortal(
    <div className="fixed inset-0 z-[300]"
      style={{ background:"linear-gradient(160deg,#0c0700,#1a0e00,#0f0900)" }}
      onClick={onClose}>
      {/* Central gold radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background:"radial-gradient(ellipse at 50% 50%,rgba(251,191,36,.07),transparent 62%)" }}/>
      {/* Coins blast from center to their viewport positions */}
      {coins.map((c,i) => (
        <div key={i} className="absolute pointer-events-none"
          style={{ left:`${c.left}%`, top:`${c.top}%`,
            '--ox':c.ox, '--oy':c.oy, '--r':`${c.r}deg`,
            animation:`mapKfCoinBlast .72s cubic-bezier(.34,1.55,.64,1) ${c.delay}s both,
                       mapKfCoinPulse 2.4s ease-in-out ${(c.delay+.72).toFixed(2)}s infinite` }}>
          <svg width={c.size} height={Math.round(c.size*.58)} viewBox="0 0 24 14">
            <defs>
              <linearGradient id={`mpEc${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={c.gold?"#fef08a":"#fde68a"}/>
                <stop offset="50%"  stopColor={c.gold?"#fbbf24":"#f59e0b"}/>
                <stop offset="100%" stopColor={c.gold?"#d97706":"#b45309"}/>
              </linearGradient>
            </defs>
            <ellipse cx="12" cy="7"   rx="12" ry="7" fill={`url(#mpEc${i})`}/>
            <ellipse cx="12" cy="6"   rx="12" ry="7" fill={`url(#mpEc${i})`}
              style={{ filter:"drop-shadow(0 0 4px rgba(251,191,36,.55))" }}/>
            <ellipse cx="12" cy="5.5" rx="8"  ry="4" fill="rgba(255,255,255,.22)"/>
            <text x="12" y="9.5" fontSize="6" fill="rgba(255,255,255,.75)"
              textAnchor="middle" fontWeight="bold">$</text>
          </svg>
        </div>
      ))}
      {/* Click-away */}
      <button className="absolute inset-0 z-0" onClick={onClose}/>
      {/* Centred card */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
        <div className="pointer-events-auto w-full max-w-[338px] rounded-2xl overflow-hidden relative z-10"
          style={{ background:"linear-gradient(145deg,#1a0e02,#241404)",
            border:"1px solid rgba(251,191,36,.42)",
            boxShadow:"0 28px 70px rgba(0,0,0,.92),0 0 55px rgba(251,191,36,.16)",
            animation:"mapKfCardLand .85s cubic-bezier(.3,1.4,.6,1) .22s both",opacity:0 }}
          onClick={e=>e.stopPropagation()}>
          <div style={{ height:3,background:"linear-gradient(90deg,#92400e,#b45309,#d97706,#fbbf24,#f59e0b)" }}/>
          <div className="px-7 py-8 text-center">
            {/* Vault door */}
            <div className="mx-auto mb-5 flex items-center justify-center"
              style={{ width:88,height:88,
                animation:"mapKfVaultOpen .75s cubic-bezier(.34,1.2,.64,1) .38s both",opacity:0 }}>
              <svg width="88" height="88" viewBox="0 0 88 88">
                <defs>
                  <radialGradient id="mpVface" cx="50%" cy="42%" r="55%">
                    <stop offset="0%"   stopColor="#2e2408"/>
                    <stop offset="100%" stopColor="#120f04"/>
                  </radialGradient>
                  <linearGradient id="mpVring" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#fef08a"/>
                    <stop offset="40%"  stopColor="#fbbf24"/>
                    <stop offset="100%" stopColor="#92400e"/>
                  </linearGradient>
                  <radialGradient id="mpVglow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%"   stopColor="rgba(251,191,36,.35)"/>
                    <stop offset="100%" stopColor="transparent"/>
                  </radialGradient>
                </defs>
                {/* Outer glow halo */}
                <circle cx="44" cy="44" r="44" fill="url(#mpVglow)"/>
                {/* Rim ring */}
                <circle cx="44" cy="44" r="43" fill="url(#mpVring)"
                  style={{ filter:"drop-shadow(0 0 16px rgba(251,191,36,.5))" }}/>
                {/* Face */}
                <circle cx="44" cy="44" r="39" fill="url(#mpVface)"/>
                {/* Inner groove ring */}
                <circle cx="44" cy="44" r="35" fill="none"
                  stroke="rgba(251,191,36,.3)" strokeWidth="1.5"/>
                {/* Bolt heads around rim */}
                {Array.from({length:8},(_,i)=>{
                  const a=i*45*Math.PI/180;
                  return (
                    <g key={i}>
                      <circle cx={44+Math.cos(a)*40} cy={44+Math.sin(a)*40} r="3.5" fill="url(#mpVring)"/>
                      <circle cx={44+Math.cos(a)*40} cy={44+Math.sin(a)*40} r="1.5" fill="rgba(0,0,0,.4)"/>
                    </g>
                  );
                })}
                {/* Spinning lock wheel */}
                <g style={{ transformOrigin:"44px 44px",
                  animation:"mapKfWheelSpin .9s cubic-bezier(.34,1.2,.64,1) .32s both" }}>
                  {Array.from({length:6},(_,i)=>{
                    const a=i*60*Math.PI/180;
                    return (
                      <line key={i} x1="44" y1="44"
                        x2={44+Math.cos(a)*27} y2={44+Math.sin(a)*27}
                        stroke="rgba(251,191,36,.75)" strokeWidth="3.5" strokeLinecap="round"/>
                    );
                  })}
                  {/* Wheel rim */}
                  <circle cx="44" cy="44" r="10" fill="none"
                    stroke="rgba(251,191,36,.5)" strokeWidth="2"/>
                  {/* Hub */}
                  <circle cx="44" cy="44" r="7" fill="url(#mpVring)"
                    stroke="rgba(255,255,255,.2)" strokeWidth="1"/>
                </g>
                {/* Center lock indicator */}
                <circle cx="44" cy="44" r="4" fill="#fbbf24"
                  style={{ filter:"drop-shadow(0 0 10px rgba(251,191,36,1))" }}/>
                <text x="44" y="48" fontSize="7" fill="rgba(0,0,0,.55)"
                  textAnchor="middle" fontWeight="900">$</text>
                {/* Left hinge bars */}
                <rect x="1" y="27" width="7" height="11" rx="2.5" fill="url(#mpVring)"/>
                <rect x="1" y="50" width="7" height="11" rx="2.5" fill="url(#mpVring)"/>
                <rect x="2" y="29" width="5" height="7"  rx="1.5" fill="rgba(0,0,0,.3)"/>
                <rect x="2" y="52" width="5" height="7"  rx="1.5" fill="rgba(0,0,0,.3)"/>
                {/* Right handle */}
                <circle cx="77" cy="44" r="8" fill="none"
                  stroke="url(#mpVring)" strokeWidth="3.5"/>
                <circle cx="77" cy="44" r="3.5" fill="url(#mpVring)"/>
              </svg>
            </div>
            {/* Ripple rings */}
            {[0,.45,.9].map((d,i)=>(
              <div key={i} className="absolute pointer-events-none" style={{
                borderRadius:"50%",border:`1.5px solid rgba(251,191,36,${.38-i*.1})`,
                inset:`calc(50% - ${32+i*9}px)`,
                animation:`mapKfRipple 2.4s ease-out ${1.05+d}s infinite` }}/>
            ))}
            <FU delay={1.0}  size={10} color="#fbbf24" weight={700} lsp="0.3em" upper>
              Vault {add?"Logged":"Updated"}
            </FU>
            <FU delay={1.15} size={18} color="#fff" weight={800} mt={6} mb={4}>
              {add?"Expense Recorded! 💰":"Amount Updated! 🏦"}
            </FU>
            <FU delay={1.3}  color="rgba(253,230,138,.72)" mb={22}>
              {add?"Your expense has been deposited into the ledger."
                  :"The expense record has been revised and saved."}
            </FU>
            <Btn delay={1.45}
              label={add?"🪙 Vaulted!":"💰 Confirmed!"}
              bg="linear-gradient(90deg,#92400e,#b45309,#d97706,#f59e0b)"
              shadow="0 8px 26px rgba(217,119,6,.48)"
              onClose={onClose}/>
          </div>
        </div>
      </div>
    </div>, document.body
  );
}

function GalleryPopup({ action, onClose }) {
  const add = action !== "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(2,4,10,.93)" }} onClick={onClose}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background:"rgba(255,255,255,.12)",animation:"mapKfFlash .5s ease .3s both" }}/>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#0f1520,#141d2e)",border:"1px solid rgba(99,102,241,.3)",
          boxShadow:"0 28px 70px rgba(0,0,0,.88),0 0 40px rgba(99,102,241,.12)",
          animation:"mapKfCardSlide .7s cubic-bezier(.3,1.3,.6,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#6366f1,#8b5cf6,#a78bfa)" }}/>
        <div className="px-7 py-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ animation:"mapKfBounceIn .6s cubic-bezier(.34,1.4,.64,1) .25s both",opacity:0 }}>
            <CameraSVG/>
          </div>
          <FU delay={0.6} size={10} color="#a78bfa" weight={700} lsp="0.3em" upper>Photo {add?"Captured":"Updated"}</FU>
          <FU delay={0.75} size={18} color="#fff" weight={800} mt={6} mb={4}>{add?"Photo Saved!":"Photo Updated!"}</FU>
          <FU delay={0.9} color="rgba(196,181,253,.7)" mb={22}>{add?"Captured and saved to the trip gallery.":"The photo has been updated."}</FU>
          <Btn delay={1.05} label="📷 Click!" bg="linear-gradient(90deg,#6366f1,#4f46e5)" shadow="0 8px 24px rgba(99,102,241,.45)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

function ChecklistPopup({ action, onClose }) {
  const add = action !== "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(8,4,2,.93)" }} onClick={onClose}>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#1c100a,#241510)",border:"1px solid rgba(249,115,22,.3)",
          boxShadow:"0 28px 70px rgba(0,0,0,.88),0 0 40px rgba(249,115,22,.1)",
          animation:"mapKfCardSlide .7s cubic-bezier(.3,1.3,.6,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#f97316,#ea580c,#fb923c)" }}/>
        <div className="px-7 py-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ animation:"mapKfBackpackDrop .7s cubic-bezier(.34,1.3,.64,1) .2s both",opacity:0 }}>
            <BackpackSVG/>
          </div>
          <FU delay={0.65} size={10} color="#fb923c" weight={700} lsp="0.3em" upper>Packing List {add?"Added":"Updated"}</FU>
          <FU delay={0.8} size={18} color="#fff" weight={800} mt={6} mb={4}>{add?"Item Added!":"Item Updated!"}</FU>
          <FU delay={0.95} color="rgba(253,186,116,.7)" mb={22}>Checklist item has been {add?"added to the packing list.":"updated."}</FU>
          <Btn delay={1.1} label="🧳 Packed!" bg="linear-gradient(90deg,#f97316,#ea580c)" shadow="0 8px 24px rgba(249,115,22,.44)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

function PollsPopup({ action, onClose }) {
  const add = action !== "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(2,6,16,.93)" }} onClick={onClose}>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#0a1228,#0e1838)",border:"1px solid rgba(59,130,246,.28)",
          boxShadow:"0 28px 70px rgba(0,0,0,.88),0 0 40px rgba(59,130,246,.1)",
          animation:"mapKfCardSlide .7s cubic-bezier(.3,1.3,.6,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#3b82f6,#6366f1,#8b5cf6)" }}/>
        <div className="px-7 py-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ animation:"mapKfBounceIn .5s ease .1s both",opacity:0 }}>
            <BarChartSVG/>
          </div>
          <FU delay={0.55} size={10} color="#60a5fa" weight={700} lsp="0.3em" upper>Poll {add?"Published":"Updated"}</FU>
          <FU delay={0.7} size={18} color="#fff" weight={800} mt={6} mb={4}>{add?"Vote's Live!":"Poll Updated!"}</FU>
          <FU delay={0.85} color="rgba(147,197,253,.7)" mb={22}>Poll has been {add?"published to":"updated for"} all trip members.</FU>
          <Btn delay={1.0} label="🗳️ Perfect!" bg="linear-gradient(90deg,#3b82f6,#2563eb)" shadow="0 8px 24px rgba(59,130,246,.44)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

function SharePopup({ action, onClose }) {
  const add = action !== "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(2,8,12,.93)" }} onClick={onClose}>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#051824,#081e2e)",border:"1px solid rgba(8,145,178,.3)",
          boxShadow:"0 28px 70px rgba(0,0,0,.88),0 0 40px rgba(8,145,178,.12)",
          animation:"mapKfCardLand .75s cubic-bezier(.3,1.4,.6,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#0891b2,#0e7490,#06b6d4)" }}/>
        <div className="px-7 py-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ height:80,animation:"mapKfBounceIn .6s ease .1s both",opacity:0 }}>
            <PaymentSVG/>
          </div>
          <FU delay={0.55} size={10} color="#22d3ee" weight={700} lsp="0.3em" upper>Share {add?"Collected":"Updated"}</FU>
          <FU delay={0.7} size={18} color="#fff" weight={800} mt={6} mb={4}>{add?"Payment Confirmed!":"Share Updated!"}</FU>
          <FU delay={0.85} color="rgba(103,232,249,.7)" mb={22}>Share collection has been {add?"recorded successfully.":"updated."}</FU>
          <Btn delay={1.0} label="💳 Collected!" bg="linear-gradient(90deg,#0891b2,#0e7490)" shadow="0 8px 24px rgba(8,145,178,.44)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

function AlarmsPopup({ action, onClose }) {
  const add = action !== "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(6,4,2,.93)" }} onClick={onClose}>
      <div className="absolute w-72 h-72 rounded-full pointer-events-none"
        style={{ background:"radial-gradient(circle,rgba(245,158,11,.1),transparent 70%)" }}/>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#1a1004,#201406)",border:"1px solid rgba(245,158,11,.3)",
          boxShadow:"0 28px 70px rgba(0,0,0,.88),0 0 40px rgba(245,158,11,.1)",
          animation:"mapKfCardSlide .7s cubic-bezier(.3,1.3,.6,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#f59e0b,#d97706,#fbbf24)" }}/>
        <div className="px-7 py-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ width:80,height:88,animation:"mapKfBounceIn .6s cubic-bezier(.34,1.4,.64,1) .2s both",opacity:0 }}>
            <BellSVG/>
          </div>
          <FU delay={0.65} size={10} color="#fbbf24" weight={700} lsp="0.3em" upper>Alarm {add?"Set":"Updated"}</FU>
          <FU delay={0.8} size={18} color="#fff" weight={800} mt={6} mb={4}>{add?"Alarm Set!":"Alarm Updated!"}</FU>
          <FU delay={0.95} color="rgba(253,230,138,.7)" mb={22}>Your alarm has been {add?"scheduled successfully.":"updated."}</FU>
          <Btn delay={1.1} label="⏰ All Set!" bg="linear-gradient(90deg,#d97706,#b45309)" shadow="0 8px 24px rgba(217,119,6,.44)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

function TrashSVG() {
  return (
    <svg width="70" height="80" viewBox="0 0 70 80">
      <defs>
        <linearGradient id="mpTrBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#dc2626"/>
          <stop offset="60%"  stopColor="#b91c1c"/>
          <stop offset="100%" stopColor="#7f1d1d"/>
        </linearGradient>
        <linearGradient id="mpTrLid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#ef4444"/>
          <stop offset="100%" stopColor="#dc2626"/>
        </linearGradient>
        <linearGradient id="mpTrShine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="rgba(255,255,255,.18)"/>
          <stop offset="60%"  stopColor="rgba(255,255,255,0)"/>
        </linearGradient>
      </defs>
      <ellipse cx="35" cy="78" rx="22" ry="3" fill="rgba(0,0,0,.4)"/>
      {/* Handle */}
      <rect x="26" y="4" width="18" height="8" rx="3.5" fill="url(#mpTrLid)" stroke="rgba(255,255,255,.2)" strokeWidth="1"/>
      {/* Lid */}
      <rect x="8" y="12" width="54" height="11" rx="4" fill="url(#mpTrLid)"
        style={{ filter:"drop-shadow(0 3px 8px rgba(239,68,68,.5))" }}/>
      {/* Body */}
      <path d="M12 23 L14 73 Q14 76 17 76 L53 76 Q56 76 56 73 L58 23 Z" fill="url(#mpTrBody)"
        style={{ filter:"drop-shadow(0 4px 14px rgba(220,38,38,.5))" }}/>
      <path d="M12 23 L14 73 Q14 76 17 76 L35 76 L35 23 Z" fill="url(#mpTrShine)" opacity=".5"/>
      {/* Vertical stripes */}
      {[30,42,54].map((x,i)=>(
        <line key={i} x1={x} y1="32" x2={x} y2="68" stroke="rgba(255,255,255,.22)" strokeWidth="2.5" strokeLinecap="round"
          style={{ animation:`mapKfFadeUp .4s ease ${.45+i*.12}s both`,opacity:0 }}/>
      ))}
    </svg>
  );
}

function DeletePopup({ onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(10,2,2,.94)" }} onClick={onClose}>
      <div className="absolute w-72 h-72 rounded-full pointer-events-none"
        style={{ background:"radial-gradient(circle,rgba(239,68,68,.13),transparent 70%)" }}/>
      {[18,32,46].map((r,i)=>(
        <div key={i} className="absolute pointer-events-none" style={{
          borderRadius:"50%",border:"1.5px solid rgba(239,68,68,.35)",inset:`calc(50% - ${r}px)`,
          animation:`mapKfRipple 2.4s ease-out ${1.0+i*.4}s infinite` }}/>
      ))}
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#1a0505,#200808)",border:"1px solid rgba(239,68,68,.38)",
          boxShadow:"0 28px 70px rgba(0,0,0,.9),0 0 50px rgba(239,68,68,.18)",
          animation:"mapKfCardSlide .7s cubic-bezier(.3,1.3,.6,1) both" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#dc2626,#b91c1c,#ef4444)" }}/>
        <div className="px-7 py-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ width:70,height:80,animation:"mapKfShieldDrop .7s cubic-bezier(.34,1.2,.64,1) .2s both",opacity:0 }}>
            <TrashSVG/>
          </div>
          <FU delay={0.6}  size={10} color="#f87171" weight={700} lsp="0.3em" upper>Record Deleted</FU>
          <FU delay={0.75} size={18} color="#fff" weight={800} mt={6} mb={4}>Deleted Successfully!</FU>
          <FU delay={0.9}  color="rgba(252,165,165,.75)" mb={22}>The record has been permanently removed from the system.</FU>
          <Btn delay={1.05} label="🗑️ Confirmed" bg="linear-gradient(90deg,#dc2626,#b91c1c)" shadow="0 8px 24px rgba(220,38,38,.46)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

/* ─── Master → Component map ──────────────────────────────── */
const POPUP_MAP = {
  trip:       TripPopup,
  vehicles:   VehiclesPopup,
  itinerary:  ItineraryPopup,
  groups:     GroupsPopup,
  members:    MembersPopup,
  admins:     AdminsPopup,
  attendance: AttendancePopup,
  tasks:      TasksPopup,
  expenses:   ExpensesPopup,
  gallery:    GalleryPopup,
  checklist:  ChecklistPopup,
  polls:      PollsPopup,
  share:      SharePopup,
  alarms:     AlarmsPopup,
};

/* ─── Public component ────────────────────────────────────── */
export default function MasterActionPopup({ master, action, open, onClose }) {
  useKF();
  if (!open || !master) return null;
  if (action === "delete") return <DeletePopup onClose={onClose} />;
  const Component = POPUP_MAP[master];
  if (!Component) return null;
  return <Component action={action} onClose={onClose} />;
}
