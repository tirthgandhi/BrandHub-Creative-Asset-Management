import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { Writable } from "node:stream";
import request from "supertest";
import sharp from "sharp";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { cloudinary } from "../src/config/cloudinary.js";
import { User } from "../src/models/User.js";
import { Project } from "../src/models/Project.js";
import { Asset } from "../src/models/Asset.js";
import { AssetRevision } from "../src/models/AssetRevision.js";
import { hashPassword } from "../src/utils/password.js";

let mongo; let app; let admin; let designer; let client; let outsider; let project; let deleted = 0;
const originalUpload = cloudinary.uploader.upload_stream;
const originalDestroy = cloudinary.uploader.destroy;
const originalKey = process.env.CLOUDINARY_AUTH_TOKEN_KEY;

before(async () => {
  mongo = await MongoMemoryServer.create({ binary: { version: "7.0.14" } });
  await connectDatabase(mongo.getUri());
  cloudinary.config({ cloud_name: "example", api_key: "test", api_secret: "test-secret", secure: true });
  process.env.CLOUDINARY_AUTH_TOKEN_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  cloudinary.uploader.upload_stream = (options, callback) => {
    let bytes = 0;
    return new Writable({ write(chunk, _encoding, done) { bytes += chunk.length; done(); }, final(done) { callback(null, { public_id: options.public_id, version: 1, bytes, width: 8, height: 8 }); done(); } });
  };
  cloudinary.uploader.destroy = async () => { deleted++; return { result: "ok" }; };
  app = createApp({ authRateLimit: 1000, sessionSecret: "phase-four-integration-secret-32-chars" });
  const passwordHash = await hashPassword("Password123");
  [admin, designer, client, outsider] = await User.create([
    { name: "Admin", email: "admin@assets.test", passwordHash, role: "admin" },
    { name: "Designer", email: "designer@assets.test", passwordHash, role: "designer" },
    { name: "Client", email: "client@assets.test", passwordHash, role: "client" },
    { name: "Outsider", email: "outsider@assets.test", passwordHash, role: "client" },
  ]);
  project = await Project.create({ title: "Campaign launch", description: "A complete launch project", category: "Social Media", clientId: client._id, designerIds: [designer._id], createdBy: admin._id });
});
after(async () => { cloudinary.uploader.upload_stream = originalUpload; cloudinary.uploader.destroy = originalDestroy; if (originalKey === undefined) delete process.env.CLOUDINARY_AUTH_TOKEN_KEY; else process.env.CLOUDINARY_AUTH_TOKEN_KEY = originalKey; await disconnectDatabase(); await mongo?.stop(); });
async function actor(email) { const agent = request.agent(app); const login = await agent.post("/api/auth/login").send({ email, password: "Password123" }).expect(200); return { agent, csrf: login.body.data.csrfToken }; }

test("upload stores Draft and Revision 1; scoped gallery and deletion enforce roles", async () => {
  const maker = await actor(designer.email); const owner = await actor(client.email); const other = await actor(outsider.email);
  const image = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#369" } }).png().toBuffer();
  const uploaded = await maker.agent.post("/api/assets").set("X-CSRF-Token", maker.csrf).field("projectId", project.id).field("title", "Launch post").field("category", "Social Media").field("uploadKey", "9fa7f16c-7cd1-454a-955a-a139b5357bcd").attach("file", image, { filename: "post.png", contentType: "image/png" });
  assert.equal(uploaded.status, 201, JSON.stringify(uploaded.body));
  const id = uploaded.body.data.asset.id;
  assert.equal(uploaded.body.data.asset.status, "draft");
  assert.equal(await AssetRevision.countDocuments({ assetId: id, version: 1 }), 1);
  assert.equal((await maker.agent.get("/api/assets").expect(200)).body.data.length, 1);
  assert.equal((await owner.agent.get("/api/assets").expect(200)).body.data.length, 0);
  await owner.agent.get(`/api/assets/${id}`).expect(404);
  await other.agent.get(`/api/assets/${id}/file`).expect(404);
  await maker.agent.post("/api/assets").set("X-CSRF-Token", maker.csrf).field("projectId", project.id).field("title", "Invalid bytes").field("category", "Social Media").attach("file", Buffer.from("not an image"), { filename: "fake.png", contentType: "image/png" }).expect(415);
  project.visibility = "public"; await project.save();
  assert.equal((await other.agent.get("/api/assets").expect(200)).body.data.length, 0);
  await Asset.updateOne({ _id: id }, { $set: { status: "approved" } }); // Authorization fixture; the review transition belongs to Phase 5.
  assert.equal((await other.agent.get("/api/assets").expect(200)).body.data.length, 1);
  project.visibility = "private"; await project.save();
  await other.agent.get(`/api/assets/${id}`).expect(404);
  await Asset.updateOne({ _id: id }, { $set: { status: "draft" } });
  const duplicate = await maker.agent.post("/api/assets").set("X-CSRF-Token", maker.csrf).field("projectId", project.id).field("title", "Launch post").field("category", "Social Media").field("uploadKey", "9fa7f16c-7cd1-454a-955a-a139b5357bcd").attach("file", image, { filename: "post.png", contentType: "image/png" });
  assert.equal(duplicate.body.data.asset.id, id);
  project.status = "archived"; await project.save();
  await maker.agent.post("/api/assets").set("X-CSRF-Token", maker.csrf).field("projectId", project.id).field("title", "Another post").field("category", "Social Media").attach("file", image, { filename: "post.png", contentType: "image/png" }).expect(404);
  await maker.agent.delete(`/api/assets/${id}`).set("X-CSRF-Token", maker.csrf).expect(204);
  assert.equal(await Asset.countDocuments({ _id: id }), 0);
  assert.equal(await AssetRevision.countDocuments({ assetId: id }), 0);
  assert.equal(deleted, 1);
});

test("Client request, Admin approval, Designer upload, and reload use persisted records", async () => {
  const clientActor = await actor(client.email); const adminActor = await actor(admin.email); const designerActor = await actor(designer.email);
  const brief = await clientActor.agent.post("/api/project-requests").set("X-CSRF-Token", clientActor.csrf).send({ title: "New brand kit", description: "Create a new visual brand kit", category: "Brand Identity" }).expect(201);
  const approved = await adminActor.agent.patch(`/api/project-requests/${brief.body.data.projectRequest.id}`).set("X-CSRF-Token", adminActor.csrf).send({ decision: "approve", designerIds: [designer.id] }).expect(200);
  const projectId = approved.body.data.project.id;
  const image = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#934" } }).png().toBuffer();
  const upload = await designerActor.agent.post("/api/assets").set("X-CSRF-Token", designerActor.csrf).field("projectId", projectId).field("title", "Brand mark").field("category", "Logo").attach("file", image, { filename: "mark.png", contentType: "image/png" }).expect(201);
  assert.equal(upload.body.data.asset.currentVersion, 1);
  assert.equal((await adminActor.agent.get(`/api/projects/${projectId}`).expect(200)).body.data.project.assetCount, 1);
  assert.equal((await clientActor.agent.get("/api/assets").expect(200)).body.data.length, 0);
  app = createApp({ authRateLimit: 1000, sessionSecret: "phase-four-reloaded-secret-32-chars" });
  const freshDesigner = await actor(designer.email);
  assert.equal((await freshDesigner.agent.get(`/api/assets/${upload.body.data.asset.id}`).expect(200)).body.data.asset.title, "Brand mark");
});

test("Designer submission and Client review persist one ordered event per transition", async () => {
  const maker = await actor(designer.email);
  const owner = await actor(client.email);
  const reviewProject = await Project.create({ title: "Review flow", description: "Review integration project", category: "Social Media", clientId: client._id, designerIds: [designer._id], createdBy: admin._id });
  const image = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#946" } }).png().toBuffer();
  const upload = await maker.agent.post("/api/assets").set("X-CSRF-Token", maker.csrf).field("projectId", reviewProject.id).field("title", "Review post").field("category", "Social Media").attach("file", image, { filename: "review.png", contentType: "image/png" }).expect(201);
  const assetId = upload.body.data.asset.id;
  const submitted = await maker.agent.post(`/api/assets/${assetId}/submit`).set("X-CSRF-Token", maker.csrf).send({ expectedVersion: 1 });
  assert.equal(submitted.status, 200, JSON.stringify(submitted.body));
  assert.equal(submitted.body.data.asset.status, "in_review");
  await maker.agent.post(`/api/assets/${assetId}/submit`).set("X-CSRF-Token", maker.csrf).send({ expectedVersion: 1 }).expect(409);
  await maker.agent.patch(`/api/assets/${assetId}/review`).set("X-CSRF-Token", maker.csrf).send({ decision: "approve", expectedVersion: 1 }).expect(403);
  const unrelated = await actor(outsider.email);
  await unrelated.agent.patch(`/api/assets/${assetId}/review`).set("X-CSRF-Token", unrelated.csrf).send({ decision: "approve", expectedVersion: 1 }).expect(404);
  const reviewed = await owner.agent.patch(`/api/assets/${assetId}/review`).set("X-CSRF-Token", owner.csrf).send({ decision: "request_changes", expectedVersion: 1, note: "Please increase the contrast." });
  assert.equal(reviewed.status, 200, JSON.stringify(reviewed.body));
  assert.equal(reviewed.body.data.asset.status, "changes_requested");
  const history = await owner.agent.get(`/api/assets/${assetId}/history`).expect(200);
  assert.deepEqual(history.body.data.map((item) => item.action).sort(), ["request_changes", "submit"]);
  const comment = await owner.agent.post(`/api/assets/${assetId}/comments`).set("X-CSRF-Token", owner.csrf).send({ content: "Keep the product visible.", version: 1 }).expect(201);
  assert.equal((await maker.agent.get(`/api/assets/${assetId}/comments`).expect(200)).body.data[0].content, "Keep the product visible.");
  await maker.agent.delete(`/api/comments/${comment.body.data.comment.id}`).set("X-CSRF-Token", maker.csrf).expect(404);
  await owner.agent.delete(`/api/comments/${comment.body.data.comment.id}`).set("X-CSRF-Token", owner.csrf).expect(204);
  await owner.agent.post(`/api/assets/${assetId}/bookmark`).set("X-CSRF-Token", owner.csrf).expect(201);
  assert.equal((await owner.agent.get("/api/bookmarks").expect(200)).body.data[0].asset.id, assetId);
  await owner.agent.delete(`/api/assets/${assetId}/bookmark`).set("X-CSRF-Token", owner.csrf).expect(204);
  const revised = await maker.agent.post(`/api/assets/${assetId}/revisions`).set("X-CSRF-Token", maker.csrf).field("expectedVersion", "1").field("note", "Adjusted contrast").attach("file", image, { filename: "review-v2.png", contentType: "image/png" });
  assert.equal(revised.status, 201, JSON.stringify(revised.body));
  assert.equal(revised.body.data.asset.currentVersion, 2);
  await maker.agent.post(`/api/assets/${assetId}/submit`).set("X-CSRF-Token", maker.csrf).send({ expectedVersion: 2 }).expect(200);
  await owner.agent.patch(`/api/assets/${assetId}/review`).set("X-CSRF-Token", owner.csrf).send({ decision: "approve", expectedVersion: 2 }).expect(200);
  assert.equal((await owner.agent.get(`/api/assets/${assetId}/history`).expect(200)).body.data.length, 5);
  assert.equal((await owner.agent.get(`/api/assets/${assetId}/revisions`).expect(200)).body.data.length, 2);
});

test("dashboard counts follow each role's real project and asset scope", async () => {
  const adminActor = await actor(admin.email);
  const designerActor = await actor(designer.email);
  const clientActor = await actor(client.email);
  const outsiderActor = await actor(outsider.email);
  const adminStats = (await adminActor.agent.get("/api/dashboard/stats").expect(200)).body.data;
  const designerStats = (await designerActor.agent.get("/api/dashboard/stats").expect(200)).body.data;
  const clientStats = (await clientActor.agent.get("/api/dashboard/stats").expect(200)).body.data;
  const outsiderStats = (await outsiderActor.agent.get("/api/dashboard/stats").expect(200)).body.data;
  assert.equal(adminStats.metrics.activeUsers, 4);
  assert.ok(adminStats.metrics.projects >= designerStats.metrics.projects);
  assert.equal(clientStats.metrics.assets.draft, 0);
  assert.equal(outsiderStats.metrics.projects, 0);
  assert.equal(outsiderStats.metrics.assets.approved, 0);
  assert.equal(outsiderStats.recentActivity.length, 0);
});

test("concurrent reviewers cannot both approve the same version", async () => {
  const maker = await actor(designer.email);
  const owner = await actor(client.email);
  const administrator = await actor(admin.email);
  const reviewProject = await Project.create({ title: "Concurrent review", description: "Concurrent review project", category: "Social Media", clientId: client._id, designerIds: [designer._id], createdBy: admin._id });
  const image = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#479" } }).png().toBuffer();
  const uploaded = await maker.agent.post("/api/assets").set("X-CSRF-Token", maker.csrf).field("projectId", reviewProject.id).field("title", "Concurrent asset").field("category", "Social Media").attach("file", image, { filename: "race.png", contentType: "image/png" }).expect(201);
  const id = uploaded.body.data.asset.id;
  await maker.agent.post(`/api/assets/${id}/submit`).set("X-CSRF-Token", maker.csrf).send({ expectedVersion: 1 }).expect(200);
  const [first, second] = await Promise.all([
    owner.agent.patch(`/api/assets/${id}/review`).set("X-CSRF-Token", owner.csrf).send({ decision: "approve", expectedVersion: 1 }),
    administrator.agent.patch(`/api/assets/${id}/review`).set("X-CSRF-Token", administrator.csrf).send({ decision: "approve", expectedVersion: 1 }),
  ]);
  assert.deepEqual([first.status, second.status].sort(), [200, 409]);
  const history = await administrator.agent.get(`/api/assets/${id}/history`).expect(200);
  assert.equal(history.body.data.filter((event) => event.action === "approve").length, 1);
});
