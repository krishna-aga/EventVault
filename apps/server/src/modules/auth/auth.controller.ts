import type { RequestHandler } from "express";
import { AUTH_MESSAGES, COMMON_MESSAGES } from "../../common/constants/messages.js";
import { ApiError } from "../../common/errors/ApiError.js";
import { sendSuccess } from "../../common/utils/response.js";
import {
  getCurrentUser,
  loginUser,
  logoutSession,
  refreshSession,
  registerUser,
  saveUserSelfie,
} from "./auth.service.js";

export const register: RequestHandler = async (req, res, next) => {
  try {
    const result = await registerUser(req.body);

    sendSuccess(res, AUTH_MESSAGES.REGISTER_SUCCESS, result, 201);
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);

    sendSuccess(res, AUTH_MESSAGES.LOGIN_SUCCESS, result);
  } catch (error) {
    next(error);
  }
};

export const refresh: RequestHandler = async (req, res, next) => {
  try {
    const result = await refreshSession(req.body);

    sendSuccess(res, AUTH_MESSAGES.REFRESH_SUCCESS, result);
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    await logoutSession(req.body);

    sendSuccess(res, AUTH_MESSAGES.LOGOUT_SUCCESS, null);
  } catch (error) {
    next(error);
  }
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, COMMON_MESSAGES.UNAUTHORIZED);
    }

    const user = await getCurrentUser(req.user.id);

    sendSuccess(res, AUTH_MESSAGES.PROFILE_FETCHED, { user });
  } catch (error) {
    next(error);
  }
};

export const uploadSelfie: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, COMMON_MESSAGES.UNAUTHORIZED);
    }

    if (!req.file) {
      throw new ApiError(400, "Reference selfie file is required");
    }

    const fileUrl = await saveUserSelfie(req.user.id, req.file);
    sendSuccess(res, "Reference selfie uploaded and processed successfully", { fileUrl });
  } catch (error) {
    next(error);
  }
};
