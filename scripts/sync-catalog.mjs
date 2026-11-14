import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SERVICE_CATALOG } from '../src/service_catalog.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const frontendCatalog = SERVICE_CATALOG.map(s => ({ ...s, id: s.uiId }));
let html = read('public/cloud.html');
const marker = /\/\* SERVICE_CATALOG_START \*\/[\s\S]*?\/\* SERVICE_CATALOG_END \*\//;
if (!marker.test(html)) throw new Error('Missing frontend catalog insertion point');
html = html.replace(marker, `/* SERVICE_CATALOG_START */\n    const CLOUD_SERVICES = ${JSON.stringify(frontendCatalog, null, 2)};\n    /* SERVICE_CATALOG_END */`);
// Counts derive from the same source as /v1/services.
html = html.replace(/(<button[^>]*data-cat="([^"]+)"[\s\S]*?<span class="rail-count">)\d+(<\/span>)/g,
  (_, before, cat, after) => before + SERVICE_CATALOG.filter(s => cat === 'all' || (cat === 'featured' ? s.featured : s.category === cat)).length + after);
fs.writeFileSync(path.join(root, 'public/cloud.html'), html);
fs.writeFileSync(path.join(root, 'public/service-catalog.json'), JSON.stringify(SERVICE_CATALOG, null, 2) + '\n');

const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const rows = SERVICE_CATALOG.map(s => `<tr><th scope="row">${escape(s.name)}</th><td>${escape(s.desc)}</td><td>${escape(s.access)}</td><td>${escape(s.availabilityLabel)}</td></tr>`).join('');
const servicesPage = read('public/services.html').replace(/<tbody>[\s\S]*?<\/tbody>/, `<tbody>${rows}</tbody>`);
fs.writeFileSync(path.join(root,'public/services.html'), servicesPage);
