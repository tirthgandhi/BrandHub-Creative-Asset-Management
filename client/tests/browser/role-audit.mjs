import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const origin = process.env.BRANDHUB_TEST_URL || "http://127.0.0.1:5175";
const output = "docs/testing/prototype/role-audit";
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.BRANDHUB_BROWSER || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const result = { routes: [], themes: [], deniedRoutes: [], errors: [], apiResponses: [], visualChecks: [] };
const users = { super_admin: "superadmin@brandhub.example", project_manager: "admin@brandhub.example", client: "iris.vale@brandhub.example", designer: "nisha.verma@brandhub.example" };
const project = "6add888278e3d9dfb61c8d40", asset = "6add888378e3d9dfb61c8d41";
async function ready(page) { await page.locator("h1,h2").first().waitFor(); await page.locator(".skeleton").first().waitFor({state:"hidden", timeout:30000}); }
async function navigate(page, path) { await page.goto(`${origin}${path}`, {waitUntil:"domcontentloaded", timeout:60000}); await ready(page); }
async function noOverflow(page, label) { assert.equal(await page.evaluate(()=>globalThis.document.documentElement.scrollWidth>globalThis.innerWidth),false,`${label}: horizontal overflow`); }
try {
  const guest = await browser.newContext({viewport:{width:1440,height:1000}});
  const page = await guest.newPage(); page.on("pageerror",error=>result.errors.push(error.message));
  await navigate(page,"/login");
  for (const theme of ["morning","afternoon","sunset","night"]) {
    await page.getByRole("combobox",{name:"Atmosphere theme"}).selectOption(theme);
    await page.waitForFunction(value=>globalThis.document.documentElement.dataset.skyTheme===value,theme);
    await page.getByRole("button",{name:"Client",exact:true}).click();
    await noOverflow(page,`login-${theme}`);
    await page.screenshot({path:`${output}/login-${theme}.png`});
    const colors=await page.locator(".sky-auth-card").evaluate(node=>({text:globalThis.getComputedStyle(node).getPropertyValue("--sky-text-muted"),background:globalThis.getComputedStyle(node).backgroundColor}));
    result.themes.push({theme,...colors});
  }
  await page.setViewportSize({width:390,height:844}); await page.screenshot({path:`${output}/login-mobile.png`,fullPage:true}); await noOverflow(page,"mobile login");
  for(const route of ["/signup","/forgot-password","/reset-password","/verify-email","/missing-page"]) {await navigate(page,route); result.routes.push({role:"guest",route});}
  await page.goto(`${origin}/app/admin/users`,{waitUntil:"domcontentloaded"}); await page.waitForURL("**/login", { waitUntil: "domcontentloaded" });
  result.deniedRoutes.push({role:"guest",route:"/app/admin/users",result:"login redirect"});
  await guest.close();
  for(const [role,email] of Object.entries(users)) {
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    const page=await context.newPage(); page.on("pageerror",error=>result.errors.push(`${role}: ${error.message}`));
    page.on("response", response=>{if(response.url().includes("/api/"))result.apiResponses.push({role,path:new URL(response.url()).pathname,status:response.status()});});
    await navigate(page,"/login");
    await page.getByRole("button",{name:({super_admin:"Super Admin",project_manager:"Project Manager",client:"Client",designer:"Designer"})[role],exact:true}).click();
    await page.locator("#login-email").fill(email);
    await page.locator("#login-password").fill("Brand123");
    assert.equal(await page.locator("#login-email").inputValue(),email);
    await page.getByRole("button",{name:`Sign in as ${({super_admin:"Super Admin",project_manager:"Project Manager",client:"Client",designer:"Designer"})[role]}`,exact:true}).click();
    await page.waitForURL("**/app/dashboard", { waitUntil: "domcontentloaded" }); await ready(page);
    await page.locator(".dashboard-stat-card").first().waitFor({timeout:60000});
    await page.locator(".dashboard-media-card").first().waitFor({timeout:60000});
    if(role!=="client") await page.getByRole("heading",{name:"Design pipeline",exact:true}).waitFor();
    const sources=await page.locator(".dashboard-media-card img,.dashboard-media-card video").evaluateAll(nodes=>nodes.map(node=>node.getAttribute("src")));
    assert.equal(new Set(sources).size,sources.length);
    await page.screenshot({path:`${output}/${role}-dashboard.png`});
    await page.getByRole("button",{name:"Films",exact:true}).click(); assert.equal(await page.locator(".dashboard-media-card img").count(),0);
    await page.getByRole("button",{name:"Photography",exact:true}).click(); assert.equal(await page.locator(".dashboard-media-card video").count(),0);
    result.visualChecks.push({role,uniqueMedia:true,filters:true});
    const routes=["/app","/app/dashboard","/app/projects",`/app/projects/${project}`,"/app/assets",`/app/assets/${asset}`,"/app/media","/app/reviews","/app/bookmarks","/app/profile","/app/settings","/change-password"];
    if(["project_manager","super_admin"].includes(role))routes.push("/app/admin/users","/app/admin/requests","/app/projects/new",`/app/projects/${project}/edit`,"/app/assets/upload","/app/media/upload");
    if(role==="designer")routes.push("/app/assets/upload","/app/media/upload");
    if(role==="client")routes.push("/app/requests","/app/requests/new","/app/explore");
    for(const route of routes) {
      await navigate(page,route); await noOverflow(page,`${role}:${route}`);
      assert.equal(await page.getByRole("alert").count(),0,`${role}:${route} displayed an error`);
      result.routes.push({role,route});
    }
    const denied=["project_manager","super_admin"].includes(role)?["/app/requests/new"]:role==="designer"?["/app/admin/users","/app/admin/requests","/app/projects/new","/app/requests/new"]:["/app/admin/users","/app/admin/requests","/app/projects/new","/app/assets/upload","/app/media/upload"];
    for(const route of denied) { await navigate(page,route); await page.getByRole("heading",{name:"Permission denied"}).waitFor(); result.deniedRoutes.push({role,route,result:"permission denied"}); }
    await navigate(page,"/app/dashboard");
    for(const theme of ["morning","afternoon","sunset","night"]) {
      await page.getByRole("combobox",{name:"Atmosphere",exact:true}).selectOption(theme);
      await page.waitForFunction(value=>globalThis.document.documentElement.dataset.theme===value,theme);
      const heading=await page.locator(".app-content .page-heading p").first().evaluate(node=>globalThis.getComputedStyle(node).color);
      result.visualChecks.push({role,theme,headingText:heading});
    }
    await page.setViewportSize({width:390,height:844}); await noOverflow(page,`${role}:mobile`); await page.screenshot({path:`${output}/${role}-mobile.png`});
    await page.getByRole("button",{name:"Open navigation"}).click(); await page.getByRole("link",{name:"Projects",exact:true}).click(); await page.waitForURL("**/app/projects", { waitUntil: "domcontentloaded" });
    await context.close();
  }
  assert.deepEqual(result.errors,[]);
  assert.equal(result.apiResponses.filter(item=>item.status>=500).length,0,"Backend returned a server error");
  result.passed=true;
} catch(error) { result.passed=false; result.failure=error.message; process.exitCode=1; }
finally { await fs.writeFile(`${output}/browser-results.json`,JSON.stringify(result,null,2)); console.log(JSON.stringify({passed:result.passed,routes:result.routes.length,deniedRoutes:result.deniedRoutes.length,themes:result.themes.length,pageErrors:result.errors,failure:result.failure})); await browser.close(); }
