import mongoose from "mongoose";

const schema = new mongoose.Schema({
  assetId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Asset", 
    required: true, 
    index: true 
  },
  version: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true
  },
  content: { 
    type: String, 
    required: true, 
    trim: true,
    minlength: 1,
    maxlength: 1000 
  },
}, { timestamps: true });

// Composite index for efficient queries
schema.index({ assetId: 1, version: 1, createdAt: -1 });
schema.index({ userId: 1, createdAt: -1 });

export const Comment = mongoose.models.Comment || mongoose.model("Comment", schema);
