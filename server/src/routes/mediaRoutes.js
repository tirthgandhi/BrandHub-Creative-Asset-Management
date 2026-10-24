import crypto from "node:crypto";
import path from "node:path";
import { once } from "node:events";
import { finished } from "node:stream/promises";
import Busboy from "busboy";
import { Router } from "express";
import mongoose from "mongoose";
import { MediaAsset } from "../models/MediaAsset.js";
import { Project } from "../models/Project.js";
import { requireAuth, requirePasswordChanged, requireRole } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mediaBucket, mediaStorageUsage, releaseMediaBytes, reserveMediaBytes } from "../services/gridfsMedia.js";

export const mediaRouter = Router();
mediaRouter.use(requireAuth, requirePasswordChanged);

const imageLimit = () => Number(process.env.MEDIA_IMAGE_MAX_BYTES || 5 * 1024 * 1024);
const videoLimit = () => Number(process.env.MEDIA_VIDEO_MAX_BYTES || 20 * 1024 * 1024);
const formats = {
  ".jpg": { mime: "image/jpeg", mediaType: "image", signature: (b) => b[0] === 255 && b[1] === 216 && b[2] === 255 },
  ".jpeg": { mime: "image/jpeg", mediaType: "image", signature: (b) => b[0] === 255 && b[1] === 216 && b[2] === 255 },
  ".png": { mime: "image/png", mediaType: "image", signature: (b) => b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  ".webp": { mime: "image/webp", mediaType: "image", signature: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
  ".mp4": { mime: "video/mp4", mediaType: "video", signature: (b) => b.toString("ascii", 4, 8) === "ftyp" },
  ".webm": { mime: "video/webm", mediaType: "video", signature: (b) => b.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163])) },
};

const id = (value) => String(value?._id || value);
function member(user, project) {
  return user.role === "admin" || user.role === "client" && id(project.clientId) === user.id || user.role === "designer" && project.designerIds.some((designerId) => id(designerId) === user.id);
}
async function accessibleProject(user, projectId) {
  if (!mongoose.isValidObjectId(projectId)) throw new AppError(422, "VALIDATION_ERROR", "Invalid project ID");
  const project = await Project.findById(projectId);
  if (!project || project.status === "archived" || !member(user, project)) throw new AppError(404, "NOT_FOUND", "Project not found");
  return project;
}
async function accessibleMedia(user, mediaId) {
  if (!mongoose.isValidObjectId(mediaId)) throw new AppError(404, "NOT_FOUND", "Media not found");
  const asset = await MediaAsset.findById(mediaId);
  if (!asset) throw new AppError(404, "NOT_FOUND", "Media not found");
  await accessibleProject(user, asset.projectId);
  return asset;
}
function serialize(asset) {
  return { id: asset.id, title: asset.title, description: asset.description, category: asset.category,
    contentType: asset.contentType, mediaType: asset.mediaType, storageType: asset.storageType,
    url: asset.storageType === "local" ? asset.localPath : `/api/media/${asset.id}/stream`,
    thumbnailUrl: asset.thumbnailUrl || null, mimeType: asset.mimeType, fileSize: asset.fileSize,
    width: asset.width || null, height: asset.height || null, duration: asset.duration || null,
    projectId: id(asset.projectId), ownerClientId: id(asset.ownerClientId),
    uploadedBy: asset.uploadedBy ? id(asset.uploadedBy) : null, status: asset.status, createdAt: asset.createdAt };
}

function readMultipart(req, bucket, maxBytes) {
  return new Promise((resolve, reject) => {
    let parser;
    try { parser = Busboy({ headers: req.headers, limits: { files: 1, fields: 5, fileSize: maxBytes + 1, parts: 6 } }); }
    catch { reject(new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "Use a multipart file upload")); return; }
    const fields = {};
    let task = null;
    let parserError = null;
    parser.on("field", (name, value) => { fields[name] = value.slice(0, 2000); });
    parser.on("filesLimit", () => { parserError = new AppError(422, "VALIDATION_ERROR", "Upload exactly one file"); });
    parser.on("fieldsLimit", () => { parserError = new AppError(422, "VALIDATION_ERROR", "Too many media fields"); });
    parser.on("partsLimit", () => { parserError = new AppError(422, "VALIDATION_ERROR", "Too many multipart parts"); });
    parser.on("file", (_name, file, info) => {
      task = (async () => {
        const originalFilename = path.basename(info.filename || "").slice(0, 255);
        const extension = path.extname(originalFilename).toLowerCase();
        const format = formats[extension];
        let upload;
        const hash = crypto.createHash("sha256");
        let bytes = 0;
        let first = true;
        let header = Buffer.alloc(0);
        let validationError = !format || format.mime !== info.mimeType ? new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "File type and filename do not match a supported image or video") : null;
        try {
          for await (const chunk of file) {
            if (validationError) continue;
            let payload = chunk;
            if (first) {
              header = Buffer.concat([header, chunk]);
              if (header.length < 12) continue;
              payload = header;
              header = Buffer.alloc(0);
              first = false;
              if (!format.signature(payload)) { validationError = new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "File contents do not match the selected type"); continue; }
            }
            bytes += payload.length;
            if (bytes > maxBytes || bytes > (format.mediaType === "image" ? imageLimit() : videoLimit())) { validationError = new AppError(413, "PAYLOAD_TOO_LARGE", "File exceeds the configured size limit"); continue; }
            if (!upload) {
              upload = bucket.openUploadStream(`${crypto.randomUUID()}${extension}`, { metadata: { mimeType: format.mime } });
              upload.on("error", () => { /* Abort can emit after the rejected upload task has settled. */ });
            }
            hash.update(payload);
            if (!upload.write(payload)) await once(upload, "drain");
          }
          if (first && !validationError) validationError = new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "File is too small to match a supported image or video");
          if (validationError) throw validationError;
          if (file.truncated) throw new AppError(413, "PAYLOAD_TOO_LARGE", "File exceeds the configured size limit");
          if (!bytes) throw new AppError(422, "VALIDATION_ERROR", "Choose a nonempty file");
          upload.end();
          await finished(upload);
          return { gridFsFileId: upload.id, storedFilename: upload.filename, originalFilename, mimeType: format.mime, mediaType: format.mediaType, fileSize: bytes, checksum: hash.digest("hex") };
        } catch (error) { if (upload) try { await upload.abort(); } catch { /* Already closed. */ } throw error; }
      })();
      task.catch(() => file.resume());
    });
    parser.on("error", reject);
    parser.on("finish", async () => {
      if (!task) return reject(new AppError(422, "VALIDATION_ERROR", "Choose a file to upload"));
      try {
        const file = await task;
        if (parserError) { await bucket.delete(file.gridFsFileId); throw parserError; }
        resolve({ fields, file });
      } catch (error) { reject(error); }
    });
    req.pipe(parser);
  });
}

mediaRouter.post("/upload", requireCsrf, asyncHandler(async (req, res) => {
  const project = await accessibleProject(req.user, req.query.projectId);
  const declared = Number(req.get("X-Upload-Size"));
  if (!Number.isSafeInteger(declared) || declared < 1 || declared > videoLimit()) throw new AppError(413, "PAYLOAD_TOO_LARGE", "Upload size is missing or exceeds the video limit");
  const releaseReservation = await reserveMediaBytes(declared);
  let file;
  let committed = false;
  try {
    const parsed = await readMultipart(req, mediaBucket(), declared);
    file = parsed.file;
    if (file.fileSize !== declared) throw new AppError(422, "VALIDATION_ERROR", "Upload size did not match the file received");
    const title = String(parsed.fields.title || path.parse(file.originalFilename).name).trim();
    const category = String(parsed.fields.category || "uncategorized").trim().toLowerCase();
    const contentType = String(parsed.fields.contentType || "gallery");
    if (title.length < 2 || title.length > 120 || !/^[a-z][a-z0-9-]{1,59}$/.test(category) || !["gallery", "post", "story", "reel"].includes(contentType) || contentType === "reel" && file.mediaType !== "video") throw new AppError(422, "VALIDATION_ERROR", "Invalid media details");
    const asset = await MediaAsset.create({ ...file, title, category, contentType, storageType: "gridfs", uploadedBy: req.user._id, ownerClientId: project.clientId, assignedDesignerId: req.user.role === "designer" ? req.user._id : project.designerIds[0] || null, projectId: project._id, visibility: "private", status: "draft" });
    await releaseReservation(file.fileSize);
    committed = true;
    res.status(201).json({ data: { media: serialize(asset) } });
  } catch (error) {
    if (file?.gridFsFileId) try { await mediaBucket().delete(file.gridFsFileId); } catch { /* Preserve the original error. */ }
    throw error;
  } finally { if (!committed) await releaseReservation(); }
}));

mediaRouter.get("/usage", requireRole("admin"), asyncHandler(async (_req, res) => res.json({ data: await mediaStorageUsage() })));
mediaRouter.get("/", asyncHandler(async (req, res) => {
  const page = Math.max(1, Math.min(100000, Number(req.query.page) || 1));
  const limit = Math.max(1, Math.min(30, Number(req.query.limit) || 12));
  const projectFilter = req.user.role === "admin" ? {} : req.user.role === "client" ? { clientId: req.user._id } : { designerIds: req.user._id };
  const projectIds = await Project.distinct("_id", { ...projectFilter, status: { $ne: "archived" } });
  const filter = { projectId: { $in: projectIds } };
  if (req.query.projectId) { await accessibleProject(req.user, req.query.projectId); filter.projectId = req.query.projectId; }
  if (req.query.category) filter.category = String(req.query.category).slice(0, 60);
  if (req.query.contentType) filter.contentType = String(req.query.contentType).slice(0, 20);
  const [assets, total] = await Promise.all([MediaAsset.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), MediaAsset.countDocuments(filter)]);
  res.json({ data: assets.map(serialize), pagination: { page, limit, total } });
}));
mediaRouter.get("/:id", asyncHandler(async (req, res) => res.json({ data: { media: serialize(await accessibleMedia(req.user, req.params.id)) } })));
mediaRouter.get("/:id/stream", asyncHandler(async (req, res) => {
  const asset = await accessibleMedia(req.user, req.params.id);
  if (asset.storageType !== "gridfs") return res.redirect(asset.localPath);
  const size = asset.fileSize;
  const range = req.get("Range");
  let start = 0;
  let end = size - 1;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || !match[1] && !match[2]) { res.set("Content-Range", `bytes */${size}`); throw new AppError(416, "INVALID_RANGE", "Invalid media range"); }
    if (!match[1]) { const suffix = Number(match[2]); start = Math.max(0, size - suffix); }
    else { start = Number(match[1]); end = match[2] ? Number(match[2]) : end; }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start) { res.set("Content-Range", `bytes */${size}`); throw new AppError(416, "INVALID_RANGE", "Invalid media range"); }
    end = Math.min(end, size - 1);
  }
  res.status(range ? 206 : 200);
  res.set({ "Content-Type": asset.mimeType, "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes", "Cache-Control": "private, no-store" });
  if (range) res.set("Content-Range", `bytes ${start}-${end}/${size}`);
  const stream = mediaBucket().openDownloadStream(asset.gridFsFileId, { start, end: end + 1 });
  stream.on("error", () => { if (!res.headersSent) res.status(503).end(); else res.destroy(); });
  stream.pipe(res);
}));
mediaRouter.patch("/:id", requireCsrf, asyncHandler(async (req, res) => {
  const asset = await accessibleMedia(req.user, req.params.id);
  if (asset.storageType !== "gridfs" || req.user.role !== "admin" && id(asset.uploadedBy) !== req.user.id) throw new AppError(403, "FORBIDDEN", "You cannot edit this media");
  const title = String(req.body.title || "").trim();
  const description = String(req.body.description || "").trim();
  if (title.length < 2 || title.length > 120 || description.length > 2000) throw new AppError(422, "VALIDATION_ERROR", "Invalid media details");
  asset.title = title; asset.description = description;
  await asset.save();
  res.json({ data: { media: serialize(asset) } });
}));
mediaRouter.delete("/:id", requireCsrf, asyncHandler(async (req, res) => {
  const asset = await accessibleMedia(req.user, req.params.id);
  if (asset.storageType !== "gridfs" || asset.status === "approved" || req.user.role !== "admin" && id(asset.uploadedBy) !== req.user.id) throw new AppError(403, "FORBIDDEN", "You cannot delete this media");
  await mediaBucket().delete(asset.gridFsFileId);
  await asset.deleteOne();
  await releaseMediaBytes(asset.fileSize);
  res.status(204).end();
}));
