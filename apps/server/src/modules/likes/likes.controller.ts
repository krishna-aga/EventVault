import type { RequestHandler } from "express";
import { ApiError } from "../../common/errors/ApiError.js";
import { sendSuccess } from "../../common/utils/response.js";
import { toggleLike, listLikes } from "./likes.service.js";

export const handleToggleLike: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const mediaId = req.params.mediaId as string;
    if (!mediaId) {
      throw new ApiError(400, "Media ID is required");
    }

    const result = await toggleLike(mediaId, req.user as any);
    sendSuccess(res, result.liked ? "Liked media successfully" : "Unliked media successfully", result);
  } catch (error) {
    next(error);
  }
};

export const handleListLikes: RequestHandler = async (req, res, next) => {
  try {
    const mediaId = req.params.mediaId as string;
    if (!mediaId) {
      throw new ApiError(400, "Media ID is required");
    }

    const result = await listLikes(mediaId);
    sendSuccess(res, "Likes retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};
