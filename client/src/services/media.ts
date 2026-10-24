import { api } from "./api";
import type { Pagination } from "./projects";

export type Media = {
  id: string;
  title: string;
  description: string;
  category: string;
  contentType: "gallery" | "post" | "story" | "reel";
  mediaType: "image" | "video";
  storageType: "local" | "gridfs";
  url: string;
  thumbnailUrl: string | null;
  fileSize: number;
  projectId: string;
  status: string;
  createdAt: string;
};

export function mediaUrl(path: string) {
  if (/^https?:\/\//.test(path) || !path.startsWith("/api/")) return path;
  const configured = import.meta.env.VITE_API_URL || "/api";
  const base = new URL(configured, window.location.origin);
  return `${base.origin}${path}`;
}

export async function listMedia(params: { page?: number; projectId?: string; category?: string; contentType?: string } = {}) {
  return (await api.get<{ data: Media[]; pagination: Pagination }>("/media", { params })).data;
}

export async function uploadMedia(input: { projectId: string; title: string; category: string; contentType: Media["contentType"]; file: File; onProgress?: (percent: number) => void }) {
  const form = new FormData();
  form.set("title", input.title);
  form.set("category", input.category);
  form.set("contentType", input.contentType);
  form.set("file", input.file);
  return (await api.post<{ data: { media: Media } }>("/media/upload", form, {
    params: { projectId: input.projectId },
    headers: { "X-Upload-Size": String(input.file.size) },
    onUploadProgress: (progress) => {
      if (progress.total) input.onProgress?.(Math.min(99, Math.round(progress.loaded / progress.total * 100)));
    },
  })).data.data.media;
}
