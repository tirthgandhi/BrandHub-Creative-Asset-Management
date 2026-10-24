import mongoose from "mongoose";

const schema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true
  },
  assetId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Asset", 
    required: true 
  },
}, { timestamps: { createdAt: true, updatedAt: false } });

// Unique compound index: one bookmark per user per asset
schema.index({ userId: 1, assetId: 1 }, { unique: true });

// Index for efficient asset lookup
schema.index({ assetId: 1 });

export const Bookmark = mongoose.models.Bookmark || mongoose.model("Bookmark", schema);
