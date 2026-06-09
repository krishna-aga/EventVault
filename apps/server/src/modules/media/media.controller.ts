import type { RequestHandler } from "express";
import { ApiError } from "../../common/errors/ApiError.js";
import { sendSuccess } from "../../common/utils/response.js";
import {
  uploadEventMedia,
  getEventMedia,
  deleteMedia,
  getTaggedMedia,
  getUserUploadedMedia,
  analyzeUploadedFile,
  downloadMediaFile,
  runRetroactiveScan,
} from "./media.service.js";
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
    const result = await uploadEventMedia(eventId, files, req.user as any, body.title, body.metadata);

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

export const listUserMedia: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const result = await getUserUploadedMedia(req.user.id);
    sendSuccess(res, "User uploaded media loaded successfully", { media: result });
  } catch (error) {
    next(error);
  }
};

export const analyzeMedia: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!req.file) {
      throw new ApiError(400, "File is required for analysis");
    }

    const result = await analyzeUploadedFile(req.file);
    sendSuccess(res, "Media analyzed successfully", result);
  } catch (error) {
    next(error);
  }
};

export const downloadMedia: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const mediaId = req.params.mediaId as string;
    if (!mediaId) {
      throw new ApiError(400, "Media ID is required");
    }

    const { buffer, filename, mimeType } = await downloadMediaFile(mediaId, req.user as any);
    
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", mimeType);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const retroactiveScan: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const count = await runRetroactiveScan(req.user.id);
    sendSuccess(res, "Retroactive scanning complete", { count });
  } catch (error) {
    next(error);
  }
};
