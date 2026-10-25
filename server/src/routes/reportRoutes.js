import { z } from "zod";
import { AppError } from "../utils/AppError.js";
import { Router } from "express";
import { requireAuth, requirePasswordChanged, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { workspaceReportData, renderWorkspaceReport } from "../services/workspaceReport.js";
export const reportRouter = Router();
reportRouter.use(requireAuth, requirePasswordChanged, requireRole("project_manager"));
reportRouter.use((req, _res, next) => {
  const parsed = z.object({ year: z.coerce.number().int().min(2000).max(2100).optional(), month: z.coerce.number().int().min(1).max(12).optional() }).safeParse(req.query);
  if (!parsed.success || parsed.data.month && !parsed.data.year) return next(new AppError(422, "VALIDATION_ERROR", "Choose a valid report year and month"));
  req.reportPeriod = parsed.data; next();
});
reportRouter.get("/summary", asyncHandler(async (req, res) => res.json({ data: await workspaceReportData(req.user, req.reportPeriod) })));
reportRouter.get("/workspace.pdf", asyncHandler(async (req, res) => {
  const data = await workspaceReportData(req.user, req.reportPeriod);
  const bytes = await renderWorkspaceReport(data);
  res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="BrandHub-${req.user.role === "super_admin" ? "Super-Admin" : "Project-Manager"}-Report.pdf"`, "Cache-Control": "private, no-store" }).send(bytes);
}));
