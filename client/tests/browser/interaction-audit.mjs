import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const origin=process.env.BRANDHUB_TEST_URL||"http://127.0.0.1:5175";
const browser=await chromium.launch({executablePath:process.env.BRANDHUB_BROWSER||"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",headless:true});
const result={checks:[]};
async function go(page,path){await page.goto(origin+path,{waitUntil:"domcontentloaded"});await page.locator('h1').waitFor();await page.locator('.skeleton').first().waitFor({state:'hidden'});}
try{
 const context=await browser.newContext();const page=await context.newPage();
 await go(page,'/login');await page.getByRole('button',{name:'Sign in as Client',exact:true}).click();await page.getByRole('alert').getByText('Email is required.').waitFor();result.checks.push('Empty login shows an actionable error');
 await page.getByRole('button',{name:'Project Manager',exact:true}).click();await page.locator('#login-email').fill('iris.vale@brandhub.example');await page.locator('#login-password').fill('Brand123');
 const mismatch=page.waitForResponse(response=>response.url().endsWith('/api/auth/login'));
 await page.getByRole('button',{name:'Sign in as Project Manager',exact:true}).click();assert.equal((await mismatch).status(),403);await page.getByRole('alert').getByText(/does not belong/).waitFor();assert.ok(page.url().endsWith('/login'));result.checks.push('Wrong role login returns 403 and stays on login');
 await page.locator('#login-email').fill('admin@brandhub.example');await page.locator('#login-password').fill('Brand123');await page.getByRole('button',{name:'Sign in as Project Manager',exact:true}).click();await page.waitForURL(/\/app\/(dashboard|projects)$/, { waitUntil: "domcontentloaded" });
 await go(page,'/app/admin/users');await page.getByRole('textbox',{name:'Search users'}).fill('iris.vale');await page.getByText('iris.vale@brandhub.example',{exact:true}).waitFor();await page.waitForFunction(()=>globalThis.document.querySelectorAll('.user-card').length===1);result.checks.push('Admin user search returns the matching client');
 await page.getByRole('combobox',{name:'Filter by role'}).selectOption('designer');await page.getByRole('heading',{name:'No users found'}).waitFor();result.checks.push('Admin combined search and role filter handles empty results');
 await go(page,'/app/projects');await page.getByRole('textbox',{name:'Search projects'}).fill('no-match-prototype-audit-xyz');await page.getByRole('heading',{name:'No matching projects'}).waitFor();await page.getByRole('button',{name:'Clear filters'}).click();await page.locator('.workspace-card').first().waitFor();result.checks.push('Project search and clear filters update the list');
 await page.getByRole('button',{name:'Log out',exact:true}).click();await page.waitForURL('**/login', { waitUntil: "domcontentloaded" });
 await page.getByRole('button',{name:'Client',exact:true}).click();await page.locator('#login-email').fill('iris.vale@brandhub.example');await page.locator('#login-password').fill('Brand123');await page.getByRole('button',{name:'Sign in as Client',exact:true}).click();await page.waitForURL(/\/app\/(dashboard|projects)$/, { waitUntil: "domcontentloaded" });
 await go(page,'/app/media');assert.equal(await page.getByRole('link',{name:'Upload media',exact:true}).count(),0);result.checks.push('Client media gallery hides the upload action');
 const scope=await page.evaluate(async()=>{const me=await fetch('/api/auth/me').then(response=>response.json());const projects=await fetch('/api/projects?limit=50').then(response=>response.json());return{userId:me.data.user.id,projects:projects.data};});assert.ok(scope.projects.length);assert.ok(scope.projects.every(project=>project.clientId===scope.userId));result.checks.push('Client project API contains only the signed-in client allocation');
 await context.close();result.passed=true;
}catch(error){result.passed=false;result.failure=error.message;process.exitCode=1;}
finally{await fs.writeFile('docs/testing/prototype/role-audit/interaction-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();}
