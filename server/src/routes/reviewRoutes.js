import { Router } from "express";
import { Asset } from "../models/Asset.js";
import { AssetRevision } from "../models/AssetRevision.js";
import { ReviewEvent } from "../models/ReviewEvent.js";
import { Project } from "../models/Project.js";
import { requireAuth, requirePasswordChanged, requireRole } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { receiveImage, validateImage } from "../middleware/uploadValidation.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { nextStatus, ACTIONS, STATUSES } from "../utils/reviewStateMachine.js";
import { buildAssetScope } from "../services/assetAccess.js";
import { projectAccess } from "../services/projectAccess.js";
import { withReviewTransaction } from "../services/reviewTransaction.js";
import { uploadFile, deleteFile, queueStorageCleanup } from "../services/cloudinaryStorage.js";
import { 
  submitAsset, 
  reviewAsset, 
  uploadRevision, 
  uploadRevisionFields, 
  revisionList, 
  reviewHistory,
} from "../validation/reviewSchemas.js";

export const reviewRouter = Router();
reviewRouter.use(requireAuth, requirePasswordChanged);

const notFound = () => new AppError(404, "NOT_FOUND", "Asset not found");

/**
 * Helper: Find accessible asset and project with permission context
 */
async function getAssetWithPermissions(req, assetId) {
  const scope = await buildAssetScope(req.user);
  const asset = await Asset.findOne({ _id: assetId, ...scope })
    .select("+currentFile")
    .populate("uploadedBy", "name");
  
  if (!asset) throw notFound();
  
  const project = await Project.findById(asset.projectId)
    .populate("clientId", "_id")
    .populate("designerIds", "_id");
  
  if (!project) throw notFound();
  
  const access = projectAccess(req.user, project);
  const isAssignedDesigner = access === "designer";
  const isAssignedClient = access === "client";
  const uploaderId = String(asset.uploadedBy?._id || asset.uploadedBy);
  const isUploader = uploaderId === req.user.id;
  
  return { asset, project, access, isAssignedDesigner, isAssignedClient, isUploader };
}

/**
 * POST /api/assets/:id/submit
 * Submit asset for review
 */
reviewRouter.post("/:id/submit", 
  requireRole("project_manager", "designer"),
  requireCsrf, 
  validate(submitAsset), 
  asyncHandler(async (req, res) => {
    const { asset, isAssignedDesigner, isUploader } = await getAssetWithPermissions(req, req.validated.params.id);
    const { expectedVersion } = req.validated.body;

    // Verify expected version matches
    if (asset.currentVersion !== expectedVersion) {
      throw new AppError(409, "CONFLICT", "Asset version changed; refresh and try again");
    }
    if (asset.status !== STATUSES.DRAFT) throw new AppError(409, "CONFLICT", "Asset state changed; refresh and try again");

    // Check state machine
    const transition = nextStatus(
      asset.status, 
      ACTIONS.SUBMIT, 
      req.user.role,
      { isAssignedDesigner, isUploader }
    );

    if (transition.error) {
      throw new AppError(403, "FORBIDDEN", transition.error);
    }

    const updated = await withReviewTransaction(async (session) => {
      const next = await Asset.findOneAndUpdate(
        { _id: asset._id, status: STATUSES.DRAFT, currentVersion: expectedVersion },
        { $set: { status: STATUSES.IN_REVIEW } },
        { returnDocument: "after", ...(session ? { session } : {}) }
      );
      if (!next) throw new AppError(409, "CONFLICT", "Asset state or version changed; refresh and try again");
      try {
        await ReviewEvent.create([{ assetId: asset._id, version: expectedVersion, actorId: req.user._id,
          action: "submit", fromStatus: STATUSES.DRAFT, toStatus: STATUSES.IN_REVIEW, note: "" }], session ? { session } : {});
      } catch (error) {
        if (!session) await Asset.updateOne({ _id: asset._id, status: STATUSES.IN_REVIEW, currentVersion: expectedVersion }, { $set: { status: STATUSES.DRAFT } });
        throw error;
      }
      return next;
    });

    res.json({
      data: {
        asset: {
          id: updated.id,
          status: updated.status,
          currentVersion: updated.currentVersion,
        },
      },
    });
  })
);

/**
 * PATCH /api/assets/:id/review
 * Approve or request changes
 */
reviewRouter.patch("/:id/review", 
  requireCsrf, 
  validate(reviewAsset), 
  asyncHandler(async (req, res) => {
    const { asset, isAssignedClient } = await getAssetWithPermissions(req, req.validated.params.id);
    const { decision, expectedVersion, note } = req.validated.body;

    // Verify expected version matches
    if (asset.currentVersion !== expectedVersion) {
      throw new AppError(409, "CONFLICT", "Asset version changed; refresh and try again");
    }
    if (asset.status !== STATUSES.IN_REVIEW) throw new AppError(409, "CONFLICT", "Asset state changed; refresh and try again");

    // Determine action
    const action = decision === "approve" ? ACTIONS.APPROVE : ACTIONS.REQUEST_CHANGES;

    // Check state machine
    const transition = nextStatus(
      asset.status,
      action,
      req.user.role,
      { isAssignedClient, note }
    );

    if (transition.error) {
      throw new AppError(403, "FORBIDDEN", transition.error);
    }

    // Atomic conditional update
    const updateData = {
      status: transition.status,
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    };

    if (decision === "request_changes") {
      updateData.reviewNote = note || "";
    }

    const { updated, reviewEvent } = await withReviewTransaction(async (session) => {
      const next = await Asset.findOneAndUpdate(
        { _id: asset._id, status: STATUSES.IN_REVIEW, currentVersion: expectedVersion },
        { $set: updateData },
        { returnDocument: "after", ...(session ? { session } : {}) }
      );
      if (!next) throw new AppError(409, "CONFLICT", "Asset state or version changed; refresh and try again");
      try {
        const [event] = await ReviewEvent.create([{ assetId: asset._id, version: expectedVersion,
          actorId: req.user._id, action: decision === "approve" ? "approve" : "request_changes",
          fromStatus: STATUSES.IN_REVIEW, toStatus: transition.status, note: note || "" }], session ? { session } : {});
        return { updated: next, reviewEvent: event };
      } catch (error) {
        if (!session) await Asset.updateOne({ _id: asset._id, status: transition.status, currentVersion: expectedVersion },
          { $set: { status: STATUSES.IN_REVIEW, reviewedBy: asset.reviewedBy || null, reviewedAt: asset.reviewedAt || null, reviewNote: asset.reviewNote || "" } });
        throw error;
      }
    });

    res.json({
      data: {
        asset: {
          id: updated.id,
          status: updated.status,
          currentVersion: updated.currentVersion,
          reviewedBy: String(updated.reviewedBy),
          reviewedAt: updated.reviewedAt,
        },
        reviewEvent: {
          id: reviewEvent.id,
          action: reviewEvent.action,
          version: reviewEvent.version,
        },
      },
    });
  })
);

/**
 * POST /api/assets/:id/revisions
 * Upload new revision after changes requested
 */
reviewRouter.post("/:id/revisions",
  requireRole("project_manager", "designer"),
  requireCsrf,
  receiveImage,
  validate(uploadRevision),
  asyncHandler(async (req, res) => {
    const { asset, project, isAssignedDesigner } = await getAssetWithPermissions(req, req.validated.params.id);

    // Validate fields
    const parsed = uploadRevisionFields.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(422, "VALIDATION_ERROR", "Invalid revision data", 
        parsed.error.issues.map((issue) => ({ 
          field: issue.path.join("."), 
          message: issue.message 
        }))
      );
    }

    const { expectedVersion, note } = parsed.data;

    // Verify expected version
    if (asset.currentVersion !== expectedVersion) {
      throw new AppError(409, "CONFLICT", "Asset version changed; refresh and try again");
    }
    if (asset.status !== STATUSES.CHANGES_REQUESTED) throw new AppError(409, "CONFLICT", "Asset state changed; refresh and try again");

    // Check state machine
    const transition = nextStatus(
      asset.status,
      ACTIONS.REVISION_UPLOADED,
      req.user.role,
      { isAssignedDesigner }
    );

    if (transition.error) {
      throw new AppError(403, "FORBIDDEN", transition.error);
    }

    // Validate image
    const image = await validateImage(req.file);
    const newVersion = asset.currentVersion + 1;

    let stored;
    try {
      // Upload new file
      stored = await uploadFile(req.file.buffer, {
        projectId: String(project._id),
        assetId: `${asset.id}_v${newVersion}`,
        format: image.format,
      });

      const file = {
        publicId: stored.public_id,
        storageVersion: stored.version,
        bytes: stored.bytes,
        format: image.format,
        width: stored.width,
        height: stored.height,
        deliveryType: "authenticated",
      };

      const { updated, revision } = await withReviewTransaction(async (session) => {
        const next = await Asset.findOneAndUpdate(
          { _id: asset._id, status: STATUSES.CHANGES_REQUESTED, currentVersion: expectedVersion },
          { $set: { status: STATUSES.DRAFT, currentVersion: newVersion, currentFile: file, reviewNote: "" } },
          { returnDocument: "after", ...(session ? { session } : {}) }
        ).select("+currentFile");
        if (!next) throw new AppError(409, "CONFLICT", "Asset state or version changed; refresh and try again");
        let savedRevision;
        try {
          [savedRevision] = await AssetRevision.create([{ assetId: asset._id, version: newVersion, file,
            uploadedBy: req.user._id, note: note || "" }], session ? { session } : {});
          await ReviewEvent.create([{ assetId: asset._id, version: newVersion, actorId: req.user._id,
            action: "revision_uploaded", fromStatus: STATUSES.CHANGES_REQUESTED,
            toStatus: STATUSES.DRAFT, note: note || "" }], session ? { session } : {});
        } catch (error) {
          if (!session) {
            if (savedRevision) await savedRevision.deleteOne();
            const rollback = await Asset.updateOne({ _id: asset._id, status: STATUSES.DRAFT, currentVersion: newVersion },
              { $set: { status: STATUSES.CHANGES_REQUESTED, currentVersion: expectedVersion,
                currentFile: asset.currentFile, reviewNote: asset.reviewNote || "" } });
            if (rollback.matchedCount !== 1) console.error(`Review revision rollback needs repair for asset ${asset.id}`);
          }
          throw error;
        }
        return { updated: next, revision: savedRevision };
      });

      res.status(201).json({
        data: {
          asset: {
            id: updated.id,
            status: updated.status,
            currentVersion: updated.currentVersion,
          },
          revision: {
            version: revision.version,
            note: revision.note,
            createdAt: revision.createdAt,
          },
        },
      });
    } catch (error) {
      // Cleanup on failure
      if (stored?.public_id) {
        try {
          await deleteFile(stored.public_id);
        } catch {
          await queueStorageCleanup(stored.public_id);
        }
      }
      throw error;
    }
  })
);

/**
 * GET /api/assets/:id/revisions
 * Get revision history
 */
reviewRouter.get("/:id/revisions",
  validate(revisionList),
  asyncHandler(async (req, res) => {
    const { asset, access } = await getAssetWithPermissions(req, req.validated.params.id);
    
    // Public viewers can't see revisions
    if (access === "public") {
      throw notFound();
    }

    const { page, limit, sort } = req.validated.query;
    const filter = { assetId: asset._id };

    const [rows, total] = await Promise.all([
      AssetRevision.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("uploadedBy", "name")
        .lean(),
      AssetRevision.countDocuments(filter),
    ]);

    res.json({
      data: rows.map((rev) => ({
        version: rev.version,
        uploadedBy: rev.uploadedBy?.name 
          ? { id: String(rev.uploadedBy._id), name: rev.uploadedBy.name }
          : { id: String(rev.uploadedBy) },
        note: rev.note,
        createdAt: rev.createdAt,
      })),
      pagination: { page, limit, total },
    });
  })
);

/**
 * GET /api/assets/:id/history
 * Get review event history
 */
reviewRouter.get("/:id/history",
  validate(reviewHistory),
  asyncHandler(async (req, res) => {
    const { asset, access } = await getAssetWithPermissions(req, req.validated.params.id);
    
    // Public viewers can't see history
    if (access === "public") {
      throw notFound();
    }

    const { page, limit, sort } = req.validated.query;
    const filter = { assetId: asset._id };

    const [rows, total] = await Promise.all([
      ReviewEvent.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("actorId", "name")
        .lean(),
      ReviewEvent.countDocuments(filter),
    ]);

    res.json({
      data: rows.map((event) => ({
        id: String(event._id),
        action: event.action,
        version: event.version,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        actor: event.actorId?.name
          ? { id: String(event.actorId._id), name: event.actorId.name }
          : { id: String(event.actorId) },
        note: event.note,
        createdAt: event.createdAt,
      })),
      pagination: { page, limit, total },
    });
  })
);

// No duplicate export here - router already exported at line 12
