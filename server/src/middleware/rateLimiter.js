import { rateLimit } from "express-rate-limit";

const message = { success: false, error: { code: "RATE_LIMITED", message: "Too many requests", details: [] } };
export const createApiLimiter = (limit = 500) => rateLimit({ windowMs: 15 * 60 * 1000, limit, standardHeaders: true, legacyHeaders: false, message });
export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message });
