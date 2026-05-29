import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { SET_ACTIVE_ALARM } from "../../store/userSlice";
import { registerDeviceForPush } from "../../utils/fcm";
import { showAlarmNotification } from "../../utils/notifications";

/**
 * Registers FCM after login and handles foreground push → active alarm UI.
 */
export default function FcmBootstrap() {
  const dispatch = useAppDispatch();
  const { isLogin, userInfo } = useAppSelector((s) => s.user);

  useEffect(() => {
    if (!isLogin || userInfo?.user?.role !== "user") return;

    registerDeviceForPush((alarmPayload) => {
      dispatch(SET_ACTIVE_ALARM(alarmPayload));
      showAlarmNotification({
        title: alarmPayload.title,
        body: alarmPayload.description,
        alarmId: alarmPayload.alarmId,
      });
    }, userInfo?.token);
  }, [isLogin, userInfo?.token, userInfo?.user?.role, dispatch]);

  return null;
}
