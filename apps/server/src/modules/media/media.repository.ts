import { prisma } from "@repo/db";

export const findEventById = (id: string) => {
  return prisma.event.findUnique({
    where: { id },
    include: {
      club: true,
      creator: true,
    },
  });
};

export const findClubMember = (userId: string, clubId: string) => {
  return prisma.clubMember.findUnique({
    where: {
      userId_clubId: { userId, clubId },
    },
  });
};

export const createUploadBatch = (data: { uploadedById: string; eventId?: string }) => {
  return prisma.uploadBatch.create({
    data,
  });
};

export const createMedia = (data: {
  title?: string | null;
  fileUrl: string;
  thumbnailUrl?: string | null;
  fileType: string;
  fileSize?: number | null;
  uploadedById: string;
  eventId: string;
  batchId?: string | null;
}) => {
  return prisma.media.create({
    data,
    include: {
      uploader: true,
    },
  });
};

export const findMediaById = (id: string) => {
  return prisma.media.findUnique({
    where: { id },
    include: {
      event: {
        include: {
          club: true,
        },
      },
    },
  });
};

export const deleteMediaById = (id: string) => {
  return prisma.media.delete({
    where: { id },
  });
};

export const findMediaByEventId = (eventId: string) => {
  return prisma.media.findMany({
    where: { eventId },
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
    orderBy: {
      uploadedAt: "desc",
    },
  });
};
