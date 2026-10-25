import type { AppRole } from "../types/auth";

export const roleLabels: Record<AppRole, string> = { project_manager: "Project Manager", super_admin: "Super Admin", client: "Client", designer: "Designer" };
export const demoAccounts: Record<AppRole, string> = {
  project_manager: "admin@brandhub.example", super_admin: "superadmin@brandhub.example", client: "iris.vale@brandhub.example", designer: "nisha.verma@brandhub.example",
};
// Shared route policy for navigation and post-login redirects. API authorization
// independently checks the stored user role and project membership.
export function canVisit(path: string, role: AppRole) {
  if (!/^\/app(?:\/|$)/.test(path) || path.includes("..") || path.includes("//")) return false;
  if (/^\/app\/reports(?:\/|$)/.test(path)) return ["project_manager", "super_admin"].includes(role);
  if (/^\/app\/super-admin(?:\/|$)/.test(path)) return role === "super_admin";
  if (/^\/app\/(?:admin|management)(?:\/|$)/.test(path) || /^\/app\/projects\/(?:new|[^/]+\/edit)\/?$/.test(path)) return ["super_admin", "project_manager"].includes(role);
  if (/^\/app\/requests(?:\/|$)/.test(path)) return role === "client";
  if (/^\/app\/(?:assets|media)\/upload\/?$/.test(path)) return role !== "client";
  return !/^\/app\/explore(?:\/|$)/.test(path);
}
export function loginDestination(from: unknown, role: AppRole) {
  return typeof from === "string" && canVisit(from, role) ? from : "/app/dashboard";
}
