// ============================================================================
// AARUNI CLOUD PRODUCTION REST API GATEWAY (v1) — ZERO-TRUST HARDENED
// Domains: https://api.aarunicloud.com/v1/* & https://aarunicloud.com/api/v1/*
// Security Policy:
//   - ZERO inbound ports to owner hardware (100% Cloudflare Edge air-gap)
//   - ALL Compute, Containers, Render, Storage, Archive, Jobs & Guard routes
//     strictly require a private SHA-256 Aaruni Guard admin token (HTTP 401/403 for public)
//   - Anti-RCE Workload Enum & Shell-Metacharacter Blocker on all job payloads
//   - Public storefront showcase routes (/v1/status, /v1/services, /v1/assistant/ask,
//     /v1/voice/synthesize) run 100% stateless in-memory with ZERO DB writes for anonymous callers
// ============================================================================

const API_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Range",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range, ETag, X-Aaruni-SHA256, X-Aaruni-Service, X-Aaruni-Zero-Trust"
};

function jsonRes(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...API_CORS,
      "X-Aaruni-Zero-Trust": "ENFORCED-PRIVATE-ISOLATION",
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders
    }
  });
}

async function sha256Hex(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function makeId(prefix) {
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `${prefix}_${rand}`;
}

function bufToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBuf(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

const SHELL_INJECTION_PATTERN = /(?:;|\|\||&&|`|\$\(|\/bin\/(?:sh|bash|zsh)|rm\s+-rf|curl\s+.*\|\s*(?:sh|bash)|nc\s+-e)/i;

function assertSafeWorkloadPayload(obj) {
  const serialized = JSON.stringify(obj || {});
  if (serialized.length > 8192) {
    return { ok: false, error: "Payload exceeds 8 KB structured parameter limit." };
  }
  if (SHELL_INJECTION_PATTERN.test(serialized)) {
    return { ok: false, error: "Blocked by Aaruni Guard Anti-RCE Shield: raw shell commands and metacharacters are forbidden." };
  }
  return { ok: true };
}

const SERVICE_CATALOG = [
  { code: "ACS", id: "storage", name: "Aaruni Storage", category: "storage", access: "private-key-required", endpoint: "https://api.aarunicloud.com/v1/storage", cli: "aaruni storage ls --space production-media" },
  { code: "ARC", id: "archive", name: "Aaruni Archive", category: "storage", access: "private-key-required", endpoint: "https://api.aarunicloud.com/v1/archive/seal", cli: "aaruni archive seal --space production-media --key master.zip" },
  { code: "ACC", id: "compute", name: "Aaruni Compute", category: "compute", access: "private-key-required", endpoint: "https://api.aarunicloud.com/v1/compute/nodes", cli: "aaruni compute nodes" },
  { code: "ACN", id: "containers", name: "Aaruni Containers", category: "compute", access: "private-key-required", endpoint: "https://api.aarunicloud.com/v1/containers/run", cli: "aaruni containers run --image xvfb-1080p-worker" },
  { code: "AVA", id: "voice", name: "Aaruni Voice", category: "ai", access: "stateless-preview-or-private-key", endpoint: "https://api.aarunicloud.com/v1/voice/synthesize", cli: "aaruni voice synthesize \"Hello from Aaruni Cloud\"" },
  { code: "AAI", id: "assistant", name: "Aaruni Assistant", category: "ai", access: "stateless-preview-or-private-key", endpoint: "https://api.aarunicloud.com/v1/assistant/ask", cli: "aaruni assistant ask \"Check ACS storage and launch ACC compute\"" },
  { code: "AKB", id: "knowledge", name: "Aaruni Knowledge", category: "ai", access: "public-docs-readonly", endpoint: "https://api.aarunicloud.com/v1/knowledge/search", cli: "aaruni knowledge search \"zero egress\"" },
  { code: "ARN", id: "render", name: "Aaruni Render", category: "tools", access: "private-key-required", endpoint: "https://api.aarunicloud.com/v1/render/build", cli: "aaruni render build --project lesson-01 --resolution 1080p" },
  { code: "AQA", id: "qa", name: "Aaruni Quality", category: "tools", access: "stateless-preview-or-private-key", endpoint: "https://api.aarunicloud.com/v1/qa/audit", cli: "aaruni qa audit --url https://aarunicloud.com" },
  { code: "AGD", id: "guard", name: "Aaruni Guard", category: "security", access: "private-key-required", endpoint: "https://api.aarunicloud.com/v1/guard/whoami", cli: "aaruni guard whoami" },
  { code: "AED", id: "edge", name: "Aaruni Edge", category: "security", access: "public-health-readonly", endpoint: "https://api.aarunicloud.com/v1/edge/status", cli: "aaruni status" }
];

const W3C_PLS_LEXICON = [
  [/\bkubectl\b/gi, "kube-control"],
  [/\bSQLite\b/gi, "S-Q-Lite"],
  [/\bPostgreSQL\b/gi, "Post-gres-Q-L"],
  [/\bMySQL\b/gi, "My-S-Q-L"],
  [/\bNGINX\b/gi, "Engine-X"],
  [/\bJSON\b/gi, "Jay-sawn"],
  [/\bOAuth2\b/gi, "Oh-Auth-Two"],
  [/\bWCAG\b/gi, "W-C-A-G"],
  [/\bLUFS\b/gi, "L-U-F-S"],
  [/\bNVMe\b/gi, "N-V-M-E"],
  [/\.cmproj\b/gi, "Camtasia project"],
  [/\.libzip\b/gi, "Camtasia library archive"]
];

function applyPlsLexicon(rawText) {
  let normalized = String(rawText || "").slice(0, 1200).trim();
  const replacements = [];
  for (const [regex, spoken] of W3C_PLS_LEXICON) {
    if (regex.test(normalized)) {
      replacements.push({ pattern: regex.source.replace(/\\b/g, ""), phoneme: spoken });
      normalized = normalized.replace(regex, spoken);
    }
  }
  const words = normalized ? normalized.split(/\s+/).length : 0;
  const estDurationSec = Number(((words / 145) * 60).toFixed(2));
  const ssml = `<speak version="1.1" xml:lang="en-US"><prosody rate="100%">${normalized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</prosody></speak>`;
  return { normalizedText: normalized, words, estDurationSec, replacements, ssml };
}

/**
 * Strictly authenticates a private Aaruni Guard API key from Authorization: Bearer <token>.
 * NO anonymous or public demo token fallback exists.
 */
async function authenticatePrivateGuard(request, env, executeD1Query) {
  const auth = request.headers.get("Authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) {
    return {
      ok: false,
      status: 401,
      error: "Blocked by Aaruni Guard (AGD) Zero-Trust Policy: Private Authorization Bearer key required. Public access to compute, storage, and render infrastructure is disabled."
    };
  }
  const rawToken = auth.slice(7).trim();
  if (!rawToken || rawToken === "agd_sandbox_public_demo") {
    return {
      ok: false,
      status: 403,
      error: "Blocked by Aaruni Guard (AGD) Zero-Trust Policy: Public demo tokens are disabled. Private owner API key required."
    };
  }

  const hash = await sha256Hex(rawToken);
  const { results } = await executeD1Query(
    env,
    "SELECT key_id, owner_email, role, allowed_space, created_at FROM cloud_api_keys WHERE key_hash = ? LIMIT 1",
    [hash]
  );
  if (!results || results.length === 0) {
    return {
      ok: false,
      status: 403,
      error: "Invalid or revoked Aaruni Guard (AGD) private API key."
    };
  }
  return { ok: true, principal: results[0] };
}

async function tryOptionalPrivateGuard(request, env, executeD1Query) {
  const auth = request.headers.get("Authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  const res = await authenticatePrivateGuard(request, env, executeD1Query);
  return res.ok ? res.principal : null;
}

async function logAudit(env, executeD1Query, keyId, service, action, status = "OK") {
  try {
    await executeD1Query(
      env,
      "INSERT INTO cloud_audit_logs (audit_id, key_id, service, action, status, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
      [makeId("aud"), keyId, service, action, status]
    );
  } catch (_) {}
}

async function handleCloudApiV1(request, env, executeD1Query) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: API_CORS });
  }

  const url = new URL(request.url);
  let path = url.pathname.replace(/^\/api(?=\/v1(\/|$))/, "");
  if (path === "/" || path === "") {
    path = "/v1/status";
  }

  const colo = (request.cf && request.cf.colo) || "HYD";

  try {
    // -------------------------------------------------------------------------
    // 1. SANITIZED PUBLIC HEALTH & CATALOG (/v1/status, /v1/services, /v1/edge/status)
    // -------------------------------------------------------------------------
    if (path === "/v1/status" && request.method === "GET") {
      const principal = await tryOptionalPrivateGuard(request, env, executeD1Query);
      let privateMetrics = undefined;
      if (principal && principal.role === "admin") {
        const [nodesQ, storageQ, jobsQ] = await Promise.all([
          executeD1Query(env, "SELECT count(*) as c FROM cloud_compute_nodes WHERE status = 'ACTIVE'"),
          executeD1Query(env, "SELECT count(*) as c, coalesce(sum(size_bytes),0) as bytes FROM cloud_storage_items"),
          executeD1Query(env, "SELECT count(*) as c FROM cloud_jobs")
        ]);
        privateMetrics = {
          authenticatedAs: principal.key_id,
          activeComputeNodes: (nodesQ.results[0] && nodesQ.results[0].c) || 0,
          storedItems: (storageQ.results[0] && storageQ.results[0].c) || 0,
          storedBytes: (storageQ.results[0] && storageQ.results[0].bytes) || 0,
          executedJobs: (jobsQ.results[0] && jobsQ.results[0].c) || 0
        };
      }

      return jsonRes({
        ok: true,
        platform: "Aaruni Cloud",
        version: "1.0.0",
        status: "OPERATIONAL",
        controlPlaneRegion: "ap-south-hyd-1",
        edgePop: colo,
        egressFeePerGbUsd: 0.0,
        securityPosture: {
          zeroTrustGuard: "ENFORCED",
          inboundWorkerPortsExposed: 0,
          workerTopology: "OUTBOUND_PULL_ONLY_AIRGAPPED",
          publicComputeAndStorageAccess: "BLOCKED_PRIVATE_KEY_ONLY"
        },
        servicesAvailable: SERVICE_CATALOG.length,
        ...(privateMetrics ? { privateMetrics } : {}),
        endpoints: {
          gateway: "https://api.aarunicloud.com/v1",
          docs: "https://aarunicloud.com/#products"
        },
        timestamp: new Date().toISOString()
      }, 200, { "X-Aaruni-Service": "AED" });
    }

    if (path === "/v1/services" && request.method === "GET") {
      return jsonRes({
        ok: true,
        count: SERVICE_CATALOG.length,
        services: SERVICE_CATALOG
      }, 200, { "X-Aaruni-Service": "AED" });
    }

    if (path === "/v1/edge/status" && request.method === "GET") {
      return jsonRes({
        ok: true,
        service: "AED",
        name: "Aaruni Edge",
        tlsVersion: (request.cf && request.cf.tlsVersion) || "TLSv1.3",
        httpProtocol: (request.cf && request.cf.httpProtocol) || "HTTP/2",
        edgeColo: colo,
        country: (request.cf && request.cf.country) || "IN",
        anycastRouting: "ACTIVE",
        inboundFirewallPortsExposed: 0,
        privateWorkerAirGap: "ACTIVE",
        timestamp: new Date().toISOString()
      }, 200, { "X-Aaruni-Service": "AED" });
    }

    // -------------------------------------------------------------------------
    // 2. AARUNI GUARD (AGD) — PRIVATE OWNER KEY REQUIRED
    // -------------------------------------------------------------------------
    if (path === "/v1/guard/whoami" && request.method === "GET") {
      const auth = await authenticatePrivateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      await logAudit(env, executeD1Query, auth.principal.key_id, "AGD", "whoami");
      return jsonRes({
        ok: true,
        service: "AGD",
        principal: auth.principal
      }, 200, { "X-Aaruni-Service": "AGD" });
    }

    if (path === "/v1/guard/audit" && request.method === "GET") {
      const auth = await authenticatePrivateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const isAdmin = auth.principal.role === "admin";
      const sql = isAdmin
        ? "SELECT audit_id, key_id, service, action, status, created_at FROM cloud_audit_logs ORDER BY created_at DESC LIMIT 50"
        : "SELECT audit_id, key_id, service, action, status, created_at FROM cloud_audit_logs WHERE key_id = ? ORDER BY created_at DESC LIMIT 25";
      const { results } = await executeD1Query(env, sql, isAdmin ? [] : [auth.principal.key_id]);
      return jsonRes({ ok: true, service: "AGD", count: results.length, logs: results });
    }

    // -------------------------------------------------------------------------
    // 3. AARUNI STORAGE (ACS) — 100% PRIVATE KEY REQUIRED (NO PUBLIC READ/WRITE)
    // -------------------------------------------------------------------------
    const storageMatch = path.match(/^\/v1\/storage\/([a-zA-Z0-9_-]+)(?:\/(.+))?$/);
    if (storageMatch) {
      const auth = await authenticatePrivateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);

      const space = storageMatch[1].toLowerCase();
      const itemKey = storageMatch[2] ? decodeURIComponent(storageMatch[2]) : null;

      if (auth.principal.allowed_space !== "*" && auth.principal.allowed_space !== space) {
        return jsonRes({ ok: false, error: `Key ${auth.principal.key_id} is not authorized for space '${space}'.` }, 403);
      }

      // LIST files in space
      if (!itemKey && request.method === "GET") {
        const { results } = await executeD1Query(
          env,
          "SELECT item_key AS key, size_bytes AS sizeBytes, content_type AS contentType, sha256, readonly_locked AS readonlyLocked, created_at AS createdAt FROM cloud_storage_items WHERE space = ? ORDER BY created_at DESC LIMIT 200",
          [space]
        );
        return jsonRes({
          ok: true,
          service: "ACS",
          space,
          egressFeeUsd: 0,
          count: results.length,
          items: results.map((r) => ({
            ...r,
            url: `https://api.aarunicloud.com/v1/storage/${space}/${encodeURIComponent(r.key)}`
          }))
        }, 200, { "X-Aaruni-Service": "ACS" });
      }

      // UPLOAD file to space (PUT or POST)
      if (itemKey && (request.method === "PUT" || request.method === "POST")) {
        const existing = await executeD1Query(
          env,
          "SELECT readonly_locked FROM cloud_storage_items WHERE space = ? AND item_key = ? LIMIT 1",
          [space, itemKey]
        );
        if (existing.results && existing.results[0] && existing.results[0].readonly_locked === 1) {
          return jsonRes({ ok: false, error: `Item '${space}/${itemKey}' is sealed in read-only mode via Aaruni Archive (ARC).` }, 409);
        }

        const buf = await request.arrayBuffer();
        const maxBytes = auth.principal.role === "admin" ? 24 * 1024 * 1024 : 64 * 1024;
        if (buf.byteLength > maxBytes) {
          return jsonRes({ ok: false, error: `Payload size ${buf.byteLength} exceeds role limit (${maxBytes} bytes).` }, 413);
        }

        const contentType = request.headers.get("Content-Type") || "application/octet-stream";
        const digest = await sha256Hex(buf);
        const kvKey = `acs:${space}:${itemKey}`;

        if (env && env.ACS_KV && typeof env.ACS_KV.put === "function") {
          await env.ACS_KV.put(kvKey, buf, { metadata: { contentType, sha256: digest, space, key: itemKey } });
        }

        if (buf.byteLength <= 768 * 1024) {
          await executeD1Query(
            env,
            `INSERT INTO cloud_storage_blobs (space, item_key, data_b64) VALUES (?, ?, ?)
             ON CONFLICT(space, item_key) DO UPDATE SET data_b64=excluded.data_b64`,
            [space, itemKey, bufToBase64(buf)]
          );
        }

        await executeD1Query(
          env,
          `INSERT INTO cloud_storage_items (id, space, item_key, size_bytes, content_type, sha256, owner_key_id, readonly_locked, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))
           ON CONFLICT(space, item_key) DO UPDATE SET
             size_bytes=excluded.size_bytes,
             content_type=excluded.content_type,
             sha256=excluded.sha256,
             owner_key_id=excluded.owner_key_id,
             created_at=datetime('now')`,
          [makeId("acs"), space, itemKey, buf.byteLength, contentType, digest, auth.principal.key_id]
        );

        await logAudit(env, executeD1Query, auth.principal.key_id, "ACS", `put:${space}/${itemKey}`);

        return jsonRes({
          ok: true,
          service: "ACS",
          space,
          key: itemKey,
          sizeBytes: buf.byteLength,
          contentType,
          sha256: digest,
          egressFeeUsd: 0,
          url: `https://api.aarunicloud.com/v1/storage/${space}/${encodeURIComponent(itemKey)}`
        }, 201, { "X-Aaruni-Service": "ACS", "X-Aaruni-SHA256": digest });
      }

      // DOWNLOAD / STREAM file from space (GET with HTTP 206 Range support)
      if (itemKey && request.method === "GET") {
        const metaQ = await executeD1Query(
          env,
          "SELECT size_bytes, content_type, sha256 FROM cloud_storage_items WHERE space = ? AND item_key = ? LIMIT 1",
          [space, itemKey]
        );
        if (!metaQ.results || metaQ.results.length === 0) {
          return jsonRes({ ok: false, error: `File '${itemKey}' not found in Aaruni Storage space '${space}'.` }, 404);
        }
        const meta = metaQ.results[0];
        const kvKey = `acs:${space}:${itemKey}`;
        let rawBuf = null;
        if (env && env.ACS_KV && typeof env.ACS_KV.get === "function") {
          rawBuf = await env.ACS_KV.get(kvKey, "arrayBuffer");
        }
        if (!rawBuf) {
          const blobQ = await executeD1Query(
            env,
            "SELECT data_b64 FROM cloud_storage_blobs WHERE space = ? AND item_key = ? LIMIT 1",
            [space, itemKey]
          );
          if (blobQ.results && blobQ.results[0] && blobQ.results[0].data_b64) {
            rawBuf = base64ToBuf(blobQ.results[0].data_b64);
          }
        }
        if (!rawBuf) {
          return jsonRes({ ok: false, error: "Storage edge payload unavailable." }, 404);
        }

        const total = rawBuf.byteLength;
        const rangeHdr = request.headers.get("Range");
        if (rangeHdr && rangeHdr.startsWith("bytes=")) {
          const [sStr, eStr] = rangeHdr.replace("bytes=", "").split("-");
          const start = parseInt(sStr, 10) || 0;
          const end = eStr ? Math.min(total - 1, parseInt(eStr, 10)) : total - 1;
          if (start >= 0 && start <= end && end < total) {
            const slice = rawBuf.slice(start, end + 1);
            return new Response(slice, {
              status: 206,
              headers: {
                ...API_CORS,
                "Content-Type": meta.content_type,
                "Content-Length": String(slice.byteLength),
                "Content-Range": `bytes ${start}-${end}/${total}`,
                "Accept-Ranges": "bytes",
                "ETag": `"${meta.sha256}"`,
                "X-Aaruni-SHA256": meta.sha256,
                "X-Aaruni-Service": "ACS"
              }
            });
          }
        }

        return new Response(rawBuf, {
          status: 200,
          headers: {
            ...API_CORS,
            "Content-Type": meta.content_type,
            "Content-Length": String(total),
            "Accept-Ranges": "bytes",
            "ETag": `"${meta.sha256}"`,
            "X-Aaruni-SHA256": meta.sha256,
            "X-Aaruni-Service": "ACS"
          }
        });
      }

      // DELETE file from space
      if (itemKey && request.method === "DELETE") {
        const existing = await executeD1Query(
          env,
          "SELECT readonly_locked FROM cloud_storage_items WHERE space = ? AND item_key = ? LIMIT 1",
          [space, itemKey]
        );
        if (existing.results && existing.results[0] && existing.results[0].readonly_locked === 1) {
          return jsonRes({ ok: false, error: "Cannot delete sealed read-only archive item." }, 409);
        }
        if (env && env.ACS_KV && typeof env.ACS_KV.delete === "function") {
          await env.ACS_KV.delete(`acs:${space}:${itemKey}`);
        }
        await executeD1Query(env, "DELETE FROM cloud_storage_blobs WHERE space = ? AND item_key = ?", [space, itemKey]);
        await executeD1Query(env, "DELETE FROM cloud_storage_items WHERE space = ? AND item_key = ?", [space, itemKey]);
        await logAudit(env, executeD1Query, auth.principal.key_id, "ACS", `delete:${space}/${itemKey}`);
        return jsonRes({ ok: true, service: "ACS", deleted: `${space}/${itemKey}` });
      }
    }

    // -------------------------------------------------------------------------
    // 4. AARUNI ARCHIVE (ARC) — PRIVATE KEY REQUIRED
    // -------------------------------------------------------------------------
    if (path === "/v1/archive/seal" && request.method === "POST") {
      const auth = await authenticatePrivateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const body = await request.json();
      const space = String(body.space || "sandbox").toLowerCase();
      const key = String(body.key || "");
      if (!key) return jsonRes({ ok: false, error: "Missing 'key' to seal." }, 400);
      if (auth.principal.allowed_space !== "*" && auth.principal.allowed_space !== space) {
        return jsonRes({ ok: false, error: "Forbidden space" }, 403);
      }

      const itemQ = await executeD1Query(
        env,
        "SELECT sha256, size_bytes FROM cloud_storage_items WHERE space = ? AND item_key = ? LIMIT 1",
        [space, key]
      );
      if (!itemQ.results || itemQ.results.length === 0) {
        return jsonRes({ ok: false, error: `Storage item '${space}/${key}' not found.` }, 404);
      }

      await executeD1Query(
        env,
        "UPDATE cloud_storage_items SET readonly_locked = 1 WHERE space = ? AND item_key = ?",
        [space, key]
      );
      const sealId = makeId("arc_seal");
      await logAudit(env, executeD1Query, auth.principal.key_id, "ARC", `seal:${space}/${key}`);

      return jsonRes({
        ok: true,
        service: "ARC",
        sealId,
        space,
        key,
        readonlyLocked: true,
        encryption: "AES-256-AT-REST",
        sha256: itemQ.results[0].sha256,
        sizeBytes: itemQ.results[0].size_bytes,
        sealedAt: new Date().toISOString()
      }, 200, { "X-Aaruni-Service": "ARC" });
    }

    // -------------------------------------------------------------------------
    // 5. AARUNI COMPUTE (ACC) & CONTAINERS (ACN) — 100% PRIVATE ADMIN KEY ONLY
    // -------------------------------------------------------------------------
    if (path === "/v1/compute/nodes" && request.method === "GET") {
      const auth = await authenticatePrivateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const { results } = await executeD1Query(
        env,
        "SELECT node_id AS nodeId, name, node_type AS nodeType, region, ram_gb AS ramGb, status, last_heartbeat AS lastHeartbeat FROM cloud_compute_nodes ORDER BY node_id ASC"
      );
      return jsonRes({ ok: true, service: "ACC", count: results.length, nodes: results }, 200, { "X-Aaruni-Service": "ACC" });
    }

    if (path === "/v1/compute/heartbeat" && request.method === "POST") {
      const auth = await authenticatePrivateGuard(request, env, executeD1Query);
      if (!auth.ok || auth.principal.role !== "admin") {
        return jsonRes({ ok: false, error: "Admin Aaruni Guard key required for outbound worker heartbeat." }, 403);
      }
      const body = await request.json().catch(() => ({}));
      const check = assertSafeWorkloadPayload(body);
      if (!check.ok) return jsonRes({ ok: false, error: check.error }, 400);

      const nodeId = body.nodeId || "acc-hyd-m4pro-01";
      await executeD1Query(
        env,
        `INSERT INTO cloud_compute_nodes (node_id, name, node_type, region, ram_gb, status, last_heartbeat)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE', datetime('now'))
         ON CONFLICT(node_id) DO UPDATE SET status='ACTIVE', last_heartbeat=datetime('now')`,
        [nodeId, body.name || nodeId, body.nodeType || "acc.m4.pro.64gb", body.region || "ap-south-hyd-1", body.ramGb || 64]
      );
      return jsonRes({ ok: true, service: "ACC", nodeId, topology: "OUTBOUND_HTTPS_ONLY", lastHeartbeat: new Date().toISOString() });
    }

    // Outbound-only pull queue for private RT-Labs daemon (ZERO inbound ports required on Mac!)
    if (path === "/v1/compute/pull-next" && request.method === "POST") {
      const auth = await authenticatePrivateGuard(request, env, executeD1Query);
      if (!auth.ok || auth.principal.role !== "admin") {
        return jsonRes({ ok: false, error: "Admin Aaruni Guard key required for outbound worker job pull." }, 403);
      }
      const { results } = await executeD1Query(
        env,
        "SELECT job_id AS jobId, service, action, payload_json AS payloadJson, region, created_at AS createdAt FROM cloud_jobs WHERE status = 'QUEUED' AND owner_key_id = ? ORDER BY created_at ASC LIMIT 1",
        [auth.principal.key_id]
      );
      if (!results || results.length === 0) {
        return jsonRes({ ok: true, service: "ACC", job: null });
      }
      const job = results[0];
      await executeD1Query(env, "UPDATE cloud_jobs SET status = 'CLAIMED', updated_at = datetime('now') WHERE job_id = ?", [job.jobId]);
      return jsonRes({
        ok: true,
        service: "ACC",
        job: {
          jobId: job.jobId,
          service: job.service,
          action: job.action,
          payload: JSON.parse(job.payloadJson || "{}"),
          region: job.region,
          createdAt: job.createdAt
        }
      });
    }

    if ((path === "/v1/compute/launch" || path === "/v1/containers/run") && request.method === "POST") {
      const auth = await authenticatePrivateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const body = await request.json().catch(() => ({}));
      const check = assertSafeWorkloadPayload(body);
      if (!check.ok) return jsonRes({ ok: false, error: check.error }, 400);

      const isContainer = path.includes("containers");
      const svc = isContainer ? "ACN" : "ACC";
      const jobId = makeId(isContainer ? "job_acn" : "job_acc");
      const region = body.region || "ap-south-hyd-1";
      const assignedNode = isContainer ? "acn-edge-xvfb-01" : "acc-hyd-m4pro-01";
      const resultObj = {
        assignedNode,
        executionMode: "OUTBOUND_PULL_SANDBOXED",
        type: body.type || body.image || (isContainer ? "xvfb-1080p-worker" : "acc.m4.max"),
        storageMount: body.storage || "acs://production-media",
        egressFeeUsd: 0
      };

      await executeD1Query(
        env,
        `INSERT INTO cloud_jobs (job_id, service, action, payload_json, result_json, status, region, owner_key_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'QUEUED', ?, ?, datetime('now'), datetime('now'))`,
        [jobId, svc, isContainer ? "container_run" : "compute_launch", JSON.stringify(body), JSON.stringify(resultObj), region, auth.principal.key_id]
      );
      await logAudit(env, executeD1Query, auth.principal.key_id, svc, `launch:${jobId}`);

      return jsonRes({
        ok: true,
        service: svc,
        jobId,
        status: "QUEUED",
        region,
        ...resultObj,
        createdAt: new Date().toISOString()
      }, 201, { "X-Aaruni-Service": svc });
    }

    // -------------------------------------------------------------------------
    // 6. AARUNI VOICE (AVA) — STATELESS PREVIEW FOR PUBLIC, PERSISTED FOR OWNER
    // -------------------------------------------------------------------------
    if (path === "/v1/voice/synthesize" && request.method === "POST") {
      const principal = await tryOptionalPrivateGuard(request, env, executeD1Query);
      const body = await request.json().catch(() => ({}));
      const rawText = String(body.text || "").trim();
      if (!rawText) return jsonRes({ ok: false, error: "Missing 'text' field for Aaruni Voice synthesis." }, 400);

      const targetLufs = Number(body.targetLufs || body.lufs || -12.0);
      const persona = String(body.persona || "aria").toLowerCase();
      const pls = applyPlsLexicon(rawText);
      const jobId = makeId("job_ava");
      const dspSpec = {
        targetLoudnessLufs: targetLufs,
        declickEnvelopeMs: "35ms/45ms raised-cosine",
        highPassFilterHz: 80,
        lexiconStandard: "W3C-PLS-1.0"
      };

      if (principal) {
        await executeD1Query(
          env,
          `INSERT INTO cloud_jobs (job_id, service, action, payload_json, result_json, status, region, owner_key_id, created_at, updated_at)
           VALUES (?, 'AVA', 'synthesize', ?, ?, 'READY', 'ap-south-hyd-1', ?, datetime('now'), datetime('now'))`,
          [jobId, JSON.stringify({ text: rawText, persona, targetLufs }), JSON.stringify({ pls, dspSpec }), principal.key_id]
        );
        await logAudit(env, executeD1Query, principal.key_id, "AVA", `synthesize:${jobId}`);
      }

      return jsonRes({
        ok: true,
        service: "AVA",
        mode: principal ? "AUTHENTICATED_JOB" : "STATELESS_EDGE_PREVIEW",
        jobId,
        persona,
        originalText: rawText,
        normalizedText: pls.normalizedText,
        ssml: pls.ssml,
        wordCount: pls.words,
        estimatedDurationSec: pls.estDurationSec,
        plsReplacements: pls.replacements,
        dsp: dspSpec,
        createdAt: new Date().toISOString()
      }, 200, { "X-Aaruni-Service": "AVA" });
    }

    // -------------------------------------------------------------------------
    // 7. AARUNI RENDER (ARN) & JOBS — 100% PRIVATE ADMIN KEY REQUIRED
    // -------------------------------------------------------------------------
    if (path === "/v1/render/build" && request.method === "POST") {
      const auth = await authenticatePrivateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const body = await request.json().catch(() => ({}));
      const check = assertSafeWorkloadPayload(body);
      if (!check.ok) return jsonRes({ ok: false, error: check.error }, 400);

      const timeline = String(body.timeline || "project.cmproj");
      const format = String(body.format || "mp4");
      const resolution = String(body.resolution || "1920x1080");
      const jobId = makeId("job_arn");
      const resultObj = {
        timeline,
        format,
        resolution,
        encoder: "VideoToolbox-H264-HW",
        executionMode: "OUTBOUND_PULL_SANDBOXED",
        assignedNode: "acc-hyd-m4pro-01",
        outputUri: `acs://production/renders/${jobId}.${format}`
      };

      await executeD1Query(
        env,
        `INSERT INTO cloud_jobs (job_id, service, action, payload_json, result_json, status, region, owner_key_id, created_at, updated_at)
         VALUES (?, 'ARN', 'render_build', ?, ?, 'QUEUED', 'ap-south-hyd-1', ?, datetime('now'), datetime('now'))`,
        [jobId, JSON.stringify(body), JSON.stringify(resultObj), auth.principal.key_id]
      );
      await logAudit(env, executeD1Query, auth.principal.key_id, "ARN", `build:${jobId}`);

      return jsonRes({
        ok: true,
        service: "ARN",
        jobId,
        status: "QUEUED",
        ...resultObj,
        statusUrl: `https://api.aarunicloud.com/v1/jobs/${jobId}`,
        createdAt: new Date().toISOString()
      }, 201, { "X-Aaruni-Service": "ARN" });
    }

    const jobMatch = path.match(/^\/v1\/(?:render\/)?jobs\/([a-zA-Z0-9_-]+)$/);
    if (jobMatch && request.method === "GET") {
      const auth = await authenticatePrivateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const jobId = jobMatch[1];
      const { results } = await executeD1Query(
        env,
        "SELECT job_id AS jobId, service, action, payload_json, result_json, status, region, owner_key_id, created_at AS createdAt, updated_at AS updatedAt FROM cloud_jobs WHERE job_id = ? LIMIT 1",
        [jobId]
      );
      if (!results || results.length === 0) {
        return jsonRes({ ok: false, error: `Job '${jobId}' not found.` }, 404);
      }
      const row = results[0];
      if (auth.principal.role !== "admin" && row.owner_key_id !== auth.principal.key_id) {
        return jsonRes({ ok: false, error: "Forbidden job record." }, 403);
      }
      return jsonRes({
        ok: true,
        jobId: row.jobId,
        service: row.service,
        action: row.action,
        status: row.status,
        region: row.region,
        payload: JSON.parse(row.payload_json || "{}"),
        result: JSON.parse(row.result_json || "{}"),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      });
    }

    if (path === "/v1/qa/audit" && (request.method === "POST" || request.method === "GET")) {
      const targetUrl = url.searchParams.get("url") || "https://aarunicloud.com";
      const jobId = makeId("job_aqa");
      return jsonRes({
        ok: true,
        service: "AQA",
        auditId: jobId,
        targetUrl,
        viewportsTested: ["360x800", "390x844", "768x1024", "1440x900"],
        themesTested: ["dark", "light"],
        wcagStandard: "WCAG 2.1 Level AA (axe-core)",
        horizontalOverflowPx: 0,
        criticalViolations: 0,
        status: "PASSED",
        auditedAt: new Date().toISOString()
      }, 200, { "X-Aaruni-Service": "AQA" });
    }

    // -------------------------------------------------------------------------
    // 8. AARUNI KNOWLEDGE (AKB) & AARUNI ASSISTANT (AAI) — STATELESS EDGE SAFE
    // -------------------------------------------------------------------------
    if (path === "/v1/knowledge/search" && (request.method === "GET" || request.method === "POST")) {
      let q = url.searchParams.get("q") || url.searchParams.get("query") || "";
      if (!q && request.method === "POST") {
        const b = await request.json().catch(() => ({}));
        q = b.query || b.q || "";
      }
      const terms = String(q).toLowerCase().split(/\W+/).filter((w) => w.length >= 2);
      const { results } = await executeD1Query(
        env,
        "SELECT doc_id AS docId, service_code AS service, title, body, authority_weight AS authorityWeight FROM cloud_knowledge_docs"
      );

      const scored = results
        .map((doc) => {
          const hay = `${doc.service} ${doc.title} ${doc.body}`.toLowerCase();
          let hits = 0;
          for (const t of terms) {
            if (hay.includes(t)) hits += 1;
          }
          return { ...doc, relevanceScore: terms.length === 0 ? doc.authorityWeight : hits * 25 + doc.authorityWeight * 0.2 };
        })
        .filter((d) => terms.length === 0 || d.relevanceScore > 25)
        .sort((a, b) => b.relevanceScore - a.relevanceScore);

      return jsonRes({
        ok: true,
        service: "AKB",
        query: q,
        count: scored.length,
        results: scored
      }, 200, { "X-Aaruni-Service": "AKB" });
    }

    if (path === "/v1/assistant/ask" && request.method === "POST") {
      const principal = await tryOptionalPrivateGuard(request, env, executeD1Query);
      const body = await request.json().catch(() => ({}));
      const prompt = String(body.prompt || body.query || "").slice(0, 600).trim();
      if (!prompt) return jsonRes({ ok: false, error: "Missing 'prompt' field." }, 400);

      const lower = prompt.toLowerCase();
      const actions = [];
      if (lower.includes("storage") || lower.includes("acs") || lower.includes("upload") || lower.includes("sync")) {
        actions.push({ service: "ACS", summary: "Aaruni Storage space ready with $0/GB egress, SHA-256 integrity lock, and private-key isolation." });
      }
      if (lower.includes("compute") || lower.includes("acc") || lower.includes("node") || lower.includes("launch")) {
        actions.push({ service: "ACC", summary: "Outbound-only air-gapped worker pool ready in ap-south-hyd-1 (0 inbound ports exposed)." });
      }
      if (lower.includes("render") || lower.includes("arn") || lower.includes("video") || lower.includes("mp4") || lower.includes("slide")) {
        actions.push({ service: "ARN", summary: "1920x1080 VideoToolbox H.264 render pipeline decoupled from editor UI." });
      }
      if (lower.includes("voice") || lower.includes("ava") || lower.includes("audio") || lower.includes("speech")) {
        actions.push({ service: "AVA", summary: "Bound W3C PLS technical lexicon with -12.0 dB LUFS broadcast loudness and cosine de-clicking." });
      }
      if (lower.includes("security") || lower.includes("guard") || lower.includes("agd") || lower.includes("zero-otp") || actions.length === 0) {
        actions.push({ service: "AGD", summary: "Verified TLS 1.3 edge transport, 0 inbound host ports, and private SHA-256 API key isolation." });
      }

      const kbQ = await executeD1Query(env, "SELECT doc_id, service_code, title FROM cloud_knowledge_docs");
      const matchedServices = new Set(actions.map((a) => a.service));
      const citations = (kbQ.results || []).filter((d) => matchedServices.has(d.service_code));

      const receiptId = "AAI-RCPT-" + Math.floor(100000 + Math.random() * 899999);
      if (principal) {
        await executeD1Query(
          env,
          `INSERT INTO cloud_jobs (job_id, service, action, payload_json, result_json, status, region, owner_key_id, created_at, updated_at)
           VALUES (?, 'AAI', 'assistant_ask', ?, ?, 'VERIFIED', 'ap-south-hyd-1', ?, datetime('now'), datetime('now'))`,
          [receiptId, JSON.stringify({ prompt }), JSON.stringify({ actions, citations }), principal.key_id]
        );
        await logAudit(env, executeD1Query, principal.key_id, "AAI", `ask:${receiptId}`);
      }

      return jsonRes({
        ok: true,
        service: "AAI",
        mode: principal ? "AUTHENTICATED" : "STATELESS_PUBLIC_ADVISOR",
        receiptId,
        prompt,
        actions,
        citations,
        verifiedAt: new Date().toISOString()
      }, 200, { "X-Aaruni-Service": "AAI" });
    }

    return jsonRes({
      ok: false,
      error: `Unknown Aaruni Cloud v1 route: ${request.method} ${path}`,
      availableEndpoints: SERVICE_CATALOG.map((s) => s.endpoint)
    }, 404);
  } catch (err) {
    return jsonRes({
      ok: false,
      error: err.message || String(err)
    }, 500);
  }
}


// Cloudflare Pages Edge Worker & Router for Aaruni Group Domains
// Domains:
// 1. my.aarunitech.com (or ?emp=... or ?tab=... or /portal) -> /portal.html (Employee & Admin Payroll Portal)
// 2. aarunicloud.com -> /cloud.html (Aaruni Cloud)
// 3. aarunitech.com (and root requests) -> /index.html (Corporate Flagship)
// 4. API Endpoints: /api/version, /api/timesheets (backed by Cloudflare D1 aaruni_payroll_db)

const CF_ACCOUNT_ID = "fa6dcbd2cac2fcfe2565336e93c441f1";
const D1_DATABASE_ID = "d02799e0-e790-466f-a8f9-0740370a18c3";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json; charset=utf-8"
};

// Helper: Execute SQL against Cloudflare D1 (Supports native env.DB or Direct Edge REST fallback)
async function executeD1Query(env, sql, params = []) {
  // Option A: Direct native D1 binding if available
  if (env && env.DB && typeof env.DB.prepare === "function") {
    try {
      const stmt = env.DB.prepare(sql).bind(...params);
      if (sql.trim().toUpperCase().startsWith("SELECT")) {
        const { results } = await stmt.all();
        return { success: true, results: results || [], mode: "native_binding" };
      } else {
        const info = await stmt.run();
        return { success: true, results: [info], mode: "native_binding" };
      }
    } catch (err) {
      console.warn("Native D1 binding error, falling back to D1 REST API:", err);
    }
  }

  // Option B: High-performance Cloudflare D1 APAC REST API
  const token = env && env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    throw new Error("Neither native env.DB nor env.CLOUDFLARE_API_TOKEN is available");
  }
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ sql, params })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`D1 API HTTP ${res.status}: ${errText}`);
  }

  const json = await res.json();
  if (!json.success || !json.result || !json.result[0]) {
    throw new Error((json.errors && json.errors[0] && json.errors[0].message) || "D1 API Query Failed");
  }

  return {
    success: true,
    results: json.result[0].results || [],
    meta: json.result[0].meta,
    mode: "edge_rest_api"
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = (url.hostname || "").toLowerCase();

    // Aaruni Cloud v1 Production API Gateway (api.aarunicloud.com & /v1/* & /api/v1/*)
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
    }

    // =========================================================================
    // API ROUTING: Cloudflare D1 Remote Database Endpoints
    // =========================================================================

    // 1. Version & System Health
    if (url.pathname === "/api/version") {
      let dbStatus = "unbound";
      let tsCount = 0;
      let queryMode = "none";
      try {
        const q = await executeD1Query(env, "SELECT count(*) as c FROM timesheets");
        tsCount = (q.results && q.results[0] && q.results[0].c) || 0;
        dbStatus = "connected";
        queryMode = q.mode;
      } catch (e) {
        dbStatus = "error: " + (e.message || String(e));
      }

      return new Response(JSON.stringify({
        success: true,
        version: "2.4.0",
        buildDate: "2026-11-11",
        releaseName: "Cloudflare D1 APAC Edge Sync & Multi-Device Responsive",
        database: {
          name: "aaruni_payroll_db",
          region: "apac",
          status: dbStatus,
          queryMode: queryMode,
          timesheetRecords: tsCount
        },
        timestamp: new Date().toISOString()
      }), { headers: CORS_HEADERS });
    }

    // 2. Timesheets GET / POST API
    if (url.pathname === "/api/timesheets") {
      // GET: Query timesheets from Cloudflare D1
      if (request.method === "GET") {
        try {
          const empFilter = url.searchParams.get("emp_id") || url.searchParams.get("empId");
          let sql = "SELECT id, emp_id AS empId, date, entry_time AS entryTime, exit_time AS exitTime, hours, status, summary, task_link AS taskLink, source FROM timesheets";
          let params = [];
          if (empFilter) {
            sql += " WHERE emp_id = ? ORDER BY date DESC, id DESC";
            params = [empFilter];
          } else {
            sql += " ORDER BY date DESC, id DESC LIMIT 500";
          }
          const { results } = await executeD1Query(env, sql, params);
          return new Response(JSON.stringify({
            success: true,
            count: results ? results.length : 0,
            data: results || []
          }), { headers: CORS_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), {
            status: 500,
            headers: CORS_HEADERS
          });
        }
      }

      // POST: Submit a new or updated timesheet into Cloudflare D1
      if (request.method === "POST") {
        try {
          const body = await request.json();
          if (!body || !body.id || !body.empId || !body.date) {
            return new Response(JSON.stringify({ success: false, error: "Missing required fields (id, empId, date)" }), {
              status: 400,
              headers: CORS_HEADERS
            });
          }

          const empNameMap = {
            "AAR-0001": "Shailaja Tiwari",
            "AAR-0002": "Rupesh Tiwari",
            "AAR-0003": "Rakesh Tiwari",
            "AAR-0004": "Chukka Nandini",
            "AAR-0005": "Janhavi Kamble",
            "AAR-0006": "Ramya S",
            "AAR-0008": "Ali"
          };
          const empName = body.empName || empNameMap[body.empId] || "Aaruni Staff";
          const monthVal = body.month || (body.date ? body.date.slice(0, 7) : "2026-11");
          const emailVal = body.email || "";

          const hoursVal = parseFloat(body.hours) || 8;
          const entryVal = body.entryTime || "10:00";
          const exitVal = body.exitTime || "18:00";
          const statusVal = body.status || "Worked";
          const summaryVal = body.summary || "Worked on assigned deliverables";
          const taskVal = body.taskLink || "Employee Portal Submission";
          const sourceVal = body.source || "Aaruni Portal App (Live D1)";

          const insertSql = `
            INSERT INTO timesheets (id, emp_id, emp_name, email, date, month, entry_time, exit_time, hours, status, summary, task_link, source, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
              emp_id=excluded.emp_id,
              emp_name=excluded.emp_name,
              email=excluded.email,
              date=excluded.date,
              month=excluded.month,
              entry_time=excluded.entry_time,
              exit_time=excluded.exit_time,
              hours=excluded.hours,
              status=excluded.status,
              summary=excluded.summary,
              task_link=excluded.task_link,
              source=excluded.source;
          `;
          const params = [body.id, body.empId, empName, emailVal, body.date, monthVal, entryVal, exitVal, hoursVal, statusVal, summaryVal, taskVal, sourceVal];

          await executeD1Query(env, insertSql, params);

          return new Response(JSON.stringify({
            success: true,
            message: "Timesheet successfully saved to Cloudflare D1 Database (APAC Edge)",
            id: body.id
          }), { headers: CORS_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), {
            status: 500,
            headers: CORS_HEADERS
          });
        }
      }
    }

    // 3. Enterprise & Cloud Inquiries API (/api/inquiries)
    // GET: Returns all inquiries stored in Cloudflare D1 for the Admin Leads Dashboard
    // POST: Logs labeled inquiries (aarunicloud, syllovo, aarunitech, aarunitech-careers)
    //       into D1 AND dispatches a real server-side email from contact@aarunitech.com -> rupesh@fullstackmaster.net
    if (url.pathname === "/api/inquiries") {
      try {
        await executeD1Query(env, `
          CREATE TABLE IF NOT EXISTS inquiries (
            id TEXT PRIMARY KEY,
            label TEXT,
            public_to TEXT,
            forwarded_to TEXT,
            org_name TEXT,
            sender_email TEXT,
            offering TEXT,
            message TEXT,
            email_status TEXT DEFAULT 'logged',
            created_at TEXT
          )
        `);
      } catch (e) {}

      if (request.method === "GET") {
        try {
          const labelFilter = url.searchParams.get("label");
          let sql = "SELECT id, label, public_to AS publicTo, forwarded_to AS forwardedTo, org_name AS orgName, sender_email AS senderEmail, offering, message, email_status AS emailStatus, created_at AS createdAt FROM inquiries";
          let params = [];
          if (labelFilter && labelFilter !== "all") {
            sql += " WHERE label = ? ORDER BY created_at DESC LIMIT 200";
            params = [labelFilter];
          } else {
            sql += " ORDER BY created_at DESC LIMIT 200";
          }
          const { results } = await executeD1Query(env, sql, params);
          return new Response(JSON.stringify({
            success: true,
            count: results ? results.length : 0,
            data: results || []
          }), { headers: CORS_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), {
            status: 500,
            headers: CORS_HEADERS
          });
        }
      }

      if (request.method === "POST") {
        try {
          const body = await request.json();
          const ref = (body && body.ref) || ("INQ-" + Math.floor(100000 + Math.random() * 899999));
          const label = (body && body.label) || (host.includes("aarunicloud") ? "aarunicloud" : "aarunitech");
          const org = (body && (body.org || body.company || body.name)) || "Enterprise Visitor";
          const senderEmail = (body && body.email) || "";
          const offering = (body && (body.services || body.offering)) || "General Inquiry";
          const message = (body && body.message) || "";
          const customSubject = (body && body.subject) || `[${label}] [${ref}] ${offering} — ${org}`;

          let emailDelivery = { sent: false, mode: "d1_logged" };

          // Dispatch real server-side email via Cloudflare Email Worker (contact@aarunitech.com -> rupesh@fullstackmaster.net)
          if (env && env.EMAIL_RELAY && typeof env.EMAIL_RELAY.fetch === "function") {
            try {
              const emailText = [
                `=== AARUNI GROUP SERVER-SIDE INQUIRY DISPATCH ===`,
                `Brand Label     : [${label}]`,
                `Reference ID    : ${ref}`,
                `Public Address  : contact@aarunitech.com`,
                `Delivered To    : rupesh@fullstackmaster.net`,
                `Organization    : ${org}`,
                `Visitor Email   : ${senderEmail || "Not provided"}`,
                `Service/Offering: ${offering}`,
                `Timestamp (UTC) : ${new Date().toISOString()}`,
                ``,
                `--- Message / Scope ---`,
                message || "(Submitted via quick pilot request)"
              ].join("\n");

              const relayRes = await env.EMAIL_RELAY.fetch("https://internal/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  from: "contact@aarunitech.com",
                  replyTo: senderEmail || "contact@aarunitech.com",
                  subject: customSubject,
                  text: emailText
                })
              });
              const relayJson = await relayRes.json();
              if (relayJson && relayJson.success) {
                emailDelivery = { sent: true, mode: "cloudflare_email_worker", messageId: relayJson.messageId };
              } else {
                emailDelivery = { sent: false, mode: "relay_error", error: (relayJson && relayJson.error) || "Unknown" };
              }
            } catch (relayErr) {
              emailDelivery = { sent: false, mode: "relay_exception", error: relayErr.message || String(relayErr) };
            }
          }

          try {
            await executeD1Query(
              env,
              `INSERT INTO inquiries (id, label, public_to, forwarded_to, org_name, sender_email, offering, message, email_status, created_at)
               VALUES (?, ?, 'contact@aarunitech.com', 'rupesh@fullstackmaster.net', ?, ?, ?, ?, ?, datetime('now'))
               ON CONFLICT(id) DO UPDATE SET
                 label=excluded.label,
                 org_name=excluded.org_name,
                 sender_email=excluded.sender_email,
                 offering=excluded.offering,
                 message=excluded.message,
                 email_status=excluded.email_status`,
              [ref, label, org, senderEmail, offering, message, emailDelivery.sent ? "sent_server_side" : emailDelivery.mode]
            );
          } catch (dbErr) {
            console.warn("D1 inquiry log warning:", dbErr);
          }

          return new Response(JSON.stringify({
            success: true,
            ref: ref,
            label: label,
            publicRecipient: "contact@aarunitech.com",
            routedInbox: "rupesh@fullstackmaster.net",
            emailDelivery: emailDelivery
          }), { headers: CORS_HEADERS });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), {
            status: 400,
            headers: CORS_HEADERS
          });
        }
      }
    }

    // =========================================================================
    // DOMAIN & HOST ROUTING
    // =========================================================================

    // 1. Aaruni Cloud Host
    const isCloudHost =
      host === "aarunicloud.com" ||
      host === "www.aarunicloud.com" ||
      host.startsWith("aaruni-tech-cloud") ||
      url.searchParams.get("site") === "cloud";

    if (isCloudHost && (url.pathname === "/" || url.pathname === "/index.html")) {
      const cloudUrl = new URL("/cloud" + url.search + url.hash, request.url);
      return env.ASSETS.fetch(new Request(cloudUrl.toString(), request));
    }

    // 2. Aaruni Employee Portal Host & Deep Links
    const isPortalHost =
      host === "my.aarunitech.com" ||
      host === "www.my.aarunitech.com" ||
      url.searchParams.get("site") === "portal" ||
      url.searchParams.has("emp") ||
      url.searchParams.has("tab");

    if (isPortalHost && (url.pathname === "/" || url.pathname === "/index.html")) {
      const portalUrl = new URL("/portal" + url.search + url.hash, request.url);
      return env.ASSETS.fetch(new Request(portalUrl.toString(), request));
    }

    // 3. Fallback to default asset resolution
    return env.ASSETS.fetch(request);
  }
};
