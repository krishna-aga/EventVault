import { ApiError } from "../../common/errors/ApiError.js";
import { findMediaById } from "../media/media.repository.js";
import {
  createComment,
  findCommentById,
  deleteCommentById,
  getCommentsByMediaId,
} from "./comments.repository.js";
import { createNotification } from "../notifications/notifications.service.js";
import type { UserSummary } from "@repo/contracts";

export const addComment = async (
  mediaId: string,
  content: string,
  user: UserSummary,
) => {
  if (!content || !content.trim()) {
    throw new ApiError(400, "Comment content cannot be empty");
  }

  const mediaItem = await findMediaById(mediaId);
  if (!mediaItem) {
    throw new ApiError(404, "Media item not found");
  }

  const comment = await createComment(user.id, mediaId, content.trim());

  // Trigger notification if uploader is not the commenter
  if (mediaItem.uploadedById !== user.id) {
    try {
      await createNotification(
        mediaItem.uploadedById,
        `${user.name} commented on your media file: "${content.substring(0, 30)}${content.length > 30 ? "..." : ""}"`
      );
    } catch (err) {
      console.error("Failed to trigger comment notification:", err);
    }
  }

  return comment;
};

export const getComments = async (mediaId: string) => {
  const mediaItem = await findMediaById(mediaId);
  if (!mediaItem) {
    throw new ApiError(404, "Media item not found");
  }
  return getCommentsByMediaId(mediaId);
};

export const removeComment = async (commentId: string, user: UserSummary) => {
  const comment = await findCommentById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  // Deletion permission: uploader of media, creator of comment, or admin
  const isCommentOwner = comment.userId === user.id;
  const isMediaOwner = comment.media.uploadedById === user.id;
  const hasPermission = isCommentOwner || isMediaOwner || user.role === "ADMIN";

  if (!hasPermission) {
    throw new ApiError(403, "Access Denied: You do not have permission to delete this comment");
  }

  return deleteCommentById(commentId);
};
