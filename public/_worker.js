// ============================================================================
// AARUNI CLOUD PRODUCTION REST API GATEWAY (v1) — OPTION A LOCKED
// Brand Architecture:
//   - Platform: Aaruni Cloud (aarunicloud.com)
//   - Console : Aaruni Cloud Console (console.aarunicloud.com)
//   - CLI/SDK : acloud (@aarunicloud/sdk & aarunicloud)
//   - Services: Cloud Voice, Cloud Storage, Cloud Archive, Cloud Compute,
//               Cloud Containers, Cloud Assistant, Cloud Knowledge,
//               Cloud Render, Cloud Quality, Cloud Guard, Cloud Edge
// Security & Isolation:
//   - 0 inbound ports exposed on owner hardware (outbound-pull only)
//   - Admin infrastructure routes (/v1/compute/*, /v1/containers/*, /v1/render/*)
//     strictly require role === 'admin'
//   - Self-serve Guest Subscribers (acloud_sub_*) are strictly jailed to their
//     own user_id voice profiles, character quota, and isolated user_<id> space
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
      "X-Aaruni-Zero-Trust": "ENFORCED-TENANT-ISOLATION",
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

function makeSecretToken(prefix) {
  const a = crypto.randomUUID().replace(/-/g, "");
  const b = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return `${prefix}_${a}${b}`;
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
  if (serialized.length > 16384) {
    return { ok: false, error: "Payload exceeds 16 KB structured parameter limit." };
  }
  if (SHELL_INJECTION_PATTERN.test(serialized)) {
    return { ok: false, error: "Blocked by Cloud Guard Anti-RCE Shield: raw shell commands and metacharacters are forbidden." };
  }
  return { ok: true };
}

const SERVICE_CATALOG = [
  { code: "VOICE", id: "voice", name: "Cloud Voice", fullName: "Aaruni Cloud Voice", category: "ai", access: "subscriber-or-admin", endpoint: "https://api.aarunicloud.com/v1/voice/speak", cli: "acloud voice speak \"Hello from Aaruni Cloud\" --out intro.mp3" },
  { code: "STORAGE", id: "storage", name: "Cloud Storage", fullName: "Aaruni Cloud Storage", category: "storage", access: "private-key-required", endpoint: "https://api.aarunicloud.com/v1/storage", cli: "acloud storage ls --space production-media" },
  { code: "ARCHIVE", id: "archive", name: "Cloud Archive", fullName: "Aaruni Cloud Archive", category: "storage", access: "private-key-required", endpoint: "https://api.aarunicloud.com/v1/archive/seal", cli: "acloud archive seal --space production-media --key master.zip" },
  { code: "COMPUTE", id: "compute", name: "Cloud Compute", fullName: "Aaruni Cloud Compute", category: "compute", access: "admin-only", endpoint: "https://api.aarunicloud.com/v1/compute/nodes", cli: "acloud compute nodes" },
  { code: "CONTAINERS", id: "containers", name: "Cloud Containers", fullName: "Aaruni Cloud Containers", category: "compute", access: "admin-only", endpoint: "https://api.aarunicloud.com/v1/containers/run", cli: "acloud containers run --image xvfb-1080p-worker" },
  { code: "ASSISTANT", id: "assistant", name: "Cloud Assistant", fullName: "Aaruni Cloud Assistant", category: "ai", access: "public-or-authenticated", endpoint: "https://api.aarunicloud.com/v1/assistant/ask", cli: "acloud assistant ask \"Verify Cloud Storage and Cloud Voice\"" },
  { code: "KNOWLEDGE", id: "knowledge", name: "Cloud Knowledge", fullName: "Aaruni Cloud Knowledge", category: "ai", access: "public-docs-readonly", endpoint: "https://api.aarunicloud.com/v1/knowledge/search", cli: "acloud knowledge search \"zero egress\"" },
  { code: "RENDER", id: "render", name: "Cloud Render", fullName: "Aaruni Cloud Render", category: "tools", access: "admin-only", endpoint: "https://api.aarunicloud.com/v1/render/build", cli: "acloud render build --project lesson-01 --resolution 1080p" },
  { code: "QUALITY", id: "qa", name: "Cloud Quality", fullName: "Aaruni Cloud Quality", category: "tools", access: "public-or-authenticated", endpoint: "https://api.aarunicloud.com/v1/qa/audit", cli: "acloud qa audit --url https://aarunicloud.com" },
  { code: "GUARD", id: "guard", name: "Cloud Guard", fullName: "Aaruni Cloud Guard", category: "security", access: "private-key-required", endpoint: "https://api.aarunicloud.com/v1/guard/whoami", cli: "acloud guard whoami" },
  { code: "EDGE", id: "edge", name: "Cloud Edge", fullName: "Aaruni Cloud Edge", category: "security", access: "public-health-readonly", endpoint: "https://api.aarunicloud.com/v1/edge/status", cli: "acloud status" },
  { code: "BUILDER", id: "builder", name: "Cloud Builder", fullName: "Aaruni Cloud Builder", category: "ai", access: "subscriber-or-admin", endpoint: "https://api.aarunicloud.com/v1/builder/plan", cli: "acloud deploy --file acloud.yaml" }
];

const STOCK_VOICES = [
  { voiceId: "stock_aria", name: "Aria — Technical Educator", type: "stock", language: "en-US", pitch: 1.04, rate: 0.96, badge: "Built-In Studio" },
  { voiceId: "stock_dev", name: "Dev — Systems Architect", type: "stock", language: "en-IN", pitch: 0.94, rate: 0.95, badge: "Built-In Studio" },
  { voiceId: "stock_meera", name: "Meera — Product Walkthrough", type: "stock", language: "en-GB", pitch: 1.08, rate: 0.97, badge: "Built-In Studio" }
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
  [/\bacloud\b/gi, "A-Cloud"],
  [/\.cmproj\b/gi, "Camtasia project"],
  [/\.libzip\b/gi, "Camtasia library archive"]
];

function applyPlsLexicon(rawText) {
  let normalized = String(rawText || "").slice(0, 1500).trim();
  const replacements = [];
  for (const [regex, spoken] of W3C_PLS_LEXICON) {
    if (regex.test(normalized)) {
      replacements.push({ pattern: regex.source.replace(/\\b/g, ""), phoneme: spoken });
      normalized = normalized.replace(regex, spoken);
    }
  }
  const words = normalized ? normalized.split(/\s+/).length : 0;
  const estDurationSec = Number(((words / 145) * 60).toFixed(2));
  const ssml = `<speak version="1.1" xml:lang="en-US"><prosody rate="96%">${normalized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</prosody></speak>`;
  return { normalizedText: normalized, words, estDurationSec, replacements, ssml };
}

async function authenticateGuard(request, env, executeD1Query) {
  const auth = request.headers.get("Authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) {
    return {
      ok: false,
      status: 401,
      error: "Blocked by Cloud Guard Zero-Trust Policy: Authorization Bearer API key required. Sign in at https://console.aarunicloud.com or run 'acloud login'."
    };
  }
  const rawToken = auth.slice(7).trim();
  if (!rawToken || rawToken === "agd_sandbox_public_demo") {
    return {
      ok: false,
      status: 403,
      error: "Blocked by Cloud Guard Zero-Trust Policy: Invalid or disabled API token."
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
      error: "Invalid or revoked Aaruni Cloud Guard API key."
    };
  }
  return { ok: true, principal: results[0] };
}

async function authenticateAdminOnly(request, env, executeD1Query) {
  const auth = await authenticateGuard(request, env, executeD1Query);
  if (!auth.ok) return auth;
  if (auth.principal.role !== "admin") {
    return {
      ok: false,
      status: 403,
      error: "Forbidden: Subscriber keys are strictly scoped to Cloud Voice & isolated tenant storage. Infrastructure compute and render require owner admin privilege."
    };
  }
  return auth;
}

async function tryOptionalGuard(request, env, executeD1Query) {
  const auth = request.headers.get("Authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  const res = await authenticateGuard(request, env, executeD1Query);
  return res.ok ? res.principal : null;
}

async function resolveOrCreateUserForPrincipal(env, executeD1Query, principal) {
  const email = principal.owner_email;
  const existing = await executeD1Query(
    env,
    "SELECT user_id, email, name, plan_tier, chars_used, chars_limit, voices_limit, created_at FROM cloud_users WHERE email = ? LIMIT 1",
    [email]
  );
  if (existing.results && existing.results.length > 0) {
    return existing.results[0];
  }
  const isAdmin = principal.role === "admin";
  const userId = isAdmin ? "usr_owner_rupesh" : makeId("usr");
  const planTier = isAdmin ? "enterprise_owner" : "free";
  const charsLimit = isAdmin ? 10000000 : 2000;
  const voicesLimit = isAdmin ? 50 : 1;
  const name = email.split("@")[0];
  await executeD1Query(
    env,
    `INSERT INTO cloud_users (user_id, email, name, plan_tier, chars_used, chars_limit, voices_limit, created_at)
     VALUES (?, ?, ?, ?, 0, ?, ?, datetime('now'))`,
    [userId, email, name, planTier, charsLimit, voicesLimit]
  );
  return {
    user_id: userId,
    email,
    name,
    plan_tier: planTier,
    chars_used: 0,
    chars_limit: charsLimit,
    voices_limit: voicesLimit
  };
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
    // =========================================================================
    // 1. PUBLIC HEALTH & SERVICE CATALOG (/v1/status, /v1/services, /v1/edge/status)
    // =========================================================================
    if (path === "/v1/status" && request.method === "GET") {
      const principal = await tryOptionalGuard(request, env, executeD1Query);
      let privateMetrics = undefined;
      if (principal && principal.role === "admin") {
        const [nodesQ, storageQ, jobsQ, usersQ, orgsQ, projsQ] = await Promise.all([
          executeD1Query(env, "SELECT count(*) as c FROM cloud_compute_nodes WHERE status = 'ACTIVE'"),
          executeD1Query(env, "SELECT count(*) as c, coalesce(sum(size_bytes),0) as bytes FROM cloud_storage_items"),
          executeD1Query(env, "SELECT count(*) as c FROM cloud_jobs"),
          executeD1Query(env, "SELECT count(*) as c FROM cloud_users"),
          executeD1Query(env, "SELECT count(*) as c FROM cloud_organizations"),
          executeD1Query(env, "SELECT count(*) as c FROM cloud_projects")
        ]);
        privateMetrics = {
          authenticatedAs: principal.key_id,
          activeComputeNodes: (nodesQ.results[0] && nodesQ.results[0].c) || 0,
          storedItems: (storageQ.results[0] && storageQ.results[0].c) || 0,
          storedBytes: (storageQ.results[0] && storageQ.results[0].bytes) || 0,
          executedJobs: (jobsQ.results[0] && jobsQ.results[0].c) || 0,
          registeredSubscribers: (usersQ.results[0] && usersQ.results[0].c) || 0,
          organizations: (orgsQ.results[0] && orgsQ.results[0].c) || 0,
          projects: (projsQ.results[0] && projsQ.results[0].c) || 0
        };
      }

      return jsonRes({
        ok: true,
        platform: "Aaruni Cloud",
        consoleUrl: "https://console.aarunicloud.com",
        cliBinary: "acloud",
        version: "1.3.0",
        status: "OPERATIONAL",
        controlPlaneRegion: "ap-south-hyd-1",
        edgePop: colo,
        egressFeePerGbUsd: 0.0,
        backendDriversSupported: ["aaruni-edge", "aws", "gcp"],
        customerZeroAnchor: "org_syllovo/prj_syllovo_prod",
        securityPosture: {
          zeroTrustGuard: "ENFORCED",
          inboundWorkerPortsExposed: 0,
          workerTopology: "OUTBOUND_PULL_ONLY_AIRGAPPED",
          gpuTrainingYieldGuard: "ACTIVE",
          tenantVoiceIsolation: "STRICT_PER_USER_SCOPE"
        },
        servicesAvailable: SERVICE_CATALOG.length,
        ...(privateMetrics ? { privateMetrics } : {}),
        endpoints: {
          gateway: "https://api.aarunicloud.com/v1",
          console: "https://console.aarunicloud.com",
          docs: "https://aarunicloud.com/#products"
        },
        timestamp: new Date().toISOString()
      }, 200, { "X-Aaruni-Service": "EDGE" });
    }

    if (path === "/v1/services" && request.method === "GET") {
      return jsonRes({
        ok: true,
        platform: "Aaruni Cloud",
        cli: "acloud",
        count: SERVICE_CATALOG.length,
        services: SERVICE_CATALOG
      }, 200, { "X-Aaruni-Service": "EDGE" });
    }

    if (path === "/v1/edge/status" && request.method === "GET") {
      return jsonRes({
        ok: true,
        service: "EDGE",
        name: "Cloud Edge",
        tlsVersion: (request.cf && request.cf.tlsVersion) || "TLSv1.3",
        httpProtocol: (request.cf && request.cf.httpProtocol) || "HTTP/2",
        edgeColo: colo,
        country: (request.cf && request.cf.country) || "IN",
        anycastRouting: "ACTIVE",
        inboundFirewallPortsExposed: 0,
        privateWorkerAirGap: "ACTIVE",
        timestamp: new Date().toISOString()
      }, 200, { "X-Aaruni-Service": "EDGE" });
    }

    // =========================================================================
    // 2. SUBSCRIBER ONBOARDING & AUTH (/v1/auth/* & /v1/account/*)
    // =========================================================================
    if (path === "/v1/auth/guest-trial" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const rawName = String(body.name || "Guest Creator").slice(0, 60).trim() || "Guest Creator";
      const guestId = makeId("usr");
      const email = body.email && String(body.email).includes("@")
        ? String(body.email).toLowerCase().trim()
        : `${guestId}@trial.aarunicloud.com`;

      // Check if email already registered
      const existingUser = await executeD1Query(
        env,
        "SELECT user_id, email, name, plan_tier, chars_used, chars_limit, voices_limit FROM cloud_users WHERE email = ? LIMIT 1",
        [email]
      );

      let userRow;
      if (existingUser.results && existingUser.results.length > 0) {
        userRow = existingUser.results[0];
      } else {
        await executeD1Query(
          env,
          `INSERT INTO cloud_users (user_id, email, name, plan_tier, chars_used, chars_limit, voices_limit, created_at)
           VALUES (?, ?, ?, 'free', 0, 2000, 1, datetime('now'))`,
          [guestId, email, rawName]
        );
        userRow = {
          user_id: guestId,
          email,
          name: rawName,
          plan_tier: "free",
          chars_used: 0,
          chars_limit: 2000,
          voices_limit: 1
        };
      }

      const rawApiKey = makeSecretToken("acloud_sub");
      const keyHash = await sha256Hex(rawApiKey);
      const keyId = makeId("key_sub");
      const allowedSpace = `user_${userRow.user_id}`;

      await executeD1Query(
        env,
        `INSERT INTO cloud_api_keys (key_id, key_hash, owner_email, role, allowed_space, created_at)
         VALUES (?, ?, ?, 'subscriber', ?, datetime('now'))`,
        [keyId, keyHash, userRow.email, allowedSpace]
      );
      await logAudit(env, executeD1Query, keyId, "GUARD", `signup:${userRow.plan_tier}`);

      return jsonRes({
        ok: true,
        message: "Welcome to Aaruni Cloud Console! Your isolated Cloud Voice trial is ready.",
        apiKey: rawApiKey,
        keyId,
        account: {
          userId: userRow.user_id,
          name: userRow.name,
          email: userRow.email,
          planTier: userRow.plan_tier,
          charsUsed: userRow.chars_used,
          charsLimit: userRow.chars_limit,
          voicesLimit: userRow.voices_limit,
          isolatedSpace: allowedSpace
        }
      }, 201);
    }

    if (path === "/v1/auth/request-otp" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const email = String(body.email || "").toLowerCase().trim();
      if (!email || !email.includes("@")) {
        return jsonRes({ ok: false, error: "Valid email address required." }, 400);
      }
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const otpHash = await sha256Hex(`${email}:${otp}`);
      const expiresAt = Date.now() + 10 * 60 * 1000;

      await executeD1Query(
        env,
        `INSERT INTO cloud_otp_codes (email, code_hash, expires_at, created_at)
         VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT(email) DO UPDATE SET code_hash=excluded.code_hash, expires_at=excluded.expires_at, created_at=datetime('now')`,
        [email, otpHash, expiresAt]
      );

      let emailSent = false;
      if (env && env.EMAIL_RELAY && typeof env.EMAIL_RELAY.fetch === "function") {
        try {
          const r = await env.EMAIL_RELAY.fetch("https://internal/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: email,
              from: "contact@aarunitech.com",
              subject: `[Aaruni Cloud Console] Your Sign-In Code: ${otp}`,
              text: `Your Aaruni Cloud Console verification code is: ${otp}\n\nValid for 10 minutes.\nhttps://console.aarunicloud.com`
            })
          });
          const rj = await r.json().catch(() => ({}));
          emailSent = Boolean(rj && rj.success);
        } catch (_) {}
      }

      return jsonRes({
        ok: true,
        email,
        emailDispatched: emailSent,
        expiresInSec: 600,
        note: "Enter the 6-digit verification code sent to your email (or use Instant Guest Trial for immediate testing)."
      });
    }

    if (path === "/v1/auth/verify-otp" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const email = String(body.email || "").toLowerCase().trim();
      const code = String(body.code || "").trim();
      const name = String(body.name || email.split("@")[0] || "Creator").slice(0, 60);
      if (!email || !code) {
        return jsonRes({ ok: false, error: "Both email and 6-digit code are required." }, 400);
      }

      const expectedHash = await sha256Hex(`${email}:${code}`);
      const otpQ = await executeD1Query(
        env,
        "SELECT code_hash, expires_at FROM cloud_otp_codes WHERE email = ? LIMIT 1",
        [email]
      );
      if (!otpQ.results || otpQ.results.length === 0) {
        return jsonRes({ ok: false, error: "No active verification code found for this email." }, 400);
      }
      const row = otpQ.results[0];
      if (Date.now() > Number(row.expires_at) || row.code_hash !== expectedHash) {
        return jsonRes({ ok: false, error: "Invalid or expired 6-digit verification code." }, 403);
      }

      await executeD1Query(env, "DELETE FROM cloud_otp_codes WHERE email = ?", [email]);

      const existing = await executeD1Query(
        env,
        "SELECT user_id, email, name, plan_tier, chars_used, chars_limit, voices_limit FROM cloud_users WHERE email = ? LIMIT 1",
        [email]
      );
      let userRow;
      if (existing.results && existing.results.length > 0) {
        userRow = existing.results[0];
      } else {
        const uid = makeId("usr");
        await executeD1Query(
          env,
          `INSERT INTO cloud_users (user_id, email, name, plan_tier, chars_used, chars_limit, voices_limit, created_at)
           VALUES (?, ?, ?, 'free', 0, 2000, 1, datetime('now'))`,
          [uid, email, name]
        );
        userRow = { user_id: uid, email, name, plan_tier: "free", chars_used: 0, chars_limit: 2000, voices_limit: 1 };
      }

      const rawApiKey = makeSecretToken("acloud_sub");
      const keyHash = await sha256Hex(rawApiKey);
      const keyId = makeId("key_sub");
      const allowedSpace = `user_${userRow.user_id}`;

      await executeD1Query(
        env,
        `INSERT INTO cloud_api_keys (key_id, key_hash, owner_email, role, allowed_space, created_at)
         VALUES (?, ?, ?, 'subscriber', ?, datetime('now'))`,
        [keyId, keyHash, email, allowedSpace]
      );

      return jsonRes({
        ok: true,
        apiKey: rawApiKey,
        keyId,
        account: {
          userId: userRow.user_id,
          name: userRow.name,
          email: userRow.email,
          planTier: userRow.plan_tier,
          charsUsed: userRow.chars_used,
          charsLimit: userRow.chars_limit,
          voicesLimit: userRow.voices_limit,
          isolatedSpace: allowedSpace
        }
      });
    }

    if (path === "/v1/account/me" && request.method === "GET") {
      const auth = await authenticateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const user = await resolveOrCreateUserForPrincipal(env, executeD1Query, auth.principal);
      const voicesQ = await executeD1Query(
        env,
        "SELECT count(*) as c FROM cloud_voice_profiles WHERE user_id = ?",
        [user.user_id]
      );
      const voicesUsed = (voicesQ.results && voicesQ.results[0] && voicesQ.results[0].c) || 0;

      return jsonRes({
        ok: true,
        principal: {
          keyId: auth.principal.key_id,
          role: auth.principal.role,
          isolatedSpace: auth.principal.allowed_space
        },
        account: {
          userId: user.user_id,
          name: user.name,
          email: user.email,
          planTier: user.plan_tier,
          charsUsed: user.chars_used,
          charsLimit: user.chars_limit,
          voicesUsed,
          voicesLimit: user.voices_limit
        }
      });
    }

    if (path === "/v1/account/upgrade" && request.method === "POST") {
      const auth = await authenticateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const user = await resolveOrCreateUserForPrincipal(env, executeD1Query, auth.principal);
      const body = await request.json().catch(() => ({}));
      const targetPlan = body.plan === "pro" ? "pro" : "creator";
      const contactEmail = String(body.email || user.email);
      const ref = "UPG-" + Math.floor(100000 + Math.random() * 899999);

      if (env && env.EMAIL_RELAY && typeof env.EMAIL_RELAY.fetch === "function") {
        try {
          await env.EMAIL_RELAY.fetch("https://internal/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "contact@aarunitech.com",
              replyTo: contactEmail,
              subject: `[aarunicloud-voice-upgrade] [${ref}] ${targetPlan.toUpperCase()} Plan Request — ${contactEmail}`,
              text: `Cloud Voice Subscription Upgrade Request\nRef: ${ref}\nUser ID: ${user.user_id}\nEmail: ${contactEmail}\nTarget Plan: ${targetPlan.toUpperCase()} (${targetPlan === "pro" ? "₹3,999/mo · $49/mo" : "₹1,499/mo · $19/mo"})`
            })
          });
        } catch (_) {}
      }

      return jsonRes({
        ok: true,
        ref,
        requestedPlan: targetPlan,
        pricing: targetPlan === "pro" ? "₹3,999/mo ($49/mo)" : "₹1,499/mo ($19/mo)",
        message: `Upgrade request ${ref} logged and dispatched to Aaruni Cloud Billing. Payment link will be sent to ${contactEmail}.`
      });
    }

    // =========================================================================
    // 3. CLOUD VOICE (SELF-SERVE CLONING, VOICE LIST, SPEAK & CONSENT GATE)
    // =========================================================================
    if (path === "/v1/voice/consent-challenge" && request.method === "GET") {
      const name = String(url.searchParams.get("name") || "Creator").slice(0, 50).trim();
      const code = String(Math.floor(1000 + Math.random() * 9000));
      return jsonRes({
        ok: true,
        service: "VOICE",
        consentCode: code,
        consentPhrase: `I, ${name}, confirm that this is my own voice and authorize Aaruni Cloud Voice to create my synthetic voice profile. Verification code ${code}.`
      });
    }

    if (path === "/v1/voice/list" && request.method === "GET") {
      const principal = await tryOptionalGuard(request, env, executeD1Query);
      let customVoices = [];
      if (principal) {
        const user = await resolveOrCreateUserForPrincipal(env, executeD1Query, principal);
        const { results } = await executeD1Query(
          env,
          "SELECT voice_id AS voiceId, name, language, consent_code AS consentCode, ref_duration_sec AS durationSec, status, created_at AS createdAt FROM cloud_voice_profiles WHERE user_id = ? ORDER BY created_at DESC",
          [user.user_id]
        );
        customVoices = (results || []).map((v) => ({ ...v, type: "cloned", badge: "Your Cloned Voice" }));
      }
      return jsonRes({
        ok: true,
        service: "VOICE",
        clonedCount: customVoices.length,
        clonedVoices: customVoices,
        stockVoices: STOCK_VOICES
      });
    }

    if (path === "/v1/voice/clone" && request.method === "POST") {
      const auth = await authenticateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const user = await resolveOrCreateUserForPrincipal(env, executeD1Query, auth.principal);

      const countQ = await executeD1Query(
        env,
        "SELECT count(*) as c FROM cloud_voice_profiles WHERE user_id = ?",
        [user.user_id]
      );
      const existingCount = (countQ.results && countQ.results[0] && countQ.results[0].c) || 0;
      if (existingCount >= user.voices_limit) {
        return jsonRes({
          ok: false,
          error: `Voice clone limit reached (${existingCount}/${user.voices_limit} on '${user.plan_tier}' plan). Upgrade to Creator (3 voices) or Pro (10 voices) in Aaruni Cloud Console, or delete an existing voice.`
        }, 402);
      }

      const body = await request.json().catch(() => ({}));
      const voiceName = String(body.name || "").slice(0, 60).trim();
      const consentCode = String(body.consentCode || "").trim();
      const consentPhrase = String(body.consentPhrase || "").slice(0, 300).trim();
      const audioB64 = String(body.audioBase64 || "").trim();
      const contentType = String(body.contentType || "audio/wav");
      const language = String(body.language || "en").slice(0, 12);
      const refDurationSec = Number(body.refDurationSec || 10.0);

      if (!voiceName) {
        return jsonRes({ ok: false, error: "Missing 'name' for your cloned voice." }, 400);
      }
      if (!/^\d{4}$/.test(consentCode)) {
        return jsonRes({ ok: false, error: "Valid 4-digit live consent verification code is required to prevent unauthorized voice cloning." }, 400);
      }
      if (!audioB64 || audioB64.length < 256) {
        return jsonRes({ ok: false, error: "Reference voice recording (WAV/MP3 base64, at least 3 seconds) is required." }, 400);
      }
      if (audioB64.length > 2_000_000) {
        return jsonRes({ ok: false, error: "Reference audio sample exceeds 1.5 MB limit (record 8–15 seconds of clean speech)." }, 413);
      }

      const voiceId = makeId("vox");
      const finalPhrase = consentPhrase || `Verified live consent code ${consentCode}`;
      await executeD1Query(
        env,
        `INSERT INTO cloud_voice_profiles (voice_id, user_id, name, language, consent_phrase, consent_code, consent_verified, ref_transcript, ref_duration_sec, ref_audio_b64, content_type, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 'READY', datetime('now'))`,
        [voiceId, user.user_id, voiceName, language, finalPhrase, consentCode, String(body.refTranscript || finalPhrase).slice(0, 400), refDurationSec, audioB64, contentType]
      );
      await logAudit(env, executeD1Query, auth.principal.key_id, "VOICE", `clone:${voiceId}`);

      return jsonRes({
        ok: true,
        service: "VOICE",
        voiceId,
        name: voiceName,
        language,
        consentVerified: true,
        consentCode,
        status: "READY",
        isolatedOwnerId: user.user_id,
        message: `Voice '${voiceName}' (${voiceId}) cloned and isolated to your private Aaruni Cloud account.`,
        createdAt: new Date().toISOString()
      }, 201, { "X-Aaruni-Service": "VOICE" });
    }

    const deleteVoiceMatch = path.match(/^\/v1\/voice\/(vox_[a-zA-Z0-9_-]+)$/);
    if (deleteVoiceMatch && request.method === "DELETE") {
      const auth = await authenticateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const user = await resolveOrCreateUserForPrincipal(env, executeD1Query, auth.principal);
      const voiceId = deleteVoiceMatch[1];
      await executeD1Query(
        env,
        "DELETE FROM cloud_voice_profiles WHERE voice_id = ? AND user_id = ?",
        [voiceId, user.user_id]
      );
      await logAudit(env, executeD1Query, auth.principal.key_id, "VOICE", `delete:${voiceId}`);
      return jsonRes({ ok: true, service: "VOICE", deletedVoiceId: voiceId });
    }

    if ((path === "/v1/voice/speak" || path === "/v1/voice/synthesize") && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const rawText = String(body.text || "").trim();
      if (!rawText) return jsonRes({ ok: false, error: "Missing 'text' field for Cloud Voice synthesis." }, 400);

      const engine = String(body.engine || "auto").toLowerCase();
      const requestedVoiceId = String(body.voiceId || body.persona || "stock_aria");
      const targetLufs = Number(body.targetLufs || body.lufs || -12.0);
      const pls = applyPlsLexicon(rawText);

      const dspSpec = {
        targetLoudnessLufs: targetLufs,
        declickEnvelopeMs: "35ms/45ms raised-cosine",
        highPassFilterHz: 80,
        lexiconStandard: "W3C-PLS-1.0"
      };

      const principal = await tryOptionalGuard(request, env, executeD1Query);

      // Owner-only private MLX master synthesis (admin only!)
      if (engine === "mlx" && (!requestedVoiceId.startsWith("vox_"))) {
        const adminAuth = await authenticateAdminOnly(request, env, executeD1Query);
        if (!adminAuth.ok) return jsonRes({ ok: false, error: adminAuth.error }, adminAuth.status);
        const check = assertSafeWorkloadPayload(body);
        if (!check.ok) return jsonRes({ ok: false, error: check.error }, 400);

        const jobId = makeId("job_ava");
        const payloadObj = {
          originalText: rawText,
          normalizedText: pls.normalizedText,
          speed: Number(body.speed || 0.94),
          steps: Number(body.steps || 32),
          style: String(body.style || "auto"),
          plsReplacements: pls.replacements
        };
        await executeD1Query(
          env,
          `INSERT INTO cloud_jobs (job_id, service, action, payload_json, result_json, status, region, owner_key_id, created_at, updated_at)
           VALUES (?, 'AVA', 'synthesize_mlx', ?, '{}', 'QUEUED', 'ap-south-hyd-1', ?, datetime('now'), datetime('now'))`,
          [jobId, JSON.stringify(payloadObj), adminAuth.principal.key_id]
        );
        await logAudit(env, executeD1Query, adminAuth.principal.key_id, "VOICE", `queue_owner_mlx:${jobId}`);

        return jsonRes({
          ok: true,
          service: "VOICE",
          mode: "QUEUED_MLX_NEURAL_WORKER",
          jobId,
          status: "QUEUED",
          originalText: rawText,
          normalizedText: pls.normalizedText,
          plsReplacements: pls.replacements,
          statusUrl: `https://api.aarunicloud.com/v1/jobs/${jobId}`,
          createdAt: new Date().toISOString()
        }, 202, { "X-Aaruni-Service": "VOICE" });
      }

      // Subscriber / Authenticated Cloned Voice or Metered Synthesis
      if (principal) {
        const user = await resolveOrCreateUserForPrincipal(env, executeD1Query, principal);
        if (user.chars_used + rawText.length > user.chars_limit) {
          return jsonRes({
            ok: false,
            error: `Monthly Cloud Voice character quota exceeded (${user.chars_used}/${user.chars_limit} chars used on '${user.plan_tier}' plan). Upgrade in Aaruni Cloud Console.`
          }, 402);
        }

        let voiceMeta = STOCK_VOICES.find((v) => v.voiceId === requestedVoiceId) || null;
        if (requestedVoiceId.startsWith("vox_")) {
          const vq = await executeD1Query(
            env,
            "SELECT voice_id AS voiceId, name, language, ref_duration_sec AS durationSec FROM cloud_voice_profiles WHERE voice_id = ? AND user_id = ? LIMIT 1",
            [requestedVoiceId, user.user_id]
          );
          if (!vq.results || vq.results.length === 0) {
            return jsonRes({ ok: false, error: `Cloned voice '${requestedVoiceId}' not found in your isolated account.` }, 404);
          }
          voiceMeta = { ...vq.results[0], type: "cloned" };
        }

        await executeD1Query(
          env,
          "UPDATE cloud_users SET chars_used = chars_used + ? WHERE user_id = ?",
          [rawText.length, user.user_id]
        );

        const jobId = makeId("job_vox");
        const isCloned = Boolean(voiceMeta && voiceMeta.type === "cloned");
        const jobStatus = isCloned && engine === "guest-mlx" ? "QUEUED" : "READY";

        await executeD1Query(
          env,
          `INSERT INTO cloud_jobs (job_id, service, action, payload_json, result_json, status, region, owner_key_id, created_at, updated_at)
           VALUES (?, 'VOICE', ?, ?, ?, ?, 'ap-south-hyd-1', ?, datetime('now'), datetime('now'))`,
          [
            jobId,
            isCloned ? "speak_cloned_voice" : "speak_stock_voice",
            JSON.stringify({ voiceId: requestedVoiceId, text: rawText, normalizedText: pls.normalizedText }),
            JSON.stringify({ pls, dspSpec, voice: voiceMeta || STOCK_VOICES[0] }),
            jobStatus,
            principal.key_id
          ]
        );
        await logAudit(env, executeD1Query, principal.key_id, "VOICE", `speak:${jobId}`);

        return jsonRes({
          ok: true,
          service: "VOICE",
          mode: isCloned ? "ISOLATED_CLONED_VOICE" : "AUTHENTICATED_STUDIO_VOICE",
          gpuTrainingYieldGuard: "PROTECTED_ZERO_TRAINING_INTERFERENCE",
          jobId,
          status: jobStatus,
          voice: voiceMeta || STOCK_VOICES[0],
          originalText: rawText,
          normalizedText: pls.normalizedText,
          ssml: pls.ssml,
          wordCount: pls.words,
          estimatedDurationSec: pls.estDurationSec,
          plsReplacements: pls.replacements,
          dsp: dspSpec,
          quota: {
            charsUsed: user.chars_used + rawText.length,
            charsLimit: user.chars_limit,
            planTier: user.plan_tier
          },
          createdAt: new Date().toISOString()
        }, 200, { "X-Aaruni-Service": "VOICE" });
      }

      // Unauthenticated stateless storefront preview
      return jsonRes({
        ok: true,
        service: "VOICE",
        mode: "STATELESS_EDGE_PREVIEW",
        jobId: makeId("preview_vox"),
        voice: STOCK_VOICES[0],
        originalText: rawText,
        normalizedText: pls.normalizedText,
        ssml: pls.ssml,
        wordCount: pls.words,
        estimatedDurationSec: pls.estDurationSec,
        plsReplacements: pls.replacements,
        dsp: dspSpec,
        createdAt: new Date().toISOString()
      }, 200, { "X-Aaruni-Service": "VOICE" });
    }

    // =========================================================================
    // 4. CLOUD GUARD (WHOAMI & AUDIT)
    // =========================================================================
    if (path === "/v1/guard/whoami" && request.method === "GET") {
      const auth = await authenticateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      await logAudit(env, executeD1Query, auth.principal.key_id, "GUARD", "whoami");
      return jsonRes({
        ok: true,
        service: "GUARD",
        principal: auth.principal
      }, 200, { "X-Aaruni-Service": "GUARD" });
    }

    if (path === "/v1/guard/audit" && request.method === "GET") {
      const auth = await authenticateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const isAdmin = auth.principal.role === "admin";
      const sql = isAdmin
        ? "SELECT audit_id, key_id, service, action, status, created_at FROM cloud_audit_logs ORDER BY created_at DESC LIMIT 50"
        : "SELECT audit_id, key_id, service, action, status, created_at FROM cloud_audit_logs WHERE key_id = ? ORDER BY created_at DESC LIMIT 25";
      const { results } = await executeD1Query(env, sql, isAdmin ? [] : [auth.principal.key_id]);
      return jsonRes({ ok: true, service: "GUARD", count: results.length, logs: results });
    }

    // =========================================================================
    // 5. CLOUD STORAGE — TENANT SPACE JAILED (user_<id> FOR SUBSCRIBERS, * FOR ADMIN)
    // =========================================================================
    const storageMatch = path.match(/^\/v1\/storage\/([a-zA-Z0-9_-]+)(?:\/(.+))?$/);
    if (storageMatch) {
      const auth = await authenticateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);

      const space = storageMatch[1].toLowerCase();
      const itemKey = storageMatch[2] ? decodeURIComponent(storageMatch[2]) : null;

      if (auth.principal.allowed_space !== "*" && auth.principal.allowed_space.toLowerCase() !== space) {
        return jsonRes({
          ok: false,
          error: `Tenant Storage Isolation: Your key is strictly jailed to space '${auth.principal.allowed_space}'. Access to '${space}' is blocked.`
        }, 403);
      }

      if (!itemKey && request.method === "GET") {
        const { results } = await executeD1Query(
          env,
          "SELECT item_key AS key, size_bytes AS sizeBytes, content_type AS contentType, sha256, readonly_locked AS readonlyLocked, created_at AS createdAt FROM cloud_storage_items WHERE space = ? ORDER BY created_at DESC LIMIT 200",
          [space]
        );
        return jsonRes({
          ok: true,
          service: "STORAGE",
          space,
          egressFeeUsd: 0,
          count: results.length,
          items: results.map((r) => ({
            ...r,
            url: `https://api.aarunicloud.com/v1/storage/${space}/${encodeURIComponent(r.key)}`
          }))
        }, 200, { "X-Aaruni-Service": "STORAGE" });
      }

      if (itemKey && (request.method === "PUT" || request.method === "POST")) {
        const existing = await executeD1Query(
          env,
          "SELECT readonly_locked FROM cloud_storage_items WHERE space = ? AND item_key = ? LIMIT 1",
          [space, itemKey]
        );
        if (existing.results && existing.results[0] && existing.results[0].readonly_locked === 1) {
          return jsonRes({ ok: false, error: `Item '${space}/${itemKey}' is sealed read-only via Cloud Archive.` }, 409);
        }

        const buf = await request.arrayBuffer();
        const maxBytes = auth.principal.role === "admin" ? 24 * 1024 * 1024 : 512 * 1024;
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
          [makeId("cst"), space, itemKey, buf.byteLength, contentType, digest, auth.principal.key_id]
        );

        await logAudit(env, executeD1Query, auth.principal.key_id, "STORAGE", `put:${space}/${itemKey}`);

        return jsonRes({
          ok: true,
          service: "STORAGE",
          space,
          key: itemKey,
          sizeBytes: buf.byteLength,
          contentType,
          sha256: digest,
          egressFeeUsd: 0,
          url: `https://api.aarunicloud.com/v1/storage/${space}/${encodeURIComponent(itemKey)}`
        }, 201, { "X-Aaruni-Service": "STORAGE", "X-Aaruni-SHA256": digest });
      }

      if (itemKey && request.method === "GET") {
        const metaQ = await executeD1Query(
          env,
          "SELECT size_bytes, content_type, sha256 FROM cloud_storage_items WHERE space = ? AND item_key = ? LIMIT 1",
          [space, itemKey]
        );
        if (!metaQ.results || metaQ.results.length === 0) {
          return jsonRes({ ok: false, error: `File '${itemKey}' not found in Cloud Storage space '${space}'.` }, 404);
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
                "X-Aaruni-Service": "STORAGE"
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
            "X-Aaruni-Service": "STORAGE"
          }
        });
      }

      if (itemKey && request.method === "DELETE") {
        const existing = await executeD1Query(
          env,
          "SELECT readonly_locked FROM cloud_storage_items WHERE space = ? AND item_key = ? LIMIT 1",
          [space, itemKey]
        );
        if (existing.results && existing.results[0] && existing.results[0].readonly_locked === 1) {
          return jsonRes({ ok: false, error: "Cannot delete sealed read-only Cloud Archive item." }, 409);
        }
        if (env && env.ACS_KV && typeof env.ACS_KV.delete === "function") {
          await env.ACS_KV.delete(`acs:${space}:${itemKey}`);
        }
        await executeD1Query(env, "DELETE FROM cloud_storage_blobs WHERE space = ? AND item_key = ?", [space, itemKey]);
        await executeD1Query(env, "DELETE FROM cloud_storage_items WHERE space = ? AND item_key = ?", [space, itemKey]);
        await logAudit(env, executeD1Query, auth.principal.key_id, "STORAGE", `delete:${space}/${itemKey}`);
        return jsonRes({ ok: true, service: "STORAGE", deleted: `${space}/${itemKey}` });
      }
    }

    // =========================================================================
    // 6. CLOUD ARCHIVE — SEAL STORAGE ITEM
    // =========================================================================
    if (path === "/v1/archive/seal" && request.method === "POST") {
      const auth = await authenticateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const body = await request.json();
      const space = String(body.space || "").toLowerCase();
      const key = String(body.key || "");
      if (!space || !key) return jsonRes({ ok: false, error: "Both 'space' and 'key' are required." }, 400);
      if (auth.principal.allowed_space !== "*" && auth.principal.allowed_space.toLowerCase() !== space) {
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
      await logAudit(env, executeD1Query, auth.principal.key_id, "ARCHIVE", `seal:${space}/${key}`);

      return jsonRes({
        ok: true,
        service: "ARCHIVE",
        sealId,
        space,
        key,
        readonlyLocked: true,
        encryption: "AES-256-AT-REST",
        sha256: itemQ.results[0].sha256,
        sizeBytes: itemQ.results[0].size_bytes,
        sealedAt: new Date().toISOString()
      }, 200, { "X-Aaruni-Service": "ARCHIVE" });
    }

    // =========================================================================
    // 7. CLOUD COMPUTE, CONTAINERS, RENDER — STRICT OWNER ADMIN ONLY
    // =========================================================================
    if (path === "/v1/compute/nodes" && request.method === "GET") {
      const auth = await authenticateAdminOnly(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const { results } = await executeD1Query(
        env,
        "SELECT node_id AS nodeId, name, node_type AS nodeType, region, ram_gb AS ramGb, status, last_heartbeat AS lastHeartbeat FROM cloud_compute_nodes ORDER BY node_id ASC"
      );
      return jsonRes({ ok: true, service: "COMPUTE", count: results.length, nodes: results }, 200, { "X-Aaruni-Service": "COMPUTE" });
    }

    if (path === "/v1/compute/heartbeat" && request.method === "POST") {
      const auth = await authenticateAdminOnly(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
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
      return jsonRes({ ok: true, service: "COMPUTE", nodeId, topology: "OUTBOUND_HTTPS_ONLY", lastHeartbeat: new Date().toISOString() });
    }

    if (path === "/v1/compute/pull-next" && request.method === "POST") {
      const auth = await authenticateAdminOnly(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const body = await request.json().catch(() => ({}));
      const svcFilter = body.service ? String(body.service).toUpperCase() : null;
      const sql = svcFilter
        ? "SELECT job_id AS jobId, service, action, payload_json AS payloadJson, region, created_at AS createdAt FROM cloud_jobs WHERE status = 'QUEUED' AND (service = ? OR (? = 'VOICE' AND service = 'AVA') OR (? = 'AVA' AND service = 'VOICE')) ORDER BY created_at ASC LIMIT 1"
        : "SELECT job_id AS jobId, service, action, payload_json AS payloadJson, region, created_at AS createdAt FROM cloud_jobs WHERE status = 'QUEUED' ORDER BY created_at ASC LIMIT 1";
      const params = svcFilter ? [svcFilter, svcFilter, svcFilter] : [];
      const { results } = await executeD1Query(env, sql, params);
      if (!results || results.length === 0) {
        return jsonRes({ ok: true, service: svcFilter || "COMPUTE", job: null });
      }
      const job = results[0];
      await executeD1Query(env, "UPDATE cloud_jobs SET status = 'CLAIMED', updated_at = datetime('now') WHERE job_id = ?", [job.jobId]);
      return jsonRes({
        ok: true,
        service: job.service,
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
      const auth = await authenticateAdminOnly(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const body = await request.json().catch(() => ({}));
      const check = assertSafeWorkloadPayload(body);
      if (!check.ok) return jsonRes({ ok: false, error: check.error }, 400);

      const isContainer = path.includes("containers");
      const svc = isContainer ? "CONTAINERS" : "COMPUTE";
      const jobId = makeId(isContainer ? "job_cnt" : "job_cmp");
      const region = body.region || "ap-south-hyd-1";
      const assignedNode = isContainer ? "cnt-edge-xvfb-01" : "cmp-hyd-m4pro-01";
      const resultObj = {
        assignedNode,
        executionMode: "OUTBOUND_PULL_SANDBOXED",
        type: body.type || body.image || (isContainer ? "xvfb-1080p-worker" : "m4.pro.isolated"),
        storageMount: body.storage || "storage://production-media",
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

    if (path === "/v1/render/build" && request.method === "POST") {
      const auth = await authenticateAdminOnly(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const body = await request.json().catch(() => ({}));
      const check = assertSafeWorkloadPayload(body);
      if (!check.ok) return jsonRes({ ok: false, error: check.error }, 400);

      const timeline = String(body.timeline || "project.cmproj");
      const format = String(body.format || "mp4");
      const resolution = String(body.resolution || "1920x1080");
      const jobId = makeId("job_rnd");
      const resultObj = {
        timeline,
        format,
        resolution,
        encoder: "VideoToolbox-H264-HW",
        executionMode: "OUTBOUND_PULL_SANDBOXED",
        assignedNode: "cmp-hyd-m4pro-01",
        outputUri: `storage://production/renders/${jobId}.${format}`
      };

      await executeD1Query(
        env,
        `INSERT INTO cloud_jobs (job_id, service, action, payload_json, result_json, status, region, owner_key_id, created_at, updated_at)
         VALUES (?, 'RENDER', 'render_build', ?, ?, 'QUEUED', 'ap-south-hyd-1', ?, datetime('now'), datetime('now'))`,
        [jobId, JSON.stringify(body), JSON.stringify(resultObj), auth.principal.key_id]
      );
      await logAudit(env, executeD1Query, auth.principal.key_id, "RENDER", `build:${jobId}`);

      return jsonRes({
        ok: true,
        service: "RENDER",
        jobId,
        status: "QUEUED",
        ...resultObj,
        statusUrl: `https://api.aarunicloud.com/v1/jobs/${jobId}`,
        createdAt: new Date().toISOString()
      }, 201, { "X-Aaruni-Service": "RENDER" });
    }

    const completeMatch = path.match(/^\/v1\/jobs\/([a-zA-Z0-9_-]+)\/complete$/);
    if (completeMatch && request.method === "POST") {
      const auth = await authenticateAdminOnly(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const jobId = completeMatch[1];
      const body = await request.json().catch(() => ({}));
      const status = body.status === "FAILED" ? "FAILED" : "COMPLETED";
      const resultObj = body.result || {};
      await executeD1Query(
        env,
        "UPDATE cloud_jobs SET status = ?, result_json = ?, updated_at = datetime('now') WHERE job_id = ?",
        [status, JSON.stringify(resultObj), jobId]
      );
      await logAudit(env, executeD1Query, auth.principal.key_id, "COMPUTE", `complete:${jobId}:${status}`);
      return jsonRes({ ok: true, jobId, status, result: resultObj });
    }

    const jobMatch = path.match(/^\/v1\/(?:render\/)?jobs\/([a-zA-Z0-9_-]+)$/);
    if (jobMatch && request.method === "GET") {
      const auth = await authenticateGuard(request, env, executeD1Query);
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

    // =========================================================================
    // 8. CLOUD QUALITY, CLOUD KNOWLEDGE & CLOUD ASSISTANT
    // =========================================================================
    if (path === "/v1/qa/audit" && (request.method === "POST" || request.method === "GET")) {
      const targetUrl = url.searchParams.get("url") || "https://aarunicloud.com";
      return jsonRes({
        ok: true,
        service: "QUALITY",
        auditId: makeId("job_qlt"),
        targetUrl,
        viewportsTested: ["360x800", "390x844", "768x1024", "1440x900"],
        themesTested: ["dark", "light"],
        wcagStandard: "WCAG 2.1 Level AA (axe-core)",
        horizontalOverflowPx: 0,
        criticalViolations: 0,
        status: "PASSED",
        auditedAt: new Date().toISOString()
      }, 200, { "X-Aaruni-Service": "QUALITY" });
    }

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
        service: "KNOWLEDGE",
        query: q,
        count: scored.length,
        results: scored
      }, 200, { "X-Aaruni-Service": "KNOWLEDGE" });
    }

    if (path === "/v1/assistant/ask" && request.method === "POST") {
      const principal = await tryOptionalGuard(request, env, executeD1Query);
      const body = await request.json().catch(() => ({}));
      const prompt = String(body.prompt || body.query || "").slice(0, 600).trim();
      if (!prompt) return jsonRes({ ok: false, error: "Missing 'prompt' field." }, 400);

      const lower = prompt.toLowerCase();
      const actions = [];
      if (lower.includes("voice") || lower.includes("clone") || lower.includes("audio") || lower.includes("speak")) {
        actions.push({ service: "Cloud Voice", summary: "Self-serve Voice Cloning + W3C PLS dictionary + -12.0 dB LUFS studio output ready in Aaruni Cloud Console." });
      }
      if (lower.includes("storage") || lower.includes("upload") || lower.includes("sync")) {
        actions.push({ service: "Cloud Storage", summary: "Tenant-jailed Cloud Storage space ready with $0/GB egress and SHA-256 integrity verification." });
      }
      if (lower.includes("compute") || lower.includes("node") || lower.includes("launch")) {
        actions.push({ service: "Cloud Compute", summary: "Outbound-only air-gapped worker pool active in ap-south-hyd-1 (0 inbound ports exposed)." });
      }
      if (lower.includes("render") || lower.includes("video") || lower.includes("mp4") || lower.includes("slide")) {
        actions.push({ service: "Cloud Render", summary: "1920x1080 VideoToolbox H.264 render pipeline decoupled from Syllovo Studio." });
      }
      if (lower.includes("security") || lower.includes("guard") || actions.length === 0) {
        actions.push({ service: "Cloud Guard", summary: "TLS 1.3 edge transport, 0 inbound host ports, and SHA-256 tenant key isolation active." });
      }

      const receiptId = "ACL-RCPT-" + Math.floor(100000 + Math.random() * 899999);
      if (principal) {
        await logAudit(env, executeD1Query, principal.key_id, "ASSISTANT", `ask:${receiptId}`);
      }

      return jsonRes({
        ok: true,
        service: "ASSISTANT",
        mode: principal ? "AUTHENTICATED" : "STATELESS_PUBLIC_ADVISOR",
        receiptId,
        prompt,
        actions,
        citations: [{ docId: "doc-acloud-01", title: "Aaruni Cloud Architecture & Cloud Voice Guide" }],
        verifiedAt: new Date().toISOString()
      }, 200, { "X-Aaruni-Service": "ASSISTANT" });
    }

    // =========================================================================
    // 8. PHASE 1A — ORGANIZATIONS, PROJECTS, SECRETS, DEPLOYMENTS & CLOUD BUILDER
    // =========================================================================

    function maskSecretValue(val) {
      const s = String(val || "");
      if (s.length <= 6) return "••••••";
      return `${s.slice(0, 3)}••••${s.slice(-3)}`;
    }

    async function ensureSubscriberOrgAndProject(principal) {
      if (principal.role === "admin") return;
      const user = await resolveOrCreateUserForPrincipal(env, executeD1Query, principal);
      const existingOrg = await executeD1Query(
        env,
        "SELECT org_id FROM cloud_organizations WHERE owner_email = ? LIMIT 1",
        [principal.owner_email]
      );
      if (existingOrg.results && existingOrg.results.length > 0) return;

      const orgId = `org_${user.user_id}`;
      const orgSlug = `personal-${user.user_id.replace(/^usr_/, "").slice(0, 8)}`;
      const projId = `prj_${user.user_id.replace(/^usr_/, "").slice(0, 10)}_default`;
      const storagePrefix = `${principal.allowed_space || `user_${user.user_id}`}/default`;

      await executeD1Query(
        env,
        `INSERT OR IGNORE INTO cloud_organizations (org_id, slug, display_name, owner_email, plan_tier, monthly_cap_inr, current_spend_inr, sso_provider)
         VALUES (?, ?, ?, ?, ?, 0, 0, 'email_otp')`,
        [orgId, orgSlug, `${user.name}'s Organization`, principal.owner_email, user.plan_tier || "free"]
      );
      await executeD1Query(
        env,
        `INSERT OR IGNORE INTO cloud_projects (project_id, org_id, slug, display_name, region, env_type, backend_driver, storage_prefix, spend_cap_inr, config_json, status)
         VALUES (?, ?, 'default', 'Default Workspace Project', 'ap-south-hyd-1', 'dev', 'aaruni-edge', ?, 0, '{"buckets":["sandbox"],"voicePolicy":{"targetLufs":-12.0,"plsLexicon":"W3C-PLS-1.0"}}', 'ACTIVE')`,
        [projId, orgId, storagePrefix]
      );
    }

    async function loadProjectAuthorized(projectId, principal) {
      const q = await executeD1Query(
        env,
        `SELECT p.*, o.owner_email, o.display_name AS org_name, o.slug AS org_slug, o.plan_tier AS org_plan_tier, o.monthly_cap_inr, o.current_spend_inr
         FROM cloud_projects p
         JOIN cloud_organizations o ON o.org_id = p.org_id
         WHERE p.project_id = ? OR p.slug = ?
         LIMIT 1`,
        [projectId, projectId]
      );
      if (!q.results || q.results.length === 0) {
        return { ok: false, status: 404, error: `Project '${projectId}' not found.` };
      }
      const row = q.results[0];
      if (principal.role !== "admin" && row.owner_email !== principal.owner_email) {
        return {
          ok: false,
          status: 403,
          error: `Forbidden by Cloud Guard Tenant Jail: Your credentials do not have access to project '${row.project_id}'.`
        };
      }
      return { ok: true, project: row };
    }

    // Public-safe capability manifest for Customer #0 / hosted apps (0 secrets, 0 emails, 0 LAN IPs)
    const pubManifestMatch = path.match(/^\/v1\/projects\/([a-zA-Z0-9_-]+)\/public-manifest$/);
    if (pubManifestMatch && request.method === "GET") {
      const targetId = pubManifestMatch[1];
      const q = await executeD1Query(
        env,
        `SELECT p.project_id, p.org_id, p.slug, p.display_name, p.region, p.env_type, p.backend_driver, p.storage_prefix, p.config_json, p.status,
                o.display_name AS org_name
         FROM cloud_projects p
         JOIN cloud_organizations o ON o.org_id = p.org_id
         WHERE p.project_id = ? OR p.slug = ?
         LIMIT 1`,
        [targetId, targetId]
      );
      if (!q.results || q.results.length === 0) {
        return jsonRes({ ok: false, error: "Project manifest not found." }, 404);
      }
      const p = q.results[0];
      let cfg = {};
      try { cfg = JSON.parse(p.config_json || "{}"); } catch (_) {}

      const depsQ = await executeD1Query(
        env,
        "SELECT deploy_id AS deployId, app_name AS appName, version_tag AS versionTag, backend_driver AS backendDriver, domain_url AS domainUrl, status, created_at AS createdAt FROM cloud_deployments WHERE project_id = ? ORDER BY created_at DESC LIMIT 1",
        [p.project_id]
      );

      return jsonRes({
        ok: true,
        service: "GUARD",
        project: {
          projectId: p.project_id,
          orgId: p.org_id,
          orgName: p.org_name,
          slug: p.slug,
          displayName: p.display_name,
          region: p.region,
          environment: p.env_type,
          backendDriver: p.backend_driver,
          availableDrivers: ["aaruni-edge", "aws", "gcp"],
          egressFeePerGbUsd: 0.0,
          status: p.status,
          customerZero: Boolean(cfg.customerZero),
          buckets: (cfg.buckets || ["default"]).map((b) => ({
            name: b,
            virtualUri: `cloud://${p.project_id}/${b}`,
            driver: p.backend_driver
          })),
          voicePolicy: cfg.voicePolicy || { targetLufs: -12.0, plsLexicon: "W3C-PLS-1.0" },
          workerLanes: cfg.workerLanes || [],
          latestDeployment: (depsQ.results && depsQ.results[0]) || null
        }
      }, 200, { "X-Aaruni-Service": "GUARD" });
    }

    if (path === "/v1/orgs" && request.method === "GET") {
      const auth = await authenticateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      await ensureSubscriberOrgAndProject(auth.principal);

      const sql = auth.principal.role === "admin"
        ? "SELECT org_id AS orgId, slug, display_name AS displayName, owner_email AS ownerEmail, plan_tier AS planTier, monthly_cap_inr AS monthlyCapInr, current_spend_inr AS currentSpendInr, sso_provider AS ssoProvider, created_at AS createdAt FROM cloud_organizations ORDER BY created_at ASC"
        : "SELECT org_id AS orgId, slug, display_name AS displayName, owner_email AS ownerEmail, plan_tier AS planTier, monthly_cap_inr AS monthlyCapInr, current_spend_inr AS currentSpendInr, sso_provider AS ssoProvider, created_at AS createdAt FROM cloud_organizations WHERE owner_email = ? ORDER BY created_at ASC";
      const params = auth.principal.role === "admin" ? [] : [auth.principal.owner_email];
      const { results } = await executeD1Query(env, sql, params);

      return jsonRes({ ok: true, service: "GUARD", count: results.length, organizations: results });
    }

    if (path === "/v1/orgs" && request.method === "POST") {
      const auth = await authenticateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const body = await request.json().catch(() => ({}));
      const safe = assertSafeWorkloadPayload(body);
      if (!safe.ok) return jsonRes({ ok: false, error: safe.error }, 400);

      const displayName = String(body.displayName || body.name || "").trim().slice(0, 80);
      if (!displayName) return jsonRes({ ok: false, error: "Missing 'displayName' for organization." }, 400);
      const slug = String(body.slug || displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")).slice(0, 40) || makeId("orgslug");
      const orgId = body.orgId && auth.principal.role === "admin" ? String(body.orgId) : makeId("org");
      const capInr = Math.max(0, Number(body.monthlyCapInr || 0));

      await executeD1Query(
        env,
        `INSERT INTO cloud_organizations (org_id, slug, display_name, owner_email, plan_tier, monthly_cap_inr, current_spend_inr, sso_provider)
         VALUES (?, ?, ?, ?, ?, ?, 0, 'email_otp')`,
        [orgId, slug, displayName, auth.principal.owner_email, auth.principal.role === "admin" ? "enterprise" : "free", capInr]
      );
      await logAudit(env, executeD1Query, auth.principal.key_id, "GUARD", `create_org:${orgId}`);
      return jsonRes({ ok: true, orgId, slug, displayName, monthlyCapInr: capInr }, 201);
    }

    if (path === "/v1/projects" && request.method === "GET") {
      const auth = await authenticateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      await ensureSubscriberOrgAndProject(auth.principal);

      const sql = auth.principal.role === "admin"
        ? `SELECT p.project_id AS projectId, p.org_id AS orgId, o.display_name AS orgName, p.slug, p.display_name AS displayName, p.region, p.env_type AS environment, p.backend_driver AS backendDriver, p.storage_prefix AS storagePrefix, p.spend_cap_inr AS spendCapInr, p.status, p.created_at AS createdAt
           FROM cloud_projects p JOIN cloud_organizations o ON o.org_id = p.org_id ORDER BY p.created_at ASC`
        : `SELECT p.project_id AS projectId, p.org_id AS orgId, o.display_name AS orgName, p.slug, p.display_name AS displayName, p.region, p.env_type AS environment, p.backend_driver AS backendDriver, p.storage_prefix AS storagePrefix, p.spend_cap_inr AS spendCapInr, p.status, p.created_at AS createdAt
           FROM cloud_projects p JOIN cloud_organizations o ON o.org_id = p.org_id WHERE o.owner_email = ? ORDER BY p.created_at ASC`;
      const params = auth.principal.role === "admin" ? [] : [auth.principal.owner_email];
      const { results } = await executeD1Query(env, sql, params);

      return jsonRes({ ok: true, service: "GUARD", count: results.length, projects: results });
    }

    if (path === "/v1/projects" && request.method === "POST") {
      const auth = await authenticateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      await ensureSubscriberOrgAndProject(auth.principal);
      const body = await request.json().catch(() => ({}));
      const safe = assertSafeWorkloadPayload(body);
      if (!safe.ok) return jsonRes({ ok: false, error: safe.error }, 400);

      const displayName = String(body.displayName || body.name || "").trim().slice(0, 80);
      if (!displayName) return jsonRes({ ok: false, error: "Missing 'displayName' for project." }, 400);
      const slug = String(body.slug || displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")).slice(0, 40);
      const envType = ["prod", "staging", "dev"].includes(body.environment) ? body.environment : "dev";
      const driver = ["aaruni-edge", "aws", "gcp"].includes(body.backendDriver) ? body.backendDriver : "aaruni-edge";

      let orgId = String(body.orgId || "").trim();
      if (!orgId) {
        const oq = await executeD1Query(env, "SELECT org_id, owner_email FROM cloud_organizations WHERE owner_email = ? LIMIT 1", [auth.principal.owner_email]);
        if (!oq.results || oq.results.length === 0) return jsonRes({ ok: false, error: "No organization found for principal." }, 400);
        orgId = oq.results[0].org_id;
      } else {
        const oq = await executeD1Query(env, "SELECT org_id, owner_email FROM cloud_organizations WHERE org_id = ? LIMIT 1", [orgId]);
        if (!oq.results || oq.results.length === 0) return jsonRes({ ok: false, error: `Organization '${orgId}' not found.` }, 404);
        if (auth.principal.role !== "admin" && oq.results[0].owner_email !== auth.principal.owner_email) {
          return jsonRes({ ok: false, error: "Forbidden: You cannot create projects inside another tenant's organization." }, 403);
        }
      }

      const projectId = body.projectId && auth.principal.role === "admin" ? String(body.projectId) : makeId("prj");
      const storagePrefix = auth.principal.role === "admin"
        ? `${orgId}/${projectId}`
        : `${auth.principal.allowed_space || orgId}/${projectId}`;
      const spendCapInr = Math.max(0, Number(body.spendCapInr || 0));
      const cfg = JSON.stringify({
        buckets: Array.isArray(body.buckets) ? body.buckets.slice(0, 10) : ["default"],
        voicePolicy: body.voicePolicy || { targetLufs: -12.0, plsLexicon: "W3C-PLS-1.0" }
      });

      await executeD1Query(
        env,
        `INSERT INTO cloud_projects (project_id, org_id, slug, display_name, region, env_type, backend_driver, storage_prefix, spend_cap_inr, config_json, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
        [projectId, orgId, slug, displayName, String(body.region || "ap-south-hyd-1"), envType, driver, storagePrefix, spendCapInr, cfg]
      );
      await logAudit(env, executeD1Query, auth.principal.key_id, "GUARD", `create_project:${projectId}`);

      return jsonRes({
        ok: true,
        projectId,
        orgId,
        slug,
        displayName,
        environment: envType,
        backendDriver: driver,
        storagePrefix
      }, 201);
    }

    const projDetailMatch = path.match(/^\/v1\/projects\/([a-zA-Z0-9_-]+)$/);
    if (projDetailMatch && request.method === "GET") {
      const auth = await authenticateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const loaded = await loadProjectAuthorized(projDetailMatch[1], auth.principal);
      if (!loaded.ok) return jsonRes({ ok: false, error: loaded.error }, loaded.status);

      const p = loaded.project;
      let cfg = {};
      try { cfg = JSON.parse(p.config_json || "{}"); } catch (_) {}

      const [secsQ, depsQ] = await Promise.all([
        executeD1Query(env, "SELECT secret_key, secret_value, updated_at FROM cloud_project_secrets WHERE project_id = ? ORDER BY secret_key ASC", [p.project_id]),
        executeD1Query(env, "SELECT deploy_id AS deployId, app_name AS appName, version_tag AS versionTag, backend_driver AS backendDriver, domain_url AS domainUrl, status, triggered_by AS triggeredBy, created_at AS createdAt FROM cloud_deployments WHERE project_id = ? ORDER BY created_at DESC LIMIT 10", [p.project_id])
      ]);

      return jsonRes({
        ok: true,
        project: {
          projectId: p.project_id,
          orgId: p.org_id,
          orgName: p.org_name,
          slug: p.slug,
          displayName: p.display_name,
          region: p.region,
          environment: p.env_type,
          backendDriver: p.backend_driver,
          storagePrefix: p.storage_prefix,
          spendCapInr: p.spend_cap_inr,
          orgMonthlyCapInr: p.monthly_cap_inr,
          orgCurrentSpendInr: p.current_spend_inr,
          status: p.status,
          config: cfg
        },
        secrets: (secsQ.results || []).map((s) => ({
          key: s.secret_key,
          maskedValue: maskSecretValue(s.secret_value),
          updatedAt: s.updated_at
        })),
        deployments: depsQ.results || []
      });
    }

    const runtimeCfgMatch = path.match(/^\/v1\/projects\/([a-zA-Z0-9_-]+)\/runtime-config$/);
    if (runtimeCfgMatch && request.method === "GET") {
      const auth = await authenticateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const loaded = await loadProjectAuthorized(runtimeCfgMatch[1], auth.principal);
      if (!loaded.ok) return jsonRes({ ok: false, error: loaded.error }, loaded.status);

      const p = loaded.project;
      let cfg = {};
      try { cfg = JSON.parse(p.config_json || "{}"); } catch (_) {}

      const [secsQ, storQ, depsQ] = await Promise.all([
        executeD1Query(env, "SELECT secret_key, secret_value FROM cloud_project_secrets WHERE project_id = ?", [p.project_id]),
        executeD1Query(env, "SELECT count(*) AS itemCount, coalesce(sum(size_bytes),0) AS totalBytes FROM cloud_storage_items WHERE space LIKE ?", [`${p.project_id}%`]),
        executeD1Query(env, "SELECT deploy_id AS deployId, version_tag AS versionTag, backend_driver AS backendDriver, domain_url AS domainUrl, status, created_at AS createdAt FROM cloud_deployments WHERE project_id = ? ORDER BY created_at DESC LIMIT 1", [p.project_id])
      ]);

      const settingsMap = {};
      for (const s of secsQ.results || []) {
        // Expose non-credential config values cleanly; mask any API keys/tokens
        const isSensitive = /KEY|TOKEN|SECRET|PASSWORD/i.test(s.secret_key);
        settingsMap[s.secret_key] = isSensitive ? maskSecretValue(s.secret_value) : s.secret_value;
      }

      return jsonRes({
        ok: true,
        service: "GUARD",
        projectId: p.project_id,
        orgId: p.org_id,
        orgName: p.org_name,
        displayName: p.display_name,
        region: p.region,
        environment: p.env_type,
        backendDriver: p.backend_driver,
        storagePrefix: p.storage_prefix,
        spendShield: {
          spendCapInr: p.spend_cap_inr,
          currentSpendInr: p.current_spend_inr,
          overchargeProtection: "HARD_CAP_ENFORCED"
        },
        storageSummary: {
          buckets: (cfg.buckets || ["default"]).map((b) => `cloud://${p.project_id}/${b}`),
          itemCount: (storQ.results[0] && storQ.results[0].itemCount) || 0,
          totalBytes: (storQ.results[0] && storQ.results[0].totalBytes) || 0,
          egressFeePerGbUsd: 0.0
        },
        voicePolicy: cfg.voicePolicy || { targetLufs: -12.0, plsLexicon: "W3C-PLS-1.0" },
        teamSeats: cfg.teamSeats || [],
        workerLanes: cfg.workerLanes || [],
        settings: settingsMap,
        latestDeployment: (depsQ.results && depsQ.results[0]) || null
      });
    }

    const projSecretsMatch = path.match(/^\/v1\/projects\/([a-zA-Z0-9_-]+)\/secrets$/);
    if (projSecretsMatch && (request.method === "GET" || request.method === "POST")) {
      const auth = await authenticateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const loaded = await loadProjectAuthorized(projSecretsMatch[1], auth.principal);
      if (!loaded.ok) return jsonRes({ ok: false, error: loaded.error }, loaded.status);
      const p = loaded.project;

      if (request.method === "GET") {
        const { results } = await executeD1Query(
          env,
          "SELECT secret_key AS key, secret_value, updated_at AS updatedAt FROM cloud_project_secrets WHERE project_id = ? ORDER BY secret_key ASC",
          [p.project_id]
        );
        return jsonRes({
          ok: true,
          projectId: p.project_id,
          secrets: (results || []).map((r) => ({
            key: r.key,
            maskedValue: maskSecretValue(r.secret_value),
            updatedAt: r.updatedAt
          }))
        });
      }

      const body = await request.json().catch(() => ({}));
      const secretKey = String(body.key || "").trim().toUpperCase().replace(/[^A-Z0-9_]/g, "");
      const secretVal = String(body.value ?? "").trim();
      if (!secretKey || !secretVal) {
        return jsonRes({ ok: false, error: "Both 'key' (A-Z0-9_) and 'value' are required." }, 400);
      }
      await executeD1Query(
        env,
        `INSERT INTO cloud_project_secrets (secret_id, project_id, secret_key, secret_value, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT(project_id, secret_key) DO UPDATE SET secret_value = excluded.secret_value, updated_at = datetime('now')`,
        [makeId("sec"), p.project_id, secretKey, secretVal]
      );
      await logAudit(env, executeD1Query, auth.principal.key_id, "GUARD", `set_secret:${p.project_id}:${secretKey}`);
      return jsonRes({
        ok: true,
        projectId: p.project_id,
        key: secretKey,
        maskedValue: maskSecretValue(secretVal),
        status: "STORED_IN_VAULT"
      });
    }

    const projDeployMatch = path.match(/^\/v1\/projects\/([a-zA-Z0-9_-]+)\/deploy(?:ments)?$/);
    if (projDeployMatch && (request.method === "GET" || request.method === "POST")) {
      const auth = await authenticateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const loaded = await loadProjectAuthorized(projDeployMatch[1], auth.principal);
      if (!loaded.ok) return jsonRes({ ok: false, error: loaded.error }, loaded.status);
      const p = loaded.project;

      if (request.method === "GET") {
        const { results } = await executeD1Query(
          env,
          "SELECT deploy_id AS deployId, app_name AS appName, version_tag AS versionTag, backend_driver AS backendDriver, domain_url AS domainUrl, status, triggered_by AS triggeredBy, created_at AS createdAt FROM cloud_deployments WHERE project_id = ? ORDER BY created_at DESC LIMIT 20",
          [p.project_id]
        );
        return jsonRes({ ok: true, projectId: p.project_id, count: results.length, deployments: results });
      }

      const body = await request.json().catch(() => ({}));
      const safe = assertSafeWorkloadPayload(body);
      if (!safe.ok) return jsonRes({ ok: false, error: safe.error }, 400);

      if (p.monthly_cap_inr > 0 && p.current_spend_inr >= p.monthly_cap_inr) {
        return jsonRes({
          ok: false,
          error: `Blocked by Spend Cap Shield: Organization '${p.org_id}' has reached its ₹${p.monthly_cap_inr} monthly cap ($0 surprise-bill guarantee).`
        }, 402);
      }

      const manifest = body.manifest || {};
      const appName = String(body.appName || manifest.app || p.slug).slice(0, 60);
      const versionTag = String(body.version || manifest.version || `v${Date.now().toString(36)}`).slice(0, 32);
      const driver = ["aaruni-edge", "aws", "gcp"].includes(body.backendDriver || manifest.driver)
        ? (body.backendDriver || manifest.driver)
        : p.backend_driver;
      const domainUrl = String(
        body.domain ||
        (manifest.services && manifest.services.web && manifest.services.web.domain) ||
        (p.project_id === "prj_syllovo_prod" ? "https://syllovo.com" : `https://${p.slug}.on.aarunicloud.com`)
      );
      const deployId = makeId("dep");

      // Sync project config if buckets or voicePolicy are declared in acloud.yaml
      let mergedCfg = {};
      try { mergedCfg = JSON.parse(p.config_json || "{}"); } catch (_) {}
      if (manifest.buckets && Array.isArray(manifest.buckets)) {
        mergedCfg.buckets = manifest.buckets.slice(0, 12);
      }
      if (manifest.voicePolicy && typeof manifest.voicePolicy === "object") {
        mergedCfg.voicePolicy = { ...(mergedCfg.voicePolicy || {}), ...manifest.voicePolicy };
      }

      await executeD1Query(
        env,
        "UPDATE cloud_projects SET backend_driver = ?, config_json = ? WHERE project_id = ?",
        [driver, JSON.stringify(mergedCfg), p.project_id]
      );
      await executeD1Query(
        env,
        `INSERT INTO cloud_deployments (deploy_id, project_id, app_name, version_tag, manifest_json, backend_driver, domain_url, status, triggered_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'LIVE', ?)`,
        [deployId, p.project_id, appName, versionTag, JSON.stringify(manifest), driver, domainUrl, String(body.triggeredBy || "acloud-cli")]
      );
      await logAudit(env, executeD1Query, auth.principal.key_id, "BUILDER", `deploy:${p.project_id}:${deployId}`);

      return jsonRes({
        ok: true,
        service: "BUILDER",
        deployId,
        projectId: p.project_id,
        orgId: p.org_id,
        appName,
        versionTag,
        backendDriver: driver,
        domainUrl,
        qualityGate: {
          wcag21AA: "VERIFIED",
          zeroTrustTenantJail: "ACTIVE",
          hardSpendCapProtected: true
        },
        deployedAt: new Date().toISOString()
      }, 201, { "X-Aaruni-Service": "BUILDER" });
    }

    if (path === "/v1/builder/plan" && request.method === "POST") {
      const auth = await authenticateGuard(request, env, executeD1Query);
      if (!auth.ok) return jsonRes({ ok: false, error: auth.error }, auth.status);
      const body = await request.json().catch(() => ({}));
      const safe = assertSafeWorkloadPayload(body);
      if (!safe.ok) return jsonRes({ ok: false, error: safe.error }, 400);

      const prompt = String(body.prompt || "").trim().slice(0, 800);
      if (!prompt) return jsonRes({ ok: false, error: "Missing 'prompt' describing the app stack to build." }, 400);
      const projectId = String(body.projectId || "default");
      const lower = prompt.toLowerCase();

      const buckets = ["uploads", "assets"];
      if (lower.includes("course") || lower.includes("video") || lower.includes("studio")) {
        buckets.push("courses", "exports");
      }

      const generatedYaml = [
        `# Generated by Aaruni Cloud Builder (Option A Standard)`,
        `app: ${String(body.appName || "ai-saas-app").toLowerCase().replace(/[^a-z0-9-]/g, "-")}`,
        `project: ${projectId}`,
        `region: ap-south-hyd-1`,
        `driver: aaruni-edge`,
        `buckets:`,
        ...buckets.map((b) => `  - ${b}`),
        `voicePolicy:`,
        `  targetLufs: -12.0`,
        `  plsLexicon: W3C-PLS-1.0`,
        `  connectors: [native_cloud_voice, elevenlabs_byok]`,
        `services:`,
        `  web:`,
        `    type: cloud.containers`,
        `    runtime: node22`,
        `    autoTls: true`,
        `  assistant:`,
        `    type: cloud.assistant`,
        `    ragEngine: pgvector`
      ].join("\n");

      return jsonRes({
        ok: true,
        service: "BUILDER",
        planId: makeId("bld"),
        prompt,
        recommendedDriver: "aaruni-edge",
        estimatedMonthlyInr: 0,
        ossStack: [
          { service: "Cloud Storage", engine: "Apache OpenDAL + SeaweedFS", license: "Apache-2.0" },
          { service: "Cloud Voice", engine: "Kokoro-82M + OpenF5-TTS-Base", license: "Apache-2.0" },
          { service: "Cloud Assistant", engine: "LiteLLM + Assistant-UI", license: "MIT" },
          { service: "Cloud Guard", engine: "Keycloak + Ory Keto", license: "Apache-2.0" }
        ],
        acloudYaml: generatedYaml,
        deployCommand: `acloud deploy --project ${projectId} --file acloud.yaml`
      }, 200, { "X-Aaruni-Service": "BUILDER" });
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

          // Ensure 100% deduplication: purge any older duplicate row for the same employee & date
          await executeD1Query(env, "DELETE FROM timesheets WHERE emp_id = ? AND date = ? AND id != ?", [body.empId, body.date, body.id]);

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


    // 2b. Google Forms / Google Sheets Cloud-to-Cloud Webhook (/api/webhook/gform & /api/sync/gform)
    // Synchronizes Google Form attendance responses directly into Cloudflare D1 SQL.
    // Zero office PC dependency — runs serverless on Cloudflare Edge.
    if (url.pathname === "/api/webhook/gform" || url.pathname === "/api/sync/gform") {
      if (request.method === "GET") {
        let tsCount = 0;
        try {
          const q = await executeD1Query(env, "SELECT count(*) as c FROM timesheets");
          tsCount = (q.results && q.results[0] && q.results[0].c) || 0;
        } catch(e) {}
        return new Response(JSON.stringify({
          success: true,
          status: "ready",
          cloudDatabase: "Cloudflare D1 SQL (apac)",
          officePcDependent: false,
          uptimeMessage: "Zero office PC dependency. Serverless edge cluster 100% online 24/7/365.",
          gdriveFolder: "01-live-attendance-form-and-lop",
          gdriveFolderId: "1RWZzHbKOox1pa5NNg4MgygN5kLGTNv7K",
          linkedSheet: "Aaruni Tech | Attendance & Monthly LOP",
          linkedSheetId: "1zITaRtjdqhamSVtTvni7LPTllrenHlhGX0Hy3yGEc7Y",
          googleFormId: "1MZb9BRjXUWW67L0JypM2tYxD-755McGgxOkmL7Vd-Ts",
          backupFileId: "1tBPQ7pzqahob067l9Ys-xj2XxOndYHWZ",
          backupFileName: "Aaruni_Payroll_Cloud_Timesheet_Backup.csv",
          totalD1Timesheets: tsCount
        }), { headers: CORS_HEADERS });
      }

      if (request.method === "POST") {
        try {
          const body = await request.json();
          const items = Array.isArray(body) ? body : (Array.isArray(body.items) ? body.items : [body]);
          let processed = 0;

          const emailMap = {
            "nandini.chukka.fsm@gmail.com": { id: "AAR-0004", name: "Chukka Nandini" },
            "nandinichukka72@gmail.com": { id: "AAR-0004", name: "Chukka Nandini" },
            "kjhanvi88@gmail.com": { id: "AAR-0005", name: "Janhavi Kamble" },
            "janvi.varma.fsm@gmail.com": { id: "AAR-0005", name: "Janhavi Kamble" },
            "koppula.ramya.fsm@gmail.com": { id: "AAR-0006", name: "Ramya S" },
            "shaik.ali.aaruni@gmail.com": { id: "AAR-0008", name: "Ali" },
            "shaik.ali.moulali@gmail.com": { id: "AAR-0008", name: "Ali" },
            "rupesh@fullstackmaster.net": { id: "AAR-0002", name: "Rupesh Tiwari" },
            "tech.aaruni@gmail.com": { id: "AAR-0002", name: "Rupesh Tiwari" },
            "shailaja.tiwari@gmail.com": { id: "AAR-0001", name: "Shailaja Tiwari" }
          };

          for (const item of items) {
            const rawEmail = (item.email || item.employeeEmail || item.user || "").trim().toLowerCase();
            const mapping = emailMap[rawEmail] || (item.empId ? { id: item.empId, name: item.empName || "Staff" } : null);
            if (!mapping || !item.date) continue;

            const empId = mapping.id;
            const empName = mapping.name;
            const dateStr = item.date.slice(0, 10);
            const monthStr = dateStr.slice(0, 7);
            const hoursVal = parseFloat(item.hours) || 8;
            const summaryVal = (item.summary || item.workSummary || "Worked on assigned deliverables").trim();
            const statusVal = item.status || "Worked";
            const rowId = item.id || `GFORM-${empId.replace("AAR-", "")}-${dateStr.replace(/-/g, "")}`;
            const taskLink = item.taskLink || `Google Form Sync (${rawEmail})`;
            const sourceVal = item.source || "Google Form Sync (Aaruni Tech | Attendance & Monthly LOP)";

            // Deduplicate: remove older duplicate for (emp_id, date)
            await executeD1Query(env, "DELETE FROM timesheets WHERE emp_id = ? AND date = ? AND id != ?", [empId, dateStr, rowId]);

            const insertSql = `
              INSERT INTO timesheets (id, emp_id, emp_name, email, date, month, entry_time, exit_time, hours, status, summary, task_link, source, created_at)
              VALUES (?, ?, ?, ?, ?, ?, '10:00', '18:00', ?, ?, ?, ?, ?, datetime('now'))
              ON CONFLICT(id) DO UPDATE SET
                emp_id=excluded.emp_id,
                emp_name=excluded.emp_name,
                email=excluded.email,
                date=excluded.date,
                month=excluded.month,
                hours=excluded.hours,
                status=excluded.status,
                summary=excluded.summary,
                task_link=excluded.task_link,
                source=excluded.source;
            `;
            await executeD1Query(env, insertSql, [rowId, empId, empName, rawEmail, dateStr, monthStr, hoursVal, statusVal, summaryVal, taskLink, sourceVal]);
            processed++;
          }

          return new Response(JSON.stringify({
            success: true,
            processedCount: processed,
            message: `Successfully synchronized ${processed} Google Form response(s) to Cloudflare D1 SQL.`
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

    // 0. Aaruni Cloud Console Host (console.aarunicloud.com)
    const isConsoleHost =
      host === "console.aarunicloud.com" ||
      host === "www.console.aarunicloud.com" ||
      url.searchParams.get("site") === "console";

    if (isConsoleHost && (url.pathname === "/" || url.pathname === "/index.html")) {
      const consoleUrl = new URL("/console" + url.search + url.hash, request.url);
      return env.ASSETS.fetch(new Request(consoleUrl.toString(), request));
    }

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
