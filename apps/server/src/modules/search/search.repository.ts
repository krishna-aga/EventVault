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
    const cleanQ = filters.q.trim().toLowerCase();
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { location: { contains: filters.q, mode: "insensitive" } },
      {
        media: {
          some: {
            aiTags: {
              has: cleanQ,
            },
          },
        },
      },
    ];
  }

  if (filters.tag || filters.uploaderId) {
    const mediaConditions: any[] = [];
    if (filters.tag) {
      const cleanTag = filters.tag.trim().toLowerCase();
      mediaConditions.push({ aiTags: { has: cleanTag } });
    }
    if (filters.uploaderId) {
      mediaConditions.push({ uploadedById: filters.uploaderId });
    }
    where.media = { some: { AND: mediaConditions } };
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
