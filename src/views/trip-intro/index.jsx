import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LOGO_FULL } from "../../components/brand/SyncetraLogo";

const GOLD      = "#f59e0b";
const TS_SHADOW = "0 0 0 3px rgba(0,0,0,.5),0 2px 10px rgba(0,0,0,1),0 0 50px rgba(0,0,0,1),0 0 100px rgba(0,0,0,.95)";

/* ─── Storage ────────────────────────────────────────────────── */
function getActiveTripFromStorage() {
  try {
    const raw  = localStorage.getItem("GROUP_ALARM_USER");
    const user = raw ? JSON.parse(raw) : null;
    const uid  = user?.user?._id ?? user?.user?.id;
    if (!uid) return null;
    const cached = localStorage.getItem(`syncetra_trips_${uid}`);
    const trips  = cached ? JSON.parse(cached) : [];
    if (!trips.length) return null;

    const now = Date.now();

    // 1. Explicit "active" status (highest priority)
    const byStatus = trips.find((t) => t.status === "active");
    if (byStatus) return byStatus;

    // 2. Currently within date range (live by date)
    const liveByDate = trips.find((t) => {
      const s = t.startDate ? new Date(t.startDate).getTime() : 0;
      const e = t.endDate   ? new Date(t.endDate).getTime()   : Infinity;
      return now >= s && now <= e;
    });
    if (liveByDate) return liveByDate;

    // 3. Nearest upcoming trip (starts in the future)
    const upcoming = trips
      .filter((t) => t.startDate && new Date(t.startDate).getTime() > now)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    if (upcoming.length) return upcoming[0];

    // 4. Any non-completed trip
    const nonCompleted = trips.find(
      (t) => t.status !== "completed" && t.status !== "done"
    );
    if (nonCompleted) return nonCompleted;

    // 5. Last resort — whatever is first (still better than nothing)
    return trips[0] || null;
  } catch { return null; }
}

function calcCountdown(trip) {
  if (!trip?.startDate) return { status: "none" };
  const now   = Date.now();
  const start = new Date(trip.startDate).getTime();
  const end   = trip.endDate ? new Date(trip.endDate).getTime() : Infinity;
  if (now > end)    return { status: "done" };
  if (now >= start) return { status: "live" };
  const diff = start - now;
  return {
    status: "countdown",
    days:  Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins:  Math.floor((diff % 3600000)  / 60000),
    secs:  Math.floor((diff % 60000)    / 1000),
  };
}
const pad = (n) => String(n).padStart(2, "0");

/* ─── Keyframes ──────────────────────────────────────────────── */
const KF = `
@keyframes ti-shimmer{0%{background-position:220% center}100%{background-position:-220% center}}
@keyframes ti-scanmove{0%{opacity:.7}100%{opacity:.7}}
@keyframes ti-sparkle{0%{opacity:0;transform:scale(0) rotate(0deg)}20%{opacity:1;transform:scale(1.5) rotate(40deg)}65%{opacity:.7;transform:scale(.9) rotate(90deg)}100%{opacity:0;transform:scale(0) rotate(200deg)}}

/* ══ TEXT STAMP — fly in from each screen edge, slam+bounce ════ */
@keyframes ti-text-T{
  0%  {opacity:0;transform:translateY(-120vh) rotate(-7deg) scale(.6)}
  54% {opacity:1;transform:translateY(12px)  rotate(1.4deg) scale(1.10)}
  71% {transform:translateY(-6px) rotate(-.7deg) scale(.95)}
  86% {transform:translateY(3px) rotate(.2deg) scale(1.02)}
  100%{opacity:1;transform:translateY(0) rotate(0deg) scale(1)}
}
@keyframes ti-text-L{
  0%  {opacity:0;transform:translateX(-120vw) rotate(7deg) scale(.6)}
  54% {opacity:1;transform:translateX(14px)  rotate(-1.4deg) scale(1.10)}
  71% {transform:translateX(-7px) rotate(.7deg) scale(.95)}
  86% {transform:translateX(4px) rotate(-.2deg) scale(1.02)}
  100%{opacity:1;transform:translateX(0) rotate(0deg) scale(1)}
}
@keyframes ti-text-R{
  0%  {opacity:0;transform:translateX(120vw) rotate(-7deg) scale(.6)}
  54% {opacity:1;transform:translateX(-14px) rotate(1.4deg) scale(1.10)}
  71% {transform:translateX(7px) rotate(-.7deg) scale(.95)}
  86% {transform:translateX(-4px) rotate(.2deg) scale(1.02)}
  100%{opacity:1;transform:translateX(0) rotate(0deg) scale(1)}
}
@keyframes ti-text-B{
  0%  {opacity:0;transform:translateY(120vh) rotate(7deg) scale(.6)}
  54% {opacity:1;transform:translateY(-14px) rotate(-1.6deg) scale(1.12)}
  71% {transform:translateY(7px) rotate(.8deg) scale(.94)}
  86% {transform:translateY(-3px) rotate(-.2deg) scale(1.02)}
  100%{opacity:1;transform:translateY(0) rotate(0deg) scale(1)}
}

/* ══ TEXT STAMP SPARKLE ════════════════════════════════════════
   IMPORTANT: starts at opacity:0 + scale:0 so dots are invisible
   while waiting (during animation-delay). They pop visible only
   at the moment of impact and fly outward instantly.              */
@keyframes ti-text-spark{
  0%  {opacity:0;transform:translateY(0) scale(0)}
  8%  {opacity:1;transform:translateY(-8px) scale(1.7)}
  35% {opacity:1;transform:translateY(-26px) scale(1)}
  68% {opacity:.5;transform:translateY(-42px) scale(.48)}
  100%{opacity:0;transform:translateY(-60px) scale(.05)}
}
@keyframes ti-ghost-in{0%{opacity:0;transform:scale(1.14)}100%{opacity:1;transform:scale(1)}}
@keyframes ti-fadeup{0%{opacity:0;transform:translateY(22px)}100%{opacity:1;transform:translateY(0)}}
@keyframes ti-fadein{0%{opacity:0}100%{opacity:1}}
@keyframes ti-live-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.65)}}
@keyframes ti-curtain-t{0%{transform:scaleY(1)}100%{transform:scaleY(0)}}
@keyframes ti-curtain-b{0%{transform:scaleY(1)}100%{transform:scaleY(0)}}
@keyframes ti-aura-pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:.85;transform:scale(1.08)}}

/* ══ SPINNING ENTRANCE — 4 directions ══════════════════════════
   Each box flies in while spinning on the Z-axis.
   On arrival it overshoots (rotation wobble) then settles to 0°.
═══════════════════════════════════════════════════════════════ */
@keyframes ti-spin-in-L{
  0%  {opacity:0;transform:translateX(-150vw) rotate(-600deg) scale(.18)}
  52% {opacity:1;transform:translateX(18px)   rotate(-22deg)  scale(1.18)}
  70% {transform:translateX(-9px) rotate(8deg)  scale(.90)}
  84% {transform:translateX(5px)  rotate(-3deg) scale(1.04)}
  100%{opacity:1;transform:translateX(0) rotate(0deg) scale(1)}
}
@keyframes ti-spin-in-T{
  0%  {opacity:0;transform:translateY(-150vh) rotate(600deg)  scale(.18)}
  52% {opacity:1;transform:translateY(18px)   rotate(22deg)   scale(1.18)}
  70% {transform:translateY(-9px) rotate(-8deg) scale(.90)}
  84% {transform:translateY(5px)  rotate(3deg)  scale(1.04)}
  100%{opacity:1;transform:translateY(0) rotate(0deg) scale(1)}
}
@keyframes ti-spin-in-R{
  0%  {opacity:0;transform:translateX(150vw)  rotate(600deg)  scale(.18)}
  52% {opacity:1;transform:translateX(-18px)  rotate(22deg)   scale(1.18)}
  70% {transform:translateX(9px)  rotate(-8deg) scale(.90)}
  84% {transform:translateX(-5px) rotate(3deg)  scale(1.04)}
  100%{opacity:1;transform:translateX(0) rotate(0deg) scale(1)}
}
/* SECS — biggest spin, comes from below */
@keyframes ti-spin-in-B{
  0%  {opacity:0;transform:translateY(150vh) rotate(-900deg) scale(.14)}
  48% {opacity:1;transform:translateY(-26px)  rotate(-30deg)  scale(1.26)}
  66% {transform:translateY(14px)  rotate(12deg)  scale(.86)}
  81% {transform:translateY(-8px)  rotate(-4deg)  scale(1.07)}
  100%{opacity:1;transform:translateY(0) rotate(0deg) scale(1)}
}

/* ══ IMPACT — spark shoots outward, arcs back like real metal sparks
   Parent div is rotated to set direction. translateY in that space
   = forward motion. The arc back (gravity) is the return positive Y. ══ */
@keyframes ti-spark-shoot{
  0%  {opacity:0;transform:translateY(0) scaleY(1.4) scaleX(1)}
  8%  {opacity:1;transform:translateY(-18px) scaleY(1.2) scaleX(.9)}
  22% {opacity:1;transform:translateY(-58px) scaleY(0.85) scaleX(.8)}
  55% {opacity:.8;transform:translateY(-28px) scaleY(.55) scaleX(.6)}
  82% {opacity:.4;transform:translateY(32px) scaleY(.32) scaleX(.4)}
  100%{opacity:0;transform:translateY(82px) scaleY(.08) scaleX(.2)}
}

/* ══ EMBER FALL — realistic drifting fire sparks falling after each tick
   They rotate as they fall (tumbling spark physics)                   ══ */
@keyframes ti-ember-L{
  0%  {opacity:1;transform:translate(0,-3px) rotate(-12deg) scaleY(1.6)}
  28% {opacity:.9;transform:translate(-9px,24px) rotate(22deg) scaleY(1.1)}
  62% {opacity:.65;transform:translate(-20px,58px) rotate(52deg) scaleY(.65)}
  100%{opacity:0;transform:translate(-33px,100px) rotate(88deg) scaleY(.1)}
}
@keyframes ti-ember-R{
  0%  {opacity:1;transform:translate(0,-3px) rotate(12deg) scaleY(1.6)}
  28% {opacity:.9;transform:translate(9px,24px) rotate(-22deg) scaleY(1.1)}
  62% {opacity:.65;transform:translate(20px,58px) rotate(-52deg) scaleY(.65)}
  100%{opacity:0;transform:translate(33px,100px) rotate(-88deg) scaleY(.1)}
}
@keyframes ti-ember-C{
  0%  {opacity:1;transform:translate(0,-3px) rotate(0deg) scaleY(1.6)}
  28% {opacity:.9;transform:translate(-4px,25px) rotate(14deg) scaleY(1.1)}
  62% {opacity:.65;transform:translate(6px,60px) rotate(-10deg) scaleY(.65)}
  100%{opacity:0;transform:translate(-2px,102px) rotate(22deg) scaleY(.1)}
}

/* ══ SECS glow — opacity-only so GPU composites, no repaint ══ */
@keyframes ti-sec-glow{
  0%  {opacity:0}
  14% {opacity:1}
  52% {opacity:.45}
  100%{opacity:0}
}
@keyframes ti-sec-grand{
  0%  {opacity:0}
  30% {opacity:1}
  70% {opacity:.5}
  100%{opacity:0}
}
@keyframes ti-digit-tick{
  0%  {transform:scaleY(.42);opacity:.28}
  52% {transform:scaleY(1.14);opacity:1}
  100%{transform:scaleY(1);opacity:1}
}
`;

/* ── Background ──────────────────────────────────────────────── */
const TripBg = memo(function TripBg({ img }) {
  return (
    <>
      {img ? (
        <div className="absolute inset-0" style={{
          backgroundImage:`url("${img}")`,backgroundSize:"cover",
          backgroundPosition:"center",transform:"scale(1.07)",filter:"saturate(1.08)",
        }}/>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-slate-950 to-black"/>
      )}
      <div className="absolute inset-0" style={{background:"linear-gradient(to bottom,rgba(0,0,0,.85) 0%,rgba(0,0,0,.06) 22%,rgba(0,0,0,.06) 62%,rgba(0,0,0,.96) 100%)"}}/>
      <div className="absolute inset-0" style={{background:"radial-gradient(ellipse 75% 62% at 50% 48%,rgba(0,0,0,.82) 0%,rgba(0,0,0,.56) 44%,rgba(0,0,0,.18) 70%,transparent 100%)"}}/>
    </>
  );
});

/* ── Ambient sparkles — appear after curtain opens ───────────── */
const Sparkles = memo(function Sparkles() {
  const C = ["#f59e0b","#fbbf24","#fde68a","#fffbeb","#fff"];
  return <>{[...Array(20)].map((_,i)=>{
    const c=C[i%C.length],sz=2+(i%4);
    return <div key={i} className="absolute pointer-events-none rounded-full" style={{
      width:sz,height:sz,left:`${(i*4.7+5)%92}%`,top:`${(i*6.3+7)%86}%`,
      background:c,boxShadow:`0 0 ${sz*3}px ${c}`,
      willChange:"transform, opacity",
      animation:`ti-sparkle ${1.4+(i%6)*.3}s ease-in-out ${3.2+(i%12)*.22}s infinite`,zIndex:6,
    }}/>;
  })}</>;
});

/* ── Curtains (stay closed during label phase, open at 2s) ──── */
const Curtains = memo(function Curtains() {
  const s={position:"absolute",left:0,right:0,background:"#000",zIndex:9,willChange:"transform"};
  return <>
    <div style={{...s,top:0,height:"52%",transformOrigin:"top",animation:"ti-curtain-t 1.15s cubic-bezier(.76,0,.24,1) 2.0s both"}}/>
    <div style={{...s,bottom:0,height:"52%",transformOrigin:"bottom",animation:"ti-curtain-b 1.15s cubic-bezier(.76,0,.24,1) 2.0s both"}}/>
  </>;
});

/* ────────────────────────────────────────────────────────────────
   COUNTDOWN BOX
   • Spins in from off-screen (Z-axis rotation, direction varies)
   • Impact: 20 elongated metal sparks burst outward on arrival
   • SECS: 18 realistic fire embers fall each second tick
──────────────────────────────────────────────────────────────── */
/* Spark colors — hot white core cooling to red */
const SPARK_HOT  = ["#ffffff","#fffde0","#ffee44","#ffaa00","#ff6600","#ff3300"];
/* Ember fall colors — typical wood-fire ember palette */
const EMBER_HOT  = ["#ffffff","#ffe066","#ff9900","#ff6600","#ff3300","#cc2200"];

const CdUnit = memo(function CdUnit({ val, label, delay=0, dir="L", isGrand=false, sparkTick=0 }) {
  const C = "#f59e0b";
  /* Impact sparks fire at ~52% of .98s anim = 0.51s after delay starts */
  const impactAt = delay + 0.51;

  return (
    <div style={{
      position:"relative", overflow:"visible",
      display:"flex", flexDirection:"column", alignItems:"center", gap:10,
      animation:`ti-spin-in-${dir} .98s cubic-bezier(.18,.85,.28,1) ${delay}s both`,
    }}>

      {/* ══ IMPACT SPARKS ═══════════════════════════════════════
          20 elongated trailing sparks burst outward at stamp time.
          Outer div: rotate to set launch angle.
          Inner div: elongated spark shape, ti-spark-shoot arcs it
          outward then lets gravity pull it back down.               */}
      {[...Array(20)].map((_,i)=>{
        const angle  = i * (360/20);
        const sc     = SPARK_HOT[i%SPARK_HOT.length];
        /* Vary spark size — some thin trailing sparks, some chunkier */
        const sw = 1.2 + (i%4)*.6;   /* width  1.2–3px */
        const sh = 10  + (i%6)*4;    /* height 10–34px */
        const dur= .6  + (i%5)*.1;
        const stg= (i%4)*.03;
        return (
          <div key={`si-${i}`} style={{
            position:"absolute",left:"50%",top:"44%",
            width:0,height:0,overflow:"visible",
            transform:`rotate(${angle}deg)`,transformOrigin:"0 0",
            pointerEvents:"none",zIndex:22,
          }}>
            {/* Elongated spark — tapered shape pointing in launch direction */}
            <div style={{
              position:"absolute",
              width:sw, height:sh,
              borderRadius:"50% 50% 30% 30%",
              left:-(sw/2), top:-58-(sh/2),
              background:`linear-gradient(to bottom,${sc} 0%,rgba(255,150,0,.85) 35%,rgba(255,80,0,.5) 65%,transparent 100%)`,
              boxShadow:`0 0 ${sw*4}px ${sc},0 0 ${sw*8}px rgba(255,150,0,.7)`,
              animation:`ti-spark-shoot ${dur}s ease-out ${impactAt + stg}s both`,
            }}/>
          </div>
        );
      })}

      {/* ══ BOX SHELL ═══════════════════════════════════════════ */}
      <div style={{
        position:"relative",overflow:"visible",
        width:"clamp(76px,11vw,116px)",height:"clamp(84px,12vw,126px)",
        background:"linear-gradient(160deg,rgba(22,18,8,.97) 0%,rgba(6,4,1,.99) 100%)",
        border:`1.5px solid ${C}50`,borderRadius:16,
        boxShadow:`0 0 36px ${C}28,0 0 10px ${C}14,inset 0 1px 0 rgba(255,255,255,.09)`,
        willChange:"transform, opacity",
      }}>
        {/* Top / bottom highlight lines */}
        <div style={{position:"absolute",inset:"0 18px auto",height:1,background:`linear-gradient(90deg,transparent,${C}65,transparent)`}}/>
        <div style={{position:"absolute",inset:"auto 18px 0",height:1,background:`linear-gradient(90deg,transparent,${C}28,transparent)`}}/>

        {/* Spin-in grand glow (SECS only) — opacity-only animation, no repaint */}
        {isGrand && (
          <div style={{
            position:"absolute",inset:-8,borderRadius:24,pointerEvents:"none",
            boxShadow:"0 0 130px 44px rgba(245,158,11,1),0 0 200px 78px rgba(255,200,50,.62)",
            opacity:0, animation:`ti-sec-grand 1.2s ease ${delay+0.76}s both`,
          }}/>
        )}

        {/* Per-tick glow burst (SECS only) — opacity-only animation, no repaint */}
        {isGrand && (
          <div key={`glow-${sparkTick}`} style={{
            position:"absolute",inset:-3,borderRadius:19,pointerEvents:"none",
            boxShadow:"0 0 88px 28px rgba(245,158,11,.95),0 0 140px 52px rgba(255,190,40,.58)",
            border:"1.5px solid rgba(255,240,90,.9)",
            opacity:0, animation:"ti-sec-glow .68s ease-out forwards",
          }}/>
        )}

        {/* ══ EMBER FALL (SECS only) ════════════════════════════
            18 fire sparks appear around the box borders each tick.
            They rotate and drift as they fall — like real fire sparks.
            Shape: mix of elongated sparks + round glowing embers.      */}
        {isGrand && [...Array(18)].map((_,i)=>{
          const ec  = EMBER_HOT[i%EMBER_HOT.length];
          const seg = i%3; /* 0=top edge  1=left edge  2=right edge */
          /* Position at box border */
          const left = seg===0 ? `${6+(i*5.8)%86}%` : seg===1 ? -(2+(i%3)) : "calc(100% + 1px)";
          const top  = seg===0 ? -(2+(i%3))          : `${14+(i*7)%70}%`;
          /* Drift direction based on which edge */
          const anim = seg===1 ? "ti-ember-L" : seg===2 ? "ti-ember-R"
                                                         : ["ti-ember-L","ti-ember-R","ti-ember-C"][i%3];
          const dur  = .52+(i%6)*.11;
          const stag = (i%9)*.036;
          /* Alternate between round embers and elongated trailing sparks */
          const isElongated = i%3===0;
          const sw = isElongated ? 1.5 : 3+(i%3);
          const sh = isElongated ? 9+(i%5)*3 : sw;
          const br = isElongated ? "50% 50% 30% 30%" : "50%";
          const bg = isElongated
            ? `linear-gradient(to bottom,${ec} 0%,rgba(255,100,0,.8) 50%,transparent 100%)`
            : `radial-gradient(circle,${ec} 0%,rgba(255,120,0,.9) 45%,rgba(255,60,0,.4) 80%,transparent 100%)`;
          const glow = `0 0 ${(sw+2)*3}px ${ec},0 0 ${(sw+2)*6}px rgba(255,120,0,.6)`;
          return (
            <div key={`e-${sparkTick}-${i}`} style={{
              position:"absolute",
              left:typeof left==="number"?`${left}px`:left,
              top:typeof top==="number"?`${top}px`:top,
              width:sw,height:sh,
              borderRadius:br,
              background:bg,
              boxShadow:glow,
              animation:`${anim} ${dur}s ease-out ${stag}s forwards`,
              pointerEvents:"none",zIndex:30,
            }}/>
          );
        })}

        {/* Digit */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span key={val} style={{
            fontSize:"clamp(30px,5.5vw,54px)",fontWeight:900,lineHeight:1,
            color:C,fontVariantNumeric:"tabular-nums",
            /* Pure gold glow — no black text shadow so sparks aren't masked */
            textShadow:`0 0 36px ${C}ff,0 0 16px ${C}dd,0 0 6px ${C}aa`,
            animation:isGrand ? "ti-digit-tick .32s cubic-bezier(.34,1.56,.64,1) both" : "none",
            display:"block",
          }}>{pad(val)}</span>
        </div>
      </div>

      {/* Label */}
      <span style={{
        fontSize:"clamp(10px,1.1vw,13px)",fontWeight:700,
        letterSpacing:"0.30em",textTransform:"uppercase",
        color:"rgba(255,255,255,.92)",
        textShadow:"0 2px 18px rgba(0,0,0,1),0 0 8px rgba(0,0,0,.95)",
      }}>{label}</span>
    </div>
  );
});

/* ── Countdown display ───────────────────────────────────────── */
function CdDisplay({ cd, sparkTick }) {
  const C  = "#f59e0b";
  const TS = "0 2px 20px rgba(0,0,0,1),0 0 40px rgba(0,0,0,1),0 4px 8px rgba(0,0,0,1)";
  if (!cd||cd.status==="none") return <span style={{animation:"ti-fadeup .6s ease 5.5s both",fontSize:14,fontWeight:700,letterSpacing:".28em",color:`${C}88`,textTransform:"uppercase",textShadow:TS}}>No date set</span>;
  if (cd.status==="live") return (
    <div className="flex items-center gap-3" style={{animation:"ti-fadeup .6s ease 5.5s both"}}>
      <div style={{width:11,height:11,borderRadius:"50%",background:C,boxShadow:`0 0 20px ${C}`,animation:"ti-live-dot .9s ease-in-out infinite"}}/>
      <span style={{fontSize:16,fontWeight:700,letterSpacing:".22em",color:C,textTransform:"uppercase",textShadow:`0 0 28px ${C},${TS}`}}>Trip Is Live Now</span>
    </div>
  );
  if (cd.status==="done") return <span style={{animation:"ti-fadeup .6s ease 5.5s both",fontSize:14,fontWeight:600,letterSpacing:".22em",color:`${C}70`,textTransform:"uppercase",textShadow:TS}}>Journey Complete</span>;
  return (
    <div className="flex items-end" style={{gap:"clamp(8px,1.8vw,18px)"}}>
      {cd.days>0 && <CdUnit val={cd.days}  label="Days" delay={5.2} dir="L"/>}
      <CdUnit val={cd.hours} label="Hrs"  delay={5.7} dir="T"/>
      <CdUnit val={cd.mins}  label="Mins" delay={6.2} dir="R"/>
      <CdUnit val={cd.secs}  label="Secs" delay={6.7} dir="B" isGrand sparkTick={sparkTick}/>
    </div>
  );
}

function GoldLine({ flip=false }) {
  return <div style={{height:1,width:"clamp(28px,4vw,52px)",background:`linear-gradient(to ${flip?"right":"left"},#f59e0b,rgba(245,158,11,0))`}}/>;
}

/* ────────────────────────────────────────────────────────────────
   TextStamp — wraps any text element:
   • Flies in from outside the screen (dir = T/L/R/B)
   • Slams + bounces into position
   • Bursts small gold sparkles at the moment of impact
──────────────────────────────────────────────────────────────── */
const TS_SPARK_C = ["#ffffff","#fde68a","#f59e0b","#ffcc00","#ff9a00","#fffbeb"];

const TextStamp = memo(function TextStamp({ children, dir="T", delay=0, numSparks=10, spread=28 }) {
  /* Impact fires at ~54% of the 0.82s animation = 0.44s after delay */
  const hitAt = delay + 0.44;

  return (
    <div style={{ position:"relative", overflow:"visible" }}>
      {/* Sparkle burst — ring of particles, each rotated wrapper sets direction */}
      {[...Array(numSparks)].map((_,i) => {
        const angle = i * (360/numSparks);
        const c     = TS_SPARK_C[i % TS_SPARK_C.length];
        const sz    = 2.5 + (i%4)*.8;
        const stag  = (i%5)*.022;
        return (
          <div key={i} style={{
            position:"absolute", left:"50%", top:"50%",
            width:0, height:0, overflow:"visible",
            transform:`rotate(${angle}deg)`, transformOrigin:"0 0",
            pointerEvents:"none", zIndex:30,
          }}>
            <div style={{
              position:"absolute", width:sz, height:sz, borderRadius:"50%",
              background:c,
              boxShadow:`0 0 ${sz*3}px ${c}, 0 0 ${sz*6}px rgba(255,200,0,.55)`,
              left:-(sz/2), top:-(spread)-(sz/2),
              animation:`ti-text-spark .6s ease-out ${hitAt + stag}s both`,
            }}/>
          </div>
        );
      })}

      {/* Text content — gets the stamp fly-in animation */}
      <div style={{ animation:`ti-text-${dir} .82s cubic-bezier(.18,.85,.28,1) ${delay}s both` }}>
        {children}
      </div>
    </div>
  );
});

/* ══════════════════════════════════════════════════════════════
   SCENE
══════════════════════════════════════════════════════════════ */
function TripIntroScene({ trip, cd, sparkTick }) {
  const name  = trip?.tripName || "Adventure Awaits";
  const hasCd = cd?.status === "countdown";
  const topLabel = cd?.status === "live" ? "Active Trip" : "Upcoming Trip";

  /* ── Memoize every TextStamp so they NEVER re-render on per-second ticks.
     useMemo returns the same ReactElement reference each render; React.memo
     on TextStamp sees identical prop references → bails out immediately.    */
  const labelStamp = useMemo(() => (
    <TextStamp dir="T" delay={0.7} numSparks={12} spread={26}>
      <div className="flex items-center" style={{gap:14}}>
        <GoldLine flip/>
        <p style={{
          fontSize:"clamp(12px,1.4vw,16px)",fontWeight:800,
          letterSpacing:".62em",paddingLeft:".62em",textTransform:"uppercase",
          backgroundImage:`linear-gradient(90deg,${GOLD} 0%,#fde68a 50%,${GOLD} 100%)`,
          backgroundSize:"200% auto",WebkitBackgroundClip:"text",
          backgroundClip:"text",WebkitTextFillColor:"transparent",
          filter:"drop-shadow(0 0 22px rgba(245,158,11,.65)) drop-shadow(0 2px 10px rgba(0,0,0,.9))",
        }}>{topLabel}</p>
        <GoldLine/>
      </div>
    </TextStamp>
  ), [topLabel]);

  const nameStamp = useMemo(() => (
    <TextStamp dir="B" delay={3.4} numSparks={18} spread={38}>
      <h1 className="text-center font-black uppercase leading-none px-6" style={{
        fontSize:"clamp(28px,5.8vw,82px)",
        backgroundImage:"linear-gradient(90deg,#7c4800,#f59e0b 24%,#fde68a 48%,#fffbeb 54%,#fde68a 60%,#f59e0b 76%,#7c4800)",
        backgroundSize:"240% auto",WebkitBackgroundClip:"text",
        backgroundClip:"text",WebkitTextFillColor:"transparent",
        filter:"drop-shadow(0 0 55px rgba(245,158,11,.78)) drop-shadow(0 4px 28px rgba(0,0,0,1)) drop-shadow(0 0 90px rgba(0,0,0,.95))",
      }}>{name}</h1>
    </TextStamp>
  ), [name]);

  const startsInStamp = useMemo(() => !hasCd ? null : (
    <TextStamp dir="R" delay={4.4} numSparks={10} spread={22}>
      <div className="flex items-center" style={{gap:12}}>
        <div style={{width:6,height:6,borderRadius:1,background:GOLD,transform:"rotate(45deg)",boxShadow:`0 0 10px ${GOLD}`}}/>
        <p style={{fontSize:"clamp(11px,1.3vw,15px)",fontWeight:700,letterSpacing:".5em",paddingLeft:".5em",textTransform:"uppercase",color:"rgba(255,255,255,.96)",textShadow:TS_SHADOW}}>Trip Starts In</p>
        <div style={{width:6,height:6,borderRadius:1,background:GOLD,transform:"rotate(45deg)",boxShadow:`0 0 10px ${GOLD}`}}/>
      </div>
    </TextStamp>
  ), [hasCd]);

  const logoStamp = useMemo(() => (
    <TextStamp dir="B" delay={7.8} numSparks={6} spread={18}>
      <img src={LOGO_FULL} alt="Syncetra" style={{height:22,opacity:.4}}/>
    </TextStamp>
  ), []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <style>{KF}</style>

      <TripBg img={trip?.coverImage}/>

      <div className="absolute inset-0 pointer-events-none" style={{
        background:"repeating-linear-gradient(to bottom,transparent,transparent 2px,rgba(0,0,0,.06) 2px,rgba(0,0,0,.06) 4px)",
        zIndex:2,
      }}/>

      {/* Ghost watermark — z-index 8, under curtain, reveals as it opens */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{zIndex:8}}>
        <span style={{
          fontSize:"clamp(52px,12vw,190px)",fontWeight:900,letterSpacing:"-.03em",
          textTransform:"uppercase",color:"rgba(255,255,255,.055)",
          textAlign:"center",lineHeight:1,userSelect:"none",
          animation:"ti-ghost-in 1.4s ease 2.2s both",
        }}>{name}</span>
      </div>

      <Sparkles/>
      <Curtains/>

      {/* ── Foreground — z-index 10, always above curtain ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10"
        style={{gap:"clamp(10px,2.2vh,22px)",paddingBottom:"3vh"}}>

        <div style={{
          position:"absolute",width:"70vw",height:"38vh",
          background:"radial-gradient(ellipse,rgba(245,158,11,.18) 0%,rgba(190,90,0,.10) 38%,rgba(120,50,0,.04) 65%,transparent 100%)",
          animation:"ti-aura-pulse 1.8s ease-in-out .4s infinite, ti-fadein .8s ease .4s both",
          pointerEvents:"none", willChange:"opacity, transform",
        }}/>

        {labelStamp}
        {nameStamp}
        {startsInStamp}
        <CdDisplay cd={cd} sparkTick={sparkTick}/>
      </div>

      {/* Logo footer */}
      <div className="absolute inset-x-0 bottom-5 flex justify-center pointer-events-none z-10">
        {logoStamp}
      </div>
    </div>
  );
}

/* ─── Root ───────────────────────────────────────────────────── */
export default function TripIntro() {
  const location    = useLocation();
  const navigate    = useNavigate();
  const destination = location.state?.destination;

  const trip = useMemo(() => getActiveTripFromStorage(), []);
  const [cd, setCd]               = useState(() => calcCountdown(trip));
  const [sparkTick, setSparkTick] = useState(0);
  const prevSecs = useRef(null);

  useEffect(() => {
    const t = setInterval(() => {
      const next = calcCountdown(trip);
      setCd(next);
      if (next.status==="countdown" && next.secs!==prevSecs.current) {
        prevSecs.current = next.secs;
        setSparkTick(k => k+1);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [trip]);

  useEffect(() => {
    const audio = new Audio("/music/Karuppa-Kooda-Va-Song.mp3");
    audio.volume = 0.72;
    audio.play().catch(()=>{});

    // Fade out over 2s starting at 10s (2s before 12s navigation)
    const fadeTimer = setTimeout(() => {
      const startVol = audio.volume;
      let step = 0;
      const STEPS = 40;
      const id = setInterval(() => {
        step++;
        audio.volume = Math.max(0, startVol * (1 - step / STEPS));
        if (step >= STEPS) clearInterval(id);
      }, 2000 / STEPS);
    }, 10000);

    return () => { clearTimeout(fadeTimer); audio.pause(); audio.src = ""; };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => navigate(destination||"/login",{replace:true}), 12000);
    return () => clearTimeout(t);
  }, [destination, navigate]);

  return <TripIntroScene trip={trip} cd={cd} sparkTick={sparkTick}/>;
}
