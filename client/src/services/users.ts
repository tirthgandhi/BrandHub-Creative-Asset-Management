import { api } from "./api";
import type { AuthUser } from "../context/AuthContext";

export type UserFilters = { search?: string; role?: string; isActive?: string; page?: number; limit?: number };
export async function listUsers(filters: UserFilters) { return (await api.get<{ data: AuthUser[]; pagination: { page: number; limit: number; total: number } }>("/users", { params: filters })).data; }
export async function createUser(input: { name: string; email: string; role: "admin" | "designer"; initialPassword: string }) { return (await api.post<{ data: { user: AuthUser } }>("/users", input)).data.data.user; }
export async function updateUser(id: string, input: Partial<Pick<AuthUser, "name" | "avatarUrl" | "role" | "isActive">>) { return (await api.patch<{ data: { user: AuthUser } }>(`/users/${id}`, input)).data.data.user; }

export async function listActiveDesigners() {
  const users: AuthUser[] = [];
  for (let page = 1; ; page++) {
    const result = await listUsers({ role: "designer", isActive: "true", page, limit: 50 });
    users.push(...result.data);
    if (!result.data.length || users.length >= result.pagination.total) return users;
  }
}
