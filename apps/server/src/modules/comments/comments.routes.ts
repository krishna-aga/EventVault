import { Router } from "express";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";
import { handleAddComment, handleListComments, handleRemoveComment } from "./comments.controller.js";

const router = Router();

router.post("/:mediaId/comments", authMiddleware, handleAddComment);
router.get("/:mediaId/comments", handleListComments);
router.delete("/comments/:commentId", authMiddleware, handleRemoveComment);

export default router;
