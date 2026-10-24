import { z } from "zod";
import { objectIdString, pagination } from "./assetSchemas.js";

// Get comments for an asset
export const commentList = {
  params: z.object({
    id: objectIdString,
  }),
  query: z.object({
    ...pagination,
    version: z.coerce.number().int().positive().optional(),
    sort: z.enum(["createdAt", "-createdAt"]).default("-createdAt"),
  }),
};

// Create comment
export const createComment = {
  params: z.object({
    id: objectIdString,
  }),
  body: z.object({
    content: z.string().trim().min(1).max(1000),
    version: z.number().int().positive(),
  }),
};

// Delete comment
export const deleteComment = {
  params: z.object({
    id: objectIdString,
  }),
};
