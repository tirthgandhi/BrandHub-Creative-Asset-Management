import "dotenv/config";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import request from "supertest";
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";
import { ProjectRequest } from "../src/models/ProjectRequest.js";
import { Asset } from "../src/models/Asset.js";
import { AssetRevision } from "../src/models/AssetRevision.js";
import { ReviewEvent } from "../src/models/ReviewEvent.js";
import { hashPassword } from "../src/utils/password.js";
import { mediaBucket } from "../src/services/gridfsMedia.js";

// Explicit prototype seed: operates only on the existing demo database.
try {
  const uri = new URL(process.env.MONGODB_URI);
  assert.equal(uri.pathname, "/brandhub_demo");
  process.env.ASSET_STORAGE = "gridfs";
  process.env.COOKIE_SECURE = "false";
  await connectDatabase(uri.toString());
  const passwordHash = await hashPassword("Brand123");
  await User.updateMany({ demoKey: /^brandhub:/ }, { $set: { passwordHash, mustChangePassword: false } });
  const admin = await User.findOne({ email: "admin@brandhub.example" });
  const client = await User.findOne({ email: "iris.vale@brandhub.example" });
  const designer = await User.findOne({ email: "nisha.verma@brandhub.example" });
  assert.ok(admin && client && designer, "Run seed:brandhub first");
  const app = createApp({ authRateLimit: 1000 });
  async function actor(user) { const agent = request.agent(app); const login = await agent.post("/api/auth/login").send({ email: user.email, password: "Brand123" }).expect(200); return { agent, csrf: login.body.data.csrfToken }; }
  const a = await actor(admin), c = await actor(client), d = await actor(designer);
  const title = "GlowTheory • Skincare launch prototype";
  if (await ProjectRequest.exists({ clientId: client._id, title, status: "approved" })) { console.log("Prototype workflow already exists; accounts refreshed. Use a new brief in the UI to repeat."); }
  else {
    const brief = await c.agent.post("/api/project-requests").set("X-CSRF-Token", c.csrf).send({ title, description: "Create a skincare launch visual. Use warm neutral tones, highlight the serum bottle, and deliver a revised campaign image after client feedback.", category: "Social Media" }).expect(201);
    const accepted = await a.agent.patch(`/api/project-requests/${brief.body.data.projectRequest.id}`).set("X-CSRF-Token", a.csrf).send({ decision: "approve", designerIds: [designer.id], note: "Brief accepted. Nisha will create the launch visual." }).expect(200);
    const projectId = accepted.body.data.project.id;
    const manifest = JSON.parse(await fs.readFile("../client/public/demo-media-manifest.json"));
    const photo = manifest.assets.find(item => item.originalFilename === "pexels-alesiakozik-7796455.jpg");
    const revised = manifest.assets.find(item => item.originalFilename === "pexels-sueda-gln-327513956-28255124.jpg");
    const upload = await d.agent.post("/api/assets").set("X-CSRF-Token", d.csrf).field("projectId", projectId).field("title", "Skincare launch visual").field("category", "Social Media").attach("file", `../client/public${photo.localUrl}`).expect(201);
    const id = upload.body.data.asset.id;
    await d.agent.post(`/api/assets/${id}/submit`).set("X-CSRF-Token", d.csrf).send({ expectedVersion: 1 }).expect(200);
    await c.agent.patch(`/api/assets/${id}/review`).set("X-CSRF-Token", c.csrf).send({ decision: "request_changes", expectedVersion: 1, note: "Please use a brighter citrus composition and make the bottle more prominent." }).expect(200);
    await c.agent.post(`/api/assets/${id}/comments`).set("X-CSRF-Token", c.csrf).send({ content: "Use the citrus direction for version two.", version: 1 }).expect(201);
    await d.agent.post(`/api/assets/${id}/revisions`).set("X-CSRF-Token", d.csrf).field("expectedVersion", "1").field("note", "Updated to a brighter citrus composition.").attach("file", `../client/public${revised.localUrl}`).expect(201);
    await d.agent.post(`/api/assets/${id}/submit`).set("X-CSRF-Token", d.csrf).send({ expectedVersion: 2 }).expect(200);
    await c.agent.patch(`/api/assets/${id}/review`).set("X-CSRF-Token", c.csrf).send({ decision: "approve", expectedVersion: 2, note: "Approved. The revised visual is ready." }).expect(200);
    await c.agent.post(`/api/assets/${id}/bookmark`).set("X-CSRF-Token", c.csrf).expect(201);
    const asset = await Asset.findById(id).select("+currentFile");
    assert.equal(asset.status, "approved"); assert.equal(asset.currentVersion, 2);
    assert.equal(await AssetRevision.countDocuments({ assetId: id }), 2);
    assert.equal(await ReviewEvent.countDocuments({ assetId: id }), 5);
    assert.ok(await mediaBucket().find({ _id: new mongoose.Types.ObjectId(asset.currentFile.publicId.slice(7)) }).hasNext());
    const file = await c.agent.get(`/api/assets/${id}/file`).expect(200);
    await c.agent.get(file.body.data.url).expect(200).expect("Content-Type", /image/);
    const outsider = await actor(await User.findOne({ email: "mira.solis@brandhub.example" }));
    await outsider.agent.get(`/api/projects/${projectId}`).expect(404);
    await outsider.agent.get(file.body.data.url).expect(404);
    assert.equal((await a.agent.get(`/api/assets/${id}/history`).expect(200)).body.data.length, 5);
    console.log(JSON.stringify({ verified: true, database: mongoose.connection.name, projectId, assetId: id, status: asset.status, revisions: 2, reviewEvents: 5, storage: "MongoDB GridFS", clientIsolation: true, adminVisibility: true }, null, 2));
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await disconnectDatabase(); }
