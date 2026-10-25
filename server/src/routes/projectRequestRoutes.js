import crypto from "node:crypto";
import mongoose from "mongoose";
import { z } from "zod";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { Project } from "../models/Project.js";
import { ProjectRequest } from "../models/ProjectRequest.js";
import { requireAuth, requirePasswordChanged, requireRole } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { validateAssignments, validateProjectDates } from "../services/projectValidation.js";
import { envelope, idParams, requestCreate, requestDecision, requestList } from "../validation/projectSchemas.js";

export const projectRequestRouter = Router();
projectRequestRouter.use(requireAuth, requirePasswordChanged);
const requestWriteLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { success: false, error: { code: "RATE_LIMITED", message: "Too many project requests", details: [] } } });
const requestId = envelope(z.any(), idParams);
const serialize = (request) => ({ id: request.id, clientId: String(request.clientId?._id || request.clientId), ...(request.clientId?.name ? { clientName: request.clientId.name } : {}), title: request.title, description: request.description, category: request.category, contactDetails: request.contactDetails || {}, amount: (request.amountPaise || 0) / 100, currency: "INR", payment: { status: request.paymentStatus || "unpaid", method: request.paymentMethod || null, reference: request.paymentReference || null, paidAt: request.paymentPaidAt || null, amount: (request.paymentAmountPaise || 0) / 100, isDemo: true }, desiredDeadline: request.desiredDeadline || null, status: request.status, adminNote: request.adminNote, reviewedBy: request.reviewedBy ? String(request.reviewedBy) : null, reviewedAt: request.reviewedAt || null, projectId: request.projectId ? String(request.projectId) : null, createdAt: request.createdAt, updatedAt: request.updatedAt });

projectRequestRouter.post("/", requireRole("client"), requestWriteLimiter, requireCsrf, validate(requestCreate), asyncHandler(async (req, res) => {
  await ProjectRequest.init();
  for (let slot = 0; slot < 5; slot++) {
    try {
      const { amount = 0, contactDetails, ...brief } = req.validated.body;
      const request = await ProjectRequest.create({ ...brief, contactDetails: contactDetails || { name: req.user.name, email: req.user.email }, amountPaise: Math.round(amount * 100), clientId: req.user._id, pendingSlot: slot });
      return res.status(201).json({ data: { projectRequest: serialize(request) } });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
  throw new AppError(409, "CONFLICT", "You already have five pending requests");
}));

projectRequestRouter.get("/", requireRole("project_manager", "client"), validate(requestList), asyncHandler(async (req, res) => {
  const { page, limit, status, category, sort } = req.validated.query;
  const filter = ["project_manager", "super_admin"].includes(req.user.role) ? {} : { clientId: req.user._id };
  if (status) filter.status = status;
  if (category) filter.category = category;
  const [rows, total] = await Promise.all([ProjectRequest.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).populate(["project_manager", "super_admin"].includes(req.user.role) ? { path: "clientId", select: "name" } : []), ProjectRequest.countDocuments(filter)]);
  res.json({ data: rows.map(serialize), pagination: { page, limit, total } });
}));

projectRequestRouter.get("/:id", requireRole("project_manager", "client"), validate(requestId), asyncHandler(async (req, res) => {
  const filter = { _id: req.validated.params.id };
  if (req.user.role === "client") filter.clientId = req.user._id;
  const request = await ProjectRequest.findOne(filter);
  if (!request) throw new AppError(404, "NOT_FOUND", "Project request not found");
  res.json({ data: { projectRequest: serialize(request) } });
}));

projectRequestRouter.patch("/:id/cancel", requireRole("client"), requireCsrf, validate(requestId), asyncHandler(async (req, res) => {
  const request = await ProjectRequest.findOneAndUpdate({ _id: req.validated.params.id, clientId: req.user._id, status: "pending" }, { $set: { status: "cancelled" }, $unset: { pendingSlot: "" } }, { returnDocument: "after" });
  if (!request) {
    const own = await ProjectRequest.exists({ _id: req.validated.params.id, clientId: req.user._id });
    throw new AppError(own ? 409 : 404, own ? "CONFLICT" : "NOT_FOUND", own ? "Only pending requests can be cancelled" : "Project request not found");
  }
  res.json({ data: { projectRequest: serialize(request) } });
}));

// Prototype-only checkout: no payment provider or real financial details are involved.
projectRequestRouter.post("/:id/payment", requireRole("client"), requireCsrf, validate(envelope(z.strictObject({ method: z.enum(["upi", "card", "bank"]), outcome: z.enum(["success", "failure"]).default("success") }), idParams)), asyncHandler(async (req, res) => {
  const request = await ProjectRequest.findOne({ _id: req.validated.params.id, clientId: req.user._id });
  if (!request) throw new AppError(404, "NOT_FOUND", "Project request not found");
  if (request.status !== "approved" || !request.projectId) throw new AppError(409, "CONFLICT", "Payment is available after the Project Manager approves your request");
  if (!request.amountPaise) throw new AppError(422, "VALIDATION_ERROR", "This request does not have a payable amount");
  if (request.paymentStatus === "paid") return res.json({ data: { projectRequest: serialize(request) } });
  if (req.validated.body.outcome === "failure") throw new AppError(402, "DEMO_PAYMENT_FAILED", "Demo payment was declined. No money was charged. You can try again.");
  const paid = await ProjectRequest.findOneAndUpdate({ _id: request._id, clientId: req.user._id, status: "approved", paymentStatus: { $ne: "paid" } }, { $set: { paymentStatus: "paid", paymentMethod: req.validated.body.method, paymentReference: `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, paymentPaidAt: new Date(), paymentAmountPaise: request.amountPaise } }, { returnDocument: "after" });
  const result = paid || await ProjectRequest.findById(request._id);
  res.json({ data: { projectRequest: serialize(result) } });
}));

async function approveStandalone(request, actor, body) {
  // The unique Project.sourceRequestId makes retries idempotent on standalone MongoDB.
  const claimed = await ProjectRequest.findOneAndUpdate({ _id: request._id, status: "pending" }, { $set: { status: "processing", reviewedBy: actor._id, reviewedAt: new Date() } }, { returnDocument: "after" });
  if (!claimed) throw new AppError(409, "CONFLICT", "This request is already being reviewed");
  try {
    let project = await Project.findOne({ sourceRequestId: request._id });
    if (!project) project = await Project.create({ title: request.title, description: request.description, category: request.category, clientId: request.clientId, designerIds: body.designerIds || [], startDate: body.startDate, dueDate: body.dueDate || request.desiredDeadline, visibility: "private", createdBy: actor._id, sourceRequestId: request._id });
    const updated = await ProjectRequest.findOneAndUpdate({ _id: request._id, status: "processing" }, { $set: { status: "approved", projectId: project._id, adminNote: body.note || "" }, $unset: { pendingSlot: "" } }, { returnDocument: "after" });
    if (!updated) throw new AppError(409, "CONFLICT", "Request state changed during approval");
    return { request: updated, project };
  } catch (error) {
    await ProjectRequest.updateOne({ _id: request._id, status: "processing" }, { $set: { status: "pending" }, $unset: { reviewedBy: "", reviewedAt: "" } });
    throw error;
  }
}

projectRequestRouter.patch("/:id", requireRole("project_manager"), requireCsrf, validate(requestDecision), asyncHandler(async (req, res) => {
  const request = await ProjectRequest.findById(req.validated.params.id);
  if (!request) throw new AppError(404, "NOT_FOUND", "Project request not found");
  const body = req.validated.body;
  if (request.status === "processing" && body.decision === "approve" && request.updatedAt < new Date(Date.now() - 30_000)) {
    const project = await Project.findOne({ sourceRequestId: request._id });
    if (project) {
      const recovered = await ProjectRequest.findOneAndUpdate({ _id: request._id, status: "processing", updatedAt: request.updatedAt }, { $set: { status: "approved", projectId: project._id }, $unset: { pendingSlot: "" } }, { returnDocument: "after" });
      if (recovered) return res.json({ data: { projectRequest: serialize(recovered), project: { id: project.id, title: project.title } } });
    } else await ProjectRequest.updateOne({ _id: request._id, status: "processing", updatedAt: request.updatedAt }, { $set: { status: "pending" }, $unset: { reviewedBy: "", reviewedAt: "" } });
    request.status = "pending";
  }
  if (request.status !== "pending") throw new AppError(409, "CONFLICT", "Only pending requests can be reviewed");
  if (body.decision === "reject") {
    const updated = await ProjectRequest.findOneAndUpdate({ _id: request._id, status: "pending" }, { $set: { status: "rejected", adminNote: body.note, reviewedBy: req.user._id, reviewedAt: new Date() }, $unset: { pendingSlot: "" } }, { returnDocument: "after" });
    if (!updated) throw new AppError(409, "CONFLICT", "Request state changed during review");
    return res.json({ data: { projectRequest: serialize(updated) } });
  }
  await validateAssignments(request.clientId, body.designerIds || []);
  validateProjectDates(body.startDate, body.dueDate || request.desiredDeadline);
  // Transactions are preferred on replica sets. A unique request-to-project link is the standalone fallback.
  let result;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const claimed = await ProjectRequest.findOneAndUpdate({ _id: request._id, status: "pending" }, { $set: { status: "processing" } }, { returnDocument: "after", session });
      if (!claimed) throw new AppError(409, "CONFLICT", "Request state changed during approval");
      const [project] = await Project.create([{ title: request.title, description: request.description, category: request.category, clientId: request.clientId, designerIds: body.designerIds || [], startDate: body.startDate, dueDate: body.dueDate || request.desiredDeadline, visibility: "private", createdBy: req.user._id, sourceRequestId: request._id }], { session });
      const updated = await ProjectRequest.findOneAndUpdate({ _id: request._id, status: "processing" }, { $set: { status: "approved", projectId: project._id, adminNote: body.note || "", reviewedBy: req.user._id, reviewedAt: new Date() }, $unset: { pendingSlot: "" } }, { returnDocument: "after", session });
      result = { request: updated, project };
    });
  } catch (error) {
    if (!/Transaction numbers are only allowed|replica set|mongos|does not support retryable writes/i.test(error.message)) throw error;
    result = await approveStandalone(request, req.user, body);
  } finally { await session.endSession(); }
  res.json({ data: { projectRequest: serialize(result.request), project: { id: result.project.id, title: result.project.title } } });
}));
