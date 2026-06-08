import type { RequestHandler } from "express";
import { ApiError } from "../../common/errors/ApiError.js";
import { sendSuccess } from "../../common/utils/response.js";
import { addComment, getComments, removeComment } from "./comments.service.js";

export const handleAddComment: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const mediaId = req.params.mediaId as string;
    const { content } = req.body;
    if (!mediaId) {
      throw new ApiError(400, "Media ID is required");
    }

    const result = await addComment(mediaId, content, req.user as any);
    sendSuccess(res, "Comment posted successfully", result, 201);
  } catch (error) {
    next(error);
  }
};

export const handleListComments: RequestHandler = async (req, res, next) => {
  try {
    const mediaId = req.params.mediaId as string;
    if (!mediaId) {
      throw new ApiError(400, "Media ID is required");
    }

    const result = await getComments(mediaId);
    sendSuccess(res, "Comments loaded successfully", { comments: result });
  } catch (error) {
    next(error);
  }
};

export const handleRemoveComment: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const commentId = req.params.commentId as string;
    if (!commentId) {
      throw new ApiError(400, "Comment ID is required");
    }

    await removeComment(commentId, req.user as any);
    sendSuccess(res, "Comment deleted successfully", null);
  } catch (error) {
    next(error);
  }
};
