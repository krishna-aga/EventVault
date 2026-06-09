import { ApiError } from "../../common/errors/ApiError.js";
import { findMediaById } from "../media/media.repository.js";
import {
  findFavourite,
  createFavourite,
  deleteFavourite,
  getFavouritesByUserId,
} from "./favourites.repository.js";
import type { UserSummary } from "@repo/contracts";
import { signFileUrl } from "../../common/services/storage.service.js";

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
    if (fav.media) {
      fav.media.fileUrl = await signFileUrl(fav.media.fileUrl);
    }
    return { favourited: true, favourite: fav };
  }
};

export const listUserFavourites = async (user: UserSummary) => {
  const favourites = await getFavouritesByUserId(user.id);
  return Promise.all(
    favourites.map(async (fav: any) => {
      if (fav.media) {
        return {
          ...fav,
          media: {
            ...fav.media,
            fileUrl: await signFileUrl(fav.media.fileUrl),
          },
        };
      }
      return fav;
    })
  );
};
