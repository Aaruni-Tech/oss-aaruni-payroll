#!/usr/bin/env python3
import re

PORTAL_PATH = "/Users/rupesh/.gemini/antigravity/scratch/aaruni-payroll-repo/public/portal.html"

with open(PORTAL_PATH, "r", encoding="utf-8") as f:
    text = f.read()

new_drawer_code = """function openNotificationDrawer() {
      const isAdmin = state.persona === "ADMIN";
      const empId = state.persona;
      const pendingLeaves = (state.leaveRequests || []).filter(l => l.status === "Pending");
      const pendingAdvances = (state.advanceRequests || []).filter(a => a.status === "Pending");
      const activeStaff = (state.employees || []).filter(e => e.trackTimesheet && e.status === "Active");
      const missingTimesheetStaff = activeStaff.filter(e => {
        return !(state.timesheets || []).some(t => t.empId === e.id && t.date === "2026-11-11" && t.hours > 0);
      });

      const activeBroadcasts = (state.broadcasts || []).filter(b => b.active && !(state.dismissedBroadcasts && state.dismissedBroadcasts[empId] && state.dismissedBroadcasts[empId].includes(b.id)));

      const html = `
        <div style="font-family:'Inter',sans-serif;color:var(--at-text);max-width:560px;margin:0 auto;">
          <div style="font-size:12px;color:var(--at-text-muted);margin-bottom:14px;">
            ${isAdmin ? 'Executive Management Approvals &amp; Priority Alerts' : 'Staff Action Center &amp; Important Updates'}
          </div>

          <div style="display:flex;flex-direction:column;gap:14px;max-height:60vh;overflow-y:auto;padding-right:4px;">
            ${isAdmin ? `
              <!-- ADMIN ACTION 1: BROADCAST SHORTCUT -->
              <div style="background:var(--at-surface-subtle);border:1px dashed var(--at-border);border-radius:12px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
                <div>
                  <div style="font-size:12px;font-weight:800;color:var(--at-text);">📢 Broadcast to All Staff</div>
                  <div style="font-size:11px;color:var(--at-text-muted);">Send notice to all portals (AAR-0001 to AAR-0008)</div>
                </div>
                <button onclick="closeDocModal(); openAdminBroadcastModal();" class="brand-grad" style="padding:6px 14px;border-radius:8px;border:none;color:#fff;font-weight:700;font-size:11px;cursor:pointer;">
                  + New Broadcast
                </button>
              </div>

              <!-- ADMIN ACTION 2: PENDING LEAVE APPROVALS -->
              <div>
                <div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;color:#fe5f01;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">
                  <span>Pending Leave Requests (${pendingLeaves.length})</span>
                </div>
                ${pendingLeaves.length === 0 ? `
                  <div style="font-size:11px;color:var(--at-text-muted);padding:8px 12px;background:var(--at-surface-subtle);border-radius:10px;">
                    ✅ No pending leaves. All requests reviewed.
                  </div>
                ` : pendingLeaves.map(l => `
                  <div style="background:var(--at-surface-subtle);border:1px solid var(--at-border);border-radius:12px;padding:12px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
                    <div>
                      <div style="font-size:12px;font-weight:800;color:var(--at-text);">${l.empName} &bull; ${l.leaveType} (${l.days}d)</div>
                      <div style="font-size:11px;color:var(--at-text-muted);margin-top:2px;">📅 ${l.startDate} &rarr; ${l.endDate} &bull; Reason: <em>${l.reason}</em></div>
                    </div>
                    <div style="display:flex;gap:6px;">
                      <button onclick="approveLeaveRequest('${l.id}')" style="background:#16a34a;color:#fff;font-size:11px;font-weight:700;padding:6px 12px;border-radius:8px;border:none;cursor:pointer;">
                        ✅ Approve
                      </button>
                      <button onclick="rejectLeaveRequest('${l.id}')" style="background:#dc2626;color:#fff;font-size:11px;font-weight:700;padding:6px 12px;border-radius:8px;border:none;cursor:pointer;">
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>

              <!-- ADMIN ACTION 3: PENDING ADVANCE APPROVALS -->
              <div>
                <div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;color:#fe5f01;margin-bottom:8px;">
                  Pending Salary Advances (${pendingAdvances.length})
                </div>
                ${pendingAdvances.length === 0 ? `
                  <div style="font-size:11px;color:var(--at-text-muted);padding:8px 12px;background:var(--at-surface-subtle);border-radius:10px;">
                    ✅ No pending advance loan requests.
                  </div>
                ` : pendingAdvances.map(a => `
                  <div style="background:var(--at-surface-subtle);border:1px solid var(--at-border);border-radius:12px;padding:12px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
                    <div>
                      <div style="font-size:12px;font-weight:800;color:var(--at-text);">${a.empName} &bull; Requested: ₹${Number(a.amount).toLocaleString('en-IN')}</div>
                      <div style="font-size:11px;color:var(--at-text-muted);margin-top:2px;">Reason: ${a.reason} &bull; Date: ${a.requestDate}</div>
                    </div>
                    <div style="display:flex;gap:6px;">
                      <button onclick="approveAdvanceRequest('${a.id}')" style="background:#16a34a;color:#fff;font-size:11px;font-weight:700;padding:6px 12px;border-radius:8px;border:none;cursor:pointer;">
                        ✅ Approve
                      </button>
                      <button onclick="rejectAdvanceRequest('${a.id}')" style="background:#dc2626;color:#fff;font-size:11px;font-weight:700;padding:6px 12px;border-radius:8px;border:none;cursor:pointer;">
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>

              <!-- ADMIN ACTION 4: MISSING TIMESHEET ALERTS -->
              <div>
                <div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;color:#fe5f01;margin-bottom:8px;">
                  Timesheet Punch Pending Today (${missingTimesheetStaff.length})
                </div>
                ${missingTimesheetStaff.length === 0 ? `
                  <div style="font-size:11px;color:var(--at-text-muted);padding:8px 12px;background:var(--at-surface-subtle);border-radius:10px;">
                    🎉 100% attendance logged for today!
                  </div>
                ` : missingTimesheetStaff.map(e => `
                  <div style="background:var(--at-surface-subtle);border:1px solid var(--at-border);border-radius:10px;padding:10px 12px;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;">
                    <div style="display:flex;align-items:center;gap:8px;">
                      <img src="${getEmployeePhoto(e.id)}" style="width:24px;height:24px;border-radius:6px;object-fit:cover;" />
                      <span style="font-size:12px;font-weight:700;color:var(--at-text);">${e.name} (${e.id})</span>
                    </div>
                    <span style="font-size:10px;font-weight:800;background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:999px;">Punch Pending</span>
                  </div>
                `).join('')}
              </div>
            ` : `
              <!-- STAFF NOTIFICATIONS -->
              <!-- BROADCASTS -->
              ${activeBroadcasts.map(b => `
                <div style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:12px;padding:14px;">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:16px;">📢</span>
                    <strong style="font-size:13px;color:#9a3412;">${b.title}</strong>
                  </div>
                  <div style="font-size:12px;color:#334155;margin:6px 0;">${b.message}</div>
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
                    <span style="font-size:10px;color:#64748b;">${b.author} &bull; ${b.createdAt}</span>
                    <button onclick="dismissStaffBroadcast('${b.id}', '${empId}')" style="background:#9a3412;color:#fff;border:none;font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;cursor:pointer;">
                      ✓ Mark Read
                    </button>
                  </div>
                </div>
              `).join('')}

              <!-- TIMESHEET REMINDER -->
              <div style="background:var(--at-surface-subtle);border:1px solid var(--at-border);border-radius:12px;padding:14px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
                <div>
                  <div style="font-size:12px;font-weight:800;color:var(--at-text);">⏰ Daily Timesheet Reminder</div>
                  <div style="font-size:11px;color:var(--at-text-muted);">Remember to log your Entry &amp; Exit times today (10 AM &ndash; 7 PM IST).</div>
                </div>
                <button onclick="closeDocModal(); setTab('timesheet');" class="brand-grad" style="padding:6px 14px;border-radius:8px;border:none;color:#fff;font-weight:700;font-size:11px;cursor:pointer;">
                  Log Hours
                </button>
              </div>
            `}
          </div>

          <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--at-border);display:flex;justify-content:flex-end;">
            <button onclick="closeDocModal()" class="at-btn-close">Close</button>
          </div>
        </div>
      `;
      openModalWithHTML("🔔 Notifications &amp; Approvals Hub", html, false);
    }
    
    """

pattern = r"(function openNotificationDrawer\(\)\s*\{[\s\S]*?)(function triggerAdmin2WayMFA)"
text = re.sub(pattern, new_drawer_code + r"\2", text)

with open(PORTAL_PATH, "w", encoding="utf-8") as f:
    f.write(text)

print("SUCCESS: patch_drawer.py applied cleanly!")
