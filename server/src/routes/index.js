import { Router } from "express";
import { databaseStatus } from "../config/db.js";
import { createAuthRouter } from "./authRoutes.js";
import { userRouter } from "./userRoutes.js";

export function createApiRouter(options = {}) {
  const router = Router();
  router.get("/health", (_req, res) => res.json({ data: { status: "ok", database: databaseStatus() } }));
  router.use("/auth", createAuthRouter(options));
  router.use("/users", userRouter);
  return router;
}
