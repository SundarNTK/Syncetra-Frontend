import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { UPDATE_USER_PROFILE } from "../../store/userSlice";
import { updateMyProfile } from "../../services/profile";
import { forgotPassword } from "../../services/auth";
import { ROLES } from "../../constants/enum";
import ChangePasswordModal from "../../components/change-password/ChangePasswordModal";
import { Avatar } from "../../components/profile/ProfileDropdown";

/* ─── Constants ────────────────────────────────────────────────────────────── */
const INPUT_CLS =
  "w-full mt-1.5 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 " +
  "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm text-white " +
  "placeholder-slate-500 outline-none transition-colors";

const INPUT_READONLY_CLS =
  "w-full mt-1.5 px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 " +
  "text-sm text-slate-400 cursor-not-allowed";

const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.ADMIN]: "Administrator",
  [ROLES.USER]: "Member",
};

const ROLE_BADGE = {
  [ROLES.SUPER_ADMIN]: "bg-violet-950 text-violet-300 border-violet-800",
  [ROLES.ADMIN]: "bg-emerald-950 text-emerald-300 border-emerald-800",
  [ROLES.USER]: "bg-blue-950 text-blue-300 border-blue-800",
};

/* ─── Toast ─────────────────────────────────────────────────────────────────── */
function Toast({ toast }) {
  if (!toast) return null;
  const isSuccess = toast.type === "success";
  return (
    <div
      className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium transition-all duration-300
        ${isSuccess
          ? "bg-emerald-950 border-emerald-700 text-emerald-300"
          : "bg-red-950 border-red-700 text-red-300"
        }`}
    >
      <span>{isSuccess ? "✓" : "✕"}</span>
      <span>{toast.message}</span>
    </div>
  );
}

/* ─── UserProfile ───────────────────────────────────────────────────────────── */
export default function UserProfile() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { userInfo } = useAppSelector((s) => s.user);
  const user = userInfo?.user;

  const role = user?.role;
  const isAdmin = role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;

  /* ── form state ── */
  const nameParts = (user?.name || "").split(" ");
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") || "");
  const [phone, setPhone] = useState(user?.mobileNumber || "");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  /* ── security state ── */
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  /* ── toast ── */
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── validation ── */
  const validate = () => {
    const errs = {};
    if (!firstName.trim()) errs.firstName = "First name is required.";
    const cleanPhone = phone.replace(/\s/g, "");
    if (cleanPhone && !/^\d{10,15}$/.test(cleanPhone)) {
      errs.phone = "Phone number must be 10–15 digits.";
    }
    return errs;
  };

  /* ── submit ── */
  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
    setSaving(true);
    try {
      await updateMyProfile(isAdmin, { name: fullName, mobileNumber: phone.replace(/\s/g, "") });
      dispatch(UPDATE_USER_PROFILE({ name: fullName, mobileNumber: phone.replace(/\s/g, "") }));
      showToast("Profile updated successfully.");
    } catch (err) {
      showToast(err.message || "Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── reset password ── */
  const handleResetPassword = async () => {
    setResetLoading(true);
    try {
      await forgotPassword(user?.email);
      setResetSent(true);
      showToast("Password reset link sent to your email.");
    } catch (err) {
      showToast(err.message || "Failed to send reset link.", "error");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <Toast toast={toast} />

      {/* ── Page header ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">User Account</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage your profile and security settings</p>
        </div>
      </div>

      {/* ── Identity card ── */}
      <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="rounded-2xl overflow-hidden shrink-0">
          <Avatar user={user} size="lg" />
        </div>
        <div className="text-center sm:text-left space-y-1.5">
          <h2 className="text-xl font-bold text-white">{user?.name}</h2>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <span
            className={`inline-block text-xs px-2.5 py-1 rounded-full border font-medium mt-1 ${ROLE_BADGE[role] || ROLE_BADGE[ROLES.USER]}`}
          >
            {ROLE_LABELS[role] || role}
          </span>
        </div>
      </div>

      {/* ── Profile form card ── */}
      <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">Profile Information</h3>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* First Name */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setErrors((p) => ({ ...p, firstName: "" })); }}
                className={INPUT_CLS}
                placeholder="First name"
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-400">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={INPUT_CLS}
                placeholder="Last name"
              />
            </div>

            {/* Username */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide">Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={user?.username || ""}
                  readOnly
                  className={`${INPUT_READONLY_CLS} pr-20`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-700">
                  Locked
                </span>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ""}
                  readOnly
                  className={`${INPUT_READONLY_CLS} pr-20`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-700">
                  Locked
                </span>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: "" })); }}
                className={INPUT_CLS}
                placeholder="10–15 digits"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-400">{errors.phone}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide">Role</label>
              <input
                type="text"
                value={ROLE_LABELS[role] || role || ""}
                readOnly
                className={INPUT_READONLY_CLS}
              />
            </div>
          </div>

          <div className="pt-1 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Security card ── */}
      <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">Security</h3>
        </div>
        <div className="p-4 space-y-3">
          {/* Change Password row */}
          <div className="flex items-center justify-between gap-4 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-white">Change Password</p>
              <p className="text-xs text-slate-400 mt-0.5">Update your current password</p>
            </div>
            <button
              type="button"
              onClick={() => setShowChangePwd(true)}
              className="shrink-0 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm text-white transition-colors"
            >
              Change
            </button>
          </div>

          {/* Reset Password row */}
          <div className="flex items-center justify-between gap-4 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-white">Reset Password</p>
              <p className="text-xs text-slate-400 mt-0.5">Send a reset link to your email</p>
            </div>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={resetSent || resetLoading}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors
                ${resetSent
                  ? "bg-emerald-950 border border-emerald-700 text-emerald-300 cursor-default"
                  : "bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
            >
              {resetSent ? "Link Sent" : resetLoading ? "Sending..." : "Send Link"}
            </button>
          </div>
        </div>
      </div>

      {showChangePwd && <ChangePasswordModal onClose={() => setShowChangePwd(false)} />}
    </div>
  );
}
