import { Router } from "express";
import { Asset } from "../models/Asset.js";
import { AssetRevision } from "../models/AssetRevision.js";
import { Comment } from "../models/Comment.js";
import { requireAuth, requirePasswordChanged } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { buildAssetScope } from "../services/assetAccess.js";
import { projectAccess } from "../services/projectAccess.js";
import { Project } from "../models/Project.js";
import { commentList, createComment, deleteComment } from "../validation/commentSchemas.js";

export const commentRouter = Router();
commentRouter.use(requireAuth, requirePasswordChanged);

const notFound = () => new AppError(404, "NOT_FOUND", "Resource not found");

/**
 * GET /api/assets/:id/comments
 * Get comments for an asset
 */
commentRouter.get("/:id/comments",
  validate(commentList),
  asyncHandler(async (req, res) => {
    const { id: assetId } = req.validated.params;
    const { page, limit, version, sort } = req.validated.query;

    // Check asset access
    const scope = await buildAssetScope(req.user);
    const asset = await Asset.findOne({ _id: assetId, ...scope });
    if (!asset) throw notFound();

    const project = await Project.findById(asset.projectId);
    if (!project) throw notFound();

    const access = projectAccess(req.user, project);
    if (access === "public" || access === "none") {
      throw notFound();
    }

    // Build filter
    const filter = { assetId };
    if (version) {
      filter.version = version;
    }

    const [rows, total] = await Promise.all([
      Comment.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userId", "name")
        .lean(),
      Comment.countDocuments(filter),
    ]);

    res.json({
      data: rows.map((comment) => ({
        id: String(comment._id),
        content: comment.content,
        version: comment.version,
        user: comment.userId?.name
          ? { id: String(comment.userId._id), name: comment.userId.name }
          : { id: String(comment.userId) },
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      })),
      pagination: { page, limit, total },
    });
  })
);

/**
 * POST /api/assets/:id/comments
 * Create a comment on an asset
 */
commentRouter.post("/:id/comments",
  requireCsrf,
  validate(createComment),
  asyncHandler(async (req, res) => {
    const { id: assetId } = req.validated.params;
    const { content, version } = req.validated.body;

    // Check asset access
    const scope = await buildAssetScope(req.user);
    const asset = await Asset.findOne({ _id: assetId, ...scope });
    if (!asset) throw notFound();

    const project = await Project.findById(asset.projectId);
    if (!project) throw notFound();

    const access = projectAccess(req.user, project);
    if (access === "public" || access === "none") {
      throw notFound();
    }

    // Verify version exists
    if (version !== asset.currentVersion) {
      const revision = await AssetRevision.findOne({ assetId, version });
      if (!revision) {
        throw new AppError(422, "VALIDATION_ERROR", "Invalid version number");
      }
    }

    // Create comment
    const comment = await Comment.create({
      assetId,
      version,
      userId: req.user._id,
      content,
    });

    res.status(201).json({
      data: {
        comment: {
          id: comment.id,
          content: comment.content,
          version: comment.version,
          user: { id: req.user.id, name: req.user.name },
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        },
      },
    });
  })
);

/**
 * DELETE /api/comments/:id
 * Delete a comment (own comment or admin)
 */
commentRouter.delete("/:id",
  requireCsrf,
  validate(deleteComment),
  asyncHandler(async (req, res) => {
    const { id: commentId } = req.validated.params;

    const comment = await Comment.findById(commentId);
    if (!comment) throw notFound();

    // Check authorization
    const isOwner = String(comment.userId) === req.user.id;
    const isAdmin = ["project_manager", "super_admin"].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      throw notFound();
    }

    // Verify asset access before deletion
    const scope = await buildAssetScope(req.user);
    const asset = await Asset.findOne({ _id: comment.assetId, ...scope });
    if (!asset) throw notFound();

    await comment.deleteOne();
    res.status(204).end();
  })
);
