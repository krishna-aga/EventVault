import type { RequestHandler } from "express";
import { COMMON_MESSAGES } from "../constants/messages.js";
import { ApiError } from "../errors/ApiError.js";
import type { RoleName } from "../constants/roles.js";

export const requireRole = (...allowedRoles: RoleName[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) {
      next(new ApiError(401, COMMON_MESSAGES.UNAUTHORIZED));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ApiError(403, COMMON_MESSAGES.FORBIDDEN));
      return;
    }

    next();
  };
};
