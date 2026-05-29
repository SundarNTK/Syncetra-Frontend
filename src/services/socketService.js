import { io } from "socket.io-client";
import CONFIG from "../config";

let socket = null;

export const connectSocket = (userInfo) => {
  if (socket?.connected) return socket;

  socket = io(CONFIG.socketUrl, {
    auth: {
      userId: userInfo?.user?.id || userInfo?.user?._id,
      role: userInfo?.user?.role,
    },
    transports: ["websocket", "polling"],
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const joinGroupRooms = (groupIds = []) => {
  if (!socket) return;
  groupIds.forEach((id) => {
    socket.emit("join-group", id);
  });
};
