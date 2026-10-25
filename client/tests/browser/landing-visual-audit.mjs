import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const browser = await chromium.launch({ executablePath: process.env.BRANDHUB_BROWSER || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const result = { checks: [] };
await fs.mkdir("docs/testing/prototype/landing-fix", { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.goto(process.env.BRANDHUB_TEST_URL || "http://127.0.0.1:5178", { waitUntil: "domcontentloaded" });
  await page.locator("#vision").scrollIntoViewIfNeeded();
  await page.locator(".vision-photo img").evaluateAll(images=>images.forEach(image=>image.loading="eager"));
  await page.waitForFunction(() => [...globalThis.document.querySelectorAll(".vision-photo img")].length === 3 && [...globalThis.document.querySelectorAll(".vision-photo img")].every(image => image.complete && image.naturalWidth > 0));
  const sources = await page.locator(".hero-orbit .campaign-canvas > img,.vision-photo img,.gallery-card .campaign-canvas > img,.editorial-photo > img").evaluateAll(nodes => nodes.map(node => node.getAttribute("src")));
  assert.equal(sources.length, 25); assert.equal(new Set(sources).size, 25);
  assert.equal(await page.locator(".landing-workflow-note").count(), 0);
  await fs.mkdir("docs/testing/prototype/landing-fix", { recursive: true });
  await page.locator("#vision").screenshot({ path: "docs/testing/prototype/landing-fix/vision-desktop.png" });
  await page.locator(".workflow-visual").first().screenshot({ path: "docs/testing/prototype/landing-fix/workflow-desktop.png" });
  result.checks.push("25 distinct media sources across hero, vision, showcase and editorial sections");
  result.checks.push("All three vision photographs loaded and no plain placeholder cards remain");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#vision").scrollIntoViewIfNeeded();
  assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth), false);
  await page.locator(".vision-card").first().screenshot({ path: "docs/testing/prototype/landing-fix/vision-mobile.png" });
  result.checks.push("Mobile layout has no horizontal overflow"); result.passed = true;
} catch (error) { result.passed = false; result.failure = error.message; process.exitCode = 1; }
finally { await fs.writeFile("docs/testing/prototype/landing-fix/results.json", JSON.stringify(result, null, 2)); console.log(JSON.stringify(result)); await browser.close(); }
