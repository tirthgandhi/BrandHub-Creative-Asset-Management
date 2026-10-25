import { api } from "./api";
import type { Pagination } from "./projects";

export type ReviewEvent = {
  id: string;
  action: "submit" | "approve" | "request_changes" | "revision_uploaded";
  version: number;
  fromStatus: string;
  toStatus: string;
  actor: { id: string; name: string };
  note: string;
  createdAt: string;
};

export type Revision = {
  version: number;
  uploadedBy: { id: string; name: string };
  note: string;
  createdAt: string;
};

export type Comment = {
  id: string;
  content: string;
  version: number;
  user: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
};

export type Bookmark = {
  id: string;
  asset: {
    id: string;
    title: string;
    category: string;
    status: string;
    currentVersion: number;
    thumbnailUrl: string;
    project: {
      id: string;
      title: string;
    };
  };
  createdAt: string;
};

// Submit asset for review
export async function submitAsset(assetId: string, expectedVersion: number) {
  return (
    await api.post<{ data: { asset: { id: string; status: string; currentVersion: number } } }>(
      `/assets/${assetId}/submit`,
      { expectedVersion }
    )
  ).data.data.asset;
}

// Review asset (approve or request changes)
export async function reviewAsset(
  assetId: string,
  decision: "approve" | "request_changes",
  expectedVersion: number,
  note?: string
) {
  return (
    await api.patch<{
      data: {
        asset: { id: string; status: string; currentVersion: number; reviewedBy: string; reviewedAt: string };
        reviewEvent: { id: string; action: string; version: number };
      };
    }>(`/assets/${assetId}/review`, { decision, expectedVersion, note })
  ).data.data;
}

// Upload new revision
export async function uploadRevision(assetId: string, expectedVersion: number, file: File, note?: string) {
  const form = new FormData();
  form.set("expectedVersion", expectedVersion.toString());
  if (note) form.set("note", note);
  form.set("file", file);

  return (
    await api.post<{
      data: {
        asset: { id: string; status: string; currentVersion: number };
        revision: { version: number; note: string; createdAt: string };
      };
    }>(`/assets/${assetId}/revisions`, form)
  ).data.data;
}

// Get revision history
export async function getRevisions(assetId: string, page = 1, limit = 12) {
  return (
    await api.get<{ data: Revision[]; pagination: Pagination }>(`/assets/${assetId}/revisions`, {
      params: { page, limit },
    })
  ).data;
}

// Get review history
export async function getReviewHistory(assetId: string, page = 1, limit = 20) {
  return (
    await api.get<{ data: ReviewEvent[]; pagination: Pagination }>(`/assets/${assetId}/history`, {
      params: { page, limit },
    })
  ).data;
}

// Get comments
export async function getComments(assetId: string, version?: number, page = 1, limit = 20) {
  return (
    await api.get<{ data: Comment[]; pagination: Pagination }>(`/assets/${assetId}/comments`, {
      params: { page, limit, ...(version && { version }) },
    })
  ).data;
}

// Create comment
export async function createComment(assetId: string, content: string, version: number) {
  return (
    await api.post<{ data: { comment: Comment } }>(`/assets/${assetId}/comments`, { content, version })
  ).data.data.comment;
}

// Delete comment
export async function deleteComment(commentId: string) {
  await api.delete(`/comments/${commentId}`);
}

// Get bookmarks
export async function getBookmarks(page = 1, limit = 24) {
  return (
    await api.get<{ data: Bookmark[]; pagination: Pagination }>("/bookmarks", {
      params: { page, limit },
    })
  ).data;
}

// Add bookmark
export async function addBookmark(assetId: string) {
  return (
    await api.post<{ data: { bookmark: { id: string; assetId: string; createdAt: string } } }>(
      `/assets/${assetId}/bookmark`
    )
  ).data.data.bookmark;
}

// Remove bookmark
export async function removeBookmark(assetId: string) {
  await api.delete(`/assets/${assetId}/bookmark`);
}
