import { Bookmark } from "../models/Bookmark.js";

/**
 * Get a set of bookmarked asset IDs for a user
 * @param {object} user - User object with _id
 * @param {Array} assetIds - Array of asset _id objects or strings
 * @returns {Promise<Set>} Set of asset ID strings that are bookmarked
 */
export async function bookmarkedAssetIds(user, assetIds) {
  if (!assetIds || assetIds.length === 0) return new Set();
  
  const ids = assetIds.map((id) => String(id._id || id));
  const bookmarks = await Bookmark.find({
    userId: user._id,
    assetId: { $in: ids },
  }).select("assetId").lean();

  return new Set(bookmarks.map((b) => String(b.assetId)));
}
