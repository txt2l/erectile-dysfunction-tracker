import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;

export const socket = io(socketUrl, {
  path: "/api/socket.io",
  autoConnect: true,
  withCredentials: true,
});

socket.on("connect", () => {
  console.log("[Socket.IO] Connected to server");
});

socket.on("connect_error", (err) => {
  console.error("[Socket.IO] Connection error:", err.message);
});
