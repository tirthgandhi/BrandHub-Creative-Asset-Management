import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";
import { createVercelApp } from "../index.js";

test("Vercel entry is lazy, shares initialization and retains the public /api path", async () => {
  let starts = 0;
  const app = createVercelApp(async () => { starts++; await new Promise(resolve => setImmediate(resolve)); const api = express(); api.get("/api/health", (req, res) => res.json({ path: req.originalUrl })); return api; });
  assert.equal(starts, 0);
  const replies = await Promise.all([request(app).get("/api/health"), request(app).get("/api/health")]);
  assert.equal(starts, 1);
  for (const reply of replies) { assert.equal(reply.status, 200); assert.equal(reply.body.path, "/api/health"); }
});
test("failed Vercel initialization returns a safe error and retries on the next request", async () => {
  let starts = 0;
  const app = createVercelApp(async () => { if (++starts === 1) throw new Error("private-database-credentials"); const api = express(); api.get("/api/health", (_req, res) => res.json({ ok: true })); return api; });
  const failed = await request(app).get("/api/health").expect(503);
  assert.equal(failed.body.error.code, "SERVICE_UNAVAILABLE"); assert.ok(!JSON.stringify(failed.body).includes("private-database-credentials"));
  await request(app).get("/api/health").expect(200); assert.equal(starts, 2);
});

test("invalid environment is reported separately without exposing configuration values", async () => {
  const app = createVercelApp(async () => { throw new Error("Invalid environment configuration: SESSION_SECRET"); });
  const reply = await request(app).get("/api/health").expect(503);
  assert.equal(reply.body.error.code, "SERVER_CONFIGURATION_ERROR");
  assert.ok(!JSON.stringify(reply.body).includes("SESSION_SECRET"));
});
