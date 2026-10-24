import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";
import { readEnv } from "../src/config/env.js";

test("GET /api/health returns a safe health response", async () => {
  const response = await request(createApp()).get("/api/health").expect(200);
  assert.deepEqual(response.body, { data: { status: "ok", database: "disconnected" } });
  assert.equal(response.headers["x-powered-by"], undefined);
});

test("unknown routes use the shared error shape", async () => {
  const response = await request(createApp()).get("/api/missing").expect(404);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error.code, "NOT_FOUND");
  assert.deepEqual(response.body.error.details, []);
});

test("CORS permits the configured client and credentials", async () => {
  const response = await request(createApp({ clientUrl: "https://brandhub.example" })).options("/api/health").set("Origin", "https://brandhub.example").set("Access-Control-Request-Method", "GET").expect(204);
  assert.equal(response.headers["access-control-allow-origin"], "https://brandhub.example");
  assert.equal(response.headers["access-control-allow-credentials"], "true");
});

test("environment validation rejects a missing MongoDB URI", () => {
  assert.throws(() => readEnv({ NODE_ENV: "test", CLIENT_URL: "http://localhost:5173" }), /MONGODB_URI/);
});
