import { useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { LOGO_FULL } from "../../components/brand/SyncetraLogo";

const STYLES = {
  cinematic: { name: "Cinematic Ember" },
  aurora: { name: "Aurora Neon" },
  royal: { name: "Royal Gold" },
  emerald: { name: "Emerald Pulse" },
  glitch: { name: "Glitch Scanline" },
  wireframe: { name: "Wireframe Build" },
  liquid: { name: "Liquid Blob Morph" },
  capsule: { name: "Capsule Orbit (GIF Inspired)" },
};

const styleOrder = [
  "cinematic",
  "aurora",
  "royal",
  "emerald",
  "glitch",
  "wireframe",
  "liquid",
  "capsule",
];

function PreviewCard({ id, active }) {
  const s = STYLES[id];
  return (
    <Link
      to={`/intro-styles/${id}`}
      className={`px-3 py-2 rounded-lg text-xs sm:text-sm border transition-colors ${
        active
          ? "bg-emerald-600/40 border-emerald-500 text-emerald-100"
          : "bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800"
      }`}
    >
      {s.name}
    </Link>
  );
}

function SharedLinks({ active }) {
  return (
    <div className="mt-10 max-w-6xl w-full px-2">
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {styleOrder.map((k) => (
          <PreviewCard key={k} id={k} active={k === active} />
        ))}
      </div>
      <div className="text-center text-xs text-slate-300/90 leading-6">
        Preview links:{" "}
        {styleOrder.map((k, i) => (
          <span key={k}>
            <a className="text-cyan-300 hover:underline" href={`#/intro-styles/${k}`}>
              {`#/intro-styles/${k}`}
            </a>
            {i < styleOrder.length - 1 ? " · " : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function GoldText({ children, className = "" }) {
  return (
    <span
      className={className}
      style={{
        backgroundImage:
          "linear-gradient(90deg, #7c4800 0%, #c87d0e 10%, #f59e0b 24%, #fde68a 40%, #fffbeb 50%, #fde68a 62%, #f59e0b 78%, #c87d0e 90%, #7c4800 100%)",
        backgroundSize: "260% auto",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "#f59e0b",
        animation: "si-shimmer 3.2s linear infinite",
      }}
    >
      {children}
    </span>
  );
}

function BaseScene({ bg, halo, logoFx = "", children }) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <style>{`
        @keyframes si-shimmer {0%{background-position:200% center;}100%{background-position:-200% center;}}
        @keyframes si-float {0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
        @keyframes si-spin-slow {from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes si-drift {0%,100%{transform:translate(-2%,-1%)}50%{transform:translate(2%,1%)}}
        @keyframes si-glitch {0%,100%{transform:translate(0)}20%{transform:translate(-2px,1px)}40%{transform:translate(2px,-1px)}60%{transform:translate(-1px,1px)}}
        @keyframes si-lineGrow {0%{transform:scaleX(0)}100%{transform:scaleX(1)}}
        @keyframes si-breathe {0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
        @keyframes si-capsule {0%{transform:translateX(-220px)}55%{transform:translateX(34px)}100%{transform:translateX(34px)}}
        @keyframes si-textReveal {0%{opacity:0;transform:translateY(-16px);filter:blur(5px)}65%{opacity:1;transform:translateY(1px);filter:blur(0.4px)}100%{opacity:1;transform:translateY(0);filter:blur(0)}}
        @keyframes si-logoReveal {0%{opacity:0;transform:scale(0.88) translateY(22px)}65%{opacity:0.92;transform:scale(1.01) translateY(-3px)}100%{opacity:1;transform:scale(1) translateY(0)}}
      `}</style>

      <div className={`absolute inset-0 ${bg}`} />
      <div className="absolute inset-0" style={{ background: halo }} />
      {children}

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <div
          className="mb-10 text-center"
          style={{ animation: "si-textReveal 0.9s cubic-bezier(0.25,0.46,0.45,0.94) both, si-float 5s ease-in-out 1.1s infinite" }}
        >
          <GoldText className="inline-block uppercase font-extrabold tracking-[0.45em] pl-[0.45em] text-[clamp(14px,2.3vw,20px)]">
            Welcome To
          </GoldText>
        </div>

        <div style={{ animation: "si-logoReveal 1.1s cubic-bezier(0.25,0.46,0.45,0.94) 0.15s both" }}>
          <img
            src={LOGO_FULL}
            alt="Syncetra"
            className={`h-[clamp(170px,24vw,250px)] w-auto object-contain ${logoFx}`}
            style={{ animation: "si-float 4.2s ease-in-out 1.4s infinite" }}
          />
        </div>
      </div>
    </div>
  );
}

function CinematicScene() {
  return (
    <BaseScene
      bg="bg-gradient-to-br from-black via-slate-950 to-black"
      halo="radial-gradient(ellipse at center, rgba(16,185,129,0.18) 0%, rgba(245,158,11,0.16) 34%, rgba(0,0,0,0.75) 80%, rgba(0,0,0,0.95) 100%)"
      logoFx="drop-shadow-[0_0_26px_rgba(251,191,36,0.5)]"
    >
      <div className="absolute inset-0 pointer-events-none opacity-70">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-[si-spin-slow_26s_linear_infinite]"
          style={{
            width: "min(88vw, 760px)",
            height: "min(88vw, 760px)",
            backgroundImage:
              "repeating-conic-gradient(from 0deg, rgba(16,185,129,0.18) 0deg 8deg, rgba(245,158,11,0.24) 8deg 15deg, transparent 15deg 30deg)",
            filter: "blur(1.1px)",
            maskImage:
              "radial-gradient(circle, transparent 22%, rgba(255,255,255,0.5) 34%, rgba(255,255,255,0.95) 58%, transparent 84%)",
            WebkitMaskImage:
              "radial-gradient(circle, transparent 22%, rgba(255,255,255,0.5) 34%, rgba(255,255,255,0.95) 58%, transparent 84%)",
          }}
        />
      </div>
    </BaseScene>
  );
}

function AuroraScene() {
  return (
    <BaseScene
      bg="bg-gradient-to-br from-[#020617] via-[#0a1029] to-[#060b1a]"
      halo="radial-gradient(ellipse at center, rgba(34,211,238,0.22) 0%, rgba(168,85,247,0.20) 34%, rgba(0,0,0,0.68) 75%, rgba(0,0,0,0.94) 100%)"
      logoFx="drop-shadow-[0_0_30px_rgba(34,211,238,0.46)]"
    >
      <div
        className="absolute inset-0 animate-[si-drift_8s_ease-in-out_infinite]"
        style={{
          background:
            "conic-gradient(from 120deg at 50% 50%, transparent 0deg, rgba(34,211,238,0.14) 70deg, transparent 140deg, rgba(168,85,247,0.14) 220deg, transparent 300deg)",
        }}
      />
    </BaseScene>
  );
}

function RoyalScene() {
  return (
    <BaseScene
      bg="bg-gradient-to-br from-[#060606] via-[#0f0a02] to-[#14100a]"
      halo="radial-gradient(ellipse at center, rgba(251,191,36,0.24) 0%, rgba(245,158,11,0.22) 34%, rgba(0,0,0,0.74) 78%, rgba(0,0,0,0.96) 100%)"
      logoFx="drop-shadow-[0_0_34px_rgba(251,191,36,0.65)]"
    >
      <div className="absolute inset-0 opacity-35 pointer-events-none">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-[1px] bg-amber-200/50 origin-left animate-[si-lineGrow_1.2s_ease-out_both]"
            style={{ top: `${12 + i * 9}%`, animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>
    </BaseScene>
  );
}

function EmeraldScene() {
  return (
    <BaseScene
      bg="bg-gradient-to-br from-[#02070a] via-[#03241d] to-[#041612]"
      halo="radial-gradient(ellipse at center, rgba(16,185,129,0.24) 0%, rgba(20,184,166,0.2) 36%, rgba(0,0,0,0.72) 78%, rgba(0,0,0,0.95) 100%)"
      logoFx="drop-shadow-[0_0_30px_rgba(16,185,129,0.56)]"
    >
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute left-1/4 top-1/3 w-72 h-72 rounded-full bg-emerald-400/40 blur-3xl animate-[si-breathe_6s_ease-in-out_infinite]" />
        <div className="absolute right-1/4 bottom-1/3 w-80 h-80 rounded-full bg-teal-400/40 blur-3xl animate-[si-breathe_7s_ease-in-out_infinite]" />
      </div>
    </BaseScene>
  );
}

function GlitchScene() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050507]">
      <style>{`
        @keyframes si-scan {0%{background-position:0 0;}100%{background-position:0 200px;}}
      `}</style>
      <div
        className="absolute inset-0 opacity-35"
        style={{
          background:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.09) 0px, rgba(255,255,255,0.09) 1px, transparent 1px, transparent 4px)",
          animation: "si-scan 3s linear infinite",
        }}
      />
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <GoldText className="uppercase font-extrabold tracking-[0.48em] pl-[0.45em] text-[clamp(12px,2vw,18px)] mb-10">
          Welcome To
        </GoldText>
        <div className="relative">
          <img src={LOGO_FULL} alt="Syncetra" className="h-[clamp(170px,24vw,250px)] w-auto object-contain animate-[si-float_4s_ease-in-out_infinite]" />
          <img src={LOGO_FULL} alt="" className="absolute inset-0 h-[clamp(170px,24vw,250px)] w-auto object-contain opacity-45 mix-blend-screen animate-[si-glitch_0.22s_steps(2,end)_infinite]" style={{ filter: "hue-rotate(180deg)" }} />
        </div>
      </div>
    </div>
  );
}

function WireframeScene() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#020304] via-[#080d13] to-[#111827]">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="absolute left-0 right-0 h-px bg-cyan-300/40" style={{ top: `${i * 6}%` }} />
        ))}
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={`v-${i}`} className="absolute top-0 bottom-0 w-px bg-cyan-300/30" style={{ left: `${i * 6}%` }} />
        ))}
      </div>
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <GoldText className="uppercase font-extrabold tracking-[0.48em] pl-[0.45em] text-[clamp(12px,2vw,18px)] mb-8">
          Welcome To
        </GoldText>
        <div className="relative p-6 border border-cyan-300/30 rounded-2xl backdrop-blur-sm bg-cyan-400/5 animate-[si-breathe_4.2s_ease-in-out_infinite]">
          <img src={LOGO_FULL} alt="Syncetra" className="h-[clamp(170px,24vw,250px)] w-auto object-contain" />
        </div>
      </div>
    </div>
  );
}

function LiquidScene() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#05090f] via-[#0c1124] to-[#1a0a24]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[15%] top-[28%] w-72 h-72 rounded-[48%_52%_40%_60%] bg-fuchsia-500/35 blur-3xl animate-[si-breathe_6s_ease-in-out_infinite]" />
        <div className="absolute right-[12%] top-[35%] w-80 h-80 rounded-[54%_46%_64%_36%] bg-cyan-500/35 blur-3xl animate-[si-breathe_7s_ease-in-out_infinite]" />
        <div className="absolute left-[35%] bottom-[18%] w-96 h-60 rounded-[42%_58%_44%_56%] bg-indigo-500/30 blur-3xl animate-[si-breathe_8s_ease-in-out_infinite]" />
      </div>
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <GoldText className="uppercase font-extrabold tracking-[0.48em] pl-[0.45em] text-[clamp(12px,2vw,18px)] mb-10">
          Welcome To
        </GoldText>
        <img src={LOGO_FULL} alt="Syncetra" className="h-[clamp(170px,24vw,250px)] w-auto object-contain animate-[si-float_4.4s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}

function CapsuleScene() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-r from-[#0a0a0e] via-[#0f0f16] to-[#12121b]">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-violet-500 to-blue-700 animate-[si-breathe_4.6s_ease-in-out_infinite]" />
      <div className="absolute left-[24%] top-1/2 -translate-y-1/2 h-20 w-[270px] rounded-full bg-slate-200 animate-[si-capsule_1.2s_cubic-bezier(0.2,0.8,0.2,1)_both]" />
      <div className="absolute left-[15%] top-1/2 -translate-y-1/2 h-9 w-44 rounded-full bg-teal-400 animate-[si-capsule_0.9s_cubic-bezier(0.2,0.8,0.2,1)_both]" />
      <div className="absolute left-[10%] top-[43%] right-[8%] h-px border-t border-dotted border-teal-300/70" />
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <GoldText className="uppercase font-extrabold tracking-[0.48em] pl-[0.45em] text-[clamp(12px,2vw,18px)] mb-10">
          Welcome To
        </GoldText>
        <img src={LOGO_FULL} alt="Syncetra" className="h-[clamp(170px,24vw,250px)] w-auto object-contain animate-[si-float_3.8s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}

export default function IntroStylePreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const introFlow = Boolean(location.state?.introFlow);
  const id = introFlow ? "cinematic" : STYLES[params.styleId] ? params.styleId : "cinematic";

  useEffect(() => {
    if (!introFlow || !location.state?.destination) return;
    const toExit = setTimeout(() => navigate(location.state.destination, { replace: true }), 3000);
    return () => clearTimeout(toExit);
  }, [introFlow, location.state, navigate]);

  return (
    <>
      {id === "cinematic" && <CinematicScene />}
      {id === "aurora" && <AuroraScene />}
      {id === "royal" && <RoyalScene />}
      {id === "emerald" && <EmeraldScene />}
      {id === "glitch" && <GlitchScene />}
      {id === "wireframe" && <WireframeScene />}
      {id === "liquid" && <LiquidScene />}
      {id === "capsule" && <CapsuleScene />}
      {!introFlow && (
        <div className="fixed bottom-4 left-0 right-0 z-50">
          <SharedLinks active={id} />
        </div>
      )}
    </>
  );
}

