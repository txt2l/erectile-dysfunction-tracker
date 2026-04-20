import { Server, Socket } from "socket.io";

const onlineUsers = new Map<string, number>(); // socketId -> userId

export function setupPresence(io: Server) {
  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    if (userId) {
      onlineUsers.set(socket.id, userId);
      broadcastPresence(io);
    }

    socket.on("disconnect", () => {
      onlineUsers.delete(socket.id);
      broadcastPresence(io);
    });
  });
}

function broadcastPresence(io: Server) {
  const uniqueUserIds = new Set(onlineUsers.values());
  io.emit("presence:update", { 
    onlineCount: uniqueUserIds.size,
    onlineUserIds: Array.from(uniqueUserIds)
  });
}

export function getOnlineCount() {
  return new Set(onlineUsers.values()).size;
}
