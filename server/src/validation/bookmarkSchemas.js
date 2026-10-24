import { z } from "zod";
import { objectIdString, pagination } from "./assetSchemas.js";

// Get user's bookmarks
export const bookmarkList = {
  query: z.object({
    ...pagination,
    sort: z.enum(["createdAt", "-createdAt"]).default("-createdAt"),
  }),
};

// Add bookmark
export const createBookmark = {
  params: z.object({
    id: objectIdString,
  }),
};

// Remove bookmark
export const deleteBookmark = {
  params: z.object({
    id: objectIdString,
  }),
};
