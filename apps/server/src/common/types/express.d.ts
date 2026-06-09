import type { RoleName } from "../constants/roles.js";

export {};

declare global {
  namespace Express {
    interface User {
      id: string;
      name: string;
      email: string;
      role: RoleName;
      profileImage: string | null;
    }

    interface Request {
      user?: User;
    }
  }
}
