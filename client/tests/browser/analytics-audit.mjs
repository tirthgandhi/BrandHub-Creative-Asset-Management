import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const origin = process.env.BRANDHUB_TEST_URL || "http://127.0.0.1:5175";
const browser = await chromium.launch({ executablePath: process.env.BRANDHUB_BROWSER || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const results = [];
try {
  for (const [role, label] of [["project_manager", "Project Manager"], ["designer", "Designer"], ["super_admin", "Super Admin"]]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    page.on("pageerror", error => results.push({ role, error: error.message }));
    await page.goto(`${origin}/login`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.locator("#login-email").fill(({ "Project Manager": "admin@brandhub.example", "Designer": "nisha.verma@brandhub.example", "Super Admin": "superadmin@brandhub.example", "Client": "iris.vale@brandhub.example" })[label]);
  await page.locator("#login-password").fill("Brand123");
    await page.getByRole("button", { name: `Sign in as ${label}`, exact: true }).click();
    await page.waitForURL("**/app/dashboard", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Design pipeline", exact: true }).waitFor({ timeout: 60000 });
    const data = await page.evaluate(async () => (await (await fetch("/api/dashboard/stats")).json()).data);
    const values = await page.locator(".pipeline-chart .pipeline-row strong").allTextContents();
    assert.deepEqual(values.map(Number), ["draft", "in_review", "changes_requested", "approved"].map(key => data.metrics.assets[key]));
    if (role === "designer") assert.deepEqual(data.analytics.workload, []);
    await page.locator(".workspace-analytics").screenshot({ path: `docs/testing/prototype/role-audit/${role}-analytics.png` });
    await page.locator(".project-health a").filter({ hasText: "On hold" }).click();
    await page.waitForURL("**/app/projects?status=on_hold", { waitUntil: "domcontentloaded" });
    assert.equal(await page.getByRole("combobox", { name: /^Status/ }).inputValue(), "on_hold");
    if (role === "project_manager") {
      await page.goto(`${origin}/app/super-admin/users`, { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: "Permission denied", exact: true }).waitFor();
    }
    if (role === "super_admin") {
      await page.goto(`${origin}/app/super-admin/users`, { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: "User administration", exact: true }).waitFor();
      await page.getByRole("button", { name: "Create user", exact: true }).click();
      assert.equal(await page.getByRole("combobox", { name: /^Role/ }).locator('option[value="project_manager"]').count(), 1);
      assert.equal(await page.getByRole("combobox", { name: /^Role/ }).locator('option[value="super_admin"]').count(), 0);
    }
    await page.goto(`${origin}/app/dashboard`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Design pipeline", exact: true }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth), false);
    await page.locator(".workspace-analytics .analytics-card").first().screenshot({ path: `docs/testing/prototype/role-audit/${role}-chart-mobile.png` });
    results.push({ role, chartValuesMatchDatabase: true, projectFilterLink: true, mobileOverflow: false, scopedWorkload: true });
    await context.close();
  }
  assert.equal(results.filter(row => row.error).length, 0);
} catch (error) {
  results.push({ failure: error.message });
  process.exitCode = 1;
} finally {
  const result = { passed: !process.exitCode, results };
  await fs.writeFile("docs/testing/prototype/role-audit/analytics-results.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
  await browser.close();
}
