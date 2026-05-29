import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../hooks";
import { SET_USER_INFO } from "../../store/userSlice";
import { verifySetupToken, createPassword } from "../../services/auth";
import { registerDeviceForPush } from "../../utils/fcm";
import { ROLES } from "../../constants/enum";
import { SyncetraBrand } from "../../components/brand/SyncetraLogo";

const isAdminRole = (r) => r === ROLES.ADMIN || r === ROLES.SUPER_ADMIN;

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
  const [phase, setPhase]     = useState("loading");
  const [userName, setUserName] = useState("");
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

      if (session.user.role === ROLES.USER) {
        await registerDeviceForPush(null, session.token);
      }

      setPhase("done");

      // Small delay so the user sees the success message, then navigate
      setTimeout(() => {
        navigate(
          isAdminRole(session.user.role) ? "/admin/dashboard" : "/user/dashboard",
          { replace: true }
        );
      }, 1800);
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

          {/* Success */}
          {phase === "done" && (
            <div className="text-center py-8 animate-slide-up space-y-3">
              <div className="text-5xl">🎉</div>
              <h2 className="text-lg font-bold text-white">All set!</h2>
              <p className="text-slate-400 text-sm">Password saved. Taking you to your dashboard…</p>
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mt-2" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
