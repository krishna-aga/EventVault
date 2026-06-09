import { prisma } from "@repo/db";
import { COMMON_MESSAGES } from "../../common/constants/messages.js";
import { ApiError } from "../../common/errors/ApiError.js";
import type { EventFilters, EventInput } from "@repo/contracts";
import type { EventUpdateInput } from "./event.schema.js";
import {
  createEvent,
  deleteEvent,
  findEventById,
  listEvents,
  updateEvent,
} from "./event.repository.js";

type Actor = {
  id: string;
  role: string;
};

const assertEventExists = async (eventId: string) => {
  const event = await findEventById(eventId);

  if (!event) {
    throw new ApiError(404, COMMON_MESSAGES.NOT_FOUND);
  }

  return event;
};

const assertClubAccess = async (userId: string, clubId: string) => {
  const membership = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
    },
  });

  if (!membership) {
    throw new ApiError(403, "You must be a club member to manage club events");
  }

  return membership;
};

const assertCanManageEvent = async (eventId: string, actor: Actor) => {
  const event = await assertEventExists(eventId);

  if (actor.role === "ADMIN" || event.createdById === actor.id) {
    return event;
  }

  if (event.clubId) {
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: actor.id,
        clubId: event.clubId,
      },
    });

    if (membership && (membership.role === "OWNER" || membership.role === "ADMIN")) {
      return event;
    }
  }

  throw new ApiError(403, COMMON_MESSAGES.FORBIDDEN);
};

const ensureClubOwnershipForCreate = async (input: EventInput, actor: Actor) => {
  if (!input.clubId || actor.role === "ADMIN") {
    return;
  }

  await assertClubAccess(actor.id, input.clubId);
};

const normalizePayload = (input: EventInput | EventUpdateInput) => {
  return {
    ...input,
    eventDate:
      input.eventDate !== undefined ? new Date(input.eventDate as string) : undefined,
  };
};

export const fetchEvents = (filters: EventFilters) => {
  return listEvents(filters);
};

export const fetchEvent = async (eventId: string) => {
  return assertEventExists(eventId);
};

export const addEvent = async (input: EventInput, actor: Actor) => {
  if (actor.role === "VIEWER") {
    throw new ApiError(403, "Access Denied: Viewers cannot create events");
  }

  await ensureClubOwnershipForCreate(input, actor);

  const event = await createEvent({
    title: input.title,
    description: input.description,
    category: input.category,
    visibility: input.visibility,
    location: input.location,
    eventDate: new Date(input.eventDate),
    coverImage: input.coverImage,
    createdById: actor.id,
    clubId: input.clubId ?? null,
  });

  return event;
};

export const editEvent = async (
  eventId: string,
  input: EventUpdateInput,
  actor: Actor,
) => {
  await assertCanManageEvent(eventId, actor);

  if (input.clubId && actor.role !== "ADMIN") {
    await assertClubAccess(actor.id, input.clubId);
  }

  const payload = normalizePayload(input);

  return updateEvent(eventId, {
    title: payload.title,
    description: payload.description,
    category: payload.category,
    visibility: payload.visibility,
    location: payload.location,
    eventDate: payload.eventDate,
    coverImage: payload.coverImage,
    clubId: payload.clubId !== undefined ? payload.clubId : undefined,
  });
};

export const removeEvent = async (eventId: string, actor: Actor) => {
  await assertCanManageEvent(eventId, actor);

  return deleteEvent(eventId);
};
