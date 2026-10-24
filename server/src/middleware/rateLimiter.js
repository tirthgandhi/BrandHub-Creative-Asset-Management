import { rateLimit } from "express-rate-limit";

const message = { success: false, error: { code: "RATE_LIMITED", message: "Too many requests", details: [] } };
export const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 500, standardHeaders: true, legacyHeaders: false, message });
export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message });
