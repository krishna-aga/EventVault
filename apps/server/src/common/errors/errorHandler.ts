import type { ErrorRequestHandler } from "express";
import { ApiError } from "./ApiError.js";
import { COMMON_MESSAGES } from "../constants/messages.js";

type PrismaLikeError = {
  code?: string;
  meta?: Record<string, unknown>;
  message?: string;
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({
      success: false,
      message: COMMON_MESSAGES.VALIDATION_ERROR,
    });
    return;
  }

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  const prismaError = error as PrismaLikeError;

  if (prismaError.code === "P2002") {
    res.status(409).json({
      success: false,
      message: "A record with the same unique value already exists",
    });
    return;
  }

  if (prismaError.code === "P2025") {
    res.status(404).json({
      success: false,
      message: COMMON_MESSAGES.NOT_FOUND,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
