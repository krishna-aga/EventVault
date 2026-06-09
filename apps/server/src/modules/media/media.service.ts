import { ApiError } from "../../common/errors/ApiError.js";
import { uploadFile, deleteFile, signFileUrl } from "../../common/services/storage.service.js";
import {
  findEventById,
  findClubMember,
  createUploadBatch,
  createMedia,
  findMediaById,
  deleteMediaById,
  findMediaByEventId,
  findMediaByHash,
  createMediaTag,
  findMediaByTagUserId,
} from "./media.repository.js";
import type { UserSummary } from "@repo/contracts";
import crypto from "node:crypto";
import path from "node:path";
import { detectLabels, generateCaption, searchFaces } from "../../common/services/ai.service.js";
import { createNotification } from "../notifications/notifications.service.js";

export const uploadEventMedia = async (
  eventId: string,
  files: Express.Multer.File[],
  user: UserSummary,
  title?: string,
) => {
  const event = await findEventById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  // Phase 6: Access Control checks
  // If the event is PRIVATE, only members of the attached club can access/upload.
  if (event.visibility === "PRIVATE") {
    if (!event.clubId) {
      throw new ApiError(403, "Private event must belong to a club");
    }
    const isMember = await findClubMember(user.id, event.clubId);
    if (!isMember && user.role !== "ADMIN") {
      throw new ApiError(403, "Access Denied: You must be a member of the club to access this private event");
    }
  }

  // Upload Permission: only Photographer, Club Member, or Admin can upload
  // Wait, if it belongs to a club, only members of that club can upload.
  if (event.clubId) {
    const isMember = await findClubMember(user.id, event.clubId);
    if (!isMember && user.role !== "ADMIN") {
      throw new ApiError(403, "Access Denied: You must be a member of the club to upload media under its events");
    }
  } else {
    // Standalone event: only creator or photographer/admin can upload
    if (event.createdById !== user.id && user.role === "VIEWER") {
      throw new ApiError(403, "Access Denied: Viewers cannot upload media under standalone events");
    }
  }

  if (!files || files.length === 0) {
    throw new ApiError(400, "No files provided for upload");
  }

  // Phase 10: Duplicate Image Detection (SHA-256 hash check)
  for (const file of files) {
    const hash = crypto.createHash("sha256").update(file.buffer).digest("hex");
    const existingMedia = await findMediaByHash(hash);
    if (existingMedia) {
      throw new ApiError(409, `Duplicate file detected: "${file.originalname}" has already been uploaded.`);
    }
  }

  // Create upload session batch
  const batch = await createUploadBatch({
    uploadedById: user.id,
    eventId: event.id,
  });

  const uploadPromises = files.map(async (file) => {
    const hash = crypto.createHash("sha256").update(file.buffer).digest("hex");
    const result = await uploadFile(file);

    let labels: string[] = [];
    let caption: string | null = null;
    let matchedUserIds: string[] = [];

    // Execute AI pipeline if uploaded to S3
    if (result.fileUrl.includes(".amazonaws.com/")) {
      try {
        const s3Key = path.basename(result.fileUrl);

        // 1. Smart Image Tagging
        labels = await detectLabels(s3Key);

        // 2. AI Captioning
        caption = await generateCaption(labels);

        // 3. Facial Recognition / Face Search
        matchedUserIds = await searchFaces(s3Key);
      } catch (err) {
        console.error("AI Operations failed for uploaded file:", file.originalname, err);
      }
    }

    const media = await createMedia({
      title: title || file.originalname,
      fileUrl: result.fileUrl,
      thumbnailUrl: result.thumbnailUrl,
      fileType: result.fileType,
      fileSize: result.fileSize,
      uploadedById: user.id,
      eventId: event.id,
      batchId: batch.id,
      pHash: hash,
      aiTags: labels,
      aiCaption: caption,
    });

    // Create database tags and trigger notifications for matched users
    if (matchedUserIds.length > 0) {
      for (const matchedUserId of matchedUserIds) {
        try {
          await createMediaTag(media.id, matchedUserId);

          // Trigger a notification
          await createNotification(
            matchedUserId,
            `You have been tagged in a new photo uploaded under the event "${event.title}"!`
          );
        } catch (err) {
          console.error(`Failed to automatically tag user ${matchedUserId} in media ${media.id}:`, err);
        }
      }
    }

    return media;
  });

  const mediaItems = await Promise.all(uploadPromises);
  return Promise.all(
    mediaItems.map(async (item) => ({
      ...item,
      fileUrl: await signFileUrl(item.fileUrl),
    }))
  );
};

export const getEventMedia = async (eventId: string, user: UserSummary) => {
  const event = await findEventById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  // Phase 6: Access Control checks for viewing
  if (event.visibility === "PRIVATE") {
    if (!event.clubId) {
      throw new ApiError(403, "Private event must belong to a club");
    }
    const isMember = await findClubMember(user.id, event.clubId);
    if (!isMember && user.role !== "ADMIN") {
      throw new ApiError(403, "Access Denied: You must be a member of the club to view this private event");
    }
  }

  const mediaItems = await findMediaByEventId(eventId);
  return Promise.all(
    mediaItems.map(async (item) => ({
      ...item,
      fileUrl: await signFileUrl(item.fileUrl),
    }))
  );
};

export const deleteMedia = async (mediaId: string, user: UserSummary) => {
  const mediaItem = await findMediaById(mediaId);
  if (!mediaItem) {
    throw new ApiError(404, "Media item not found");
  }

  // Deletion permission: only uploader, event creator, club owner/admin, or platform admin
  const isUploader = mediaItem.uploadedById === user.id;
  const isEventCreator = mediaItem.event.createdById === user.id;
  
  let isClubManager = false;
  if (mediaItem.event.clubId) {
    const clubMember = await findClubMember(user.id, mediaItem.event.clubId);
    if (clubMember && (clubMember.role === "OWNER" || clubMember.role === "ADMIN")) {
      isClubManager = true;
    }
  }

  const hasDeletePermission =
    isUploader || isEventCreator || isClubManager || user.role === "ADMIN";

  if (!hasDeletePermission) {
    throw new ApiError(403, "Access Denied: You do not have permission to delete this media item");
  }

  // Delete from S3/disk
  await deleteFile(mediaItem.fileUrl);

  // Delete from database
  return deleteMediaById(mediaId);
};

export const getTaggedMedia = async (user: UserSummary) => {
  const mediaItems = await findMediaByTagUserId(user.id);
  return Promise.all(
    mediaItems.map(async (item) => ({
      ...item,
      fileUrl: await signFileUrl(item.fileUrl),
    }))
  );
};
