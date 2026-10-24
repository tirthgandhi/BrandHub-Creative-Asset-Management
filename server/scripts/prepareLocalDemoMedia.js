import crypto from "node:crypto";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";
import { categoryForSource } from "../src/data/demoMediaCatalog.js";

const sourceRoot = path.resolve(process.env.BRANDHUB_MEDIA_DIR || path.join("..", ".tmp", "brandhub-feed"));
const publicRoot = path.resolve("..", "client", "public", "demo-media");
const manifestPath = path.resolve("..", "client", "public", "demo-media-manifest.json");
const supported = new Map([[".jpg", "image"], [".jpeg", "image"], [".png", "image"], [".webp", "image"], [".mp4", "video"]]);

function slug(filename) {
  return path.basename(filename, path.extname(filename)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);
}

function transcode(source, target) {
  return new Promise((resolve, reject) => {
    const process = spawn(ffmpegPath, ["-y", "-i", source, "-vf", "scale='min(960,iw)':-2", "-c:v", "libx264", "-preset", "fast", "-crf", "30", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-c:a", "aac", "-b:a", "96k", target], { stdio: ["ignore", "ignore", "pipe"] });
    let errorOutput = "";
    process.stderr.on("data", (chunk) => { errorOutput = `${errorOutput}${chunk}`.slice(-4000); });
    process.on("error", reject);
    process.on("close", (code) => code === 0 ? resolve() : reject(new Error(`Video optimization failed: ${errorOutput}`)));
  });
}

function inspectVideo(source) {
  return new Promise((resolve, reject) => {
    const process = spawn(ffmpegPath, ["-i", source], { stdio: ["ignore", "ignore", "pipe"] });
    let output = "";
    process.stderr.on("data", (chunk) => { output += chunk; });
    process.on("error", reject);
    process.on("close", () => {
      const size = /Video:[^\r\n]*?(\d{2,5})x(\d{2,5})/.exec(output);
      const time = /Duration: (\d{2}):(\d{2}):(\d{2}\.\d+)/.exec(output);
      resolve({ width: size ? Number(size[1]) : null, height: size ? Number(size[2]) : null, duration: time ? Number(time[1]) * 3600 + Number(time[2]) * 60 + Number(time[3]) : null });
    });
  });
}

const sourceFiles = (await fs.readdir(sourceRoot)).sort();
const assets = [];
for (const filename of sourceFiles) {
  const mediaType = supported.get(path.extname(filename).toLowerCase());
  if (!mediaType) continue;
  const sourcePath = path.join(sourceRoot, filename);
  const sourceStat = await fs.stat(sourcePath);
  const hash = crypto.createHash("sha256");
  for await (const chunk of createReadStream(sourcePath)) hash.update(chunk);
  const checksum = hash.digest("hex");
  const category = categoryForSource(filename);
  const outputName = `${slug(filename)}-${checksum.slice(0, 10)}.${mediaType === "image" ? "webp" : "mp4"}`;
  const categoryPath = path.join(category, mediaType === "image" ? "images" : "videos");
  const outputDir = path.join(publicRoot, categoryPath);
  const outputPath = path.join(outputDir, outputName);
  await fs.mkdir(outputDir, { recursive: true });
  if (mediaType === "image") {
    if (!(await fs.access(outputPath).then(() => true).catch(() => false))) await sharp(sourcePath, { limitInputPixels: 80_000_000 }).rotate().resize({ width: 1440, height: 1920, fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toFile(outputPath);
  } else {
    if (!(await fs.access(outputPath).then(() => true).catch(() => false))) await transcode(sourcePath, outputPath);
  }
  const outputStat = await fs.stat(outputPath);
  const dimensions = mediaType === "image" ? await sharp(outputPath).metadata() : await inspectVideo(outputPath);
  let thumbnailUrl = null;
  if (mediaType === "video") {
    const posterName = `${slug(filename)}-${checksum.slice(0, 10)}.jpg`;
    const posterPath = path.join(outputDir, posterName);
    if (!(await fs.access(posterPath).then(() => true).catch(() => false))) {
      await new Promise((resolve, reject) => {
        const process = spawn(ffmpegPath, ["-y", "-ss", "0.5", "-i", outputPath, "-frames:v", "1", "-vf", "scale='min(640,iw)':-2", "-q:v", "4", posterPath], { stdio: "ignore" });
        process.on("error", reject);
        process.on("close", (code) => code === 0 ? resolve() : reject(new Error(`Poster generation failed for ${filename}`)));
      });
    }
    thumbnailUrl = `/demo-media/${categoryPath.replaceAll("\\", "/")}/${posterName}`;
  }
  assets.push({
    id: checksum.slice(0, 24),
    category,
    mediaType,
    storageType: "local",
    localUrl: `/demo-media/${categoryPath.replaceAll("\\", "/")}/${outputName}`,
    thumbnailUrl,
    originalFilename: filename,
    storedFilename: outputName,
    title: `${category.charAt(0).toUpperCase()}${category.slice(1)} creative preview`,
    description: "Fictional BrandHub demonstration media; usage rights require review.",
    sourceChecksum: checksum,
    sourceBytes: sourceStat.size,
    bytes: outputStat.size,
    width: dimensions.width || null,
    height: dimensions.height || null,
    duration: dimensions.duration || null,
    usageRightsStatus: "unverified",
  });
  console.log(`${assets.length}/${sourceFiles.length} ${filename} -> ${outputStat.size} bytes`);
}
await fs.writeFile(manifestPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), assets }, null, 2)}\n`);
console.log(JSON.stringify({ images: assets.filter((asset) => asset.mediaType === "image").length, videos: assets.filter((asset) => asset.mediaType === "video").length, totalBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0) }));
