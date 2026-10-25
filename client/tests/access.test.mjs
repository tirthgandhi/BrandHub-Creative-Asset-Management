import test from "node:test";
import assert from "node:assert/strict";
import { canVisit, loginDestination } from "../src/config/access.ts";

test("clients cannot redirect into admin, design uploads or unrelated discovery",()=>{
 for(const path of ["/app/admin/users","/app/admin/requests","/app/projects/new","/app/projects/example/edit","/app/assets/upload","/app/media/upload","/app/explore"])assert.equal(canVisit(path,"client"),false,path);
 assert.equal(canVisit("/app/requests/new","client"),true);
 assert.equal(canVisit("/app/projects/example","client"),true);
});
test("designers can upload but cannot administer or submit client briefs",()=>{
 for(const path of ["/app/admin/users","/app/projects/new","/app/requests/new"])assert.equal(canVisit(path,"designer"),false,path);
 assert.equal(canVisit("/app/assets/upload","designer"),true);
 assert.equal(canVisit("/app/media/upload","designer"),true);
});
test("login redirects stay in the app and honor the account role",()=>{
 for(const path of ["https://example.com","//example.com","/app/../admin","/login",null,42])assert.equal(loginDestination(path,"project_manager"),"/app/dashboard");
 assert.equal(loginDestination("/app/admin/users","client"),"/app/dashboard");
 assert.equal(loginDestination("/app/admin/users","project_manager"),"/app/admin/users");
 assert.equal(loginDestination("/app/requests","project_manager"),"/app/dashboard");
});

test("Super Admin can reach management routes without gaining client-only actions",()=>{
 assert.equal(canVisit("/app/admin/users","super_admin"),true);
 assert.equal(canVisit("/app/projects/new","super_admin"),true);
 assert.equal(canVisit("/app/requests/new","super_admin"),false);
});

test("only Super Admin can open privileged user administration",()=>{
 for(const role of ["client","designer","project_manager"])assert.equal(canVisit("/app/super-admin/users",role),false);
 assert.equal(canVisit("/app/super-admin/users","super_admin"),true);
 assert.equal(canVisit("/app/management/users","project_manager"),true);
});
