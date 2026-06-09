import { ApiError } from "../../common/errors/ApiError.js";
import type { ClubMemberRole } from "../../common/constants/roles.js";

export interface ClubCreateInput {
  name: string;
  description?: string;
  logoUrl?: string;
}

export interface ClubUpdateInput {
  name?: string;
  description?: string;
  logoUrl?: string;
}

export interface ClubJoinRequestReviewInput {
  status: "APPROVED" | "REJECTED";
}

export interface ClubMemberRoleInput {
  role: ClubMemberRole;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

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

const parseClubRole = (value: unknown): ClubMemberRole => {
  if (typeof value !== "string") {
    throw new ApiError(400, "Role must be a string");
  }

  if (value !== "OWNER" && value !== "ADMIN" && value !== "MEMBER") {
    throw new ApiError(400, "Role must be OWNER, ADMIN, or MEMBER");
  }

  return value;
};

export const parseClubCreateBody = (input: unknown): ClubCreateInput => {
  if (!isObject(input)) {
    throw new ApiError(400, "Request body must be an object");
  }

  const name = parseRequiredString(input.name, "Name", 2, 120);
  const description = parseOptionalString(input.description, "Description", 2000);
  const logoUrl = parseOptionalString(input.logoUrl, "Logo URL", 2000);

  return {
    name,
    description,
    logoUrl,
  };
};

export const parseClubUpdateBody = (input: unknown): ClubUpdateInput => {
  if (!isObject(input)) {
    throw new ApiError(400, "Request body must be an object");
  }

  const updatePayload: ClubUpdateInput = {};

  if (input.name !== undefined) {
    updatePayload.name = parseRequiredString(input.name, "Name", 2, 120);
  }

  if (input.description !== undefined) {
    updatePayload.description = parseOptionalString(input.description, "Description", 2000);
  }

  if (input.logoUrl !== undefined) {
    updatePayload.logoUrl = parseOptionalString(input.logoUrl, "Logo URL", 2000);
  }

  if (
    updatePayload.name === undefined &&
    updatePayload.description === undefined &&
    updatePayload.logoUrl === undefined
  ) {
    throw new ApiError(400, "At least one field is required to update a club");
  }

  return updatePayload;
};

export const parseJoinRequestReviewBody = (
  input: unknown,
): ClubJoinRequestReviewInput => {
  if (!isObject(input)) {
    throw new ApiError(400, "Request body must be an object");
  }

  const status = input.status;

  if (status !== "APPROVED" && status !== "REJECTED") {
    throw new ApiError(400, "Status must be APPROVED or REJECTED");
  }

  return { status };
};

export const parseMemberRoleBody = (input: unknown): ClubMemberRoleInput => {
  if (!isObject(input)) {
    throw new ApiError(400, "Request body must be an object");
  }

  return {
    role: parseClubRole(input.role),
  };
};
