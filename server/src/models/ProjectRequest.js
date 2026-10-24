import mongoose from "mongoose";
import { CATEGORIES } from "./Project.js";

const schema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 4000 },
  category: { type: String, required: true, enum: CATEGORIES },
  desiredDeadline: Date,
  status: { type: String, enum: ["pending", "processing", "approved", "rejected", "cancelled"], default: "pending" },
  pendingSlot: Number,
  adminNote: { type: String, default: "", maxlength: 2000 },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: Date,
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
}, { timestamps: true });

// A pending request occupies one of five unique slots. Concurrent inserts cannot exceed five.
schema.index({ clientId: 1, pendingSlot: 1 }, { unique: true, partialFilterExpression: { pendingSlot: { $type: "number" } } });
schema.index({ status: 1, createdAt: -1 });
schema.index({ clientId: 1, status: 1, createdAt: -1 });
schema.index({ projectId: 1 }, { unique: true, partialFilterExpression: { projectId: { $type: "objectId" } } });

export const ProjectRequest = mongoose.models.ProjectRequest || mongoose.model("ProjectRequest", schema);
