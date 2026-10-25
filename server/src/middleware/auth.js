import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function destroySession(req) {
  return new Promise((resolve) => req.session?.destroy(() => resolve()));
}

export const requireAuth = asyncHandler(async (req, _res, next) => {
  if (!req.session?.userId) throw new AppError(401, "UNAUTHENTICATED", "Authentication required");
  const user = await User.findById(req.session.userId).select("+authVersion");
  if (!user || !user.isActive || user.authVersion !== req.session.authVersion) {
    await destroySession(req);
    throw new AppError(401, "UNAUTHENTICATED", "Authentication required");
  }
  req.user = user;
  next();
});

export const requireRole = (...roles) => (req, _res, next) => (roles.includes(req.user.role) || req.user.role === "super_admin" && roles.includes("project_manager")) ? next() : next(new AppError(403, "FORBIDDEN", "You do not have permission to perform this action"));

export function requirePasswordChanged(req, _res, next) {
  if (req.user.mustChangePassword) return next(new AppError(403, "PASSWORD_CHANGE_REQUIRED", "Change your password before continuing"));
  next();
}
