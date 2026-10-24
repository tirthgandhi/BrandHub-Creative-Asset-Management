import { Router } from "express";
import { User } from "../models/User.js";
import { requireAuth, requirePasswordChanged, requireRole } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { hashPassword } from "../utils/password.js";
import { createUserSchema, listUsersSchema, updateUserSchema, userIdSchema } from "../validation/userSchemas.js";

export const userRouter = Router();
userRouter.use(requireAuth, requirePasswordChanged);

userRouter.get("/", requireRole("admin"), validate(listUsersSchema), asyncHandler(async (req, res) => {
  const { page, limit, search, role, isActive, sort } = req.validated.query;
  const filter = {};
  if (search) filter.$or = [{ name: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }, { email: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }];
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  const [users, total] = await Promise.all([User.find(filter).sort(sort).skip((page - 1) * limit).limit(limit), User.countDocuments(filter)]);
  res.json({ data: users.map((user) => user.toJSON()), pagination: { page, limit, total } });
}));

userRouter.post("/", requireRole("admin"), requireCsrf, validate(createUserSchema), asyncHandler(async (req, res) => {
  const { name, email, role, initialPassword } = req.validated.body;
  const user = await User.create({ name, email, role, passwordHash: await hashPassword(initialPassword), mustChangePassword: role === "designer" });
  res.status(201).json({ data: { user: user.toJSON() } });
}));

userRouter.get("/:id", validate(userIdSchema), asyncHandler(async (req, res) => {
  if (req.user.role !== "admin" && req.user.id !== req.validated.params.id) throw new AppError(403, "FORBIDDEN", "You do not have permission to view this user");
  const user = await User.findById(req.validated.params.id);
  if (!user) throw new AppError(404, "NOT_FOUND", "User not found");
  res.json({ data: { user: user.toJSON() } });
}));

userRouter.patch("/:id", requireCsrf, validate(updateUserSchema), asyncHandler(async (req, res) => {
  const target = await User.findById(req.validated.params.id).select("+authVersion");
  if (!target) throw new AppError(404, "NOT_FOUND", "User not found");
  const isAdmin = req.user.role === "admin";
  const isSelf = req.user.id === target.id;
  if (!isAdmin && !isSelf) throw new AppError(403, "FORBIDDEN", "You do not have permission to update this user");
  const updates = req.validated.body;
  if (!isAdmin && ("role" in updates || "isActive" in updates)) throw new AppError(403, "FORBIDDEN", "Role and active state can only be changed by an Admin");
  const removesActiveAdmin = target.role === "admin" && target.isActive && (updates.role && updates.role !== "admin" || updates.isActive === false);
  if (removesActiveAdmin && await User.countDocuments({ role: "admin", isActive: true }) <= 1) throw new AppError(409, "CONFLICT", "The last active Admin cannot be deactivated or demoted");
  const shouldInvalidateSessions = updates.isActive === false || Boolean(updates.role && updates.role !== target.role);
  Object.assign(target, updates);
  if (shouldInvalidateSessions) target.authVersion += 1;
  await target.save();
  res.json({ data: { user: target.toJSON() } });
}));
