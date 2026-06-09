import type { RoleName } from "../../common/constants/roles.js";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  profileImage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}
