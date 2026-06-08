import { COMMON_MESSAGES } from "../../common/constants/messages.js";
import { ApiError } from "../../common/errors/ApiError.js";
import { env } from "../../config/env.js";
import { comparePassword, hashPassword } from "../../common/utils/bcrypt.js";
import { hashToken, signToken, verifyToken } from "../../common/utils/jwt.js";
import type { AuthResponse, AuthUser } from "./auth.types.js";
import type {
  LoginUserInput,
  RegisterUserInput,
  TokenBodyInput,
} from "./auth.schema.js";
import {
  createRefreshToken,
  createUser,
  findRefreshTokenByHash,
  findUserByEmail,
  findUserById,
  revokeRefreshToken,
} from "./auth.repository.js";
import type { RoleName } from "../../common/constants/roles.js";

const sanitizeUser = (user: {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  profileImage: string | null;
  createdAt: Date;
  updatedAt: Date;
}): AuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  profileImage: user.profileImage,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const buildAccessToken = (user: AuthUser): string => {
  return signToken(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      type: "access",
    },
    env.jwtExpiresIn,
  );
};

const buildRefreshToken = (user: AuthUser): string => {
  return signToken(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      type: "refresh",
    },
    env.jwtRefreshExpiresIn,
  );
};

const storeRefreshToken = async (userId: string, refreshToken: string) => {
  const decoded = verifyToken(refreshToken);

  if (decoded.type !== "refresh") {
    throw new ApiError(401, "Invalid refresh token");
  }

  return createRefreshToken({
    userId,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(decoded.exp * 1_000),
  });
};

const buildAuthResponse = async (user: AuthUser): Promise<AuthResponse> => {
  const accessToken = buildAccessToken(user);
  const refreshToken = buildRefreshToken(user);

  await storeRefreshToken(user.id, refreshToken);

  return {
    user,
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

export const registerUser = async (
  input: RegisterUserInput,
): Promise<AuthResponse> => {
  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    throw new ApiError(409, "A user with this email already exists");
  }

  const createdUser = await createUser({
    name: input.name,
    email: input.email,
    passwordHash: hashPassword(input.password),
    role: input.role ?? "VIEWER",
  });

  return buildAuthResponse(sanitizeUser(createdUser));
};

export const loginUser = async (input: LoginUserInput): Promise<AuthResponse> => {
  const user = await findUserByEmail(input.email);

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const passwordMatches = comparePassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password");
  }

  return buildAuthResponse(sanitizeUser(user));
};

export const refreshSession = async (
  input: TokenBodyInput,
): Promise<AuthResponse> => {
  const payload = verifyToken(input.refreshToken);

  if (payload.type !== "refresh") {
    throw new ApiError(401, "Invalid refresh token");
  }

  const tokenHash = hashToken(input.refreshToken);
  const storedToken = await findRefreshTokenByHash(tokenHash);

  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt <= new Date()) {
    throw new ApiError(401, "Refresh token is no longer valid");
  }

  const user = await findUserById(payload.sub);

  if (!user) {
    throw new ApiError(401, COMMON_MESSAGES.UNAUTHORIZED);
  }

  await revokeRefreshToken(tokenHash);

  return buildAuthResponse(sanitizeUser(user));
};

export const logoutSession = async (input: TokenBodyInput): Promise<void> => {
  const payload = verifyToken(input.refreshToken);

  if (payload.type !== "refresh") {
    throw new ApiError(401, "Invalid refresh token");
  }

  const tokenHash = hashToken(input.refreshToken);
  const storedToken = await findRefreshTokenByHash(tokenHash);

  if (!storedToken) {
    return;
  }

  if (!storedToken.revokedAt) {
    await revokeRefreshToken(tokenHash);
  }
};

export const getCurrentUser = async (userId: string): Promise<AuthUser> => {
  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(404, COMMON_MESSAGES.NOT_FOUND);
  }

  return sanitizeUser(user);
};
