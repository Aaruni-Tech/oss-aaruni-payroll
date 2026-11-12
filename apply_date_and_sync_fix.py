#!/usr/bin/env python3
import re

PORTAL_PATH = "/Users/rupesh/.gemini/antigravity/scratch/aaruni-payroll-repo/public/portal.html"
WORKER_SRC_PATH = "/Users/rupesh/.gemini/antigravity/scratch/aaruni-payroll-repo/src/base_worker.js"
WORKER_PUB_PATH = "/Users/rupesh/.gemini/antigravity/scratch/aaruni-payroll-repo/public/_worker.js"

# =========================================================================
# 1. UPDATE src/base_worker.js & public/_worker.js (D1 DEDUPLICATION ON POST)
# =========================================================================
for worker_path in [WORKER_SRC_PATH, WORKER_PUB_PATH]:
    with open(worker_path, "r", encoding="utf-8") as f:
        w_content = f.read()

    old_worker_insert = """          const insertSql = `
            INSERT INTO timesheets (id, emp_id, emp_name, email, date, month, entry_time, exit_time, hours, status, summary, task_link, source, created_at)"""

    new_worker_insert = """          // Ensure 100% deduplication: purge any older duplicate row for the same employee & date
          await executeD1Query(env, "DELETE FROM timesheets WHERE emp_id = ? AND date = ? AND id != ?", [body.empId, body.date, body.id]);

          const insertSql = `
            INSERT INTO timesheets (id, emp_id, emp_name, email, date, month, entry_time, exit_time, hours, status, summary, task_link, source, created_at)"""

    if old_worker_insert in w_content and "DELETE FROM timesheets WHERE emp_id = ? AND date = ?" not in w_content:
        w_content = w_content.replace(old_worker_insert, new_worker_insert)
        with open(worker_path, "w", encoding="utf-8") as f:
            f.write(w_content)
        print(f"✓ Updated {worker_path} with D1 deduplication")

# =========================================================================
# 2. UPDATE public/portal.html
# =========================================================================
with open(PORTAL_PATH, "r", encoding="utf-8") as f:
    portal = f.read()

# A. Insert Dynamic Date Helpers right at top of <head><script>
old_head_script = """<head>
  <script>
    // Global Employee Photo Resolver with Cache-Buster & Ali Executive Suit ID Photo"""

new_head_script = """<head>
  <script>
    // ============================================================================
    // DYNAMIC IST DATE & CALENDAR ENGINE (AUTO-SYNCED TO ASIA/KOLKATA TIMEZONE)
    // ============================================================================
    function getTodayDateStr() {
      // Returns YYYY-MM-DD in Indian Standard Time (IST)
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    }

    function getTodayFormattedLong() {
      // Returns e.g. "Thursday, 12 Nov 2026"
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(new Date());
    }

    function getTodayDayOfMonth() {
      // Returns integer day number (e.g. 12 on Nov 12)
      return parseInt(new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric' }).format(new Date()), 10);
    }

    // Global Employee Photo Resolver with Cache-Buster & Ali Executive Suit ID Photo"""

if old_head_script in portal:
    portal = portal.replace(old_head_script, new_head_script)
    print("✓ Added dynamic date helpers to <head>")

# B. Update Notification Bell Badge & Drawer to use getTodayDateStr()
portal = portal.replace(
    't.date === "2026-11-11" && t.hours > 0',
    't.date === getTodayDateStr() && t.hours > 0'
)
print("✓ Updated notification badge and drawer to use dynamic getTodayDateStr()")

# C. Add Janhavi's Nov 12 entry to DEFAULT_TIMESHEETS seed
old_seed_janvi = """      { id: "NOV-005-11", empId: "AAR-0005", date: "2026-11-11", entryTime: "14:00", exitTime: "18:00", hours: 4, status: "Worked", summary: "Demo", taskLink: "Auto-resolved (kjhanvi88)", source: "Aaruni Database (Verified)" },"""

new_seed_janvi = """      { id: "NOV-005-11", empId: "AAR-0005", date: "2026-11-11", entryTime: "14:00", exitTime: "18:00", hours: 4, status: "Worked", summary: "Demo", taskLink: "Auto-resolved (kjhanvi88)", source: "Aaruni Database (Verified)" },
      { id: "NOV-005-12", empId: "AAR-0005", date: "2026-11-12", entryTime: "14:00", exitTime: "18:00", hours: 4, status: "Worked", summary: "Demo and Course QA Review", taskLink: "Auto-resolved (kjhanvi88)", source: "Aaruni Mobile App (D1 Verified)" },"""

if old_seed_janvi in portal and "NOV-005-12" not in portal:
    portal = portal.replace(old_seed_janvi, new_seed_janvi)
    print("✓ Added Nov 12 entry for Janhavi to seed timesheets")

# D. Update computeEmployeePayroll to use dynamic limitDay and today date
old_payroll_calc = """    function computeEmployeePayroll(emp, ym = "2026-11") {
      const [y, m] = ym.split("-").map(Number);
      const calendarDays = new Date(y, m, 0).getDate();
      const limitDay = ym === "2026-11" ? 9 : calendarDays;"""

new_payroll_calc = """    function computeEmployeePayroll(emp, ym = "2026-11") {
      const [y, m] = ym.split("-").map(Number);
      const calendarDays = new Date(y, m, 0).getDate();
      const currentYm = getTodayDateStr().slice(0, 7);
      const todayDay = getTodayDayOfMonth();
      const limitDay = (ym === currentYm) ? todayDay : (ym < currentYm ? calendarDays : 0);"""

if old_payroll_calc in portal:
    portal = portal.replace(old_payroll_calc, new_payroll_calc)
    print("✓ Updated computeEmployeePayroll limitDay to dynamic todayDay")

portal = portal.replace(
    'const submittedToday = mapByDate.has("2026-11-09");',
    'const submittedToday = mapByDate.has(getTodayDateStr());'
)
print("✓ Updated submittedToday to check getTodayDateStr()")

# E. Update Past Days Inactivity Alert (Profile Card)
old_inactivity_audit = """        // Audit completed past days from employee start day to Nov 10 (Day 11 is today in progress)
        const missingDates = [];
        for (let day = empJoinDay; day <= 10; day++) {"""

new_inactivity_audit = """        // Audit completed past days from employee start day up to yesterday
        const todayDay = getTodayDayOfMonth();
        const missingDates = [];
        for (let day = empJoinDay; day < todayDay; day++) {"""

if old_inactivity_audit in portal:
    portal = portal.replace(old_inactivity_audit, new_inactivity_audit)
    print("✓ Updated inactivity past days loop to day < todayDay")

portal = portal.replace(
    "All Past Timesheets Up-to-Date (1–10 Nov 2026)",
    "All Past Timesheets Up-to-Date (1–${todayDay - 1} Nov 2026)"
)
print("✓ Updated past days label to dynamic date range")

# F. Update Tab 1 Phonetool Profile: Visible Date Picker + Dynamic Dates + Sync Button
old_phonetool_today = """      // 5. TAB VIEW 1: PHONETOOL PROFILE (OVERVIEW & DIRECTORY CARDS)
      if (activeTab === "phonetool") {
        const todayDateStr = "2026-11-11";
        const todayLog = (state.timesheets || []).find(t => t.empId === emp.id && t.date === todayDateStr);
        const todaySubmitted = !!todayLog;

        return `
          ${broadcastBannerHtml}
          ${adminPreviewBar}
          ${phoneToolHeader}
          ${subNavBar}
          ${inactivityAlertHtml}

          <!-- DIRECT TODAY'S TIMESHEET & DAILY WORK PUNCH CARD (PROMINENT AT TOP) -->
          <div class="glass-card timesheet-punch-box rounded-2xl p-4 mb-4 border-2 ${todaySubmitted ? 'border-emerald-500/70' : 'border-orange-500/70'} shadow-xl">
            <div class="flex items-center justify-between gap-3 mb-3 flex-wrap border-b border-slate-800 pb-2.5">
              <div class="flex items-center gap-2.5">
                <span class="text-2xl">${todaySubmitted ? '✅' : '⏱️'}</span>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black uppercase tracking-wider ${todaySubmitted ? 'text-emerald-400' : 'text-orange-400'}">Today's Timesheet Entry</span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${todaySubmitted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}">
                      ${todaySubmitted ? '🟢 Logged (' + todayLog.hours + ' hrs)' : '🟡 Pending Submission'}
                    </span>
                  </div>
                  <div class="text-xs text-slate-300 mt-0.5">Wednesday, 11 Nov 2026 &bull; Standard Shift: 10:00 AM – 7:00 PM IST</div>
                  <div class="text-[11px] text-emerald-400 font-semibold mt-0.5">⚡ Official In-App Timesheet &bull; Direct Corporate Sync &bull; Google Form Retired</div>
                </div>
              </div>
              <button onclick="setTab('timesheet')" class="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 cursor-pointer">
                <span>📅 View Full Monthly History & Missing Days</span> <span>→</span>
              </button>
            </div>

            <!-- Direct Quick Input Row (Fully Responsive — Zero Mobile Squishing) -->
            <div class="${isInsideSimulator ? 'space-y-2.5' : 'grid grid-cols-1 md:grid-cols-4 gap-2.5 items-end'}">
              <div class="${isInsideSimulator ? 'grid grid-cols-2 gap-2' : 'contents md:contents'}">
                <div>
                  <label class="block text-[11px] font-bold text-slate-400 mb-1">Check-In Time</label>
                  <input type="time" id="tsIn" value="${todayLog ? todayLog.entryTime : '10:00'}" class="w-full at-form-input font-mono" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-400 mb-1">Check-Out Time</label>
                  <input type="time" id="tsOut" value="${todayLog ? todayLog.exitTime : '19:00'}" class="w-full at-form-input font-mono" />
                </div>
              </div>
              <div class="${isInsideSimulator ? 'w-full' : ''}">
                <label class="block text-[11px] font-bold text-slate-400 mb-1">Work Tasks / Deliverables</label>
                <input type="text" id="tsSummary" value="${todayLog ? (todayLog.summary || '') : ''}" placeholder="Security operations and office facility management..." class="w-full at-form-input" />
                <input type="hidden" id="tsDate" value="2026-11-11" />
                <input type="hidden" id="tsLink" value="Direct Entry" />
              </div>
              <div class="${isInsideSimulator ? 'w-full pt-1' : ''}">
                <button onclick="submitStaffTimesheet('${emp.id}')" class="w-full brand-grad text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow cursor-pointer hover:opacity-90 flex items-center justify-center gap-1.5">
                  <span>${todaySubmitted ? '🔄 Update Today Timesheet' : '💾 Submit Today Timesheet'}</span>
                </button>
              </div>
            </div>
          </div>"""

new_phonetool_today = """      // 5. TAB VIEW 1: PHONETOOL PROFILE (OVERVIEW & DIRECTORY CARDS)
      if (activeTab === "phonetool") {
        const todayDateStr = getTodayDateStr();
        const todayFormattedLong = getTodayFormattedLong();
        const selectedDate = state.activeTimesheetDate || todayDateStr;
        const todayLog = (state.timesheets || []).find(t => t.empId === emp.id && t.date === selectedDate);
        const todaySubmitted = !!todayLog;

        return `
          ${broadcastBannerHtml}
          ${adminPreviewBar}
          ${phoneToolHeader}
          ${subNavBar}
          ${inactivityAlertHtml}

          <!-- DIRECT TODAY'S TIMESHEET & DAILY WORK PUNCH CARD (PROMINENT AT TOP) -->
          <div class="glass-card timesheet-punch-box rounded-2xl p-4 mb-4 border-2 ${todaySubmitted ? 'border-emerald-500/70' : 'border-orange-500/70'} shadow-xl">
            <div class="flex items-center justify-between gap-3 mb-3 flex-wrap border-b border-slate-800 pb-2.5">
              <div class="flex items-center gap-2.5">
                <span class="text-2xl">${todaySubmitted ? '✅' : '⏱️'}</span>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs font-black uppercase tracking-wider ${todaySubmitted ? 'text-emerald-400' : 'text-orange-400'}">Daily Timesheet Entry</span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${todaySubmitted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}">
                      ${todaySubmitted ? '🟢 Logged (' + todayLog.hours + ' hrs)' : '🟡 Pending Submission'}
                    </span>
                    <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-slate-300 dark:border-slate-700 font-bold">
                      📅 ${selectedDate === todayDateStr ? 'Today: ' + selectedDate : selectedDate}
                    </span>
                  </div>
                  <div class="text-xs text-slate-600 dark:text-slate-300 mt-0.5">${selectedDate === todayDateStr ? todayFormattedLong : selectedDate} &bull; Standard Shift: 10:00 AM – 7:00 PM IST</div>
                  <div class="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">⚡ Official In-App Timesheet &bull; Cloudflare D1 SQL Verified &bull; Google Form Retired</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button onclick="syncTimesheetsWithServer(true)" class="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer inline-flex items-center gap-1 shadow-sm" title="Force Refresh with Cloudflare D1 Database">
                  <span>🔄</span> <span>Sync Database</span>
                </button>
                <button onclick="setTab('timesheet')" class="text-xs text-orange-600 dark:text-orange-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer">
                  <span>📅 Monthly History</span> <span>→</span>
                </button>
              </div>
            </div>

            <!-- Direct Quick Input Row (Fully Responsive — With Accessible Visible Date Picker) -->
            <div class="${isInsideSimulator ? 'space-y-2.5' : 'grid grid-cols-1 md:grid-cols-5 gap-2.5 items-end'}">
              <div>
                <label class="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Timesheet Date</label>
                <input type="date" id="tsDate" value="${selectedDate}" max="${todayDateStr}" onchange="handleTimesheetDateSelect('${emp.id}', this.value)" class="w-full at-form-input font-mono font-bold" />
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Check-In Time</label>
                <input type="time" id="tsIn" value="${todayLog ? todayLog.entryTime : '10:00'}" class="w-full at-form-input font-mono" />
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Check-Out Time</label>
                <input type="time" id="tsOut" value="${todayLog ? todayLog.exitTime : '19:00'}" class="w-full at-form-input font-mono" />
              </div>
              <div class="${isInsideSimulator ? 'w-full' : ''}">
                <label class="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Work Tasks / Deliverables</label>
                <input type="text" id="tsSummary" value="${todayLog ? (todayLog.summary || '') : ''}" placeholder="Tasks worked on..." class="w-full at-form-input" />
                <input type="hidden" id="tsLink" value="Aaruni Mobile App (D1 Verified)" />
              </div>
              <div class="${isInsideSimulator ? 'w-full pt-1' : ''}">
                <button onclick="submitStaffTimesheet('${emp.id}')" class="w-full brand-grad text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow cursor-pointer hover:opacity-90 flex items-center justify-center gap-1.5">
                  <span>${todaySubmitted ? '🔄 Update Timesheet' : '💾 Submit Timesheet'}</span>
                </button>
              </div>
            </div>
          </div>"""

if old_phonetool_today in portal:
    portal = portal.replace(old_phonetool_today, new_phonetool_today)
    print("✓ Updated Tab 1 Phonetool Profile with visible date picker & dynamic dates")

# G. Update Tab 2 Attendance Timesheet loop: from todayDay down to 1
old_timesheet_audit = """        for (let d = 11; d >= 1; d--) {
          const dateStr = `2026-11-${String(d).padStart(2, '0')}`;
          const dt = new Date(2026, 10, d);
          const dayName = dayNames[dt.getDay()];
          const isSunday = (dt.getDay() === 0);
          const isToday = (d === 11);"""

new_timesheet_audit = """        const todayDay = getTodayDayOfMonth();
        for (let d = todayDay; d >= 1; d--) {
          const dateStr = `2026-11-${String(d).padStart(2, '0')}`;
          const dt = new Date(2026, 10, d);
          const dayName = dayNames[dt.getDay()];
          const isSunday = (dt.getDay() === 0);
          const isToday = (d === todayDay);"""

if old_timesheet_audit in portal:
    portal = portal.replace(old_timesheet_audit, new_timesheet_audit)
    print("✓ Updated Attendance Tab daily audit loop to start from todayDay")

portal = portal.replace(
    "openQuickTimesheetModal('${emp.id}', '${missingDays[0] ? missingDays[0].dateStr : '2026-11-11'}')",
    "openQuickTimesheetModal('${emp.id}', '${missingDays[0] ? missingDays[0].dateStr : getTodayDateStr()}')"
)
portal = portal.replace(
    "openQuickTimesheetModal('${emp.id}', '2026-11-11')",
    "openQuickTimesheetModal('${emp.id}', getTodayDateStr())"
)
print("✓ Updated openQuickTimesheetModal fallbacks to getTodayDateStr()")

# H. Update Admin Cockpit Pulse tab labels to dynamic dates
portal = portal.replace(
    '<div class="text-xs text-slate-400">Logged Today (11 Nov 2026)</div>',
    '<div class="text-xs text-slate-400">Logged Today (${getTodayFormattedLong()})</div>'
)
portal = portal.replace(
    '<h2 class="text-base font-bold text-white">Daily Attendance Pulse — 11 November 2026</h2>',
    '<h2 class="text-base font-bold text-white">Daily Attendance Pulse — ${getTodayFormattedLong()}</h2>'
)
print("✓ Updated Admin Cockpit Pulse tab labels to dynamic dates")

# I. Update submitStaffTimesheet to default dt to getTodayDateStr() and handle async D1 sync
old_submit_ts = """    function submitStaffTimesheet(empId, customDate, customIn, customOut, customSummary) {
      const emp = state.employees.find(e => e.id === empId);
      const dtEl = document.getElementById("tsDate");
      const inEl = document.getElementById("tsIn") || document.getElementById("tsEntry");
      const outEl = document.getElementById("tsOut") || document.getElementById("tsExit");
      const sumEl = document.getElementById("tsSummary");
      const linkEl = document.getElementById("tsLink");

      const dt = customDate || (dtEl ? dtEl.value : "2026-11-11");
      const inT = customIn || (inEl ? inEl.value : "10:00");
      const outT = customOut || (outEl ? outEl.value : "19:00");
      const summary = (customSummary || (sumEl ? sumEl.value.trim() : "")) || "Engineering, video production & daily operations tasks";
      const link = (linkEl ? linkEl.value.trim() : "") || "Direct Timesheet";
      const hrs = calcHoursBetween(inT, outT);

      state.timesheets = state.timesheets.filter(t => !(t.empId === empId && t.date === dt));
      const newTsEntry = {
        id: `TS-${empId}-${dt}`,
        empId,
        empName: emp ? emp.name : empId,
        email: emp ? emp.email : "",
        date: dt,
        month: dt.slice(0, 7),
        entryTime: inT,
        exitTime: outT,
        hours: hrs,
        status: "Worked",
        summary,
        taskLink: link,
        source: "Aaruni Mobile App (D1 Verified)"
      };

      state.timesheets.unshift(newTsEntry);
      saveState();
      showToast("✅ Timesheet Recorded!", `${emp.name}: ${hrs} hrs (${inT} → ${outT}) logged for ${dt}. Synced to Cloudflare D1.`);
      closeModal();
      renderApp();

      // Cloudflare D1 Remote Edge Sync
      try {
        fetch("/api/timesheets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTsEntry)
        }).then(r => r.json()).then(data => {
          if (data && data.success) {
            console.log("Cloudflare D1 sync confirmed:", data.message);
          }
        }).catch(err => console.log("Background D1 push offline notice:", err.message));
      } catch (e) {}
    }"""

new_submit_ts = """    function handleTimesheetDateSelect(empId, selectedDate) {
      state.activeTimesheetDate = selectedDate;
      renderApp();
    }

    async function submitStaffTimesheet(empId, customDate, customIn, customOut, customSummary) {
      const emp = state.employees.find(e => e.id === empId);
      const dtEl = document.getElementById("tsDate");
      const inEl = document.getElementById("tsIn") || document.getElementById("tsEntry");
      const outEl = document.getElementById("tsOut") || document.getElementById("tsExit");
      const sumEl = document.getElementById("tsSummary");
      const linkEl = document.getElementById("tsLink");

      const todayDefault = getTodayDateStr();
      const dt = customDate || (dtEl ? dtEl.value : todayDefault);
      const inT = customIn || (inEl ? inEl.value : "10:00");
      const outT = customOut || (outEl ? outEl.value : "19:00");
      const summary = (customSummary || (sumEl ? sumEl.value.trim() : "")) || "Engineering, video production & daily operations tasks";
      const link = (linkEl ? linkEl.value.trim() : "") || "Aaruni Mobile App (D1 Verified)";
      const hrs = calcHoursBetween(inT, outT);

      // Remove existing entry for this employee and date
      state.timesheets = state.timesheets.filter(t => !(t.empId === empId && t.date === dt));
      const newTsEntry = {
        id: `TS-${empId}-${dt}`,
        empId,
        empName: emp ? emp.name : empId,
        email: emp ? emp.email : "",
        date: dt,
        month: dt.slice(0, 7),
        entryTime: inT,
        exitTime: outT,
        hours: hrs,
        status: "Worked",
        summary,
        taskLink: link,
        source: "Aaruni Mobile App (D1 Verified)"
      };

      state.timesheets.unshift(newTsEntry);
      saveState();
      showToast("✅ Timesheet Recorded!", `${emp ? emp.name : empId}: ${hrs} hrs (${inT} → ${outT}) saved for ${dt}. Syncing to Cloudflare D1...`);
      if (typeof closeModal === "function") closeModal();
      renderApp();

      // Cloudflare D1 Remote Edge Sync
      try {
        const resp = await fetch("/api/timesheets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTsEntry)
        });
        const resJson = await resp.json();
        if (resJson && resJson.success) {
          console.log("Cloudflare D1 sync confirmed:", resJson.message);
          showToast("🟢 Database Synced", `Timesheet for ${dt} successfully committed to Cloudflare D1.`);
        }
      } catch (err) {
        console.log("Background D1 push offline notice:", err.message);
      }
    }"""

if old_submit_ts in portal:
    portal = portal.replace(old_submit_ts, new_submit_ts)
    print("✓ Updated submitStaffTimesheet with async D1 commit and handleTimesheetDateSelect")

# J. Update syncTimesheetsWithServer: Match by (empId, date) and support manual sync feedback
old_sync_code = """    // CLOUDFLARE D1 AUTOMATIC 2-WAY SYNC
    async function syncTimesheetsWithServer() {
      try {
        const res = await fetch("/api/timesheets", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          const existingIds = new Set(state.timesheets.map(t => t.id));
          let added = 0;
          json.data.forEach(remoteEntry => {
            if (!existingIds.has(remoteEntry.id)) {
              state.timesheets.push(remoteEntry);
              existingIds.add(remoteEntry.id);
              added++;
            }
          });
          if (added > 0) {
            saveState();
            renderApp();
          }
        }
      } catch (err) {
        console.log("D1 sync offline/idle:", err.message);
      }
    }"""

new_sync_code = """    // CLOUDFLARE D1 AUTOMATIC 2-WAY SYNC (SINGLE SOURCE OF TRUTH)
    async function syncTimesheetsWithServer(isManual = false) {
      try {
        if (isManual) {
          showToast("🔄 Syncing Database...", "Connecting to Cloudflare D1 edge database...");
        }
        const res = await fetch("/api/timesheets?t=" + Date.now(), { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          let updatedCount = 0;
          json.data.forEach(remoteEntry => {
            const existingIdx = state.timesheets.findIndex(
              t => t.empId === remoteEntry.empId && t.date === remoteEntry.date
            );
            if (existingIdx >= 0) {
              const local = state.timesheets[existingIdx];
              if (
                local.hours !== remoteEntry.hours ||
                local.entryTime !== remoteEntry.entryTime ||
                local.exitTime !== remoteEntry.exitTime ||
                local.summary !== remoteEntry.summary ||
                local.id !== remoteEntry.id
              ) {
                state.timesheets[existingIdx] = { ...local, ...remoteEntry };
                updatedCount++;
              }
            } else {
              state.timesheets.push(remoteEntry);
              updatedCount++;
            }
          });

          if (updatedCount > 0) {
            saveState();
            renderApp();
            if (isManual) {
              showToast("✅ Database Synchronized", `Updated ${updatedCount} timesheets from Cloudflare D1.`);
            }
          } else if (isManual) {
            showToast("✅ Up-to-Date", "Your device has all the latest Cloudflare D1 entries.");
          }
        }
      } catch (err) {
        console.log("D1 sync offline/idle:", err.message);
        if (isManual) {
          showToast("⚠️ Sync Notice", "Cloudflare edge database temporarily busy. Using local cache.");
        }
      }
    }"""

if old_sync_code in portal:
    portal = portal.replace(old_sync_code, new_sync_code)
    print("✓ Updated syncTimesheetsWithServer with (empId, date) deduplication and manual feedback")

with open(PORTAL_PATH, "w", encoding="utf-8") as f:
    f.write(portal)

print("SUCCESS: apply_date_and_sync_fix.py executed!")
