import { Router } from "express";
import { databaseStatus } from "../config/db.js";
import { createAuthRouter } from "./authRoutes.js";
import { userRouter } from "./userRoutes.js";
import { projectRouter } from "./projectRoutes.js";
import { projectRequestRouter } from "./projectRequestRoutes.js";
import { assetRouter } from "./assetRoutes.js";
import { mediaRouter } from "./mediaRoutes.js";

export function createApiRouter(options = {}) {
  const router = Router();
  router.get("/health", (_req, res) => res.json({ data: { status: "ok", database: databaseStatus() } }));
  router.use("/auth", createAuthRouter(options));
  router.use("/users", userRouter);
  router.use("/projects", projectRouter);
  router.use("/project-requests", projectRequestRouter);
  router.use("/assets", assetRouter);
  router.use("/media", mediaRouter);
  return router;
}
