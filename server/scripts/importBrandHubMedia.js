import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { categoryForSource } from "../src/data/demoMediaCatalog.js";

const supported = new Map([
  [".jpg", "image"], [".jpeg", "image"], [".png", "image"], [".webp", "image"],
  [".mp4", "video"], [".webm", "video"], [".mov", "video"],
]);
const required = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`Missing Cloudinary configuration: ${missing.join(", ")}`);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const dryRun = process.argv.includes("--dry-run");
const mediaRoot = path.resolve(process.env.BRANDHUB_MEDIA_DIR || path.join("..", ".tmp", "brandhub-feed"));
const optimizedRoot = path.resolve("..", ".tmp", "brandhub-optimized");
const reportPath = path.resolve(process.env.BRANDHUB_IMPORT_REPORT || path.join("..", ".tmp", "brandhub-media-import.json"));
const smokePath = path.resolve("..", ".tmp", "cloudinary-smoke-result.json");

async function sha256(filePath) {
  const data = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function optionalJson(filePath, fallback) {
  try { return JSON.parse(await fs.readFile(filePath, "utf8")); }
  catch (error) { if (error.code === "ENOENT") return fallback; throw error; }
}

function slug(filename) {
  return path.basename(filename, path.extname(filename)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);
}

function thumbnailUrl(result) {
  if (result.resourceType === "video") {
    return cloudinary.url(result.publicId, { resource_type: "video", secure: true, format: "jpg", transformation: [{ width: 720, height: 960, crop: "limit", quality: "auto" }] });
  }
  return cloudinary.url(result.publicId, { resource_type: "image", secure: true, transformation: [{ width: 960, height: 1200, crop: "limit", quality: "auto", fetch_format: "auto" }] });
}

async function upload(sourcePath, entry) {
  const options = {
    resource_type: entry.resourceType,
    public_id: entry.publicId,
    overwrite: false,
    unique_filename: false,
    use_filename: false,
    tags: ["brandhub-demo", `brandhub-${entry.category}`],
    context: { source_filename: entry.sourceFilename, checksum: entry.checksum, usage_rights_status: "unverified" },
  };
  const stat = await fs.stat(sourcePath);
  if (entry.resourceType === "video" && stat.size > 90 * 1024 * 1024) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_large(sourcePath, { ...options, chunk_size: 10 * 1024 * 1024 }, (error, result) => error ? reject(error) : resolve(result));
    });
  }
  return cloudinary.uploader.upload(sourcePath, options);
}

async function findRemote(publicId, resourceType) {
  try { return await cloudinary.api.resource(publicId, { resource_type: resourceType }); }
  catch (error) { if (error?.error?.http_code === 404 || error?.http_code === 404) return null; throw error; }
}

const prior = await optionalJson(reportPath, { assets: [] });
const smoke = await optionalJson(smokePath, []);
const reusable = new Map([...smoke, ...prior.assets].map((asset) => [asset.sourceFilename, asset]));
const filenames = (await fs.readdir(mediaRoot)).sort();
const assets = [];
const unsupported = [];

for (const sourceFilename of filenames) {
  const sourcePath = path.join(mediaRoot, sourceFilename);
  const stat = await fs.stat(sourcePath);
  if (!stat.isFile()) continue;
  const resourceType = supported.get(path.extname(sourceFilename).toLowerCase());
  if (!resourceType) { unsupported.push({ sourceFilename, reason: "unsupported extension" }); continue; }
  const checksum = await sha256(sourcePath);
  const optimizedPath = path.join(optimizedRoot, sourceFilename);
  const uploadPath = await fs.access(optimizedPath).then(() => optimizedPath).catch(() => sourcePath);
  const uploadStat = await fs.stat(uploadPath);
  const category = categoryForSource(sourceFilename);
  const existing = reusable.get(sourceFilename);
  if (existing?.secureUrl) {
    const desiredPrefix = `brandhub/demo/${category}/`;
    let reused = { ...existing, checksum, category, resourceType, usageRightsStatus: "unverified" };
    if (!dryRun && !existing.publicId.startsWith(desiredPrefix)) {
      const desiredId = `${desiredPrefix}${slug(sourceFilename)}-${checksum.slice(0, 10)}`;
      const renamed = await cloudinary.uploader.rename(existing.publicId, desiredId, { resource_type: resourceType, overwrite: false });
      reused = { ...reused, publicId: renamed.public_id, assetId: renamed.asset_id, secureUrl: renamed.secure_url };
    }
    assets.push({ ...reused, status: "reused", thumbnailUrl: thumbnailUrl(reused) });
    continue;
  }
  const publicId = `brandhub/demo/${category}/${slug(sourceFilename)}-${checksum.slice(0, 10)}`;
  const entry = { sourceFilename, sourceBytes: stat.size, uploadBytes: uploadStat.size, checksum, category, resourceType, publicId, usageRightsStatus: "unverified" };
  if (dryRun) { assets.push({ ...entry, status: "planned" }); continue; }
  try {
    const result = await findRemote(publicId, resourceType) || await upload(uploadPath, entry);
    const saved = {
      ...entry,
      status: "uploaded",
      publicId: result.public_id,
      assetId: result.asset_id,
      secureUrl: result.secure_url,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      duration: result.duration,
    };
    assets.push({ ...saved, thumbnailUrl: thumbnailUrl(saved) });
  } catch (error) {
    assets.push({ ...entry, status: "failed", error: error.message });
  }
  await fs.writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), dryRun, assets, unsupported }, null, 2)}\n`);
}

const report = { generatedAt: new Date().toISOString(), dryRun, assets, unsupported };
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
const counts = assets.reduce((value, asset) => { value[asset.status] = (value[asset.status] || 0) + 1; return value; }, {});
console.log(JSON.stringify({ inspected: filenames.length, supported: assets.length, unsupported: unsupported.length, counts }, null, 2));
