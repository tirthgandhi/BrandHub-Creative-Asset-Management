import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, unique: true },
  designerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  status: { type: String, enum: ["active", "on_hold", "completed", "archived"], default: "active" },
  demoKey: { type: String, required: true, unique: true },
}, { timestamps: true });

export const Campaign = mongoose.models.Campaign || mongoose.model("Campaign", schema);
