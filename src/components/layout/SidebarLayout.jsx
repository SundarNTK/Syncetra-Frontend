import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAppSelector } from "../../hooks";
import { ROLES } from "../../constants/enum";
import { SyncetraBrand, LOGO_ICON } from "../brand/SyncetraLogo";
import ProfileDropdown from "../profile/ProfileDropdown";
import TaskNotificationPopup from "../task-notification/TaskNotificationPopup";

function ChevronLeft() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

const TOGGLE_BTN =
  "hidden sm:flex shrink-0 items-center justify-center w-7 h-7 rounded-full " +
  "bg-slate-800 hover:bg-emerald-700 border border-slate-700 hover:border-emerald-600 " +
  "text-slate-400 hover:text-white shadow-sm transition-all duration-200";

export default function SidebarLayout({ menuItems = [], title = "Syncetra" }) {
  const { userInfo } = useAppSelector((s) => s.user);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const role = userInfo?.user?.role;
  const isSuperAdmin = role === ROLES.SUPER_ADMIN;
  const isAdminSide = role === ROLES.ADMIN || isSuperAdmin;
  const base = isAdminSide ? "/admin" : "/user";

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside className={`${collapsed ? "w-20" : "w-64"} fixed sm:relative z-50 sm:z-auto flex flex-col border-r border-slate-800 bg-slate-900/95 transition-all duration-300 shrink-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"} h-screen sm:h-auto`}>

        {/* Logo / brand area with collapse toggle inside */}
        <div className="border-b border-slate-800 p-3 sm:p-4">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2.5">
              <img src={LOGO_ICON} alt="Syncetra" className="w-10 h-10 object-contain" />
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                title="Expand sidebar"
                className={TOGGLE_BTN}
              >
                <ChevronRight />
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0 space-y-2">
                <SyncetraBrand variant="full" size="sm" />
                <p className="text-xs text-emerald-400/90 font-medium">{title}</p>
                <p className="text-xs text-slate-400 truncate">{userInfo?.user?.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                title="Collapse sidebar"
                className={`${TOGGLE_BTN} mt-0.5`}
              >
                <ChevronLeft />
              </button>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={`${base}${item.path}`}
              end
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-900/30"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <span className="text-lg w-6 text-center shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 w-full">
        <header className="h-14 border-b border-slate-800 flex items-center px-4 sm:px-6 bg-slate-900/50 backdrop-blur sticky top-0 z-30">
          <button type="button" onClick={() => setMobileMenuOpen(true)} className="sm:hidden mr-3 p-2 rounded-lg bg-slate-800 text-slate-300">☰</button>
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
            {isSuperAdmin ? "Super Admin" : isAdminSide ? "Administrator" : "Member"}
          </span>
          <div className="ml-auto"><ProfileDropdown base={base} /></div>
        </header>
        <main className="flex-1 w-full min-w-0 p-4 sm:p-6 overflow-auto">
          <div className="w-full max-w-none"><Outlet /></div>
        </main>
      </div>

      {/* Task notification popup — members only */}
      {!isAdminSide && <TaskNotificationPopup />}
    </div>
  );
}
