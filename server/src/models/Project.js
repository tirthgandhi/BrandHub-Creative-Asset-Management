import mongoose from "mongoose";

export const CATEGORIES = ["Logo", "Social Media", "Website Banner", "Poster", "Brand Identity", "Marketing Creative"];
export const PROJECT_STATUSES = ["active", "on_hold", "completed", "archived"];

const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 4000 },
  category: { type: String, required: true, enum: CATEGORIES },
  status: { type: String, enum: PROJECT_STATUSES, default: "active" },
  visibility: { type: String, enum: ["private", "public"], default: "private" },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  designerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sourceRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "ProjectRequest" },
  demoKey: { type: String, default: null },
  startDate: Date,
  dueDate: Date,
}, { timestamps: true });

schema.index({ designerIds: 1, status: 1, createdAt: -1 });
schema.index({ visibility: 1, status: 1, createdAt: -1 });
schema.index({ category: 1, createdAt: -1 });
schema.index({ sourceRequestId: 1 }, { unique: true, partialFilterExpression: { sourceRequestId: { $type: "objectId" } } });
schema.index({ demoKey: 1 }, { unique: true, partialFilterExpression: { demoKey: { $type: "string" } } });

export const Project = mongoose.models.Project || mongoose.model("Project", schema);
