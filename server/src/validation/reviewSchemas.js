import { z } from "zod";
import { objectIdString, pagination } from "./assetSchemas.js";
import { envelope } from "./projectSchemas.js";

const assetParams = z.object({ id: objectIdString });
const listQuery = (sort) => z.object({ ...pagination, sort });

export const submitAsset = envelope(z.object({ expectedVersion: z.number().int().positive() }), assetParams);
export const reviewAsset = envelope(z.object({
  decision: z.enum(["approve", "request_changes"]),
  expectedVersion: z.number().int().positive(),
  note: z.string().trim().max(2000).optional(),
}), assetParams);
export const uploadRevision = envelope(z.any(), assetParams);
export const uploadRevisionFields = z.object({
  expectedVersion: z.coerce.number().int().positive(),
  note: z.string().trim().max(2000).optional().default(""),
});
export const revisionList = envelope(z.any(), assetParams, listQuery(z.enum(["version", "-version", "createdAt", "-createdAt"]).default("-version")));
export const reviewHistory = envelope(z.any(), assetParams, listQuery(z.enum(["createdAt", "-createdAt"]).default("-createdAt")));
export const revisionFile = envelope(z.any(), z.object({ id: objectIdString, version: z.coerce.number().int().positive() }));
