import type { RequestHandler } from "express";
import { prisma } from "@repo/db";
import { COMMON_MESSAGES } from "../constants/messages.js";
import { ApiError } from "../errors/ApiError.js";
import { verifyToken } from "../utils/jwt.js";

export const authMiddleware: RequestHandler = async (req, _res, next) => {
  try {
    const authorization = req.header("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      throw new ApiError(401, COMMON_MESSAGES.UNAUTHORIZED);
    }

    const token = authorization.slice(7).trim();
    const payload = verifyToken(token);

    if (payload.type !== "access") {
      throw new ApiError(401, COMMON_MESSAGES.UNAUTHORIZED);
    }

    const user = await prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!user) {
      throw new ApiError(401, COMMON_MESSAGES.UNAUTHORIZED);
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage ?? null,
    };

    next();
  } catch (error) {
    next(error);
  }
};
