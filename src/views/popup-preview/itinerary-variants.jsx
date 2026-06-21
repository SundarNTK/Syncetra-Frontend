import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

/* ─── Shared star data ───────────────────────────────────────────────────────── */
const STARS = Array.from({ length: 32 }, (_, i) => ({
  x:    ((i * 37 + 11) % 97) + 1,
  y:    ((i * 53 + 7)  % 91) + 3,
  size: 0.9 + (i % 4) * 0.65,
  delay:`${((i * 0.41) % 3).toFixed(2)}s`,
  dur:  `${(1.5 + (i % 5) * 0.4).toFixed(1)}s`,
}));

/* ─── All keyframes (injected once) ─────────────────────────────────────────── */
const KF = `
@keyframes itvStar{0%,100%{opacity:.08;transform:scale(.6);}50%{opacity:1;transform:scale(1.35);}}
@keyframes itvFadeUp{0%{transform:translateY(16px);opacity:0;}100%{transform:translateY(0);opacity:1;}}
@keyframes itvBounce{0%{transform:scale(0)rotate(-18deg);opacity:0;}55%{transform:scale(1.28)rotate(6deg);opacity:1;}72%{transform:scale(.9)rotate(-2deg);}87%{transform:scale(1.05);}100%{transform:scale(1)rotate(0);opacity:1;}}
@keyframes itvCardLand{0%{transform:translateY(60px)scale(.92);opacity:0;}55%{transform:translateY(-8px)scale(1.01);opacity:1;}76%{transform:translateY(4px);}100%{transform:translateY(0)scale(1);opacity:1;}}
@keyframes itvCardSlide{0%{transform:translateY(80px);opacity:0;}100%{transform:translateY(0);opacity:1;}}
@keyframes itvFlip{0%{transform:perspective(900px)rotateY(-180deg)scale(.22);opacity:0;}55%{transform:perspective(900px)rotateY(18deg)scale(1.04);opacity:1;}75%{transform:perspective(900px)rotateY(-9deg)scale(.97);}100%{transform:perspective(900px)rotateY(0)scale(1);opacity:1;}}
@keyframes itvRipple{0%{transform:scale(.15);opacity:.85;}100%{transform:scale(3.8);opacity:0;}}
@keyframes itvDrop{0%{transform:translateY(-110px)scale(.8);opacity:0;}60%{transform:translateY(8px)scale(1.05);opacity:1;}78%{transform:translateY(-5px);}100%{transform:translateY(0)scale(1);opacity:1;}}

/* V1 — Star Navigator */
@keyframes itvConstellDraw{0%{stroke-dashoffset:240;}100%{stroke-dashoffset:0;}}
@keyframes itvStarSpin{100%{transform:rotate(360deg);}}
@keyframes itvStarOrbit{100%{transform:rotate(360deg);}}
@keyframes itvNebulaFloat{0%,100%{transform:scale(1)rotate(0deg);}50%{transform:scale(1.08)rotate(4deg);}}

/* V2 — Holographic Pin */
@keyframes itvHexPulse{0%,100%{opacity:.04;}50%{opacity:.12;}}
@keyframes itvScanRing{0%{transform:scale(.15);opacity:.8;}100%{transform:scale(3.6);opacity:0;}}
@keyframes itvPinRise{0%{transform:translateY(50px)scale(.8);opacity:0;}60%{transform:translateY(-6px)scale(1.04);opacity:1;}80%{transform:translateY(4px);}100%{transform:translateY(0)scale(1);opacity:1;}}
@keyframes itvBeacon{0%,100%{opacity:.3;transform:scaleY(1);}50%{opacity:.9;transform:scaleY(1.15);}}

/* V3 — Vintage Stamp */
@keyframes itvJournalOpen{0%{transform:perspective(500px)rotateY(-40deg)scale(.9);opacity:0;}70%{transform:perspective(500px)rotateY(5deg)scale(1.02);opacity:1;}100%{transform:perspective(500px)rotateY(0)scale(1);opacity:1;}}
@keyframes itvStampDown{0%{transform:translateY(-110px)rotate(-4deg)scale(1.15);opacity:0;}60%{transform:translateY(5px)rotate(1deg)scale(1);opacity:1;}78%{transform:translateY(-4px);}100%{transform:translateY(0)rotate(0)scale(1);opacity:1;}}
@keyframes itvStampFlash{0%,55%{opacity:0;}60%{opacity:.55;}100%{opacity:0;}}
@keyframes itvPageFlutter{0%,100%{transform:rotateY(0);}50%{transform:rotateY(-8deg);}}
@keyframes itvDustFloat{0%{transform:translateY(0)translateX(0);opacity:.6;}100%{transform:translateY(-40px)translateX(10px);opacity:0;}}

/* V4 — Neon Metro */
@keyframes itvMetroDraw{0%{stroke-dashoffset:400;}100%{stroke-dashoffset:0;}}
@keyframes itvStationPop{0%{transform:scale(0);opacity:0;}80%{transform:scale(1.3);}100%{transform:scale(1);opacity:1;}}
@keyframes itvTrainSlide{0%{transform:translateX(-120px);opacity:0;}25%{opacity:1;}75%{opacity:1;}100%{transform:translateX(120px);opacity:0;}}
@keyframes itvNeonFlicker{0%,95%{opacity:1;}96%{opacity:.4;}97%{opacity:1;}98%{opacity:.6;}100%{opacity:1;}}

/* V5 — Aurora Compass */
@keyframes itvAurora{0%{transform:translateX(-110%)skewX(-20deg);opacity:0;}15%{opacity:.75;}85%{opacity:.4;}100%{transform:translateX(110%)skewX(-20deg);opacity:0;}}
@keyframes itvCompassSpin{0%{transform:rotate(-200deg);}100%{transform:rotate(0);}}
@keyframes itvAuroraFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-14px);}}
@keyframes itvAuroraPulse{0%,100%{opacity:.3;}50%{opacity:.7;}}

/* V6 — Ocean Navigator */
@keyframes itvWave{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
@keyframes itvSonar{0%{transform:scale(.15);opacity:.8;}100%{transform:scale(3.2);opacity:0;}}
@keyframes itvShipBob{0%,100%{transform:translateY(0)rotate(-1.5deg);}50%{transform:translateY(-10px)rotate(2deg);}}
@keyframes itvWakeLine{0%{width:0;opacity:0;}40%{opacity:.7;}100%{width:120px;opacity:0;}}
`;

function useKF() {
  useEffect(() => {
    const id = "itv-kf";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id; s.textContent = KF;
      document.head.appendChild(s);
    }
  }, []);
}

/* ─── Shared text/button helpers ─────────────────────────────────────────────── */
function FU({ children, delay, size = 13, color, weight = 400, lsp, upper, mt = 0, mb = 8 }) {
  return (
    <p style={{ fontSize: size, color, fontWeight: weight, letterSpacing: lsp,
      textTransform: upper ? "uppercase" : undefined, marginTop: mt, marginBottom: mb,
      animation: `itvFadeUp .5s ease ${delay}s both`, opacity: 0 }}>
      {children}
    </p>
  );
}
function Btn({ label, bg, shadow, delay, onClose }) {
  return (
    <button onClick={onClose} style={{ width: "100%", padding: "11px", borderRadius: 12,
      fontWeight: 700, fontSize: 13, background: bg, color: "#fff", border: "none", cursor: "pointer",
      boxShadow: shadow, animation: `itvFadeUp .5s ease ${delay}s both`, opacity: 0 }}>
      {label}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   VARIANT 1 — STAR NAVIGATOR
   Galaxy backdrop · constellation route · golden star icon · navy card
══════════════════════════════════════════════════════════════════════════════ */
function V1StarNavigator({ action, onClose }) {
  const add = action !== "edit";
  const pts = [[44,20],[62,34],[56,56],[30,52],[24,36]];
  return createPortal(
    <div className="fixed inset-0 z-[300] overflow-hidden"
      style={{ background:"linear-gradient(160deg,#04061a 0%,#090c38 50%,#0e0830 100%)" }}>
      {/* Stars */}
      {STARS.map((s,i)=>(
        <div key={i} className="absolute rounded-full bg-white pointer-events-none"
          style={{ left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,
            animation:`itvStar ${s.dur} ease-in-out ${s.delay} infinite` }}/>
      ))}
      {/* Nebula glow patches */}
      {[{x:20,y:30,c:"rgba(139,92,246,.06)",sz:200},{x:75,y:60,c:"rgba(59,130,246,.07)",sz:260},{x:55,y:15,c:"rgba(236,72,153,.05)",sz:180}].map((n,i)=>(
        <div key={i} className="absolute rounded-full pointer-events-none"
          style={{ left:`${n.x}%`,top:`${n.y}%`,width:n.sz,height:n.sz,background:n.c,
            transform:"translate(-50%,-50%)",filter:"blur(30px)",animation:`itvNebulaFloat ${5+i}s ease-in-out ${i*.7}s infinite` }}/>
      ))}
      {/* Constellation SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity:.35 }}>
        {pts.map((_,i)=>{
          if(i===pts.length-1)return null;
          return <line key={i} x1={`${pts[i][0]}%`} y1={`${pts[i][1]}%`} x2={`${pts[i+1][0]}%`} y2={`${pts[i+1][1]}%`}
            stroke="#f59e0b" strokeWidth="1" strokeDasharray="200"
            style={{ animation:`itvConstellDraw 1.2s ease ${.3+i*.25}s both`, strokeDashoffset:200 }}/>;
        })}
        {pts.map(([x,y],i)=>(
          <circle key={i} cx={`${x}%`} cy={`${y}%`} r="3" fill="#fbbf24"
            style={{ animation:`itvBounce .4s ease ${.5+i*.2}s both`,opacity:0 }}/>
        ))}
      </svg>
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
        <div className="pointer-events-auto w-full max-w-[338px] rounded-2xl overflow-hidden"
          style={{ background:"linear-gradient(145deg,#0c0e2e,#121640)",
            border:"1px solid rgba(251,191,36,.32)", boxShadow:"0 28px 70px rgba(0,0,0,.9),0 0 50px rgba(251,191,36,.12)",
            animation:"itvCardLand .85s cubic-bezier(.3,1.4,.6,1) .5s both",opacity:0 }}
          onClick={e=>e.stopPropagation()}>
          <div style={{ height:3,background:"linear-gradient(90deg,#f59e0b,#fbbf24,#8b5cf6,#3b82f6)" }}/>
          <div className="px-7 py-8 text-center">
            {/* Star icon */}
            <div className="relative mx-auto mb-5 flex items-center justify-center"
              style={{ width:88,height:88,animation:"itvBounce .7s cubic-bezier(.34,1.5,.64,1) .6s both",opacity:0 }}>
              <svg width="88" height="88" viewBox="0 0 88 88">
                <defs>
                  <radialGradient id="v1bg" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#1e1040"/>
                    <stop offset="100%" stopColor="#0c0820"/>
                  </radialGradient>
                </defs>
                <circle cx="44" cy="44" r="42" fill="url(#v1bg)"/>
                <circle cx="44" cy="44" r="40" fill="none" stroke="rgba(251,191,36,.25)" strokeWidth="1.5"/>
                {/* Orbiting ring */}
                <g style={{ transformOrigin:"44px 44px",animation:"itvStarOrbit 4s linear 1.2s infinite" }}>
                  <ellipse cx="44" cy="44" rx="36" ry="10" fill="none" stroke="rgba(251,191,36,.2)" strokeWidth="1" transform="rotate(-20,44,44)"/>
                  <circle cx="80" cy="44" r="3" fill="#fbbf24" transform="rotate(-20,44,44)" style={{ filter:"blur(.5px)" }}/>
                </g>
                {/* 5-pointed star */}
                <polygon points="44,12 50,34 72,34 55,48 61,70 44,57 27,70 33,48 16,34 38,34"
                  fill="rgba(251,191,36,.9)" style={{ filter:"drop-shadow(0 0 8px rgba(251,191,36,.6))" }}/>
                <polygon points="44,22 48,34 60,34 51,41 54,54 44,47 34,54 37,41 28,34 40,34"
                  fill="rgba(255,255,255,.85)"/>
                <circle cx="44" cy="44" r="4" fill="#fff"/>
              </svg>
            </div>
            {[0,.45,.9].map((d,i)=>(
              <div key={i} className="absolute pointer-events-none" style={{
                borderRadius:"50%",border:"1.5px solid rgba(251,191,36,.35)",
                inset:`calc(50% - ${38+i*8}px)`,
                animation:`itvRipple 2.4s ease-out ${1+d}s infinite` }}/>
            ))}
            <FU delay={1.1} size={10} color="#fbbf24" weight={700} lsp="0.32em" upper>Route {add?"Charted":"Revised"}</FU>
            <FU delay={1.26} size={19} color="#fff" weight={800} mt={6} mb={5}>{add?"Stop Plotted! ⭐":"Route Updated! ✦"}</FU>
            <FU delay={1.42} color="rgba(253,230,138,.75)" mb={24}>{add?"Your waypoint has been added to the star chart.":"The route stop has been recalibrated."}</FU>
            <Btn delay={1.58} label={add?"🌟 Navigate!":"✦ Confirmed!"} bg="linear-gradient(90deg,#b45309,#d97706,#f59e0b)" shadow="0 8px 26px rgba(245,158,11,.45)" onClose={onClose}/>
          </div>
        </div>
      </div>
    </div>, document.body
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   VARIANT 2 — HOLOGRAPHIC PIN
   Cyberpunk black · hex grid · cyan beacon rising · neon card
══════════════════════════════════════════════════════════════════════════════ */
function V2HolographicPin({ action, onClose }) {
  const add = action !== "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(0,4,12,.97)" }} onClick={onClose}>
      {/* Hex grid bg */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity:.06,
        backgroundImage:`url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="60" height="52"><path d="M30 0 L60 17.3 L60 34.6 L30 52 L0 34.6 L0 17.3 Z" fill="none" stroke="#06b6d4" stroke-width="0.8"/></svg>')}")`,
        backgroundSize:"60px 52px",animation:"itvHexPulse 3s ease-in-out infinite" }}/>
      {/* Scan rings */}
      {[0,.5,1].map((d,i)=>(
        <div key={i} className="absolute pointer-events-none" style={{
          borderRadius:"50%",border:`1.5px solid rgba(6,182,212,${.6-i*.15})`,
          width:60,height:60,top:"50%",left:"50%",transform:"translate(-50%,-50%)",
          animation:`itvScanRing 2s ease-out ${d}s infinite` }}/>
      ))}
      {/* Neon corner lines */}
      {[{t:0,l:0,bdr:"0 0 0 2px #06b6d4"},{t:0,r:0,bdr:"0 0 2px 0 #06b6d4"},{b:0,l:0,bdr:"0 0 0 0"},{b:0,r:0,bdr:"0 0 0 0"}].map((_,i)=>(
        <div key={i} className="absolute pointer-events-none" style={{ width:40,height:40,
          top:i<2?16:undefined,bottom:i>=2?16:undefined,left:i%2===0?16:undefined,right:i%2===1?16:undefined,
          border:`1.5px solid rgba(6,182,212,.6)`,
          borderRight:i%2===0?"none":undefined,borderLeft:i%2===1?"none":undefined,
          borderBottom:i<2?"none":undefined,borderTop:i>=2?"none":undefined }}/>
      ))}
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#000c14,#001824)",border:"1px solid rgba(6,182,212,.4)",
          boxShadow:"0 28px 70px rgba(0,0,0,.95),0 0 60px rgba(6,182,212,.18),inset 0 1px 0 rgba(6,182,212,.15)",
          animation:"itvCardSlide .7s cubic-bezier(.3,1.3,.6,1) .3s both",opacity:0 }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#06b6d4,#0ea5e9,#8b5cf6,#06b6d4)",backgroundSize:"200%",animation:"itvNeonFlicker 4s ease 2s infinite" }}/>
        <div className="px-7 py-8 text-center">
          {/* Holo pin SVG */}
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ width:80,height:92,animation:"itvPinRise .8s cubic-bezier(.34,1.3,.64,1) .4s both",opacity:0 }}>
            <svg width="80" height="92" viewBox="0 0 80 92">
              <defs>
                <linearGradient id="v2pin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee"/>
                  <stop offset="60%" stopColor="#0891b2"/>
                  <stop offset="100%" stopColor="#164e63"/>
                </linearGradient>
                <radialGradient id="v2glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(6,182,212,.5)"/>
                  <stop offset="100%" stopColor="transparent"/>
                </radialGradient>
                <linearGradient id="v2shine" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,.25)"/>
                  <stop offset="60%" stopColor="rgba(255,255,255,0)"/>
                </linearGradient>
              </defs>
              {/* Hex base glow */}
              <ellipse cx="40" cy="88" rx="28" ry="5" fill="url(#v2glow)" opacity=".8"/>
              {/* Pin shadow */}
              <ellipse cx="40" cy="86" rx="12" ry="3" fill="rgba(6,182,212,.25)"/>
              {/* Pin stem */}
              <path d="M40 55 L34 88 L40 84 L46 88 Z" fill="#0e7490"/>
              {/* Pin head */}
              <path d="M40 4 L72 20 L72 48 Q72 70 40 80 Q8 70 8 48 L8 20 Z" fill="url(#v2pin)"
                style={{ filter:"drop-shadow(0 0 12px rgba(6,182,212,.55))" }}/>
              <path d="M40 8 L68 22 L68 46 Q68 64 42 74 L42 8 Z" fill="url(#v2shine)" opacity=".7"/>
              {/* Hex pattern on face */}
              {[{cx:40,cy:34,r:18},{cx:40,cy:34,r:12},{cx:40,cy:34,r:6}].map((c,i)=>(
                <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill="none"
                  stroke={`rgba(186,230,253,${.35-i*.08})`} strokeWidth="1"
                  style={{ animation:`itvRipple 2s ease-out ${.5+i*.3}s infinite`,transformOrigin:`${c.cx}px ${c.cy}px` }}/>
              ))}
              {/* Location dot */}
              <circle cx="40" cy="34" r="8" fill="rgba(6,182,212,.3)"/>
              <circle cx="40" cy="34" r="4" fill="#22d3ee" style={{ filter:"blur(.5px)" }}/>
              <circle cx="40" cy="34" r="2" fill="#fff"/>
              {/* Beacon beam */}
              <path d="M28 4 L40 0 L52 4 L40 8 Z" fill="rgba(34,211,238,.6)"
                style={{ animation:"itvBeacon .8s ease-in-out .6s infinite" }}/>
            </svg>
          </div>
          <FU delay={0.9} size={10} color="#22d3ee" weight={700} lsp="0.32em" upper>Stop {add?"Pinned":"Updated"}</FU>
          <FU delay={1.05} size={19} color="#fff" weight={800} mt={6} mb={5}>{add?"Location Locked! 📍":"Pin Updated! 🎯"}</FU>
          <FU delay={1.2} color="rgba(103,232,249,.75)" mb={24}>{add?"Waypoint successfully pinned to the route map.":"Stop coordinates have been recalibrated."}</FU>
          <Btn delay={1.35} label={add?"🛰️ Locked In!":"⬡ Confirmed!"} bg="linear-gradient(90deg,#0891b2,#0e7490)" shadow="0 8px 26px rgba(8,145,178,.5)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   VARIANT 3 — VINTAGE STAMP
   Warm parchment bg · travel journal opens · rubber stamp slams · sepia gold
══════════════════════════════════════════════════════════════════════════════ */
function V3VintageStamp({ action, onClose }) {
  const add = action !== "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(14,8,2,.96)" }} onClick={onClose}>
      {/* Warm vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background:"radial-gradient(ellipse at center,rgba(180,83,9,.06) 0%,transparent 70%)" }}/>
      {/* Vintage grid paper */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity:.03,
        backgroundImage:"linear-gradient(rgba(217,119,6,1) 1px,transparent 1px),linear-gradient(90deg,rgba(217,119,6,1) 1px,transparent 1px)",
        backgroundSize:"28px 28px" }}/>
      {/* Stamp flash */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background:"rgba(253,230,138,.08)",animation:"itvStampFlash .3s ease .7s both" }}/>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#1a0e02,#221406)",border:"1px solid rgba(217,119,6,.45)",
          boxShadow:"0 28px 70px rgba(0,0,0,.92),0 0 50px rgba(180,83,9,.15)",
          animation:"itvCardSlide .7s cubic-bezier(.3,1.3,.6,1) both",opacity:0 }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#d97706,#b45309,#f59e0b,#92400e)" }}/>
        <div className="px-7 py-8 text-center">
          {/* Journal SVG */}
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ width:92,height:84,animation:"itvJournalOpen .7s cubic-bezier(.34,1.2,.64,1) .15s both",opacity:0 }}>
            <svg width="92" height="84" viewBox="0 0 92 84">
              <defs>
                <linearGradient id="v3cover" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#92400e"/>
                  <stop offset="100%" stopColor="#5c2607"/>
                </linearGradient>
                <linearGradient id="v3page" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fef3c7"/>
                  <stop offset="100%" stopColor="#fde68a"/>
                </linearGradient>
                <linearGradient id="v3spine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#451a03"/>
                  <stop offset="100%" stopColor="#78350f"/>
                </linearGradient>
              </defs>
              {/* Shadow */}
              <ellipse cx="50" cy="82" rx="36" ry="3" fill="rgba(0,0,0,.4)"/>
              {/* Back cover */}
              <rect x="6" y="6" width="64" height="70" rx="4" fill="url(#v3cover)" opacity=".6"/>
              {/* Pages */}
              {[2,4,6].map(o=>(
                <rect key={o} x={8+o} y={8} width={60-o} height="66" rx="3" fill="url(#v3page)" opacity={.4+o*.1}/>
              ))}
              {/* Front cover */}
              <rect x="8" y="6" width="60" height="70" rx="4" fill="url(#v3cover)"
                style={{ filter:"drop-shadow(0 4px 10px rgba(0,0,0,.4))" }}/>
              <rect x="8" y="6" width="60" height="14" rx="4" fill="#78350f"/>
              {/* Spine */}
              <rect x="4" y="6" width="8" height="70" rx="3" fill="url(#v3spine)"/>
              {[18,30,42,54].map(y=>(
                <line key={y} x1="5" y1={y} x2="11" y2={y} stroke="rgba(255,255,255,.15)" strokeWidth="1"/>
              ))}
              {/* Title band */}
              <text x="38" y="20" fontSize="6" fill="rgba(253,230,138,.7)" textAnchor="middle" fontWeight="bold" letterSpacing="1">TRIP LOG</text>
              {/* Map squiggle lines on cover */}
              {[30,42,54].map((y,i)=>(
                <rect key={i} x="18" y={y} width={30-i*4} height="3" rx="1.5" fill="rgba(253,230,138,.2)"/>
              ))}
              {/* Mini compass on cover */}
              <circle cx="38" cy="52" r="12" fill="rgba(0,0,0,.25)" stroke="rgba(253,230,138,.3)" strokeWidth="1"/>
              <text x="38" y="45" fontSize="5" fill="rgba(253,230,138,.6)" textAnchor="middle">N</text>
              <line x1="38" y1="46" x2="38" y2="55" stroke="rgba(239,68,68,.7)" strokeWidth="1.5"/>
              <line x1="38" y1="56" x2="38" y2="62" stroke="rgba(253,230,138,.4)" strokeWidth="1.5"/>
              {/* Bookmark ribbon */}
              <rect x="56" y="6" width="5" height="22" fill="#b45309"/>
              <path d="M56 28 L58.5 24 L61 28 Z" fill="#b45309"/>
            </svg>
          </div>
          {/* Stamp SVG — drops on top */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ paddingBottom:90,animation:"itvStampDown .55s cubic-bezier(.34,1,.64,1) .65s both",opacity:0 }}>
            <svg width="120" height="68" viewBox="0 0 120 68">
              <defs>
                <linearGradient id="v3stamp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#dc2626"/>
                  <stop offset="100%" stopColor="#991b1b"/>
                </linearGradient>
              </defs>
              <rect x="4" y="4" width="112" height="60" rx="6" fill="url(#v3stamp)"
                style={{ filter:"drop-shadow(0 4px 12px rgba(220,38,38,.5))" }}/>
              <rect x="8" y="8" width="104" height="52" rx="4" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" strokeDasharray="6 3"/>
              <text x="60" y="28" fontSize="8" fill="rgba(255,255,255,.7)" textAnchor="middle" fontWeight="bold" letterSpacing="2">✈ SYNCETRA</text>
              <text x="60" y="42" fontSize="14" fill="#fff" textAnchor="middle" fontWeight="900" letterSpacing="1">{add?"LOGGED":"UPDATED"}</text>
              <text x="60" y="54" fontSize="7" fill="rgba(255,255,255,.6)" textAnchor="middle" letterSpacing="1">ITINERARY</text>
            </svg>
          </div>
          <FU delay={1.0} size={10} color="#fbbf24" weight={700} lsp="0.3em" upper>Journal {add?"Entry Added":"Entry Revised"}</FU>
          <FU delay={1.15} size={19} color="#fff" weight={800} mt={6} mb={5}>{add?"Stop Logged! 📖":"Entry Updated! ✍️"}</FU>
          <FU delay={1.3} color="rgba(253,230,138,.7)" mb={24}>{add?"A new stop has been stamped into your travel journal.":"The itinerary entry has been revised and sealed."}</FU>
          <Btn delay={1.45} label={add?"📜 Adventure Awaits!":"🗺️ All Set!"} bg="linear-gradient(90deg,#b45309,#d97706)" shadow="0 8px 26px rgba(180,83,9,.45)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   VARIANT 4 — NEON METRO
   City night · metro schematic animates · stations pop · electric purple card
══════════════════════════════════════════════════════════════════════════════ */
function V4NeonMetro({ action, onClose }) {
  const add = action !== "edit";
  const stations = [[16,38],[34,22],[54,28],[70,46],[54,62],[34,56]];
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"rgba(2,0,14,.97)" }} onClick={onClose}>
      {/* City skyline silhouette */}
      <svg className="absolute bottom-0 left-0 right-0 pointer-events-none w-full" height="180" viewBox="0 0 400 180" preserveAspectRatio="none">
        <path d="M0 180 L0 130 L20 130 L20 100 L40 100 L40 80 L55 80 L55 60 L70 60 L70 80 L90 80 L90 100 L110 100 L110 70 L130 70 L130 50 L145 50 L145 70 L160 70 L160 90 L180 90 L180 60 L200 60 L200 40 L215 40 L215 60 L230 60 L230 80 L250 80 L250 100 L270 100 L270 75 L290 75 L290 55 L305 55 L305 75 L320 75 L320 95 L340 95 L340 70 L360 70 L360 90 L380 90 L380 110 L400 110 L400 180 Z"
          fill="rgba(15,10,40,.9)"/>
        {/* Window lights */}
        {Array.from({length:20},(_,i)=>({x:20+i*18,y:60+((i*7)%40),on:i%3!==1})).map((w,i)=>(
          <rect key={i} x={w.x} y={w.y} width="5" height="4" rx="1"
            fill={w.on?`rgba(${i%2===0?"147,51,234":"59,130,246"},.5)`:"rgba(255,255,255,.04)"}/>
        ))}
      </svg>
      {/* Metro map SVG background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity:.25 }}>
        <polyline points={stations.map(([x,y])=>`${x}% ${y}%`).join(" ")}
          fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="600" style={{ animation:"itvMetroDraw 2s ease .2s both",strokeDashoffset:600 }}/>
        <polyline points="16% 38% 10% 52% 10% 68%"
          fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="200"
          style={{ animation:"itvMetroDraw 1s ease .8s both",strokeDashoffset:200 }}/>
        <polyline points="70% 46% 80% 38% 90% 38%"
          fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="200"
          style={{ animation:"itvMetroDraw 1s ease 1s both",strokeDashoffset:200 }}/>
        {stations.map(([x,y],i)=>(
          <g key={i} style={{ animation:`itvStationPop .4s cubic-bezier(.34,1.5,.64,1) ${.5+i*.15}s both`,opacity:0,transformOrigin:`${x}% ${y}%` }}>
            <circle cx={`${x}%`} cy={`${y}%`} r="7" fill="#0f0824" stroke="#7c3aed" strokeWidth="2"/>
            <circle cx={`${x}%`} cy={`${y}%`} r="3.5" fill="#a78bfa"/>
          </g>
        ))}
      </svg>
      {/* Animated train */}
      <div className="absolute pointer-events-none" style={{ top:"37%",left:0,right:0,height:20,overflow:"hidden" }}>
        <div style={{ animation:"itvTrainSlide 3s cubic-bezier(.4,0,.55,1) .5s infinite" }}>
          <svg width="80" height="20" viewBox="0 0 80 20">
            <rect x="2" y="2" width="76" height="14" rx="5" fill="#4c1d95"/>
            {[10,22,34,46,58,70].map(x=>(
              <rect key={x} x={x} y="4" width="8" height="6" rx="1.5" fill="rgba(167,139,250,.6)"/>
            ))}
            <ellipse cx="78" cy="9" rx="5" ry="4" fill="rgba(253,224,71,.8)" style={{ filter:"blur(1px)" }}/>
          </svg>
        </div>
      </div>
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#0a0226,#0d0432)",border:"1px solid rgba(124,58,237,.45)",
          boxShadow:"0 28px 70px rgba(0,0,0,.95),0 0 55px rgba(124,58,237,.2),inset 0 1px 0 rgba(167,139,250,.1)",
          animation:"itvFlip .9s cubic-bezier(.2,1.2,.5,1) .3s both",opacity:0 }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#7c3aed,#3b82f6,#10b981,#7c3aed)",backgroundSize:"200%",animation:"itvNeonFlicker 5s linear 1.5s infinite" }}/>
        <div className="px-7 py-8 text-center">
          {/* Metro map icon */}
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ width:88,height:78,animation:"itvBounce .65s cubic-bezier(.34,1.5,.64,1) .5s both",opacity:0 }}>
            <svg width="88" height="78" viewBox="0 0 88 78">
              <defs>
                <radialGradient id="v4bg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1e0a4e"/>
                  <stop offset="100%" stopColor="#0a0224"/>
                </radialGradient>
              </defs>
              <rect x="2" y="2" width="84" height="74" rx="10" fill="url(#v4bg)"/>
              <rect x="2" y="2" width="84" height="74" rx="10" fill="none" stroke="rgba(124,58,237,.4)" strokeWidth="1.5"/>
              {/* Metro lines */}
              <line x1="10" y1="40" x2="78" y2="40" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round"
                strokeDasharray="80" style={{ animation:"itvMetroDraw .8s ease .6s both",strokeDashoffset:80 }}/>
              <line x1="24" y1="14" x2="64" y2="62" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray="70" style={{ animation:"itvMetroDraw .8s ease .75s both",strokeDashoffset:70 }}/>
              <line x1="64" y1="14" x2="24" y2="62" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray="70" style={{ animation:"itvMetroDraw .8s ease .9s both",strokeDashoffset:70 }}/>
              {/* Station dots */}
              {[{cx:10,cy:40,c:"#7c3aed"},{cx:44,cy:40,c:"#fff"},{cx:78,cy:40,c:"#7c3aed"},
                {cx:24,cy:14,c:"#3b82f6"},{cx:64,cy:62,c:"#3b82f6"},
                {cx:64,cy:14,c:"#10b981"},{cx:24,cy:62,c:"#10b981"}].map((d,i)=>(
                <g key={i} style={{ animation:`itvStationPop .35s ease ${1+i*.1}s both`,opacity:0,transformOrigin:`${d.cx}px ${d.cy}px` }}>
                  <circle cx={d.cx} cy={d.cy} r="6" fill={d.c === "#fff" ? "#1e0a4e" : "none"} stroke={d.c} strokeWidth="2"/>
                  <circle cx={d.cx} cy={d.cy} r="3" fill={d.c} style={{ filter:`drop-shadow(0 0 4px ${d.c})` }}/>
                </g>
              ))}
              {/* "M" logo */}
              <text x="44" y="72" fontSize="10" fill="rgba(167,139,250,.6)" textAnchor="middle" fontWeight="900">METRO</text>
            </svg>
          </div>
          <FU delay={1.0} size={10} color="#a78bfa" weight={700} lsp="0.32em" upper>Station {add?"Added":"Modified"}</FU>
          <FU delay={1.15} size={19} color="#fff" weight={800} mt={6} mb={5}>{add?"Stop On Track! 🚇":"Route Adjusted! 🛤️"}</FU>
          <FU delay={1.3} color="rgba(196,181,253,.7)" mb={24}>{add?"New station added to the transit route.":"Station details have been updated on the line."}</FU>
          <Btn delay={1.45} label={add?"🚇 Board Now!":"✔ On Track!"} bg="linear-gradient(90deg,#7c3aed,#4f46e5)" shadow="0 8px 26px rgba(124,58,237,.48)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   VARIANT 5 — AURORA COMPASS
   Arctic night · sweeping aurora waves · large compass rose · multi-color card
══════════════════════════════════════════════════════════════════════════════ */
function V5AuroraCompass({ action, onClose }) {
  const add = action !== "edit";
  const auroraLayers = [
    { color:"rgba(16,185,129,.55)", delay:0, dur:"2.8s", top:"18%" },
    { color:"rgba(6,182,212,.4)",   delay:.4, dur:"3.5s", top:"28%" },
    { color:"rgba(139,92,246,.35)", delay:.8, dur:"2.2s", top:"38%" },
    { color:"rgba(16,185,129,.3)",  delay:1.2, dur:"4s",  top:"20%" },
  ];
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"linear-gradient(180deg,#010c0a 0%,#021a12 40%,#020e0e 100%)" }} onClick={onClose}>
      {/* Stars */}
      {STARS.slice(0,20).map((s,i)=>(
        <div key={i} className="absolute rounded-full bg-white pointer-events-none"
          style={{ left:`${s.x}%`,top:`${s.y*.55}%`,width:s.size*.8,height:s.size*.8,
            animation:`itvStar ${s.dur} ease-in-out ${s.delay} infinite` }}/>
      ))}
      {/* Aurora layers */}
      {auroraLayers.map((a,i)=>(
        <div key={i} className="absolute left-0 right-0 pointer-events-none overflow-hidden"
          style={{ top:a.top,height:"12%",opacity:0 }}>
          <div style={{ height:"100%",width:"220%",
            background:`linear-gradient(90deg,transparent 0%,${a.color} 20%,${a.color.replace(/\.[\d]+\)$/,".8)")} 40%,${a.color} 65%,transparent 100%)`,
            filter:"blur(8px)",
            animation:`itvAurora ${a.dur} ease-in-out ${a.delay}s infinite` }}/>
        </div>
      ))}
      {/* Subtle ground glow */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height:"30%",
        background:"linear-gradient(0deg,rgba(16,185,129,.06),transparent)",filter:"blur(4px)" }}/>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#041510,#071e16)",border:"1px solid rgba(16,185,129,.38)",
          boxShadow:"0 28px 70px rgba(0,0,0,.9),0 0 60px rgba(16,185,129,.15)",
          animation:"itvCardLand .8s cubic-bezier(.3,1.4,.6,1) .4s both",opacity:0 }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#10b981,#06b6d4,#8b5cf6,#10b981)",backgroundSize:"200%",animation:"itvNeonFlicker 6s linear 1.5s infinite" }}/>
        <div className="px-7 py-8 text-center">
          {/* Large Aurora Compass SVG */}
          <div className="mx-auto mb-5 flex items-center justify-center relative"
            style={{ width:90,height:90,animation:"itvBounce .75s cubic-bezier(.34,1.5,.64,1) .5s both",opacity:0 }}>
            <svg width="90" height="90" viewBox="0 0 90 90">
              <defs>
                <radialGradient id="v5face" cx="50%" cy="40%" r="55%">
                  <stop offset="0%" stopColor="#0d2a22"/>
                  <stop offset="100%" stopColor="#040e0a"/>
                </radialGradient>
                <radialGradient id="v5aurora" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(16,185,129,.3)"/>
                  <stop offset="100%" stopColor="transparent"/>
                </radialGradient>
              </defs>
              {/* Aurora glow ring */}
              <circle cx="45" cy="45" r="44" fill="url(#v5aurora)" style={{ animation:"itvAuroraPulse 2.5s ease-in-out 1s infinite" }}/>
              <circle cx="45" cy="45" r="43" fill="none" stroke="rgba(16,185,129,.3)" strokeWidth="1.5"/>
              <circle cx="45" cy="45" r="41" fill="url(#v5face)"/>
              {/* Colorful degree marks */}
              {Array.from({length:36},(_,i)=>{
                const a=i*10*Math.PI/180,r1=i%9===0?31:i%3===0?33:35;
                const colors=["#10b981","#06b6d4","#8b5cf6","#06b6d4"];
                return <line key={i}
                  x1={45+Math.cos(a)*r1} y1={45+Math.sin(a)*r1}
                  x2={45+Math.cos(a)*39} y2={45+Math.sin(a)*39}
                  stroke={i%9===0?colors[Math.floor(i/9)]:"rgba(255,255,255,.1)"}
                  strokeWidth={i%9===0?2:.8}/>;
              })}
              {/* Cardinal letters */}
              {[{l:"N",a:-90,c:"#10b981"},{l:"E",a:0,c:"#06b6d4"},{l:"S",a:90,c:"#8b5cf6"},{l:"W",a:180,c:"#06b6d4"}].map(({l,a,c})=>(
                <text key={l} x={45+Math.cos(a*Math.PI/180)*27} y={45+Math.sin(a*Math.PI/180)*27+4}
                  fontSize="9" fill={c} textAnchor="middle" fontWeight="bold">{l}</text>
              ))}
              {/* Inner aurora rings */}
              {[8,16,24].map((r,i)=>(
                <circle key={i} cx="45" cy="45" r={r} fill="none"
                  stroke={["rgba(16,185,129,.25)","rgba(6,182,212,.2)","rgba(139,92,246,.15)"][i]}
                  strokeWidth="1"/>
              ))}
              {/* Compass needle */}
              <g style={{ transformOrigin:"45px 45px",animation:"itvCompassSpin .9s cubic-bezier(.34,1.2,.64,1) .6s both" }}>
                <path d="M45 45 L41 25 L45 18 L49 25 Z" fill="#10b981" style={{ filter:"drop-shadow(0 0 6px rgba(16,185,129,.7))" }}/>
                <path d="M45 45 L41 65 L45 72 L49 65 Z" fill="rgba(255,255,255,.55)"/>
              </g>
              <circle cx="45" cy="45" r="5" fill="#040e0a" stroke="rgba(16,185,129,.6)" strokeWidth="1.5"/>
              <circle cx="45" cy="45" r="2.5" fill="#10b981" style={{ filter:"blur(.5px)" }}/>
            </svg>
          </div>
          {[0,.45,.9].map((d,i)=>(
            <div key={i} className="absolute pointer-events-none" style={{
              borderRadius:"50%",border:`1.5px solid rgba(16,185,129,${.4-i*.1})`,
              inset:`calc(50% - ${36+i*9}px)`,animation:`itvRipple 2.6s ease-out ${1.2+d}s infinite` }}/>
          ))}
          <FU delay={1.1} size={10} color="#34d399" weight={700} lsp="0.32em" upper>Waypoint {add?"Discovered":"Recalibrated"}</FU>
          <FU delay={1.25} size={19} color="#fff" weight={800} mt={6} mb={5}>{add?"North Found! 🧭":"Route Aligned! 🌌"}</FU>
          <FU delay={1.4} color="rgba(110,231,183,.7)" mb={24}>{add?"A new stop has been charted under the northern lights.":"Your itinerary stop has been updated with precision."}</FU>
          <Btn delay={1.55} label={add?"🌿 Chart the Route!":"🧭 Locked!"} bg="linear-gradient(90deg,#059669,#0d9488)" shadow="0 8px 26px rgba(5,150,105,.48)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   VARIANT 6 — OCEAN NAVIGATOR
   Deep ocean · sonar rings · ship bobbing · wake trail · nautical blue card
══════════════════════════════════════════════════════════════════════════════ */
function V6OceanNavigator({ action, onClose }) {
  const add = action !== "edit";
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:"linear-gradient(180deg,#010612 0%,#020d2e 45%,#010a22 100%)" }} onClick={onClose}>
      {/* Stars / starfield at top */}
      {STARS.slice(0,14).map((s,i)=>(
        <div key={i} className="absolute rounded-full bg-white pointer-events-none"
          style={{ left:`${s.x}%`,top:`${s.y*.35}%`,width:s.size*.7,height:s.size*.7,
            animation:`itvStar ${s.dur} ease-in-out ${s.delay} infinite` }}/>
      ))}
      {/* Ocean waves */}
      <div className="absolute pointer-events-none" style={{ bottom:0,left:0,right:0,height:"38%",overflow:"hidden" }}>
        {[0,1,2].map(i=>(
          <div key={i} className="absolute left-0" style={{ bottom:`${i*22}%`,width:"200%",height:"80px",
            backgroundImage:`radial-gradient(ellipse 120px 40px at center,rgba(${i===0?"6,182,212":i===1?"3,105,161":"1,67,120"},.${i===0?"18":"12"}),transparent)`,
            animation:`itvWave ${3.5+i*.8}s linear ${i*.4}s infinite` }}/>
        ))}
        {/* Deep ocean base */}
        <div className="absolute inset-0" style={{ background:"linear-gradient(0deg,rgba(1,22,80,.8),rgba(2,20,62,.4))" }}/>
      </div>
      {/* Sonar rings from center bottom */}
      {[0,.6,1.2].map((d,i)=>(
        <div key={i} className="absolute pointer-events-none" style={{
          width:60,height:60,bottom:"35%",left:"50%",transform:"translate(-50%,50%)",
          borderRadius:"50%",border:`1.5px solid rgba(6,182,212,${.55-i*.12})`,
          animation:`itvSonar 2.5s ease-out ${d}s infinite` }}/>
      ))}
      {/* Ship */}
      <div className="absolute pointer-events-none" style={{ bottom:"36%",left:"50%",
        transform:"translateX(-50%)",animation:"itvShipBob 3s ease-in-out infinite" }}>
        <svg width="90" height="48" viewBox="0 0 90 48">
          <defs>
            <linearGradient id="v6hull" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e3a5f"/><stop offset="100%" stopColor="#0c1f3d"/>
            </linearGradient>
          </defs>
          {/* Hull */}
          <path d="M8 28 L82 28 L74 44 L16 44 Z" fill="url(#v6hull)"/>
          <path d="M8 28 L82 28 L78 36 L12 36 Z" fill="#0e7490" opacity=".5"/>
          {/* Deck */}
          <rect x="18" y="20" width="54" height="10" rx="2" fill="#1e3a5f"/>
          {/* Cabin */}
          <rect x="30" y="10" width="30" height="12" rx="3" fill="#1e3a5f"/>
          <rect x="33" y="12" width="8" height="6" rx="1" fill="rgba(186,230,253,.4)"/>
          <rect x="49" y="12" width="8" height="6" rx="1" fill="rgba(186,230,253,.4)"/>
          {/* Mast */}
          <line x1="45" y1="2" x2="45" y2="18" stroke="rgba(255,255,255,.5)" strokeWidth="2"/>
          <line x1="36" y1="8" x2="54" y2="8" stroke="rgba(255,255,255,.35)" strokeWidth="1.5"/>
          {/* Flag */}
          <path d="M45 2 L52 5 L45 8 Z" fill="#06b6d4"/>
          {/* Navigation light */}
          <circle cx="82" cy="27" r="3" fill="rgba(253,224,71,.85)" style={{ filter:"blur(.8px)" }}/>
        </svg>
      </div>
      {/* Wake trail */}
      <div className="absolute pointer-events-none" style={{ bottom:"37%",left:"50%",height:4,
        background:"linear-gradient(90deg,transparent,rgba(6,182,212,.5),transparent)",
        animation:"itvWakeLine 2.5s ease-out .5s infinite",borderRadius:2 }}/>
      <button className="absolute inset-0 z-0" onClick={onClose}/>
      <div className="relative z-10 w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{ background:"linear-gradient(145deg,#020d2e,#031540)",border:"1px solid rgba(6,182,212,.38)",
          boxShadow:"0 28px 70px rgba(0,0,0,.92),0 0 55px rgba(6,182,212,.14)",
          animation:"itvCardLand .8s cubic-bezier(.3,1.4,.6,1) .5s both",opacity:0 }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ height:3,background:"linear-gradient(90deg,#0ea5e9,#06b6d4,#0891b2)" }}/>
        <div className="px-7 py-8 text-center">
          {/* Nautical compass icon */}
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{ width:88,height:88,animation:"itvBounce .7s cubic-bezier(.34,1.5,.64,1) .6s both",opacity:0 }}>
            <svg width="88" height="88" viewBox="0 0 88 88">
              <defs>
                <radialGradient id="v6face" cx="50%" cy="40%" r="55%">
                  <stop offset="0%" stopColor="#0c2a4a"/>
                  <stop offset="100%" stopColor="#020d24"/>
                </radialGradient>
                <linearGradient id="v6needle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9"/>
                  <stop offset="100%" stopColor="#0369a1"/>
                </linearGradient>
              </defs>
              <circle cx="44" cy="44" r="43" fill="none" stroke="rgba(6,182,212,.2)" strokeWidth="1"/>
              <circle cx="44" cy="44" r="41" fill="url(#v6face)" style={{ filter:"drop-shadow(0 4px 16px rgba(0,0,0,.5))" }}/>
              {/* Nautical rings */}
              <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(6,182,212,.15)" strokeWidth="1"/>
              <circle cx="44" cy="44" r="30" fill="none" stroke="rgba(6,182,212,.1)" strokeWidth="1" strokeDasharray="4 4"/>
              {/* Wind rose */}
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
              {/* Compass arrows */}
              <g style={{ transformOrigin:"44px 44px",animation:"itvCompassSpin .9s cubic-bezier(.34,1.2,.64,1) .7s both" }}>
                <path d="M44 44 L40 22 L44 16 L48 22 Z" fill="url(#v6needle)" style={{ filter:"drop-shadow(0 0 6px rgba(6,182,212,.6))" }}/>
                <path d="M44 44 L40 66 L44 72 L48 66 Z" fill="rgba(255,255,255,.45)"/>
              </g>
              <circle cx="44" cy="44" r="5" fill="#020d24" stroke="rgba(6,182,212,.6)" strokeWidth="1.5"/>
              <circle cx="44" cy="44" r="2.5" fill="#0ea5e9"/>
              {/* Sonar rings on compass */}
              {[0,.5,1].map((d,i)=>(
                <circle key={i} cx="44" cy="44" r={14+i*8} fill="none"
                  stroke="rgba(6,182,212,.2)" strokeWidth=".8"
                  style={{ animation:`itvRipple 2s ease-out ${1.2+d}s infinite`,transformOrigin:"44px 44px" }}/>
              ))}
            </svg>
          </div>
          <FU delay={1.1} size={10} color="#38bdf8" weight={700} lsp="0.32em" upper>Port {add?"Logged":"Updated"}</FU>
          <FU delay={1.25} size={19} color="#fff" weight={800} mt={6} mb={5}>{add?"Anchors Away! ⚓":"Course Corrected! 🌊"}</FU>
          <FU delay={1.4} color="rgba(125,211,252,.7)" mb={24}>{add?"A new port of call has been charted on your voyage.":"The stop details have been updated in the ship's log."}</FU>
          <Btn delay={1.55} label={add?"⚓ Set Sail!":"🧭 Aye Aye!"} bg="linear-gradient(90deg,#0284c7,#0369a1)" shadow="0 8px 26px rgba(2,132,199,.48)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

/* ─── Variant registry ─────────────────────────────────────────────────────── */
const VARIANTS = [
  {
    id: "v1", name: "Star Navigator",
    desc: "Galaxy backdrop with animated constellation route and golden star icon",
    accent: "#f59e0b", accentBg: "rgba(245,158,11,.08)", border: "rgba(245,158,11,.3)",
    tags: ["Galaxy", "Gold", "Constellation"],
    Component: V1StarNavigator,
  },
  {
    id: "v2", name: "Holographic Pin",
    desc: "Cyberpunk hex grid with a 3D beacon rising from scan rings",
    accent: "#06b6d4", accentBg: "rgba(6,182,212,.08)", border: "rgba(6,182,212,.3)",
    tags: ["Cyberpunk", "Neon", "Hologram"],
    Component: V2HolographicPin,
  },
  {
    id: "v3", name: "Vintage Stamp",
    desc: "Travel journal opens and a rubber stamp slams — warm sepia tones",
    accent: "#d97706", accentBg: "rgba(217,119,6,.08)", border: "rgba(217,119,6,.3)",
    tags: ["Vintage", "Warm", "Journal"],
    Component: V3VintageStamp,
  },
  {
    id: "v4", name: "Neon Metro",
    desc: "City night skyline with animated metro route lines and train",
    accent: "#7c3aed", accentBg: "rgba(124,58,237,.08)", border: "rgba(124,58,237,.3)",
    tags: ["Neon", "City", "Purple"],
    Component: V4NeonMetro,
  },
  {
    id: "v5", name: "Aurora Compass",
    desc: "Northern lights sweep across the sky with a glowing multi-color compass rose",
    accent: "#10b981", accentBg: "rgba(16,185,129,.08)", border: "rgba(16,185,129,.3)",
    tags: ["Aurora", "Arctic", "Multi-color"],
    Component: V5AuroraCompass,
  },
  {
    id: "v6", name: "Ocean Navigator",
    desc: "Deep ocean with a bobbing ship, sonar pings and nautical compass",
    accent: "#0ea5e9", accentBg: "rgba(14,165,233,.08)", border: "rgba(14,165,233,.3)",
    tags: ["Ocean", "Navy", "Nautical"],
    Component: V6OceanNavigator,
  },
];

/* ─── Preview page ─────────────────────────────────────────────────────────── */
export default function ItineraryVariantsPreview() {
  useKF();
  const [active, setActive] = useState(null); // { Component, action }

  return (
    <div className="min-h-screen bg-[#080c14] px-4 py-10">
      {active && <active.Component action={active.action} onClose={() => setActive(null)} />}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest border border-emerald-700/40 bg-emerald-900/20 text-emerald-400 mb-4">
            Itinerary Popup Variants
          </span>
          <h1 className="text-3xl font-extrabold text-white mb-3">Choose Your Style</h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Click "Preview Add" or "Preview Edit" on any card to see the full-screen animation.
            Tell me which one you like!
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {VARIANTS.map((v, i) => (
            <div key={v.id} className="rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02]"
              style={{ background:"linear-gradient(145deg,#0d1117,#111820)", borderColor:v.border,
                boxShadow:`0 4px 24px rgba(0,0,0,.4),0 0 0 0 ${v.accent}`,
                animation:`itvFadeUp .5s ease ${i*.08}s both`,opacity:0 }}>
              {/* Color bar */}
              <div style={{ height:3, background:`linear-gradient(90deg,${v.accent},${v.accent}88)` }}/>
              {/* Card body */}
              <div className="p-5">
                {/* Number + name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                    style={{ background:v.accentBg, border:`1px solid ${v.border}`, color:v.accent }}>
                    {i+1}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm leading-tight">{v.name}</p>
                  </div>
                </div>
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {v.tags.map(t=>(
                    <span key={t} className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background:v.accentBg, color:v.accent, border:`1px solid ${v.border}` }}>
                      {t}
                    </span>
                  ))}
                </div>
                {/* Description */}
                <p className="text-[12px] text-slate-400 leading-relaxed mb-4">{v.desc}</p>
                {/* Buttons */}
                <div className="flex gap-2">
                  <button onClick={() => setActive({ Component: v.Component, action: "add" })}
                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{ background:v.accentBg, border:`1px solid ${v.border}`, color:v.accent }}
                    onMouseEnter={e=>{ e.currentTarget.style.background=`${v.accent}22`; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background=v.accentBg; }}>
                    ▶ Preview Add
                  </button>
                  <button onClick={() => setActive({ Component: v.Component, action: "edit" })}
                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)", color:"#94a3b8" }}
                    onMouseEnter={e=>{ e.currentTarget.style.background="rgba(255,255,255,.08)"; e.currentTarget.style.color="#cbd5e1"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background="rgba(255,255,255,.04)"; e.currentTarget.style.color="#94a3b8"; }}>
                    ✏️ Preview Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-slate-600 text-xs mt-10">
          Pick a number (1–6) and tell me — I'll wire it into the itinerary master immediately.
        </p>
      </div>
    </div>
  );
}
