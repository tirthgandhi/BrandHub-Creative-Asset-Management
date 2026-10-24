import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright-core";

const base = process.env.BRANDHUB_URL || "http://127.0.0.1:5173";
const output = new URL("../docs/screenshots/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" });
const results = [];

async function verifyWidth(width) {
  const context = await browser.newContext({ viewport: { width, height: width <= 480 ? 812 : 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("admin@brandhub.demo");
  await page.getByLabel("Password", { exact: true }).fill("AdminPass123");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.getByRole("heading", { name: /Welcome/ }).waitFor();
  errors.length = 0;
  await page.getByRole("combobox", { name: "Color theme" }).selectOption(width === 1440 ? "light" : "dark");
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /Welcome/ }).waitFor();
  const dashboardOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  const menu = page.getByRole("button", { name: "Open navigation" });
  if (width <= 800) {
    if (!(await menu.isVisible())) throw new Error(`Mobile navigation button missing at ${width}px`);
    await menu.click();
    await page.keyboard.press("Escape");
  }
  await page.screenshot({ path: new URL(`phase2-${width}-dashboard.png`, output).pathname.slice(1), fullPage: true });
  await page.goto(`${base}/app/admin/users`, { waitUntil: "networkidle" });
  await page.getByText("admin@brandhub.demo").waitFor();
  const usersOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  await page.screenshot({ path: new URL(`phase2-${width}-users.png`, output).pathname.slice(1), fullPage: true });
  results.push({ width, dashboardOverflow, usersOverflow, consoleErrors: errors });
  await context.close();
}

for (const width of [375, 768, 1024, 1440]) await verifyWidth(width);

const publicContext = await browser.newContext({ viewport: { width: 375, height: 812 }, colorScheme: "light", reducedMotion: "reduce" });
const publicPage = await publicContext.newPage();
await publicPage.goto(`${base}/register`, { waitUntil: "networkidle" });
await publicPage.screenshot({ path: new URL("phase2-375-register.png", output).pathname.slice(1), fullPage: true });
await publicPage.goto(`${base}/login`, { waitUntil: "networkidle" });
await publicPage.screenshot({ path: new URL("phase2-375-login.png", output).pathname.slice(1), fullPage: true });
await publicContext.close();

await browser.close();
await writeFile(new URL("qa-results.json", output), JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
console.log(JSON.stringify(results, null, 2));
if (results.some((item) => item.dashboardOverflow || item.usersOverflow || item.consoleErrors.length)) process.exitCode = 1;
