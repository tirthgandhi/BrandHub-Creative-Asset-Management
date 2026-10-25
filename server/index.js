import express from "express";
import { createApp } from "./src/app.js";
import { connectDatabase } from "./src/config/db.js";
import { readEnv } from "./src/config/env.js";
import { createMongoSessionStore } from "./src/config/session.js";
import { configureCloudinary } from "./src/config/cloudinary.js";

// Export an Express app for Vercel. Initialization happens on the first request,
// so builds do not need database access and concurrent cold requests share it.
export function createVercelApp(initialize = initializeApi) {
  const app = express();
  let startup;
  app.use(async (req, res, next) => {
    try {
      startup ||= initialize().catch(error => { startup = undefined; throw error; });
      const api = await startup;
      return api(req, res, next);
    } catch {
      return res.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "The database is temporarily unavailable. Check the server environment and Atlas network access.", details: [] } });
    }
  });
  return app;
}
async function initializeApi() {
  const clientUrl = process.env.CLIENT_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  const env = readEnv({ ...process.env, CLIENT_URL: clientUrl });
  await connectDatabase(env.MONGODB_URI);
  configureCloudinary(env);
  return createApp({ clientUrl: env.CLIENT_URL, sessionSecret: env.SESSION_SECRET,
    sessionStore: createMongoSessionStore(env.MONGODB_URI), cookieName: env.COOKIE_NAME,
    cookieSecure: env.COOKIE_SECURE, cookieSameSite: env.COOKIE_SAME_SITE });
}
export default createVercelApp();
