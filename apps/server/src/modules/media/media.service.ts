import { ApiError } from "../../common/errors/ApiError.js";
import { uploadFile, deleteFile, signFileUrl, downloadFileBuffer } from "../../common/services/storage.service.js";
import { prisma } from "@repo/db";
import { applyWatermark } from "../../common/utils/watermark.util.js";
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
  findMediaByUploadedById,
} from "./media.repository.js";
import type { UserSummary } from "@repo/contracts";
import crypto from "node:crypto";
import path from "node:path";
import { detectLabels, generateCaption, searchFaces } from "../../common/services/ai.service.js";
import { createNotification } from "../notifications/notifications.service.js";

const formatTitleCase = (value: string) =>
  value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");

export const uploadEventMedia = async (
  eventId: string,
  files: Express.Multer.File[],
  user: UserSummary,
  title?: string,
  metadata?: string,
) => {
  const isAdmin = user.role === "ADMIN";

  if (user.role === "VIEWER") {
    throw new ApiError(403, "Access Denied: Viewers cannot upload media");
  }

  const event = await findEventById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if (!event.clubId) {
    throw new ApiError(400, "You must select a club before uploading media");
  }

  // Phase 6: Access Control checks
  if (event.visibility === "PRIVATE") {
    if (!event.clubId) {
      throw new ApiError(403, "Private event must belong to a club");
    }
    const isMember = isAdmin || (await findClubMember(user.id, event.clubId));
    if (!isMember) {
      throw new ApiError(403, "Access Denied: You must be a member of the club to access this private event");
    }
  }

  const isMember = isAdmin || (await findClubMember(user.id, event.clubId));
  if (!isMember) {
    throw new ApiError(403, "Access Denied: You must first join the club before uploading media");
  }

  if (!files || files.length === 0) {
    throw new ApiError(400, "No files provided for upload");
  }

  // Duplicate Image Detection (SHA-256 hash check)
  for (const file of files) {
    const hash = crypto.createHash("sha256").update(file.buffer).digest("hex");
    const existingMedia = await findMediaByHash(hash);
    if (existingMedia) {
      throw new ApiError(409, `Duplicate file detected: "${file.originalname}" has already been uploaded.`);
    }
  }

  // Parse metadata if provided
  let metaArray: any[] = [];
  if (metadata) {
    try {
      metaArray = JSON.parse(metadata);
    } catch (err) {
      console.warn("Failed to parse upload metadata:", err);
    }
  }

  // Create upload session batch
  const batch = await createUploadBatch({
    uploadedById: user.id,
    eventId: event.id,
  });

  const uploadPromises = files.map(async (file, index) => {
    const hash = crypto.createHash("sha256").update(file.buffer).digest("hex");
    const result = await uploadFile(file);

    let labels: string[] = [];
    let caption: string | null = null;
    let matchedUserIds: string[] = [];
    let category: string | null = null;

    const fileMeta = metaArray[index];
    if (fileMeta) {
      labels = fileMeta.tags || [];
      caption = fileMeta.caption || null;
      category = fileMeta.category || null;
      matchedUserIds = fileMeta.peopleIds || [];
    } else {
      // Execute AI pipeline if S3 is configured
      if (result.fileUrl.includes(".amazonaws.com/")) {
        try {
          const s3Key = path.basename(result.fileUrl);
          labels = await detectLabels(s3Key);
          caption = await generateCaption(labels);
          matchedUserIds = await searchFaces(s3Key);
        } catch (err) {
          console.error("AI Operations failed for uploaded file:", file.originalname, err);
        }
      }
    }

    const media = await prisma.media.create({
      data: {
        title: fileMeta?.caption || title || file.originalname,
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
        category: category,
      },
      include: {
        uploader: true,
      },
    });

    // Create database tags and trigger notifications for matched users
    if (matchedUserIds.length > 0) {
      for (const matchedUserId of matchedUserIds) {
        try {
          await createMediaTag(media.id, matchedUserId);
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
    mediaItems.map(async (item: any) => ({
      ...item,
      fileUrl: await signFileUrl(item.fileUrl),
    }))
  );
};

export const getEventMedia = async (eventId: string, user: UserSummary) => {
  const isAdmin = user.role === "ADMIN";
  const event = await findEventById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  // Phase 6: Access Control checks for viewing
  if (event.visibility === "PRIVATE") {
    if (!event.clubId) {
      throw new ApiError(403, "Private event must belong to a club");
    }
    const isMember = isAdmin || (await findClubMember(user.id, event.clubId));
    if (!isMember) {
      throw new ApiError(403, "Access Denied: You must be a member of the club to view this private event");
    }
  }

  const mediaItems = await findMediaByEventId(eventId);
  return Promise.all(
    mediaItems.map(async (item: any) => ({
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
    mediaItems.map(async (item: any) => ({
      ...item,
      fileUrl: await signFileUrl(item.fileUrl),
    }))
  );
};

export const getUserUploadedMedia = async (userId: string) => {
  const mediaItems = await findMediaByUploadedById(userId);
  return Promise.all(
    mediaItems.map(async (item: any) => ({
      ...item,
      fileUrl: await signFileUrl(item.fileUrl),
    }))
  );
};

export const analyzeUploadedFile = async (file: Express.Multer.File) => {
  const result = await uploadFile(file);
  
  let labels: string[] = [];
  let caption: string | null = null;
  let matchedUserIds: string[] = [];
  let matchedUsers: { id: string; name: string; email: string }[] = [];

  if (result.fileUrl.includes(".amazonaws.com/")) {
    try {
      const s3Key = path.basename(result.fileUrl);
      labels = await detectLabels(s3Key);
      caption = await generateCaption(labels);
      matchedUserIds = await searchFaces(s3Key);
    } catch (err) {
      console.error("AI Analysis error during preview analyze:", err);
    }
  } else {
    // Local fallback recommendations
    labels = ["local", "preview"];
    caption = "A great event capture.";
  }

  if (matchedUserIds.length > 0) {
    const users = await prisma.user.findMany({
      where: {
        id: { in: matchedUserIds }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    matchedUsers = users;
  }

  await deleteFile(result.fileUrl);

  return {
    tags: labels,
    caption,
    people: matchedUsers,
  };
};

export const downloadMediaFile = async (mediaId: string, user: UserSummary) => {
  const isAdmin = user.role === "ADMIN";
  const mediaItem = await findMediaById(mediaId);
  if (!mediaItem) {
    throw new ApiError(404, "Media item not found");
  }

  if (mediaItem.event.visibility === "PRIVATE") {
    if (!mediaItem.event.clubId) {
      throw new ApiError(403, "Private event must belong to a club");
    }
    const isMember = isAdmin || (await findClubMember(user.id, mediaItem.event.clubId));
    if (!isMember) {
      throw new ApiError(403, "Access Denied: You must be a member of the club to download private event media");
    }
  }

  let buffer = await downloadFileBuffer(mediaItem.fileUrl);

  const isImage = mediaItem.fileType === "photo";
  if (isImage) {
    const clubName = mediaItem.event.club?.name || "None";
    const eventTitle = mediaItem.event.title;
    const userRole = formatTitleCase(user.role);

    buffer = await applyWatermark(buffer, [
      `Club: ${clubName} | Event: ${eventTitle} | Role: ${userRole}`,
    ]);
  }

  const fileExt = path.extname(mediaItem.fileUrl) || (isImage ? ".jpg" : ".mp4");
  const filename = mediaItem.title
    ? `${mediaItem.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}${fileExt}`
    : `download_${mediaId}${fileExt}`;

  const mimeType = isImage ? "image/jpeg" : "video/mp4";

  return {
    buffer,
    filename,
    mimeType,
  };
};

export const runRetroactiveScan = async (userId: string): Promise<number> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referenceSelfie: true },
  });

  if (!user || !user.referenceSelfie) {
    throw new ApiError(400, "Please upload a reference selfie first before running a retroactive scan");
  }

  const existingMedia = await prisma.media.findMany({
    where: {
      fileUrl: { contains: ".amazonaws.com/" },
      tags: {
        none: {
          userId: userId,
        },
      },
    },
    include: {
      event: true,
    },
  });

  let matchCount = 0;

  for (const media of existingMedia) {
    try {
      const s3Key = path.basename(media.fileUrl);
      const matchedUserIds = await searchFaces(s3Key);

      if (matchedUserIds.includes(userId)) {
        await createMediaTag(media.id, userId);
        await createNotification(
          userId,
          `We found a matching photo of you in the event "${media.event.title}"!`
        );
        matchCount++;
      }
    } catch (err) {
      console.error(`Retroactive scan failed for media ${media.id}:`, err);
    }
  }

  return matchCount;
};
