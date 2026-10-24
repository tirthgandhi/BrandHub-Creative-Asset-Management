import { api } from "./api";
import type { Category, Pagination } from "./projects";

export type Asset = { id: string; projectId: string; title: string; description?: string; category: Category; tags?: string[]; status: "draft" | "in_review" | "changes_requested" | "approved"; currentVersion: number; thumbnailUrl: string; isBookmarked: boolean; uploadedBy?: { id: string; name?: string }; createdAt: string };
export type AssetFilters = { page?: number; search?: string; projectId?: string; category?: string; status?: string; uploadedBy?: "me"; sort?: string };
export async function listAssets(filters: AssetFilters) { return (await api.get<{ data: Asset[]; pagination: Pagination }>("/assets", { params: filters })).data; }
export async function getAsset(id: string) { return (await api.get<{ data: { asset: Asset } }>(`/assets/${id}`)).data.data.asset; }
export async function getAssetFile(id: string) { return (await api.get<{ data: { url: string; expiresAt: string } }>(`/assets/${id}/file`)).data.data; }
export async function uploadAsset(input: { projectId: string; title: string; description: string; category: Category; file: File; uploadKey: string }) { const form = new FormData(); form.set("projectId", input.projectId); form.set("title", input.title); form.set("description", input.description); form.set("category", input.category); form.set("uploadKey", input.uploadKey); form.set("file", input.file); return (await api.post<{ data: { asset: Asset } }>("/assets", form)).data.data.asset; }
export async function updateAsset(id: string, input: { title?: string; description?: string; category?: Category; tags?: string[]; expectedVersion?: number }) { return (await api.patch<{ data: { asset: Asset } }>(`/assets/${id}`, input)).data.data.asset; }
export async function deleteAsset(id: string) { await api.delete(`/assets/${id}`); }
