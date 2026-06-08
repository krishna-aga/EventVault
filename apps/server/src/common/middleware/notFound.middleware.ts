import type { RequestHandler } from "express";
import { COMMON_MESSAGES } from "../constants/messages.js";

export const notFoundMiddleware: RequestHandler = (_req, res) => {
  res.status(404).json({
    success: false,
    message: COMMON_MESSAGES.NOT_FOUND,
  });
};
