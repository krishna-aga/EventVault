import { ApiError } from "../../common/errors/ApiError.js";

export interface MediaUploadInput {
  title?: string;
  metadata?: string;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const parseMediaUploadBody = (input: unknown): MediaUploadInput => {
  if (input === undefined || input === null) return {};
  if (!isObject(input)) {
    throw new ApiError(400, "Request body must be an object");
  }

  const title = input.title;
  if (title !== undefined && typeof title !== "string") {
    throw new ApiError(400, "Title must be a string");
  }

  const metadata = input.metadata;
  if (metadata !== undefined && typeof metadata !== "string") {
    throw new ApiError(400, "Metadata must be a string");
  }

  return {
    title: title?.trim(),
    metadata: metadata?.trim(),
  };
};
