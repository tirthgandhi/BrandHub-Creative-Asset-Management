import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
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

const mediaRoot = path.resolve("..", ".tmp", "brandhub-feed");
const candidates = [
  {
    source: "pexels-vandana-vankhede-322740014-26733176.jpg",
    publicId: "brandhub/demo/beauty/skincare-product-001",
    resourceType: "image",
  },
  {
    source: "11294-229221031_medium.mp4",
    publicId: "brandhub/demo/uncategorized/video-001",
    resourceType: "video",
  },
];

const results = [];
for (const candidate of candidates) {
  const sourcePath = path.join(mediaRoot, candidate.source);
  await fs.access(sourcePath);
  const uploaded = await cloudinary.uploader.upload(sourcePath, {
    resource_type: candidate.resourceType,
    public_id: candidate.publicId,
    overwrite: false,
    unique_filename: false,
    use_filename: false,
    tags: ["brandhub-demo", "brandhub-smoke-verified"],
    context: { source_filename: candidate.source, usage_rights_status: "unverified" },
  });
  const response = await fetch(uploaded.secure_url, { headers: { Range: "bytes=0-1023" } });
  if (!response.ok && response.status !== 206) throw new Error(`Delivery check failed for ${candidate.source}: HTTP ${response.status}`);
  results.push({
    sourceFilename: candidate.source,
    publicId: uploaded.public_id,
    resourceType: uploaded.resource_type,
    format: uploaded.format,
    bytes: uploaded.bytes,
    width: uploaded.width,
    height: uploaded.height,
    duration: uploaded.duration,
    secureUrl: uploaded.secure_url,
    deliveryStatus: response.status,
  });
}

await fs.mkdir(path.resolve("..", ".tmp"), { recursive: true });
await fs.writeFile(path.resolve("..", ".tmp", "cloudinary-smoke-result.json"), `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results.map(({ secureUrl: _secureUrl, ...result }) => result), null, 2));
