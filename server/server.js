import "dotenv/config";
import { createApp } from "./src/app.js";
import { configureCloudinary } from "./src/config/cloudinary.js";
import { connectDatabase, disconnectDatabase } from "./src/config/db.js";
import { readEnv } from "./src/config/env.js";

let server;
async function start() {
  const env = readEnv();
  await connectDatabase(env.MONGODB_URI);
  configureCloudinary(env);
  server = createApp({ clientUrl: env.CLIENT_URL }).listen(env.PORT, () => console.log(`BrandHub API listening on port ${env.PORT}; database connected`));
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
