import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { CLEAR_USER } from "../../store/userSlice";
import { disconnectSocket } from "../../services/socketService";
import { ROLES } from "../../constants/enum";
import TaskAcknowledgmentNotifier from "../task-acknowledgment/TaskAcknowledgmentNotifier";

export default function MainLayout({ navItems = [] }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { userInfo } = useAppSelector((s) => s.user);
  const role = userInfo?.user?.role;
  const isAdmin = role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
  const isMember = role === ROLES.USER;

  const logout = () => {
    disconnectSocket();
    dispatch(CLEAR_USER());
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {isMember && <TaskAcknowledgmentNotifier />}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div>
          <h1 className="text-lg font-bold text-red-500">Group Alarm</h1>
          <p className="text-xs text-slate-400">
            {userInfo?.user?.name} · {isAdmin ? "Admin" : "Member"}
          </p>
        </div>
        <button
          onClick={logout}
          className="text-sm px-3 py-1 rounded bg-slate-700 hover:bg-slate-600"
        >
          Logout
        </button>
      </header>

      <nav className="bg-slate-800/80 border-b border-slate-700 px-2 py-2 flex gap-2 overflow-x-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="text-sm whitespace-nowrap px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-red-600/80"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <main className="flex-1 p-4 max-w-3xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
