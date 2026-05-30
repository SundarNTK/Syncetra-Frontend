import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { SET_USER_INFO } from "../../store/userSlice";
import { login, register, forgotPassword, resetPassword } from "../../services/auth";
import { ROLES } from "../../constants/enum";
import { SyncetraBrand } from "../../components/brand/SyncetraLogo";
import SyncetraLoader from "../../components/ui/SyncetraLoader";

const INTRO_CINEMATIC = "/intro-styles/cinematic";
const introAfterAuth = (destination) => ({
  introFlow: true,
  destination,
});

// ─── Shared field styles ──────────────────────────────────────────────────────
const INPUT_CLS =
  "w-full mt-2 px-4 py-3 sm:py-3.5 rounded-xl bg-slate-950 border border-slate-600 " +
  "focus:border-red-500 focus:ring-2 focus:ring-red-500/30 text-sm text-white placeholder-slate-500 outline-none transition-colors";
const LABEL_CLS = "text-xs font-medium text-slate-400 uppercase tracking-wide";
const LOGIN_BG_CSS = `
@keyframes sl-liquid {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(8px, -10px, 0) scale(1.08); }
}
@keyframes sl-liquid-alt {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(-10px, 8px, 0) scale(1.1); }
}
@keyframes sl-fire-star {
  0% { opacity: 0; transform: translate3d(0, 26px, 0) scale(0.65); }
  20% { opacity: 1; }
  100% { opacity: 0; transform: translate3d(0, -56px, 0) scale(1.25); }
}
.sl-liquid-a { animation: sl-liquid 8s ease-in-out infinite; }
.sl-liquid-b { animation: sl-liquid-alt 9s ease-in-out infinite; }
`;

function Field({ label, children }) {
  return (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      {children}
    </div>
  );
}

function SubmitBtn({ loading, label, loadingLabel }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 sm:py-3.5 rounded-xl font-bold text-white disabled:opacity-50 text-sm sm:text-base bg-gradient-to-r from-red-600 to-orange-500 hover:opacity-90 transition-opacity"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

function ErrorBanner({ msg }) {
  return (
    <p className="text-red-400 text-sm text-center bg-red-950/50 border border-red-800/40 py-2 px-3 rounded-lg">
      {msg}
    </p>
  );
}

// ─── ForgotPasswordFlow ───────────────────────────────────────────────────────
function ForgotPasswordFlow({ onBack }) {
  const [step, setStep]         = useState("email"); // "email" | "otp" | "done"
  const [email, setEmail]       = useState("");
  const [otp, setOtp]           = useState("");
  const [devOtp, setDevOtp]     = useState("");
  const [newPwd, setNewPwd]     = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      if (res?.data?.otp) setDevOtp(res.data.otp);
      setStep("otp");
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    if (newPwd !== confirmPwd) { setError("Passwords do not match"); return; }
    if (newPwd.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await resetPassword(email, otp, newPwd);
      setStep("done");
    } catch (err) {
      setError(err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <div className="text-center space-y-4 py-4 animate-slide-up">
        <div className="text-4xl">✅</div>
        <p className="text-green-400 font-semibold text-sm">Password reset successfully!</p>
        <p className="text-slate-400 text-xs">You can now sign in with your new password.</p>
        <button type="button" onClick={onBack} className="text-orange-400 text-sm font-semibold hover:underline">
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="text-center">
        <p className="text-sm font-semibold text-white">
          {step === "email" ? "Forgot Password" : "Enter OTP"}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {step === "email"
            ? "Enter your email address to receive a one-time code."
            : `We sent a 6-digit OTP to ${email}. Enter it below.`}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <Field label="Email Address">
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
              className={INPUT_CLS} placeholder="you@example.com" required autoFocus />
          </Field>
          {error && <ErrorBanner msg={error} />}
          <SubmitBtn loading={loading} label="Send OTP" loadingLabel="Sending…" />
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <Field label="OTP Code">
            <input type="text" inputMode="numeric" value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              className={`${INPUT_CLS} text-center tracking-[0.4em] text-lg font-mono`}
              placeholder="000000" maxLength={6} required autoFocus />
          </Field>
          {devOtp && (
            <p className="text-xs text-center text-amber-400 bg-amber-950/40 border border-amber-800/40 rounded-lg py-1.5">
              DEV — OTP: <strong>{devOtp}</strong>
            </p>
          )}
          <Field label="New Password">
            <input type="password" value={newPwd} onChange={(e) => { setNewPwd(e.target.value); setError(""); }}
              className={INPUT_CLS} placeholder="••••••••" required minLength={6} />
          </Field>
          <Field label="Confirm Password">
            <input type="password" value={confirmPwd} onChange={(e) => { setConfirmPwd(e.target.value); setError(""); }}
              className={INPUT_CLS} placeholder="••••••••" required />
          </Field>
          {error && <ErrorBanner msg={error} />}
          <SubmitBtn loading={loading} label="Reset Password" loadingLabel="Resetting…" />
          <button type="button" onClick={() => { setStep("email"); setError(""); }}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-200">
            ← Resend OTP
          </button>
        </form>
      )}

      <button type="button" onClick={onBack} className="w-full text-center text-xs text-orange-400 font-semibold hover:underline mt-1">
        Back to Sign In
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLogin, userInfo } = useAppSelector((s) => s.user);

  // "login" | "register" | "forgot"
  const [mode, setMode] = useState("login");

  // login fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [showPwd, setShowPwd]       = useState(false);

  // register fields
  const [regUsername, setRegUsername] = useState("");
  const [regName, setRegName]         = useState("");
  const [regEmail, setRegEmail]       = useState("");
  const [regMobile, setRegMobile]     = useState("");
  const [devSetupUrl, setDevSetupUrl] = useState("");

  // shared state
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const fireStars = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2.3 + 1.2,
        delay: Math.random() * 2.2,
        dur: Math.random() * 1.8 + 1.9,
        alpha: Math.random() * 0.45 + 0.35,
      })),
    []
  );

  const isAdminRole = (r) => r === ROLES.ADMIN || r === ROLES.SUPER_ADMIN;
  const postLoginNavRef = useRef(false);

  // Already signed in — skip login page (no intro; intro is only after fresh sign-in)
  useEffect(() => {
    if (postLoginNavRef.current) return;
    if (isLogin && userInfo?.user?.name) {
      const dest = isAdminRole(userInfo.user.role) ? "/admin/dashboard" : "/user/dashboard";
      navigate(dest, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setSuccess("");
    setDevSetupUrl("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(identifier, password);
      const session = res.data;
      postLoginNavRef.current = true;
      dispatch(SET_USER_INFO(session));
      const dest = isAdminRole(session.user.role) ? "/admin/dashboard" : "/user/dashboard";
      navigate(INTRO_CINEMATIC, { replace: true, state: introAfterAuth(dest) });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await register({
        username: regUsername,
        name: regName,
        email: regEmail,
        mobileNumber: regMobile,
      });
      setDevSetupUrl(res?.data?.setupUrl || "");
      setSuccess("Account created! Check your email for the password setup link.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6">
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-950/85 backdrop-blur-sm">
          <SyncetraLoader size="md" />
          <p className="text-sm text-slate-300 font-medium">Signing in…</p>
        </div>
      )}
      <style>{LOGIN_BG_CSS}</style>
      <div className="absolute inset-0 bg-gradient-to-br from-[#05090f] via-[#0c1124] to-[#1a0a24]" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[14%] top-[24%] w-56 sm:w-80 h-56 sm:h-80 rounded-[48%_52%_40%_60%] bg-fuchsia-500/30 blur-3xl sl-liquid-a" />
        <div className="absolute right-[10%] top-[36%] w-64 sm:w-96 h-64 sm:h-96 rounded-[54%_46%_64%_36%] bg-cyan-500/28 blur-3xl sl-liquid-b" />
        <div className="absolute left-[33%] bottom-[14%] w-72 sm:w-[28rem] h-52 sm:h-72 rounded-[42%_58%_44%_56%] bg-indigo-500/26 blur-3xl sl-liquid-a" />
        <div className="absolute right-[3%] top-[28%] w-44 sm:w-64 h-44 sm:h-64 rounded-full bg-cyan-400/30 blur-3xl sl-liquid-b" />
      </div>
      <div className="absolute inset-0 pointer-events-none">
        {fireStars.map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              background: "radial-gradient(circle, rgba(251,191,36,0.95) 0%, rgba(245,158,11,0.72) 54%, rgba(245,158,11,0) 100%)",
              boxShadow: "0 0 10px rgba(251,191,36,0.65), 0 0 18px rgba(245,158,11,0.45)",
              opacity: s.alpha,
              animation: `sl-fire-star ${s.dur}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="absolute -inset-8 -z-10 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[46%] w-72 sm:w-[28rem] h-52 sm:h-72 rounded-full bg-purple-400/22 blur-3xl sl-liquid-a" />
        </div>
        <div className="text-center mb-6 sm:mb-8">
          <SyncetraBrand variant="full" size="lg" centered />
          <p className="text-slate-400 mt-2 text-xs sm:text-sm">
            Smart trip coordination · alarms · expenses · attendance
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden">
          {/* Tab bar — hidden in forgot mode */}
          {mode !== "forgot" && (
            <div className="flex p-1.5 m-3 rounded-xl bg-slate-800/80">
              {["login", "register"].map((m) => (
                <button key={m} type="button" onClick={() => switchMode(m)}
                  className={`flex-1 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all capitalize ${
                    mode === m
                      ? "bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-slate-300"
                  }`}>
                  {m === "login" ? "Sign In" : "Register"}
                </button>
              ))}
            </div>
          )}

          <div className="px-4 sm:px-6 pb-6">
            {/* ── Forgot Password ── */}
            {mode === "forgot" && (
              <ForgotPasswordFlow onBack={() => switchMode("login")} />
            )}

            {/* ── Login ── */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-4 animate-slide-up">
                <div className="text-center mb-1">
                  <p className="text-xs text-slate-500">Use your email address or username to sign in.</p>
                </div>
                <Field label="Email or Username">
                  <input type="text" value={identifier}
                    onChange={(e) => { setIdentifier(e.target.value); setError(""); }}
                    className={INPUT_CLS} placeholder="you@example.com or username"
                    required autoFocus autoComplete="username" />
                </Field>
                <Field label="Password">
                  <div className="relative">
                    <input type={showPwd ? "text" : "password"} value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      className={`${INPUT_CLS} pr-12`} placeholder="••••••••"
                      required autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 mt-1 text-slate-400 hover:text-slate-200 text-xs select-none" tabIndex={-1}>
                      {showPwd ? "Hide" : "Show"}
                    </button>
                  </div>
                </Field>
                <div className="text-right">
                  <button type="button" onClick={() => switchMode("forgot")}
                    className="text-xs text-orange-400 hover:underline font-medium">
                    Forgot password?
                  </button>
                </div>
                {error && <ErrorBanner msg={error} />}
                <SubmitBtn loading={loading} label="Sign In" loadingLabel="Signing in…" />
                <p className="text-center text-xs text-slate-500 mt-2">
                  Don&apos;t have an account?{" "}
                  <button type="button" onClick={() => switchMode("register")} className="text-orange-400 font-semibold hover:underline">Register</button>
                </p>
              </form>
            )}

            {/* ── Register ── */}
            {mode === "register" && (
              <>
                {success ? (
                  <div className="animate-slide-up py-4 text-center space-y-4">
                    <div className="text-4xl">📧</div>
                    <p className="text-green-400 font-semibold text-sm">{success}</p>
                    <p className="text-slate-400 text-xs">Check your spam folder if it doesn&apos;t arrive within a few minutes.</p>
                    {devSetupUrl && (
                      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-left">
                        <p className="text-xs text-slate-500 mb-1">DEV — Setup link (email not configured):</p>
                        <a href={devSetupUrl} className="text-xs text-cyan-400 break-all hover:underline">{devSetupUrl}</a>
                      </div>
                    )}
                    <button type="button" onClick={() => switchMode("login")} className="text-orange-400 text-sm font-semibold hover:underline">Back to Sign In</button>
                  </div>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4 animate-slide-up">
                    <div className="text-center mb-1">
                      <p className="text-xs text-slate-500">After registration, a password setup link is sent to your email.</p>
                    </div>
                    <Field label="Username">
                      <input type="text" value={regUsername}
                        onChange={(e) => { setRegUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "")); setError(""); }}
                        className={INPUT_CLS} placeholder="e.g. john_doe" required minLength={3} maxLength={30} autoFocus autoComplete="username" />
                      <p className="text-xs text-slate-500 mt-1">Letters, numbers and underscores only.</p>
                    </Field>
                    <Field label="Full Name">
                      <input type="text" value={regName}
                        onChange={(e) => { setRegName(e.target.value); setError(""); }}
                        className={INPUT_CLS} placeholder="Your full name" required minLength={2} />
                    </Field>
                    <Field label="Email Address">
                      <input type="email" value={regEmail}
                        onChange={(e) => { setRegEmail(e.target.value); setError(""); }}
                        className={INPUT_CLS} placeholder="you@example.com" required />
                    </Field>
                    <Field label="Mobile Number">
                      <input type="tel" value={regMobile}
                        onChange={(e) => { setRegMobile(e.target.value.replace(/\D/g, "")); setError(""); }}
                        className={INPUT_CLS} placeholder="9876543210" required minLength={10} maxLength={15} />
                      <p className="text-xs text-slate-500 mt-1">Used for push alarm notifications.</p>
                    </Field>
                    {error && <ErrorBanner msg={error} />}
                    <SubmitBtn loading={loading} label="Create Account" loadingLabel="Registering…" />
                    <p className="text-center text-xs text-slate-500 mt-2">
                      Already have an account?{" "}
                      <button type="button" onClick={() => switchMode("login")} className="text-orange-400 font-semibold hover:underline">Sign In</button>
                    </p>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
