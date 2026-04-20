import { io } from "socket.io-client";

const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    try {
      return new URL(envUrl).origin;
    } catch (e) {
      console.warn("Invalid VITE_API_URL, falling back to origin:", envUrl);
    }
  }
  return window.location.origin;
};

export const socket = io(getSocketUrl(), {
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
