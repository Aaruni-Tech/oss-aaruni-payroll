import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const destination=path.resolve(process.argv[2] || path.join(root,'..','portfolio-exports'));
for(const [target,name] of [['corporate','aarunitech-web'],['cloud','aarunicloud-platform']]) {
  const out=path.join(destination,name);
  if(fs.existsSync(out)) throw new Error(`Destination already exists: ${out}`);
  execFileSync(process.execPath,['scripts/build-target.mjs',target],{cwd:root,stdio:'inherit'});
  fs.mkdirSync(out,{recursive:true});
  const copy=(file)=>{const dest=path.join(out,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,file),dest)};
  const files=['src/deployment_worker.mjs','scripts/build-target.mjs','migrations/inquiries.sql','LICENSE','docs/deployment-boundaries.md','docs/claims-and-readiness.md'];
  if(target==='cloud') files.push('src/cloud_api_v1.js','src/service_catalog.mjs','scripts/sync-catalog.mjs');
  files.forEach(copy);
  fs.cpSync(path.join(root,'dist',target),path.join(out,'public'),{recursive:true});
  fs.rmSync(path.join(out,'public/_worker.js'));
  const sourceSha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  fs.writeFileSync(path.join(out,'SOURCE-PROVENANCE.json'),JSON.stringify({sourceRepository:'https://github.com/Aaruni-Tech/oss-aaruni-payroll',sourceCommit:sourceSha,target,exportedAt:new Date().toISOString(),history:'Original history remains in source repository; allowlisted export only'},null,2)+'\n');
  fs.writeFileSync(path.join(out,'.gitignore'),'node_modules/\ndist/\n.wrangler/\n.env\n.dev.vars\n');
  fs.writeFileSync(path.join(out,'package.json'),JSON.stringify({name,private:true,type:'module',scripts:{build:target==='cloud'?`node scripts/sync-catalog.mjs && node scripts/build-target.mjs ${target}`:`node scripts/build-target.mjs ${target}`,test:'node --test tests/target.test.mjs'},engines:{node:'>=24'}},null,2)+'\n');
  fs.mkdirSync(path.join(out,'tests'),{recursive:true});
  fs.writeFileSync(path.join(out,'tests/target.test.mjs'),`import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport fs from 'node:fs';\nimport worker from '../dist/${target}/_worker.js';\ntest('root resolves to the intended product',async()=>{ const r=await worker.fetch(new Request('https://${target==='corporate'?'aarunitech.com':'aarunicloud.com'}/'),{ASSETS:{fetch:async r=>new Response(new URL(r.url).pathname)}}); assert.equal(await r.text(),'/${target==='corporate'?'index':'cloud'}.html'); });\ntest('no employee assets are exported',()=>{assert.ok(!fs.readdirSync('public',{recursive:true}).some(p=>/^(photos|id-cards)(\\/|$)|portal\\.html|payroll\\.apk/.test(p)));});\ntest('staff routes are unavailable',async()=>{assert.equal((await worker.fetch(new Request('https://example.com/portal'),{})).status,404)});\n`);
  fs.writeFileSync(path.join(out,'wrangler.jsonc'),JSON.stringify({name,compatibility_date:'2026-11-01',pages_build_output_dir:`dist/${target}`},null,2)+'\n');
  fs.writeFileSync(path.join(out,'README.md'),`# ${target==='corporate'?'Aaruni Tech corporate website':'Aaruni Cloud platform'}\n\n${target==='corporate'?'Corporate website and inquiry intake for Aaruni Tech.':'Cloud website, console, and API for Aaruni Cloud, a product of Aaruni Tech.'}\n\n**Staging source destination. Production domains have not been moved.** Exported from the existing combined repository using an explicit file allowlist. Staff photos, payroll records, ID cards, and payroll database configuration are excluded. See SOURCE-PROVENANCE.json for the original commit.\n\n## Local build and tests\n\nRequires Node.js 24 or later. No npm dependencies are required.\n\n\`\`\`sh\nnpm run build\nnpm test\n\`\`\`\n\nCloudflare Pages build command: \`npm run build\`. Output directory: \`dist/${target}\`. Configure a **dedicated** D1 binding named \`DB\` in the new project. The included inquiry migration is not a full Cloud schema. No production IDs or credentials are included.\n\nRead [deployment boundaries](docs/deployment-boundaries.md) and [claims and readiness](docs/claims-and-readiness.md) before attaching domains. Do not use payroll bindings.\n\n${target==='cloud'?'The Cloud API preserves existing source behavior. Production authentication, source-managed owner records, tenant isolation, provider integrations, billing and data migration still require verification. The service catalog deliberately leaves unverified release states explicit.\n':''}`);
  fs.mkdirSync(path.join(out,'.github/workflows'),{recursive:true});
  fs.writeFileSync(path.join(out,'.github/workflows/checks.yml'),'name: Build and test\non: [push, pull_request]\npermissions:\n  contents: read\njobs:\n  check:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: "24"\n      - run: npm run build\n      - run: npm test\n');
  console.log(`Exported ${name}: ${out}`);
}
