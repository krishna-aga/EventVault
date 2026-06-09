import { ApiError } from "../../common/errors/ApiError.js";
import type {
  EventFilters,
  EventInput,
  EventSortBy,
  EventSortOrder,
  EventVisibility,
} from "@repo/contracts";

export interface EventUpdateInput extends Partial<EventInput> {}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseRequiredString = (
  value: unknown,
  fieldName: string,
  minLength: number,
  maxLength: number,
): string => {
  if (typeof value !== "string") {
    throw new ApiError(400, `${fieldName} must be a string`);
  }

  const trimmed = value.trim();

  if (trimmed.length < minLength) {
    throw new ApiError(400, `${fieldName} must be at least ${minLength} characters long`);
  }

  if (trimmed.length > maxLength) {
    throw new ApiError(400, `${fieldName} must be at most ${maxLength} characters long`);
  }

  return trimmed;
};

const parseOptionalString = (
  value: unknown,
  fieldName: string,
  maxLength: number,
): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ApiError(400, `${fieldName} must be a string`);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  if (trimmed.length > maxLength) {
    throw new ApiError(400, `${fieldName} must be at most ${maxLength} characters long`);
  }

  return trimmed;
};

const parseVisibility = (value: unknown): EventVisibility => {
  if (value !== "PUBLIC" && value !== "PRIVATE") {
    throw new ApiError(400, "Visibility must be PUBLIC or PRIVATE");
  }

  return value;
};

const parseSortBy = (value: unknown): EventSortBy => {
  if (value === "title" || value === "eventDate" || value === "category") {
    return value;
  }

  return "eventDate";
};

const parseSortOrder = (value: unknown): EventSortOrder => {
  if (value === "asc" || value === "desc") {
    return value;
  }

  return "desc";
};

const parseDateTime = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new ApiError(400, "Event date must be a string");
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, "Event date must be a valid date");
  }

  return parsed.toISOString();
};

const parseOptionalId = (
  value: unknown,
  fieldName: string,
): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ApiError(400, `${fieldName} must be a string`);
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
};

const parseRequiredId = (
  value: unknown,
  fieldName: string,
): string => {
  if (typeof value !== "string") {
    throw new ApiError(400, `${fieldName} must be a string`);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new ApiError(400, `${fieldName} is required`);
  }

  return trimmed;
};

export const parseEventBody = (input: unknown): EventInput => {
  if (!isObject(input)) {
    throw new ApiError(400, "Request body must be an object");
  }

  return {
    title: parseRequiredString(input.title, "Title", 2, 160),
    description: parseOptionalString(input.description, "Description", 4000),
    category: parseRequiredString(input.category, "Category", 2, 80),
    visibility: parseVisibility(input.visibility),
    location: parseOptionalString(input.location, "Location", 240),
    eventDate: parseDateTime(input.eventDate),
    coverImage: parseOptionalString(input.coverImage, "Cover image", 2000),
    clubId: parseRequiredId(input.clubId, "Club id"),
  };
};

export const parseEventUpdateBody = (input: unknown): EventUpdateInput => {
  if (!isObject(input)) {
    throw new ApiError(400, "Request body must be an object");
  }

  const payload: EventUpdateInput = {};

  if (input.title !== undefined) {
    payload.title = parseRequiredString(input.title, "Title", 2, 160);
  }

  if (input.description !== undefined) {
    payload.description = parseOptionalString(input.description, "Description", 4000);
  }

  if (input.category !== undefined) {
    payload.category = parseRequiredString(input.category, "Category", 2, 80);
  }

  if (input.visibility !== undefined) {
    payload.visibility = parseVisibility(input.visibility);
  }

  if (input.location !== undefined) {
    payload.location = parseOptionalString(input.location, "Location", 240);
  }

  if (input.eventDate !== undefined) {
    payload.eventDate = parseDateTime(input.eventDate);
  }

  if (input.coverImage !== undefined) {
    payload.coverImage = parseOptionalString(input.coverImage, "Cover image", 2000);
  }

  if (input.clubId !== undefined) {
    payload.clubId = parseOptionalId(input.clubId, "Club id");
  }

  if (Object.keys(payload).length === 0) {
    throw new ApiError(400, "At least one event field is required");
  }

  return payload;
};

export const parseEventFilters = (query: Record<string, unknown>): EventFilters => {
  return {
    sortBy: parseSortBy(query.sortBy),
    sortOrder: parseSortOrder(query.sortOrder),
    category:
      typeof query.category === "string" && query.category.trim()
        ? query.category.trim()
        : undefined,
    clubId:
      typeof query.clubId === "string" && query.clubId.trim()
        ? query.clubId.trim()
        : undefined,
    visibility:
      query.visibility === "PUBLIC" || query.visibility === "PRIVATE"
        ? query.visibility
        : undefined,
  };
};
