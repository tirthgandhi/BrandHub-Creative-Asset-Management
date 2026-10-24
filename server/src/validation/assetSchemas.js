import { z } from "zod";
import { ASSET_STATUSES } from "../models/Asset.js";
import { category, envelope, idParams, objectId, paging } from "./projectSchemas.js";

const title = z.string().trim().min(2).max(120);
const description = z.string().trim().max(4000);
const tags = z.array(z.string().trim().toLowerCase().min(1).max(32)).max(15).transform((items) => [...new Set(items)]);

// Export objectIdString for use in review/comment/bookmark schemas
export const objectIdString = objectId;
export const pagination = paging;
export { ASSET_STATUSES };

export const uploadFields = z.strictObject({ projectId: objectId, title, description: description.optional(), category, uploadKey: z.uuid().optional() });
export const assetList = envelope(z.any(), z.any(), z.strictObject({ ...paging, search: z.string().trim().max(100).optional(), projectId: objectId.optional(), category: category.optional(), status: z.string().transform((value, ctx) => { const entries = value.split(","); if (!entries.length || entries.some((entry) => !ASSET_STATUSES.includes(entry))) { ctx.addIssue({ code: "custom", message: "Invalid status" }); return z.NEVER; } return [...new Set(entries)]; }).optional(), uploadedBy: z.literal("me").optional(), sort: z.enum(["createdAt", "-createdAt", "title", "-title"]).default("-createdAt") }));
export const assetId = envelope(z.any(), idParams);
export const assetFile = envelope(z.any(), idParams, z.strictObject({ version: z.coerce.number().int().positive().optional() }));
export const assetUpdate = envelope(z.strictObject({ title: title.optional(), description: description.optional(), category: category.optional(), tags: tags.optional(), expectedVersion: z.number().int().positive().optional() }).refine((value) => Object.keys(value).some((key) => key !== "expectedVersion"), "At least one metadata field is required"), idParams);
