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
const management = user => ["project_manager", "super_admin"].includes(user.role);
const privileged = user => ["project_manager", "super_admin"].includes(user.role);
const forbidden = message => new AppError(403, "FORBIDDEN", message);

userRouter.get("/", requireRole("project_manager"), validate(listUsersSchema), asyncHandler(async (req, res) => {
  const { page, limit, search, role, isActive, sort } = req.validated.query;
  const clauses = [];
  if (req.user.role !== "super_admin") clauses.push({ $or: [{ role: { $in: ["client", "designer"] } }, { _id: req.user._id }] });
  if (search) { const regex = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" }; clauses.push({ $or: [{ name: regex }, { email: regex }] }); }
  if (role) clauses.push({ role });
  if (isActive !== undefined) clauses.push({ isActive: isActive === "true" });
  const filter = clauses.length ? { $and: clauses } : {};
  const [users, total] = await Promise.all([User.find(filter).sort(sort).skip((page - 1) * limit).limit(limit), User.countDocuments(filter)]);
  res.json({ data: users.map(user => user.toJSON()), pagination: { page, limit, total } });
}));
userRouter.post("/", requireRole("project_manager"), requireCsrf, validate(createUserSchema), asyncHandler(async (req, res) => {
  const { name, email, role, initialPassword } = req.validated.body;
  if (role === "project_manager" && req.user.role !== "super_admin") throw forbidden("Only Super Admin can create project managers");
  const user = await User.create({ name, email, role, passwordHash: await hashPassword(initialPassword), mustChangePassword: role === "designer" });
  res.status(201).json({ data: { user: user.toJSON() } });
}));
userRouter.get("/:id", validate(userIdSchema), asyncHandler(async (req, res) => {
  const user = await User.findById(req.validated.params.id);
  if (!user) throw new AppError(404, "NOT_FOUND", "User not found");
  const self = req.user.id === user.id;
  if (!self && (!management(req.user) || req.user.role !== "super_admin" && privileged(user))) throw forbidden("You do not have permission to view this user");
  res.json({ data: { user: user.toJSON() } });
}));
userRouter.patch("/:id", requireCsrf, validate(updateUserSchema), asyncHandler(async (req, res) => {
  const target = await User.findById(req.validated.params.id).select("+authVersion");
  if (!target) throw new AppError(404, "NOT_FOUND", "User not found");
  const self = req.user.id === target.id, elevated = management(req.user), superAdmin = req.user.role === "super_admin";
  const updates = req.validated.body;
  if (!elevated && !self) throw forbidden("You do not have permission to update this user");
  if (!elevated && ("role" in updates || "isActive" in updates)) throw forbidden("Only workspace management can change roles or account state");
  if (target.role === "super_admin" && (updates.role && updates.role !== "super_admin" || updates.isActive === false)) throw new AppError(409, "CONFLICT", "The sole Super Admin cannot be demoted or deactivated");
  if (target.role === "project_manager" && target.isActive && (updates.role && updates.role !== "project_manager" || updates.isActive === false) && await User.countDocuments({ role: "project_manager", isActive: true }) <= 1) throw new AppError(409, "CONFLICT", "The last active Project Manager cannot be deactivated or demoted");
  if (!superAdmin && (privileged(target) && (!self || "role" in updates || "isActive" in updates) || updates.role && privileged({ role: updates.role }))) throw forbidden("Only Super Admin can manage privileged accounts");
  if (updates.role === "super_admin" && target.role !== "super_admin") throw forbidden("The workspace has one Super Admin; this role cannot be granted here");
  const invalidate = updates.isActive === false || Boolean(updates.role && updates.role !== target.role);
  Object.assign(target, updates); if (invalidate) target.authVersion += 1;
  await target.save(); res.json({ data: { user: target.toJSON() } });
}));
