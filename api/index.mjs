import { createApp } from "../server/src/app.js";
import { connectDatabase } from "../server/src/config/db.js";
import { readEnv } from "../server/src/config/env.js";
import { createMongoSessionStore } from "../server/src/config/session.js";
import { configureCloudinary } from "../server/src/config/cloudinary.js";
let startup;
async function initialize() {
  const env = readEnv();
  await connectDatabase(env.MONGODB_URI);
  configureCloudinary(env);
  return createApp({ clientUrl: env.CLIENT_URL, sessionSecret: env.SESSION_SECRET, sessionStore: createMongoSessionStore(env.MONGODB_URI), cookieSecure: true, cookieSameSite: "lax" });
}
export default async function handler(req, res) {
  try { startup ||= initialize().catch(error => { startup = null; throw error; }); const app = await startup; return app(req, res); }
  catch { res.statusCode = 503; res.end(JSON.stringify({ error: { message: "Database connection unavailable. Check the deployment environment." } })); }
}
