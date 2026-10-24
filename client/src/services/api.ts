import axios, { AxiosError } from "axios";

export type ApiError = { code: string; message: string; details: Array<{ field?: string; message: string }>; status?: number };

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: { Accept: "application/json" },
});

let csrfToken: string | null = null;
export function setCsrfToken(token: string | null) { csrfToken = token; }

api.interceptors.request.use((config) => {
  if (csrfToken && config.method && !["get", "head", "options"].includes(config.method)) config.headers.set("X-CSRF-Token", csrfToken);
  return config;
});

export function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const body = (error as AxiosError<{ error?: ApiError }>).response?.data;
    if (body?.error) return { ...body.error, status: error.response?.status };
    return { code: "NETWORK_ERROR", message: error.message || "Unable to reach BrandHub", details: [], status: error.response?.status };
  }
  return { code: "UNKNOWN_ERROR", message: error instanceof Error ? error.message : "Something went wrong", details: [] };
}
