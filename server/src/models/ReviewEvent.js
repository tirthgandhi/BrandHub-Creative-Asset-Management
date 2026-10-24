import mongoose from "mongoose";

const REVIEW_ACTIONS = ["submit", "approve", "request_changes", "revision_uploaded"];

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
  actorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  action: { 
    type: String, 
    enum: REVIEW_ACTIONS, 
    required: true 
  },
  fromStatus: { 
    type: String, 
    required: true 
  },
  toStatus: { 
    type: String, 
    required: true 
  },
  note: { 
    type: String, 
    default: "", 
    maxlength: 2000 
  },
}, { 
  timestamps: { createdAt: true, updatedAt: false } 
});

// Index for fetching asset history
schema.index({ assetId: 1, createdAt: -1 });

// Prevent modification of historical events
schema.pre("save", function(next) {
  if (!this.isNew) {
    return next(new Error("ReviewEvent records are immutable"));
  }
  next();
});

export const ReviewEvent = mongoose.models.ReviewEvent || mongoose.model("ReviewEvent", schema);
