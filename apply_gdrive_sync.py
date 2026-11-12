import os
import re

dir_path = "/Users/rupesh/.gemini/antigravity/scratch/aaruni-payroll-repo"

# 1. Update src/base_worker.js
base_file = os.path.join(dir_path, "src/base_worker.js")
with open(base_file, "r", encoding="utf-8") as f:
    base_content = f.read()

webhook_endpoint = """
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
"""

marker = "    // 3. Enterprise & Cloud Inquiries API (/api/inquiries)"
if marker in base_content and "/api/webhook/gform" not in base_content:
    base_content = base_content.replace(marker, webhook_endpoint + "\n" + marker)
    with open(base_file, "w", encoding="utf-8") as f:
        f.write(base_content)
    print("Updated src/base_worker.js successfully.")
else:
    print("src/base_worker.js already contains webhook or marker not found.")

print("Done updating base worker.")
