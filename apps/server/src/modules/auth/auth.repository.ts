import { prisma } from "@repo/db";
import type { RoleName } from "../../common/constants/roles.js";

export const findUserByEmail = (email: string) => {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
};

export const findUserById = (id: string) => {
  return prisma.user.findUnique({
    where: {
      id,
    },
  });
};

export const createUser = (data: {
  name: string;
  email: string;
  passwordHash: string;
  role: RoleName;
}) => {
  return prisma.user.create({
    data,
  });
};

export const createRefreshToken = (data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) => {
  return prisma.refreshToken.create({
    data,
  });
};

export const findRefreshTokenByHash = (tokenHash: string) => {
  return prisma.refreshToken.findUnique({
    where: {
      tokenHash,
    },
  });
};

export const revokeRefreshToken = (tokenHash: string) => {
  return prisma.refreshToken.update({
    where: {
      tokenHash,
    },
    data: {
      revokedAt: new Date(),
    },
  });
};

export const revokeRefreshTokensForUser = (userId: string) => {
  return prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
};
