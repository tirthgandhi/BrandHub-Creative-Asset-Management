import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import request from "supertest";
import sharp from "sharp";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Project } from "../src/models/Project.js";
import { MediaAsset } from "../src/models/MediaAsset.js";
import { hashPassword } from "../src/utils/password.js";
import { mediaStorageUsage } from "../src/services/gridfsMedia.js";

let mongo; let app; let project; let designer; let client; let outsider; let dbPath;
before(async () => {
  const testRoot = path.resolve("..", ".tmp");
  await fs.mkdir(testRoot, { recursive: true });
  dbPath = await fs.mkdtemp(path.join(testRoot, "gridfs-test-"));
  mongo = await MongoMemoryServer.create({ binary: { version: "7.0.14" }, instance: { dbPath } });
  await connectDatabase(mongo.getUri());
  app = createApp({ authRateLimit: 1000, sessionSecret: "gridfs-integration-secret-32-chars" });
  const passwordHash = await hashPassword("Password123");
  [designer, client, outsider] = await User.create([
    { name: "Designer", email: "designer@media.test", passwordHash, role: "designer" },
    { name: "Client", email: "client@media.test", passwordHash, role: "client" },
    { name: "Outsider", email: "outsider@media.test", passwordHash, role: "client" },
  ]);
  project = await Project.create({ title: "Media campaign", description: "Media campaign project", category: "Social Media", clientId: client._id, designerIds: [designer._id], createdBy: designer._id });
});
after(async () => { await disconnectDatabase(); await mongo?.stop(); if (dbPath) await fs.rm(dbPath, { recursive: true, force: true }); });
async function actor(email) {
  const agent = request.agent(app);
  const login = await agent.post("/api/auth/login").send({ email, password: "Password123" }).expect(200);
  return { agent, csrf: login.body.data.csrfToken };
}

test("GridFS upload persists bytes, enforces project access, serves ranges and cleans up", async () => {
  const maker = await actor(designer.email);
  const owner = await actor(client.email);
  const stranger = await actor(outsider.email);
  const image = await sharp({ create: { width: 12, height: 12, channels: 3, background: "#369" } }).png().toBuffer();
  const path = `/api/media/upload?projectId=${project.id}`;
  await stranger.agent.post(path).set("X-CSRF-Token", stranger.csrf).set("X-Upload-Size", String(image.length)).attach("file", image, { filename: "post.png", contentType: "image/png" }).expect(404);
  const response = await maker.agent.post(path).set("X-CSRF-Token", maker.csrf).set("X-Upload-Size", String(image.length)).field("title", "Launch post").field("category", "fashion").field("contentType", "post").attach("file", image, { filename: "post.png", contentType: "image/png" });
  assert.equal(response.status, 201, JSON.stringify(response.body));
  const media = response.body.data.media;
  assert.equal(media.storageType, "gridfs");
  assert.equal((await MediaAsset.findById(media.id)).fileSize, image.length);
  assert.equal((await mediaStorageUsage()).usedBytes, image.length);
  await stranger.agent.get(media.url).expect(404);
  const full = await owner.agent.get(media.url).expect(200);
  assert.deepEqual(full.body, image);
  const partial = await owner.agent.get(media.url).set("Range", "bytes=0-3").expect(206);
  assert.deepEqual(partial.body, image.subarray(0, 4));
  assert.equal(partial.headers["content-range"], `bytes 0-3/${image.length}`);
  await owner.agent.get(media.url).set("Range", `bytes=${image.length}-`).expect(416);
  await maker.agent.delete(`/api/media/${media.id}`).set("X-CSRF-Token", maker.csrf).expect(204);
  assert.equal(await MediaAsset.countDocuments({ _id: media.id }), 0);
  assert.equal((await mediaStorageUsage()).usedBytes, 0);
});

test("invalid content and oversized declarations leave no media or reservations", async () => {
  const maker = await actor(designer.email);
  const path = `/api/media/upload?projectId=${project.id}`;
  const bad = Buffer.from("not actually a png");
  await maker.agent.post(path).set("X-CSRF-Token", maker.csrf).set("X-Upload-Size", String(bad.length)).attach("file", bad, { filename: "fake.png", contentType: "image/png" }).expect(415);
  await maker.agent.post(path).set("X-CSRF-Token", maker.csrf).set("X-Upload-Size", String(bad.length)).attach("file", bad, { filename: "fake.txt", contentType: "text/plain" }).expect(415);
  assert.equal(await MediaAsset.countDocuments(), 0);
  assert.equal((await mediaStorageUsage()).reservedBytes, 0);
  await maker.agent.post(path).set("X-CSRF-Token", maker.csrf).set("X-Upload-Size", String(21 * 1024 * 1024)).attach("file", bad, { filename: "fake.mp4", contentType: "video/mp4" }).expect(413);
});
