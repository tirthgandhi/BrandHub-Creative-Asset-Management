import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const mediaRoot = path.resolve("..", ".tmp", "brandhub-feed");
const outputRoot = path.resolve("..", ".tmp", "brandhub-optimized");
const maxUploadBytes = 95 * 1024 * 1024;
await fs.mkdir(outputRoot, { recursive: true });

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const process = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let errorOutput = "";
    process.stderr.on("data", (chunk) => { errorOutput = `${errorOutput}${chunk}`.slice(-8000); });
    process.on("error", reject);
    process.on("close", (code) => code === 0 ? resolve() : reject(new Error(`FFmpeg exited with ${code}: ${errorOutput}`)));
  });
}

const files = await fs.readdir(mediaRoot);
const results = [];
for (const filename of files.filter((name) => name.toLowerCase().endsWith(".mp4"))) {
  const sourcePath = path.join(mediaRoot, filename);
  const source = await fs.stat(sourcePath);
  if (source.size <= 100 * 1024 * 1024) continue;
  const outputPath = path.join(outputRoot, filename);
  await runFfmpeg([
    "-y", "-i", sourcePath,
    "-vf", "scale=1080:-2",
    "-c:v", "libx264", "-preset", "medium", "-crf", "26",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    "-c:a", "aac", "-b:a", "128k",
    outputPath,
  ]);
  const output = await fs.stat(outputPath);
  if (output.size >= maxUploadBytes) throw new Error(`${filename} is still too large after optimization (${output.size} bytes)`);
  results.push({ filename, originalBytes: source.size, optimizedBytes: output.size });
}
console.log(JSON.stringify(results, null, 2));
