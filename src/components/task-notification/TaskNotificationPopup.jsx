import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { DISMISS_TASK_NOTIFICATION } from "../../store/userSlice";

export default function TaskNotificationPopup() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notifications = useAppSelector((s) => s.user.pendingTaskNotifications);
  const current = notifications[0];

  if (!current) return null;

  const firstName = (current.assignedBy || "").split(" ")[0] || "Admin";
  const dismiss = (taskId) => dispatch(DISMISS_TASK_NOTIFICATION(taskId));

  const handleView = () => {
    dismiss(current.taskId);
    navigate("/user/tasks");
  };

  return createPortal(
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-[fadeSlideUp_0.3s_ease-out_both]">
        <style>{`
          @keyframes fadeSlideUp {
            0% { opacity: 0; transform: translateY(24px) scale(0.97); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm">New Task Assigned</p>
            <p className="text-emerald-400 text-xs font-medium">Action required</p>
          </div>
          {notifications.length > 1 && (
            <span className="ml-auto text-xs bg-emerald-900/60 border border-emerald-700 text-emerald-300 px-2 py-0.5 rounded-full">
              +{notifications.length - 1} more
            </span>
          )}
        </div>

        {/* Body */}
        <div className="px-5 pb-2">
          <div className="bg-slate-800/60 rounded-xl p-4 space-y-2.5 border border-slate-700/40">
            <p className="text-slate-200 text-sm leading-relaxed">
              <span className="text-emerald-300 font-semibold">{firstName}</span>
              {" "}has assigned you a task
              {current.tripName ? (
                <> for <span className="text-white font-semibold">{current.tripName}</span></>
              ) : null}
              . Kindly respond now.
            </p>

            {current.title && (
              <div className="flex items-start gap-2">
                <span className="w-0.5 self-stretch bg-emerald-500 rounded-full shrink-0 mt-0.5" />
                <p className="text-white text-sm font-medium">{current.title}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 py-4">
          <button
            type="button"
            onClick={() => dismiss(current.taskId)}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Later
          </button>
          <button
            type="button"
            onClick={handleView}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition-colors shadow-lg shadow-emerald-900/40"
          >
            View Task
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
