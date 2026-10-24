import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";
import { AppError } from "../utils/AppError.js";

const bucketName = "brandhubUploads";
const budgetId = "brandhubUploads";

export function mediaBucket() {
  if (!mongoose.connection.db) throw new AppError(503, "SERVICE_UNAVAILABLE", "Media database is unavailable");
  return new GridFSBucket(mongoose.connection.db, { bucketName });
}

export async function reserveMediaBytes(bytes) {
  const db = mongoose.connection.db;
  const budget = Number(process.env.GRIDFS_UPLOAD_BUDGET_BYTES || 250 * 1024 * 1024);
  if (!Number.isSafeInteger(bytes) || bytes < 1 || !Number.isSafeInteger(budget) || budget < 1) throw new AppError(422, "VALIDATION_ERROR", "Invalid upload size or storage budget");
  const collection = db.collection("mediaUploadBudgets");
  const existing = await collection.findOne({ _id: budgetId });
  if (!existing) {
    const uploadedFiles = await db.collection(`${bucketName}.files`).aggregate([{ $group: { _id: null, bytes: { $sum: "$length" } } }]).toArray();
    await collection.updateOne({ _id: budgetId }, { $setOnInsert: { usedBytes: uploadedFiles[0]?.bytes || 0, reservedBytes: 0 } }, { upsert: true });
  }
  const reserved = await collection.findOneAndUpdate({ _id: budgetId, $expr: { $lte: [{ $add: ["$usedBytes", "$reservedBytes", bytes] }, budget] } }, { $inc: { reservedBytes: bytes } }, { returnDocument: "after" });
  if (!reserved) throw new AppError(413, "STORAGE_LIMIT", "BrandHub upload storage is full. Please contact an administrator.");
  return async (actualBytes = 0) => {
    await collection.updateOne({ _id: budgetId }, { $inc: { reservedBytes: -bytes, usedBytes: actualBytes } });
  };
}

export async function releaseMediaBytes(bytes) {
  await mongoose.connection.db.collection("mediaUploadBudgets").updateOne({ _id: budgetId }, { $inc: { usedBytes: -bytes } });
}

export async function mediaStorageUsage() {
  const budget = Number(process.env.GRIDFS_UPLOAD_BUDGET_BYTES || 250 * 1024 * 1024);
  const state = await mongoose.connection.db.collection("mediaUploadBudgets").findOne({ _id: budgetId });
  return { usedBytes: state?.usedBytes || 0, reservedBytes: state?.reservedBytes || 0, budgetBytes: budget };
}
