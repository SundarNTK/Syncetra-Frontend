import { useState } from "react";
import { changePassword } from "../../services/auth";

const INPUT_CLS =
  "w-full mt-1.5 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 " +
  "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm text-white placeholder-slate-500 outline-none transition-colors";

export default function ChangePasswordModal({ onClose }) {
  const [oldPassword, setOldPassword]     = useState("");
  const [newPassword, setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld]             = useState(false);
  const [showNew, setShowNew]             = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [success, setSuccess]             = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) { setError("New passwords do not match"); return; }
    if (newPassword.length < 6) { setError("New password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
          <h3 className="font-semibold text-white">Change Password</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {success ? (
            <div className="text-center space-y-3 py-4">
              <div className="text-4xl">✅</div>
              <p className="text-green-400 font-semibold text-sm">Password changed successfully!</p>
              <p className="text-slate-400 text-xs">A confirmation email has been sent to you.</p>
              <button onClick={onClose} className="mt-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium">Done</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide">Current Password</label>
                <div className="relative">
                  <input type={showOld ? "text" : "password"} value={oldPassword}
                    onChange={(e) => { setOldPassword(e.target.value); setError(""); }}
                    className={`${INPUT_CLS} pr-12`} placeholder="••••••••" required autoFocus />
                  <button type="button" onClick={() => setShowOld((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-slate-400 hover:text-slate-200 text-xs" tabIndex={-1}>
                    {showOld ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide">New Password</label>
                <div className="relative">
                  <input type={showNew ? "text" : "password"} value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                    className={`${INPUT_CLS} pr-12`} placeholder="Min. 6 characters" required minLength={6} />
                  <button type="button" onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-slate-400 hover:text-slate-200 text-xs" tabIndex={-1}>
                    {showNew ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide">Confirm New Password</label>
                <input type="password" value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                  className={INPUT_CLS} placeholder="Re-enter new password" required />
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center bg-red-950/50 border border-red-800/40 py-2 px-3 rounded-lg">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg font-medium text-sm">
                  {loading ? "Saving…" : "Change Password"}
                </button>
                <button type="button" onClick={onClose}
                  className="px-4 py-2.5 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm text-slate-300">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
