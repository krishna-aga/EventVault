import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";
import {
  uploadMedia,
  listMedia,
  removeMedia,
  listTaggedMedia,
  listUserMedia,
  analyzeMedia,
  downloadMedia,
  retroactiveScan,
} from "./media.controller.js";

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
  upload.array("files", 15),
  uploadMedia,
);

router.post(
  "/analyze",
  authMiddleware,
  upload.single("file"),
  analyzeMedia,
);

router.post("/retroactive-scan", authMiddleware, retroactiveScan);

router.get("/events/:eventId/media", authMiddleware, listMedia);
router.get("/tagged", authMiddleware, listTaggedMedia);
router.get("/me/uploads", authMiddleware, listUserMedia);
router.get("/:mediaId/download", authMiddleware, downloadMedia);
router.delete("/:mediaId", authMiddleware, removeMedia);

export default router;
