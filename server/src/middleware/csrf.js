import { randomBytes, timingSafeEqual } from "node:crypto";
import { AppError } from "../utils/AppError.js";

export function ensureCsrfToken(req) {
  if (!req.session.csrfToken) req.session.csrfToken = randomBytes(24).toString("base64url");
  return req.session.csrfToken;
}

export function requireCsrf(req, _res, next) {
  const expected = req.session?.csrfToken;
  const supplied = req.get("X-CSRF-Token");
  if (!expected || !supplied) return next(new AppError(403, "FORBIDDEN", "Invalid CSRF token"));
  const left = Buffer.from(expected); const right = Buffer.from(supplied);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return next(new AppError(403, "FORBIDDEN", "Invalid CSRF token"));
  next();
}
