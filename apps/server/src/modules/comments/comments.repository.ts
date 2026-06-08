import { prisma } from "@repo/db";

export const createComment = (userId: string, mediaId: string, content: string) => {
  return prisma.comment.create({
    data: {
      userId,
      mediaId,
      content,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
        },
      },
    },
  });
};

export const findCommentById = (id: string) => {
  return prisma.comment.findUnique({
    where: { id },
    include: {
      media: {
        include: {
          event: true,
        },
      },
    },
  });
};

export const deleteCommentById = (id: string) => {
  return prisma.comment.delete({
    where: { id },
  });
};

export const getCommentsByMediaId = (mediaId: string) => {
  return prisma.comment.findMany({
    where: { mediaId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};
