import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";

export function notFound(req, _res, next) {
  next(new AppError(404, "NOT_FOUND", `Route ${req.method} ${req.path} was not found`));
}

export function errorHandler(error, _req, res, _next) {
  let normalized = error;
  if (error instanceof mongoose.Error.CastError) normalized = new AppError(404, "NOT_FOUND", "Resource not found");
  if (error?.code === 11000) normalized = new AppError(409, "CONFLICT", "A record with that value already exists");
  if (error instanceof mongoose.Error.ValidationError) {
    normalized = new AppError(422, "VALIDATION_ERROR", "Invalid request data", Object.values(error.errors).map((item) => ({ field: item.path, message: item.message })));
  }
  const status = normalized.status || 500;
  const payload = { success: false, error: { code: normalized.code || "INTERNAL_ERROR", message: status === 500 ? "An unexpected error occurred" : normalized.message, details: normalized.details || [] } };
  if (process.env.NODE_ENV !== "production" && status === 500) payload.error.details = [{ message: normalized.message }];
  res.status(status).json(payload);
}
