import { z } from "zod";
import { objectIdString, pagination, ASSET_STATUSES } from "./assetSchemas.js";

// Submit asset for review
export const submitAsset = {
  params: z.object({
    id: objectIdString,
  }),
  body: z.object({
    expectedVersion: z.number().int().positive(),
  }),
};

// Review asset (approve or request changes)
export const reviewAsset = {
  params: z.object({
    id: objectIdString,
  }),
  body: z.object({
    decision: z.enum(["approve", "request_changes"]),
    expectedVersion: z.number().int().positive(),
    note: z.string().trim().max(2000).optional(),
  }),
};

// Upload new revision
export const uploadRevision = {
  params: z.object({
    id: objectIdString,
  }),
  // Body validated separately after multer processes fields
};

export const uploadRevisionFields = z.object({
  expectedVersion: z.coerce.number().int().positive(),
  note: z.string().trim().max(2000).optional().default(""),
});

// Get revision list
export const revisionList = {
  params: z.object({
    id: objectIdString,
  }),
  query: z.object({
    ...pagination,
    sort: z.enum(["version", "-version", "createdAt", "-createdAt"]).default("-version"),
  }),
};

// Get review history
export const reviewHistory = {
  params: z.object({
    id: objectIdString,
  }),
  query: z.object({
    ...pagination,
    sort: z.enum(["createdAt", "-createdAt"]).default("-createdAt"),
  }),
};

// Get signed file URL for specific version
export const revisionFile = {
  params: z.object({
    id: objectIdString,
    version: z.coerce.number().int().positive(),
  }),
};
