import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { SET_ACTIVE_ALARM, CLEAR_ACTIVE_ALARM, ADD_TASK_NOTIFICATION } from "../../store/userSlice";
import { connectSocket, joinGroupRooms } from "../../services/socketService";
import { getUserGroups } from "../../services/groups";
import { getUserActiveAlarm } from "../../services/alarms";
import { requestNotificationPermission, showAlarmNotification } from "../../utils/notifications";
import AlarmPopup from "../alarm-popup/AlarmPopup";
import { ROLES } from "../../constants/enum";

function ScheduledAlarmToast({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-[9990] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto bg-slate-800 border border-blue-500/50 rounded-xl px-4 py-3 shadow-2xl flex items-start gap-3 animate-slide-in"
          style={{ boxShadow: "0 0 24px rgba(59,130,246,0.25)" }}
        >
          <span className="text-2xl shrink-0">📅</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-300">New Alarm Scheduled</p>
            <p className="text-sm text-white font-medium truncate">{t.title}</p>
            {t.description ? (
              <p className="text-xs text-slate-400 mt-0.5 truncate">{t.description}</p>
            ) : null}
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="shrink-0 text-slate-500 hover:text-slate-300 text-lg leading-none mt-0.5"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default function AlarmListener({ children }) {
  const dispatch = useAppDispatch();
  const { userInfo, activeAlarm } = useAppSelector((s) => s.user);
  const token = userInfo?.token;
  const isUser = userInfo?.user?.role === ROLES.USER;
  const [scheduledToasts, setScheduledToasts] = useState([]);
  const toastTimers = useRef({});

  const syncAlarmState = useCallback(async () => {
    if (!isUser || !token) return;
    try {
      const res = await getUserActiveAlarm();
      if (res?.data) {
        dispatch(SET_ACTIVE_ALARM(res.data));
      } else {
        dispatch(CLEAR_ACTIVE_ALARM());
      }
    } catch {
      /* ignore */
    }
  }, [isUser, token, dispatch]);

  const addScheduledToast = useCallback((payload) => {
    const id = payload.alarmId || String(Date.now());
    setScheduledToasts((prev) => {
      if (prev.some((t) => t.id === id)) return prev;
      return [...prev, { id, title: payload.title, description: payload.description }];
    });
    toastTimers.current[id] = setTimeout(() => {
      setScheduledToasts((prev) => prev.filter((t) => t.id !== id));
      delete toastTimers.current[id];
    }, 6000);
  }, []);

  const dismissToast = useCallback((id) => {
    clearTimeout(toastTimers.current[id]);
    delete toastTimers.current[id];
    setScheduledToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const joinMemberGroups = useCallback(async () => {
    if (!isUser || !token) return;
    try {
      const res = await getUserGroups();
      joinGroupRooms((res?.data || []).map((g) => g._id));
    } catch {
      /* ignore */
    }
  }, [isUser, token]);

  // Listen for postMessage from the service worker when user taps a background
  // notification. The SW sends FCM_ALARM_CLICK with alarmId so the popup opens.
  useEffect(() => {
    if (!isUser || !token) return;

    const params = new URLSearchParams(window.location.search);
    const alarmFromUrl = params.get("alarm");
    if (alarmFromUrl) {
      syncAlarmState();
      params.delete("alarm");
      const qs = params.toString();
      const next = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
      window.history.replaceState({}, "", next);
    }

    const handleSwMessage = (event) => {
      if (event.data?.type === "FCM_ALARM_CLICK" && event.data?.alarmId) {
        dispatch(
          SET_ACTIVE_ALARM({
            alarmId: event.data.alarmId,
            _id: event.data.alarmId,
            title: event.data.data?.title || "GROUP ALARM",
            description: event.data.data?.body || "",
            status: "active",
          })
        );
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleSwMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleSwMessage);
    };
  }, [isUser, token, dispatch, syncAlarmState]);

  useEffect(() => {
    if (!isUser || !token) return;

    const socket = connectSocket(userInfo);

    const bootstrap = () => {
      requestNotificationPermission();
      syncAlarmState();
      joinMemberGroups();
    };

    bootstrap();
    socket.on("connect", bootstrap);

    socket.on("alarm:triggered", (payload) => {
      dispatch(
        SET_ACTIVE_ALARM({
          ...payload,
          _id: payload.alarmId || payload._id,
        })
      );
      showAlarmNotification({
        title: `ALARM: ${payload.title}`,
        body: payload.description || "Enter the stop code in the app.",
        alarmId: payload.alarmId,
      });
    });

    socket.on("alarm:scheduled", (payload) => {
      addScheduledToast(payload);
      showAlarmNotification({
        title: `📅 Alarm Scheduled: ${payload.title}`,
        body: payload.description || "A new alarm has been scheduled for your group.",
        alarmId: payload.alarmId,
      });
    });

    socket.on("alarm:cancelled", () => {
      dispatch(CLEAR_ACTIVE_ALARM());
    });

    socket.on("alarm:completed", () => {
      dispatch(CLEAR_ACTIVE_ALARM());
    });

    socket.on("task:assigned", (payload) => {
      dispatch(
        ADD_TASK_NOTIFICATION({
          taskId: payload.taskId || payload._id,
          title: payload.title || "",
          assignedBy: payload.assignedBy?.name || payload.assignedByName || "Super Admin",
          tripName: payload.tripName || "",
          tripId: payload.tripId || "",
          assignedAt: Date.now(),
        })
      );
    });

    const onVisible = () => {
      if (document.visibilityState === "visible") bootstrap();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      socket.off("connect", bootstrap);
      socket.off("alarm:triggered");
      socket.off("alarm:scheduled");
      socket.off("alarm:cancelled");
      socket.off("alarm:completed");
      socket.off("task:assigned");
      document.removeEventListener("visibilitychange", onVisible);
      Object.values(toastTimers.current).forEach(clearTimeout);
    };
  }, [isUser, token, userInfo, dispatch, syncAlarmState, joinMemberGroups, addScheduledToast]);

  return (
    <>
      {children}
      <ScheduledAlarmToast toasts={scheduledToasts} onDismiss={dismissToast} />
      {activeAlarm && (
        <AlarmPopup
          alarm={activeAlarm}
          onStopped={() => dispatch(CLEAR_ACTIVE_ALARM())}
        />
      )}
    </>
  );
}
