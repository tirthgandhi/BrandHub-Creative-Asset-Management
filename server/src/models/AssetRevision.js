import mongoose from "mongoose";
import { fileSchema } from "./Asset.js";

const schema = new mongoose.Schema({
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", required: true, index: true },
  version: { type: Number, required: true, min: 1 },
  file: { type: fileSchema, required: true, select: false },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  note: { type: String, default: "", maxlength: 2000 },
}, { timestamps: { createdAt: true, updatedAt: false } });
schema.index({ assetId: 1, version: 1 }, { unique: true });

export const AssetRevision = mongoose.models.AssetRevision || mongoose.model("AssetRevision", schema);
