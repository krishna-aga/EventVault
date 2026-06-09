import { prisma } from "@repo/db";

export const findLike = (userId: string, mediaId: string) => {
  return prisma.like.findUnique({
    where: {
      userId_mediaId: { userId, mediaId },
    },
  });
};

export const createLike = (userId: string, mediaId: string) => {
  return prisma.like.create({
    data: {
      userId,
      mediaId,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
};

export const deleteLike = (userId: string, mediaId: string) => {
  return prisma.like.delete({
    where: {
      userId_mediaId: { userId, mediaId },
    },
  });
};

export const getLikesByMediaId = (mediaId: string) => {
  return prisma.like.findMany({
    where: { mediaId },
    include: {
      user: {
        select: { id: true, name: true, role: true },
      },
    },
  });
};
