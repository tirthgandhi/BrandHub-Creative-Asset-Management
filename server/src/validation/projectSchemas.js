import { z } from "zod";
import { CATEGORIES, PROJECT_STATUSES } from "../models/Project.js";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
export const category = z.enum(CATEGORIES);
const date = z.iso.datetime({ offset: true }).pipe(z.coerce.date());
const optionalDate = z.union([date, z.literal("").transform(() => undefined), z.null().transform(() => undefined)]).optional();
export const idParams = z.object({ id: objectId });
export const envelope = (body, params = z.any(), query = z.any()) => z.object({ body, params, query });
export const paging = { page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(12) };
const projectFields = {
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(4000),
  category,
  status: z.enum(PROJECT_STATUSES).optional(),
  visibility: z.enum(["private", "public"]).optional(),
  clientId: objectId,
  designerIds: z.array(objectId).max(30).refine((items) => new Set(items).size === items.length, "Duplicate designers are not allowed").default([]),
  startDate: optionalDate,
  dueDate: optionalDate,
};
export const projectCreate = envelope(z.strictObject(projectFields));
export const projectUpdate = envelope(z.strictObject({ ...Object.fromEntries(Object.entries(projectFields).map(([key, value]) => [key, value.optional()])), designerIds: projectFields.designerIds.optional() }).refine((value) => Object.keys(value).length > 0, "At least one field is required"), idParams);
export const projectList = envelope(z.any(), z.any(), z.strictObject({ ...paging, search: z.string().trim().max(100).optional(), category: category.optional(), status: z.enum(PROJECT_STATUSES).optional(), visibility: z.enum(["private", "public"]).optional(), sort: z.enum(["title", "-title", "createdAt", "-createdAt", "dueDate", "-dueDate"]).default("-createdAt") }));
export const projectId = envelope(z.any(), idParams);
export const projectDelete = envelope(z.any(), idParams, z.strictObject({ mode: z.enum(["archive", "delete"]).default("archive") }));
export const requestCreate = envelope(z.strictObject({ title: projectFields.title, description: projectFields.description, category, desiredDeadline: optionalDate }));
export const requestList = envelope(z.any(), z.any(), z.strictObject({ ...paging, status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(), category: category.optional(), sort: z.enum(["createdAt", "-createdAt"]).default("-createdAt") }));
export const requestDecision = envelope(z.strictObject({ decision: z.enum(["approve", "reject"]), note: z.string().trim().max(2000).optional(), designerIds: projectFields.designerIds.optional(), startDate: optionalDate, dueDate: optionalDate }).superRefine((value, ctx) => { if (value.decision === "reject" && !value.note) ctx.addIssue({ code: "custom", path: ["note"], message: "A rejection note is required" }); }), idParams);
