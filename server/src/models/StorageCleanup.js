import mongoose from "mongoose";

const schema = new mongoose.Schema({
  publicId: { type: String, required: true, unique: true },
  ready: { type: Boolean, default: true, index: true },
  attempts: { type: Number, default: 0 },
  lastErrorAt: Date,
}, { timestamps: true });
export const StorageCleanup = mongoose.models.StorageCleanup || mongoose.model("StorageCleanup", schema);
