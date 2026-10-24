import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
const role = z.enum(["admin", "designer", "client"]);
const optionalBooleanQuery = z.enum(["true", "false"]).optional();
export const listUsersSchema = z.object({ body: z.any(), params: z.any(), query: z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(12), search: z.string().trim().max(100).optional(), role: role.optional(), isActive: optionalBooleanQuery, sort: z.enum(["name", "-name", "createdAt", "-createdAt"]).default("-createdAt") }) });
export const createUserSchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().toLowerCase().email().max(254), role: z.enum(["designer", "admin"]), initialPassword: z.string().min(8).max(72).regex(/[A-Za-z]/).regex(/\d/) }), params: z.any(), query: z.any() });
export const userIdSchema = z.object({ body: z.any(), params: z.object({ id: objectId }), query: z.any() });
export const updateUserSchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(80).optional(), avatarUrl: z.union([z.string().url().max(500), z.literal("")]).optional(), role: role.optional(), isActive: z.boolean().optional() }).refine((value) => Object.keys(value).length > 0, "At least one field is required"), params: z.object({ id: objectId }), query: z.any() });
