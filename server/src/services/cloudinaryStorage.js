import mongoose from "mongoose";
import sharp from "sharp";
import { finished } from "node:stream/promises";
import { mediaBucket } from "./gridfsMedia.js";
import { v2 as cloudinary } from "cloudinary";
import { AppError } from "../utils/AppError.js";
import { StorageCleanup } from "../models/StorageCleanup.js";

const ttlSeconds = 300;
function requireStorage() {
  if (!cloudinary.config().cloud_name || !cloudinary.config().api_key || !cloudinary.config().api_secret) throw new AppError(503, "SERVICE_UNAVAILABLE", "Asset storage is not configured");
}

export function uploadFile(buffer, { projectId, assetId, format }) {
  if ((process.env.ASSET_STORAGE === "gridfs" || process.env.ASSET_STORAGE !== "cloudinary" && process.env.NODE_ENV !== "test" && !process.env.NODE_TEST_CONTEXT)) return uploadMongo(buffer, format);
  requireStorage();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ resource_type: "image", type: "authenticated", access_mode: "authenticated", public_id: `brandhub/${projectId}/${assetId}`, overwrite: false, format }, (error, result) => error ? reject(error) : resolve(result));
    stream.end(buffer);
  });
}

export async function deleteFile(publicId) {
  if (publicId.startsWith("gridfs:")) { await mediaBucket().delete(new mongoose.Types.ObjectId(publicId.slice(7))); return { result: "ok" }; }
  requireStorage();
  return cloudinary.uploader.destroy(publicId, { resource_type: "image", type: "authenticated", invalidate: true });
}

function signedUrl(file, transformation) {
  if (file.publicId.startsWith("gridfs:")) return { url: `/api/assets/stored/${file.publicId.slice(7)}`, expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString() };
  requireStorage();
  const key = process.env.CLOUDINARY_AUTH_TOKEN_KEY;
  if (!key) throw new AppError(503, "SERVICE_UNAVAILABLE", "Protected asset delivery is not configured");
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const url = cloudinary.url(file.publicId, { resource_type: "image", type: "authenticated", secure: true, sign_url: true, version: file.storageVersion, format: file.format, ...(transformation ? { transformation } : {}), auth_token: { key, duration: ttlSeconds } });
  return { url, expiresAt: expiresAt.toISOString() };
}

export function getSignedFileUrl(file) { return signedUrl(file); }
export function getSignedThumbnailUrl(file) { return signedUrl(file, [{ width: 480, height: 360, crop: "limit", quality: "auto", fetch_format: "auto" }]); }

export async function queueStorageCleanup(publicId, ready = true) {
  await StorageCleanup.updateOne({ publicId }, { $setOnInsert: { publicId, ready } }, { upsert: true });
}

export async function releaseStorageCleanup(publicId) {
  await StorageCleanup.updateOne({ publicId }, { $set: { ready: true } });
}

export async function retryStorageCleanup() {
  const jobs = await StorageCleanup.find({ ready: true }).sort({ createdAt: 1 }).limit(20);
  for (const job of jobs) {
    try { await deleteFile(job.publicId); await job.deleteOne(); }
    catch { await StorageCleanup.updateOne({ _id: job._id }, { $inc: { attempts: 1 }, $set: { lastErrorAt: new Date() } }); }
  }
}

export function startStorageCleanupWorker() {
  const timer = setInterval(() => retryStorageCleanup().catch(() => console.error("Asset storage cleanup retry failed")), 10 * 60 * 1000);
  timer.unref();
  return () => clearInterval(timer);
}

async function uploadMongo(buffer, format) {
  const dimensions = await sharp(buffer).metadata();
  const stream = mediaBucket().openUploadStream(`design.${format}`, { metadata: { contentType: `image/${format === "jpg" ? "jpeg" : format}` } });
  stream.end(buffer);
  await finished(stream);
  return { public_id: `gridfs:${stream.id}`, version: 1, bytes: buffer.length, width: dimensions.width, height: dimensions.height };
}
