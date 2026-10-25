import "dotenv/config";
import assert from "node:assert/strict";
import { User } from "../src/models/User.js";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { hashPassword } from "../src/utils/password.js";
try {
  const uri = new URL(process.env.MONGODB_URI);
  assert.equal(uri.pathname, "/brandhub_demo", "Role migration is limited to the prototype database");
  assert.notEqual(process.env.NODE_ENV, "production");
  await connectDatabase(uri.toString());
  const migrated = await User.collection.updateMany({ role: "admin" }, { $set: { role: "project_manager" }, $inc: { authVersion: 1 } });
  await User.updateOne({ email: "admin@brandhub.example", role: "project_manager" }, { $set: { name: "BrandHub Project Manager" } });
  await User.init();
  const email = "superadmin@brandhub.example";
  const existing = await User.findOne({ role: "super_admin" });
  if (existing && existing.email !== email) throw new Error("A different Super Admin already exists; no account was replaced");
  await User.updateOne({ email }, { $setOnInsert: { name: "BrandHub Super Admin", email, role: "super_admin", passwordHash: await hashPassword("Brand123"), demoKey: "brandhub:super-admin", mustChangePassword: false } }, { upsert: true });
  assert.equal(await User.countDocuments({ role: "super_admin" }), 1);
  console.log(JSON.stringify({ database: "brandhub_demo", migratedProjectManagers: migrated.modifiedCount, superAdmins: 1, email, password: "Brand123" }));
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await disconnectDatabase(); }
