import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { SET_ACTIVE_ALARM, CLEAR_ACTIVE_ALARM, ADD_TASK_NOTIFICATION } from "../../store/userSlice";
import { connectSocket, joinGroupRooms } from "../../services/socketService";
import { getUserGroups } from "../../services/groups";
import { getUserActiveAlarm } from "../../services/alarms";
import { requestNotificationPermission, showAlarmNotification } from "../../utils/notifications";
import AlarmPopup from "../alarm-popup/AlarmPopup";
import { ROLES } from "../../constants/enum";

export default function AlarmListener({ children }) {
  const dispatch = useAppDispatch();
  const { userInfo, activeAlarm } = useAppSelector((s) => s.user);
  const token = userInfo?.token;
  const isUser = userInfo?.user?.role === ROLES.USER;

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
      socket.off("alarm:cancelled");
      socket.off("alarm:completed");
      socket.off("task:assigned");
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isUser, token, userInfo, dispatch, syncAlarmState, joinMemberGroups]);

  return (
    <>
      {children}
      {activeAlarm && (
        <AlarmPopup
          alarm={activeAlarm}
          onStopped={() => dispatch(CLEAR_ACTIVE_ALARM())}
        />
      )}
    </>
  );
}
