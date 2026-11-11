// Cloudflare Pages Edge Worker & Router for Aaruni Group Domains
// Domains:
// 1. my.aarunitech.com (or ?emp=... or ?tab=... or /portal) -> /portal.html (Employee & Admin Payroll Portal)
// 2. aarunicloud.com -> /cloud.html (Aaruni Cloud)
// 3. aarunitech.com (and root requests) -> /index.html (Corporate Flagship)
// 4. API Endpoints: /api/version, /api/timesheets (backed by Cloudflare D1 aaruni_payroll_db)

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json; charset=utf-8"
};

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
      if (env && env.DB) {
        try {
          const row = await env.DB.prepare("SELECT count(*) as c FROM timesheets").first();
          tsCount = row ? row.c : 0;
          dbStatus = "connected";
        } catch (e) {
          dbStatus = "error: " + (e.message || String(e));
        }
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
          timesheetRecords: tsCount
        },
        timestamp: new Date().toISOString()
      }), { headers: CORS_HEADERS });
    }

    // 2. Timesheets GET / POST API
    if (url.pathname === "/api/timesheets") {
      // GET: Query timesheets from Cloudflare D1
      if (request.method === "GET") {
        if (!env || !env.DB) {
          return new Response(JSON.stringify({ success: false, error: "D1 database binding not available" }), {
            status: 503,
            headers: CORS_HEADERS
          });
        }
        try {
          const empFilter = url.searchParams.get("emp_id") || url.searchParams.get("empId");
          let query = "SELECT id, emp_id AS empId, date, entry_time AS entryTime, exit_time AS exitTime, hours, status, summary, task_link AS taskLink, source FROM timesheets";
          let stmt;
          if (empFilter) {
            query += " WHERE emp_id = ? ORDER BY date DESC, id DESC";
            stmt = env.DB.prepare(query).bind(empFilter);
          } else {
            query += " ORDER BY date DESC, id DESC LIMIT 500";
            stmt = env.DB.prepare(query);
          }
          const { results } = await stmt.all();
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
        if (!env || !env.DB) {
          return new Response(JSON.stringify({ success: false, error: "D1 database binding not available" }), {
            status: 503,
            headers: CORS_HEADERS
          });
        }
        try {
          const body = await request.json();
          if (!body || !body.id || !body.empId || !body.date) {
            return new Response(JSON.stringify({ success: false, error: "Missing required fields (id, empId, date)" }), {
              status: 400,
              headers: CORS_HEADERS
            });
          }

          const hoursVal = parseFloat(body.hours) || 8;
          const entryVal = body.entryTime || "10:00";
          const exitVal = body.exitTime || "18:00";
          const statusVal = body.status || "Worked";
          const summaryVal = body.summary || "Worked on assigned deliverables";
          const taskVal = body.taskLink || "Employee Portal Submission";
          const sourceVal = body.source || "Aaruni Portal App (Live D1)";

          await env.DB.prepare(`
            INSERT INTO timesheets (id, emp_id, date, entry_time, exit_time, hours, status, summary, task_link, source, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
              emp_id=excluded.emp_id,
              date=excluded.date,
              entry_time=excluded.entry_time,
              exit_time=excluded.exit_time,
              hours=excluded.hours,
              status=excluded.status,
              summary=excluded.summary,
              task_link=excluded.task_link,
              source=excluded.source;
          `).bind(body.id, body.empId, body.date, entryVal, exitVal, hoursVal, statusVal, summaryVal, taskVal, sourceVal).run();

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
