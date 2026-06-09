import {
  createDbNotification,
  getNotificationsByUserId,
  markAsReadById,
  markAllReadByUserId,
} from "./notifications.repository.js";
import { sendRealtimeNotification } from "../../common/services/socket.io.js";
import type { UserSummary } from "@repo/contracts";
import { ApiError } from "../../common/errors/ApiError.js";

export const createNotification = async (userId: string, message: string) => {
  const notification = await createDbNotification(userId, message);
  
  // Try pushing via WebSockets
  try {
    sendRealtimeNotification(userId, notification);
  } catch (err) {
    console.error("Realtime notification push failed:", err);
  }

  return notification;
};

export const getUserNotifications = async (user: UserSummary) => {
  return getNotificationsByUserId(user.id);
};

export const readNotification = async (notificationId: string, user: UserSummary) => {
  return markAsReadById(notificationId);
};

export const readAllNotifications = async (user: UserSummary) => {
  return markAllReadByUserId(user.id);
};
