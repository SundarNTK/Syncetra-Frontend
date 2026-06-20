import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const STARS = Array.from({ length: 30 }, (_, i) => ({
  x:    ((i * 37 + 11) % 97) + 1,
  y:    ((i * 53 + 7)  % 91) + 3,
  size: 1.2 + (i % 4) * 0.65,
  delay:`${((i * 0.41) % 3).toFixed(2)}s`,
  dur:  `${(1.5 + (i % 5) * 0.4).toFixed(1)}s`,
}));
const CC = ["#10b981","#f59e0b","#3b82f6","#ec4899","#8b5cf6","#f97316","#06b6d4","#84cc16","#ef4444"];
const CONFETTI = Array.from({ length: 24 }, (_, i) => ({
  left:`${((i*13+5)%96)+2}%`, color:CC[i%9],
  delay:`${((i*0.14)%1.5).toFixed(2)}s`, dur:`${(1.3+(i%6)*0.2).toFixed(2)}s`,
  rotate:`${i%2===0?1:-1}turn`, w:i%3===0?(7+(i%4)*3):(5+(i%4)*2),
  h:i%3===0?(7+(i%4)*3):(10+(i%4)*3), round:i%3===0?"50%":3,
}));

const KF = `
@keyframes starTwinkle{0%,100%{opacity:.1;transform:scale(.7);}50%{opacity:1;transform:scale(1.4);}}
@keyframes cardLand{0%{transform:translateY(55px)scale(.93);opacity:0;}55%{transform:translateY(-9px)scale(1.01);opacity:1;}75%{transform:translateY(5px);}100%{transform:translateY(0)scale(1);opacity:1;}}
@keyframes cardSlide{0%{transform:translateY(80px);opacity:0;}100%{transform:translateY(0);opacity:1;}}
@keyframes cardZoom{0%{transform:scale(.3)rotate(-8deg);opacity:0;}55%{transform:scale(1.06)rotate(2deg);opacity:1;}75%{transform:scale(.97);}100%{transform:scale(1)rotate(0);opacity:1;}}
@keyframes fadeUp{0%{transform:translateY(18px);opacity:0;}100%{transform:translateY(0);opacity:1;}}
@keyframes cloudDrift{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
@keyframes bounceIn{0%{transform:scale(0)rotate(-18deg);opacity:0;}55%{transform:scale(1.28)rotate(6deg);opacity:1;}72%{transform:scale(.9)rotate(-2deg);}87%{transform:scale(1.05);}100%{transform:scale(1)rotate(0);opacity:1;}}

/* ── F1: Commercial airliner ── */
@keyframes planeFly{0%{transform:translate(-55vw,0)rotate(-10deg);opacity:0;}6%{opacity:1;}50%{transform:translate(0,-28px)rotate(-13deg);}94%{opacity:1;}100%{transform:translate(55vw,-65px)rotate(-20deg);opacity:0;}}
@keyframes trailFade{0%{width:0;opacity:0;}25%{width:130px;opacity:.5;}70%{width:90px;opacity:.28;}100%{width:35px;opacity:0;}}

/* ── F2: Supersonic fighter ── */
@keyframes jetStreak{0%{transform:translate(-60vw,25vh)rotate(-32deg);opacity:0;}5%{opacity:1;}48%{transform:translate(2vw,-2vh)rotate(-36deg);}52%{transform:translate(4vw,-4vh)rotate(-36deg);}95%{opacity:1;}100%{transform:translate(65vw,-32vh)rotate(-42deg);opacity:0;}}
@keyframes boomRing{0%{transform:scale(.2);opacity:.9;}100%{transform:scale(4);opacity:0;}}
@keyframes afterglow{0%,100%{opacity:.6;}50%{opacity:1;}}

/* ── F3: Paper plane sunset ── */
@keyframes paperGlide{0%{transform:translate(-50vw,8vh)rotate(10deg);opacity:0;}8%{opacity:1;}35%{transform:translate(-5vw,-2vh)rotate(-3deg);}65%{transform:translate(12vw,-18vh)rotate(-9deg);}92%{opacity:1;}100%{transform:translate(55vw,-30vh)rotate(-18deg);opacity:0;}}
@keyframes paperWobble{0%,100%{transform:rotate(-6deg)translateY(0);}50%{transform:rotate(5deg)translateY(-9px);}}
@keyframes dotTrail{0%{opacity:.7;transform:scale(1);}100%{opacity:0;transform:scale(2.5);}}

/* ── F4: Rocket ── */
@keyframes rocketLaunch{0%{transform:translateY(80vh)scale(1);opacity:0;}6%{opacity:1;transform:translateY(70vh);}40%{transform:translateY(0)scale(1.05);}70%{transform:translateY(-40vh)scale(.9);opacity:1;}100%{transform:translateY(-110vh)scale(.4);opacity:0;}}
@keyframes flameDance{0%,100%{transform:scaleY(1)scaleX(1);}50%{transform:scaleY(1.35)scaleX(.78);}}
@keyframes speedLine{0%{opacity:.7;transform:translateY(0);}100%{opacity:0;transform:translateY(100vh);}}

/* ── F5: Hot air balloon ── */
@keyframes balloonRise{0%{transform:translateY(130vh);opacity:0;}8%{opacity:1;}100%{transform:translateY(-25vh);opacity:1;}}
@keyframes balloonSway{0%,100%{transform:rotate(-4deg);}50%{transform:rotate(4deg);}}
@keyframes birdFly{0%{transform:translateX(100vw);}100%{transform:translateX(-20vw);}}

/* ── F6: Biplane ── */
@keyframes biplaneSwoop{0%{transform:translate(65vw,15vh)rotate(12deg)scaleX(-1);opacity:0;}8%{opacity:1;}45%{transform:translate(0,0)rotate(-8deg)scaleX(-1);}92%{opacity:1;}100%{transform:translate(-65vw,22vh)rotate(-22deg)scaleX(-1);opacity:0;}}
@keyframes propSpin{100%{transform:rotate(360deg);}}
@keyframes smokeBlob{0%{opacity:.5;transform:scale(.4);}100%{opacity:0;transform:scale(2.8);}}

/* ── F7: Helicopter ── */
@keyframes heliFly{0%{transform:translate(55vw,0);opacity:0;}7%{opacity:1;}45%{transform:translate(0,-10px);}55%{transform:translate(0,-10px);}93%{opacity:1;}100%{transform:translate(-58vw,8px);opacity:0;}}
@keyframes heliHover{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
@keyframes rotorSpin{100%{transform:rotate(360deg);}}
@keyframes searchLight{0%,100%{opacity:.12;transform:scaleX(.8);}50%{opacity:.28;transform:scaleX(1.1);}}

/* ── F8: Concorde ── */
@keyframes concordeFly{0%{transform:translate(-60vw,-5vh)rotate(-8deg);opacity:0;}6%{opacity:1;}48%{transform:translate(2vw,-15vh)rotate(-10deg);}52%{transform:translate(5vw,-16vh)rotate(-10deg);}94%{opacity:1;}100%{transform:translate(62vw,-28vh)rotate(-14deg);opacity:0;}}
@keyframes machCone{0%{transform:scaleX(0);opacity:0;}30%{opacity:.7;}100%{transform:scaleX(2.5);opacity:0;}}

/* ── F9: Space Shuttle ── */
@keyframes shuttleFly{0%{transform:translate(52vw,-35vh)rotate(38deg);opacity:0;}8%{opacity:1;}45%{transform:translate(5vw,-8vh)rotate(28deg);}55%{transform:translate(-5vw,2vh)rotate(22deg);}92%{opacity:1;}100%{transform:translate(-58vw,38vh)rotate(12deg);opacity:0;}}
@keyframes heatGlow{0%,100%{opacity:.55;}50%{opacity:.9;}}
@keyframes reentryTrail{0%{width:0;opacity:0;}20%{width:180px;opacity:.65;}70%{width:120px;opacity:.3;}100%{width:20px;opacity:0;}}

/* ── F10: Airship / Blimp ── */
@keyframes blimpDrift{0%{transform:translate(-60vw,0);opacity:0;}7%{opacity:1;}93%{opacity:1;}100%{transform:translate(62vw,5px);opacity:0;}}
@keyframes blimpSway{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
@keyframes propellerSpin{100%{transform:rotate(360deg);}}

/* ── F11: Private Jet ── */
@keyframes privJetBank{0%{transform:translate(-55vw,0)rotate(-6deg);opacity:0;}6%{opacity:1;}50%{transform:translate(0,-22px)rotate(-8deg);}94%{opacity:1;}100%{transform:translate(57vw,-50px)rotate(-12deg);opacity:0;}}
@keyframes wingletGlow{0%,100%{opacity:.5;}50%{opacity:1;}}

/* ── F12: UFO ── */
@keyframes ufoHover{0%{transform:translateY(120vh)rotate(0);opacity:0;}8%{opacity:1;transform:translateY(30vh)rotate(0);}40%{transform:translateY(10vh)rotate(180deg);}60%{transform:translateY(10vh)rotate(360deg);}80%{opacity:1;}100%{transform:translateY(-110vh)rotate(540deg);opacity:0;}}
@keyframes ufoSpin{100%{transform:rotate(360deg);}}
@keyframes ufoBeam{0%,100%{opacity:.12;transform:scaleX(.5);}50%{opacity:.45;transform:scaleX(1);}}
@keyframes ufoLight{0%,100%{opacity:.4;}50%{opacity:1;}}

/* ── Other styles ── */
@keyframes confettiFall{0%{transform:translateY(-20px)rotate(0turn);opacity:1;}100%{transform:translateY(108vh)rotate(var(--cr,1turn));opacity:0;}}
@keyframes trophyIn{0%{transform:scale(0)rotate(-20deg);opacity:0;}55%{transform:scale(1.3)rotate(8deg);opacity:1;}72%{transform:scale(.88)rotate(-3deg);}86%{transform:scale(1.06)rotate(1deg);}100%{transform:scale(1)rotate(0);opacity:1;}}
@keyframes shimmerBar{0%{background-position:-300% center;}100%{background-position:300% center;}}
@keyframes routeDraw{0%{stroke-dashoffset:420;}100%{stroke-dashoffset:0;}}
@keyframes pinDrop{0%{transform:translateY(-110px)scale(.85);opacity:0;}60%{transform:translateY(13px)scale(1.05);opacity:1;}76%{transform:translateY(-9px)scale(.97);}88%{transform:translateY(5px)scale(1.02);}100%{transform:translateY(0)scale(1);opacity:1;}}
@keyframes ripplePing{0%{transform:scale(.15);opacity:.85;}100%{transform:scale(3);opacity:0;}}
@keyframes spinFlip{0%{transform:perspective(900px)rotateY(-180deg)scale(.22);opacity:0;}55%{transform:perspective(900px)rotateY(18deg)scale(1.04);opacity:1;}75%{transform:perspective(900px)rotateY(-9deg)scale(.97);}90%{transform:perspective(900px)rotateY(4deg);}100%{transform:perspective(900px)rotateY(0)scale(1);opacity:1;}}
@keyframes orbitDot{100%{transform:rotate(360deg);}}
@keyframes busRide{0%{transform:translateX(-55vw);opacity:0;}8%{opacity:1;}92%{opacity:1;}100%{transform:translateX(55vw);opacity:0;}}
@keyframes busBounce{0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);}}
@keyframes roadScroll{0%{background-position:0 0;}100%{background-position:200px 0;}}
@keyframes stampSlam{0%{transform:translateY(-220px)rotate(-6deg)scale(1.25);opacity:0;}65%{transform:translateY(5px)rotate(1deg)scale(1);opacity:1;}80%{transform:translateY(-7px)rotate(-.5deg);}100%{transform:translateY(0)rotate(0)scale(1);opacity:1;}}
@keyframes stampFlash{0%,62%{opacity:0;}65%{opacity:.45;}100%{opacity:0;}}
@keyframes passportUp{0%{transform:translateY(90px)scale(.95);opacity:0;}100%{transform:translateY(0)scale(1);opacity:1;}}
@keyframes flagWave{0%,100%{transform:rotate(-4deg)skewY(2deg);}50%{transform:rotate(4deg)skewY(-2deg);}}
`;

/* ════════════════════════════════════════════════════════════
   CARD HELPERS
════════════════════════════════════════════════════════════ */
function FU({ d, size=13, color, weight=400, lsp, upper, mt=0, mb=8, children }) {
  return (
    <p style={{ fontSize:size, color, fontWeight:weight, letterSpacing:lsp,
      textTransform:upper?"uppercase":undefined, marginTop:mt, marginBottom:mb,
      animation:`fadeUp .5s ease ${d}s both`, opacity:0 }}>
      {children}
    </p>
  );
}
function Btn({ d, label, bg, shadow, onClose }) {
  return (
    <button onClick={onClose} style={{ width:"100%", padding:"11px", borderRadius:12,
      fontWeight:700, fontSize:13, background:bg, color:"#fff", border:"none", cursor:"pointer",
      boxShadow:shadow, animation:`fadeUp .5s ease ${d}s both`, opacity:0 }}>
      {label}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════
   FLIGHT STYLE 1 — Commercial Airliner  (night sky)
════════════════════════════════════════════════════════════ */
function Flight1({ onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] overflow-hidden"
      style={{ background:"linear-gradient(160deg,#04091f 0%,#091640 55%,#070e2c 100%)" }}>
      {STARS.map((s,i)=>(
        <div key={i} className="absolute rounded-full bg-white pointer-events-none"
          style={{ left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,
            animation:`starTwinkle ${s.dur} ease-in-out ${s.delay} infinite` }}/>
      ))}
      {/* Contrail */}
      <div className="absolute pointer-events-none"
        style={{ top:"40%",left:"20%",height:2,borderRadius:1,
          background:"linear-gradient(90deg,rgba(99,179,237,.55),transparent)",
          animation:"trailFade 2.1s ease-out .35s both",width:0 }}/>
      {/* Detailed airliner SVG */}
      <div className="absolute pointer-events-none"
        style={{ top:"35%",animation:"planeFly 2.7s cubic-bezier(.4,0,.55,1) .1s both",opacity:0 }}>
        <svg width="190" height="68" viewBox="0 0 190 68" style={{ filter:"drop-shadow(0 6px 16px rgba(0,0,0,.6))" }}>
          <defs>
            <linearGradient id="f1body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#eef2ff"/><stop offset="50%" stopColor="#dce6ff"/><stop offset="100%" stopColor="#b0c4e4"/>
            </linearGradient>
            <linearGradient id="f1wing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c4d4ec"/><stop offset="100%" stopColor="#7896b8"/>
            </linearGradient>
            <linearGradient id="f1eng" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9ca3af"/><stop offset="100%" stopColor="#1f2937"/>
            </linearGradient>
          </defs>
          {/* Fuselage */}
          <path d="M18 28 Q10 28 6 34 Q3 36 6 40 Q10 44 18 42 L164 36 Q178 35 184 34 Q188 34 190 34 Q188 35 184 36 L164 38 Z" fill="url(#f1body)"/>
          {/* Main wings */}
          <path d="M84 35 L38 8 L58 34 L38 60 Z" fill="url(#f1wing)" style={{ filter:"drop-shadow(0 2px 4px rgba(0,0,0,.35))" }}/>
          {/* Left engine */}
          <ellipse cx="48" cy="48" rx="13" ry="5" fill="url(#f1eng)"/>
          <ellipse cx="48" cy="48" rx="6" ry="4.2" fill="#111827"/>
          <ellipse cx="59" cy="48" rx="3" ry="4.8" fill="#6b7280" stroke="#9ca3af" strokeWidth=".5"/>
          {/* Far wing */}
          <path d="M84 35 L91 27 L96 34 L91 43 Z" fill="url(#f1wing)" opacity=".6"/>
          {/* Tail */}
          <path d="M20 35 L10 17 L26 34 Z" fill="url(#f1wing)"/>
          <path d="M20 35 L10 53 L26 36 Z" fill="url(#f1wing)"/>
          <path d="M16 35 L11 16 L22 34" fill="url(#f1wing)" opacity=".85"/>
          {/* Livery stripe */}
          <path d="M26 34.5 L162 32.5 L162 34 L26 36 Z" fill="rgba(59,130,246,.65)"/>
          {/* Windows */}
          {[96,108,120,132,144,155].map((x,i)=>(
            <rect key={i} x={x} y="31" width="7" height="5" rx="2" fill={`rgba(186,230,253,${.72-i*.04})`}/>
          ))}
          {/* Nose window */}
          <ellipse cx="172" cy="34" rx="5" ry="3" fill="rgba(186,230,253,.45)"/>
          {/* Landing light */}
          <circle cx="189" cy="35" r="3" fill="rgba(253,224,71,.95)" style={{ filter:"blur(1px) drop-shadow(0 0 5px rgba(253,224,71,.8))" }}/>
        </svg>
      </div>
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
        <div className="pointer-events-auto w-full max-w-[338px] rounded-2xl overflow-hidden"
          style={{ background:"linear-gradient(145deg,#0c1a42,#0f2258)",
            border:"1px solid rgba(99,130,255,.35)",
            boxShadow:"0 24px 64px rgba(0,0,0,.75),0 0 50px rgba(59,130,246,.12)",
            animation:"cardLand .85s cubic-bezier(.3,1.4,.6,1) 2.1s both" }}>
          <div style={{ height:3,background:"linear-gradient(90deg,#3b82f6,#06b6d4,#10b981)" }}/>
          <div className="px-7 py-8 text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background:"rgba(59,130,246,.14)",border:"1px solid rgba(59,130,246,.35)",
                boxShadow:"0 0 26px rgba(59,130,246,.28)",animation:"cloudDrift 3.2s ease-in-out 2.6s infinite" }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.27 3.13A59.77 59.77 0 0121.49 12a59.77 59.77 0 01-18.22 8.87L6 12zm0 0h7.5"/>
              </svg>
            </div>
            <FU d={2.2} size={10} color="#60a5fa" weight={700} lsp="0.32em" upper>Trip Saved</FU>
            <FU d={2.35} size={18} color="#fff" weight={800} mt={6} mb={4}>Boarding Complete!</FU>
            <FU d={2.5} color="rgba(148,163,184,1)" mb={24}>Your trip details have been saved successfully.</FU>
            <Btn d={2.65} label="✈️ Awesome!" bg="linear-gradient(90deg,#3b82f6,#06b6d4)" shadow="0 8px 24px rgba(59,130,246,.42)" onClose={onClose}/>
          </div>
        </div>
      </div>
    </div>, document.body
  );
}

/* ════════════════════════════════════════════════════════════
   FLIGHT STYLE 2 — Supersonic Fighter Jet  (day sky, lightning-fast)
════════════════════════════════════════════════════════════ */
function Flight2({ onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] overflow-hidden"
      style={{ background:"linear-gradient(160deg,#0d2055 0%,#1a3a8c 45%,#0a1540 100%)" }}>
      {/* Cloud streaks */}
      {[15,35,58,75].map((y,i)=>(
        <div key={i} className="absolute pointer-events-none"
          style={{ top:`${y}%`,left:`${5+i*18}%`,width:60+i*20,height:6,borderRadius:8,
            background:"rgba(255,255,255,.06)",animation:`cloudDrift ${4+i}s ease-in-out ${i*.4}s infinite` }}/>
      ))}
      {/* Sonic boom rings (mid-screen) */}
      {[0,.3,.6].map((d,i)=>(
        <div key={i} className="absolute pointer-events-none"
          style={{ width:20,height:20,borderRadius:"50%",border:"2px solid rgba(255,160,40,.5)",
            left:"50%",top:"44%",marginLeft:-10,marginTop:-10,
            animation:`boomRing .8s ease-out ${1.1+d}s both` }}/>
      ))}
      {/* Fighter jet */}
      <div className="absolute pointer-events-none"
        style={{ top:"36%",animation:"jetStreak .55s cubic-bezier(.2,0,.4,1) .8s both",opacity:0 }}>
        {/* Afterburner trail */}
        <div style={{ position:"absolute",right:"100%",top:"50%",transform:"translateY(-50%)",
          width:80,height:6,borderRadius:3,
          background:"linear-gradient(90deg,transparent,rgba(255,120,30,.65),rgba(255,200,60,.8))",
          animation:"afterglow .3s ease-in-out infinite" }}/>
        <svg width="120" height="40" viewBox="0 0 120 40" style={{ filter:"drop-shadow(0 4px 12px rgba(0,0,0,.5))" }}>
          <defs>
            <linearGradient id="f2jet" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6b7280"/><stop offset="60%" stopColor="#d1d5db"/><stop offset="100%" stopColor="#f3f4f6"/>
            </linearGradient>
            <linearGradient id="f2wing" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9ca3af"/><stop offset="100%" stopColor="#4b5563"/>
            </linearGradient>
          </defs>
          {/* Fuselage */}
          <path d="M4 20 Q2 18 8 17 L100 15 Q112 15 118 19 Q120 20 118 21 Q112 25 100 25 L8 23 Q2 22 4 20Z" fill="url(#f2jet)"/>
          {/* Delta wing main */}
          <path d="M30 20 L0 4 L55 18 Z" fill="url(#f2wing)"/>
          <path d="M30 20 L0 36 L55 22 Z" fill="url(#f2wing)"/>
          {/* Canards */}
          <path d="M80 20 L68 12 L85 19 Z" fill="url(#f2wing)" opacity=".85"/>
          <path d="M80 20 L68 28 L85 21 Z" fill="url(#f2wing)" opacity=".85"/>
          {/* Tail fin */}
          <path d="M12 20 L6 10 L18 19 Z" fill="#374151"/>
          {/* Cockpit */}
          <path d="M96 20 Q102 14 108 16 L110 20 Q108 24 102 26Z" fill="rgba(100,180,240,.55)"/>
          <path d="M98 20 Q103 16 107 18 L108 20 Q107 23 103 24Z" fill="rgba(150,210,255,.35)"/>
          {/* Intake vents */}
          <ellipse cx="45" cy="19" rx="4" ry="2.5" fill="#1f2937"/>
          <ellipse cx="45" cy="21" rx="4" ry="2.5" fill="#1f2937"/>
          {/* Afterburner cone */}
          <path d="M4 17 L0 19 L0 21 L4 23Z" fill="rgba(255,180,40,.9)"/>
          {/* Exhaust ring */}
          <ellipse cx="4" cy="20" rx="3" ry="4" fill="rgba(255,100,0,.7)" style={{ animation:"afterglow .25s ease-in-out infinite" }}/>
          {/* Nation markings */}
          <rect x="60" y="17.5" width="12" height="5" rx="1" fill="rgba(255,80,80,.5)"/>
          <rect x="62" y="18" width="8" height="4" rx=".5" fill="rgba(255,255,255,.15)"/>
        </svg>
      </div>
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
        <div className="pointer-events-auto w-full max-w-[338px] rounded-2xl overflow-hidden"
          style={{ background:"linear-gradient(145deg,#0a1530,#0f1e48)",
            border:"1px solid rgba(99,160,255,.4)",
            boxShadow:"0 24px 64px rgba(0,0,0,.8),0 0 40px rgba(59,100,255,.15)",
            animation:"cardZoom .7s cubic-bezier(.3,1.3,.6,1) 1.7s both" }}>
          <div style={{ height:3,background:"linear-gradient(90deg,#f59e0b,#ef4444,#3b82f6)" }}/>
          <div className="px-7 py-8 text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ background:"rgba(239,68,68,.12)",border:"1px solid rgba(239,68,68,.35)",
                boxShadow:"0 0 22px rgba(239,68,68,.25)" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
              </svg>
            </div>
            <FU d={1.85} size={10} color="#f87171" weight={700} lsp="0.32em" upper>Supersonic Speed</FU>
            <FU d={2.0} size={18} color="#fff" weight={800} mt={6} mb={4}>Locked In!</FU>
            <FU d={2.15} color="rgba(148,163,184,1)" mb={24}>Your trip data saved at the speed of sound.</FU>
            <Btn d={2.3} label="🚀 Roger That!" bg="linear-gradient(90deg,#ef4444,#b91c1c)" shadow="0 8px 24px rgba(239,68,68,.4)" onClose={onClose}/>
          </div>
        </div>
      </div>
    </div>, document.body
  );
}

/* ════════════════════════════════════════════════════════════
   FLIGHT STYLE 3 — Paper Plane  (warm sunset sky)
════════════════════════════════════════════════════════════ */
function Flight3({ onClose }) {
  const dots = Array.from({length:8},(_,i)=>({
    x: `${15+i*9}%`, y:`${38+Math.sin(i)*6}%`,
    size: 3+i%3, delay:`${i*.12}s`,
  }));
  return createPortal(
    <div className="fixed inset-0 z-[300] overflow-hidden"
      style={{ background:"linear-gradient(175deg,#1a0a2e 0%,#3d1a6e 25%,#8b2252 52%,#d45a2a 75%,#f09a3a 100%)" }}>
      {/* Sunset glow */}
      <div className="absolute pointer-events-none"
        style={{ bottom:0,left:0,right:0,height:"30%",
          background:"linear-gradient(to top,rgba(240,154,58,.35),transparent)" }}/>
      {/* Paper trail dots */}
      {dots.map((d,i)=>(
        <div key={i} className="absolute rounded-full pointer-events-none"
          style={{ left:d.x,top:d.y,width:d.size,height:d.size,
            background:"rgba(255,255,255,.45)",
            animation:`dotTrail 1.8s ease-out ${d.delay} infinite` }}/>
      ))}
      {/* Paper plane */}
      <div className="absolute pointer-events-none"
        style={{ top:"30%",animation:"paperGlide 3s cubic-bezier(.25,.1,.4,.9) .2s both",opacity:0 }}>
        <div style={{ animation:"paperWobble 1.4s ease-in-out infinite" }}>
          <svg width="80" height="64" viewBox="0 0 80 64" style={{ filter:"drop-shadow(0 4px 14px rgba(0,0,0,.4))" }}>
            {/* Right top wing */}
            <path d="M40 32 L78 4 L78 34 Z" fill="rgba(255,255,255,.95)"/>
            {/* Left body */}
            <path d="M40 32 L4 22 L40 60 Z" fill="rgba(230,240,255,.88)"/>
            {/* Bottom right fold */}
            <path d="M40 32 L78 34 L40 60 Z" fill="rgba(200,218,248,.78)"/>
            {/* Nose upper */}
            <path d="M40 32 L78 4 L40 12 Z" fill="rgba(248,252,255,.85)"/>
            {/* Center crease line */}
            <line x1="40" y1="32" x2="78" y2="19" stroke="rgba(140,175,220,.35)" strokeWidth=".9"/>
            {/* Fold shadow */}
            <path d="M40 32 L4 22 L40 32 L78 34" fill="none" stroke="rgba(160,190,230,.2)" strokeWidth=".7"/>
          </svg>
        </div>
      </div>
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
        <div className="pointer-events-auto w-full max-w-[338px] rounded-2xl overflow-hidden"
          style={{ background:"linear-gradient(145deg,#2d0f3a,#3d1050)",
            border:"1px solid rgba(250,150,80,.32)",
            boxShadow:"0 24px 64px rgba(0,0,0,.78),0 0 50px rgba(210,90,42,.18)",
            animation:"cardSlide .85s cubic-bezier(.3,1.3,.6,1) 2s both" }}>
          <div style={{ height:3,background:"linear-gradient(90deg,#f09a3a,#d45a2a,#8b2252,#3d1a6e)" }}/>
          <div className="px-7 py-8 text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background:"rgba(240,154,58,.15)",border:"1px solid rgba(240,154,58,.35)",
                boxShadow:"0 0 24px rgba(240,154,58,.28)",animation:"cloudDrift 3.5s ease-in-out 2.5s infinite" }}>
              <svg width="32" height="32" viewBox="0 0 80 64">
                <path d="M40 32 L78 4 L78 34 Z" fill="rgba(255,255,255,.9)"/>
                <path d="M40 32 L4 22 L40 60 Z" fill="rgba(230,240,255,.8)"/>
                <path d="M40 32 L78 34 L40 60 Z" fill="rgba(200,218,248,.72)"/>
                <path d="M40 32 L78 4 L40 12 Z" fill="rgba(248,252,255,.8)"/>
              </svg>
            </div>
            <FU d={2.1} size={10} color="#f09a3a" weight={700} lsp="0.32em" upper>Message Sent</FU>
            <FU d={2.25} size={18} color="#fff" weight={800} mt={6} mb={4}>Delivered!</FU>
            <FU d={2.4} color="rgba(220,180,140,1)" mb={24}>Your trip has been saved and sent off.</FU>
            <Btn d={2.55} label="🌅 Beautiful!" bg="linear-gradient(90deg,#d45a2a,#8b2252)" shadow="0 8px 24px rgba(212,90,42,.44)" onClose={onClose}/>
          </div>
        </div>
      </div>
    </div>, document.body
  );
}

/* ════════════════════════════════════════════════════════════
   FLIGHT STYLE 4 — Space Rocket  (deep space launch)
════════════════════════════════════════════════════════════ */
function Flight4({ onClose }) {
  const speedLines = Array.from({length:12},(_,i)=>({
    left:`${5+i*8}%`, h:40+i%4*30, delay:`${i*.08}s`,
  }));
  return createPortal(
    <div className="fixed inset-0 z-[300] overflow-hidden"
      style={{ background:"linear-gradient(180deg,#00010a 0%,#04062a 40%,#080c3a 100%)" }}>
      {STARS.map((s,i)=>(
        <div key={i} className="absolute rounded-full bg-white pointer-events-none"
          style={{ left:`${s.x}%`,top:`${s.y}%`,width:s.size*.8,height:s.size*.8,
            animation:`starTwinkle ${s.dur} ease-in-out ${s.delay} infinite` }}/>
      ))}
      {/* Moon */}
      <div className="absolute pointer-events-none"
        style={{ top:"8%",right:"12%",width:48,height:48,borderRadius:"50%",
          background:"linear-gradient(130deg,#e8e0c8,#c8bfa0)",
          boxShadow:"0 0 28px rgba(240,228,180,.28)" }}/>
      {/* Speed lines streaming down */}
      {speedLines.map((l,i)=>(
        <div key={i} className="absolute pointer-events-none"
          style={{ left:l.left,top:"-10%",width:1.5,height:l.h,
            background:"linear-gradient(to bottom,transparent,rgba(130,160,255,.55),transparent)",
            animation:`speedLine 1.2s ease-out ${l.delay} infinite` }}/>
      ))}
      {/* Rocket — outer div drives the launch animation; inner div is the size reference */}
      <div className="absolute pointer-events-none"
        style={{ left:"calc(50% - 35px)",animation:"rocketLaunch 2.4s cubic-bezier(.4,0,.2,1) .1s both",opacity:0 }}>
        {/* position:relative so flame divs are anchored to this box */}
        <div style={{ position:"relative",width:70,height:154 }}>
          <svg width="70" height="154" viewBox="0 0 40 88" style={{ display:"block",filter:"drop-shadow(0 0 14px rgba(59,130,246,.6))" }}>
            <defs>
              <linearGradient id="f4rocket" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#c0cfe8"/><stop offset="50%" stopColor="#eef4ff"/><stop offset="100%" stopColor="#c0cfe8"/>
              </linearGradient>
              <linearGradient id="f4nose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444"/><stop offset="100%" stopColor="#b91c1c"/>
              </linearGradient>
              <radialGradient id="f4window" cx="35%" cy="35%" r="55%">
                <stop offset="0%" stopColor="rgba(186,230,255,.8)"/><stop offset="100%" stopColor="rgba(37,99,235,.5)"/>
              </radialGradient>
            </defs>
            {/* Nose cone */}
            <path d="M10 22 Q20 0 30 22Z" fill="url(#f4nose)"/>
            {/* Body */}
            <rect x="10" y="22" width="20" height="46" rx="3" fill="url(#f4rocket)"/>
            {/* Body shadow edge */}
            <rect x="10" y="22" width="3" height="46" rx="2" fill="rgba(0,0,0,.08)"/>
            {/* Porthole window */}
            <circle cx="20" cy="38" r="8" fill="url(#f4window)" stroke="rgba(147,197,253,.5)" strokeWidth="1.5"/>
            <circle cx="20" cy="38" r="5" fill="rgba(37,99,235,.4)"/>
            <circle cx="17" cy="35" r="2" fill="rgba(255,255,255,.35)"/>
            {/* Detail stripes */}
            <rect x="10" y="51" width="20" height="3.5" fill="rgba(239,68,68,.6)"/>
            <rect x="10" y="58" width="20" height="2.5" fill="rgba(148,163,184,.25)"/>
            {/* Fins */}
            <path d="M10 57 L1 78 L10 68Z" fill="url(#f4nose)"/>
            <path d="M30 57 L39 78 L30 68Z" fill="url(#f4nose)"/>
            {/* Fin shadows */}
            <path d="M10 57 L4 72 L10 64Z" fill="rgba(0,0,0,.15)"/>
            <path d="M30 57 L36 72 L30 64Z" fill="rgba(0,0,0,.15)"/>
            {/* Exhaust bell */}
            <path d="M13 68 L8 78 L32 78 L27 68Z" fill="#1e2a3a"/>
            <ellipse cx="20" cy="68" rx="7.5" ry="2.8" fill="#0f172a"/>
            {/* Bell inner throat glow */}
            <ellipse cx="20" cy="68" rx="4.5" ry="1.8" fill="rgba(255,140,0,.4)"/>
          </svg>
          {/* ── Exhaust flames anchored at nozzle exit (y=78 in viewBox → 78/88*154 ≈ 136px) ──
               Centering via left:calc(50%-halfWidth) not transform:translateX(-50%) because
               flameDance animation sets transform and would override the centering. ── */}
          {/* Outer flame — width 40, half=20 → left=35-20=15 */}
          <div style={{ position:"absolute",top:133,left:15,
            width:40,height:62,borderRadius:"0 0 55% 55%",
            background:"linear-gradient(to bottom,rgba(255,210,30,.95),rgba(255,80,0,.8),rgba(255,40,0,.3),transparent)",
            filter:"blur(1px)",
            animation:"flameDance .18s ease-in-out infinite" }}/>
          {/* Mid flame — width 24, half=12 → left=35-12=23 */}
          <div style={{ position:"absolute",top:133,left:23,
            width:24,height:48,borderRadius:"0 0 50% 50%",
            background:"linear-gradient(to bottom,rgba(255,255,180,.9),rgba(255,160,20,.8),transparent)",
            filter:"blur(.5px)",
            animation:"flameDance .22s ease-in-out .05s infinite" }}/>
          {/* Hot white core — width 12, half=6 → left=35-6=29 */}
          <div style={{ position:"absolute",top:133,left:29,
            width:12,height:30,borderRadius:"0 0 50% 50%",
            background:"linear-gradient(to bottom,rgba(255,255,255,.95),rgba(255,220,100,.7),transparent)",
            animation:"flameDance .15s ease-in-out .03s infinite" }}/>
          {/* Nozzle glow halo — width 60, half=30 → left=35-30=5 */}
          <div style={{ position:"absolute",top:122,left:5,
            width:60,height:24,borderRadius:"50%",
            background:"radial-gradient(ellipse,rgba(255,120,0,.4),rgba(255,60,0,.15),transparent 70%)",
            animation:"flameDance .28s ease-in-out .08s infinite" }}/>
        </div>
      </div>
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
        <div className="pointer-events-auto w-full max-w-[338px] rounded-2xl overflow-hidden"
          style={{ background:"linear-gradient(145deg,#060a28,#090d38)",
            border:"1px solid rgba(99,130,255,.35)",
            boxShadow:"0 24px 64px rgba(0,0,0,.88),0 0 50px rgba(59,80,255,.15)",
            animation:"cardLand .85s cubic-bezier(.3,1.4,.6,1) 2s both" }}>
          <div style={{ height:3,background:"linear-gradient(90deg,#ef4444,#8b5cf6,#3b82f6,#06b6d4)" }}/>
          <div className="px-7 py-8 text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background:"rgba(139,92,246,.14)",border:"1px solid rgba(139,92,246,.38)",
                boxShadow:"0 0 28px rgba(139,92,246,.3)" }}>
              <svg width="30" height="30" viewBox="0 0 40 88">
                <path d="M10 22 Q20 2 30 22Z" fill="#ef4444"/>
                <rect x="10" y="22" width="20" height="46" rx="4" fill="rgba(192,207,232,.9)"/>
                <circle cx="20" cy="38" r="7" fill="rgba(96,165,250,.55)"/>
                <path d="M10 58 L2 76 L10 68Z" fill="#ef4444"/>
                <path d="M30 58 L38 76 L30 68Z" fill="#ef4444"/>
              </svg>
            </div>
            <FU d={2.1} size={10} color="#a78bfa" weight={700} lsp="0.32em" upper>Launch Confirmed</FU>
            <FU d={2.25} size={18} color="#fff" weight={800} mt={6} mb={4}>Trip is Live! 🚀</FU>
            <FU d={2.4} color="rgba(148,163,184,1)" mb={24}>Your trip has been launched into the system.</FU>
            <Btn d={2.55} label="🌌 To The Stars!" bg="linear-gradient(90deg,#7c3aed,#4f46e5)" shadow="0 8px 24px rgba(124,58,237,.44)" onClose={onClose}/>
          </div>
        </div>
      </div>
    </div>, document.body
  );
}

/* ════════════════════════════════════════════════════════════
   FLIGHT STYLE 5 — Hot Air Balloon  (sunrise sky)
════════════════════════════════════════════════════════════ */
function Flight5({ onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] overflow-hidden"
      style={{ background:"linear-gradient(185deg,#1a2744 0%,#2d5486 30%,#6b9fd4 58%,#f0b86e 80%,#f4845a 100%)" }}>
      {/* Sun glow at bottom */}
      <div className="absolute pointer-events-none"
        style={{ bottom:-60,left:"50%",transform:"translateX(-50%)",
          width:260,height:260,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(255,180,80,.5),transparent 70%)" }}/>
      {/* Cloud layers */}
      {[{t:"20%",l:"5%",w:90,op:.18},{t:"14%",l:"55%",w:70,op:.12},{t:"35%",l:"72%",w:55,op:.1}].map((c,i)=>(
        <div key={i} className="absolute pointer-events-none"
          style={{ top:c.t,left:c.l,width:c.w,height:22,borderRadius:14,
            background:`rgba(255,255,255,${c.op})`,
            animation:`cloudDrift ${5+i}s ease-in-out ${i*.6}s infinite` }}/>
      ))}
      {/* Birds */}
      {[{t:"22%",l:"70%",d:"3s"},{t:"18%",l:"80%",d:"4.5s"}].map((b,i)=>(
        <div key={i} className="absolute pointer-events-none"
          style={{ top:b.t,left:b.l,animation:`birdFly ${8+i*2}s linear ${b.d} infinite` }}>
          <svg width="24" height="10" viewBox="0 0 24 10">
            <path d="M0 5 Q6 0 12 5 Q18 0 24 5" fill="none" stroke="rgba(20,40,80,.55)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      ))}
      {/* Hot air balloon */}
      <div className="absolute pointer-events-none"
        style={{ left:"calc(50% - 48px)",animation:"balloonRise 3.5s cubic-bezier(.2,.6,.4,1) .1s both",opacity:0 }}>
        <div style={{ animation:"balloonSway 3s ease-in-out infinite" }}>
          <svg width="96" height="128" viewBox="0 0 96 128" style={{ filter:"drop-shadow(0 8px 20px rgba(0,0,0,.4))" }}>
            <defs>
              <radialGradient id="f5balloon" cx="38%" cy="35%" r="62%">
                <stop offset="0%" stopColor="#ff7043"/><stop offset="45%" stopColor="#e53935"/><stop offset="100%" stopColor="#b71c1c"/>
              </radialGradient>
              <linearGradient id="f5stripe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffd740"/><stop offset="100%" stopColor="#ffa000"/>
              </linearGradient>
            </defs>
            {/* Balloon */}
            <ellipse cx="48" cy="52" rx="40" ry="46" fill="url(#f5balloon)"/>
            {/* Color stripes */}
            <path d="M24 24 Q48 10 72 24 L76 36 Q48 24 20 36Z" fill="url(#f5stripe)"/>
            <path d="M14 46 Q48 34 82 46 L84 54 Q48 42 12 54Z" fill="rgba(255,255,255,.14)"/>
            <path d="M12 60 Q48 50 84 60 L84 68 Q48 58 12 68Z" fill="url(#f5stripe)" opacity=".7"/>
            {/* Highlight */}
            <ellipse cx="34" cy="36" rx="10" ry="14" fill="rgba(255,255,255,.16)"/>
            {/* Ropes */}
            {[30,40,56,66].map((x,i)=>(
              <line key={i} x1={x} y1="96" x2={28+i*10} y2="112" stroke="rgba(100,65,20,.7)" strokeWidth="1.5"/>
            ))}
            {/* Basket */}
            <rect x="28" y="112" width="40" height="16" rx="4" fill="#8b5e3c" stroke="rgba(200,150,80,.5)" strokeWidth="1"/>
            <line x1="38" y1="112" x2="38" y2="128" stroke="rgba(120,80,30,.4)" strokeWidth="1"/>
            <line x1="58" y1="112" x2="58" y2="128" stroke="rgba(120,80,30,.4)" strokeWidth="1"/>
            {/* Envelope top circle */}
            <circle cx="48" cy="6" r="4" fill="rgba(255,215,64,.6)" stroke="rgba(255,215,64,.4)" strokeWidth="1"/>
          </svg>
        </div>
      </div>
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
        <div className="pointer-events-auto w-full max-w-[338px] rounded-2xl overflow-hidden"
          style={{ background:"linear-gradient(145deg,#1a2a44,#22385e)",
            border:"1px solid rgba(240,184,110,.32)",
            boxShadow:"0 24px 64px rgba(0,0,0,.78),0 0 50px rgba(240,160,60,.15)",
            animation:"cardLand .85s cubic-bezier(.3,1.4,.6,1) 2.8s both" }}>
          <div style={{ height:3,background:"linear-gradient(90deg,#f4845a,#f0b86e,#6b9fd4)" }}/>
          <div className="px-7 py-8 text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background:"rgba(240,184,110,.12)",border:"1px solid rgba(240,184,110,.32)",
                boxShadow:"0 0 24px rgba(240,160,60,.22)",animation:"cloudDrift 4s ease-in-out 3.3s infinite" }}>
              <svg width="28" height="36" viewBox="0 0 96 128">
                <ellipse cx="48" cy="52" rx="40" ry="46" fill="#e53935"/>
                <path d="M24 24 Q48 10 72 24 L76 36 Q48 24 20 36Z" fill="#ffd740"/>
                <rect x="28" y="104" width="40" height="16" rx="4" fill="#8b5e3c"/>
              </svg>
            </div>
            <FU d={2.9} size={10} color="#f0b86e" weight={700} lsp="0.32em" upper>Sky High</FU>
            <FU d={3.05} size={18} color="#fff" weight={800} mt={6} mb={4}>Adventure Awaits!</FU>
            <FU d={3.2} color="rgba(200,180,150,1)" mb={24}>Your trip is floating in — saved & ready.</FU>
            <Btn d={3.35} label="🌅 Up We Go!" bg="linear-gradient(90deg,#f4845a,#e53935)" shadow="0 8px 24px rgba(244,132,90,.44)" onClose={onClose}/>
          </div>
        </div>
      </div>
    </div>, document.body
  );
}

/* ════════════════════════════════════════════════════════════
   FLIGHT STYLE 6 — Vintage Biplane  (golden dusk sky)
════════════════════════════════════════════════════════════ */
function Flight6({ onClose }) {
  const smokePositions = Array.from({length:6},(_,i)=>({
    left:`${28+i*10}%`, top:`${42+Math.sin(i)*4}%`, size:8+i*4, delay:`${i*.2}s`,
  }));
  return createPortal(
    <div className="fixed inset-0 z-[300] overflow-hidden"
      style={{ background:"linear-gradient(155deg,#1a0e04 0%,#3d2208 25%,#8b4a12 55%,#c47228 78%,#e8a040 100%)" }}>
      {/* Golden sky rays */}
      {[20,38,55,72].map((l,i)=>(
        <div key={i} className="absolute pointer-events-none"
          style={{ bottom:0,left:`${l}%`,width:2,height:`${40+i*12}%`,
            background:"linear-gradient(to top,rgba(232,160,64,.2),transparent)",
            transform:"skewX(-5deg)" }}/>
      ))}
      {/* Smoke trail blobs */}
      {smokePositions.map((s,i)=>(
        <div key={i} className="absolute rounded-full pointer-events-none"
          style={{ left:s.left,top:s.top,width:s.size,height:s.size,
            background:"rgba(255,255,255,.15)",
            animation:`smokeBlob 2s ease-out ${s.delay} infinite` }}/>
      ))}
      {/* Clouds */}
      {[{t:"18%",l:"8%",w:80},{t:"28%",l:"60%",w:60}].map((c,i)=>(
        <div key={i} className="absolute pointer-events-none"
          style={{ top:c.t,left:c.l,width:c.w,height:20,borderRadius:12,
            background:"rgba(255,220,150,.1)",
            animation:`cloudDrift ${5+i*1.5}s ease-in-out ${i*.8}s infinite` }}/>
      ))}
      {/* Biplane */}
      <div className="absolute pointer-events-none"
        style={{ top:"32%",animation:"biplaneSwoop 2.8s cubic-bezier(.35,.1,.45,.9) .1s both",opacity:0 }}>
        <svg width="130" height="72" viewBox="0 0 130 72" style={{ filter:"drop-shadow(0 5px 14px rgba(0,0,0,.55))" }}>
          <defs>
            <linearGradient id="f6wood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c8922a"/><stop offset="50%" stopColor="#a87020"/><stop offset="100%" stopColor="#7a4e10"/>
            </linearGradient>
            <linearGradient id="f6fuse" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5a16"/><stop offset="50%" stopColor="#d4982e"/><stop offset="100%" stopColor="#e8b848"/>
            </linearGradient>
          </defs>
          {/* Bottom wing */}
          <path d="M26 44 L100 40 L106 44 L100 48 L26 48Z" fill="url(#f6wood)"/>
          {/* Top wing */}
          <path d="M20 26 L105 22 L110 26 L105 30 L20 30Z" fill="url(#f6wood)"/>
          {/* Wing struts */}
          <line x1="38" y1="30" x2="36" y2="40" stroke="rgba(100,65,10,.8)" strokeWidth="2"/>
          <line x1="78" y1="30" x2="76" y2="40" stroke="rgba(100,65,10,.8)" strokeWidth="2"/>
          {/* Fuselage */}
          <path d="M26 34 Q14 34 6 36 Q14 38 26 38 L108 36 Q118 35 124 34 Q118 33 108 32Z" fill="url(#f6fuse)"/>
          {/* Nose cowling */}
          <ellipse cx="118" cy="36" rx="10" ry="7" fill="#3d2208"/>
          <ellipse cx="119" cy="36" rx="8" ry="5.5" fill="#5a3210"/>
          {/* Propeller (spinning) */}
          <g style={{ transformOrigin:"127px 36px",animation:"propSpin .12s linear infinite" }}>
            <ellipse cx="127" cy="28" rx="2.5" ry="8" fill="rgba(90,55,10,.9)"/>
            <ellipse cx="127" cy="44" rx="2.5" ry="8" fill="rgba(90,55,10,.9)"/>
          </g>
          {/* Propeller circle blur */}
          <circle cx="127" cy="36" r="11" fill="none" stroke="rgba(90,55,10,.2)" strokeWidth="2"/>
          {/* Cockpit */}
          <path d="M86 32 Q92 24 98 26 L100 30 Q96 36 88 36Z" fill="rgba(130,200,240,.5)"/>
          <path d="M88 32 Q93 26 97 28 L98 31 Q95 35 90 35Z" fill="rgba(180,220,255,.3)"/>
          {/* Tail surfaces */}
          <path d="M26 34 L10 30 L16 34 L10 38 Z" fill="url(#f6wood)"/>
          <path d="M26 36 L6 44 L16 36Z" fill="url(#f6wood)"/>
          {/* Roundel markings */}
          <circle cx="60" cy="44" r="5" fill="rgba(255,255,255,.25)"/>
          <circle cx="60" cy="44" r="3" fill="rgba(220,40,40,.5)"/>
          <circle cx="60" cy="44" r="1.5" fill="rgba(40,40,180,.5)"/>
          {/* Wheels */}
          <circle cx="44" cy="56" r="5" fill="#1f0e02" stroke="rgba(80,50,10,.5)" strokeWidth="1.5"/>
          <circle cx="44" cy="56" r="2.5" fill="#2d1504"/>
          <circle cx="76" cy="56" r="5" fill="#1f0e02" stroke="rgba(80,50,10,.5)" strokeWidth="1.5"/>
          <circle cx="76" cy="56" r="2.5" fill="#2d1504"/>
          <line x1="44" y1="51" x2="44" y2="44" stroke="rgba(90,55,10,.7)" strokeWidth="2"/>
          <line x1="76" y1="51" x2="76" y2="44" stroke="rgba(90,55,10,.7)" strokeWidth="2"/>
          {/* Wheel axle */}
          <line x1="44" y1="56" x2="76" y2="56" stroke="rgba(90,55,10,.35)" strokeWidth="1"/>
        </svg>
      </div>
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
        <div className="pointer-events-auto w-full max-w-[338px] rounded-2xl overflow-hidden"
          style={{ background:"linear-gradient(145deg,#1e0e04,#2a1508)",
            border:"1px solid rgba(232,160,64,.3)",
            boxShadow:"0 24px 64px rgba(0,0,0,.82),0 0 50px rgba(200,130,40,.16)",
            animation:"cardLand .85s cubic-bezier(.3,1.4,.6,1) 2.1s both" }}>
          <div style={{ height:3,background:"linear-gradient(90deg,#c47228,#e8a040,#c47228)" }}/>
          <div className="px-7 py-8 text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background:"rgba(200,130,40,.12)",border:"1px solid rgba(200,130,40,.32)",
                boxShadow:"0 0 24px rgba(200,130,40,.22)",animation:"cloudDrift 4s ease-in-out 2.6s infinite" }}>
              <svg width="32" height="22" viewBox="0 0 130 72">
                <path d="M20 26 L105 22 L110 26 L105 30 L20 30Z" fill="#c8922a"/>
                <path d="M26 44 L100 40 L106 44 L100 48 L26 48Z" fill="#c8922a"/>
                <path d="M26 34 Q14 34 6 36 Q14 38 26 38 L108 36 Q118 35 124 34 Q118 33 108 32Z" fill="#d4982e"/>
              </svg>
            </div>
            <FU d={2.2} size={10} color="#e8a040" weight={700} lsp="0.32em" upper>Classic Air Mail</FU>
            <FU d={2.35} size={18} color="#fff" weight={800} mt={6} mb={4}>Roger, Over!</FU>
            <FU d={2.5} color="rgba(200,175,130,1)" mb={24}>Your trip has been recorded in the logbook.</FU>
            <Btn d={2.65} label="🛩️ Jolly Good!" bg="linear-gradient(90deg,#a87020,#7a4e10)" shadow="0 8px 24px rgba(168,112,32,.44)" onClose={onClose}/>
          </div>
        </div>
      </div>
    </div>, document.body
  );
}

/* ════════════════════════════════════════════════════════════
   OTHER STYLES (B–F unchanged)
════════════════════════════════════════════════════════════ */
function PopupParty({ onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-hidden"
      style={{ background:"rgba(0,0,0,.84)" }} onClick={onClose}>
      {CONFETTI.map((c,i)=>(
        <div key={i} className="fixed top-0 pointer-events-none"
          style={{ left:c.left,width:c.w,height:c.h,borderRadius:c.round,
            background:c.color,"--cr":c.rotate,
            animation:`confettiFall ${c.dur} ease-in ${c.delay} both`,
            boxShadow:`0 0 5px ${c.color}55` }}/>
      ))}
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#0f0f1a,#181824)",
          border:"1px solid rgba(255,255,255,.07)",
          boxShadow:"0 32px 80px rgba(0,0,0,.88)" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:4,background:"linear-gradient(90deg,#10b981,#3b82f6,#8b5cf6,#ec4899,#f59e0b,#10b981)",
          backgroundSize:"200%",animation:"shimmerBar 2.5s linear infinite" }}/>
        <div className="px-7 py-9 text-center">
          <div className="mx-auto mb-5 w-20 h-20 rounded-full flex items-center justify-center text-4xl"
            style={{ background:"linear-gradient(135deg,rgba(245,158,11,.14),rgba(249,115,22,.1))",
              border:"2px solid rgba(245,158,11,.42)",boxShadow:"0 0 32px rgba(245,158,11,.32), inset 0 0 20px rgba(245,158,11,.05)",
              animation:"trophyIn .75s cubic-bezier(.34,1.56,.64,1) .3s both",opacity:0 }}>🏆</div>
          <p style={{ fontSize:22,fontWeight:900,marginBottom:4,
            background:"linear-gradient(90deg,#10b981,#3b82f6,#8b5cf6,#ec4899,#f59e0b,#10b981)",
            backgroundSize:"300%",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
            animation:"shimmerBar 2.5s linear infinite, fadeUp .5s ease .7s both",opacity:0 }}>SUCCESS! 🎊</p>
          <p style={{ color:"rgba(148,163,184,1)",fontSize:13,marginBottom:28,
            animation:"fadeUp .5s ease .9s both",opacity:0 }}>Your changes have been saved successfully.</p>
          <button onClick={onClose} style={{ width:"100%",padding:"12px",borderRadius:16,fontWeight:800,fontSize:14,
            background:"linear-gradient(90deg,#10b981,#059669)",color:"#fff",border:"none",cursor:"pointer",
            boxShadow:"0 8px 28px rgba(16,185,129,.48)",animation:"fadeUp .5s ease 1.1s both",opacity:0 }}>Let's Go! 🎉</button>
        </div>
      </div>
    </div>, document.body
  );
}

function PopupRoute({ onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(3,8,16,.93)" }} onClick={onClose}>
      <div className="absolute inset-0 pointer-events-none" style={{ opacity:.05,
        backgroundImage:"linear-gradient(#10b981 1px,transparent 1px),linear-gradient(90deg,#10b981 1px,transparent 1px)",
        backgroundSize:"36px 36px" }}/>
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#061510,#0b2018)",
          border:"1px solid rgba(16,185,129,.25)",
          boxShadow:"0 28px 70px rgba(0,0,0,.88),0 0 45px rgba(16,185,129,.1)" }}
        onClick={e=>e.stopPropagation()}>
        <div className="px-5 pt-5 pb-2">
          <svg width="100%" height="52" viewBox="0 0 260 52">
            <path d="M20 40 C80 40 100 12 160 12 S240 40 240 12" fill="none"
              stroke="rgba(16,185,129,.5)" strokeWidth="2.5" strokeDasharray="420"
              style={{ animation:"routeDraw 1.4s ease-out .2s both",strokeDashoffset:420 }}/>
            {[{cx:20,cy:40},{cx:160,cy:12},{cx:240,cy:12}].map((p,i)=>(
              <circle key={i} cx={p.cx} cy={p.cy} r="7" fill="#10b981"
                style={{ animation:`pinDrop .7s cubic-bezier(.34,1.4,.64,1) ${.4+i*.35}s both`,opacity:0 }}/>
            ))}
            {[{cx:20,cy:40},{cx:160,cy:12},{cx:240,cy:12}].map((p,i)=>(
              <circle key={i} cx={p.cx} cy={p.cy} r="14" fill="none" stroke="rgba(16,185,129,.4)" strokeWidth="1.5"
                style={{ animation:`ripplePing 2s ease-out ${1.2+i*.4}s infinite`,transformOrigin:`${p.cx}px ${p.cy}px` }}/>
            ))}
          </svg>
        </div>
        <div style={{ height:2,background:"linear-gradient(90deg,#10b981,#059669,#0d9488)",margin:"0 20px" }}/>
        <div className="px-7 py-6 text-center">
          <FU d={0.5} size={10} color="#34d399" weight={700} lsp="0.3em" upper>Route Checkpoint</FU>
          <FU d={0.65} size={18} color="#fff" weight={800} mt={4} mb={4}>Stop Added!</FU>
          <FU d={0.8} color="rgba(100,190,140,.75)" mb={20}>Location has been marked on your route map.</FU>
          <Btn d={0.95} label="📍 Next Stop!" bg="linear-gradient(90deg,#10b981,#059669)" shadow="0 8px 24px rgba(16,185,129,.44)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

function PopupPassport({ onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(10,7,3,.93)" }} onClick={onClose}>
      <div className="relative w-full max-w-[320px]" onClick={e=>e.stopPropagation()}
        style={{ animation:"passportUp .7s cubic-bezier(.3,1.2,.6,1) .1s both",opacity:0 }}>
        <div className="rounded-2xl overflow-hidden"
          style={{ background:"linear-gradient(160deg,#2a1c0e,#1e1408)",
            border:"1px solid rgba(200,160,80,.22)",boxShadow:"0 28px 64px rgba(0,0,0,.88)" }}>
          {/* Passport header */}
          <div className="px-6 py-4" style={{ background:"linear-gradient(90deg,#1a0e04,#2e1a08)",
            borderBottom:"1px solid rgba(200,160,80,.15)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                style={{ background:"rgba(200,160,80,.1)",border:"1px solid rgba(200,160,80,.25)" }}>🌐</div>
              <div>
                <p style={{ fontSize:9,fontWeight:800,letterSpacing:"0.22em",color:"rgba(200,160,80,.7)",
                  textTransform:"uppercase" }}>Syncetra Travel Co.</p>
                <p style={{ fontSize:7,color:"rgba(150,120,80,.5)",letterSpacing:"0.15em",textTransform:"uppercase" }}>
                  Trip Logbook · Official Record
                </p>
              </div>
            </div>
          </div>
          {/* Stamp */}
          <div className="py-8 px-6 flex flex-col items-center">
            <div className="relative mb-5" style={{ animation:"stampSlam .65s cubic-bezier(.36,2,.64,1) .6s both",opacity:0 }}>
              <div className="relative w-32 h-32 rounded-full flex flex-col items-center justify-center"
                style={{ border:"3px solid rgba(16,185,129,.7)",background:"rgba(16,185,129,.06)",
                  boxShadow:"0 0 0 6px rgba(16,185,129,.08),0 0 30px rgba(16,185,129,.15)" }}>
                <div className="absolute inset-0 rounded-full" style={{ border:"1.5px dashed rgba(16,185,129,.25)",margin:5 }}/>
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                  style={{ animation:"stampFlash .5s ease .62s both",opacity:0,
                    background:"radial-gradient(circle,rgba(16,185,129,.4),transparent 60%)" }}/>
                <div className="text-center">
                  <svg className="w-8 h-8 text-emerald-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                  <p style={{ fontSize:8,fontWeight:900,color:"#10b981",letterSpacing:"0.12em",textTransform:"uppercase",marginTop:2 }}>Saved</p>
                </div>
              </div>
            </div>
            <FU d={1.0} size={10} color="rgba(200,160,80,.8)" weight={700} lsp="0.3em" upper>Entry Logged</FU>
            <FU d={1.15} size={17} color="rgba(230,200,140,1)" weight={700} mt={6} mb={4}>Itinerary Stamped!</FU>
            <FU d={1.3} size={12} color="rgba(150,120,80,.85)" mb={18}>Stop recorded in your trip travel log.</FU>
            <p style={{ fontFamily:"monospace",fontSize:10,color:"rgba(200,160,80,.33)",marginBottom:18,letterSpacing:"0.18em",
              animation:"fadeUp .5s ease 1.45s both",opacity:0 }}>
              REF-{Date.now().toString(36).toUpperCase().slice(-6)}
            </p>
            <Btn d={1.6} label="🛂 Continue Journey" bg="linear-gradient(90deg,#92400e,#78350f)" shadow="0 8px 24px rgba(0,0,0,.48)" onClose={onClose}/>
          </div>
        </div>
      </div>
    </div>, document.body
  );
}

/* ════════════════════════════════════════════════════════════
   FLIGHT STYLE 7 — Helicopter  (city twilight, right→left, hovering)
════════════════════════════════════════════════════════════ */
function Flight7({ onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] overflow-hidden"
      style={{ background:"linear-gradient(165deg,#100830 0%,#1e1050 35%,#38186a 65%,#1a0c3a 100%)" }}>
      {STARS.slice(0,18).map((s,i)=>(
        <div key={i} className="absolute rounded-full bg-white/60 pointer-events-none"
          style={{ left:`${s.x}%`,top:`${s.y*.6}%`,width:s.size*.7,height:s.size*.7,
            animation:`starTwinkle ${s.dur} ease-in-out ${s.delay} infinite` }}/>
      ))}
      {/* City skyline silhouette */}
      <div className="absolute pointer-events-none bottom-0 left-0 right-0">
        <svg width="100%" height="120" viewBox="0 0 800 120" preserveAspectRatio="none">
          <path d="M0 120 L0 80 L30 80 L30 60 L50 60 L50 40 L70 40 L70 20 L90 20 L90 60 L110 60 L110 30 L130 30 L130 10 L150 10 L150 50 L170 50 L170 35 L190 35 L190 55 L210 55 L210 25 L230 25 L230 70 L260 70 L260 45 L280 45 L280 15 L300 15 L300 60 L320 60 L320 40 L340 40 L340 80 L380 80 L380 55 L400 55 L400 30 L420 30 L420 65 L450 65 L450 45 L470 45 L470 25 L490 25 L490 60 L520 60 L520 75 L550 75 L550 50 L570 50 L570 35 L590 35 L590 70 L620 70 L620 55 L640 55 L640 85 L680 85 L680 60 L700 60 L700 80 L730 80 L730 90 L760 90 L760 75 L800 75 L800 120 Z"
            fill="rgba(10,5,25,.9)"/>
          {/* Windows */}
          {[55,135,215,295,415,495,580,665].map((x,i)=>(
            <rect key={i} x={x} y={28+i%3*12} width="6" height="6" rx="1" fill={`rgba(255,230,100,${.3+i%4*.15})`}/>
          ))}
        </svg>
      </div>
      {/* Searchlight beam */}
      <div className="absolute pointer-events-none"
        style={{ top:"42%",left:"43%",width:80,height:140,
          clipPath:"polygon(30% 0%,70% 0%,100% 100%,0% 100%)",
          background:"linear-gradient(to bottom,rgba(255,240,180,.3),transparent)",
          animation:"searchLight 2s ease-in-out .5s infinite" }}/>
      {/* Helicopter */}
      <div className="absolute pointer-events-none"
        style={{ top:"30%",animation:"heliFly 3.2s cubic-bezier(.4,0,.55,1) .1s both",opacity:0 }}>
        <div style={{ animation:"heliHover .8s ease-in-out .8s infinite" }}>
          <svg width="120" height="60" viewBox="0 0 120 60" style={{ filter:"drop-shadow(0 5px 14px rgba(0,0,0,.6))" }}>
            <defs>
              <linearGradient id="f7body" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c5cbf"/><stop offset="50%" stopColor="#5b3fa0"/><stop offset="100%" stopColor="#3d2878"/>
              </linearGradient>
            </defs>
            {/* Main rotor (top, spinning) */}
            <g style={{ transformOrigin:"58px 10px",animation:"rotorSpin .18s linear infinite" }}>
              <rect x="10" y="9" width="96" height="3" rx="1.5" fill="rgba(200,190,230,.85)"/>
              <rect x="56" y="-10" width="4" height="42" rx="1.5" fill="rgba(200,190,230,.75)"/>
            </g>
            {/* Rotor hub */}
            <circle cx="58" cy="10" r="5" fill="#4a3080" stroke="rgba(200,190,230,.5)" strokeWidth="1.5"/>
            {/* Mast */}
            <rect x="55" y="10" width="6" height="8" rx="1" fill="#3d2878"/>
            {/* Body */}
            <path d="M14 28 Q14 18 25 18 L80 18 Q90 18 95 24 Q100 28 100 32 Q96 40 85 42 L25 42 Q14 40 14 28Z" fill="url(#f7body)"/>
            {/* Cockpit bubble */}
            <path d="M80 18 Q92 18 97 25 L97 36 Q92 42 80 42 Z" fill="rgba(120,200,240,.45)" stroke="rgba(160,220,255,.3)" strokeWidth=".8"/>
            {/* Cockpit shine */}
            <path d="M82 20 Q90 20 95 26 L95 28 Q89 22 82 22Z" fill="rgba(255,255,255,.2)"/>
            {/* Rear boom */}
            <path d="M14 30 L0 31 L0 33 L14 33Z" fill="#3d2878"/>
            {/* Tail fin */}
            <path d="M2 31 L0 22 L8 31Z" fill="#4a3080"/>
            <path d="M2 33 L0 42 L8 33Z" fill="#4a3080"/>
            {/* Tail rotor */}
            <g style={{ transformOrigin:"1px 32px",animation:"rotorSpin .14s linear infinite" }}>
              <rect x="-8" y="31" width="18" height="2" rx="1" fill="rgba(200,190,230,.7)"/>
              <rect x="0" y="23" width="2" height="18" rx="1" fill="rgba(200,190,230,.65)"/>
            </g>
            {/* Skids */}
            <line x1="30" y1="42" x2="30" y2="52" stroke="rgba(100,80,160,.8)" strokeWidth="2"/>
            <line x1="70" y1="42" x2="70" y2="52" stroke="rgba(100,80,160,.8)" strokeWidth="2"/>
            <line x1="20" y1="52" x2="80" y2="52" stroke="rgba(100,80,160,.7)" strokeWidth="2.5"/>
            {/* Side windows */}
            <rect x="28" y="22" width="12" height="9" rx="2" fill="rgba(120,200,240,.4)"/>
            <rect x="44" y="22" width="12" height="9" rx="2" fill="rgba(120,200,240,.4)"/>
            {/* Anti-collision light */}
            <circle cx="58" cy="10" r="3" fill="rgba(255,80,80,.7)"
              style={{ animation:"wingletGlow .6s ease-in-out infinite" }}/>
            {/* Navigation lights */}
            <circle cx="100" cy="30" r="2.5" fill="rgba(255,240,100,.9)"
              style={{ filter:"blur(.5px)" }}/>
            <circle cx="14" cy="30" r="2" fill="rgba(255,100,100,.7)"/>
          </svg>
        </div>
      </div>
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
        <div className="pointer-events-auto w-full max-w-[338px] rounded-2xl overflow-hidden"
          style={{ background:"linear-gradient(145deg,#14083a,#1c1050)",
            border:"1px solid rgba(168,140,255,.32)",
            boxShadow:"0 24px 64px rgba(0,0,0,.82),0 0 50px rgba(120,80,200,.16)",
            animation:"cardLand .85s cubic-bezier(.3,1.4,.6,1) 2.2s both" }}>
          <div style={{ height:3,background:"linear-gradient(90deg,#7c3aed,#a855f7,#c084fc)" }}/>
          <div className="px-7 py-8 text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background:"rgba(124,58,237,.14)",border:"1px solid rgba(124,58,237,.38)",boxShadow:"0 0 26px rgba(124,58,237,.28)",animation:"cloudDrift 3s ease-in-out 2.7s infinite" }}>
              <svg width="30" height="28" viewBox="0 0 120 60">
                <path d="M14 28 Q14 18 25 18 L80 18 Q90 18 95 24 Q100 28 100 32 Q96 40 85 42 L25 42 Q14 40 14 28Z" fill="#7c3aed"/>
                <rect x="10" y="9" width="96" height="3" rx="1.5" fill="rgba(200,190,230,.85)"/>
                <circle cx="58" cy="10" r="4" fill="#5b21b6"/>
              </svg>
            </div>
            <FU d={2.3} size={10} color="#c084fc" weight={700} lsp="0.32em" upper>Chopper Deployed</FU>
            <FU d={2.45} size={18} color="#fff" weight={800} mt={6} mb={4}>Mission Complete!</FU>
            <FU d={2.6} color="rgba(196,181,253,.8)" mb={24}>Trip details saved and locked in.</FU>
            <Btn d={2.75} label="🚁 Roger!" bg="linear-gradient(90deg,#7c3aed,#6d28d9)" shadow="0 8px 24px rgba(124,58,237,.44)" onClose={onClose}/>
          </div>
        </div>
      </div>
    </div>, document.body
  );
}

/* ════════════════════════════════════════════════════════════
   FLIGHT STYLE 8 — Concorde  (high altitude, Mach-breaking)
════════════════════════════════════════════════════════════ */
function Flight8({ onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] overflow-hidden"
      style={{ background:"linear-gradient(160deg,#020510 0%,#060e2a 40%,#0c1e52 75%,#1a3570 100%)" }}>
      {STARS.slice(0,12).map((s,i)=>(
        <div key={i} className="absolute rounded-full bg-white/40 pointer-events-none"
          style={{ left:`${s.x}%`,top:`${s.y*.4}%`,width:s.size*.6,height:s.size*.6,
            animation:`starTwinkle ${s.dur} ease-in-out ${s.delay} infinite` }}/>
      ))}
      {/* Atmosphere horizon */}
      <div className="absolute pointer-events-none bottom-0 left-0 right-0" style={{ height:"28%",
        background:"linear-gradient(to top,rgba(30,80,160,.4),transparent)" }}/>
      {/* Mach cone effect */}
      <div className="absolute pointer-events-none"
        style={{ top:"36%",left:"35%",width:60,height:60,borderRadius:"50%",
          border:"2px solid rgba(150,200,255,.5)",
          animation:"machCone .9s ease-out 1.1s infinite" }}/>
      <div className="absolute pointer-events-none"
        style={{ top:"40%",left:"38%",width:30,height:30,borderRadius:"50%",
          border:"1.5px solid rgba(180,220,255,.6)",
          animation:"machCone .9s ease-out 1.25s infinite" }}/>
      {/* Concorde */}
      <div className="absolute pointer-events-none"
        style={{ top:"33%",animation:"concordeFly 2.2s cubic-bezier(.3,0,.5,1) .2s both",opacity:0 }}>
        <svg width="220" height="36" viewBox="0 0 220 36" style={{ filter:"drop-shadow(0 4px 12px rgba(0,0,0,.6))" }}>
          <defs>
            <linearGradient id="f8body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e8ecf8"/><stop offset="45%" stopColor="#d0d8f0"/><stop offset="100%" stopColor="#a0acd0"/>
            </linearGradient>
            <linearGradient id="f8wing" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b8c4e0"/><stop offset="100%" stopColor="#6880b0"/>
            </linearGradient>
          </defs>
          {/* Drooped nose — Concorde's iconic feature */}
          <path d="M190 18 Q210 17 220 18 Q210 19 190 18" fill="#d0d8f0"/>
          <path d="M200 18 Q215 17.5 220 18 L215 19 Q200 19 200 18" fill="#c0c8e8"/>
          {/* Fuselage — very long and slim */}
          <path d="M20 14 Q12 14 8 17 Q5 18 8 20 Q12 22 20 21 L190 18.5 Q200 18 205 18 Q200 18.5 190 19 L20 21 Z" fill="url(#f8body)"/>
          {/* Ogival delta wing — sweeping from nose to mid */}
          <path d="M80 18 L20 4 L100 17 Z" fill="url(#f8wing)"/>
          <path d="M80 18 L20 32 L100 19 Z" fill="url(#f8wing)"/>
          {/* Far wing (perspective) */}
          <path d="M80 18 L85 11 L95 17 Z" fill="url(#f8wing)" opacity=".5"/>
          {/* Engines — 4 under wing in pairs */}
          <rect x="42" y="20" width="22" height="5" rx="2.5" fill="rgba(60,80,130,.9)"/>
          <rect x="42" y="26" width="22" height="4" rx="2" fill="rgba(40,60,110,.8)"/>
          {/* Vertical tail (vestigial) */}
          <path d="M16 17 L8 8 L20 16 Z" fill="#8898c8"/>
          {/* Cockpit visor — drooped position */}
          <path d="M188 18 Q196 14 202 15 L204 18 Q200 21 192 22Z" fill="rgba(100,160,220,.4)"/>
          {/* Livery stripe */}
          <path d="M28 17 L185 16.5 L185 17.5 L28 18 Z" fill="rgba(80,120,220,.5)"/>
          {/* Windows (very small — supersonic) */}
          {[120,134,148,160,172].map((x,i)=>(
            <rect key={i} x={x} y="15.5" width="5" height="4" rx="1.5" fill={`rgba(186,220,255,${.55-i*.04})`}/>
          ))}
          {/* Engine exhaust */}
          <ellipse cx="20" cy="22" rx="4" ry="2.5" fill="rgba(255,180,40,.6)" style={{ filter:"blur(.5px)" }}/>
          <ellipse cx="20" cy="28" rx="3" ry="2" fill="rgba(255,120,20,.5)" style={{ filter:"blur(.5px)" }}/>
        </svg>
      </div>
      {/* Condensation trail */}
      <div className="absolute pointer-events-none"
        style={{ top:"43%",left:"8%",height:1.5,borderRadius:1,
          background:"linear-gradient(90deg,rgba(200,220,255,.45),transparent)",
          animation:"trailFade 2s ease-out .5s both",width:0 }}/>
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
        <div className="pointer-events-auto w-full max-w-[338px] rounded-2xl overflow-hidden"
          style={{ background:"linear-gradient(145deg,#060e2a,#0a1640)",
            border:"1px solid rgba(130,180,255,.3)",
            boxShadow:"0 24px 64px rgba(0,0,0,.85),0 0 50px rgba(80,120,255,.14)",
            animation:"cardZoom .75s cubic-bezier(.3,1.3,.6,1) 1.9s both" }}>
          <div style={{ height:3,background:"linear-gradient(90deg,#1d4ed8,#3b82f6,#93c5fd)" }}/>
          <div className="px-7 py-8 text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background:"rgba(59,130,246,.12)",border:"1px solid rgba(59,130,246,.35)",boxShadow:"0 0 24px rgba(59,130,246,.25)" }}>
              <svg width="32" height="12" viewBox="0 0 220 36">
                <path d="M20 14 Q12 14 8 17 Q5 18 8 20 Q12 22 20 21 L190 18.5 Q200 18 205 18 Q200 18.5 190 19 L20 21 Z" fill="#d0d8f0"/>
                <path d="M80 18 L20 4 L100 17 Z" fill="#8898c8"/>
                <path d="M80 18 L20 32 L100 19 Z" fill="#8898c8"/>
                <path d="M188 18 Q196 14 202 15 L204 18 Q200 21 192 22Z" fill="rgba(100,160,220,.5)"/>
              </svg>
            </div>
            <FU d={2.0} size={10} color="#93c5fd" weight={700} lsp="0.32em" upper>Mach 2 Confirmed</FU>
            <FU d={2.15} size={18} color="#fff" weight={800} mt={6} mb={4}>Breaking Records!</FU>
            <FU d={2.3} color="rgba(148,163,184,1)" mb={24}>Your trip is saved at supersonic speed.</FU>
            <Btn d={2.45} label="✈️ Supersonic!" bg="linear-gradient(90deg,#1d4ed8,#1e40af)" shadow="0 8px 24px rgba(29,78,216,.44)" onClose={onClose}/>
          </div>
        </div>
      </div>
    </div>, document.body
  );
}

/* ════════════════════════════════════════════════════════════
   FLIGHT STYLE 9 — Space Shuttle Reentry  (orbit → atmosphere)
════════════════════════════════════════════════════════════ */
function Flight9({ onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] overflow-hidden"
      style={{ background:"linear-gradient(150deg,#000308 0%,#010520 30%,#040e40 55%,#0a1e60 75%,#1a3a7a 100%)" }}>
      {STARS.map((s,i)=>(
        <div key={i} className="absolute rounded-full bg-white pointer-events-none"
          style={{ left:`${s.x}%`,top:`${s.y*.7}%`,width:s.size*.8,height:s.size*.8,
            animation:`starTwinkle ${s.dur} ease-in-out ${s.delay} infinite` }}/>
      ))}
      {/* Earth arc at bottom */}
      <div className="absolute pointer-events-none"
        style={{ bottom:-200,left:"50%",transform:"translateX(-50%)",
          width:1200,height:400,borderRadius:"50%",
          background:"linear-gradient(to top,rgba(20,80,200,.5),rgba(40,120,220,.2),transparent)",
          boxShadow:"inset 0 20px 60px rgba(60,160,255,.2)" }}/>
      {/* Reentry heat trail */}
      <div className="absolute pointer-events-none"
        style={{ top:"38%",left:"38%",height:3,borderRadius:1.5,transformOrigin:"left",transform:"rotate(30deg)",
          background:"linear-gradient(90deg,rgba(255,120,20,.6),rgba(255,200,50,.4),transparent)",
          animation:"reentryTrail 2.5s ease-out .2s both",width:0 }}/>
      {/* Space Shuttle */}
      <div className="absolute pointer-events-none"
        style={{ top:"22%",animation:"shuttleFly 2.8s cubic-bezier(.3,0,.5,1) .1s both",opacity:0 }}>
        <svg width="110" height="80" viewBox="0 0 110 80" style={{ filter:"drop-shadow(0 6px 18px rgba(0,0,0,.7))" }}>
          <defs>
            <linearGradient id="f9orb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d8e4f8"/><stop offset="50%" stopColor="#b8ccec"/><stop offset="100%" stopColor="#7090b8"/>
            </linearGradient>
            <linearGradient id="f9belly" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a2a2a"/><stop offset="100%" stopColor="#111"/>
            </linearGradient>
            <linearGradient id="f9heat" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,150,20,.0)"/><stop offset="100%" stopColor="rgba(255,80,0,.85)"/>
            </linearGradient>
          </defs>
          {/* Reentry plasma glow */}
          <ellipse cx="55" cy="70" rx="52" ry="12" fill="url(#f9heat)"
            style={{ animation:"heatGlow .35s ease-in-out infinite" }}/>
          {/* Orbiter body — blunt nose, tapered tail */}
          <path d="M85 38 Q95 30 105 34 Q108 36 108 40 Q106 44 100 46 Q90 48 80 46 L20 48 Q10 46 6 40 Q4 38 8 34 Q12 30 20 32 L80 36 Z" fill="url(#f9orb)"/>
          {/* Nose cone — blunted */}
          <path d="M100 34 Q110 36 110 40 Q110 44 100 46" fill="#c0d0e8"/>
          {/* Delta wings */}
          <path d="M38 42 L10 68 L50 48 Z" fill="url(#f9belly)"/>
          <path d="M38 42 L10 16 L50 36 Z" fill="#c0cce0" opacity=".8"/>
          {/* Far wing */}
          <path d="M38 42 L42 32 L52 38 Z" fill="#c0cce0" opacity=".5"/>
          {/* Vertical tail */}
          <path d="M14 40 L6 20 L20 38 Z" fill="#a0b0c8"/>
          {/* Payload bay (closed) */}
          <rect x="22" y="35" width="50" height="13" rx="2" fill="#98a8be"/>
          {/* Black heat tiles on belly */}
          <rect x="22" y="44" width="66" height="5" rx="1" fill="url(#f9belly)" opacity=".9"/>
          {/* Cockpit windows */}
          <rect x="90" y="33" width="12" height="6" rx="2" fill="rgba(120,190,240,.5)"/>
          <rect x="92" y="34" width="8" height="4" rx="1" fill="rgba(180,220,255,.25)"/>
          {/* RCS thrusters */}
          <rect x="102" y="34" width="4" height="4" rx="1" fill="#8090a8"/>
          {/* OMS pods */}
          <rect x="15" y="35" width="8" height="6" rx="2" fill="#8090a8"/>
          {/* US flag */}
          <rect x="55" y="36" width="12" height="6" rx="1" fill="rgba(200,30,30,.5)"/>
          <rect x="55" y="36" width="12" height="2" rx=".5" fill="rgba(255,255,255,.4)"/>
        </svg>
      </div>
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
        <div className="pointer-events-auto w-full max-w-[338px] rounded-2xl overflow-hidden"
          style={{ background:"linear-gradient(145deg,#04082a,#060c38)",
            border:"1px solid rgba(100,160,255,.32)",
            boxShadow:"0 24px 64px rgba(0,0,0,.9),0 0 60px rgba(40,80,255,.14)",
            animation:"cardLand .85s cubic-bezier(.3,1.4,.6,1) 2.2s both" }}>
          <div style={{ height:3,background:"linear-gradient(90deg,#dc2626,#f59e0b,#3b82f6,#10b981)" }}/>
          <div className="px-7 py-8 text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.35)",boxShadow:"0 0 26px rgba(245,158,11,.25)" }}>
              <svg width="28" height="24" viewBox="0 0 110 80">
                <path d="M85 38 Q95 30 105 34 Q108 36 108 40 Q106 44 100 46 Q90 48 80 46 L20 48 Q10 46 6 40 Q4 38 8 34 Q12 30 20 32 L80 36 Z" fill="#b8ccec"/>
                <path d="M38 42 L10 68 L50 48 Z" fill="#222"/>
                <path d="M38 42 L10 16 L50 36 Z" fill="#c0cce0"/>
                <path d="M14 40 L6 20 L20 38 Z" fill="#a0b0c8"/>
              </svg>
            </div>
            <FU d={2.3} size={10} color="#fbbf24" weight={700} lsp="0.32em" upper>Reentry Complete</FU>
            <FU d={2.45} size={18} color="#fff" weight={800} mt={6} mb={4}>Home Safe! 🌍</FU>
            <FU d={2.6} color="rgba(148,163,184,1)" mb={24}>Mission accomplished. Trip data landed safely.</FU>
            <Btn d={2.75} label="🛸 Touchdown!" bg="linear-gradient(90deg,#dc2626,#9a3412)" shadow="0 8px 24px rgba(220,38,38,.4)" onClose={onClose}/>
          </div>
        </div>
      </div>
    </div>, document.body
  );
}

/* ════════════════════════════════════════════════════════════
   FLIGHT STYLE 10 — Airship / Zeppelin  (slow stately drift, evening)
════════════════════════════════════════════════════════════ */
function Flight10({ onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] overflow-hidden"
      style={{ background:"linear-gradient(165deg,#0c1830 0%,#1a3055 35%,#2a5080 65%,#3a6898 100%)" }}>
      {/* Evening clouds */}
      {[{t:"20%",l:"5%",w:120,op:.1},{t:"14%",l:"50%",w:90,op:.08},{t:"32%",l:"65%",w:70,op:.07}].map((c,i)=>(
        <div key={i} className="absolute pointer-events-none"
          style={{ top:c.t,left:c.l,width:c.w,height:28,borderRadius:16,
            background:`rgba(200,220,255,${c.op})`,
            animation:`cloudDrift ${6+i*1.5}s ease-in-out ${i*.7}s infinite` }}/>
      ))}
      {/* Stars (few, evening) */}
      {STARS.slice(0,10).map((s,i)=>(
        <div key={i} className="absolute rounded-full bg-white/50 pointer-events-none"
          style={{ left:`${s.x}%`,top:`${s.y*.5}%`,width:s.size*.6,height:s.size*.6,
            animation:`starTwinkle ${s.dur} ease-in-out ${s.delay} infinite` }}/>
      ))}
      {/* Airship */}
      <div className="absolute pointer-events-none"
        style={{ top:"28%",animation:"blimpDrift 4.5s cubic-bezier(.25,.1,.4,.9) .1s both",opacity:0 }}>
        <div style={{ animation:"blimpSway 4s ease-in-out infinite" }}>
          <svg width="240" height="100" viewBox="0 0 240 100" style={{ filter:"drop-shadow(0 6px 20px rgba(0,0,0,.55))" }}>
            <defs>
              <radialGradient id="f10hull" cx="38%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#5a8fd0"/><stop offset="50%" stopColor="#3a6aaa"/><stop offset="100%" stopColor="#1e3d70"/>
              </radialGradient>
              <linearGradient id="f10belly" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2a5090"/><stop offset="100%" stopColor="#162840"/>
              </linearGradient>
            </defs>
            {/* Main envelope — elongated ellipsoid */}
            <ellipse cx="118" cy="42" rx="115" ry="34" fill="url(#f10hull)"/>
            {/* Belly darker shade */}
            <ellipse cx="118" cy="55" rx="115" ry="15" fill="url(#f10belly)" opacity=".6"/>
            {/* Highlight */}
            <ellipse cx="90" cy="28" rx="40" ry="16" fill="rgba(255,255,255,.12)"/>
            {/* Nose metal cone */}
            <ellipse cx="4" cy="42" rx="6" ry="10" fill="#1e3d70" stroke="rgba(100,150,220,.3)" strokeWidth="1"/>
            {/* Tail fins — 4 fins in X config */}
            <path d="M228 38 L240 20 L228 42 Z" fill="#1e3d70"/>
            <path d="M228 46 L240 64 L228 42 Z" fill="#1e3d70"/>
            <path d="M228 38 Q236 38 240 42 Q236 42 228 46 Z" fill="#2a5090" opacity=".7"/>
            {/* Propeller pods on sides */}
            <g style={{ transformOrigin:"195px 42px",animation:"propellerSpin .3s linear infinite" }}>
              <ellipse cx="195" cy="34" rx="2" ry="8" fill="rgba(160,200,240,.7)"/>
              <ellipse cx="195" cy="50" rx="2" ry="8" fill="rgba(160,200,240,.7)"/>
            </g>
            <circle cx="195" cy="42" r="4" fill="#1e3d70" stroke="rgba(100,150,220,.3)" strokeWidth="1"/>
            {/* Engine nacelle */}
            <rect x="188" y="39" width="14" height="6" rx="3" fill="#1a3060"/>
            {/* Gondola — hanging below */}
            <rect x="70" y="74" width="90" height="22" rx="5" fill="#0e1e40" stroke="rgba(80,130,200,.3)" strokeWidth="1"/>
            {/* Gondola windows */}
            {[82,98,114,130,146].map((x,i)=>(
              <rect key={i} x={x} y="79" width="9" height="7" rx="2" fill={`rgba(200,220,255,${.3+i%3*.1})`}/>
            ))}
            {/* Suspension cables */}
            {[85,115,145].map((x,i)=>(
              <line key={i} x1={x+10} y1="76" x2={80+i*25} y2="64" stroke="rgba(80,120,200,.35)" strokeWidth="1"/>
            ))}
            {/* Company markings */}
            <text x="100" y="46" fontSize="12" fill="rgba(255,255,255,.25)" fontWeight="700" letterSpacing="2">SYNCETRA</text>
            {/* Navigation lights */}
            <circle cx="4" cy="42" r="3" fill="rgba(255,100,100,.8)" style={{ animation:"wingletGlow .8s ease-in-out infinite" }}/>
            <circle cx="232" cy="42" r="3" fill="rgba(100,255,100,.7)" style={{ animation:"wingletGlow .8s ease-in-out .4s infinite" }}/>
          </svg>
        </div>
      </div>
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
        <div className="pointer-events-auto w-full max-w-[338px] rounded-2xl overflow-hidden"
          style={{ background:"linear-gradient(145deg,#0c1830,#122048)",
            border:"1px solid rgba(80,140,220,.3)",
            boxShadow:"0 24px 64px rgba(0,0,0,.82),0 0 50px rgba(40,80,180,.15)",
            animation:"cardSlide .9s cubic-bezier(.3,1.3,.6,1) 3.6s both" }}>
          <div style={{ height:3,background:"linear-gradient(90deg,#1e3d70,#3a6aaa,#5a8fd0)" }}/>
          <div className="px-7 py-8 text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background:"rgba(58,106,170,.12)",border:"1px solid rgba(58,106,170,.35)",boxShadow:"0 0 24px rgba(40,80,180,.22)",animation:"cloudDrift 5s ease-in-out 4.1s infinite" }}>
              <svg width="32" height="14" viewBox="0 0 240 60">
                <ellipse cx="118" cy="30" rx="115" ry="25" fill="#3a6aaa"/>
                <ellipse cx="90" cy="20" rx="40" ry="10" fill="rgba(255,255,255,.15)"/>
              </svg>
            </div>
            <FU d={3.7} size={10} color="#7eb0e8" weight={700} lsp="0.32em" upper>Gentle Arrival</FU>
            <FU d={3.85} size={18} color="#fff" weight={800} mt={6} mb={4}>Smooth Sailing!</FU>
            <FU d={4.0} color="rgba(160,190,230,.8)" mb={24}>Your trip glides into the records effortlessly.</FU>
            <Btn d={4.15} label="🎈 Magnificent!" bg="linear-gradient(90deg,#1e3d70,#3a6aaa)" shadow="0 8px 24px rgba(30,61,112,.55)" onClose={onClose}/>
          </div>
        </div>
      </div>
    </div>, document.body
  );
}

/* ════════════════════════════════════════════════════════════
   FLIGHT STYLE 11 — Private Jet / Gulfstream  (sunny day, clean)
════════════════════════════════════════════════════════════ */
function Flight11({ onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] overflow-hidden"
      style={{ background:"linear-gradient(160deg,#0a2044 0%,#1a3a6e 40%,#2a5a98 70%,#3a72b8 100%)" }}>
      {/* Cirrus clouds */}
      {[{t:"20%",l:"3%",w:140},{t:"16%",l:"55%",w:100},{t:"35%",l:"78%",w:80}].map((c,i)=>(
        <div key={i} className="absolute pointer-events-none"
          style={{ top:c.t,left:c.l,width:c.w,height:8,borderRadius:6,
            background:"rgba(255,255,255,.09)",
            animation:`cloudDrift ${5+i}s ease-in-out ${i*.6}s infinite` }}/>
      ))}
      {/* Sun glare top-right */}
      <div className="absolute pointer-events-none"
        style={{ top:-80,right:-80,width:260,height:260,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(255,255,220,.12),transparent 60%)" }}/>
      {/* Private Jet */}
      <div className="absolute pointer-events-none"
        style={{ top:"35%",animation:"privJetBank 2.6s cubic-bezier(.4,0,.55,1) .1s both",opacity:0 }}>
        <svg width="180" height="60" viewBox="0 0 180 60" style={{ filter:"drop-shadow(0 5px 16px rgba(0,0,0,.55))" }}>
          <defs>
            <linearGradient id="f11body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f0f4ff"/><stop offset="40%" stopColor="#dce8fc"/><stop offset="100%" stopColor="#a8bce0"/>
            </linearGradient>
            <linearGradient id="f11wing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c8d8f0"/><stop offset="100%" stopColor="#7090c0"/>
            </linearGradient>
          </defs>
          {/* Rear-mounted engines (Gulfstream style) */}
          <ellipse cx="38" cy="22" rx="16" ry="5.5" fill="#8898b8"/>
          <ellipse cx="38" cy="22" rx="8" ry="4.5" fill="#1f2937"/>
          <ellipse cx="46" cy="22" rx="3.5" ry="5" fill="#6b7280" stroke="#9ca3af" strokeWidth=".5"/>
          <ellipse cx="38" cy="38" rx="16" ry="5.5" fill="#8898b8"/>
          <ellipse cx="38" cy="38" rx="8" ry="4.5" fill="#1f2937"/>
          <ellipse cx="46" cy="38" rx="3.5" ry="5" fill="#6b7280" stroke="#9ca3af" strokeWidth=".5"/>
          {/* Main wing — swept back */}
          <path d="M68 30 L30 8 L80 28 Z" fill="url(#f11wing)"/>
          <path d="M68 30 L30 52 L80 32 Z" fill="url(#f11wing)"/>
          {/* Winglet upswept tips */}
          <path d="M30 8 L26 2 L32 10 Z" fill="#6080b0"/>
          <path d="M30 52 L26 58 L32 50 Z" fill="#6080b0"/>
          {/* Fuselage — sleek cigar shape */}
          <path d="M50 24 Q40 24 35 29 Q32 30 35 31 Q40 36 50 36 L162 31.5 Q172 31 177 30 Q180 30 178 30 Q172 29 162 28.5 Z" fill="url(#f11body)"/>
          {/* Nose */}
          <path d="M162 28.5 Q175 29 178 30 Q175 31 162 31.5" fill="#d0dcf4"/>
          {/* T-tail horizontal stabilizer */}
          <path d="M48 24 L40 14 L56 24 Z" fill="url(#f11wing)" opacity=".85"/>
          <path d="M48 36 L40 46 L56 36 Z" fill="url(#f11wing)" opacity=".85"/>
          {/* Vertical stabiliser */}
          <path d="M46 24 L40 10 L52 24" fill="url(#f11wing)"/>
          {/* Livery stripe */}
          <path d="M58 29 L158 28.5 L158 30 L58 30.5 Z" fill="rgba(59,130,246,.55)"/>
          {/* Oval windows */}
          {[80,96,112,128,144].map((x,i)=>(
            <ellipse key={i} cx={x} cy="30" rx="4.5" ry="3.5" fill={`rgba(186,220,255,${.65-i*.05})`}/>
          ))}
          {/* Cockpit */}
          <path d="M158 28 Q166 24 172 25 L174 29 Q170 33 164 33Z" fill="rgba(100,170,240,.5)"/>
          {/* Registration */}
          <text x="100" y="34.5" fontSize="5.5" fill="rgba(40,80,160,.45)" textAnchor="middle" fontWeight="700" letterSpacing="1">SYN-001</text>
        </svg>
      </div>
      {/* Contrail */}
      <div className="absolute pointer-events-none"
        style={{ top:"44%",left:"12%",height:1.5,borderRadius:1,
          background:"linear-gradient(90deg,rgba(220,235,255,.4),transparent)",
          animation:"trailFade 2.2s ease-out .3s both",width:0 }}/>
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
        <div className="pointer-events-auto w-full max-w-[338px] rounded-2xl overflow-hidden"
          style={{ background:"linear-gradient(145deg,#0c1e40,#102850)",
            border:"1px solid rgba(100,160,240,.3)",
            boxShadow:"0 24px 64px rgba(0,0,0,.8),0 0 50px rgba(60,120,220,.14)",
            animation:"cardLand .85s cubic-bezier(.3,1.4,.6,1) 2s both" }}>
          <div style={{ height:3,background:"linear-gradient(90deg,#0ea5e9,#38bdf8,#bae6fd)" }}/>
          <div className="px-7 py-8 text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background:"rgba(14,165,233,.12)",border:"1px solid rgba(14,165,233,.35)",boxShadow:"0 0 24px rgba(14,165,233,.25)",animation:"cloudDrift 3.5s ease-in-out 2.5s infinite" }}>
              <svg width="30" height="12" viewBox="0 0 180 60">
                <path d="M50 24 Q40 24 35 29 Q32 30 35 31 Q40 36 50 36 L162 31.5 Q172 31 177 30 Q172 29 162 28.5 Z" fill="#dce8fc"/>
                <path d="M68 30 L30 8 L80 28 Z" fill="#c8d8f0"/>
                <path d="M68 30 L30 52 L80 32 Z" fill="#c8d8f0"/>
              </svg>
            </div>
            <FU d={2.1} size={10} color="#38bdf8" weight={700} lsp="0.32em" upper>VIP Clearance</FU>
            <FU d={2.25} size={18} color="#fff" weight={800} mt={6} mb={4}>First Class Save!</FU>
            <FU d={2.4} color="rgba(148,163,184,1)" mb={24}>Your trip is saved in premium style.</FU>
            <Btn d={2.55} label="💎 Brilliant!" bg="linear-gradient(90deg,#0284c7,#0369a1)" shadow="0 8px 24px rgba(2,132,199,.44)" onClose={onClose}/>
          </div>
        </div>
      </div>
    </div>, document.body
  );
}

/* ════════════════════════════════════════════════════════════
   FLIGHT STYLE 12 — UFO / Flying Saucer  (abduction, fun & sci-fi)
════════════════════════════════════════════════════════════ */
function Flight12({ onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[300] overflow-hidden"
      style={{ background:"linear-gradient(165deg,#000a02 0%,#00160a 35%,#002010 65%,#003018 100%)" }}>
      {STARS.map((s,i)=>(
        <div key={i} className="absolute rounded-full pointer-events-none"
          style={{ left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,
            background:`rgba(${i%3===0?"150,255,150":i%3===1?"200,255,200":"255,255,200"},.7)`,
            animation:`starTwinkle ${s.dur} ease-in-out ${s.delay} infinite` }}/>
      ))}
      {/* Green tractor beam */}
      <div className="absolute pointer-events-none"
        style={{ top:"38%",left:"43%",width:100,height:200,
          clipPath:"polygon(25% 0%,75% 0%,100% 100%,0% 100%)",
          background:"linear-gradient(to bottom,rgba(50,255,80,.25),rgba(20,200,50,.08),transparent)",
          animation:"ufoBeam 1.2s ease-in-out .5s infinite" }}/>
      {/* Green particles rising in beam */}
      {Array.from({length:6},(_,i)=>({
        left:`${45+i*2}%`,delay:`${i*.2}s`,
      })).map((p,i)=>(
        <div key={i} className="absolute rounded-full pointer-events-none"
          style={{ left:p.left,top:"70%",width:3,height:3,background:"rgba(100,255,120,.6)",
            animation:`rocketLaunch 1.5s ease-out ${p.delay} infinite` }}/>
      ))}
      {/* UFO */}
      <div className="absolute pointer-events-none"
        style={{ left:"calc(50% - 70px)",animation:"ufoHover 3.5s cubic-bezier(.3,0,.5,1) .1s both",opacity:0 }}>
        <svg width="140" height="60" viewBox="0 0 140 60" style={{ filter:"drop-shadow(0 0 20px rgba(50,255,80,.4))" }}>
          <defs>
            <radialGradient id="f12dome" cx="40%" cy="30%" r="55%">
              <stop offset="0%" stopColor="rgba(80,255,120,.4)"/><stop offset="60%" stopColor="rgba(30,180,60,.3)"/><stop offset="100%" stopColor="rgba(10,80,20,.5)"/>
            </radialGradient>
            <radialGradient id="f12hull" cx="50%" cy="30%" r="50%">
              <stop offset="0%" stopColor="#3a6a40"/><stop offset="50%" stopColor="#1e4028"/><stop offset="100%" stopColor="#0a2010"/>
            </radialGradient>
            <radialGradient id="f12glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(50,255,80,.5)"/><stop offset="100%" stopColor="transparent"/>
            </radialGradient>
          </defs>
          {/* Outer glow ring */}
          <ellipse cx="70" cy="38" rx="68" ry="14" fill="url(#f12glow)" opacity=".6"/>
          {/* Main saucer hull */}
          <ellipse cx="70" cy="40" rx="65" ry="12" fill="url(#f12hull)"/>
          <ellipse cx="70" cy="37" rx="65" ry="10" fill="url(#f12hull)"/>
          {/* Saucer rim bevel */}
          <ellipse cx="70" cy="37" rx="65" ry="10" fill="none" stroke="rgba(80,200,100,.4)" strokeWidth="1.5"/>
          <ellipse cx="70" cy="40" rx="55" ry="7" fill="#0e2818"/>
          {/* Rotating lights around rim */}
          <g style={{ transformOrigin:"70px 38px",animation:"ufoSpin 2s linear infinite" }}>
            {[0,40,80,120,160,200,240,280,320].map((a,i)=>(
              <circle key={i} cx={70+Math.cos(a*Math.PI/180)*58} cy={38+Math.sin(a*Math.PI/180)*9}
                r="3.5" fill={CC[i%9]}
                style={{ filter:`drop-shadow(0 0 4px ${CC[i%9]})` }}/>
            ))}
          </g>
          {/* Center underbelly — tractor beam emitter */}
          <ellipse cx="70" cy="42" rx="18" ry="5" fill="#0a1a10" stroke="rgba(50,255,80,.4)" strokeWidth="1"/>
          <ellipse cx="70" cy="42" rx="10" ry="3" fill="rgba(50,255,80,.2)"/>
          {/* Dome (top) */}
          <ellipse cx="70" cy="28" rx="32" ry="18" fill="url(#f12dome)"/>
          <ellipse cx="70" cy="28" rx="30" ry="17" fill="none" stroke="rgba(80,255,120,.2)" strokeWidth="1"/>
          {/* Dome highlight */}
          <ellipse cx="58" cy="22" rx="10" ry="7" fill="rgba(150,255,170,.1)"/>
          {/* Alien silhouette inside dome */}
          <ellipse cx="70" cy="26" rx="8" ry="10" fill="rgba(0,30,8,.5)"/>
          <circle cx="70" cy="18" r="6" fill="rgba(0,30,8,.4)"/>
          {/* Eye glow */}
          <circle cx="67" cy="18" r="2" fill="rgba(80,255,120,.5)"/>
          <circle cx="73" cy="18" r="2" fill="rgba(80,255,120,.5)"/>
        </svg>
      </div>
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
        <div className="pointer-events-auto w-full max-w-[338px] rounded-2xl overflow-hidden"
          style={{ background:"linear-gradient(145deg,#030e06,#051508)",
            border:"1px solid rgba(50,200,80,.32)",
            boxShadow:"0 24px 64px rgba(0,0,0,.92),0 0 60px rgba(30,200,60,.18)",
            animation:"cardZoom .8s cubic-bezier(.3,1.3,.6,1) 2.2s both" }}>
          <div style={{ height:3,background:"linear-gradient(90deg,#16a34a,#22c55e,#4ade80,#86efac)" }}/>
          <div className="px-7 py-8 text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.38)",
                boxShadow:"0 0 30px rgba(34,197,94,.3)",animation:"ufoSpin 4s linear 2.7s infinite" }}>
              <svg width="36" height="18" viewBox="0 0 140 60">
                <ellipse cx="70" cy="40" rx="65" ry="12" fill="#1e4028"/>
                <ellipse cx="70" cy="28" rx="32" ry="18" fill="rgba(80,255,120,.3)"/>
                <ellipse cx="70" cy="42" rx="18" ry="5" fill="rgba(50,255,80,.3)"/>
              </svg>
            </div>
            <FU d={2.3} size={10} color="#4ade80" weight={700} lsp="0.32em" upper>Abducted! 👽</FU>
            <FU d={2.45} size={18} color="#fff" weight={800} mt={6} mb={4}>We Got Your Data!</FU>
            <FU d={2.6} color="rgba(134,239,172,.8)" mb={24}>Your trip was beamed up & saved safely.</FU>
            <Btn d={2.75} label="👾 Take Me Up!" bg="linear-gradient(90deg,#15803d,#166534)" shadow="0 8px 24px rgba(21,128,61,.44)" onClose={onClose}/>
          </div>
        </div>
      </div>
    </div>, document.body
  );
}

/* ─── Preview data ────────────────────────────────────────── */
const FLIGHT_OPTIONS = [
  { id:"F1", label:"Commercial Airliner", Popup:Flight1,
    thumb:"bg-gradient-to-br from-[#04091f] to-[#0f2258]", icon:"🛫",
    iBg:"rgba(59,130,246,.18)", iBd:"rgba(59,130,246,.4)",
    desc:"Night sky · Stars twinkle · Wide-body airliner with wings, engines & windows flies past · Card lands", },
  { id:"F2", label:"Supersonic Fighter Jet", Popup:Flight2,
    thumb:"bg-gradient-to-br from-[#0d2055] to-[#0a1540]", icon:"⚡",
    iBg:"rgba(239,68,68,.15)", iBd:"rgba(239,68,68,.4)",
    desc:"Day sky · Delta-wing fighter blazes across in 0.5s · Sonic boom rings · Afterburner glow trail", },
  { id:"F3", label:"Paper Plane Sunset", Popup:Flight3,
    thumb:"bg-gradient-to-br from-[#1a0a2e] to-[#d45a2a]", icon:"📄",
    iBg:"rgba(240,154,58,.15)", iBd:"rgba(240,154,58,.4)",
    desc:"Warm sunset sky (purple → orange) · Origami paper plane glides with gentle wobble · Dot trail", },
  { id:"F4", label:"Space Rocket Launch", Popup:Flight4,
    thumb:"bg-gradient-to-br from-[#00010a] to-[#080c3a]", icon:"🚀",
    iBg:"rgba(139,92,246,.16)", iBd:"rgba(139,92,246,.4)",
    desc:"Deep space · Moon & stars · Rocket launches vertically with fire exhaust · Speed lines zoom past", },
  { id:"F5", label:"Hot Air Balloon", Popup:Flight5,
    thumb:"bg-gradient-to-br from-[#1a2744] to-[#f4845a]", icon:"🎈",
    iBg:"rgba(240,184,110,.14)", iBd:"rgba(240,184,110,.38)",
    desc:"Sunrise sky · Birds fly past · Detailed striped balloon with basket slowly rises up · Golden card", },
  { id:"F6", label:"Vintage Biplane", Popup:Flight6,
    thumb:"bg-gradient-to-br from-[#1a0e04] to-[#c47228]", icon:"🛩️",
    iBg:"rgba(200,130,40,.14)", iBd:"rgba(200,130,40,.38)",
    desc:"Golden dusk sky · Wooden biplane swoops in with spinning prop · Smoke trail blobs · Warm card", },
  { id:"F7", label:"Helicopter", Popup:Flight7,
    thumb:"bg-gradient-to-br from-[#100830] to-[#38186a]", icon:"🚁",
    iBg:"rgba(124,58,237,.14)", iBd:"rgba(124,58,237,.38)",
    desc:"City twilight · Helicopter flies right→left with spinning rotors · Searchlight beam below · Purple night card", },
  { id:"F8", label:"Concorde SST", Popup:Flight8,
    thumb:"bg-gradient-to-br from-[#020510] to-[#1a3570]", icon:"✈️",
    iBg:"rgba(59,130,246,.12)", iBd:"rgba(59,130,246,.35)",
    desc:"High stratosphere · Iconic drooped-nose Concorde breaks Mach 2 · Shockwave rings · Deep navy card", },
  { id:"F9", label:"Space Shuttle", Popup:Flight9,
    thumb:"bg-gradient-to-br from-[#000308] to-[#1a3a7a]", icon:"🚀",
    iBg:"rgba(245,158,11,.12)", iBd:"rgba(245,158,11,.35)",
    desc:"Orbital reentry · Shuttle glides diagonally with orange plasma heat trail · Earth arc visible · Dark space card", },
  { id:"F10", label:"Airship / Blimp", Popup:Flight10,
    thumb:"bg-gradient-to-br from-[#0c1830] to-[#3a6898]", icon:"🎈",
    iBg:"rgba(58,106,170,.12)", iBd:"rgba(58,106,170,.35)",
    desc:"Evening sky · Giant zeppelin drifts slowly with spinning props · Gondola hangs below · Steel blue card", },
  { id:"F11", label:"Private Jet", Popup:Flight11,
    thumb:"bg-gradient-to-br from-[#0a2044] to-[#3a72b8]", icon:"🛫",
    iBg:"rgba(14,165,233,.12)", iBd:"rgba(14,165,233,.35)",
    desc:"Clear day sky · Gulfstream T-tail jet banks gracefully with contrail · Sun glare · Premium sky blue card", },
  { id:"F12", label:"UFO / Saucer", Popup:Flight12,
    thumb:"bg-gradient-to-br from-[#000a02] to-[#003018]", icon:"🛸",
    iBg:"rgba(34,197,94,.1)", iBd:"rgba(34,197,94,.38)",
    desc:"Alien night sky · UFO descends with spinning lights & green tractor beam · Fun sci-fi night card", },
];

const OTHER_STYLES = [
  { id:"O1", label:"Party Burst",     Popup:PopupParty,   thumb:"bg-[#0f0f1a]",                              icon:"🏆", iBg:"rgba(245,158,11,.15)", iBd:"rgba(245,158,11,.38)", desc:"24 confetti pieces fall · Trophy bounces in · Rainbow shimmer text" },
  { id:"O2", label:"Route Checkpoint",Popup:PopupRoute,   thumb:"bg-gradient-to-br from-[#061510] to-[#0b2018]", icon:"📍", iBg:"rgba(16,185,129,.15)", iBd:"rgba(16,185,129,.38)", desc:"Map grid · SVG route draws · Pin drops · Ripple rings" },
  { id:"O3", label:"Passport Stamp",  Popup:PopupPassport,thumb:"bg-gradient-to-br from-[#1c1208] to-[#251a0c]", icon:"🛂", iBg:"rgba(200,160,80,.1)", iBd:"rgba(200,160,80,.32)", desc:"Passport header · Stamp SLAMS down · Impact flash · Auto REF code" },
];

/* ─── Main page ───────────────────────────────────────────── */
export default function PopupStylesPreview() {
  const [active, setActive] = useState(null);

  useEffect(() => {
    const id = "popup-kf-v4";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id; s.textContent = KF;
      document.head.appendChild(s);
    }
  }, []);

  const ActivePopup = active
    ? ([...FLIGHT_OPTIONS,...OTHER_STYLES].find(p=>p.id===active)?.Popup)
    : null;

  function Card({ p, accent }) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden hover:border-slate-700 transition-all group">
        <div className={`${p.thumb} h-36 border-b border-slate-800 relative flex items-center justify-center overflow-hidden`}>
          <span className="absolute top-3 left-3 text-[10px] font-black text-white/20">{p.id}</span>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110 duration-300"
            style={{ background:p.iBg, border:`1.5px solid ${p.iBd}`, boxShadow:`0 0 22px ${p.iBd}` }}>
            {p.icon}
          </div>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background:`radial-gradient(circle at center,${p.iBd}18,transparent 70%)` }}/>
        </div>
        <div className="p-4 space-y-2.5">
          <p className="font-bold text-white text-sm">{p.label}</p>
          <p className="text-slate-500 text-[11px] leading-relaxed">{p.desc}</p>
          <button onClick={()=>setActive(p.id)}
            className={`w-full py-2 rounded-xl text-white text-sm font-semibold transition-colors ${accent}`}>
            Try it →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090f] text-white p-5 md:p-10">
      <div className="max-w-6xl mx-auto">

        {/* Flight section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-900/40 border border-blue-700/30 flex items-center justify-center text-sm">✈️</div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Trip Master — Pick a Flight Style</p>
          </div>
          <h1 className="text-2xl font-black text-white mb-1">✈️ 6 Flight Animation Options</h1>
          <p className="text-slate-400 text-sm mb-6">Each design has a completely different aircraft, sky, and animation. Try them all and tell me which one to use for the Trip master popup.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FLIGHT_OPTIONS.map(p=><Card key={p.id} p={p} accent="bg-blue-700 hover:bg-blue-600"/>)}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 my-8"/>

        {/* Other styles */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-900/40 border border-emerald-700/30 flex items-center justify-center text-sm">🎨</div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Other Style Options</p>
          </div>
          <p className="text-slate-400 text-sm mb-6">Non-flight themed styles for reference.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {OTHER_STYLES.map(p=><Card key={p.id} p={p} accent="bg-emerald-700 hover:bg-emerald-600"/>)}
          </div>
        </div>

        <p className="mt-10 text-center text-slate-700 text-xs">
          6 flight styles · F1 Airliner · F2 Fighter Jet · F3 Paper Plane · F4 Rocket · F5 Balloon · F6 Biplane
        </p>
      </div>

      {ActivePopup && <ActivePopup onClose={()=>setActive(null)}/>}
    </div>
  );
}
