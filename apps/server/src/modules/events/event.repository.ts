import { prisma } from "@repo/db";
import type { EventFilters, EventSortBy, EventSortOrder } from "@repo/contracts";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  profileImage: true,
  createdAt: true,
  updatedAt: true,
} as const;

const clubSelect = {
  id: true,
  name: true,
  description: true,
  logoUrl: true,
  createdById: true,
  createdAt: true,
} as const;

const eventInclude = {
  creator: {
    select: userSelect,
  },
  club: {
    select: clubSelect,
  },
} as const;

const buildOrderBy = (sortBy: EventSortBy, sortOrder: EventSortOrder) => {
  switch (sortBy) {
    case "title":
      return { title: sortOrder };
    case "category":
      return { category: sortOrder };
    case "eventDate":
    default:
      return { eventDate: sortOrder };
  }
};

const buildWhere = (filters: EventFilters) => {
  return {
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.clubId ? { clubId: filters.clubId } : {}),
    ...(filters.visibility ? { visibility: filters.visibility } : {}),
  };
};

export const listEvents = (filters: EventFilters) => {
  return prisma.event.findMany({
    where: buildWhere(filters),
    include: eventInclude,
    orderBy: buildOrderBy(filters.sortBy ?? "eventDate", filters.sortOrder ?? "desc"),
  });
};

export const findEventById = (eventId: string) => {
  return prisma.event.findUnique({
    where: {
      id: eventId,
    },
    include: eventInclude,
  });
};

export const createEvent = (data: {
  title: string;
  description?: string;
  category: string;
  visibility: "PUBLIC" | "PRIVATE";
  location?: string;
  eventDate: Date;
  coverImage?: string;
  createdById: string;
  clubId?: string | null;
}) => {
  return prisma.event.create({
    data,
    include: eventInclude,
  });
};

export const updateEvent = (
  eventId: string,
  data: {
    title?: string;
    description?: string;
    category?: string;
    visibility?: "PUBLIC" | "PRIVATE";
    location?: string;
    eventDate?: Date;
    coverImage?: string;
    clubId?: string | null;
  },
) => {
  return prisma.event.update({
    where: {
      id: eventId,
    },
    data,
    include: eventInclude,
  });
};

export const deleteEvent = (eventId: string) => {
  return prisma.event.delete({
    where: {
      id: eventId,
    },
  });
};
