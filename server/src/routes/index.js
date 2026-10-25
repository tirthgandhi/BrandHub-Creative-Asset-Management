import { reportRouter } from "./reportRoutes.js";
import { Router } from "express";
import { databaseStatus } from "../config/db.js";
import { createAuthRouter } from "./authRoutes.js";
import { userRouter } from "./userRoutes.js";
import { projectRouter } from "./projectRoutes.js";
import { projectRequestRouter } from "./projectRequestRoutes.js";
import { assetRouter } from "./assetRoutes.js";
import { mediaRouter } from "./mediaRoutes.js";
import { reviewRouter } from "./reviewRoutes.js";
import { commentRouter } from "./commentRoutes.js";
import { bookmarkRouter } from "./bookmarkRoutes.js";
import { dashboardRouter } from "./dashboardRoutes.js";

export function createApiRouter(options = {}) {
  const router = Router();
  router.get("/health", (_req, res) => res.json({ data: { status: "ok", database: databaseStatus() } }));
  router.use("/auth", createAuthRouter(options));
  router.use("/users", userRouter);
  router.use("/projects", projectRouter);
  router.use("/project-requests", projectRequestRouter);
  router.use("/assets", assetRouter);
  router.use("/media", mediaRouter);
  // Phase 5 - Review endpoints are mounted on /api/assets for REST consistency
  router.use("/assets", reviewRouter);
  router.use("/assets", commentRouter);
  router.use("/assets", bookmarkRouter);
  router.use("/comments", commentRouter);
  router.use("/bookmarks", bookmarkRouter);
  router.use("/dashboard", dashboardRouter);
  router.use("/reports", reportRouter);
  return router;
}
