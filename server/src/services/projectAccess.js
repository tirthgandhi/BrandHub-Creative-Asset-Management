import { Project } from "../models/Project.js";

export function buildProjectScope(user, { publicOnly = false } = {}) {
  const publicScope = { visibility: "public", status: { $ne: "archived" } };
  if (publicOnly) return publicScope;
  if (user.role === "admin") return {};
  if (user.role === "designer") return { designerIds: user._id };
  return { $or: [{ clientId: user._id }, publicScope] };
}

export function projectAccess(user, project) {
  if (!project) return "none";
  if (user.role === "admin") return "admin";
  if (user.role === "designer" && project.designerIds.some((id) => String(id._id || id) === user.id)) return "designer";
  if (user.role === "client" && String(project.clientId?._id || project.clientId) === user.id) return "client";
  if (project.visibility === "public" && project.status !== "archived") return "public";
  return "none";
}

const id = (value) => String(value?._id || value);
const display = (value) => value?.name ? { id: id(value), name: value.name } : { id: id(value) };

export function serializeProject(project, access, assetCount = 0, approvedAssetCount = 0) {
  const base = { id: project.id, title: project.title, description: project.description, category: project.category };
  if (access === "public") return { ...base, visibility: "public", approvedAssetCount, designers: project.designerIds.map(display) };
  return { ...base, status: project.status, visibility: project.visibility, clientId: id(project.clientId), client: display(project.clientId), designerIds: project.designerIds.map(id), designers: project.designerIds.map(display), createdBy: id(project.createdBy), startDate: project.startDate || null, dueDate: project.dueDate || null, assetCount, approvedAssetCount, createdAt: project.createdAt, updatedAt: project.updatedAt };
}

export async function findAccessibleProject(user, projectId) {
  const project = await Project.findOne({ _id: projectId, ...buildProjectScope(user) }).populate("clientId", "name").populate("designerIds", "name");
  if (!project || projectAccess(user, project) === "none") return null;
  return { project, access: projectAccess(user, project) };
}
