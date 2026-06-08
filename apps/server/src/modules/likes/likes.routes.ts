import { Router } from "express";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";
import { handleToggleLike, handleListLikes } from "./likes.controller.js";

const router = Router();

router.post("/:mediaId/like", authMiddleware, handleToggleLike);
router.get("/:mediaId/likes", handleListLikes);

export default router;
