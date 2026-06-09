import { Router } from "express";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";
import {
  handleListNotifications,
  handleReadNotification,
  handleReadAllNotifications,
} from "./notifications.controller.js";

const router = Router();

router.get("/", authMiddleware, handleListNotifications);
router.patch("/:notificationId/read", authMiddleware, handleReadNotification);
router.post("/read-all", authMiddleware, handleReadAllNotifications);

export default router;
