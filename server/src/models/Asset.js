import mongoose from "mongoose";
import { CATEGORIES } from "./Project.js";

export const ASSET_STATUSES = ["draft", "in_review", "changes_requested", "approved"];
export const fileSchema = new mongoose.Schema({
  publicId: { type: String, required: true },
  storageVersion: { type: Number, required: true },
  bytes: { type: Number, required: true },
  format: { type: String, enum: ["jpg", "png", "webp"], required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  deliveryType: { type: String, enum: ["authenticated"], default: "authenticated" },
}, { _id: false });

const schema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  description: { type: String, default: "", trim: true, maxlength: 4000 },
  category: { type: String, enum: CATEGORIES, required: true },
  tags: [{ type: String, trim: true, lowercase: true, maxlength: 32 }],
  currentVersion: { type: Number, default: 1, min: 1 },
  status: { type: String, enum: ASSET_STATUSES, default: "draft" },
  currentFile: { type: fileSchema, required: true, select: false },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: Date,
  reviewNote: { type: String, default: "" },
  uploadKey: { type: String, maxlength: 100, select: false },
}, { timestamps: true });
schema.index({ projectId: 1, status: 1, createdAt: -1 });
schema.index({ title: 1, createdAt: -1 });
schema.index({ tags: 1, createdAt: -1 });
schema.index({ uploadedBy: 1, uploadKey: 1 }, { unique: true, partialFilterExpression: { uploadKey: { $type: "string" } } });

export const Asset = mongoose.models.Asset || mongoose.model("Asset", schema);
