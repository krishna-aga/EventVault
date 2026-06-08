import type { RequestHandler } from "express";
import { ApiError } from "../../common/errors/ApiError.js";
import { sendSuccess } from "../../common/utils/response.js";
import {
  getUserNotifications,
  readNotification,
  readAllNotifications,
} from "./notifications.service.js";

export const handleListNotifications: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const result = await getUserNotifications(req.user as any);
    sendSuccess(res, "Notifications loaded successfully", { notifications: result });
  } catch (error) {
    next(error);
  }
};

export const handleReadNotification: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const notificationId = req.params.notificationId as string;
    if (!notificationId) {
      throw new ApiError(400, "Notification ID is required");
    }

    const result = await readNotification(notificationId, req.user as any);
    sendSuccess(res, "Notification marked as read", result);
  } catch (error) {
    next(error);
  }
};

export const handleReadAllNotifications: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    await readAllNotifications(req.user as any);
    sendSuccess(res, "All notifications marked as read", null);
  } catch (error) {
    next(error);
  }
};
