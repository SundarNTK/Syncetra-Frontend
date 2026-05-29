import { createSlice } from "@reduxjs/toolkit";
import { STORAGE_KEYS } from "../constants/storage";

const loadUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const loadTaskNotifications = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASK_NOTIFICATIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const initialState = {
  isLogin: !!loadUser()?.token,
  userInfo: loadUser(),
  activeAlarm: null,
  pendingTaskNotifications: loadTaskNotifications(),
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    SET_USER_INFO: (state, action) => {
      state.isLogin = true;
      state.userInfo = action.payload;
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(action.payload));
    },
    CLEAR_USER: (state) => {
      state.isLogin = false;
      state.userInfo = null;
      state.activeAlarm = null;
      state.pendingTaskNotifications = [];
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.TASK_NOTIFICATIONS);
    },
    SET_ACTIVE_ALARM: (state, action) => {
      state.activeAlarm = action.payload;
    },
    CLEAR_ACTIVE_ALARM: (state) => {
      state.activeAlarm = null;
    },
    UPDATE_USER_PROFILE: (state, action) => {
      if (state.userInfo?.user) {
        state.userInfo.user = { ...state.userInfo.user, ...action.payload };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(state.userInfo));
      }
    },
    ADD_TASK_NOTIFICATION: (state, action) => {
      const exists = state.pendingTaskNotifications.some(
        (n) => n.taskId === action.payload.taskId
      );
      if (!exists) {
        state.pendingTaskNotifications.push(action.payload);
        localStorage.setItem(
          STORAGE_KEYS.TASK_NOTIFICATIONS,
          JSON.stringify(state.pendingTaskNotifications)
        );
      }
    },
    DISMISS_TASK_NOTIFICATION: (state, action) => {
      state.pendingTaskNotifications = state.pendingTaskNotifications.filter(
        (n) => n.taskId !== action.payload
      );
      localStorage.setItem(
        STORAGE_KEYS.TASK_NOTIFICATIONS,
        JSON.stringify(state.pendingTaskNotifications)
      );
    },
  },
});

export const {
  SET_USER_INFO,
  CLEAR_USER,
  SET_ACTIVE_ALARM,
  CLEAR_ACTIVE_ALARM,
  UPDATE_USER_PROFILE,
  ADD_TASK_NOTIFICATION,
  DISMISS_TASK_NOTIFICATION,
} = userSlice.actions;
export default userSlice.reducer;
