import { Server, Socket } from "socket.io";

// PDF: Track onlineUsers (Set of userIds)
const onlineUsers = new Set<string>();

export function setupPresence(io: Server) {
  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    if (userId) {
      onlineUsers.add(userId);
      broadcastPresence(io);
    }

    socket.on("disconnect", () => {
      // Note: This is a simplified version. In a real app, you'd track multiple sockets per user.
      if (userId) {
        onlineUsers.delete(userId);
        broadcastPresence(io);
      }
    });
  });
}

function broadcastPresence(io: Server) {
  // PDF: Emit presence:update with online count
  io.emit("presence:update", { 
    online: onlineUsers.size,
    onlineUserIds: Array.from(onlineUsers)
  });
}

export function getOnlineCount() {
  return onlineUsers.size;
}
