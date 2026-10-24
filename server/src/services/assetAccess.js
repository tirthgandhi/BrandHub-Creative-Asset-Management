import { Project } from "../models/Project.js";
import { buildProjectScope, projectAccess } from "./projectAccess.js";

export async function buildAssetScope(user, { projectId } = {}) {
  const projects = await Project.find({ ...buildProjectScope(user), ...(projectId ? { _id: projectId } : {}) }).select("_id clientId designerIds visibility status").lean();
  const full = []; const limited = [];
  for (const project of projects) {
    const access = projectAccess(user, project);
    if (access === "admin" || access === "designer") full.push(project._id);
    else if (access === "client") limited.push({ _id: project._id, statuses: ["in_review", "changes_requested", "approved"] });
    else if (access === "public") limited.push({ _id: project._id, statuses: ["approved"] });
  }
  return { $or: [{ projectId: { $in: full } }, ...limited.map((entry) => ({ projectId: entry._id, status: { $in: entry.statuses } }))] };
}

export function canManageAsset(user, project, asset) {
  const access = projectAccess(user, project);
  return access === "admin" || access === "designer" && String(asset.uploadedBy?._id || asset.uploadedBy) === user.id;
}

export function canUploadToProject(user, project) {
  const access = projectAccess(user, project);
  return project.status !== "archived" && (access === "admin" || access === "designer");
}
