import { Router } from "express";
import { Asset } from "../models/Asset.js";
import { Bookmark } from "../models/Bookmark.js";
import { Project } from "../models/Project.js";
import { requireAuth, requirePasswordChanged } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { buildAssetScope } from "../services/assetAccess.js";
import { projectAccess } from "../services/projectAccess.js";
import { getSignedThumbnailUrl } from "../services/cloudinaryStorage.js";
import { bookmarkList, createBookmark, deleteBookmark } from "../validation/bookmarkSchemas.js";

export const bookmarkRouter = Router();
bookmarkRouter.use(requireAuth, requirePasswordChanged);

const notFound = () => new AppError(404, "NOT_FOUND", "Resource not found");

/**
 * GET /api/bookmarks
 * Get current user's bookmarks
 */
bookmarkRouter.get("/",
  validate(bookmarkList),
  asyncHandler(async (req, res) => {
    const { page, limit, sort } = req.validated.query;

    const filter = { userId: req.user._id };

    const [rows, total] = await Promise.all([
      Bookmark.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
          path: "assetId",
          select: "title category status currentVersion projectId currentFile",
          populate: {
            path: "projectId",
            select: "title visibility status clientId designerIds",
          },
        })
        .lean(),
      Bookmark.countDocuments(filter),
    ]);

    // Filter out bookmarks for inaccessible assets
    const accessible = [];
    for (const bookmark of rows) {
      if (!bookmark.assetId || !bookmark.assetId.projectId) continue;

      const asset = bookmark.assetId;
      const project = asset.projectId;

      // Check if user still has access
      const access = projectAccess(req.user, project);
      if (access === "none") continue;

      // Check asset status visibility
      const scope = await buildAssetScope(req.user, { projectId: project._id });
      const hasAssetAccess = await Asset.findOne({ _id: asset._id, ...scope });
      if (!hasAssetAccess) continue;

      accessible.push({
        id: String(bookmark._id),
        asset: {
          id: String(asset._id),
          title: asset.title,
          category: asset.category,
          status: asset.status,
          currentVersion: asset.currentVersion,
          thumbnailUrl: getSignedThumbnailUrl(asset.currentFile).url,
          project: {
            id: String(project._id),
            title: project.title,
          },
        },
        createdAt: bookmark.createdAt,
      });
    }

    res.json({
      data: accessible,
      pagination: { page, limit, total: accessible.length },
    });
  })
);

/**
 * POST /api/assets/:id/bookmark
 * Add a bookmark
 */
bookmarkRouter.post("/:id/bookmark",
  requireCsrf,
  validate(createBookmark),
  asyncHandler(async (req, res) => {
    const { id: assetId } = req.validated.params;

    // Check asset access
    const scope = await buildAssetScope(req.user);
    const asset = await Asset.findOne({ _id: assetId, ...scope });
    if (!asset) throw notFound();

    // Create bookmark (unique index prevents duplicates)
    try {
      const bookmark = await Bookmark.create({
        userId: req.user._id,
        assetId,
      });

      res.status(201).json({
        data: {
          bookmark: {
            id: bookmark.id,
            assetId: String(bookmark.assetId),
            createdAt: bookmark.createdAt,
          },
        },
      });
    } catch (error) {
      // Duplicate bookmark - return existing
      if (error.code === 11000) {
        const existing = await Bookmark.findOne({ userId: req.user._id, assetId });
        return res.status(201).json({
          data: {
            bookmark: {
              id: existing.id,
              assetId: String(existing.assetId),
              createdAt: existing.createdAt,
            },
          },
        });
      }
      throw error;
    }
  })
);

/**
 * DELETE /api/assets/:id/bookmark
 * Remove a bookmark
 */
bookmarkRouter.delete("/:id/bookmark",
  requireCsrf,
  validate(deleteBookmark),
  asyncHandler(async (req, res) => {
    const { id: assetId } = req.validated.params;

    await Bookmark.deleteOne({
      userId: req.user._id,
      assetId,
    });

    res.status(204).end();
  })
);
