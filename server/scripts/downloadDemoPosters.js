import fs from "node:fs/promises";
import path from "node:path";

const reportPath = path.resolve("..", ".tmp", "brandhub-media-import.json");
const outputRoot = path.resolve("..", ".tmp", "brandhub-video-posters");
const report = JSON.parse(await fs.readFile(reportPath, "utf8"));
await fs.mkdir(outputRoot, { recursive: true });

const videos = report.assets.filter((asset) => asset.resourceType === "video" && asset.thumbnailUrl);
for (const asset of videos) {
  const response = await fetch(asset.thumbnailUrl);
  if (!response.ok) throw new Error(`Poster request failed for ${asset.sourceFilename}: HTTP ${response.status}`);
  await fs.writeFile(path.join(outputRoot, `${path.basename(asset.sourceFilename, path.extname(asset.sourceFilename))}.jpg`), Buffer.from(await response.arrayBuffer()));
}
console.log(`Downloaded ${videos.length} Cloudinary video posters for visual verification.`);
