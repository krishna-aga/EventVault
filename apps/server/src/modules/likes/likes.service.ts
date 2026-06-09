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
    
    // Notify uploader and tagged users (excluding the liker)
    const recipients = new Set<string>();
    if (mediaItem.uploadedById !== user.id) {
      recipients.add(mediaItem.uploadedById);
    }
    if (mediaItem.tags) {
      for (const tag of mediaItem.tags) {
        if (tag.userId !== user.id) {
          recipients.add(tag.userId);
        }
      }
    }

    for (const recipientId of recipients) {
      try {
        const message = recipientId === mediaItem.uploadedById
          ? `${user.name} liked your uploaded media item.`
          : `${user.name} liked a photo you are tagged in.`;
        await createNotification(recipientId, message);
      } catch (err) {
        console.error(`Failed to trigger like notification for user ${recipientId}:`, err);
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
