import { ApiError } from "../../common/errors/ApiError.js";
import { REGISTERABLE_ROLES, type RoleName } from "../../common/constants/roles.js";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  role?: Exclude<RoleName, "ADMIN">;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface TokenBodyInput {
  refreshToken: string;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseRequiredString = (value: unknown, fieldName: string, minLength = 1): string => {
  if (typeof value !== "string") {
    throw new ApiError(400, `${fieldName} must be a string`);
  }

  const trimmed = value.trim();

  if (trimmed.length < minLength) {
    throw new ApiError(400, `${fieldName} must be at least ${minLength} characters long`);
  }

  return trimmed;
};

const parseEmail = (value: unknown): string => {
  const email = parseRequiredString(value, "Email", 3).toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    throw new ApiError(400, "Email must be a valid email address");
  }

  return email;
};

const parsePassword = (value: unknown): string => {
  const password = parseRequiredString(value, "Password", 8);

  if (password.length > 128) {
    throw new ApiError(400, "Password must be at most 128 characters long");
  }

  return password;
};

const parseToken = (value: unknown, fieldName: string): string => {
  const token = parseRequiredString(value, fieldName, 16);

  if (token.length > 4096) {
    throw new ApiError(400, `${fieldName} is too long`);
  }

  return token;
};

export const parseRegisterBody = (input: unknown): RegisterUserInput => {
  if (!isObject(input)) {
    throw new ApiError(400, "Request body must be an object");
  }

  const name = parseRequiredString(input.name, "Name", 2);
  const email = parseEmail(input.email);
  const password = parsePassword(input.password);
  const roleValue = input.role;

  if (roleValue !== undefined && typeof roleValue !== "string") {
    throw new ApiError(400, "Role must be a string");
  }

  if (roleValue !== undefined && !REGISTERABLE_ROLES.includes(roleValue as RoleName)) {
    throw new ApiError(400, "Role must be one of PHOTOGRAPHER, CLUB_MEMBER, or VIEWER");
  }

  return {
    name,
    email,
    password,
    role: roleValue as RegisterUserInput["role"],
  };
};

export const parseLoginBody = (input: unknown): LoginUserInput => {
  if (!isObject(input)) {
    throw new ApiError(400, "Request body must be an object");
  }

  return {
    email: parseEmail(input.email),
    password: parsePassword(input.password),
  };
};

export const parseTokenBody = (input: unknown): TokenBodyInput => {
  if (!isObject(input)) {
    throw new ApiError(400, "Request body must be an object");
  }

  return {
    refreshToken: parseToken(input.refreshToken, "Refresh token"),
  };
};
