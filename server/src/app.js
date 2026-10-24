import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

export function createApp({ clientUrl = process.env.CLIENT_URL || "http://localhost:5173" } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", process.env.NODE_ENV === "production" ? 1 : false);
  app.use(helmet());
  app.use(cors({ origin: clientUrl, credentials: true, methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"] }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use("/api", apiLimiter, apiRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
