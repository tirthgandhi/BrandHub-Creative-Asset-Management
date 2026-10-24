import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  category: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  location: { type: String, default: "Remote" },
  demoKey: { type: String, required: true, unique: true },
}, { timestamps: true });

export const Brand = mongoose.models.Brand || mongoose.model("Brand", schema);
