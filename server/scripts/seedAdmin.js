import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { readEnv } from "../src/config/env.js";
import { User } from "../src/models/User.js";
import { assertStrongPassword, hashPassword } from "../src/utils/password.js";

async function seedAdmin() {
  const env = readEnv();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  const name = process.env.ADMIN_NAME?.trim() || "BrandHub Admin";
  if (!email || !password) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  assertStrongPassword(password);
  await connectDatabase(env.MONGODB_URI);
  if (await User.exists({ role: "project_manager" })) {
    console.log("An Admin already exists; no account was changed.");
    return;
  }
  const admin = await User.create({ name, email, role: "project_manager", passwordHash: await hashPassword(password), mustChangePassword: false });
  console.log(`Created initial Admin ${admin.email}.`);
}

seedAdmin().catch((error) => { console.error(`Admin seed failed: ${error.message}`); process.exitCode = 1; }).finally(disconnectDatabase);
