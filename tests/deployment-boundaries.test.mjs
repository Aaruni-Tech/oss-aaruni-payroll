import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { SERVICE_CATALOG } from '../src/service_catalog.mjs';
import { createDeploymentWorker, handleInquiry, queryDatabase } from '../src/deployment_worker.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const target of ['corporate','cloud','payroll']) execFileSync(process.execPath,['scripts/build-target.mjs',target],{cwd:root});
const request = (route, host='aarunicloud.com') => new Request(`https://${host}${route}`);
const assets = { ASSETS: { fetch: async r => new Response(new URL(r.url).pathname) } };

test('all 12 service codes are unique and restricted infrastructure stays internal', () => {
  assert.equal(SERVICE_CATALOG.length,12);
  assert.equal(new Set(SERVICE_CATALOG.map(s=>s.code)).size,12);
  assert.equal(new Set(SERVICE_CATALOG.map(s=>s.id)).size,12);
  for(const code of ['COMPUTE','CONTAINERS','RENDER']) assert.equal(SERVICE_CATALOG.find(s=>s.code===code).availability,'internal');
});
test('corporate cannot serve Cloud API or staff pages; Cloud routes console host correctly',async()=>{
  const corporate=createDeploymentWorker('corporate');
  assert.equal((await corporate.fetch(request('/v1/status'),assets)).status,404);
  assert.equal((await corporate.fetch(request('/portal'),assets)).status,404);
  assert.equal(await (await corporate.fetch(request('/'),assets)).text(),'/index.html');
  const cloud=createDeploymentWorker('cloud',async()=>new Response('gateway'));
  assert.equal(await(await cloud.fetch(request('/','console.aarunicloud.com'),assets)).text(),'/console.html');
  assert.equal(await(await cloud.fetch(request('/'),assets)).text(),'/cloud.html');
  assert.equal(await(await cloud.fetch(request('/docs'),assets)).text(),'/docs.html');
  assert.equal((await cloud.fetch(request('/portal'),assets)).status,404);
  assert.equal(await(await cloud.fetch(request('/v1/status'),assets)).text(),'gateway');
});
test('isolated public builds contain no staff photos, IDs, payroll or mockup pages',()=>{
  for(const target of ['corporate','cloud']) {
    const dir=path.join(root,'dist',target);
    const files=fs.readdirSync(dir,{recursive:true});
    assert.ok(!files.some(p=>/^(photos|id-cards)(\/|$)|portal\.html|mockup_|payroll\.apk/.test(p)));
    const worker=fs.readFileSync(path.join(dir,'_worker.js'),'utf8');
    assert.ok(!worker.includes('PRE_SEEDED_OWNER_ADMIN_KEY_HASH'));
    assert.ok(!worker.includes('CLOUDFLARE_API_TOKEN'));
    assert.ok(!worker.includes('aaruni_payroll_db'));
  }
});
test('compiled Cloud catalog and unauthenticated infrastructure requests respect access gates',async()=>{
  const {default:worker}=await import(pathToFileURL(path.join(root,'dist/cloud/_worker.js')));
  const response=await worker.fetch(request('/v1/services'),assets);
  const data=await response.json();
  assert.equal(data.count,12); assert.deepEqual(data.services,SERVICE_CATALOG);
  const health=await(await worker.fetch(request('/v1/status'),assets)).json();
  assert.match(health.readiness,/not verified/);
  assert.equal(health.privateMetrics,undefined);
  for(const route of ['/v1/compute/nodes','/v1/guard/whoami']) {
    assert.equal((await worker.fetch(request(route),assets)).status,401);
  }
});
test('isolated targets fail closed without dedicated DB; no in-memory or payroll fallback',async()=>{
  await assert.rejects(()=>queryDatabase({},'SELECT 1'),/dedicated D1/);
  const response=await handleInquiry(new Request('https://aarunitech.com/api/inquiries',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'tester@example.com',message:'Please contact us'})}),{});
  assert.equal(response.status,503);
  assert.equal((await response.json()).success,false);
});
test('inquiries reject public reads, malformed data and oversized streams; success requires actual insert',async()=>{
  assert.equal((await handleInquiry(request('/api/inquiries'),{})).status,405);
  const post=(body)=>new Request('https://aarunitech.com/api/inquiries',{method:'POST',headers:{'content-type':'application/json'},body});
  assert.equal((await handleInquiry(post('{'),{})).status,400);
  assert.equal((await handleInquiry(post('x'.repeat(17000)),{})).status,413);
  assert.equal((await handleInquiry(post('{}'),{})).status,400);
  let inserted=false;
  const env={DB:{prepare(sql){assert.match(sql,/INSERT INTO inquiries/);return {bind(...params){assert.equal(params[1],'tester@example.com');return {async run(){inserted=true;return {success:true}}}}}}}};
  const response=await handleInquiry(post(JSON.stringify({email:'tester@example.com',message:'Demo request'})),env);
  assert.equal(response.status,201);assert.ok(inserted);
  const data=await response.json(); assert.match(data.ref,/^INQ-/);assert.equal(data.emailDelivery.sent,false);
});
test('payroll build routes root to staff page and rejects Cloud API',async()=>{
  const {default:worker}=await import(pathToFileURL(path.join(root,'dist/payroll/_worker.js')));
  assert.equal(await(await worker.fetch(request('/','my.aarunitech.com'),assets)).text(),'/portal.html');
  assert.equal((await worker.fetch(request('/v1/status','my.aarunitech.com'),assets)).status,404);
});
