import { ApiError } from "../../common/errors/ApiError.js";
import { uploadFile, deleteFile } from "../../common/services/storage.service.js";
import {
  findEventById,
  findClubMember,
  createUploadBatch,
  createMedia,
  findMediaById,
  deleteMediaById,
  findMediaByEventId,
} from "./media.repository.js";
import type { UserSummary } from "@repo/contracts";

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

  // Create upload session batch
  const batch = await createUploadBatch({
    uploadedById: user.id,
    eventId: event.id,
  });

  const uploadPromises = files.map(async (file) => {
    const result = await uploadFile(file);
    return createMedia({
      title: title || file.originalname,
      fileUrl: result.fileUrl,
      thumbnailUrl: result.thumbnailUrl,
      fileType: result.fileType,
      fileSize: result.fileSize,
      uploadedById: user.id,
      eventId: event.id,
      batchId: batch.id,
    });
  });

  return Promise.all(uploadPromises);
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

  return findMediaByEventId(eventId);
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
