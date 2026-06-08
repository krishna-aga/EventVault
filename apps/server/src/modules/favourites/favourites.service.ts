import { ApiError } from "../../common/errors/ApiError.js";
import { findMediaById } from "../media/media.repository.js";
import {
  findFavourite,
  createFavourite,
  deleteFavourite,
  getFavouritesByUserId,
} from "./favourites.repository.js";
import type { UserSummary } from "@repo/contracts";

export const toggleFavourite = async (mediaId: string, user: UserSummary) => {
  const mediaItem = await findMediaById(mediaId);
  if (!mediaItem) {
    throw new ApiError(404, "Media item not found");
  }

  const existingFav = await findFavourite(user.id, mediaId);
  if (existingFav) {
    await deleteFavourite(user.id, mediaId);
    return { favourited: false };
  } else {
    const fav = await createFavourite(user.id, mediaId);
    return { favourited: true, favourite: fav };
  }
};

export const listUserFavourites = async (user: UserSummary) => {
  return getFavouritesByUserId(user.id);
};
