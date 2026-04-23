import { useEffect, useState } from "react";
import { socket } from "../lib/socket";

export function usePresence() {
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);

  useEffect(() => {
    const handleUpdate = (data: { onlineCount: number; onlineUserIds: number[] }) => {
      setOnlineCount(data.onlineCount);
      setOnlineUserIds(data.onlineUserIds);
    };

    socket.on("presence:update", handleUpdate);
    
    // Request initial presence if needed or wait for next broadcast
    return () => {
      socket.off("presence:update", handleUpdate);
    };
  }, []);

  return { onlineCount, onlineUserIds };
}
