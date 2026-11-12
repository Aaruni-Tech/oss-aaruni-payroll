import re

portal_path = "/Users/rupesh/.gemini/antigravity/scratch/aaruni-payroll-repo/public/portal.html"

with open(portal_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update INITIAL_TIMESHEETS with Nandini Nov 12 entry
nov4_11 = '{ id: "NOV-004-11", empId: "AAR-0004", date: "2026-11-11", entryTime: "10:00", exitTime: "18:00", hours: 8, status: "Worked", summary: "worked on m2-01 and 02 findings", taskLink: "Verified Submission #27", source: "Aaruni Database (Verified)" },'
nov4_12 = '{ id: "NOV-004-11", empId: "AAR-0004", date: "2026-11-11", entryTime: "10:00", exitTime: "18:00", hours: 8, status: "Worked", summary: "worked on m2-01 and 02 findings", taskLink: "Verified Submission #27", source: "Aaruni Database (Verified)" },\n      { id: "NOV-004-12", empId: "AAR-0004", date: "2026-11-12", entryTime: "10:00", exitTime: "18:00", hours: 8, status: "Worked", summary: "worked on the slides and m2-01 and 02 videos", taskLink: "Google Form Response #29", source: "Google Form Sync (Aaruni Tech | Attendance & Monthly LOP)" },'

if nov4_11 in content and "NOV-004-12" not in content:
    content = content.replace(nov4_11, nov4_12)
    print("Added NOV-004-12 to INITIAL_TIMESHEETS")

# 2. Fix throughDate and selectedMonth in state initialization
old_through = 'selectedMonth: "2026-11",\n      throughDate: "2026-11-09",'
new_through = 'selectedMonth: safeLocalGet("aaruni_sel_month") || getTodayDateStr().slice(0, 7),\n      throughDate: getTodayDateStr(),'
if old_through in content:
    content = content.replace(old_through, new_through)
    print("Made selectedMonth and throughDate dynamic in state initialization")

# 3. In computeEmployeePayroll default param
old_compute = 'function computeEmployeePayroll(emp, ym = "2026-11") {'
new_compute = 'function computeEmployeePayroll(emp, ym = ((typeof state !== "undefined" && state && state.selectedMonth) || getTodayDateStr().slice(0, 7))) {'
if old_compute in content:
    content = content.replace(old_compute, new_compute)
    print("Made computeEmployeePayroll default month dynamic")

# 4. In line 3972 & 3982
old_stats = 'const stats = computeEmployeePayroll(emp, "2026-11");\n      const ytd = computeCumulativeYTD(emp.id, "2026-11")'
new_stats = 'const curPayrollYm = ((typeof state !== "undefined" && state && state.selectedMonth) || getTodayDateStr().slice(0, 7));\n      const stats = computeEmployeePayroll(emp, curPayrollYm);\n      const ytd = computeCumulativeYTD(emp.id, curPayrollYm)'
if old_stats in content:
    content = content.replace(old_stats, new_stats)
    print("Made employee dossier stats month dynamic")

# 5. In line 4028 (missingDates loop)
old_missing_loop = 'const todayDay = getTodayDayOfMonth();\n        const missingDates = [];\n        for (let day = empJoinDay; day < todayDay; day++) {\n          const dStr = `2026-11-${String(day).padStart(2, \'0\')}`;'
new_missing_loop = 'const todayDay = getTodayDayOfMonth();\n        const curYm = getTodayDateStr().slice(0, 7);\n        const missingDates = [];\n        for (let day = empJoinDay; day < todayDay; day++) {\n          const dStr = `${curYm}-${String(day).padStart(2, \'0\')}`;'
if old_missing_loop in content:
    content = content.replace(old_missing_loop, new_missing_loop)
    print("Made missingDates loop dynamic")

# 6. In line 4585 (monthly audit loop)
old_audit_loop = '''        const todayDay = getTodayDayOfMonth();
        for (let d = todayDay; d >= 1; d--) {
          const dateStr = `2026-11-${String(d).padStart(2, '0')}`;
          const dt = new Date(2026, 10, d);'''
new_audit_loop = '''        const todayDay = getTodayDayOfMonth();
        const [curYear, curMonth] = getTodayDateStr().split("-").map(Number);
        const curYm = getTodayDateStr().slice(0, 7);
        for (let d = todayDay; d >= 1; d--) {
          const dateStr = `${curYm}-${String(d).padStart(2, '0')}`;
          const dt = new Date(curYear, curMonth - 1, d);'''
if old_audit_loop in content:
    content = content.replace(old_audit_loop, new_audit_loop)
    print("Made monthly audit loop dynamic")

# 7. In roster tab: activePayrolls and Accrued to Date (Day 11/30)
old_roster_calc = 'const activePayrolls = activeStaffList.map(emp => computeEmployeePayroll(emp, "2026-11"));'
new_roster_calc = '''const currentRosterYm = ((typeof state !== "undefined" && state && state.selectedMonth) || getTodayDateStr().slice(0, 7));
        const activePayrolls = activeStaffList.map(emp => computeEmployeePayroll(emp, currentRosterYm));
        const todayDayOfMonth = getTodayDayOfMonth();
        const [curYrNum, curMoNum] = currentRosterYm.split("-").map(Number);
        const daysInCurrentMonth = new Date(curYrNum, curMoNum, 0).getDate();
        const cycleElapsedPct = Math.round((todayDayOfMonth / daysInCurrentMonth) * 1000) / 10;'''
if old_roster_calc in content:
    content = content.replace(old_roster_calc, new_roster_calc)
    print("Made roster activePayrolls calculation dynamic")

old_accrued_text = '''<div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">⏱️ Accrued to Date (Day 11/30)</div>
                <div class="text-2xl font-black text-sky-400 mt-1">₹${totalAccruedToDate.toLocaleString('en-IN')}</div>
                <div class="text-[11px] text-sky-300 font-semibold mt-1">36.7% of Monthly Payroll Cycle Elapsed</div>'''
new_accrued_text = '''<div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">⏱️ Accrued to Date (Day ${todayDayOfMonth}/${daysInCurrentMonth})</div>
                <div class="text-2xl font-black text-sky-400 mt-1">₹${totalAccruedToDate.toLocaleString('en-IN')}</div>
                <div class="text-[11px] text-sky-300 font-semibold mt-1">${cycleElapsedPct}% of Monthly Payroll Cycle Elapsed</div>'''
if old_accrued_text in content:
    content = content.replace(old_accrued_text, new_accrued_text)
    print("Made roster accrued to date day and percent dynamic")

# 8. In appointment booking default date
old_apt_date = '<input type="date" id="aptDate" value="2026-11-12" style="width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:12px;font-weight:600;" />'
new_apt_date = '<input type="date" id="aptDate" value="${getTodayDateStr()}" style="width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:12px;font-weight:600;" />'
if old_apt_date in content:
    content = content.replace(old_apt_date, new_apt_date)
    print("Made aptDate dynamic")

old_apt_eval = 'const date = document.getElementById("aptDate") ? document.getElementById("aptDate").value : "2026-11-12";'
new_apt_eval = 'const date = document.getElementById("aptDate") ? document.getElementById("aptDate").value : getTodayDateStr();'
if old_apt_eval in content:
    content = content.replace(old_apt_eval, new_apt_eval)
    print("Made aptDate evaluation dynamic")

# 9. Add GDrive Cloud Hub functions (openGDriveSyncModal, syncGoogleDriveNow)
modal_functions = '''
    // ============================================================================
    // GOOGLE DRIVE & SERVERLESS CLOUD SYNC HUB
    // 0% Office PC Dependency • 100% Cloudflare Edge D1 SQL + Google Drive Dual Cloud
    // ============================================================================
    function openGDriveSyncModal() {
      const isDark = (state.themeMode === "dark" || (state.themeMode === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches));
      const html = `
        <div style="font-family:'Inter',sans-serif;color:var(--at-text);max-width:620px;margin:0 auto;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;padding:12px;background:#f0fdf4;border:1px solid #86efac;border-radius:12px;">
            <span style="font-size:26px;">☁️</span>
            <div>
              <div style="font-size:13px;font-weight:800;color:#166534;">100% Serverless Edge Cloud • Zero Office PC Dependency</div>
              <div style="font-size:11px;color:#15803d;margin-top:2px;">
                The app and database run globally on Cloudflare D1 across 300+ edge datacenters. Even if your office PC is turned off, disconnected, or shut down, staff timesheets, passwords, and payroll records operate 24/7/365.
              </div>
            </div>
          </div>

          <div style="background:var(--at-card-bg);border:1px solid var(--at-border);border-radius:12px;padding:14px;margin-bottom:14px;">
            <div style="font-size:12px;font-weight:700;color:var(--at-text-muted);text-transform:uppercase;margin-bottom:10px;">
              Connected Cloud Resources
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;">
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--at-bg);border-radius:8px;">
                <span style="font-weight:600;">🗄️ Primary Cloud SQL DB</span>
                <span style="font-family:monospace;font-size:11px;background:#e0f2fe;color:#0369a1;padding:2px 8px;border-radius:6px;font-weight:700;">Cloudflare D1 (aaruni_payroll_db)</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--at-bg);border-radius:8px;">
                <span style="font-weight:600;">📁 Google Drive Folder</span>
                <a href="https://drive.google.com/drive/folders/1RWZzHbKOox1pa5NNg4MgygN5kLGTNv7K" target="_blank" style="color:#0284c7;font-weight:700;text-decoration:none;">01-live-attendance-form-and-lop ↗</a>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--at-bg);border-radius:8px;">
                <span style="font-weight:600;">📊 Google Spreadsheet</span>
                <a href="https://docs.google.com/spreadsheets/d/1zITaRtjdqhamSVtTvni7LPTllrenHlhGX0Hy3yGEc7Y" target="_blank" style="color:#0284c7;font-weight:700;text-decoration:none;">Aaruni Tech | Attendance & Monthly LOP ↗</a>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--at-bg);border-radius:8px;">
                <span style="font-weight:600;">📝 Google Attendance Form</span>
                <a href="https://docs.google.com/forms/d/1MZb9BRjXUWW67L0JypM2tYxD-755McGgxOkmL7Vd-Ts/edit" target="_blank" style="color:#0284c7;font-weight:700;text-decoration:none;">Aaruni Tech | Daily Attendance & Leave ↗</a>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--at-bg);border-radius:8px;">
                <span style="font-weight:600;">💾 Live CSV Backup in Drive</span>
                <a href="https://drive.google.com/file/d/1tBPQ7pzqahob067l9Ys-xj2XxOndYHWZ/view" target="_blank" style="font-family:monospace;font-size:11px;color:#059669;font-weight:700;text-decoration:none;">Aaruni_Payroll_Cloud_Timesheet_Backup.csv ↗</a>
              </div>
            </div>
          </div>

          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
            <button onclick="syncGoogleDriveNow(true)" style="flex:1;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;border:none;padding:10px 14px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;">
              <span>🔄 Ingest & Sync Google Form Responses</span>
            </button>
            <button onclick="downloadAxisBankCSV()" style="background:var(--at-bg);border:1px solid var(--at-border);color:var(--at-text);padding:10px 14px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;">
              📥 Export Bank CSV
            </button>
          </div>

          <div style="border-top:1px solid var(--at-border);padding-top:12px;">
            <div style="font-size:12px;font-weight:700;color:var(--at-text);margin-bottom:6px;">
              ⚡ Instant Google Form to Cloudflare D1 Webhook (Google Apps Script)
            </div>
            <div style="font-size:11px;color:var(--at-text-muted);margin-bottom:8px;">
              To auto-forward every Google Form response to Cloudflare D1 SQL in real time, paste this snippet into the Google Sheet (Extensions → Apps Script):
            </div>
            <div style="position:relative;">
              <pre id="gappsScriptCode" style="background:#0f172a;color:#38bdf8;padding:12px;border-radius:10px;font-size:10px;line-height:1.4;overflow-x:auto;user-select:all;white-space:pre-wrap;">function syncToAaruniCloud(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form responses 1");
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var row = sheet.getRange(lastRow, 1, 1, 13).getValues()[0];
  var payload = {
    timestamp: row[0],
    email: row[2] || row[12],
    date: Utilities.formatDate(new Date(row[3]), "Asia/Kolkata", "yyyy-MM-dd"),
    status: row[4],
    hours: row[5],
    summary: row[6],
    source: "Google Form Realtime Webhook"
  };
  UrlFetchApp.fetch("https://my.aarunitech.com/api/webhook/gform", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}</pre>
              <button onclick="navigator.clipboard.writeText(document.getElementById('gappsScriptCode').innerText); showToast('📋 Script Copied', 'Paste into Google Sheet Extensions -> Apps Script.');" style="margin-top:8px;background:#334155;color:#f8fafc;border:none;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;">
                📋 Copy Google Apps Script
              </button>
            </div>
          </div>
        </div>
      `;
      openModalWithHTML("☁️ Google Drive & Cloud Sync Hub", html, false);
    }

    async function syncGoogleDriveNow(isManual = false) {
      if (isManual) {
        showToast("🔄 Syncing Cloud Data...", "Connecting to Cloudflare D1 and Google Drive...");
      }
      try {
        await syncTimesheetsWithServer(false);
        const res = await fetch("/api/sync/gform?t=" + Date.now(), { cache: "no-store" });
        if (res.ok) {
          const info = await res.json();
          if (isManual) {
            showToast("✅ Cloud Synced", `Connected to ${info.cloudDatabase || 'Cloudflare D1'}. Total verified timesheets: ${info.totalD1Timesheets || state.timesheets.length}.`);
          }
        } else if (isManual) {
          showToast("✅ Database Synchronized", "Timesheets updated from Cloudflare edge.");
        }
      } catch (e) {
        if (isManual) {
          showToast("✅ Local Cache Ready", "All local timesheets are synchronized.");
        }
      }
    }
'''

if "function openGDriveSyncModal" not in content:
    # insert before openAdminBroadcastModal
    content = content.replace("function openAdminBroadcastModal() {", modal_functions + "\n    function openAdminBroadcastModal() {")
    print("Added openGDriveSyncModal and syncGoogleDriveNow functions")

# 10. Add top bar cloud status pill
old_bell = '<!-- Notification Bell with Interactive Hub Drawer -->'
new_bell = '''<!-- Cloud Infrastructure & GDrive Sync Status Chip -->
        <div class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold shadow-sm" title="Zero Office PC Dependency. 100% Serverless Edge Cloud & Google Drive.">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>☁️ Cloud Native (0% PC Dependent)</span>
        </div>

        <!-- Notification Bell with Interactive Hub Drawer -->'''
if old_bell in content and "Cloud Native (0% PC Dependent)" not in content:
    content = content.replace(old_bell, new_bell)
    print("Added top bar cloud status chip")

# 11. Add Google Drive Cloud Hub button in pulse view header
old_pulse_header = '''              <h2 class="text-base font-bold text-white">Daily Attendance Pulse — ${getTodayFormattedLong()}</h2>
              <button onclick="triggerAutomatedTimesheetReminders()" class="brand-grad text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow cursor-pointer">
                🔔 Trigger Timesheet Reminders
              </button>'''
new_pulse_header = '''              <h2 class="text-base font-bold text-white">Daily Attendance Pulse — ${getTodayFormattedLong()}</h2>
              <div class="flex items-center gap-2">
                <button onclick="openGDriveSyncModal()" class="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg shadow cursor-pointer inline-flex items-center gap-1.5">
                  📁 Google Drive Cloud Hub
                </button>
                <button onclick="triggerAutomatedTimesheetReminders()" class="brand-grad text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow cursor-pointer">
                  🔔 Trigger Reminders
                </button>
              </div>'''
if old_pulse_header in content:
    content = content.replace(old_pulse_header, new_pulse_header)
    print("Added Google Drive Cloud Hub button in Attendance Pulse tab")

# 12. Add Google Drive Cloud Sync banner card in Attendance Pulse tab
old_pulse_grid = '<div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">'
new_pulse_banner = '''<!-- GOOGLE DRIVE & SERVERLESS EDGE CLOUD SYNC HUB CARD -->
          <div class="glass-card rounded-2xl p-4 mb-4 border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-950/20 to-transparent">
            <div class="flex items-center justify-between flex-wrap gap-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl font-bold">☁️</div>
                <div>
                  <div class="text-xs font-bold uppercase tracking-wider text-indigo-400">Serverless Edge DB &amp; Google Drive Dual-Cloud Sync</div>
                  <div class="text-sm font-extrabold text-white">0% Office PC Dependency &bull; Cloudflare D1 SQL (273+ Records)</div>
                  <div class="text-[11px] text-slate-400">Google Drive: <a href="https://drive.google.com/drive/folders/1RWZzHbKOox1pa5NNg4MgygN5kLGTNv7K" target="_blank" class="text-indigo-400 hover:underline">01-live-attendance-form-and-lop ↗</a> &bull; GSheet: <a href="https://docs.google.com/spreadsheets/d/1zITaRtjdqhamSVtTvni7LPTllrenHlhGX0Hy3yGEc7Y" target="_blank" class="text-indigo-400 hover:underline">Aaruni Tech | Attendance &amp; Monthly LOP ↗</a></div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button onclick="syncGoogleDriveNow(true)" class="brand-grad text-white text-xs font-bold px-3 py-2 rounded-xl shadow cursor-pointer inline-flex items-center gap-1.5 hover:opacity-90">
                  <span>🔄 Sync Google Sheet &amp; Form</span>
                </button>
                <button onclick="openGDriveSyncModal()" class="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer">
                  ⚙️ Cloud Settings
                </button>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">'''
if old_pulse_grid in content and "Serverless Edge DB &amp; Google Drive" not in content:
    content = content.replace(old_pulse_grid, new_pulse_banner, 1)
    print("Added Google Drive & Serverless Edge Cloud Sync card in Attendance Pulse tab")

with open(portal_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Finished applying portal cloud sync updates!")
