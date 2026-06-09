import type { CorsOptions } from "cors";
import { env } from "./env.js";

const allowedOrigin =
  env.corsOrigin === "*"
    ? true
    : env.corsOrigin
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

export const corsOptions: CorsOptions = {
  origin: allowedOrigin,
  credentials: true,
};
