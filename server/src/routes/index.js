import { Router } from "express";
import { databaseStatus } from "../config/db.js";

export const apiRouter = Router();
apiRouter.get("/health", (_req, res) => res.json({ data: { status: "ok", database: databaseStatus() } }));
