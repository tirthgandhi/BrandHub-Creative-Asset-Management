import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["admin", "designer", "client"], required: true, default: "client", index: true },
  avatarUrl: { type: String, default: "", maxlength: 500 },
  professionalTitle: { type: String, default: "", maxlength: 120 },
  bio: { type: String, default: "", maxlength: 1000 },
  skills: [{ type: String, trim: true, maxlength: 60 }],
  demoKey: { type: String, default: null },
  isActive: { type: Boolean, default: true, index: true },
  mustChangePassword: { type: Boolean, default: false },
  authVersion: { type: Number, default: 0, select: false },
}, { timestamps: true });

userSchema.set("toJSON", {
  transform(_document, value) {
    value.id = value._id.toString();
    delete value._id;
    delete value.__v;
    delete value.passwordHash;
    delete value.authVersion;
    return value;
  },
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
