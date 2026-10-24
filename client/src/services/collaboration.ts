import { api } from "./api";

export type ReviewEvent = { id: string; action: string; version: number; fromStatus: string; toStatus: string; actor: { id: string; name?: string }; note: string; createdAt: string };
export type Revision = { version: number; uploadedBy: { id: string; name?: string }; note: string; createdAt: string };
export type Comment = { id: string; content: string; version: number; user: { id: string; name?: string }; createdAt: string };

export async function submitAssetForReview(id: string, expectedVersion: number) { await api.post(`/assets/${id}/submit`, { expectedVersion }); }
export async function reviewAsset(id: string, decision: "approve" | "request_changes", expectedVersion: number, note?: string) { await api.patch(`/assets/${id}/review`, { decision, expectedVersion, note }); }
export async function uploadAssetRevision(id: string, file: File, expectedVersion: number, note: string) {
  const form = new FormData();
  form.set("file", file);
  form.set("expectedVersion", String(expectedVersion));
  form.set("note", note);
  await api.post(`/assets/${id}/revisions`, form);
}
export async function listReviewHistory(id: string) { return (await api.get<{ data: ReviewEvent[] }>(`/assets/${id}/history`)).data.data; }
export async function listRevisions(id: string) { return (await api.get<{ data: Revision[] }>(`/assets/${id}/revisions`)).data.data; }
export async function listComments(id: string) { return (await api.get<{ data: Comment[] }>(`/assets/${id}/comments`)).data.data; }
export async function postComment(id: string, content: string, version: number) { await api.post(`/assets/${id}/comments`, { content, version }); }
export async function deleteComment(id: string) { await api.delete(`/comments/${id}`); }
export async function addBookmark(id: string) { await api.post(`/assets/${id}/bookmark`); }
export async function removeBookmark(id: string) { await api.delete(`/assets/${id}/bookmark`); }
export type BookmarkedAsset = { id: string; asset: { id: string; title: string; category: string; status: string; currentVersion: number; thumbnailUrl: string; project: { id: string; title: string } }; createdAt: string };
export async function listBookmarks(page = 1) { return (await api.get<{ data: BookmarkedAsset[]; pagination: { page: number; limit: number; total: number } }>("/bookmarks", { params: { page } })).data; }
