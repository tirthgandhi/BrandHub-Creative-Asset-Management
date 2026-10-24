import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { User } from "../models/User.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { ensureCsrfToken, requireCsrf } from "../middleware/csrf.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { changePasswordSchema, loginSchema, registerSchema } from "../validation/authSchemas.js";

const limited = { success: false, error: { code: "RATE_LIMITED", message: "Too many requests", details: [] } };
const saveSession = (req) => new Promise((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
const regenerate = (req) => new Promise((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()));

async function establishSession(req, user) {
  await regenerate(req);
  req.session.userId = user.id;
  req.session.authVersion = user.authVersion;
  const csrfToken = ensureCsrfToken(req);
  await saveSession(req);
  return csrfToken;
}

export function createAuthRouter({ limit = 20 } = {}) {
  const router = Router();
  const limiter = () => rateLimit({ windowMs: 15 * 60 * 1000, limit, standardHeaders: true, legacyHeaders: false, message: limited });

  router.get("/csrf", (req, res) => res.json({ data: { csrfToken: ensureCsrfToken(req) } }));
  router.post("/register", limiter(), validate(registerSchema), asyncHandler(async (req, res) => {
    const { name, email, password } = req.validated.body;
    const user = await User.create({ name, email, passwordHash: await hashPassword(password), role: "client", mustChangePassword: false });
    const authUser = await User.findById(user.id).select("+authVersion");
    const csrfToken = await establishSession(req, authUser);
    res.status(201).json({ data: { user: authUser.toJSON(), csrfToken } });
  }));
  router.post("/login", limiter(), validate(loginSchema), asyncHandler(async (req, res) => {
    const { email, password } = req.validated.body;
    const user = await User.findOne({ email }).select("+passwordHash +authVersion");
    if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) throw new AppError(401, "UNAUTHENTICATED", "Invalid email or password");
    const csrfToken = await establishSession(req, user);
    res.json({ data: { user: user.toJSON(), csrfToken } });
  }));
  router.post("/logout", requireAuth, requireCsrf, (req, res, next) => req.session.destroy((error) => { if (error) return next(error); res.clearCookie(req.app.get("cookieName"), req.app.get("cookieOptions")); res.status(204).end(); }));
  router.get("/me", requireAuth, (req, res) => res.json({ data: { user: req.user.toJSON(), csrfToken: ensureCsrfToken(req) } }));
  router.patch("/change-password", requireAuth, requireCsrf, validate(changePasswordSchema), asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select("+passwordHash +authVersion");
    if (!(await verifyPassword(req.validated.body.currentPassword, user.passwordHash))) throw new AppError(422, "VALIDATION_ERROR", "Current password is incorrect", [{ field: "currentPassword", message: "Current password is incorrect" }]);
    if (await verifyPassword(req.validated.body.newPassword, user.passwordHash)) throw new AppError(422, "VALIDATION_ERROR", "New password must be different", [{ field: "newPassword", message: "Choose a different password" }]);
    user.passwordHash = await hashPassword(req.validated.body.newPassword);
    user.mustChangePassword = false;
    user.authVersion += 1;
    await user.save();
    const csrfToken = await establishSession(req, user);
    res.json({ data: { user: user.toJSON(), csrfToken } });
  }));
  return router;
}
