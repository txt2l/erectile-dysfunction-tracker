import "dotenv/config";
import "tsconfig-paths/register";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { Server as SocketIOServer } from "socket.io";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { setupPresence } from "../socket/presence";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "../../shared/const";
import { parse as parseCookieHeader } from "cookie";

async function startServer() {
  console.log("[Server] Starting with ENV:", {
    VITE_OAUTH_PORTAL_URL: process.env.VITE_OAUTH_PORTAL_URL || process.env.OAUTH_PORTAL_URL || "MISSING",
    OAUTH_PORTAL_URL: process.env.OAUTH_PORTAL_URL || "MISSING",
    VITE_APP_ID: process.env.VITE_APP_ID || process.env.APP_ID || "MISSING",
    NODE_ENV: process.env.NODE_ENV
  });
  const app = express();
  const server = createServer(app);

  // Socket.IO for real-time chat
  const io = new SocketIOServer(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/api/socket.io",
  });

  // Socket.IO Middleware for Authentication
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      if (!cookieHeader) return next(new Error("Authentication error: No cookies"));
      
      const cookies = parseCookieHeader(cookieHeader);
      const sessionCookie = cookies[COOKIE_NAME];
      if (!sessionCookie) return next(new Error("Authentication error: No session cookie"));

      const user = await sdk.authenticateRequest({ headers: { cookie: cookieHeader } } as any);
      socket.data.userId = user.id;
      socket.data.userName = user.name;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  // Setup Presence Tracking
  setupPresence(io);

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id} (User: ${socket.data.userId})`);

    socket.on("join_room", (roomId: string) => {
      socket.join(`room:${roomId}`);
      console.log(`[Socket.IO] ${socket.id} joined room:${roomId}`);
    });

    socket.on("leave_room", (roomId: string) => {
      socket.leave(`room:${roomId}`);
    });

    socket.on("new_message", (data: { roomId: number; message: any }) => {
      io.to(`room:${data.roomId}`).emit("message", data.message);
    });

    socket.on("typing", (data: { roomId: number; userName: string }) => {
      socket.to(`room:${data.roomId}`).emit("user_typing", { userName: data.userName });
    });

    socket.on("stop_typing", (data: { roomId: number; userName: string }) => {
      socket.to(`room:${data.roomId}`).emit("user_stop_typing", { userName: data.userName });
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    console.log("[Server] Production mode detected, serving static files...");
    serveStatic(app);
  }

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  const port = Number(process.env.PORT || 3000);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer().catch(console.error);
