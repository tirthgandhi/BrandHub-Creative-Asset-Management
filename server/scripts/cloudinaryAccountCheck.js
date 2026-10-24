import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

const required = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`Missing Cloudinary configuration: ${missing.join(", ")}`);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const [ping, usage] = await Promise.all([cloudinary.api.ping(), cloudinary.api.usage()]);
console.log(JSON.stringify({
  status: ping.status,
  plan: usage.plan,
  credits: usage.credits ? { used: usage.credits.usage, limit: usage.credits.limit } : undefined,
  storage: usage.storage,
  bandwidth: usage.bandwidth,
  resources: usage.resources,
  transformations: usage.transformations,
}, null, 2));
