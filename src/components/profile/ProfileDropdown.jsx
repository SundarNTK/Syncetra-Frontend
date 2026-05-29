import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { CLEAR_USER } from "../../store/userSlice";
import { disconnectSocket } from "../../services/socketService";

/* ─── Avatar ──────────────────────────────────────────────────────────────── */
export function Avatar({ user, size = "md" }) {
  const sizeMap = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-20 h-20 text-2xl",
  };

  const initials = (user?.name || "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");

  if (user?.profileImage) {
    return (
      <img
        src={user.profileImage}
        alt={user.name}
        className={`${sizeMap[size]} rounded-full object-cover shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeMap[size]} rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white shrink-0 select-none`}
    >
      {initials || "?"}
    </div>
  );
}

/* ─── ProfileDropdown ─────────────────────────────────────────────────────── */
export default function ProfileDropdown({ base }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { userInfo } = useAppSelector((s) => s.user);
  const user = userInfo?.user;

  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const wrapRef = useRef(null);

  const firstName = (user?.name || "").split(" ")[0];

  /* close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const doLogout = () => {
    disconnectSocket();
    dispatch(CLEAR_USER());
    navigate("/login", { replace: true });
  };

  return (
    <>
      <div className="relative" ref={wrapRef}>
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <Avatar user={user} size="sm" />
          <span className="hidden sm:block text-sm text-slate-200 font-medium max-w-[120px] truncate">
            {firstName}
          </span>
          {/* chevron */}
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown panel */}
        <div
          className={`absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/40 transition-all duration-200 origin-top-right z-50
            ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800">
            <Avatar user={user} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(`${base}/profile`);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              User Account
            </button>

            <div className="my-1.5 border-t border-slate-800" />

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setShowConfirm(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-950/60 hover:text-red-300 transition-colors text-left"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Logout confirmation dialog — rendered via portal to escape sticky header stacking context */}
      {showConfirm && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-950/60 border border-red-800/50 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Sign out?</h2>
              <p className="text-sm text-slate-400 mt-1">
                You'll need to sign in again to access your account.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={doLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-medium text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
