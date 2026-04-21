import { io } from "socket.io-client";

const getSocketUrl = () => {
  // Defensive check for window.location
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  
  // Use injected env if available, otherwise fallback to build-time env
  const injectedEnv = (window as any).ENV_INJECTED || {};
  const envUrl = injectedEnv.VITE_API_URL || import.meta.env.VITE_API_URL;
  
  if (envUrl) {
    try {
      // If it's a valid URL, use its origin
      return new URL(envUrl).origin;
    } catch (e) {
      // If it's just a path or invalid, use it as is or fallback
      if (envUrl.startsWith("http")) {
        console.warn("Invalid VITE_API_URL, falling back to origin:", envUrl);
      } else {
        // Might be a relative path or just a hostname
        return envUrl;
      }
    }
  }
  return origin;
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
