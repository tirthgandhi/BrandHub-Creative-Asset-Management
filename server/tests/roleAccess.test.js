import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import sharp from "sharp";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Project } from "../src/models/Project.js";
import { Asset } from "../src/models/Asset.js";
import { hashPassword } from "../src/utils/password.js";
let mongo, app, users;
const roles = ["project_manager", "client", "designer"];
before(async () => {
  mongo = await MongoMemoryServer.create({ binary: { version: "7.0.14" } });
  await connectDatabase(mongo.getUri());
  app = createApp({ authRateLimit: 1000 });
  const passwordHash = await hashPassword("Brand123");
  users = Object.fromEntries(await Promise.all(roles.map(async role => [role, await User.create({ name: `Test ${role}`, email: `${role}@roles.test`, passwordHash, role })])));
});
after(async () => { await disconnectDatabase(); await mongo?.stop(); });
async function actor(role) { const agent = request.agent(app); const response = await agent.post("/api/auth/login").send({ email: users[role].email, password: "Brand123", role }).expect(200); return { agent, csrf: response.body.data.csrfToken }; }

test("all six mismatched login role combinations reject without establishing a session", async () => {
  for (const actual of roles) for (const selected of roles.filter(role => role !== actual)) {
    const agent = request.agent(app);
    const denied = await agent.post("/api/auth/login").send({ email: users[actual].email, password: "Brand123", role: selected }).expect(403);
    assert.equal(denied.body.error.code, "ROLE_MISMATCH");
    await agent.get("/api/auth/me").expect(401);
  }
  await request(app).post("/api/auth/login").send({ email: users.project_manager.email, password: "Brand123", role: "owner" }).expect(422);
});
test("anonymous API routes reject requests for every protected resource family", async () => {
  for (const path of ["/auth/me", "/users", "/projects", "/project-requests", "/assets", "/media", "/media/usage", "/bookmarks", "/dashboard/stats"]) await request(app).get(`/api${path}`).expect(401);
});
test("role matrix blocks privileged actions and permits appropriate read endpoints", async () => {
  for (const role of roles) {
    const { agent, csrf } = await actor(role);
    for (const path of ["/projects", "/assets", "/media", "/bookmarks", "/dashboard/stats"]) await agent.get(`/api${path}`).expect(200);
    await agent.get("/api/users").expect(role === "project_manager" ? 200 : 403);
    await agent.get("/api/media/usage").expect(role === "project_manager" ? 200 : 403);
    await agent.get("/api/project-requests").expect(role === "designer" ? 403 : 200);
    if (role !== "project_manager") {
      await agent.post("/api/projects").set("X-CSRF-Token", csrf).send({}).expect(403);
      await agent.post("/api/users").set("X-CSRF-Token", csrf).send({}).expect(403);
    }
    if (role !== "client") await agent.post("/api/project-requests").set("X-CSRF-Token", csrf).send({}).expect(403);
    if (role === "client") {
      await agent.post("/api/media/upload").set("X-CSRF-Token", csrf).expect(403);
      await agent.patch("/api/media/000000000000000000000000").set("X-CSRF-Token", csrf).send({}).expect(403);
      await agent.delete("/api/media/000000000000000000000000").set("X-CSRF-Token", csrf).expect(403);
    }
  }
});
test("GridFS review lifecycle preserves bytes, client isolation, revision history and admin visibility", async () => {
  process.env.ASSET_STORAGE = "gridfs";
  try {
    const a = await actor("project_manager"), c = await actor("client"), d = await actor("designer");
    const brief = await c.agent.post("/api/project-requests").set("X-CSRF-Token", c.csrf).send({ title: "Role audit campaign", description: "Design a campaign image and revise it after feedback.", category: "Social Media" }).expect(201);
    const approval = await a.agent.patch(`/api/project-requests/${brief.body.data.projectRequest.id}`).set("X-CSRF-Token", a.csrf).send({ decision: "approve", designerIds: [users.designer.id] }).expect(200);
    const projectId = approval.body.data.project.id;
    const image = await sharp({ create: { width: 24, height: 24, channels: 3, background: "#456" } }).png().toBuffer();
    const upload = await d.agent.post("/api/assets").set("X-CSRF-Token", d.csrf).field("projectId", projectId).field("title", "Audit design").field("category", "Social Media").attach("file", image, "audit.png").expect(201);
    const id = upload.body.data.asset.id;
    await c.agent.get(`/api/assets/${id}`).expect(404); // Draft stays private to the team.
    await d.agent.post(`/api/assets/${id}/submit`).set("X-CSRF-Token", d.csrf).send({ expectedVersion: 1 }).expect(200);
    await c.agent.patch(`/api/assets/${id}/review`).set("X-CSRF-Token", c.csrf).send({ decision: "request_changes", expectedVersion: 1, note: "Please update the background." }).expect(200);
    await d.agent.post(`/api/assets/${id}/revisions`).set("X-CSRF-Token", d.csrf).field("expectedVersion", "1").attach("file", image, "revision.png").expect(201);
    await d.agent.post(`/api/assets/${id}/submit`).set("X-CSRF-Token", d.csrf).send({ expectedVersion: 2 }).expect(200);
    await c.agent.patch(`/api/assets/${id}/review`).set("X-CSRF-Token", c.csrf).send({ decision: "approve", expectedVersion: 2 }).expect(200);
    const file = (await c.agent.get(`/api/assets/${id}/file`).expect(200)).body.data.url;
    const download = await c.agent.get(file).expect(200);
    assert.deepEqual(download.body, image);
    assert.equal((await a.agent.get(`/api/assets/${id}/history`).expect(200)).body.data.length, 5);
    assert.equal((await a.agent.get(`/api/assets/${id}/revisions`).expect(200)).body.data.length, 2);
    assert.equal((await Asset.findById(id)).status, "approved");
    const outsider = request.agent(app);
    await outsider.post("/api/auth/register").send({ name: "Other Client", email: "other@roles.test", password: "Brand123" }).expect(201);
    await Project.updateOne({ _id: projectId }, { $set: { visibility: "public" } });
    await outsider.get(`/api/projects/${projectId}`).expect(404);
    await outsider.get(file).expect(404);
    await request(app).get(file).expect(401);
    await c.agent.post(`/api/assets/${id}/submit`).set("X-CSRF-Token", c.csrf).send({ expectedVersion: 2 }).expect(403);
  } finally { delete process.env.ASSET_STORAGE; }
});
