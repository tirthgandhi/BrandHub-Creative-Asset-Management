import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { createApiRouter } from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

export function createApp({ clientUrl = process.env.CLIENT_URL || "http://localhost:5173", sessionSecret = process.env.SESSION_SECRET || "test-session-secret-that-is-at-least-32-chars", sessionStore, cookieName = process.env.COOKIE_NAME || "brandhub_session", cookieSecure = process.env.COOKIE_SECURE === "true", cookieSameSite = process.env.COOKIE_SAME_SITE || "lax", authRateLimit = 20 } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", process.env.NODE_ENV === "production" ? 1 : false);
  app.use(helmet());
  app.use(cors({ origin: clientUrl, credentials: true, methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"] }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  const cookieOptions = { httpOnly: true, secure: cookieSecure, sameSite: cookieSameSite, maxAge: 7 * 24 * 60 * 60 * 1000 };
  app.set("cookieName", cookieName);
  app.set("cookieOptions", cookieOptions);
  app.use(session({ name: cookieName, secret: sessionSecret, resave: false, saveUninitialized: false, rolling: true, store: sessionStore, cookie: cookieOptions }));
  app.use("/api", apiLimiter, createApiRouter({ limit: authRateLimit }));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
