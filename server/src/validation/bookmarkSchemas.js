import { z } from "zod";
import { objectIdString, pagination } from "./assetSchemas.js";
import { envelope } from "./projectSchemas.js";

const assetParams = z.object({ id: objectIdString });
export const bookmarkList = envelope(z.any(), z.any(), z.object({
  ...pagination,
  sort: z.enum(["createdAt", "-createdAt"]).default("-createdAt"),
}));
export const createBookmark = envelope(z.any(), assetParams);
export const deleteBookmark = envelope(z.any(), assetParams);
