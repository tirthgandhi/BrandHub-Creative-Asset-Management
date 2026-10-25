import { Router } from "express";
import { Asset, ASSET_STATUSES } from "../models/Asset.js";
import { MediaAsset } from "../models/MediaAsset.js";
import { Project } from "../models/Project.js";
import { ProjectRequest } from "../models/ProjectRequest.js";
import { ReviewEvent } from "../models/ReviewEvent.js";
import { User } from "../models/User.js";
import { requireAuth, requirePasswordChanged } from "../middleware/auth.js";
import { buildAssetScope } from "../services/assetAccess.js";
import { buildProjectScope } from "../services/projectAccess.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth, requirePasswordChanged);

dashboardRouter.get("/stats", asyncHandler(async (req, res) => {
  const user = req.user;
  const projectScope = buildProjectScope(user);
  const assetScope = await buildAssetScope(user);
  const visibleProjects = await Project.find(projectScope).select("_id status designerIds").lean();
  const projectIds = visibleProjects.map((project) => project._id);
  const requestScope = ["project_manager", "super_admin"].includes(user.role) ? {} : user.role === "client" ? { clientId: user._id } : null;
  const [assetStatuses, mediaCount, requests, activeUsers] = await Promise.all([
    Asset.aggregate([{ $match: assetScope }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    MediaAsset.countDocuments({ projectId: { $in: projectIds } }),
    requestScope ? ProjectRequest.aggregate([{ $match: requestScope }, { $group: { _id: "$status", count: { $sum: 1 } } }]) : Promise.resolve([]),
    ["project_manager", "super_admin"].includes(user.role) ? User.countDocuments({ isActive: true }) : Promise.resolve(undefined),
  ]);
  const assetCounts = Object.fromEntries(ASSET_STATUSES.map((status) => [status, assetStatuses.find((row) => row._id === status)?.count || 0]));
  const requestCounts = Object.fromEntries(["pending", "processing", "approved", "rejected", "cancelled"].map((status) => [status, requests.find((row) => row._id === status)?.count || 0]));
  let clientsWithoutProject;
  if (["project_manager", "super_admin"].includes(user.role)) {
    const [clientIds, assignedIds] = await Promise.all([User.distinct("_id", { role: "client", isActive: true }), Project.distinct("clientId")]);
    const assigned = new Set(assignedIds.map(String));
    clientsWithoutProject = clientIds.filter((id) => !assigned.has(String(id))).length;
  }
  const visibleAssetIds = await Asset.distinct("_id", assetScope);
  const reviewEvents = await ReviewEvent.find({ assetId: { $in: visibleAssetIds } }).sort({ createdAt: -1 }).limit(10).populate("assetId", "title").lean();
  const recentActivity = reviewEvents.map((event) => ({
    id: String(event._id), type: event.action, description: `${event.assetId?.title || "Asset"}: ${event.action.replaceAll("_", " ")}`,
    at: event.createdAt, href: `/app/assets/${event.assetId?._id || event.assetId}`,
  }));
  const projectStatuses = Object.fromEntries(["active", "on_hold", "completed", "archived"].map(status => [status, visibleProjects.filter(project => project.status === status).length]));
  let workload = [];
  if (["project_manager", "super_admin"].includes(user.role)) {
    const totals = new Map();
    for (const project of visibleProjects.filter(project => project.status === "active")) for (const designer of project.designerIds) totals.set(String(designer), (totals.get(String(designer)) || 0) + 1);
    const designers = await User.find({ _id: { $in: [...totals.keys()] }, role: "designer" }).select("name").lean();
    workload = designers.map(person => ({ id: String(person._id), name: person.name, projects: totals.get(String(person._id)) })).sort((a, b) => b.projects - a.projects || a.name.localeCompare(b.name));
  }
  res.json({ data: { role: user.role, analytics: { projectStatuses, workload }, metrics: {
    projects: visibleProjects.length, media: mediaCount, assets: assetCounts, requests: requestCounts,
    pendingReviews: assetCounts.in_review,
    ...(["project_manager", "super_admin"].includes(user.role) ? { activeUsers, clientsWithoutProject } : {}),
    ...(user.role === "designer" ? { requiringAction: assetCounts.draft + assetCounts.changes_requested } : {}),
  }, recentActivity } });
}));
