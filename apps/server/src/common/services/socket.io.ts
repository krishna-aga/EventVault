import { Server, Socket } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { corsOptions } from "../../config/cors.js";

// Map to store connected user sessions: userId -> socketId
const userSocketMap = new Map<string, string>();
let ioServer: Server | null = null;

export const initializeSocket = (server: any): Server => {
  ioServer = new Server(server, {
    cors: corsOptions,
  });

  ioServer.on("connection", (socket: Socket) => {
    // Expect registration with user ID
    socket.on("register", (userId: string) => {
      if (userId) {
        userSocketMap.set(userId, socket.id);
        console.log(`Socket registered: User ${userId} on socket ${socket.id}`);
      }
    });

    socket.on("disconnect", () => {
      // Find and remove from map
      for (const [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          console.log(`Socket disconnected: User ${userId}`);
          break;
        }
      }
    });
  });

  return ioServer;
};

export const sendRealtimeNotification = (
  userId: string,
  notificationData: any,
): boolean => {
  if (!ioServer) return false;
  
  const socketId = userSocketMap.get(userId);
  if (socketId) {
    ioServer.to(socketId).emit("notification", notificationData);
    console.log(`Real-time notification pushed to User ${userId}`);
    return true;
  }
  
  return false;
};
