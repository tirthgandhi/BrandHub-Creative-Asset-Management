import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { config } from "dotenv";

const root = new URL("../", import.meta.url);
config({ path: fileURLToPath(new URL("server/.env", root)), quiet: true });
if (!process.env.ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD is missing from server/.env");
const output = new URL("docs/screenshots/", root);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" });
const results = [];
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://127.0.0.1:5174/login", { waitUntil: "networkidle" });
    await page.getByLabel("Email").fill("admin@brandhub.example");
    await page.getByLabel("Password", { exact: true }).fill(process.env.ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/app/dashboard", { timeout: 15000 });
    await page.locator(".dashboard-stat-card").first().waitFor();
    const dashboardCards = await page.locator(".dashboard-stat-card").count();
    const dashboardOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    await page.screenshot({ path: fileURLToPath(new URL(`phase6-dashboard-${width}.png`, output)), fullPage: true });
    if (width < 500) await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("link", { name: "Media", exact: true }).click();
    await page.getByRole("heading", { name: "Project media" }).waitFor();
    await page.locator(".asset-card").first().waitFor();
    for (const image of await page.locator(".asset-card img").all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((element) => element.decode());
    }
    const imageState = await page.locator(".asset-card img").evaluateAll((images) => images.map((image) => ({ loaded: image.complete && image.naturalWidth > 0, source: image.currentSrc })));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    await page.screenshot({ path: fileURLToPath(new URL(`phase6-media-${width}.png`, output)), fullPage: true });
    const cards = await page.locator(".asset-card").count();
    await page.getByRole("button", { name: "Next" }).click();
    await page.locator(".asset-card video").first().waitFor();
    const videos = await page.locator(".asset-card video").count();
    const playback = await page.locator(".asset-card video").first().evaluate(async (video) => {
      await new Promise((resolve, reject) => { video.addEventListener("loadeddata", resolve, { once: true }); video.addEventListener("error", reject, { once: true }); video.load(); });
      return video.videoWidth > 0 && video.duration > 0;
    });
    for (const [route, heading] of [["reviews", "Review queue"], ["bookmarks", "Bookmarks"], ["settings", "Settings"]]) {
      await page.goto(`http://127.0.0.1:5174/app/${route}`, { waitUntil: "networkidle" });
      await page.getByRole("heading", { name: heading, exact: true }).waitFor();
    }
    await page.getByLabel("Reduce motion").check();
    const motion = await page.evaluate(() => document.documentElement.dataset.reduceMotion);
    results.push({ width, dashboardCards, dashboardOverflow, cards, loadedImages: imageState.filter((item) => item.loaded).length, images: imageState.length, videos, playback, overflow, motion, pageErrors: errors });
    await context.close();
  }
} finally { await browser.close(); }
console.log(JSON.stringify(results, null, 2));
if (results.some((result) => result.dashboardCards < 6 || result.dashboardOverflow || !result.cards || result.loadedImages !== result.images || !result.videos || !result.playback || result.overflow || result.motion !== "true" || result.pageErrors.length)) process.exitCode = 1;
