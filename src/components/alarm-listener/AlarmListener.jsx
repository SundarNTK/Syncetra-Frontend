import { useEffect } from "react";
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
  const isUser = userInfo?.user?.role === ROLES.USER;

  // Listen for postMessage from the service worker when user taps a background
  // notification. The SW sends FCM_ALARM_CLICK with alarmId so the popup opens.
  useEffect(() => {
    if (!isUser || !userInfo?.token) return;

    const params = new URLSearchParams(window.location.search);
    const alarmFromUrl = params.get("alarm");
    if (alarmFromUrl) {
      getUserActiveAlarm()
        .then((res) => {
          if (res?.data) dispatch(SET_ACTIVE_ALARM(res.data));
        })
        .catch(() => {});
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
  }, [isUser, userInfo?.token, dispatch]);

  useEffect(() => {
    if (!isUser || !userInfo?.token) return;

    const socket = connectSocket(userInfo);

    const checkActive = async () => {
      try {
        const res = await getUserActiveAlarm();
        if (res?.data) {
          dispatch(SET_ACTIVE_ALARM(res.data));
        }
      } catch {
        /* ignore */
      }
    };

    const loadGroups = async () => {
      try {
        const res = await getUserGroups();
        const ids = (res?.data || []).map((g) => g._id);
        joinGroupRooms(ids);
      } catch {
        /* ignore */
      }
    };

    requestNotificationPermission();
    checkActive();
    loadGroups();

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

    return () => {
      socket.off("alarm:triggered");
      socket.off("alarm:cancelled");
      socket.off("alarm:completed");
      socket.off("task:assigned");
    };
  }, [isUser, userInfo, dispatch]);

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
