import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { createMongoSessionStore } from "../src/config/session.js";
import { User } from "../src/models/User.js";
import { hashPassword } from "../src/utils/password.js";

const port = Number(process.env.PORT || 5000);
const mongo = await MongoMemoryServer.create({ binary: { version: "7.0.14" } });
const uri = mongo.getUri();
await connectDatabase(uri);
await User.create({ name: "BrandHub Admin", email: "admin@brandhub.demo", role: "admin", passwordHash: await hashPassword("AdminPass123"), mustChangePassword: false });
const app = createApp({ clientUrl: process.env.CLIENT_URL || "http://127.0.0.1:5173", sessionSecret: "local-preview-session-secret-change-me-12345", sessionStore: createMongoSessionStore(uri), authRateLimit: 1000 });
const server = app.listen(port, () => {
  console.log(`BrandHub preview API: http://127.0.0.1:${port}/api`);
  console.log("Development-only Admin: admin@brandhub.demo / AdminPass123");
});
async function stop() { await new Promise((resolve) => server.close(resolve)); await disconnectDatabase(); await mongo.stop(); process.exit(0); }
process.on("SIGINT", stop); process.on("SIGTERM", stop);
