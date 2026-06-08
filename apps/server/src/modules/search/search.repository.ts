import { prisma } from "@repo/db";
import type { Prisma } from "@repo/db";

export const queryEvents = (filters: {
  q?: string;
  category?: string;
  clubId?: string;
  startDate?: Date;
  endDate?: Date;
  uploaderId?: string;
  tag?: string;
}) => {
  const where: any = {};

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { location: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  if (filters.category) {
    where.category = { equals: filters.category, mode: "insensitive" };
  }

  if (filters.clubId) {
    where.clubId = filters.clubId;
  }

  if (filters.startDate || filters.endDate) {
    where.eventDate = {};
    if (filters.startDate) {
      where.eventDate.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.eventDate.lte = filters.endDate;
    }
  }

  if (filters.uploaderId) {
    where.media = {
      some: {
        uploadedById: filters.uploaderId,
      },
    };
  }

  return prisma.event.findMany({
    where,
    include: {
      club: true,
      creator: {
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
      eventDate: "desc",
    },
  });
};
