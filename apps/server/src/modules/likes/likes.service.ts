import { ApiError } from "../../common/errors/ApiError.js";
import { findMediaById } from "../media/media.repository.js";
import { findLike, createLike, deleteLike, getLikesByMediaId } from "./likes.repository.js";
import { createNotification } from "../notifications/notifications.service.js";
import type { UserSummary } from "@repo/contracts";

export const toggleLike = async (mediaId: string, user: UserSummary) => {
  const mediaItem = await findMediaById(mediaId);
  if (!mediaItem) {
    throw new ApiError(404, "Media item not found");
  }

  const existingLike = await findLike(user.id, mediaId);
  if (existingLike) {
    await deleteLike(user.id, mediaId);
    return { liked: false };
  } else {
    const like = await createLike(user.id, mediaId);
    
    // Trigger notification if uploader is not the liker
    if (mediaItem.uploadedById !== user.id) {
      try {
        await createNotification(
          mediaItem.uploadedById,
          `${user.name} liked your uploaded media item.`
        );
      } catch (err) {
        console.error("Failed to trigger like notification:", err);
      }
    }
    
    return { liked: true, like };
  }
};

export const listLikes = async (mediaId: string) => {
  const likes = await getLikesByMediaId(mediaId);
  return {
    count: likes.length,
    users: likes.map((like) => like.user),
  };
};
