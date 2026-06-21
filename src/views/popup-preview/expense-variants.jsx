import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

/* ─── Keyframes ──────────────────────────────────────────────────────────────── */
const KF = `
@keyframes expFadeUp{0%{transform:translateY(16px);opacity:0;}100%{transform:translateY(0);opacity:1;}}
@keyframes expBounce{0%{transform:scale(0)rotate(-18deg);opacity:0;}55%{transform:scale(1.28)rotate(6deg);opacity:1;}72%{transform:scale(.9)rotate(-2deg);}87%{transform:scale(1.05);}100%{transform:scale(1)rotate(0);opacity:1;}}
@keyframes expCardLand{0%{transform:translateY(60px)scale(.92);opacity:0;}55%{transform:translateY(-8px)scale(1.01);opacity:1;}76%{transform:translateY(4px);}100%{transform:translateY(0)scale(1);opacity:1;}}
@keyframes expCardSlide{0%{transform:translateY(80px);opacity:0;}100%{transform:translateY(0);opacity:1;}}
@keyframes expFlip{0%{transform:perspective(900px)rotateY(-180deg)scale(.22);opacity:0;}55%{transform:perspective(900px)rotateY(18deg)scale(1.04);opacity:1;}75%{transform:perspective(900px)rotateY(-9deg)scale(.97);}100%{transform:perspective(900px)rotateY(0)scale(1);opacity:1;}}
@keyframes expRipple{0%{transform:scale(.15);opacity:.85;}100%{transform:scale(3.8);opacity:0;}}
@keyframes expStar{0%,100%{opacity:.08;transform:scale(.6);}50%{opacity:1;transform:scale(1.35);}}

/* V1 — Gold Vault */
@keyframes expVaultOpen{0%{transform:perspective(600px)rotateY(-90deg);opacity:0;}60%{transform:perspective(600px)rotateY(8deg);opacity:1;}80%{transform:perspective(600px)rotateY(-4deg);}100%{transform:perspective(600px)rotateY(0);opacity:1;}}
@keyframes expWheelSpin{0%{transform:rotate(-720deg);}100%{transform:rotate(0);}}
@keyframes expCoinFall{0%{transform:translateY(-70px)rotate(0);opacity:0;}60%{opacity:1;transform:translateY(0)rotate(var(--cr,180deg));}100%{transform:translateY(0)rotate(var(--cr,180deg));opacity:.8;}}
@keyframes expGoldGlow{0%,100%{box-shadow:0 0 18px rgba(251,191,36,.2);}50%{box-shadow:0 0 40px rgba(251,191,36,.55);}}

/* V2 — Bull Market */
@keyframes expChartDraw{0%{stroke-dashoffset:300;}100%{stroke-dashoffset:0;}}
@keyframes expBarGrow{0%{transform:scaleY(0);}100%{transform:scaleY(1);}}
@keyframes expBullStamp{0%{transform:translateX(-80px)scale(.7);opacity:0;}65%{transform:translateX(6px)scale(1.04);opacity:1;}82%{transform:translateX(-4px);}100%{transform:translateX(0)scale(1);opacity:1;}}
@keyframes expTickerScroll{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}

/* V3 — Receipt Print */
@keyframes expPaperPull{0%{transform:translateY(-100%);opacity:0;}100%{transform:translateY(0);opacity:1;}}
@keyframes expInkLine{0%{width:0;opacity:0;}100%{width:100%;opacity:1;}}
@keyframes expPrinterLight{0%,100%{background:rgba(0,255,120,.2);}50%{background:rgba(0,255,120,.6);}}

/* V4 — Crypto Block */
@keyframes expCoinSpin{0%{transform:perspective(600px)rotateY(-360deg);}100%{transform:perspective(600px)rotateY(0);}}
@keyframes expHexConnect{0%{stroke-dashoffset:100;opacity:0;}100%{stroke-dashoffset:0;opacity:1;}}
@keyframes expBlockPop{0%{transform:scale(0);opacity:0;}70%{transform:scale(1.15);}100%{transform:scale(1);opacity:1;}}

/* V5 — Coin Shower */
@keyframes expCoinDrop{0%{transform:translateY(-80px)rotate(var(--a,0deg));opacity:0;}70%{opacity:1;}100%{transform:translateY(var(--ty,60px))rotate(var(--a,360deg));opacity:.6;}}
@keyframes expBagBounce{0%{transform:scale(0)rotate(-12deg);opacity:0;}55%{transform:scale(1.2)rotate(5deg);opacity:1;}72%{transform:scale(.92);}87%{transform:scale(1.05);}100%{transform:scale(1)rotate(0);opacity:1;}}
@keyframes expSackSwing{0%,100%{transform:rotate(0);}25%{transform:rotate(4deg);}75%{transform:rotate(-4deg);}}

/* V6 — Diamond Ledger */
@keyframes expDiamondIn{0%{transform:scale(0)rotate(-30deg);opacity:0;}55%{transform:scale(1.2)rotate(5deg);opacity:1;}72%{transform:scale(.92)rotate(-2deg);}87%{transform:scale(1.05);}100%{transform:scale(1)rotate(0);opacity:1;}}
@keyframes expSparkle{0%,100%{opacity:0;transform:scale(0);}50%{opacity:1;transform:scale(1.2);}}
@keyframes expPrismRot{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
@keyframes expLedgerLine{0%{width:0;opacity:0;}100%{width:var(--w,80%);opacity:1;}}
`;

const STARS = Array.from({length:28},(_,i)=>({
  x:((i*37+11)%97)+1, y:((i*53+7)%91)+3,
  size:.9+(i%4)*.6, delay:`${((i*.41)%3).toFixed(2)}s`, dur:`${(1.5+(i%5)*.4).toFixed(1)}s`
}));

function useKF() {
  useEffect(()=>{
    const id="exp-kf";
    if(!document.getElementById(id)){
      const s=document.createElement("style");
      s.id=id; s.textContent=KF;
      document.head.appendChild(s);
    }
  },[]);
}

function FU({children,delay,size=13,color,weight=400,lsp,upper,mt=0,mb=8}){
  return(
    <p style={{fontSize:size,color,fontWeight:weight,letterSpacing:lsp,
      textTransform:upper?"uppercase":undefined,marginTop:mt,marginBottom:mb,
      animation:`expFadeUp .5s ease ${delay}s both`,opacity:0}}>
      {children}
    </p>
  );
}
function Btn({label,bg,shadow,delay,onClose}){
  return(
    <button onClick={onClose} style={{width:"100%",padding:"11px",borderRadius:12,fontWeight:700,
      fontSize:13,background:bg,color:"#fff",border:"none",cursor:"pointer",
      boxShadow:shadow,animation:`expFadeUp .5s ease ${delay}s both`,opacity:0}}>
      {label}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   VARIANT 1 — GOLD VAULT
   Dark amber · vault door swings open · gold bars + coins · rich card
══════════════════════════════════════════════════════════════════════════════ */
function V1GoldVault({action,onClose}){
  const add = action !== "edit";
  const coins = [
    {x:25,y:28,cr:"140deg",d:.1},{x:38,y:22,cr:"210deg",d:.2},{x:52,y:30,cr:"80deg",d:.15},
    {x:65,y:25,cr:"300deg",d:.25},{x:44,y:18,cr:"160deg",d:.3},{x:30,y:35,cr:"240deg",d:.05},
  ];
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{background:"linear-gradient(160deg,#0c0700,#1a0e00,#0f0900)"}} onClick={onClose}>
      {/* Radial gold glow center */}
      <div className="absolute inset-0 pointer-events-none"
        style={{background:"radial-gradient(ellipse at 50% 50%,rgba(251,191,36,.06),transparent 65%)"}}/>
      {/* Floating dust particles */}
      {Array.from({length:12},(_,i)=>(
        <div key={i} className="absolute rounded-full pointer-events-none"
          style={{left:`${20+i*5}%`,top:`${15+i*6}%`,width:2,height:2,
            background:"rgba(251,191,36,.4)",
            animation:`expStar ${2+i*.3}s ease-in-out ${i*.2}s infinite`}}/>
      ))}
      {/* Coins dropping from above */}
      {coins.map((c,i)=>(
        <div key={i} className="absolute pointer-events-none"
          style={{left:`${c.x}%`,top:"30%","--cr":c.cr,
            animation:`expCoinFall .7s cubic-bezier(.34,1.2,.64,1) ${c.d}s both`,opacity:0}}>
          <svg width="24" height="14" viewBox="0 0 24 14">
            <defs>
              <linearGradient id={`vc1c${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24"/><stop offset="50%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#d97706"/>
              </linearGradient>
            </defs>
            <ellipse cx="12" cy="7" rx="12" ry="7" fill={`url(#vc1c${i})`}/>
            <ellipse cx="12" cy="6" rx="12" ry="7" fill={`url(#vc1c${i})`}/>
            <ellipse cx="12" cy="6" rx="8" ry="4" fill="rgba(255,255,255,.18)"/>
            <text x="12" y="9" fontSize="6" fill="rgba(255,255,255,.7)" textAnchor="middle" fontWeight="bold">$</text>
          </svg>
        </div>
      ))}
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{background:"linear-gradient(145deg,#1a0e02,#241404)",border:"1px solid rgba(251,191,36,.4)",
          boxShadow:"0 28px 70px rgba(0,0,0,.92),0 0 55px rgba(251,191,36,.14)",
          animation:"expCardLand .85s cubic-bezier(.3,1.4,.6,1) .2s both",opacity:0}}
        onClick={e=>e.stopPropagation()}>
        <div style={{height:3,background:"linear-gradient(90deg,#b45309,#d97706,#fbbf24,#f59e0b)"}}/>
        <div className="px-7 py-8 text-center">
          {/* Vault door SVG */}
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{width:88,height:88,animation:"expVaultOpen .75s cubic-bezier(.34,1.2,.64,1) .35s both",opacity:0}}>
            <svg width="88" height="88" viewBox="0 0 88 88">
              <defs>
                <radialGradient id="v1vface" cx="50%" cy="40%" r="55%">
                  <stop offset="0%" stopColor="#292108"/><stop offset="100%" stopColor="#120f04"/>
                </radialGradient>
                <linearGradient id="v1vring" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#b45309"/>
                </linearGradient>
              </defs>
              <circle cx="44" cy="44" r="43" fill="url(#v1vring)" style={{filter:"drop-shadow(0 0 12px rgba(251,191,36,.4))"}}/>
              <circle cx="44" cy="44" r="40" fill="url(#v1vface)"/>
              <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(251,191,36,.35)" strokeWidth="2"/>
              {/* Bolt holes around ring */}
              {Array.from({length:8},(_,i)=>{
                const a=i*45*Math.PI/180;
                return <circle key={i} cx={44+Math.cos(a)*38} cy={44+Math.sin(a)*38} r="3" fill="url(#v1vring)"/>;
              })}
              {/* Spoke lock wheel */}
              <g style={{transformOrigin:"44px 44px",animation:"expWheelSpin .9s cubic-bezier(.34,1.2,.64,1) .3s both"}}>
                {Array.from({length:6},(_,i)=>{
                  const a=i*60*Math.PI/180;
                  return <line key={i} x1="44" y1="44" x2={44+Math.cos(a)*28} y2={44+Math.sin(a)*28}
                    stroke="rgba(251,191,36,.7)" strokeWidth="3" strokeLinecap="round"/>;
                })}
                <circle cx="44" cy="44" r="8" fill="url(#v1vring)" stroke="rgba(255,255,255,.2)" strokeWidth="1"/>
              </g>
              {/* Center lock indicator */}
              <circle cx="44" cy="44" r="4" fill="#fbbf24" style={{filter:"drop-shadow(0 0 6px rgba(251,191,36,.8))"}}/>
              {/* Dollar sign in center */}
              <text x="44" y="48" fontSize="7" fill="rgba(0,0,0,.6)" textAnchor="middle" fontWeight="900">$</text>
              {/* Hinge on left */}
              <rect x="2" y="28" width="6" height="10" rx="2" fill="url(#v1vring)"/>
              <rect x="2" y="50" width="6" height="10" rx="2" fill="url(#v1vring)"/>
              {/* Handle on right */}
              <circle cx="76" cy="44" r="7" fill="none" stroke="url(#v1vring)" strokeWidth="3"/>
              <circle cx="76" cy="44" r="3" fill="url(#v1vring)"/>
            </svg>
          </div>
          {[0,.5,1].map((d,i)=>(
            <div key={i} className="absolute pointer-events-none" style={{
              borderRadius:"50%",border:`1.5px solid rgba(251,191,36,${.4-i*.1})`,
              inset:`calc(50% - ${32+i*9}px)`,animation:`expRipple 2.4s ease-out ${1+d}s infinite`}}/>
          ))}
          <FU delay={1.0} size={10} color="#fbbf24" weight={700} lsp="0.32em" upper>Vault {add?"Logged":"Updated"}</FU>
          <FU delay={1.15} size={19} color="#fff" weight={800} mt={6} mb={5}>{add?"Expense Recorded! 💰":"Amount Updated! 🏦"}</FU>
          <FU delay={1.3} color="rgba(253,230,138,.7)" mb={24}>{add?"Your expense has been deposited into the ledger.":"The expense record has been revised."}</FU>
          <Btn delay={1.45} label={add?"🪙 Vaulted!":"💰 Confirmed!"} bg="linear-gradient(90deg,#b45309,#d97706,#f59e0b)" shadow="0 8px 26px rgba(245,158,11,.45)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   VARIANT 2 — BULL MARKET
   Dark trading floor · animated chart line + bars · bull silhouette
══════════════════════════════════════════════════════════════════════════════ */
function V2BullMarket({action,onClose}){
  const add = action !== "edit";
  const bars = [{h:30,d:.2},{h:46,d:.35},{h:22,d:.5},{h:58,d:.65},{h:38,d:.8},{h:72,d:.95}];
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{background:"linear-gradient(160deg,#010f06,#021508,#010b04)"}} onClick={onClose}>
      {/* Ticker tape scroll at top */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none overflow-hidden" style={{height:28,background:"rgba(0,0,0,.5)",borderBottom:"1px solid rgba(34,197,94,.15)"}}>
        <div style={{whiteSpace:"nowrap",animation:"expTickerScroll 8s linear infinite",display:"inline-block"}}>
          {["TRIP +2.4%","EXPENSE -0.1%","FUEL +1.8%","HOTEL +3.2%","FOOD +0.9%","TOTAL ▲12.4%","BUDGET ✓","TRIP +2.4%","EXPENSE -0.1%","FUEL +1.8%","HOTEL +3.2%","FOOD +0.9%","TOTAL ▲12.4%"].map((t,i)=>(
            <span key={i} className="inline-block mx-5 text-[10px] font-mono"
              style={{color:t.includes("-")?"#f87171":"#4ade80"}}>{t}</span>
          ))}
        </div>
      </div>
      {/* Background chart grid */}
      <div className="absolute inset-0 pointer-events-none" style={{opacity:.04,
        backgroundImage:"linear-gradient(rgba(34,197,94,1) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,1) 1px,transparent 1px)",
        backgroundSize:"32px 32px"}}/>
      {/* Green glow center */}
      <div className="absolute inset-0 pointer-events-none"
        style={{background:"radial-gradient(ellipse at 50% 60%,rgba(34,197,94,.07),transparent 65%)"}}/>
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{background:"linear-gradient(145deg,#021008,#03180a)",border:"1px solid rgba(34,197,94,.35)",
          boxShadow:"0 28px 70px rgba(0,0,0,.92),0 0 55px rgba(34,197,94,.12)",
          animation:"expFlip .85s cubic-bezier(.2,1.2,.5,1) .2s both",opacity:0}}
        onClick={e=>e.stopPropagation()}>
        <div style={{height:3,background:"linear-gradient(90deg,#16a34a,#22c55e,#4ade80)"}}/>
        <div className="px-7 py-8 text-center">
          {/* Mini chart + bull SVG */}
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{width:100,height:80,animation:"expBounce .65s cubic-bezier(.34,1.5,.64,1) .4s both",opacity:0}}>
            <svg width="100" height="80" viewBox="0 0 100 80">
              <defs>
                <linearGradient id="v2area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(34,197,94,.35)"/><stop offset="100%" stopColor="transparent"/>
                </linearGradient>
              </defs>
              {/* Chart background */}
              <rect x="0" y="0" width="100" height="80" rx="8" fill="rgba(0,0,0,.3)"/>
              {/* Grid lines */}
              {[20,40,60].map(y=><line key={y} x1="8" y1={y} x2="92" y2={y} stroke="rgba(34,197,94,.08)" strokeWidth="1"/>)}
              {/* Bars */}
              {bars.map((b,i)=>(
                <rect key={i} x={10+i*14} y={76-b.h} width="10" rx="2" height={b.h}
                  fill={`rgba(34,197,94,${.4+i*.08})`}
                  style={{transformOrigin:`${10+i*14+5}px 76px`,
                    animation:`expBarGrow .5s cubic-bezier(.34,1.2,.64,1) ${b.d}s both`,opacity:0}}/>
              ))}
              {/* Rising line chart */}
              <polyline points="10,72 24,56 38,60 52,44 66,34 80,18 94,8"
                fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="300"
                style={{animation:"expChartDraw 1s ease .2s both",strokeDashoffset:300}}/>
              {/* Area fill */}
              <polygon points="10,76 10,72 24,56 38,60 52,44 66,34 80,18 94,8 94,76"
                fill="url(#v2area)"/>
              {/* Last point dot */}
              <circle cx="94" cy="8" r="4" fill="#4ade80" style={{filter:"drop-shadow(0 0 6px rgba(74,222,128,.7))",animation:"expBounce .4s ease 1.1s both",opacity:0}}/>
              {/* "▲" label */}
              <text x="90" y="20" fontSize="8" fill="#4ade80" textAnchor="middle" fontWeight="bold"
                style={{animation:"expFadeUp .4s ease 1.2s both",opacity:0}}>▲</text>
            </svg>
          </div>
          {/* Bull silhouette stamp */}
          <div className="absolute top-14 right-4 pointer-events-none opacity-10">
            <svg width="48" height="40" viewBox="0 0 48 40" fill="#22c55e">
              <path d="M4 36 Q4 24 12 20 Q8 16 8 10 Q12 6 16 10 Q18 6 22 8 L24 4 L26 8 Q30 6 32 10 Q36 6 40 10 Q40 16 36 20 Q44 24 44 36 Q36 38 24 38 Q12 38 4 36 Z"/>
              <path d="M8 10 Q6 4 4 2"/><path d="M40 10 Q42 4 44 2"/>
            </svg>
          </div>
          <FU delay={1.1} size={10} color="#4ade80" weight={700} lsp="0.32em" upper>{add?"New Entry":"Updated"}</FU>
          <FU delay={1.25} size={19} color="#fff" weight={800} mt={6} mb={5}>{add?"Expense Logged! 📈":"Record Updated! ✅"}</FU>
          <FU delay={1.4} color="rgba(134,239,172,.7)" mb={24}>{add?"Added to the trip expense report — markets look good!":"Expense figures have been revised and filed."}</FU>
          <Btn delay={1.55} label={add?"📊 Bullish!":"✅ Confirmed!"} bg="linear-gradient(90deg,#15803d,#16a34a,#22c55e)" shadow="0 8px 26px rgba(22,163,74,.45)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   VARIANT 3 — RECEIPT PRINT
   Dark warm · thermal printer + paper rolls out · ink lines appear
══════════════════════════════════════════════════════════════════════════════ */
function V3ReceiptPrint({action,onClose}){
  const add = action !== "edit";
  const lines=[
    {w:"70%",d:.7},{w:"55%",d:.85},{w:"80%",d:1.0},{w:"45%",d:1.15},{w:"90%",d:1.3},
  ];
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{background:"rgba(6,5,4,.96)"}} onClick={onClose}>
      {/* Warm vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{background:"radial-gradient(ellipse at 50% 40%,rgba(120,80,30,.06),transparent 70%)"}}/>
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{background:"linear-gradient(145deg,#160f06,#1e1409)",border:"1px solid rgba(217,119,6,.35)",
          boxShadow:"0 28px 70px rgba(0,0,0,.92),0 0 50px rgba(180,83,9,.12)",
          animation:"expCardLand .8s cubic-bezier(.3,1.4,.6,1) both",opacity:0}}
        onClick={e=>e.stopPropagation()}>
        <div style={{height:3,background:"linear-gradient(90deg,#92400e,#d97706,#fbbf24,#d97706)"}}/>
        <div className="px-7 py-8 text-center">
          {/* Printer + Receipt SVG */}
          <div className="mx-auto mb-5 flex items-center justify-center relative"
            style={{width:100,height:96}}>
            {/* Printer body */}
            <div className="absolute top-0 left-1/2" style={{transform:"translateX(-50%)",
              animation:"expBounce .6s cubic-bezier(.34,1.4,.64,1) .2s both",opacity:0}}>
              <svg width="80" height="48" viewBox="0 0 80 48">
                <defs>
                  <linearGradient id="v3printer" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#292524"/><stop offset="100%" stopColor="#1c1917"/>
                  </linearGradient>
                </defs>
                <rect x="4" y="10" width="72" height="34" rx="6" fill="url(#v3printer)" style={{filter:"drop-shadow(0 4px 12px rgba(0,0,0,.5))"}}/>
                <rect x="4" y="10" width="72" height="12" rx="6" fill="#3c3330"/>
                {/* Indicator light */}
                <circle cx="60" cy="16" r="4" fill="rgba(34,197,94,.8)"
                  style={{animation:"expPrinterLight 1s ease-in-out infinite"}}/>
                {/* Paper slot */}
                <rect x="16" y="22" width="48" height="4" rx="2" fill="#0a0908"/>
                {/* Brand mark */}
                <text x="30" y="37" fontSize="7" fill="rgba(255,255,255,.2)" fontWeight="bold" letterSpacing="1">SYNCETRA</text>
                {/* Buttons */}
                {[52,60,68].map(x=>(
                  <rect key={x} x={x} y="30" width="8" height="5" rx="1.5" fill="#0a0908"/>
                ))}
              </svg>
            </div>
            {/* Receipt paper rolling out */}
            <div className="absolute overflow-hidden" style={{top:32,left:"50%",transform:"translateX(-50%)",width:52,
              animation:"expPaperPull .7s cubic-bezier(.34,1,.64,1) .5s both",opacity:0}}>
              <svg width="52" height="80" viewBox="0 0 52 80">
                <defs>
                  <linearGradient id="v3paper" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fef9f0"/><stop offset="100%" stopColor="#fef3e2"/>
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="52" height="80" fill="url(#v3paper)"/>
                {/* Perforated top edge */}
                {Array.from({length:10},(_,i)=>(
                  <circle key={i} cx={4+i*5} cy="3" r="1.5" fill="rgba(0,0,0,.15)"/>
                ))}
                {/* Receipt lines */}
                <text x="26" y="14" fontSize="7" fill="#374151" textAnchor="middle" fontWeight="bold" letterSpacing="1">RECEIPT</text>
                <line x1="4" y1="18" x2="48" y2="18" stroke="rgba(0,0,0,.12)" strokeWidth="1"/>
                {[24,32,40,48].map((y,i)=>(
                  <g key={i} style={{animation:`expInkLine .4s ease ${.8+i*.15}s both`,opacity:0}}>
                    <rect x="4" y={y} width={20+i*4} height="4" rx="1" fill="rgba(55,65,81,.2)"/>
                    <rect x={38-i*2} y={y} width={10+i} height="4" rx="1" fill="rgba(55,65,81,.25)"/>
                  </g>
                ))}
                <line x1="4" y1="56" x2="48" y2="56" stroke="rgba(0,0,0,.12)" strokeWidth="1" strokeDasharray="4 2"/>
                {/* Total */}
                <text x="26" y="68" fontSize="9" fill="#059669" textAnchor="middle" fontWeight="bold"
                  style={{animation:"expFadeUp .4s ease 1.4s both",opacity:0}}>TOTAL ✓</text>
                {/* Wavy tear bottom */}
                <path d="M0 78 Q4 76 8 78 Q12 80 16 78 Q20 76 24 78 Q28 80 32 78 Q36 76 40 78 Q44 80 48 78 Q52 76 52 78 L52 80 L0 80 Z" fill="url(#v3paper)"/>
              </svg>
            </div>
          </div>
          <FU delay={1.5} size={10} color="#fbbf24" weight={700} lsp="0.32em" upper>Receipt {add?"Printed":"Revised"}</FU>
          <FU delay={1.65} size={19} color="#fff" weight={800} mt={6} mb={5}>{add?"Expense Filed! 🧾":"Receipt Updated! 📄"}</FU>
          <FU delay={1.8} color="rgba(253,230,138,.7)" mb={24}>{add?"Your expense receipt has been printed and saved.":"The receipt has been updated in the records."}</FU>
          <Btn delay={1.95} label={add?"🧾 Filed Away!":"✏️ Updated!"} bg="linear-gradient(90deg,#b45309,#d97706)" shadow="0 8px 26px rgba(180,83,9,.45)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   VARIANT 4 — CRYPTO BLOCK
   Dark tech orange · Bitcoin coin flips · blockchain hex connects · neon
══════════════════════════════════════════════════════════════════════════════ */
function V4CryptoBlock({action,onClose}){
  const add = action !== "edit";
  const hexPts = [[50,12],[78,28],[78,60],[50,76],[22,60],[22,28]];
  const hexStr = hexPts.map(([x,y])=>`${x},${y}`).join(" ");
  const blocks=[
    {x:8,y:8,c:"rgba(249,115,22,.2)"},{x:72,y:8,c:"rgba(249,115,22,.15)"},
    {x:8,y:70,c:"rgba(249,115,22,.15)"},{x:72,y:70,c:"rgba(249,115,22,.2)"},
  ];
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{background:"linear-gradient(160deg,#0a0500,#150a00,#0d0600)"}} onClick={onClose}>
      {/* Hex grid bg */}
      <div className="absolute inset-0 pointer-events-none" style={{opacity:.05,
        backgroundImage:`url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="60" height="52"><path d="M30 0L60 17.3L60 34.6L30 52L0 34.6L0 17.3Z" fill="none" stroke="#f97316" stroke-width="0.5"/></svg>')}")`,
        backgroundSize:"60px 52px"}}/>
      {/* Floating blockchain blocks */}
      {blocks.map((b,i)=>(
        <div key={i} className="absolute pointer-events-none rounded"
          style={{left:`${b.x}%`,top:`${b.y}%`,width:40,height:28,
            background:b.c,border:"1px solid rgba(249,115,22,.25)",
            animation:`expStar ${2.5+i*.3}s ease-in-out ${i*.5}s infinite`}}>
          <div style={{fontSize:8,color:"rgba(249,115,22,.6)",padding:"4px",fontFamily:"monospace",lineHeight:1.2}}>
            0x{(Math.random()*0xFFFF|0).toString(16).padStart(4,"0")}</div>
        </div>
      ))}
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{background:"linear-gradient(145deg,#160800,#200d00)",border:"1px solid rgba(249,115,22,.4)",
          boxShadow:"0 28px 70px rgba(0,0,0,.92),0 0 55px rgba(249,115,22,.15)",
          animation:"expFlip .85s cubic-bezier(.2,1.2,.5,1) .3s both",opacity:0}}
        onClick={e=>e.stopPropagation()}>
        <div style={{height:3,background:"linear-gradient(90deg,#c2410c,#ea580c,#f97316,#fb923c)"}}/>
        <div className="px-7 py-8 text-center">
          {/* Bitcoin hex SVG */}
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{width:90,height:90,animation:"expCoinSpin .9s cubic-bezier(.34,1.2,.64,1) .4s both",opacity:0}}>
            <svg width="90" height="90" viewBox="0 0 100 90">
              <defs>
                <linearGradient id="v4bitcoin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb923c"/><stop offset="50%" stopColor="#f97316"/><stop offset="100%" stopColor="#c2410c"/>
                </linearGradient>
                <radialGradient id="v4shine" cx="35%" cy="30%" r="45%">
                  <stop offset="0%" stopColor="rgba(255,255,255,.3)"/><stop offset="100%" stopColor="transparent"/>
                </radialGradient>
              </defs>
              {/* Hex outline connections */}
              {hexPts.map((_,i)=>{
                if(i===hexPts.length-1)return null;
                return <line key={i} x1={hexPts[i][0]} y1={hexPts[i][1]} x2={hexPts[i+1][0]} y2={hexPts[i+1][1]}
                  stroke="rgba(249,115,22,.4)" strokeWidth="1.5" strokeDasharray="50"
                  style={{animation:`expHexConnect .4s ease ${.8+i*.1}s both`,strokeDashoffset:50,opacity:0}}/>;
              })}
              <line x1={hexPts[5][0]} y1={hexPts[5][1]} x2={hexPts[0][0]} y2={hexPts[0][1]}
                stroke="rgba(249,115,22,.4)" strokeWidth="1.5" strokeDasharray="50"
                style={{animation:"expHexConnect .4s ease 1.3s both",strokeDashoffset:50,opacity:0}}/>
              {/* Hex nodes */}
              {hexPts.map(([x,y],i)=>(
                <circle key={i} cx={x} cy={y} r="4" fill="#f97316"
                  style={{animation:`expBlockPop .35s ease ${.85+i*.1}s both`,opacity:0}}/>
              ))}
              {/* Central coin */}
              <circle cx="50" cy="44" r="26" fill="url(#v4bitcoin)"
                style={{filter:"drop-shadow(0 0 12px rgba(249,115,22,.5))"}}/>
              <circle cx="50" cy="44" r="26" fill="url(#v4shine)"/>
              <circle cx="50" cy="44" r="22" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1.5"/>
              {/* ₿ symbol */}
              <text x="50" y="52" fontSize="22" fill="rgba(255,255,255,.92)" textAnchor="middle" fontWeight="900">₿</text>
            </svg>
          </div>
          {[0,.5,1].map((d,i)=>(
            <div key={i} className="absolute pointer-events-none" style={{
              borderRadius:"50%",border:`1.5px solid rgba(249,115,22,${.4-i*.1})`,
              inset:`calc(50% - ${30+i*9}px)`,animation:`expRipple 2.3s ease-out ${1.1+d}s infinite`}}/>
          ))}
          <FU delay={1.05} size={10} color="#fb923c" weight={700} lsp="0.32em" upper>Block {add?"Mined":"Updated"}</FU>
          <FU delay={1.2} size={19} color="#fff" weight={800} mt={6} mb={5}>{add?"Transaction Confirmed! ₿":"Record Updated! 🔗"}</FU>
          <FU delay={1.35} color="rgba(253,186,116,.7)" mb={24}>{add?"Expense block has been added to the ledger chain.":"The transaction record has been modified."}</FU>
          <Btn delay={1.5} label={add?"⛏️ Block Mined!":"🔗 Chained!"} bg="linear-gradient(90deg,#c2410c,#ea580c,#f97316)" shadow="0 8px 26px rgba(234,88,12,.48)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   VARIANT 5 — COIN SHOWER
   Purple celebration · coins rain down · bouncing money bag · festive
══════════════════════════════════════════════════════════════════════════════ */
function V5CoinShower({action,onClose}){
  const add = action !== "edit";
  const drops = Array.from({length:18},(_,i)=>({
    x:4+i*5.5, a:`${(i*53)%360}deg`, ty:`${40+i%4*15}px`,
    delay:`${(i*.08).toFixed(2)}s`, size:i%3===0?20:i%3===1?16:14, gold:i%3!==2
  }));
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{background:"linear-gradient(160deg,#080010,#100018,#060010)"}} onClick={onClose}>
      {/* Stars */}
      {STARS.slice(0,16).map((s,i)=>(
        <div key={i} className="absolute rounded-full pointer-events-none"
          style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size*.8,height:s.size*.8,
            background:i%3===0?"#fbbf24":i%3===1?"#a78bfa":"#fff",opacity:.5,
            animation:`expStar ${s.dur} ease-in-out ${s.delay} infinite`}}/>
      ))}
      {/* Coin rain */}
      {drops.map((c,i)=>(
        <div key={i} className="absolute pointer-events-none"
          style={{left:`${c.x}%`,top:"8%","--a":c.a,"--ty":c.ty,
            animation:`expCoinDrop .8s cubic-bezier(.34,1,.64,1) ${c.delay} both`,opacity:0}}>
          <svg width={c.size} height={c.size*.6} viewBox="0 0 20 12">
            <defs>
              <linearGradient id={`vc5${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.gold?"#fbbf24":"#c084fc"}/>
                <stop offset="100%" stopColor={c.gold?"#d97706":"#9333ea"}/>
              </linearGradient>
            </defs>
            <ellipse cx="10" cy="6" rx="10" ry="6" fill={`url(#vc5${i})`}/>
            <ellipse cx="10" cy="5" rx="10" ry="6" fill={`url(#vc5${i})`}/>
            <ellipse cx="10" cy="5" rx="7" ry="4" fill="rgba(255,255,255,.18)"/>
          </svg>
        </div>
      ))}
      {/* Sparkle bursts */}
      {[[15,25],[80,30],[50,15],[30,40],[70,20]].map(([x,y],i)=>(
        <div key={i} className="absolute pointer-events-none text-lg"
          style={{left:`${x}%`,top:`${y}%`,
            animation:`expSparkle 1.5s ease ${.3+i*.2}s infinite`}}>✦</div>
      ))}
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{background:"linear-gradient(145deg,#0e0020,#150030)",border:"1px solid rgba(167,139,250,.38)",
          boxShadow:"0 28px 70px rgba(0,0,0,.92),0 0 55px rgba(139,92,246,.15)",
          animation:"expCardSlide .75s cubic-bezier(.3,1.3,.6,1) .25s both",opacity:0}}
        onClick={e=>e.stopPropagation()}>
        <div style={{height:3,background:"linear-gradient(90deg,#7c3aed,#a78bfa,#fbbf24,#a78bfa,#7c3aed)"}}/>
        <div className="px-7 py-8 text-center">
          {/* Money bag */}
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{width:80,height:90,animation:"expBagBounce .75s cubic-bezier(.34,1.5,.64,1) .3s both",opacity:0}}>
            <svg width="80" height="90" viewBox="0 0 80 90">
              <defs>
                <linearGradient id="v5bag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa"/><stop offset="60%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#5b21b6"/>
                </linearGradient>
                <linearGradient id="v5shine" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,.25)"/><stop offset="60%" stopColor="transparent"/>
                </linearGradient>
              </defs>
              <ellipse cx="40" cy="88" rx="24" ry="3" fill="rgba(0,0,0,.35)"/>
              {/* Bag knot/tie */}
              <ellipse cx="40" cy="24" rx="14" ry="8" fill="#6d28d9"/>
              <path d="M30 22 Q40 16 50 22 Q40 28 30 22 Z" fill="#5b21b6"/>
              {/* String/twist */}
              <path d="M34 20 Q40 14 46 20" fill="none" stroke="#4c1d95" strokeWidth="3" strokeLinecap="round"/>
              {/* Bag body */}
              <ellipse cx="40" cy="58" rx="30" ry="32" fill="url(#v5bag)"
                style={{filter:"drop-shadow(0 6px 18px rgba(124,58,237,.45))"}}/>
              <ellipse cx="40" cy="58" rx="30" ry="32" fill="url(#v5shine)"/>
              {/* Dollar sign */}
              <text x="40" y="68" fontSize="30" fill="rgba(255,255,255,.9)" textAnchor="middle" fontWeight="900"
                style={{animation:"expFadeUp .4s ease .8s both",opacity:0}}>$</text>
              {/* Coin rim detail */}
              <ellipse cx="40" cy="30" rx="12" ry="4" fill="#4c1d95"/>
              <g style={{animation:"expSackSwing 2s ease-in-out 1s infinite",transformOrigin:"40px 30px"}}>
                <line x1="40" y1="30" x2="40" y2="16" stroke="#5b21b6" strokeWidth="4" strokeLinecap="round"/>
                <circle cx="40" cy="14" r="5" fill="#6d28d9" stroke="#a78bfa" strokeWidth="1.5"/>
              </g>
            </svg>
          </div>
          <FU delay={1.0} size={10} color="#a78bfa" weight={700} lsp="0.32em" upper>Funds {add?"Added":"Updated"}</FU>
          <FU delay={1.15} size={19} color="#fff" weight={800} mt={6} mb={5}>{add?"Cha-Ching! 🪙":"Updated! 💜"}</FU>
          <FU delay={1.3} color="rgba(196,181,253,.72)" mb={24}>{add?"Your expense has been logged and the bag is heavy!":"The expense entry has been successfully revised."}</FU>
          <Btn delay={1.45} label={add?"💰 Money Logged!":"✨ All Good!"} bg="linear-gradient(90deg,#7c3aed,#6d28d9)" shadow="0 8px 26px rgba(124,58,237,.48)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   VARIANT 6 — DIAMOND LEDGER
   Near-black premium · crystal diamond with prism refraction · white/cyan
══════════════════════════════════════════════════════════════════════════════ */
function V6DiamondLedger({action,onClose}){
  const add = action !== "edit";
  const sparkles=[{x:30,y:22,d:.8},{x:66,y:18,d:1.0},{x:20,y:50,d:1.2},{x:72,y:46,d:.9},{x:48,y:14,d:1.1}];
  const ledgerLines=[{w:"68%",d:1.3},{w:"52%",d:1.45},{w:"80%",d:1.6},{w:"40%",d:1.75}];
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{background:"linear-gradient(160deg,#020408,#030610,#020308)"}} onClick={onClose}>
      {/* Stars */}
      {STARS.slice(0,20).map((s,i)=>(
        <div key={i} className="absolute rounded-full bg-white pointer-events-none"
          style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size*.65,height:s.size*.65,
            animation:`expStar ${s.dur} ease-in-out ${s.delay} infinite`}}/>
      ))}
      {/* Prism rainbow refraction lines */}
      {["rgba(239,68,68,.12)","rgba(234,179,8,.1)","rgba(34,197,94,.1)","rgba(6,182,212,.12)","rgba(139,92,246,.1)"].map((c,i)=>(
        <div key={i} className="absolute pointer-events-none"
          style={{top:"35%",left:0,right:0,height:"3px",
            background:c,filter:"blur(4px)",
            transform:`translateY(${i*8}px) skewX(-20deg)`,
            animation:`expStar ${2+i*.4}s ease-in-out ${i*.3}s infinite`}}/>
      ))}
      {/* Sparkle bursts */}
      {sparkles.map((sp,i)=>(
        <div key={i} className="absolute pointer-events-none text-white"
          style={{left:`${sp.x}%`,top:`${sp.y}%`,fontSize:10,
            animation:`expSparkle 2s ease-in-out ${sp.d}s infinite`}}>✦</div>
      ))}
      <button className="absolute inset-0" onClick={onClose}/>
      <div className="relative w-full max-w-[338px] rounded-2xl overflow-hidden"
        style={{background:"linear-gradient(145deg,#060a12,#080e1c)",border:"1px solid rgba(186,230,253,.22)",
          boxShadow:"0 28px 70px rgba(0,0,0,.94),0 0 60px rgba(6,182,212,.1),inset 0 1px 0 rgba(255,255,255,.05)",
          animation:"expCardLand .85s cubic-bezier(.3,1.4,.6,1) .3s both",opacity:0}}
        onClick={e=>e.stopPropagation()}>
        <div style={{height:3,background:"linear-gradient(90deg,#0ea5e9,#38bdf8,#e0f2fe,#38bdf8,#0ea5e9)",backgroundSize:"200%"}}/>
        <div className="px-7 py-8 text-center">
          {/* Diamond SVG */}
          <div className="mx-auto mb-5 flex items-center justify-center"
            style={{width:88,height:80,animation:"expDiamondIn .8s cubic-bezier(.34,1.5,.64,1) .4s both",opacity:0}}>
            <svg width="88" height="80" viewBox="0 0 88 80">
              <defs>
                <linearGradient id="v6top" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e0f2fe"/><stop offset="100%" stopColor="#7dd3fc"/>
                </linearGradient>
                <linearGradient id="v6left" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38bdf8"/><stop offset="100%" stopColor="#0ea5e9"/>
                </linearGradient>
                <linearGradient id="v6right" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0284c7"/><stop offset="100%" stopColor="#0369a1"/>
                </linearGradient>
                <linearGradient id="v6bottom" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9"/><stop offset="100%" stopColor="#075985"/>
                </linearGradient>
              </defs>
              {/* Shadow */}
              <ellipse cx="44" cy="78" rx="30" ry="4" fill="rgba(6,182,212,.2)"/>
              {/* Diamond facets */}
              {/* Top face */}
              <polygon points="44,4 24,28 44,22 64,28" fill="url(#v6top)"
                style={{filter:"drop-shadow(0 0 8px rgba(56,189,248,.4))"}}/>
              {/* Left crown facets */}
              <polygon points="4,28 24,28 44,22 28,8" fill="url(#v6left)"/>
              <polygon points="4,28 24,28 44,22" fill="rgba(56,189,248,.4)"/>
              {/* Right crown facets */}
              <polygon points="84,28 64,28 44,22 60,8" fill="url(#v6right)"/>
              {/* Left pavilion */}
              <polygon points="4,28 24,28 44,74" fill="url(#v6bottom)"/>
              <polygon points="4,28 24,28 44,74" fill="rgba(255,255,255,.08)"/>
              {/* Right pavilion */}
              <polygon points="84,28 64,28 44,74" fill="url(#v6right)" opacity=".8"/>
              {/* Center pavilion */}
              <polygon points="24,28 44,28 44,74" fill="rgba(56,189,248,.35)"/>
              <polygon points="44,28 64,28 44,74" fill="rgba(14,165,233,.25)"/>
              {/* Top center */}
              <polygon points="44,22 24,28 64,28" fill="rgba(255,255,255,.18)"/>
              {/* Inner sparkle lines */}
              {[{x1:44,y1:22,x2:24,y2:48},{x1:44,y1:22,x2:64,y2:48},{x1:44,y1:22,x2:44,y2:74}].map((l,i)=>(
                <line key={i} {...l} stroke="rgba(255,255,255,.12)" strokeWidth="1"/>
              ))}
              {/* Top highlight */}
              <polygon points="44,10 36,24 52,24" fill="rgba(255,255,255,.35)"/>
            </svg>
          </div>
          {[0,.5,1].map((d,i)=>(
            <div key={i} className="absolute pointer-events-none" style={{
              borderRadius:"50%",border:`1.5px solid rgba(56,189,248,${.35-i*.1})`,
              inset:`calc(50% - ${30+i*9}px)`,animation:`expRipple 2.5s ease-out ${1.2+d}s infinite`}}/>
          ))}
          <FU delay={1.1} size={10} color="#38bdf8" weight={700} lsp="0.32em" upper>Ledger {add?"Entry Added":"Entry Revised"}</FU>
          <FU delay={1.25} size={19} color="#fff" weight={800} mt={6} mb={5}>{add?"Premium Recorded! 💎":"Entry Polished! ✦"}</FU>
          {/* Mini ledger lines */}
          <div className="mb-5">
            {ledgerLines.map((l,i)=>(
              <div key={i} className="flex justify-between items-center mb-1.5 overflow-hidden">
                <div style={{height:6,borderRadius:3,background:"rgba(56,189,248,.18)",
                  animation:`expInkLine .4s ease ${l.d}s both`,opacity:0,"--w":l.w}} className="flex-1 mr-2"/>
                <div style={{height:6,width:36,borderRadius:3,background:`rgba(56,189,248,${.25+i*.05})`,
                  animation:`expFadeUp .4s ease ${l.d}s both`,opacity:0}}/>
              </div>
            ))}
          </div>
          <Btn delay={1.9} label={add?"💎 Logged!":"✦ Updated!"} bg="linear-gradient(90deg,#0284c7,#0369a1)" shadow="0 8px 26px rgba(2,132,199,.48)" onClose={onClose}/>
        </div>
      </div>
    </div>, document.body
  );
}

/* ─── Variant registry ─────────────────────────────────────────────────────── */
const VARIANTS = [
  {
    id:"v1", name:"Gold Vault",
    desc:"Bank vault swings open with spinning lock wheel and tumbling gold coins",
    accent:"#f59e0b", accentBg:"rgba(245,158,11,.08)", border:"rgba(245,158,11,.3)",
    tags:["Vault","Gold","Coins"], Component:V1GoldVault,
  },
  {
    id:"v2", name:"Bull Market",
    desc:"Stock ticker tape + animated chart bars rising with a bull silhouette",
    accent:"#22c55e", accentBg:"rgba(34,197,94,.08)", border:"rgba(34,197,94,.3)",
    tags:["Finance","Chart","Green"], Component:V2BullMarket,
  },
  {
    id:"v3", name:"Receipt Print",
    desc:"Thermal printer rolls out a receipt with line-by-line ink animation",
    accent:"#d97706", accentBg:"rgba(217,119,6,.08)", border:"rgba(217,119,6,.3)",
    tags:["Receipt","Warm","Printer"], Component:V3ReceiptPrint,
  },
  {
    id:"v4", name:"Crypto Block",
    desc:"Bitcoin coin flips into view with a blockchain hex network connecting around it",
    accent:"#f97316", accentBg:"rgba(249,115,22,.08)", border:"rgba(249,115,22,.3)",
    tags:["Crypto","Hex","Orange"], Component:V4CryptoBlock,
  },
  {
    id:"v5", name:"Coin Shower",
    desc:"Gold and purple coins rain from above into a large bouncing money bag",
    accent:"#a78bfa", accentBg:"rgba(167,139,250,.08)", border:"rgba(167,139,250,.3)",
    tags:["Purple","Festive","Coins"], Component:V5CoinShower,
  },
  {
    id:"v6", name:"Diamond Ledger",
    desc:"Ultra-premium dark theme with a crystal diamond and prism light effects",
    accent:"#38bdf8", accentBg:"rgba(56,189,248,.08)", border:"rgba(56,189,248,.3)",
    tags:["Premium","Diamond","Cyan"], Component:V6DiamondLedger,
  },
];

/* ─── Preview page ─────────────────────────────────────────────────────────── */
export default function ExpenseVariantsPreview() {
  useKF();
  const [active, setActive] = useState(null);

  return (
    <div className="min-h-screen bg-[#060a10] px-4 py-10">
      {active && <active.Component action={active.action} onClose={() => setActive(null)} />}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest border border-emerald-700/40 bg-emerald-900/20 text-emerald-400 mb-4">
            Expense Popup Variants
          </span>
          <h1 className="text-3xl font-extrabold text-white mb-3">Choose Your Style</h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Click "Preview Add" or "Preview Edit" to see each design full-screen. Tell me which one you want!
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {VARIANTS.map((v, i) => (
            <div key={v.id} className="rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02]"
              style={{background:"linear-gradient(145deg,#0d1117,#111820)", borderColor:v.border,
                boxShadow:"0 4px 24px rgba(0,0,0,.4)",
                animation:`expFadeUp .5s ease ${i*.08}s both`,opacity:0}}>
              <div style={{height:3, background:`linear-gradient(90deg,${v.accent},${v.accent}88)`}}/>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                    style={{background:v.accentBg, border:`1px solid ${v.border}`, color:v.accent}}>
                    {i+1}
                  </div>
                  <p className="font-bold text-white text-sm">{v.name}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {v.tags.map(t=>(
                    <span key={t} className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{background:v.accentBg, color:v.accent, border:`1px solid ${v.border}`}}>
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-[12px] text-slate-400 leading-relaxed mb-4">{v.desc}</p>
                <div className="flex gap-2">
                  <button onClick={() => setActive({Component:v.Component,action:"add"})}
                    className="flex-1 py-2 rounded-xl text-xs font-bold"
                    style={{background:v.accentBg, border:`1px solid ${v.border}`, color:v.accent}}>
                    ▶ Preview Add
                  </button>
                  <button onClick={() => setActive({Component:v.Component,action:"edit"})}
                    className="flex-1 py-2 rounded-xl text-xs font-bold"
                    style={{background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)", color:"#94a3b8"}}>
                    ✏️ Preview Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-600 text-xs mt-10">
          Pick a number (1–6) and I'll wire it into the expense master right away.
        </p>
      </div>
    </div>
  );
}
