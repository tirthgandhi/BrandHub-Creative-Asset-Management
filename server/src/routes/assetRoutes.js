import mongoose from "mongoose";
import { Router } from "express";
import { Asset } from "../models/Asset.js";
import { AssetRevision } from "../models/AssetRevision.js";
import { StorageCleanup } from "../models/StorageCleanup.js";
import { Project } from "../models/Project.js";
import { requireAuth, requirePasswordChanged } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { receiveImage, validateImage } from "../middleware/uploadValidation.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { buildAssetScope, canManageAsset, canUploadToProject } from "../services/assetAccess.js";
import { projectAccess } from "../services/projectAccess.js";
import { uploadFile, deleteFile, getSignedFileUrl, getSignedThumbnailUrl, queueStorageCleanup, releaseStorageCleanup } from "../services/cloudinaryStorage.js";
import { bookmarkedAssetIds } from "../services/bookmarkLookup.js";
import { cascadeDeleteAssetData } from "../services/collabCleanup.js";
import { assetFile, assetId, assetList, assetUpdate, uploadFields } from "../validation/assetSchemas.js";

export const assetRouter = Router();
assetRouter.use(requireAuth, requirePasswordChanged);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const notFound = () => new AppError(404, "NOT_FOUND", "Asset not found");

function serializeAsset(asset, { publicView = false, bookmarked = false } = {}) {
  const base = { id: asset.id, projectId: String(asset.projectId), title: asset.title, category: asset.category, status: asset.status, currentVersion: asset.currentVersion, thumbnailUrl: getSignedThumbnailUrl(asset.currentFile).url, isBookmarked: bookmarked, createdAt: asset.createdAt, updatedAt: asset.updatedAt };
  if (publicView) return base;
  return { ...base, description: asset.description, tags: asset.tags, uploadedBy: asset.uploadedBy?.name ? { id: String(asset.uploadedBy._id), name: asset.uploadedBy.name } : { id: String(asset.uploadedBy) } };
}

assetRouter.get("/", validate(assetList), asyncHandler(async (req, res) => {
  const { page, limit, search, projectId, category, status, uploadedBy, sort } = req.validated.query;
  const filter = { $and: [await buildAssetScope(req.user, { projectId })] };
  if (search) filter.$and.push({ $or: [{ title: { $regex: escapeRegex(search), $options: "i" } }, { tags: { $regex: escapeRegex(search), $options: "i" } }] });
  if (projectId) filter.$and.push({ projectId });
  if (category) filter.$and.push({ category });
  if (status) filter.$and.push({ status: { $in: status } });
  if (uploadedBy) filter.$and.push({ uploadedBy: req.user._id });
  const [rows, total] = await Promise.all([Asset.find(filter).select("+currentFile").sort(sort).skip((page - 1) * limit).limit(limit).populate("uploadedBy", "name"), Asset.countDocuments(filter)]);
  const projectIds = [...new Set(rows.map((asset) => String(asset.projectId)))];
  const projects = await Project.find({ _id: { $in: projectIds } }).select("clientId designerIds visibility status");
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const bookmarked = await bookmarkedAssetIds(req.user, rows.map((asset) => asset._id));
  res.json({ data: rows.map((asset) => serializeAsset(asset, { publicView: projectAccess(req.user, projectById.get(String(asset.projectId))) === "public", bookmarked: bookmarked.has(asset.id) })), pagination: { page, limit, total } });
}));

assetRouter.post("/", requireCsrf, receiveImage, asyncHandler(async (req, res) => {
  const parsed = uploadFields.safeParse(req.body);
  if (!parsed.success) throw new AppError(422, "VALIDATION_ERROR", "Invalid asset details", parsed.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })));
  const body = parsed.data;
  const project = await Project.findById(body.projectId);
  if (!project || !canUploadToProject(req.user, project)) throw notFound();
  if (!process.env.CLOUDINARY_AUTH_TOKEN_KEY) throw new AppError(503, "SERVICE_UNAVAILABLE", "Protected asset delivery is not configured");
  if (body.uploadKey) {
    const existing = await Asset.findOne({ uploadedBy: req.user._id, uploadKey: body.uploadKey }).select("+currentFile");
    if (existing) return res.status(201).json({ data: { asset: serializeAsset(existing) } });
  }
  const image = await validateImage(req.file);
  const assetId = new mongoose.Types.ObjectId();
  let stored;
  try {
    stored = await uploadFile(req.file.buffer, { projectId: project.id, assetId: String(assetId), format: image.format });
    const file = { publicId: stored.public_id, storageVersion: stored.version, bytes: stored.bytes, format: image.format, width: stored.width, height: stored.height, deliveryType: "authenticated" };
    const assetFields = { _id: assetId, projectId: project._id, uploadedBy: req.user._id, title: body.title, description: body.description || "", category: body.category, status: "draft", currentVersion: 1, currentFile: file, uploadKey: body.uploadKey };
    const revisionFields = { assetId, version: 1, file, uploadedBy: req.user._id };
    let asset;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        [asset] = await Asset.create([assetFields], { session });
        await AssetRevision.create([revisionFields], { session });
      });
    } catch (error) {
      if (!/Transaction numbers are only allowed|replica set|mongos|does not support retryable writes/i.test(error.message)) throw error;
      asset = await Asset.create(assetFields);
      try { await AssetRevision.create(revisionFields); }
      catch (revisionError) { await Asset.deleteOne({ _id: assetId }); throw revisionError; }
    } finally { await session.endSession(); }
    res.status(201).json({ data: { asset: serializeAsset(asset) } });
  } catch (error) {
    if (stored?.public_id) try { await deleteFile(stored.public_id); } catch { await queueStorageCleanup(stored.public_id); console.error("Asset upload cleanup queued for retry"); }
    throw error;
  }
}));

async function accessibleAsset(req) {
  const scope = await buildAssetScope(req.user);
  const asset = await Asset.findOne({ _id: req.validated.params.id, ...scope }).select("+currentFile").populate("uploadedBy", "name");
  if (!asset) throw notFound();
  const project = await Project.findById(asset.projectId);
  if (!project) throw notFound();
  return { asset, project, publicView: projectAccess(req.user, project) === "public" };
}

assetRouter.get("/:id", validate(assetId), asyncHandler(async (req, res) => {
  const { asset, publicView } = await accessibleAsset(req);
  res.json({ data: { asset: serializeAsset(asset, { publicView }) } });
}));

assetRouter.get("/:id/file", validate(assetFile), asyncHandler(async (req, res) => {
  const { asset, publicView } = await accessibleAsset(req);
  const version = req.validated.query.version || asset.currentVersion;
  if (publicView && version !== asset.currentVersion) throw notFound();
  const revision = version === asset.currentVersion ? null : await AssetRevision.findOne({ assetId: asset._id, version }).select("+file");
  if (version !== asset.currentVersion && !revision) throw notFound();
  res.json({ data: getSignedFileUrl(revision?.file || asset.currentFile) });
}));

assetRouter.patch("/:id", requireCsrf, validate(assetUpdate), asyncHandler(async (req, res) => {
  const { asset, project } = await accessibleAsset(req);
  if (!canManageAsset(req.user, project, asset)) throw notFound();
  if (asset.status === "approved") throw new AppError(409, "CONFLICT", "Approved asset metadata is locked until an audited correction workflow is available");
  const { expectedVersion, ...body } = req.validated.body;
  if (expectedVersion && asset.currentVersion !== expectedVersion) throw new AppError(409, "CONFLICT", "Asset version changed; refresh and try again");
  Object.assign(asset, body);
  await asset.save();
  res.json({ data: { asset: serializeAsset(asset) } });
}));

assetRouter.delete("/:id", requireCsrf, validate(assetId), asyncHandler(async (req, res) => {
  const { asset, project } = await accessibleAsset(req);
  if (asset.status === "approved") throw new AppError(409, "CONFLICT", "Approved assets cannot be deleted");
  if (!canManageAsset(req.user, project, asset) || req.user.role === "designer" && asset.status !== "draft") throw notFound();
  await queueStorageCleanup(asset.currentFile.publicId, false);
  const removeRecords = async (session) => {
    const options = session ? { session } : {};
    const removed = await Asset.deleteOne({ _id: asset._id, status: { $ne: "approved" } }, options);
    if (removed.deletedCount !== 1) throw new AppError(409, "CONFLICT", "Asset state changed; refresh and try again");
    await AssetRevision.deleteMany({ assetId: asset._id }, options);
    await cascadeDeleteAssetData(asset._id, session);
  };
  const session = await mongoose.startSession();
  try { await session.withTransaction(() => removeRecords(session)); }
  catch (error) {
    if (!/Transaction numbers are only allowed|replica set|mongos|does not support retryable writes/i.test(error.message)) throw error;
    await removeRecords(null);
  } finally { await session.endSession(); }
  await releaseStorageCleanup(asset.currentFile.publicId);
  try { await deleteFile(asset.currentFile.publicId); await StorageCleanup.deleteOne({ publicId: asset.currentFile.publicId }); }
  catch { console.error("Asset storage cleanup queued for retry"); }
  res.status(204).end();
}));
