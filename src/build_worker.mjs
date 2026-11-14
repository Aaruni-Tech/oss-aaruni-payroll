import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SERVICE_CATALOG } from './service_catalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const catalog = read('src/service_catalog.mjs').replace('export const SERVICE_CATALOG', 'const SERVICE_CATALOG');
const api = read('src/cloud_api_v1.js')
  .replace('import { SERVICE_CATALOG } from "./service_catalog.mjs";', '')
  .replace('export async function handleCloudApiV1', 'async function handleCloudApiV1');
let base = read('src/base_worker.js');
const hook = '    // Handle CORS Preflight';
if (!base.includes(hook)) throw new Error('Missing gateway insertion point');
base = base.replace(hook, `    // Cloud API routing; retained for the existing combined deployment.
    if (host === "api.aarunicloud.com" || url.pathname === "/v1" || url.pathname.startsWith("/v1/") || url.pathname.startsWith("/api/v1/")) {
      return handleCloudApiV1(request, env, executeD1Query);
    }

${hook}`);
fs.writeFileSync(path.join(root, 'public/_worker.js'), `${catalog}\n${api}\n${base}`);
await import('../scripts/sync-catalog.mjs');
console.log(`Built combined worker and ${SERVICE_CATALOG.length}-service catalog`);
