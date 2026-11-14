import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv[2];
if (!['corporate', 'cloud', 'payroll'].includes(target)) throw new Error('Use corporate, cloud, or payroll');
const out = path.join(root, 'dist', target);
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const files = target === 'payroll' ? ['portal.html', 'manifest.json', 'sw.js'] : target === 'corporate' ? ['index.html', 'trust.html'] : ['cloud.html','console.html','voice.html','services.html','docs.html','trust.html','service-catalog.json'];
const shared = ['aaruni-brand.css','aaruni_square_logo.png','aaruni_tech_logo.png','aaruni_tech_banner.png','aaruni-cloud-icon.svg','qrcode.min.js'];
function copy(file) { const dest = path.join(out,file); fs.mkdirSync(path.dirname(dest),{recursive:true}); fs.copyFileSync(path.join(root,'public',file),dest); }
for (const file of [...files,...shared]) if (fs.existsSync(path.join(root,'public',file))) copy(file);
// Copy branding/Cloud showcase assets only; no staff photos, ID cards, tax files, or payroll downloads.
for (const file of fs.readdirSync(path.join(root,'public/assets'))) {
  if (/^(aaruni_cloud_|qr_aaruni(cloud|tech))/.test(file)) copy('assets/'+file);
}
if (target === 'cloud') {
  for (const dir of ['sdk','assets/voice']) if(fs.existsSync(path.join(root,'public',dir))) fs.cpSync(path.join(root,'public',dir),path.join(out,dir),{recursive:true});
  for (const file of ['aarunicloud-console.apk','AaruniCloud-v1.0.0.apk']) if(fs.existsSync(path.join(root,'public/downloads',file))) copy('downloads/'+file);
}
if (target === 'payroll') {
  for (const dir of ['photos','id-cards','downloads']) if(fs.existsSync(path.join(root,'public',dir))) fs.cpSync(path.join(root,'public',dir),path.join(out,dir),{recursive:true});
}
let worker = fs.readFileSync(path.join(root,'src/deployment_worker.mjs'),'utf8').replaceAll('export ', '');
if (target === 'cloud') {
  const catalog = fs.readFileSync(path.join(root,'src/service_catalog.mjs'),'utf8').replace('export const','const');
  const api = fs.readFileSync(path.join(root,'src/cloud_api_v1.js'),'utf8').replace('import { SERVICE_CATALOG } from "./service_catalog.mjs";','').replace('export async function','async function');
  worker = catalog + '\n' + api + '\n' + worker;
}
if (target === 'payroll') {
  worker = fs.readFileSync(path.join(root,'src/base_worker.js'),'utf8').replace('export default {', 'const payrollWorker = {');
  worker += `\nexport default { async fetch(request, env) {
    const url = new URL(request.url);
    if (/^\\/(?:v1|api\\/v1|cloud|console|voice)(?:\\/|$)/.test(url.pathname) || url.pathname === '/api/inquiries') return new Response('Not found', {status:404});
    if (url.pathname === '/' || url.pathname === '/index.html') url.pathname = '/portal.html';
    return payrollWorker.fetch(new Request(url, request), env);
  }};\n`;
} else worker += `\nexport default createDeploymentWorker(${JSON.stringify(target)}, ${target==='cloud'?'handleCloudApiV1':'undefined'});\n`;
fs.writeFileSync(path.join(out,'_worker.js'),worker);
const domain = target === 'payroll' ? 'my.aarunitech.com' : target === 'corporate' ? 'aarunitech.com' : 'aarunicloud.com';
fs.writeFileSync(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nDisallow: /console\nDisallow: /api/\nDisallow: /v1/\nSitemap: https://${domain}/sitemap.xml\n`);
const routes = target === 'payroll' ? [] : target==='corporate' ? ['','trust'] : ['','services','docs','trust'];
fs.writeFileSync(path.join(out,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+routes.map(p=>`<url><loc>https://${domain}/${p}</loc></url>`).join('')+'</urlset>');
console.log(`Built isolated ${target} target: ${out}`);
