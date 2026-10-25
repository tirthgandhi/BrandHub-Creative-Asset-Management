import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Project } from "../src/models/Project.js";
import { ProjectRequest } from "../src/models/ProjectRequest.js";
import { Asset } from "../src/models/Asset.js";
import { buildAssetScope } from "../src/services/assetAccess.js";
import { hashPassword } from "../src/utils/password.js";

let mongo; let app; let admin; let clientA; let clientB; let designer;
before(async () => { mongo = await MongoMemoryServer.create({ binary: { version: "7.0.14" } }); await connectDatabase(mongo.getUri()); app = createApp({ authRateLimit: 1000, sessionSecret: "phase-three-integration-secret-32-chars" }); await Promise.all([Project.init(), ProjectRequest.init()]); });
after(async () => { await disconnectDatabase(); await mongo?.stop(); });
beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Project.deleteMany({}), ProjectRequest.deleteMany({}), Asset.deleteMany({})]);
  const passwordHash = await hashPassword("Password123");
  [admin, clientA, clientB, designer] = await User.create([
    { name: "Project Manager", email: "admin@example.test", passwordHash, role: "project_manager" },
    { name: "Client A", email: "a@example.test", passwordHash, role: "client" },
    { name: "Client B", email: "b@example.test", passwordHash, role: "client" },
    { name: "Designer", email: "designer@example.test", passwordHash, role: "designer" },
  ]);
});

async function actor(email) { const agent = request.agent(app); const auth = await agent.post("/api/auth/login").send({ email, password: "Password123" }).expect(200); return { agent, csrf: auth.body.data.csrfToken }; }
const projectBody = (clientId, designerId) => ({ title: "Launch campaign", description: "A complete social launch campaign", category: "Social Media", clientId, designerIds: [designerId] });

test("Project Manager project create enforces assignment and private access", async () => {
  const owner = await actor(admin.email); const outsider = await actor(clientB.email); const member = await actor(clientA.email);
  await owner.agent.post("/api/projects").set("X-CSRF-Token", owner.csrf).send(projectBody(designer.id, clientA.id)).expect(422);
  const created = await owner.agent.post("/api/projects").set("X-CSRF-Token", owner.csrf).send(projectBody(clientA.id, designer.id)).expect(201);
  const id = created.body.data.project.id;
  assert.equal(created.body.data.project.visibility, "private");
  await outsider.agent.get(`/api/projects/${id}`).expect(404);
  await member.agent.get(`/api/projects/${id}`).expect(200);
  await owner.agent.patch(`/api/projects/${id}`).set("X-CSRF-Token", owner.csrf).send({ visibility: "public" }).expect(200);
  await outsider.agent.get(`/api/projects/${id}`).expect(404);
  await owner.agent.patch(`/api/projects/${id}`).set("X-CSRF-Token", owner.csrf).send({ visibility: "private" }).expect(200);
  await outsider.agent.get(`/api/projects/${id}`).expect(404);
});

test("five pending request slots hold under concurrent submissions", async () => {
  const client = await actor(clientA.email);
  const submissions = await Promise.all(Array.from({ length: 7 }, (_, index) => client.agent.post("/api/project-requests").set("X-CSRF-Token", client.csrf).send({ title: `Request ${index}`, description: "An original creative project brief", category: "Logo" })));
  assert.equal(submissions.filter((response) => response.status === 201).length, 5);
  assert.equal(submissions.filter((response) => response.status === 409).length, 2);
  assert.equal(await ProjectRequest.countDocuments({ clientId: clientA._id, status: "pending" }), 5);
});

test("approval creates exactly one private project and blocks duplicate review", async () => {
  const client = await actor(clientA.email); const owner = await actor(admin.email); const other = await actor(clientB.email);
  const created = await client.agent.post("/api/project-requests").set("X-CSRF-Token", client.csrf).send({ title: "New identity", description: "A refreshed identity for launch", category: "Brand Identity" }).expect(201);
  const id = created.body.data.projectRequest.id;
  await other.agent.get(`/api/project-requests/${id}`).expect(404);
  const approval = await owner.agent.patch(`/api/project-requests/${id}`).set("X-CSRF-Token", owner.csrf).send({ decision: "approve", designerIds: [designer.id] });
  assert.equal(approval.status, 200, JSON.stringify(approval.body));
  assert.equal(approval.body.data.projectRequest.status, "approved");
  assert.equal((await Project.find({ sourceRequestId: id })).length, 1);
  await owner.agent.patch(`/api/project-requests/${id}`).set("X-CSRF-Token", owner.csrf).send({ decision: "approve", designerIds: [designer.id] }).expect(409);
  await client.agent.patch(`/api/project-requests/${id}/cancel`).set("X-CSRF-Token", client.csrf).send({}).expect(409);
});

test("asset scope hides Draft from Clients and updates after reassignment", async () => {
  const project = await Project.create({ ...projectBody(clientA.id, designer.id), createdBy: admin._id });
  const file = { publicId: `brandhub/${project.id}/asset`, storageVersion: 1, bytes: 100, format: "png", width: 8, height: 8 };
  await Asset.create({ projectId: project._id, uploadedBy: designer._id, title: "Draft concept", category: "Logo", currentFile: file, status: "draft" });
  const approved = await Asset.create({ projectId: project._id, uploadedBy: designer._id, title: "Approved concept", category: "Logo", currentFile: file, status: "approved" });
  assert.deepEqual((await Asset.find(await buildAssetScope(clientA))).map((asset) => asset.title), ["Approved concept"]);
  assert.equal(await Asset.countDocuments(await buildAssetScope(clientB)), 0);
  project.visibility = "public"; await project.save();
  assert.equal(await Asset.findOne({ _id: approved._id, ...await buildAssetScope(clientB) }), null);
  project.visibility = "private"; project.clientId = clientB._id; await project.save();
  assert.equal(await Asset.countDocuments(await buildAssetScope(clientA)), 0);
  assert.equal(await Asset.countDocuments(await buildAssetScope(clientB)), 1);
});
