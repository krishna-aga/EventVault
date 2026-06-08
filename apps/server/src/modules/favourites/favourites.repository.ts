import { prisma } from "@repo/db";

export const findFavourite = (userId: string, mediaId: string) => {
  return prisma.favourite.findUnique({
    where: {
      userId_mediaId: { userId, mediaId },
    },
  });
};

export const createFavourite = (userId: string, mediaId: string) => {
  return prisma.favourite.create({
    data: {
      userId,
      mediaId,
    },
    include: {
      media: {
        include: {
          uploader: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });
};

export const deleteFavourite = (userId: string, mediaId: string) => {
  return prisma.favourite.delete({
    where: {
      userId_mediaId: { userId, mediaId },
    },
  });
};

export const getFavouritesByUserId = (userId: string) => {
  return prisma.favourite.findMany({
    where: { userId },
    include: {
      media: {
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profileImage: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};
