import "dotenv/config";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import request from "supertest";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";
import { ProjectRequest } from "../src/models/ProjectRequest.js";
import { workspaceReportData, renderWorkspaceReport } from "../src/services/workspaceReport.js";
try {
  assert.equal(new URL(process.env.MONGODB_URI).pathname, "/brandhub_demo");
  await connectDatabase(process.env.MONGODB_URI);
  const app = createApp({ authRateLimit: 1000, apiRateLimit: 5000 });
  const manager = await User.findOne({ role: "project_manager", email: "admin@brandhub.example" });
  const designer = await User.findOne({ email: "nisha.verma@brandhub.example" });
  const agent = request.agent(app); const login = await agent.post("/api/auth/login").send({ email: manager.email, password: "Brand123", role: "project_manager" }).expect(200); const csrf = login.body.data.csrfToken;
  const pending = await ProjectRequest.find({ status: "pending" }).sort({ createdAt: -1 });
  let approved = 0, added = 0;
  for (const item of pending.slice(2)) { await agent.patch(`/api/project-requests/${item.id}`).set("X-CSRF-Token", csrf).send({ decision: "approve", designerIds: [designer.id], note: "Demo backlog reviewed and assigned to the designer. Design delivery remains subject to review." }).expect(200); approved++; }
  if (pending.length < 2) {
    const client = request.agent(app); const auth = await client.post("/api/auth/login").send({ email: "iris.vale@brandhub.example", password: "Brand123", role: "client" }).expect(200);
    for (let index = pending.length; index < 2; index++) { await client.post("/api/project-requests").set("X-CSRF-Token", auth.body.data.csrfToken).send({ title: ["GlowTheory Summer Launch", "GlowTheory Product Catalogue"][index], description: "Prepare a new visual campaign with image and document deliverables. This is a pending demonstration brief for manager review.", category: "Marketing Creative", amount: [8500, 12000][index], contactDetails: { name: "Iris Vale", email: "iris.vale@brandhub.example", phone: "+91 90000 00000", company: "GlowTheory" } }).expect(201); added++; }
  }
  assert.equal(await ProjectRequest.countDocuments({ status: "pending" }), 2);
  await fs.mkdir("../output/pdf", { recursive: true });
  for (const [role, filename] of [["project_manager", "BrandHub-Project-Manager-Report.pdf"], ["super_admin", "BrandHub-Super-Admin-Report.pdf"]]) { const user = await User.findOne({ role }); const data = await workspaceReportData(user, { year: 2026, month: 10 }); await fs.writeFile(`../output/pdf/${filename}`, await renderWorkspaceReport(data)); }
  console.log(JSON.stringify({ pendingBefore: pending.length, approvedAndAssigned: approved, demoRequestsAdded: added, pendingNow: 2, reportsGenerated: 2 }));
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await disconnectDatabase(); }
