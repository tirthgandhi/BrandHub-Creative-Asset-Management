import "dotenv/config";
import { createApp } from "./src/app.js";
import { configureCloudinary } from "./src/config/cloudinary.js";
import { connectDatabase, disconnectDatabase } from "./src/config/db.js";
import { readEnv } from "./src/config/env.js";
import { createMongoSessionStore } from "./src/config/session.js";
import { startStorageCleanupWorker } from "./src/services/cloudinaryStorage.js";

let server;
async function start() {
  const env = readEnv();
  await connectDatabase(env.MONGODB_URI);
  configureCloudinary(env);
  const sessionStore = createMongoSessionStore(env.MONGODB_URI);
  server = createApp({ clientUrl: env.CLIENT_URL, sessionSecret: env.SESSION_SECRET, sessionStore, cookieName: env.COOKIE_NAME, cookieSecure: env.COOKIE_SECURE, cookieSameSite: env.COOKIE_SAME_SITE }).listen(env.PORT, () => console.log(`BrandHub API listening on port ${env.PORT}; database connected`));
  startStorageCleanupWorker();
}
async function shutdown(signal) {
  console.log(`${signal} received; shutting down`);
  if (server) await new Promise((resolve) => server.close(resolve));
  await disconnectDatabase();
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
start().catch((error) => { console.error(`Server startup failed: ${error.message}`); process.exit(1); });
