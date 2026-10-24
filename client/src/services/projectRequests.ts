import { api } from "./api";
import type { Category, Pagination } from "./projects";

export type ProjectRequest = { id: string; clientId: string; clientName?: string; title: string; description: string; category: Category; desiredDeadline: string | null; status: "pending" | "approved" | "rejected" | "cancelled"; adminNote: string; projectId: string | null; createdAt: string };
export async function listProjectRequests(filters: { page?: number; status?: string; category?: string }) { return (await api.get<{ data: ProjectRequest[]; pagination: Pagination }>("/project-requests", { params: filters })).data; }
export async function createProjectRequest(input: { title: string; description: string; category: Category; desiredDeadline?: string }) { return (await api.post<{ data: { projectRequest: ProjectRequest } }>("/project-requests", input)).data.data.projectRequest; }
export async function decideProjectRequest(id: string, input: { decision: "approve" | "reject"; note?: string; designerIds?: string[]; startDate?: string; dueDate?: string }) { return (await api.patch<{ data: { projectRequest: ProjectRequest; project?: { id: string } } }>(`/project-requests/${id}`, input)).data.data; }
export async function cancelProjectRequest(id: string) { return (await api.patch<{ data: { projectRequest: ProjectRequest } }>(`/project-requests/${id}/cancel`, {})).data.data.projectRequest; }
