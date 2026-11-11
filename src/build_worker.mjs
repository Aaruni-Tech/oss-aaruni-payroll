import fs from "node:fs";
import path from "node:path";

const dir = "/Users/rupesh/.gemini/antigravity/scratch/aaruni-payroll-repo";
const cloudApi = fs
  .readFileSync(path.join(dir, "src/cloud_api_v1.js"), "utf8")
  .replace("export async function handleCloudApiV1", "async function handleCloudApiV1");

let base = fs.readFileSync(path.join(dir, "src/base_worker.js"), "utf8");

const targetHook = `    // Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }`;

const replacementHook = `    // Aaruni Cloud v1 Production API Gateway (api.aarunicloud.com & /v1/* & /api/v1/*)
    if (
      host === "api.aarunicloud.com" ||
      url.pathname === "/v1" ||
      url.pathname.startsWith("/v1/") ||
      url.pathname.startsWith("/api/v1/")
    ) {
      return handleCloudApiV1(request, env, executeD1Query);
    }

    // Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }`;

if (!base.includes(targetHook)) {
  throw new Error("Target hook not found in base_worker.js");
}

base = base.replace(targetHook, replacementHook);

const combined = `${cloudApi}\n\n${base}`;
fs.writeFileSync(path.join(dir, "public/_worker.js"), combined, "utf8");
console.log("Built public/_worker.js successfully! Bytes:", combined.length);
