import mongoose from "mongoose";

const schema = new mongoose.Schema({
  storageType: { type: String, enum: ["local", "gridfs"], required: true },
  mediaType: { type: String, enum: ["image", "video"], required: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: "", trim: true, maxlength: 2000 },
  category: { type: String, required: true, trim: true, maxlength: 60 },
  contentType: { type: String, enum: ["gallery", "post", "story", "reel"], default: "gallery" },
  mimeType: { type: String, required: true },
  originalFilename: { type: String, required: true, maxlength: 255 },
  storedFilename: { type: String, required: true, maxlength: 255 },
  localPath: { type: String, default: null },
  gridFsFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
  thumbnailUrl: { type: String, default: "" },
  fileSize: { type: Number, required: true, min: 1 },
  width: Number,
  height: Number,
  duration: Number,
  checksum: { type: String, required: true, index: true },
  usageRightsStatus: { type: String, enum: ["unverified", "verified"], default: "unverified" },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  ownerClientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  assignedDesignerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", default: null },
  visibility: { type: String, enum: ["private", "public"], default: "private" },
  status: { type: String, enum: ["draft", "in_review", "changes_requested", "approved"], default: "draft" },
  demoKey: { type: String, default: null },
}, { timestamps: true });

schema.index({ projectId: 1, createdAt: -1 });
schema.index({ ownerClientId: 1, contentType: 1, createdAt: -1 });
schema.index({ demoKey: 1 }, { unique: true, partialFilterExpression: { demoKey: { $type: "string" } } });
schema.index({ gridFsFileId: 1 }, { unique: true, partialFilterExpression: { gridFsFileId: { $type: "objectId" } } });
schema.pre("validate", function validateStorage() {
  if (this.storageType === "local" && (!this.localPath || this.gridFsFileId)) throw new Error("Local media requires only a local path");
  if (this.storageType === "gridfs" && (!this.gridFsFileId || this.localPath)) throw new Error("GridFS media requires only a GridFS file ID");
  if (this.contentType === "reel" && this.mediaType !== "video") throw new Error("Reels require video media");
});

export const MediaAsset = mongoose.models.MediaAsset || mongoose.model("MediaAsset", schema);
