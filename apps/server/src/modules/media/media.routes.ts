import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";
import { uploadMedia, listMedia, removeMedia, listTaggedMedia } from "./media.controller.js";

const router = Router();

// Configure multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 60 * 1024 * 1024, // 60MB max file size
  },
});

// Media endpoints
router.post(
  "/events/:eventId/media",
  authMiddleware,
  upload.array("files", 15), // Supports uploading up to 15 files simultaneously under the key "files"
  uploadMedia,
);

router.get("/events/:eventId/media", authMiddleware, listMedia);
router.get("/tagged", authMiddleware, listTaggedMedia);
router.delete("/:mediaId", authMiddleware, removeMedia);

export default router;
