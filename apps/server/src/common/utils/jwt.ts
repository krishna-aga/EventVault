import { createHmac } from "node:crypto";
import { env } from "../../config/env.js";
import type { RoleName } from "../constants/roles.js";
import { ApiError } from "../errors/ApiError.js";

export type TokenType = "access" | "refresh";

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: RoleName;
  type: TokenType;
  iat: number;
  exp: number;
}

const base64UrlEncode = (value: Buffer | string): string => {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);

  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

const base64UrlDecode = (value: string): Buffer => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));

  return Buffer.from(normalized + padding, "base64");
};

const parseDuration = (input: string): number => {
  const match = /^(\d+)([smhd])$/.exec(input);

  if (!match) {
    throw new ApiError(500, "Invalid token duration configuration");
  }

  const amount = Number(match[1]);
  const unit = match[2]! as "s" | "m" | "h" | "d";

  switch (unit) {
    case "s":
      return amount * 1_000;
    case "m":
      return amount * 60_000;
    case "h":
      return amount * 3_600_000;
    case "d":
      return amount * 86_400_000;
  }
};

const signContent = (content: string): string => {
  return base64UrlEncode(createHmac("sha256", env.jwtSecret).update(content).digest());
};

export const hashToken = (token: string): string => {
  return createHmac("sha256", env.jwtSecret).update(`refresh:${token}`).digest("hex");
};

export const signToken = (
  payload: Omit<JwtPayload, "iat" | "exp">,
  expiresIn: string,
): string => {
  const issuedAt = Math.floor(Date.now() / 1_000);
  const expiresAt = Math.floor((Date.now() + parseDuration(expiresIn)) / 1_000);
  const header = { alg: "HS256", typ: "JWT" };
  const body: JwtPayload = {
    ...payload,
    iat: issuedAt,
    exp: expiresAt,
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(body));
  const content = `${encodedHeader}.${encodedPayload}`;

  return `${content}.${signContent(content)}`;
};

export const verifyToken = (token: string): JwtPayload => {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new ApiError(401, "Invalid authentication token");
  }

  const content = `${encodedHeader}.${encodedPayload}`;

  if (signContent(content) !== encodedSignature) {
    throw new ApiError(401, "Invalid authentication token");
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8")) as JwtPayload;

  if (payload.exp <= Math.floor(Date.now() / 1_000)) {
    throw new ApiError(401, "Authentication token expired");
  }

  return payload;
};
