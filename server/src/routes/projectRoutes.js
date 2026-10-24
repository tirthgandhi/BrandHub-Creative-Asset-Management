import { Router } from "express";
import { Project } from "../models/Project.js";
import { Asset } from "../models/Asset.js";
import { requireAuth, requirePasswordChanged, requireRole } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { buildProjectScope, findAccessibleProject, projectAccess, serializeProject } from "../services/projectAccess.js";
import { validateAssignments, validateProjectDates } from "../services/projectValidation.js";
import { projectCreate, projectDelete, projectId, projectList, projectUpdate } from "../validation/projectSchemas.js";

export const projectRouter = Router();
projectRouter.use(requireAuth, requirePasswordChanged);

function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

projectRouter.get("/", validate(projectList), asyncHandler(async (req, res) => {
  const { page, limit, search, category, status, visibility, sort } = req.validated.query;
  const filter = { $and: [buildProjectScope(req.user)] };
  if (!status) filter.$and.push({ status: { $ne: "archived" } });
  if (search) filter.$and.push({ title: { $regex: escapeRegex(search), $options: "i" } });
  if (category) filter.$and.push({ category });
  if (status) filter.$and.push({ status });
  if (visibility) filter.$and.push({ visibility });
  const [projects, total] = await Promise.all([Project.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).populate("clientId", "name").populate("designerIds", "name"), Project.countDocuments(filter)]);
  const counts = await Asset.aggregate([{ $match: { projectId: { $in: projects.map((project) => project._id) } } }, { $group: { _id: "$projectId", total: { $sum: 1 }, approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } } } }]);
  const byId = new Map(counts.map((count) => [String(count._id), count]));
  res.json({ data: projects.map((project) => serializeProject(project, projectAccess(req.user, project), byId.get(project.id)?.total || 0, byId.get(project.id)?.approved || 0)), pagination: { page, limit, total } });
}));

projectRouter.post("/", requireRole("admin"), requireCsrf, validate(projectCreate), asyncHandler(async (req, res) => {
  const body = req.validated.body;
  await validateAssignments(body.clientId, body.designerIds);
  validateProjectDates(body.startDate, body.dueDate);
  const project = await Project.create({ ...body, createdBy: req.user._id });
  await project.populate([{ path: "clientId", select: "name" }, { path: "designerIds", select: "name" }]);
  res.status(201).json({ data: { project: serializeProject(project, "admin") } });
}));

projectRouter.get("/:id", validate(projectId), asyncHandler(async (req, res) => {
  const entry = await findAccessibleProject(req.user, req.validated.params.id);
  if (!entry) throw new AppError(404, "NOT_FOUND", "Project not found");
  const [assetCount, approvedAssetCount] = await Promise.all([Asset.countDocuments({ projectId: entry.project._id }), Asset.countDocuments({ projectId: entry.project._id, status: "approved" })]);
  res.json({ data: { project: serializeProject(entry.project, entry.access, assetCount, approvedAssetCount) } });
}));

projectRouter.patch("/:id", requireRole("admin"), requireCsrf, validate(projectUpdate), asyncHandler(async (req, res) => {
  const project = await Project.findById(req.validated.params.id);
  if (!project) throw new AppError(404, "NOT_FOUND", "Project not found");
  const body = req.validated.body;
  const clientId = body.clientId ?? project.clientId;
  const designerIds = body.designerIds ?? project.designerIds;
  await validateAssignments(clientId, designerIds);
  validateProjectDates(body.startDate ?? project.startDate, body.dueDate ?? project.dueDate);
  Object.assign(project, body);
  await project.save();
  await project.populate([{ path: "clientId", select: "name" }, { path: "designerIds", select: "name" }]);
  res.json({ data: { project: serializeProject(project, "admin") } });
}));

projectRouter.delete("/:id", requireRole("admin"), requireCsrf, validate(projectDelete), asyncHandler(async (req, res) => {
  const project = await Project.findById(req.validated.params.id);
  if (!project) throw new AppError(404, "NOT_FOUND", "Project not found");
  if (req.validated.query.mode === "delete") {
    throw new AppError(409, "CONFLICT", "Permanent project deletion is unavailable; archive the project to preserve its history");
  }
  project.status = "archived";
  await project.save();
  await project.populate([{ path: "clientId", select: "name" }, { path: "designerIds", select: "name" }]);
  res.json({ data: { project: serializeProject(project, "admin") } });
}));
