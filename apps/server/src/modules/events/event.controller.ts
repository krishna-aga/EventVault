import type { Request, RequestHandler } from "express";
import { COMMON_MESSAGES } from "../../common/constants/messages.js";
import { ApiError } from "../../common/errors/ApiError.js";
import { sendSuccess } from "../../common/utils/response.js";
import { parseEventBody, parseEventFilters, parseEventUpdateBody } from "./event.schema.js";
import { addEvent, editEvent, fetchEvent, fetchEvents, removeEvent } from "./event.service.js";

const requireUser = (req: Request) => {
  if (!req.user) {
    throw new ApiError(401, COMMON_MESSAGES.UNAUTHORIZED);
  }

  return req.user;
};

const readEventId = (req: Request): string => {
  const eventId = typeof req.params.eventId === "string" ? req.params.eventId.trim() : "";

  if (!eventId) {
    throw new ApiError(400, "Event id is required");
  }

  return eventId;
};

export const listEventsHandler: RequestHandler = async (req, res, next) => {
  try {
    const events = await fetchEvents(parseEventFilters(req.query));
    sendSuccess(res, "Events fetched successfully", { events });
  } catch (error) {
    next(error);
  }
};

export const getEventHandler: RequestHandler = async (req, res, next) => {
  try {
    const event = await fetchEvent(readEventId(req));
    sendSuccess(res, "Event fetched successfully", { event });
  } catch (error) {
    next(error);
  }
};

export const createEventHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req);
    const event = await addEvent(parseEventBody(req.body), user);
    sendSuccess(res, "Event created successfully", { event }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateEventHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req);
    const event = await editEvent(readEventId(req), parseEventUpdateBody(req.body), user);
    sendSuccess(res, "Event updated successfully", { event });
  } catch (error) {
    next(error);
  }
};

export const deleteEventHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req);
    await removeEvent(readEventId(req), user);
    sendSuccess(res, "Event deleted successfully", null);
  } catch (error) {
    next(error);
  }
};
