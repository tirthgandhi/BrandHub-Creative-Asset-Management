import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { ProjectRequest } from '../src/models/ProjectRequest.js';
import { hashPassword } from '../src/utils/password.js';
let mongo,app,users;
before(async()=>{mongo=await MongoMemoryServer.create({binary:{version:'7.0.14'}});await connectDatabase(mongo.getUri());app=createApp({authRateLimit:1000});const passwordHash=await hashPassword('Brand123');users={};for(const role of ['project_manager','designer','client'])users[role]=await User.create({name:`Payment ${role}`,email:`${role}@payment.test`,role,passwordHash});});
after(async()=>{await disconnectDatabase();await mongo?.stop();});
async function actor(role){const agent=request.agent(app);const auth=await agent.post('/api/auth/login').send({email:users[role].email,password:'Brand123',role}).expect(200);return{agent,csrf:auth.body.data.csrfToken};}
const brief={title:'Brand campaign with budget',description:'Create a launch campaign with contact details and proposed amount.',category:'Social Media',amount:12500.50,contactDetails:{name:'Iris Demo',email:'iris@example.com',phone:'+91 98765 43210',company:'GlowTheory'}};
test('request persists contact and exact INR amount, manager sees both, invalid inputs are rejected',async()=>{
 const c=await actor('client'),m=await actor('project_manager');
 for(const change of [{amount:-1},{amount:1.234},{contactDetails:{...brief.contactDetails,email:'invalid'}},{contactDetails:{...brief.contactDetails,phone:'abc'}}])await c.agent.post('/api/project-requests').set('X-CSRF-Token',c.csrf).send({...brief,...change}).expect(422);
 const created=await c.agent.post('/api/project-requests').set('X-CSRF-Token',c.csrf).send(brief).expect(201);const row=created.body.data.projectRequest;
 assert.equal(row.amount,12500.5);assert.equal(row.contactDetails.phone,brief.contactDetails.phone);assert.equal((await ProjectRequest.findById(row.id)).amountPaise,1250050);
 const viewed=(await m.agent.get(`/api/project-requests/${row.id}`).expect(200)).body.data.projectRequest;assert.equal(viewed.contactDetails.email,brief.contactDetails.email);assert.equal(viewed.amount,12500.5);
 await c.agent.post(`/api/project-requests/${row.id}/payment`).set('X-CSRF-Token',c.csrf).send({method:'upi'}).expect(409);
});
test('dummy checkout is owner-only, approved-only, handles decline, and persists an idempotent receipt',async()=>{
 const c=await actor('client'),m=await actor('project_manager'),d=await actor('designer');
 const row=(await c.agent.post('/api/project-requests').set('X-CSRF-Token',c.csrf).send({...brief,title:'Payment lifecycle'}).expect(201)).body.data.projectRequest;
 await m.agent.patch(`/api/project-requests/${row.id}`).set('X-CSRF-Token',m.csrf).send({decision:'approve',designerIds:[users.designer.id]}).expect(200);
 const path=`/api/project-requests/${row.id}/payment`;
 await m.agent.post(path).set('X-CSRF-Token',m.csrf).send({method:'upi'}).expect(403);await d.agent.post(path).set('X-CSRF-Token',d.csrf).send({method:'upi'}).expect(403);
 const outsider=request.agent(app);const auth=await outsider.post('/api/auth/register').send({name:'Unrelated client',email:'outside@payment.test',password:'Brand123'}).expect(201);
 await outsider.post(path).set('X-CSRF-Token',auth.body.data.csrfToken).send({method:'upi'}).expect(404);
 await c.agent.post(path).set('X-CSRF-Token',c.csrf).send({method:'card',outcome:'failure'}).expect(402);assert.equal((await ProjectRequest.findById(row.id)).paymentStatus,'unpaid');
 await c.agent.post(path).set('X-CSRF-Token',c.csrf).send({method:'upi',amount:1}).expect(422);
 const paid=(await c.agent.post(path).set('X-CSRF-Token',c.csrf).send({method:'upi'}).expect(200)).body.data.projectRequest;assert.equal(paid.payment.status,'paid');assert.equal(paid.payment.amount,12500.5);assert.ok(paid.payment.reference.startsWith('DEMO-'));assert.equal(paid.payment.isDemo,true);
 const retried=(await c.agent.post(path).set('X-CSRF-Token',c.csrf).send({method:'card'}).expect(200)).body.data.projectRequest;assert.equal(retried.payment.reference,paid.payment.reference);assert.equal(retried.payment.method,'upi');
 const persisted=(await m.agent.get(`/api/project-requests/${row.id}`).expect(200)).body.data.projectRequest;assert.equal(persisted.payment.reference,paid.payment.reference);
});
