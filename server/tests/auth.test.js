import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { hashPassword } from "../src/utils/password.js";

let mongo;
let app;

before(async () => {
  mongo = await MongoMemoryServer.create({ binary: { version: "7.0.14" } });
  await connectDatabase(mongo.getUri());
  app = createApp({ authRateLimit: 1000, sessionSecret: "integration-test-session-secret-32-characters" });
});
beforeEach(async () => User.deleteMany({}));
after(async () => { await disconnectDatabase(); await mongo?.stop(); });

async function createAdmin(overrides = {}) {
  return User.create({ name: "Admin User", email: "admin@brandhub.test", passwordHash: await hashPassword("AdminPass123"), role: "admin", ...overrides });
}
async function login(agent, email, password) {
  return agent.post("/api/auth/login").send({ email, password });
}

test("public registration forces client role and never exposes passwordHash", async () => {
  const agent = request.agent(app);
  const response = await agent.post("/api/auth/register").send({ name: "Test User", email: "test@example.com", password: "TestPassword123", role: "admin" }).expect(201);
  assert.equal(response.body.data.user.role, "client");
  assert.equal("passwordHash" in response.body.data.user, false);
  assert.equal((await User.findOne({ email: "test@example.com" })).role, "client");
  await agent.get("/api/auth/me").expect(200);
});

test("registration rejects duplicate, malformed email, and weak password", async () => {
  await request(app).post("/api/auth/register").send({ name: "Valid User", email: "valid@example.com", password: "ValidPass123" }).expect(201);
  const duplicate = await request(app).post("/api/auth/register").send({ name: "Other User", email: "VALID@example.com", password: "ValidPass123" }).expect(409);
  assert.equal(duplicate.body.error.code, "CONFLICT");
  await request(app).post("/api/auth/register").send({ name: "Bad Email", email: "invalid", password: "ValidPass123" }).expect(422);
  await request(app).post("/api/auth/register").send({ name: "Weak Pass", email: "weak@example.com", password: "password" }).expect(422);
});

test("login accepts valid credentials and rejects invalid or inactive users", async () => {
  const admin = await createAdmin();
  const valid = await login(request.agent(app), admin.email, "AdminPass123");
  assert.equal(valid.status, 200);
  assert.equal(valid.body.data.user.role, "admin");
  await login(request.agent(app), admin.email, "wrong-password").then((response) => assert.equal(response.status, 401));
  admin.isActive = false; await admin.save();
  await login(request.agent(app), admin.email, "AdminPass123").then((response) => assert.equal(response.status, 401));
});

test("logout invalidates the session and requires CSRF", async () => {
  await createAdmin();
  const agent = request.agent(app);
  const auth = await login(agent, "admin@brandhub.test", "AdminPass123");
  await agent.post("/api/auth/logout").expect(403);
  await agent.post("/api/auth/logout").set("X-CSRF-Token", auth.body.data.csrfToken).expect(204);
  await agent.get("/api/auth/me").expect(401);
});

test("protected and Admin-only user endpoints enforce authorization", async () => {
  await request(app).get("/api/users").expect(401);
  const client = request.agent(app);
  await client.post("/api/auth/register").send({ name: "Client User", email: "client@example.com", password: "ClientPass123" }).expect(201);
  await client.get("/api/users").expect(403);
});

test("Admin creates Designer who must change password before normal access", async () => {
  await createAdmin();
  const admin = request.agent(app);
  const adminAuth = await login(admin, "admin@brandhub.test", "AdminPass123");
  const created = await admin.post("/api/users").set("X-CSRF-Token", adminAuth.body.data.csrfToken).send({ name: "Designer User", email: "designer@example.com", role: "designer", initialPassword: "Designer123" }).expect(201);
  assert.equal(created.body.data.user.mustChangePassword, true);
  const designer = request.agent(app);
  const designerAuth = await login(designer, "designer@example.com", "Designer123");
  await designer.get(`/api/users/${created.body.data.user.id}`).expect(403).then((response) => assert.equal(response.body.error.code, "PASSWORD_CHANGE_REQUIRED"));
  const changed = await designer.patch("/api/auth/change-password").set("X-CSRF-Token", designerAuth.body.data.csrfToken).send({ currentPassword: "Designer123", newPassword: "NewDesigner456" }).expect(200);
  assert.equal(changed.body.data.user.mustChangePassword, false);
  await login(request.agent(app), "designer@example.com", "NewDesigner456").then((response) => assert.equal(response.status, 200));
});

test("ordinary users cannot promote themselves", async () => {
  const agent = request.agent(app);
  const registration = await agent.post("/api/auth/register").send({ name: "Client User", email: "client@example.com", password: "ClientPass123" }).expect(201);
  await agent.patch(`/api/users/${registration.body.data.user.id}`).set("X-CSRF-Token", registration.body.data.csrfToken).send({ role: "admin" }).expect(403);
  assert.equal((await User.findById(registration.body.data.user.id)).role, "client");
});

test("the last active Admin cannot be deactivated or demoted", async () => {
  const adminUser = await createAdmin();
  const agent = request.agent(app);
  const auth = await login(agent, adminUser.email, "AdminPass123");
  const response = await agent.patch(`/api/users/${adminUser.id}`).set("X-CSRF-Token", auth.body.data.csrfToken).send({ isActive: false }).expect(409);
  assert.equal(response.body.error.code, "CONFLICT");
  assert.equal((await User.findById(adminUser.id)).isActive, true);
});

test("deactivation blocks an existing authenticated session", async () => {
  const agent = request.agent(app);
  const registration = await agent.post("/api/auth/register").send({ name: "Client User", email: "client@example.com", password: "ClientPass123" }).expect(201);
  await User.updateOne({ _id: registration.body.data.user.id }, { $set: { isActive: false }, $inc: { authVersion: 1 } });
  await agent.get("/api/auth/me").expect(401);
});

test("login and registration rate limiting returns the shared error", async () => {
  const limitedApp = createApp({ authRateLimit: 2, sessionSecret: "rate-limit-test-secret-at-least-32-chars" });
  await request(limitedApp).post("/api/auth/register").send({ name: "One User", email: "one@example.com", password: "Password123" }).expect(201);
  await request(limitedApp).post("/api/auth/register").send({ name: "Two User", email: "two@example.com", password: "Password123" }).expect(201);
  const response = await request(limitedApp).post("/api/auth/register").send({ name: "Three User", email: "three@example.com", password: "Password123" }).expect(429);
  assert.equal(response.body.error.code, "RATE_LIMITED");
});
