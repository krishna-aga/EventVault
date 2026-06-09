import type { RequestHandler } from "express";
import { ApiError } from "../../common/errors/ApiError.js";
import { sendSuccess } from "../../common/utils/response.js";
import { uploadEventMedia, getEventMedia, deleteMedia, getTaggedMedia } from "./media.service.js";
import { parseMediaUploadBody } from "./media.schema.js";

export const uploadMedia: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const eventId = req.params.eventId as string;
    if (!eventId) {
      throw new ApiError(400, "Event ID is required");
    }

    // Support single file in req.file or multiple in req.files
    let files: Express.Multer.File[] = [];
    if (req.files) {
      files = req.files as Express.Multer.File[];
    } else if (req.file) {
      files = [req.file];
    }

    if (files.length === 0) {
      throw new ApiError(400, "No files uploaded");
    }

    const body = parseMediaUploadBody(req.body);
    const result = await uploadEventMedia(eventId, files, req.user as any, body.title);

    sendSuccess(res, "Media uploaded successfully", result, 201);
  } catch (error) {
    next(error);
  }
};

export const listMedia: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const eventId = req.params.eventId as string;
    if (!eventId) {
      throw new ApiError(400, "Event ID is required");
    }

    const result = await getEventMedia(eventId, req.user as any);
    sendSuccess(res, "Media files loaded successfully", { media: result });
  } catch (error) {
    next(error);
  }
};

export const removeMedia: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const mediaId = req.params.mediaId as string;
    if (!mediaId) {
      throw new ApiError(400, "Media ID is required");
    }

    await deleteMedia(mediaId, req.user as any);
    sendSuccess(res, "Media file removed successfully", null);
  } catch (error) {
    next(error);
  }
};

export const listTaggedMedia: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const result = await getTaggedMedia(req.user as any);
    sendSuccess(res, "Tagged media files loaded successfully", { media: result });
  } catch (error) {
    next(error);
  }
};
