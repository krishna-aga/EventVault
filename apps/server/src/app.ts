import express from "express";
import cors from "cors";
import path from "node:path";
import routes from "./routes/index.js";
import { corsOptions } from "./config/cors.js";
import { errorHandler } from "./common/errors/errorHandler.js";
import { notFoundMiddleware } from "./common/middleware/notFound.middleware.js";

export const app = express();

app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve(process.cwd(), "public/uploads")));


app.get("/api/health", (req, res) =>
  res.status(200).json({ success: true })
);
app.use("/api", routes);

app.use(notFoundMiddleware);
app.use(errorHandler);
