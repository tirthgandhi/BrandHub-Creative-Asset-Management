import { api } from "./api";

export const categories = ["Logo", "Social Media", "Website Banner", "Poster", "Brand Identity", "Marketing Creative"] as const;
export type Category = typeof categories[number];
export type Project = { id: string; title: string; description: string; category: Category; status?: "active" | "on_hold" | "completed" | "archived"; visibility: "private" | "public"; clientId?: string; client?: { id: string; name?: string }; designerIds?: string[]; designers?: { id: string; name?: string }[]; startDate?: string | null; dueDate?: string | null; assetCount?: number; approvedAssetCount?: number; createdAt?: string };
export type ProjectInput = { title: string; description: string; category: Category; clientId: string; designerIds: string[]; status: NonNullable<Project["status"]>; visibility: Project["visibility"]; startDate?: string; dueDate?: string };
export type Pagination = { page: number; limit: number; total: number };
export type ProjectFilters = { page?: number; limit?: number; search?: string; category?: string; status?: string; visibility?: string; sort?: string };
export async function listProjects(filters: ProjectFilters) { return (await api.get<{ data: Project[]; pagination: Pagination }>("/projects", { params: filters })).data; }
export async function getProject(id: string) { return (await api.get<{ data: { project: Project } }>(`/projects/${id}`)).data.data.project; }
export async function createProject(input: ProjectInput) { return (await api.post<{ data: { project: Project } }>("/projects", input)).data.data.project; }
export async function updateProject(id: string, input: Partial<ProjectInput>) { return (await api.patch<{ data: { project: Project } }>(`/projects/${id}`, input)).data.data.project; }
export async function archiveProject(id: string) { return (await api.delete<{ data: { project: Project } }>(`/projects/${id}`)).data.data.project; }
