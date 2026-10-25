// Isolated local browser-test server. Production/local startup defaults stay unchanged.
import "dotenv/config";
import { createApp } from "../src/app.js";
import { connectDatabase } from "../src/config/db.js";
import { createMongoSessionStore } from "../src/config/session.js";
await connectDatabase(process.env.MONGODB_URI);
createApp({ sessionStore: createMongoSessionStore(process.env.MONGODB_URI), authRateLimit: 1000, apiRateLimit: 5000 }).listen(5001, "127.0.0.1", () => console.log("Isolated browser audit API listening on 5001"));
