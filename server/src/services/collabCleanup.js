import { ReviewEvent } from "../models/ReviewEvent.js";
import { Comment } from "../models/Comment.js";
import { Bookmark } from "../models/Bookmark.js";
import { AssetRevision } from "../models/AssetRevision.js";
import { queueStorageCleanup } from "./cloudinaryStorage.js";

/**
 * Cascade delete all collaboration data when an asset is deleted
 * @param {ObjectId} assetId - Asset ID to clean up
 * @param {Session} session - MongoDB session for transactions (optional)
 */
export async function cascadeDeleteAssetData(assetId, session) {
  const options = session ? { session } : {};

  // Find all revisions to clean up their storage files
  const revisions = await AssetRevision.find({ assetId }).select("+file").lean();
  
  // Queue storage cleanup for all revision files
  for (const revision of revisions) {
    if (revision.file?.publicId) {
      await queueStorageCleanup(revision.file.publicId);
    }
  }

  // Delete all related records
  await Promise.all([
    AssetRevision.deleteMany({ assetId }, options),
    ReviewEvent.deleteMany({ assetId }, options),
    Comment.deleteMany({ assetId }, options),
    Bookmark.deleteMany({ assetId }, options),
  ]);
}
