import { z } from "zod";
import { objectIdString, pagination } from "./assetSchemas.js";
import { envelope } from "./projectSchemas.js";

const assetParams = z.object({ id: objectIdString });
export const commentList = envelope(z.any(), assetParams, z.object({
  ...pagination,
  version: z.coerce.number().int().positive().optional(),
  sort: z.enum(["createdAt", "-createdAt"]).default("-createdAt"),
}));
export const createComment = envelope(z.object({
  content: z.string().trim().min(1).max(1000),
  version: z.number().int().positive(),
}), assetParams);
export const deleteComment = envelope(z.any(), assetParams);
