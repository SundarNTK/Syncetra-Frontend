import { apiGet, apiPost, apiPut } from "../utils/http";
import { API_SCOPE } from "../constants/enum";
import EndPoints from "../constants/endPoints";

export const scheduleAlarm = (data) =>
  apiPost(API_SCOPE.ADMIN, EndPoints.ALARMS, data);

export const triggerEmergency = (data) =>
  apiPost(API_SCOPE.ADMIN, EndPoints.ALARMS_EMERGENCY, data);

export const testTriggerAlarm = (data) =>
  apiPost(API_SCOPE.ADMIN, EndPoints.ALARMS_TEST_TRIGGER, data);

export const triggerAlarmNow = (id) =>
  apiPost(API_SCOPE.ADMIN, EndPoints.ALARM_TRIGGER_NOW(id), {});

export const getAdminAlarms = () => apiGet(API_SCOPE.ADMIN, EndPoints.ALARMS);
export const getActiveAdminAlarms = () =>
  apiGet(API_SCOPE.ADMIN, EndPoints.ALARMS_ACTIVE);

export const getStopCode = (id) =>
  apiGet(API_SCOPE.ADMIN, EndPoints.ALARM_STOP_CODE(id));

export const cancelAlarm = (id) =>
  apiPut(API_SCOPE.ADMIN, EndPoints.ALARM_CANCEL(id));

export const getAlarmLogs = (id) =>
  apiGet(API_SCOPE.ADMIN, EndPoints.ALARM_LOGS(id));

export const getUserActiveAlarm = () =>
  apiGet(API_SCOPE.USER, EndPoints.ALARMS_ACTIVE);

export const stopAlarm = (id, code) =>
  apiPost(API_SCOPE.USER, EndPoints.ALARM_STOP(id), { code });

export const getUserAlarmHistory = () =>
  apiGet(API_SCOPE.USER, EndPoints.ALARMS_HISTORY);
