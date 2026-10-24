import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { chromium } from "playwright-core";

const root = fileURLToPath(new URL("../", import.meta.url));
config({ path: path.join(root, "server", ".env"), quiet: true });
const mode = process.argv[2];
const base = process.env.BRANDHUB_SMOKE_API || "http://127.0.0.1:5001";
const statePath = path.join(root, ".tmp", "atlas-gridfs-smoke.json");
const imageDir = path.join(root, "client", "public", "demo-media", "beauty", "images");
const videoDir = path.join(root, "client", "public", "demo-media", "fashion", "videos");
const imagePath = path.join(imageDir, (await fs.readdir(imageDir)).find((name) => name.endsWith(".webp")));
const videoPath = path.join(videoDir, (await fs.readdir(videoDir)).find((name) => name.endsWith(".mp4")));
if (!["upload", "verify", "cleanup"].includes(mode)) throw new Error("Use upload, verify, or cleanup");
if (!process.env.ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD is not configured");

async function authenticate() {
  const response = await fetch(`${base}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "admin@brandhub.example", password: process.env.ADMIN_PASSWORD }) });
  if (!response.ok) throw new Error(`Login failed with HTTP ${response.status}`);
  const payload = await response.json();
  return { cookie: response.headers.getSetCookie()[0].split(";")[0], csrf: payload.data.csrfToken };
}
const auth = await authenticate();
async function call(url, options = {}) {
  return fetch(`${base}${url}`, { ...options, headers: { Cookie: auth.cookie, ...options.headers } });
}
async function upload(filePath, projectId, type, contentType) {
  const bytes = await fs.readFile(filePath);
  const form = new FormData();
  form.set("title", `Atlas smoke ${type}`);
  form.set("category", "uncategorized");
  form.set("contentType", contentType);
  form.set("file", new Blob([bytes], { type }), `smoke.${type === "video/mp4" ? "mp4" : "webp"}`);
  const response = await call(`/api/media/upload?projectId=${projectId}`, { method: "POST", headers: { "X-CSRF-Token": auth.csrf, "X-Upload-Size": String(bytes.length) }, body: form });
  const payload = await response.json();
  if (response.status !== 201) throw new Error(`Upload failed with HTTP ${response.status}: ${payload.error?.code || "unknown"}`);
  return { id: payload.data.media.id, bytes: bytes.length, checksum: crypto.createHash("sha256").update(bytes).digest("hex"), source: filePath };
}

if (mode === "upload") {
  const response = await call("/api/projects?limit=50");
  if (!response.ok) throw new Error(`Project listing failed with HTTP ${response.status}`);
  const projects = (await response.json()).data;
  const projectId = projects.find((project) => project.status !== "archived")?.id;
  if (!projectId) throw new Error("No active project is available for the smoke test");
  const items = [];
  try {
    items.push(await upload(imagePath, projectId, "image/webp", "post"));
    items.push(await upload(videoPath, projectId, "video/mp4", "reel"));
  } catch (error) {
    if (items.length) { await fs.mkdir(path.dirname(statePath), { recursive: true }); await fs.writeFile(statePath, JSON.stringify({ projectId, items })); }
    throw error;
  }
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.writeFile(statePath, JSON.stringify({ projectId, items }));
  console.log(JSON.stringify({ uploaded: items.length, imageBytes: items[0].bytes, videoBytes: items[1].bytes, projectId }, null, 2));
}
if (mode === "verify") {
  const state = JSON.parse(await fs.readFile(statePath, "utf8"));
  for (const item of state.items) {
    const meta = await call(`/api/media/${item.id}`);
    if (!meta.ok || (await meta.json()).data.media.storageType !== "gridfs") throw new Error(`Metadata verification failed: HTTP ${meta.status}`);
    const response = await call(`/api/media/${item.id}/stream`, { headers: { Range: "bytes=0-31" } });
    if (response.status !== 206) throw new Error(`Range verification failed: HTTP ${response.status}`);
    const expected = (await fs.readFile(item.source)).subarray(0, 32);
    if (!Buffer.from(await response.arrayBuffer()).equals(expected)) throw new Error("Downloaded bytes did not match the original file");
  }
  const browser = await chromium.launch({ headless: true, executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" });
  let browserPlayback = false;
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto("http://127.0.0.1:5174/login", { waitUntil: "networkidle" });
    await page.getByLabel("Email").fill("admin@brandhub.example");
    await page.getByLabel("Password", { exact: true }).fill(process.env.ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/app/dashboard");
    await page.goto(`http://127.0.0.1:5174/app/media?projectId=${state.projectId}`, { waitUntil: "networkidle" });
    const video = page.locator(`video[src*="${state.items[1].id}"]`);
    await video.waitFor();
    browserPlayback = await video.evaluate(async (element) => {
      element.muted = true;
      await element.play();
      await new Promise((resolve) => setTimeout(resolve, 500));
      const okay = element.videoWidth > 0 && element.currentTime > 0;
      element.pause();
      return okay;
    });
    await page.screenshot({ path: path.join(root, "docs", "screenshots", "phase6-gridfs-video.png"), fullPage: true });
  } finally { await browser.close(); }
  if (!browserPlayback) throw new Error("Browser could not play the GridFS video");
  console.log(JSON.stringify({ verifiedAfterRestart: state.items.length, imageRange: true, videoRange: true, browserPlayback }, null, 2));
}
if (mode === "cleanup") {
  const state = JSON.parse(await fs.readFile(statePath, "utf8"));
  for (const item of state.items) {
    const response = await call(`/api/media/${item.id}`, { method: "DELETE", headers: { "X-CSRF-Token": auth.csrf } });
    if (response.status !== 204) throw new Error(`Cleanup failed with HTTP ${response.status}`);
  }
  await fs.unlink(statePath);
  console.log(JSON.stringify({ deletedSmokeCopies: state.items.length, originalMediaPreserved: true }));
}
