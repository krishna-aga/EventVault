import type { RequestHandler } from "express";
import { ApiError } from "../../common/errors/ApiError.js";
import { sendSuccess } from "../../common/utils/response.js";
import { toggleFavourite, listUserFavourites } from "./favourites.service.js";

export const handleToggleFavourite: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const mediaId = req.params.mediaId as string;
    if (!mediaId) {
      throw new ApiError(400, "Media ID is required");
    }

    const result = await toggleFavourite(mediaId, req.user as any);
    sendSuccess(
      res,
      result.favourited
        ? "Media item saved to favourites"
        : "Media item removed from favourites",
      result,
    );
  } catch (error) {
    next(error);
  }
};

export const handleListFavourites: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const result = await listUserFavourites(req.user as any);
    sendSuccess(res, "Favourites retrieved successfully", { favourites: result });
  } catch (error) {
    next(error);
  }
};
