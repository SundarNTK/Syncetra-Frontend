import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../hooks";
import { SET_USER_INFO } from "../../store/userSlice";
import { verifySetupToken, createPassword } from "../../services/auth";
import { registerDeviceForPush } from "../../utils/fcm";
import { ROLES } from "../../constants/enum";
import { SyncetraBrand } from "../../components/brand/SyncetraLogo";

const isAdminRole = (r) => r === ROLES.ADMIN || r === ROLES.SUPER_ADMIN;

/* ─── Cosmic Gate — Password Set Success Popup ──────────────────────────────── */
const CG_CSS = `
@keyframes cg-backdrop  { from{opacity:0} to{opacity:1} }
@keyframes cg-card-pop  { 0%{transform:scale(0.55) translateY(40px);opacity:0} 60%{transform:scale(1.04) translateY(-5px);opacity:1} 80%{transform:scale(0.97)} 100%{transform:scale(1) translateY(0);opacity:1} }
@keyframes cg-pulse-ring{ 0%{transform:scale(0.6);opacity:0.8} 100%{transform:scale(2.6);opacity:0} }
@keyframes cg-portal    { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.08);opacity:1} 80%{transform:scale(0.96)} 100%{transform:scale(1);opacity:1} }
@keyframes cg-spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes cg-shimmer   { from{background-position:0% center} to{background-position:300% center} }
@keyframes cg-fade-up   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes cg-bar-drain { from{width:100%} to{width:0%} }
@keyframes cg-float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
.cg-title {
  background: linear-gradient(90deg,#818cf8,#c4b5fd,#67e8f9,#818cf8);
  background-size: 300% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: cg-shimmer 3s linear infinite;
}
`;

function CgStarCanvas({ active }) {
  const ref = useRef(null);
  const raf = useRef(null);
  useEffect(() => {
    if (!active) return;
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    c.width = c.offsetWidth; c.height = c.offsetHeight;
    const W = c.width, H = c.height, CX = W / 2, CY = H / 2;
    const COLS = ["#818cf8","#c4b5fd","#67e8f9","#a78bfa","#e0e7ff","#f0abfc"];
    const stars = Array.from({ length: 80 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const spd   = Math.random() * 4.5 + 1.5;
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

function CosmicGatePwdPopup({ userName, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  return (
    <>
      <style>{CG_CSS}</style>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
        style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(10px)", animation: "cg-backdrop 0.35s ease both" }}>
        <div className="relative w-full max-w-sm rounded-3xl text-center overflow-hidden"
          style={{ background: "linear-gradient(160deg,#0a0818 0%,#04020f 100%)", border: "1px solid rgba(129,140,248,0.3)", boxShadow: "0 0 80px rgba(99,102,241,0.22), 0 40px 80px rgba(0,0,0,0.8)", animation: "cg-card-pop 0.65s cubic-bezier(0.22,1.2,0.36,1) both" }}>
          <CgStarCanvas active />
          <div style={{ height: 2, background: "linear-gradient(90deg,transparent,#818cf8,#67e8f9,#818cf8,transparent)" }} />

          <div className="relative z-10 pt-8 pb-7 px-6">
            {/* Portal rings + lock icon */}
            <div className="relative flex items-center justify-center mx-auto mb-5" style={{ width: 110, height: 110 }}>
              {[0, 0.5, 1].map((d, i) => (
                <div key={i} className="absolute rounded-full"
                  style={{ inset: 0, border: "1px solid rgba(129,140,248,0.4)", animation: `cg-pulse-ring 2s ${d}s ease-out infinite` }} />
              ))}
              {/* Portal glow disc */}
              <div className="absolute rounded-full" style={{ inset: 12, background: "radial-gradient(circle,rgba(139,92,246,0.3) 0%,rgba(99,102,241,0.08) 70%,transparent 100%)", animation: "cg-portal 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s both", boxShadow: "0 0 40px rgba(139,92,246,0.35), inset 0 0 24px rgba(139,92,246,0.2)" }} />
              {/* Orbiting dots */}
              <div className="absolute inset-0" style={{ animation: "cg-spin 4s linear infinite" }}>
                {[0, 120, 240].map((deg, i) => (
                  <div key={i} className="absolute w-2.5 h-2.5 rounded-full"
                    style={{ top: "50%", left: "50%", marginTop: -5, marginLeft: -5, background: ["#818cf8","#67e8f9","#c4b5fd"][i], boxShadow: `0 0 8px ${["#818cf8","#67e8f9","#c4b5fd"][i]}`, transform: `rotate(${deg}deg) translateX(46px)` }} />
                ))}
              </div>
              {/* Lock icon in center */}
              <div className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "radial-gradient(circle,rgba(139,92,246,0.4) 0%,rgba(99,102,241,0.15) 100%)", border: "1px solid rgba(139,92,246,0.5)", boxShadow: "0 0 20px rgba(139,92,246,0.5)" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{ animation: "cg-float 2.5s ease-in-out infinite" }}>
                  <rect x="5" y="11" width="14" height="10" rx="2" fill="rgba(139,92,246,0.3)" stroke="#c4b5fd" strokeWidth="1.5" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="12" cy="16" r="1.5" fill="#67e8f9" />
                </svg>
              </div>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-400/70 mb-1.5" style={{ animation: "cg-fade-up 0.5s ease 0.5s both", opacity: 0 }}>
              Password Secured
            </p>
            <h2 className="cg-title text-2xl font-black tracking-tight mb-1" style={{ animation: "cg-fade-up 0.45s ease 0.6s both" }}>
              YOU&apos;RE ALL SET{userName ? `, ${userName.split(" ")[0].toUpperCase()}` : ""}!
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-5" style={{ animation: "cg-fade-up 0.5s ease 0.72s both", opacity: 0 }}>
              Your password is confirmed.<br />Taking you to your dashboard…
            </p>

            {/* Drain bar */}
            <div className="h-[3px] bg-indigo-900/30 rounded-full mb-5 overflow-hidden mx-2" style={{ animation: "cg-fade-up 0.5s ease 0.82s both", opacity: 0 }}>
              <div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#6366f1,#8b5cf6,#67e8f9)", animation: "cg-bar-drain 5000ms linear both" }} />
            </div>

            <button onClick={onClose}
              className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 0 24px rgba(99,102,241,0.4)", animation: "cg-fade-up 0.5s ease 0.9s both", opacity: 0 }}>
              Enter Syncetra →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const INPUT_CLS =
  "w-full mt-2 px-4 py-3 sm:py-3.5 rounded-xl bg-slate-950 border border-slate-600 " +
  "focus:border-red-500 focus:ring-2 focus:ring-red-500/30 text-sm text-white placeholder-slate-500 outline-none transition-colors";
const LABEL_CLS = "text-xs font-medium text-slate-400 uppercase tracking-wide";

// ─── Greeting popup ───────────────────────────────────────────────────────────
function GreetingPopup({ name, onOk }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 animate-slide-up text-center">
        <div className="text-5xl mb-4">👋</div>
        <h2 className="text-lg font-bold text-white mb-3">
          Hi {name}!
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed mb-6">
          Create your password and confirm password to process your journey.
        </p>
        <button
          type="button"
          onClick={onOk}
          className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-orange-500 hover:opacity-90 transition-opacity"
        >
          OK, Let&apos;s Go
        </button>
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────
export default function CreatePassword() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const dispatch       = useAppDispatch();

  const token = searchParams.get("token") || "";

  // "loading" | "greeting" | "form" | "error" | "done"
  const [phase, setPhase]       = useState("loading");
  const [userName, setUserName] = useState("");
  const [doneSession, setDoneSession] = useState(null);
  const [tokenError, setTokenError] = useState("");

  const [pwd, setPwd]           = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState("");

  // On mount: verify token and get user's name
  useEffect(() => {
    if (!token) {
      setTokenError("No setup token found. Please use the link from your email.");
      setPhase("error");
      return;
    }

    verifySetupToken(token)
      .then((res) => {
        setUserName(res.data.name);
        setPhase("greeting");
      })
      .catch((err) => {
        setTokenError(err.message || "Invalid or expired setup link.");
        setPhase("error");
      });
  }, [token]);

  // ── Submit password ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (pwd !== confirmPwd) {
      setFormError("Passwords do not match.");
      return;
    }
    if (pwd.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createPassword(token, pwd, confirmPwd);
      const session = res.data;

      dispatch(SET_USER_INFO(session));

      if (session?.user?.role === ROLES.USER) {
        await registerDeviceForPush(null, session.token);
      }

      setDoneSession(session);
      setPhase("done");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-red-950" />
      <div className="absolute top-20 left-10 w-48 sm:w-72 h-48 sm:h-72 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-64 sm:w-96 h-64 sm:h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />

      {/* Greeting popup — shown before the form */}
      {phase === "greeting" && (
        <GreetingPopup name={userName} onOk={() => setPhase("form")} />
      )}

      {/* Cosmic Gate — password set success */}
      {phase === "done" && doneSession && createPortal(
        <CosmicGatePwdPopup
          userName={userName}
          onClose={() => navigate(
            isAdminRole(doneSession?.user?.role) ? "/admin/dashboard" : "/user/dashboard",
            { replace: true }
          )}
        />,
        document.body
      )}

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-6 sm:mb-8">
          <SyncetraBrand variant="full" size="lg" centered />
          <p className="text-slate-400 mt-2 text-xs sm:text-sm">
            Smart trip coordination · alarms · expenses · attendance
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/80 shadow-2xl p-6">

          {/* Loading */}
          {phase === "loading" && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400 text-sm">Verifying your link…</p>
            </div>
          )}

          {/* Token error */}
          {phase === "error" && (
            <div className="text-center py-6 space-y-4">
              <div className="text-4xl">⚠️</div>
              <p className="text-red-400 font-semibold text-sm">{tokenError}</p>
              <p className="text-slate-400 text-xs">
                Please contact your admin to resend the setup email.
              </p>
              <button
                type="button"
                onClick={() => navigate("/login", { replace: true })}
                className="text-orange-400 text-sm font-semibold hover:underline"
              >
                ← Back to Login
              </button>
            </div>
          )}

          {/* Password form */}
          {phase === "form" && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up">
              <div className="text-center mb-2">
                <h2 className="text-lg font-bold text-white">Create Password</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Hi <span className="text-slate-300 font-medium">{userName}</span>! Choose a strong password to secure your account.
                </p>
              </div>

              {/* Password */}
              <div>
                <label className={LABEL_CLS}>Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={pwd}
                    onChange={(e) => { setPwd(e.target.value); setFormError(""); }}
                    className={`${INPUT_CLS} pr-12`}
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                    autoFocus
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 mt-1 text-slate-400 hover:text-slate-200 text-xs select-none"
                    tabIndex={-1}
                  >
                    {showPwd ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className={LABEL_CLS}>Confirm Password</label>
                <div className="relative">
                  <input
                    type={showCPwd ? "text" : "password"}
                    value={confirmPwd}
                    onChange={(e) => { setConfirmPwd(e.target.value); setFormError(""); }}
                    className={`${INPUT_CLS} pr-12`}
                    placeholder="Re-enter password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 mt-1 text-slate-400 hover:text-slate-200 text-xs select-none"
                    tabIndex={-1}
                  >
                    {showCPwd ? "Hide" : "Show"}
                  </button>
                </div>
                {/* Live match indicator */}
                {confirmPwd && (
                  <p className={`text-xs mt-1 ${pwd === confirmPwd ? "text-green-400" : "text-red-400"}`}>
                    {pwd === confirmPwd ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </p>
                )}
              </div>

              {formError && (
                <p className="text-red-400 text-sm text-center bg-red-950/50 border border-red-800/40 py-2 px-3 rounded-lg">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || pwd !== confirmPwd || pwd.length < 6}
                className="w-full py-3 sm:py-3.5 rounded-xl font-bold text-white disabled:opacity-40 text-sm sm:text-base bg-gradient-to-r from-red-600 to-orange-500 hover:opacity-90 transition-opacity"
              >
                {submitting ? "Saving…" : "Set Password & Sign In"}
              </button>
            </form>
          )}

          {/* Success — handled by portal popup below */}
          {phase === "done" && (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
