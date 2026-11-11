// Cloudflare Pages Edge Router & API for Aaruni Group
// Endpoints:
// - GET /api/version -> App version, build, D1 status
// - GET /api/timesheets -> Real-time timesheets from Cloudflare D1
// - POST /api/timesheets -> Submit timesheet directly to Cloudflare D1
// - aarunicloud.com -> /cloud.html
// - my.aarunitech.com (or ?emp=... or ?tab=... or /portal) -> /portal.html
// - aarunitech.com (and all other root requests) -> /index.html (Corporate Flagship)

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = (url.hostname || "").toLowerCase();

    // CORS Headers for API calls
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // -------------------------------------------------------------
    // API ENDPOINTS (Backed by Cloudflare D1: aaruni_payroll_db)
    // -------------------------------------------------------------
    if (url.pathname === "/api/version") {
      const hasD1 = !!env.DB;
      return new Response(
        JSON.stringify({
          version: "2.4.0",
          buildDate: "2026-11-11",
          appName: "Aaruni Tech Mobile & Web HR Portal",
          dbType: hasD1 ? "Cloudflare D1 SQLite (APAC)" : "Fallback Client Cache",
          dbBound: hasD1,
          status: "healthy",
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (url.pathname === "/api/timesheets") {
      if (request.method === "GET") {
        try {
          if (!env.DB) {
            return new Response(
              JSON.stringify({ success: false, error: "D1 database not bound", data: [] }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          const { results } = await env.DB.prepare(
            "SELECT id, emp_id as empId, emp_name as empName, email, date, month, entry_time as entryTime, exit_time as exitTime, hours, status, summary, task_link as taskLink, source, created_at as createdAt FROM timesheets ORDER BY date DESC, created_at DESC;"
          ).all();

          return new Response(
            JSON.stringify({
              success: true,
              count: results ? results.length : 0,
              data: results || []
            }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                "Cache-Control": "no-cache, no-store, must-revalidate"
              }
            }
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: err.message, data: [] }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
          );
        }
      }

      if (request.method === "POST") {
        try {
          if (!env.DB) {
            return new Response(
              JSON.stringify({ success: false, error: "D1 database not bound" }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
            );
          }

          const body = await request.json();
          const id = body.id || `TS-${body.empId}-${body.date}`;
          const empId = body.empId || "";
          const empName = body.empName || "";
          const email = body.email || "";
          const date = body.date || "";
          const month = body.month || (date.length >= 7 ? date.slice(0, 7) : "2026-11");
          const entryTime = body.entryTime || "10:00";
          const exitTime = body.exitTime || "19:00";
          const hours = Number(body.hours || 8.0);
          const status = body.status || "Worked";
          const summary = body.summary || "Daily operations and engineering tasks";
          const taskLink = body.taskLink || "Direct In-App Timesheet";
          const source = body.source || "Aaruni Mobile App (D1 Verified)";

          await env.DB.prepare(`
            INSERT OR REPLACE INTO timesheets 
            (id, emp_id, emp_name, email, date, month, entry_time, exit_time, hours, status, summary, task_link, source, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `).bind(
            id, empId, empName, email, date, month, entryTime, exitTime, hours, status, summary, taskLink, source
          ).run();

          return new Response(
            JSON.stringify({
              success: true,
              message: `Timesheet saved to Cloudflare D1 for ${empName} (${date})`,
              entry: { id, empId, empName, email, date, month, entryTime, exitTime, hours, status, summary, taskLink, source }
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
          );
        }
      }
    }

    // -------------------------------------------------------------
    // EDGE ROUTING FOR HOSTNAMES & PAGES
    // -------------------------------------------------------------

    // 1. Aaruni Cloud Host
    const isCloudHost =
      host === "aarunicloud.com" ||
      host === "www.aarunicloud.com" ||
      host.startsWith("aaruni-tech-cloud") ||
      url.searchParams.get("site") === "cloud";

    if (isCloudHost && (url.pathname === "/" || url.pathname === "/index.html")) {
      const cloudUrl = new URL("/cloud.html" + url.search + url.hash, request.url);
      return env.ASSETS.fetch(new Request(cloudUrl.toString(), request));
    }

    // 2. Aaruni Employee Portal Host & Deep Links
    const isPortalHost =
      host === "my.aarunitech.com" ||
      host === "www.my.aarunitech.com" ||
      host.startsWith("my-aaruni") ||
      url.searchParams.get("site") === "portal" ||
      url.searchParams.has("emp") ||
      url.searchParams.has("tab");

    if (isPortalHost && (url.pathname === "/" || url.pathname === "/index.html")) {
      const portalUrl = new URL("/portal.html" + url.search + url.hash, request.url);
      return env.ASSETS.fetch(new Request(portalUrl.toString(), request));
    }

    if (url.pathname === "/portal" || url.pathname === "/my") {
      const portalUrl = new URL("/portal.html" + url.search + url.hash, request.url);
      return env.ASSETS.fetch(new Request(portalUrl.toString(), request));
    }

    if (url.pathname === "/cloud") {
      const cloudUrl = new URL("/cloud.html" + url.search + url.hash, request.url);
      return env.ASSETS.fetch(new Request(cloudUrl.toString(), request));
    }

    // 3. Aaruni Tech Corporate Flagship (aarunitech.com, www.aarunitech.com, etc.)
    return env.ASSETS.fetch(request);
  }
};
