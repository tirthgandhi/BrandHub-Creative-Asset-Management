import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Project } from "../src/models/Project.js";
import { Asset } from "../src/models/Asset.js";
import { hashPassword } from "../src/utils/password.js";
import { nextStatus } from "../src/utils/reviewStateMachine.js";
let mongo, app, accounts;
before(async()=>{
 mongo=await MongoMemoryServer.create({binary:{version:"7.0.14"}});await connectDatabase(mongo.getUri());app=createApp({authRateLimit:1000});
 const passwordHash=await hashPassword("Brand123");await User.init();
 const roles=["super_admin","project_manager","designer","client"];
 accounts=Object.fromEntries(await Promise.all(roles.map(async role=>[role,await User.create({name:`Audit ${role}`,email:`${role}@hierarchy.test`,role,passwordHash})])));
});
after(async()=>{await disconnectDatabase();await mongo?.stop();});
async function actor(role){const agent=request.agent(app);const auth=await agent.post('/api/auth/login').send({email:accounts[role].email,password:'Brand123',role}).expect(200);return{agent,csrf:auth.body.data.csrfToken};}
test('only Super Admin can create project managers and privileged roles cannot be self-granted',async()=>{
 const manager=await actor('project_manager'),superAdmin=await actor('super_admin');
 const body={name:'Second Project Manager',email:'second@hierarchy.test',role:'project_manager',initialPassword:'Brand123'};
 await manager.agent.post('/api/users').set('X-CSRF-Token',manager.csrf).send(body).expect(403);
 await manager.agent.patch(`/api/users/${accounts.client.id}`).set('X-CSRF-Token',manager.csrf).send({role:'project_manager'}).expect(403);
 const created=await superAdmin.agent.post('/api/users').set('X-CSRF-Token',superAdmin.csrf).send(body).expect(201);assert.equal(created.body.data.user.role,'project_manager');
 await superAdmin.agent.patch(`/api/users/${accounts.client.id}`).set('X-CSRF-Token',superAdmin.csrf).send({role:'super_admin'}).expect(403);
 await superAdmin.agent.post('/api/users').set('X-CSRF-Token',superAdmin.csrf).send({...body,email:'another-super@hierarchy.test',role:'super_admin'}).expect(422);
});
test('exactly one Super Admin is enforced by the database and protected from deactivation or demotion',async()=>{
 await assert.rejects(User.create({name:'Duplicate Super',email:'duplicate@hierarchy.test',role:'super_admin',passwordHash:await hashPassword('Brand123')}),error=>error.code===11000);
 const actorSuper=await actor('super_admin');
 for(const body of [{isActive:false},{role:'client'}])await actorSuper.agent.patch(`/api/users/${accounts.super_admin.id}`).set('X-CSRF-Token',actorSuper.csrf).send(body).expect(409);
 assert.equal(await User.countDocuments({role:'super_admin'}),1);
});
test('project managers cannot inspect or modify privileged accounts; Super Admin can inspect all',async()=>{
 const m=await actor('project_manager'),s=await actor('super_admin');
 const visible=(await m.agent.get('/api/users').expect(200)).body.data;
 assert.ok(!visible.some(user=>user.role==='super_admin'));assert.ok(!visible.some(user=>user.role==='project_manager'&&user.id!==accounts.project_manager.id));
 await m.agent.get(`/api/users/${accounts.super_admin.id}`).expect(403);
 await m.agent.patch(`/api/users/${accounts.super_admin.id}`).set('X-CSRF-Token',m.csrf).send({name:'Unauthorized'}).expect(403);
 assert.ok((await s.agent.get('/api/users').expect(200)).body.data.some(user=>user.role==='super_admin'));
});
test('analytics come from scoped database records and designer responses do not expose team workload',async()=>{
 const base={description:'Analytics scope and aggregation test',category:'Social Media',clientId:accounts.client._id,designerIds:[accounts.designer._id],createdBy:accounts.project_manager._id};
 const active=await Project.create({...base,title:'Active work',status:'active'});await Project.create({...base,title:'Completed work',status:'completed'});
 const other=await User.create({name:'Other designer',email:'other-designer@hierarchy.test',role:'designer',passwordHash:await hashPassword('Brand123')});
 await Project.create({...base,title:'Unassigned private work',designerIds:[other._id],status:'on_hold'});
 const file={publicId:'gridfs:000000000000000000000001',storageVersion:1,bytes:3,format:'png',width:1,height:1};
 await Asset.create({projectId:active._id,uploadedBy:accounts.designer._id,title:'Approved design',category:'Social Media',status:'approved',currentFile:file});
 const designer=await actor('designer'),manager=await actor('project_manager'),s=await actor('super_admin');
 const d=(await designer.agent.get('/api/dashboard/stats').expect(200)).body.data;assert.equal(d.metrics.projects,2);assert.equal(d.metrics.assets.approved,1);assert.equal(d.analytics.projectStatuses.on_hold,0);assert.deepEqual(d.analytics.workload,[]);
 for(const owner of [manager,s]){const stats=(await owner.agent.get('/api/dashboard/stats').expect(200)).body.data;assert.equal(stats.metrics.projects,3);assert.equal(stats.analytics.projectStatuses.active,1);assert.equal(stats.analytics.projectStatuses.completed,1);assert.equal(stats.analytics.projectStatuses.on_hold,1);assert.equal(stats.analytics.workload.find(row=>row.id===accounts.designer.id).projects,1);}
 assert.equal(nextStatus('draft','submit','super_admin').status,'in_review');assert.equal(nextStatus('in_review','approve','super_admin').status,'approved');
});
