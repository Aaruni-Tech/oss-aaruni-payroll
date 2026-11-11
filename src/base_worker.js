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
