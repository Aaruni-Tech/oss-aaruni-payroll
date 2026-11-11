#!/usr/bin/env python3
import re

PORTAL_PATH = "/Users/rupesh/.gemini/antigravity/scratch/aaruni-payroll-repo/public/portal.html"

with open(PORTAL_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# =========================================================================
# 1. STREAMLINE openAdminBroadcastModal (NO DOUBLE BOX / NO PRINT BTN)
# =========================================================================
old_broadcast_modal = """    function openAdminBroadcastModal() {
      const html = `
        <div style="font-family:'Inter',sans-serif;color:var(--at-text);max-width:520px;margin:0 auto;">
          <div class="glass-card" style="border-radius:18px;padding:22px;border:1.5px solid var(--at-border);box-shadow:var(--at-shadow);">
            <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--at-border);padding-bottom:12px;margin-bottom:16px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:22px;">📢</span>
                <div>
                  <div style="font-size:15px;font-weight:900;color:var(--at-text);">Broadcast Announcement to Entire Staff</div>
                  <div style="font-size:11px;color:var(--at-text-muted);">Displays on staff dashboards (AAR-0001 to AAR-0008)</div>
                </div>
              </div>
              <button onclick="closeDocModal()" class="at-modal-close-icon">&times;</button>
            </div>

            <div style="display:flex;flex-direction:column;gap:14px;">
              <div>
                <label style="display:block;font-size:11px;font-weight:800;color:var(--at-text-muted);text-transform:uppercase;margin-bottom:6px;">Announcement Title</label>
                <input type="text" id="bcTitle" placeholder="e.g. Timesheet Deadline / Guru Nanak Jayanti Holiday Notice" class="at-form-input" style="width:100%;font-weight:700;" />
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div>
                  <label style="display:block;font-size:11px;font-weight:800;color:var(--at-text-muted);text-transform:uppercase;margin-bottom:6px;">Category</label>
                  <select id="bcCategory" class="at-form-input" style="width:100%;">
                    <option value="General Announcement">📢 General Announcement</option>
                    <option value="🚨 Urgent Action Required">🚨 Urgent Notice</option>
                    <option value="🌴 Holiday Notice">🌴 Holiday Notice</option>
                    <option value="💰 Payroll &amp; Salary Update">💰 Payroll &amp; Salary</option>
                    <option value="⚡ System Update">⚡ System Update</option>
                  </select>
                </div>
                <div>
                  <label style="display:block;font-size:11px;font-weight:800;color:var(--at-text-muted);text-transform:uppercase;margin-bottom:6px;">Priority Level</label>
                  <select id="bcUrgency" class="at-form-input" style="width:100%;">
                    <option value="normal">Normal Priority</option>
                    <option value="urgent">High Urgency (Red Alert)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style="display:block;font-size:11px;font-weight:800;color:var(--at-text-muted);text-transform:uppercase;margin-bottom:6px;">Message Body</label>
                <textarea id="bcMessage" rows="4" placeholder="Type your official announcement here for all company employees..." class="at-form-input" style="width:100%;resize:vertical;"></textarea>
              </div>

              <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-top:8px;padding-top:14px;border-top:1px solid var(--at-border);">
                <button onclick="closeDocModal()" class="at-btn-close">Cancel</button>
                <button onclick="submitAdminBroadcast()" class="brand-grad" style="padding:9px 20px;border-radius:10px;border:none;color:#ffffff;font-weight:800;font-size:12px;cursor:pointer;box-shadow:0 4px 14px rgba(254,95,1,0.35);">
                  📢 Publish Broadcast to Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      openModalWithHTML("Broadcast Announcement", html);
    }"""

new_broadcast_modal = """    function openAdminBroadcastModal() {
      const html = `
        <div style="font-family:'Inter',sans-serif;color:var(--at-text);max-width:540px;margin:0 auto;">
          <div style="font-size:12px;color:var(--at-text-muted);margin-bottom:14px;">
            Broadcast an official notification to all staff portals (AAR-0001 to AAR-0008).
          </div>
          <div style="display:flex;flex-direction:column;gap:14px;">
            <div>
              <label style="display:block;font-size:11px;font-weight:800;color:var(--at-text-muted);text-transform:uppercase;margin-bottom:6px;">Announcement Title</label>
              <input type="text" id="bcTitle" placeholder="e.g. Timesheet Deadline / Guru Nanak Jayanti Holiday Notice" class="at-form-input" style="width:100%;font-weight:700;" />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label style="display:block;font-size:11px;font-weight:800;color:var(--at-text-muted);text-transform:uppercase;margin-bottom:6px;">Category</label>
                <select id="bcCategory" class="at-form-input" style="width:100%;">
                  <option value="General Announcement">📢 General Announcement</option>
                  <option value="🚨 Urgent Action Required">🚨 Urgent Notice</option>
                  <option value="🌴 Holiday Notice">🌴 Holiday Notice</option>
                  <option value="💰 Payroll &amp; Salary Update">💰 Payroll &amp; Salary</option>
                  <option value="⚡ System Update">⚡ System Update</option>
                </select>
              </div>
              <div>
                <label style="display:block;font-size:11px;font-weight:800;color:var(--at-text-muted);text-transform:uppercase;margin-bottom:6px;">Priority Level</label>
                <select id="bcUrgency" class="at-form-input" style="width:100%;">
                  <option value="normal">Normal Priority</option>
                  <option value="urgent">High Urgency (Red Alert)</option>
                </select>
              </div>
            </div>

            <div>
              <label style="display:block;font-size:11px;font-weight:800;color:var(--at-text-muted);text-transform:uppercase;margin-bottom:6px;">Message Body</label>
              <textarea id="bcMessage" rows="4" placeholder="Type your official announcement here for all company employees..." class="at-form-input" style="width:100%;resize:vertical;"></textarea>
            </div>

            <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-top:8px;padding-top:14px;border-top:1px solid var(--at-border);">
              <button onclick="closeDocModal()" class="at-btn-close">Cancel</button>
              <button onclick="submitAdminBroadcast()" class="brand-grad" style="padding:9px 20px;border-radius:10px;border:none;color:#ffffff;font-weight:800;font-size:12px;cursor:pointer;box-shadow:0 4px 14px rgba(254,95,1,0.35);">
                📢 Publish Broadcast to Staff
              </button>
            </div>
          </div>
        </div>
      `;
      openModalWithHTML("📢 Broadcast Announcement to Entire Staff", html, false);
    }"""

if old_broadcast_modal in content:
    content = content.replace(old_broadcast_modal, new_broadcast_modal)
    print("✓ Replaced openAdminBroadcastModal")
else:
    print("✗ Could not find old_broadcast_modal")

# =========================================================================
# 2. STREAMLINE openNotificationDrawer (NO DOUBLE BOX / NO PRINT BTN)
# =========================================================================
old_drawer = """    function openNotificationDrawer() {
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
        <div style="font-family:'Inter',sans-serif;color:var(--at-text);max-width:540px;margin:0 auto;">
          <div class="glass-card" style="border-radius:20px;padding:22px;border:1.5px solid var(--at-border);box-shadow:var(--at-shadow);">
            <!-- Drawer Header -->
            <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--at-border);padding-bottom:14px;margin-bottom:16px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:24px;">🔔</span>
                <div>
                  <div style="font-size:16px;font-weight:900;color:var(--at-text);">Notifications &amp; Approvals Hub</div>
                  <div style="font-size:11px;color:var(--at-text-muted);">${isAdmin ? 'Executive Management Approvals & Alerts' : 'Staff Action Center & Updates'}</div>
                </div>
              </div>
              <button onclick="closeDocModal()" class="at-modal-close-icon">&times;</button>
            </div>

            <!-- Content Area -->
            <div style="display:flex;flex-direction:column;gap:14px;max-height:60vh;overflow-y:auto;padding-right:4px;">
              ${isAdmin ? `
                <!-- ADMIN ACTION 1: BROADCAST SHORTCUT -->
                <div style="background:var(--at-surface-subtle);border:1px dashed var(--at-border);border-radius:14px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
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
                  <div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;color:#fe5f01;margin-bottom:8px;display:flex;items-center;justify-content:space-between;">
                    <span>Pending Leave Requests (${pendingLeaves.length})</span>
                  </div>
                  ${pendingLeaves.length === 0 ? `
                    <div style="font-size:11px;color:var(--at-text-muted);padding:8px 12px;background:var(--at-surface-subtle);border-radius:10px;">
                      ✅ No pending leaves. All requests reviewed.
                    </div>
                  ` : pendingLeaves.map(l => `
                    <div style="background:var(--at-surface-subtle);border:1px solid var(--at-border);border-radius:12px;padding:12px;margin-bottom:8px;display:flex;items-center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
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
                    <div style="background:var(--at-surface-subtle);border:1px solid var(--at-border);border-radius:12px;padding:12px;margin-bottom:8px;display:items-center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
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

            <!-- Footer Action -->
            <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--at-border);display:flex;justify-content:flex-end;">
              <button onclick="closeDocModal()" class="at-btn-close">Close</button>
            </div>
          </div>
        </div>
      `;
      openModalWithHTML("Notifications & Approvals Hub", html);
    }"""

new_drawer = """    function openNotificationDrawer() {
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
    }"""

if old_drawer in content:
    content = content.replace(old_drawer, new_drawer)
    print("✓ Replaced openNotificationDrawer")
else:
    print("✗ Could not find old_drawer")

# =========================================================================
# 3. STREAMLINE triggerAdmin2WayMFA (NO DOUBLE BOX / NO PRINT BTN)
# =========================================================================
old_mfa = """    function triggerAdmin2WayMFA(targetPersona, userDisplay) {
      const demoCode = "842097";
      const html = `
        <div style="font-family:'Inter',sans-serif;color:var(--at-text);max-width:440px;margin:0 auto;text-align:center;">
          <div class="glass-card" style="border-radius:20px;padding:26px;border:1.5px solid #fe5f01;box-shadow:var(--at-shadow);">
            <div style="width:52px;height:52px;border-radius:16px;background:rgba(254,95,1,0.15);display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 14px;border:1px solid rgba(254,95,1,0.3);">
              🔐
            </div>
            <h2 style="font-size:18px;font-weight:900;color:var(--at-text);margin-bottom:4px;">Two-Factor Authentication (2-Way MFA)</h2>
            <p style="font-size:12px;color:var(--at-text-muted);margin-bottom:16px;">
              Enforced for Managing Director &amp; Executive Admin. A 6-digit security code has been dispatched to <strong>+91 7842097003</strong> / <strong>tech.aaruni@gmail.com</strong>.
            </p>

            <div style="background:var(--at-surface-subtle);border:1px dashed var(--at-border);border-radius:12px;padding:12px;margin-bottom:16px;">
              <div style="font-size:11px;font-weight:700;color:var(--at-text-muted);text-transform:uppercase;letter-spacing:0.5px;">Your 2-Way Security Code</div>
              <div style="font-size:26px;font-weight:900;letter-spacing:6px;color:#fe5f01;font-family:monospace;margin:4px 0;">${demoCode}</div>
              <div style="font-size:10px;color:var(--at-text-muted);">Valid for 10 minutes &bull; Cloudflare Zero-Trust Protected</div>
            </div>

            <div style="margin-bottom:16px;">
              <label style="display:block;font-size:11px;font-weight:800;color:var(--at-text-muted);text-transform:uppercase;margin-bottom:6px;text-align:left;">Enter 6-Digit Code</label>
              <input type="text" id="mfaCodeInput" maxlength="6" value="${demoCode}" class="at-form-input" style="width:100%;font-size:20px;letter-spacing:6px;text-align:center;font-family:monospace;font-weight:900;" onkeydown="if(event.key==='Enter') verifyAdminMFACode('${demoCode}')" />
              <div id="mfaErrorMsg" style="display:none;color:#e11d48;font-size:11px;font-weight:700;margin-top:6px;"></div>
            </div>

            <div style="display:flex;gap:10px;">
              <button onclick="closeDocModal()" class="at-btn-close" style="flex:1;">Cancel</button>
              <button onclick="verifyAdminMFACode('${demoCode}')" class="brand-grad" style="flex:2;padding:11px;border-radius:10px;border:none;color:#fff;font-weight:800;font-size:12px;cursor:pointer;">
                Verify &amp; Enter Admin Cockpit &rarr;
              </button>
            </div>
          </div>
        </div>
      `;
      openModalWithHTML("Two-Factor Authentication", html);
    }"""

new_mfa = """    function triggerAdmin2WayMFA(targetPersona, userDisplay) {
      const demoCode = "842097";
      const html = `
        <div style="font-family:'Inter',sans-serif;color:var(--at-text);max-width:440px;margin:0 auto;text-align:center;">
          <div style="width:52px;height:52px;border-radius:16px;background:rgba(254,95,1,0.15);display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 14px;border:1px solid rgba(254,95,1,0.3);">
            🔐
          </div>
          <p style="font-size:12px;color:var(--at-text-muted);margin-bottom:16px;line-height:1.5;">
            Enforced for Managing Director &amp; Executive Admin. A 6-digit security code has been dispatched to <strong>+91 7842097003</strong> / <strong>tech.aaruni@gmail.com</strong>.
          </p>

          <div style="background:var(--at-surface-subtle);border:1px dashed var(--at-border);border-radius:12px;padding:12px;margin-bottom:16px;">
            <div style="font-size:11px;font-weight:700;color:var(--at-text-muted);text-transform:uppercase;letter-spacing:0.5px;">Your 2-Way Security Code</div>
            <div style="font-size:26px;font-weight:900;letter-spacing:6px;color:#fe5f01;font-family:monospace;margin:4px 0;">${demoCode}</div>
            <div style="font-size:10px;color:var(--at-text-muted);">Valid for 10 minutes &bull; Cloudflare Zero-Trust Protected</div>
          </div>

          <div style="margin-bottom:16px;">
            <label style="display:block;font-size:11px;font-weight:800;color:var(--at-text-muted);text-transform:uppercase;margin-bottom:6px;text-align:left;">Enter 6-Digit Code</label>
            <input type="text" id="mfaCodeInput" maxlength="6" value="${demoCode}" class="at-form-input" style="width:100%;font-size:20px;letter-spacing:6px;text-align:center;font-family:monospace;font-weight:900;" onkeydown="if(event.key==='Enter') verifyAdminMFACode('${demoCode}')" />
            <div id="mfaErrorMsg" style="display:none;color:#e11d48;font-size:11px;font-weight:700;margin-top:6px;"></div>
          </div>

          <div style="display:flex;gap:10px;">
            <button onclick="closeDocModal()" class="at-btn-close" style="flex:1;">Cancel</button>
            <button onclick="verifyAdminMFACode('${demoCode}')" class="brand-grad" style="flex:2;padding:11px;border-radius:10px;border:none;color:#fff;font-weight:800;font-size:12px;cursor:pointer;">
              Verify &amp; Enter Admin Cockpit &rarr;
            </button>
          </div>
        </div>
      `;
      openModalWithHTML("🔐 Two-Factor Authentication (2-Way MFA)", html, false);
    }"""

if old_mfa in content:
    content = content.replace(old_mfa, new_mfa)
    print("✓ Replaced triggerAdmin2WayMFA")
else:
    print("✗ Could not find old_mfa")

# =========================================================================
# 4. SIDEBAR & TOP BAR: MINIMALIST WHITE & BROADCAST BUTTON
# =========================================================================
# Sidebar nav: add Broadcast button before Cloud & Syllovo Leads
old_sidebar_leads = """                <button onclick="openAdminLeadsModal('all')" class="at-nav-btn">
                  <span style="font-size:15px;">📬</span> <span>Cloud &amp; Syllovo Leads</span>
                </button>"""

new_sidebar_leads = """                <button onclick="openAdminBroadcastModal()" class="at-nav-btn" style="color: #fe5f01 !important; font-weight: 700;">
                  <span style="font-size:15px;">📢</span> <span>Broadcast to Staff</span>
                </button>
                <button onclick="openAdminLeadsModal('all')" class="at-nav-btn">
                  <span style="font-size:15px;">📬</span> <span>Cloud &amp; Syllovo Leads</span>
                </button>"""

if old_sidebar_leads in content:
    content = content.replace(old_sidebar_leads, new_sidebar_leads)
    print("✓ Added Broadcast button to sidebar")

# Top search bar: add Broadcast button alongside Staff Invitations
old_top_action_bar = """              <div style="display:flex;align-items:center;gap:8px;">
                <button onclick="openAdminLeadsModal('all')" style="background:#0284c7;border:1px solid #0369a1;color:#fff;padding:9px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
                  <span>📬</span> <span>Cloud &amp; Syllovo Leads</span>
                </button>
                <button onclick="openStaffInvitationsModal()" class="at-orange-btn">
                  <span>📨</span> <span>Staff Invitations</span>
                </button>"""

new_top_action_bar = """              <div style="display:flex;align-items:center;gap:8px;">
                <button onclick="openAdminBroadcastModal()" class="at-orange-btn" title="Send Official Announcement to All Staff">
                  <span>📢</span> <span>Broadcast to Staff</span>
                </button>
                <button onclick="openStaffInvitationsModal()" style="background:var(--at-surface-subtle);border:1px solid var(--at-border);color:var(--at-text);padding:9px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
                  <span>📨</span> <span>Staff Invitations</span>
                </button>"""

if old_top_action_bar in content:
    content = content.replace(old_top_action_bar, new_top_action_bar)
    print("✓ Added Broadcast button to top action bar")

# Sidebar bottom support card: make 100% minimalist white theme compliant
old_sidebar_support = """            <!-- Bottom Sidebar Support & TDS Card -->
            <div style="padding:16px;border-top:1px solid #232d46;">
              <a href="mailto:rupesh@fullstackmaster.net" style="color:#a6b0c3;font-size:12px;text-decoration:none;display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;font-weight:600;">
                <span>Contact Support</span>
                <span>›</span>
              </a>
              <div onclick="openACSTaxDossierModal()" style="background:#1e2538;border:1px solid #2e3a54;border-radius:10px;padding:12px;cursor:pointer;transition:all 0.15s ease;">
                <div style="font-size:11px;font-weight:800;color:#ffffff;line-height:1.4;">Track TDS Liabilities &amp; Generate Form 24Q / 16</div>
                <div style="font-size:11px;color:#fe5f01;font-weight:700;margin-top:6px;display:flex;align-items:center;gap:4px;">
                  <span>View Details</span> <span>→</span>
                </div>
              </div>
            </div>"""

new_sidebar_support = """            <!-- Bottom Sidebar Support & TDS Card (Clean Minimalist Theme) -->
            <div style="padding:16px;border-top:1px solid var(--at-border);">
              <a href="mailto:rupesh@fullstackmaster.net" style="color:var(--at-text-muted);font-size:12px;text-decoration:none;display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;font-weight:600;">
                <span>Contact Support</span>
                <span>›</span>
              </a>
              <div onclick="openACSTaxDossierModal()" style="background:var(--at-surface-subtle);border:1px solid var(--at-border);border-radius:10px;padding:12px;cursor:pointer;transition:all 0.15s ease;">
                <div style="font-size:11px;font-weight:800;color:var(--at-text);line-height:1.4;">Track TDS Liabilities &amp; Generate Form 24Q / 16</div>
                <div style="font-size:11px;color:#fe5f01;font-weight:700;margin-top:6px;display:flex;align-items:center;gap:4px;">
                  <span>View Details</span> <span>→</span>
                </div>
              </div>
            </div>"""

if old_sidebar_support in content:
    content = content.replace(old_sidebar_support, new_sidebar_support)
    print("✓ Replaced sidebar support card with clean theme")

# =========================================================================
# 5. EMPLOYEES DIRECTORY: TOTAL ACCRUED FOOTER & BADGE
# =========================================================================
# In header: add Accrued pill
old_dir_header = """                  <span>Employees Directory</span>
                  <span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold">${filteredEmployees.length} Staff</span>"""

new_dir_header = """                  <span>Employees Directory</span>
                  <span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">${filteredEmployees.length} Staff</span>
                  <span class="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-300 font-extrabold">Total Accrued: ${fmtINR(totalAccruedToDate)}</span>"""

if old_dir_header in content:
    content = content.replace(old_dir_header, new_dir_header)
    print("✓ Added Accrued pill to directory header")

# In desktop table: add <tfoot>
old_tbody_end = """                  }).join("")}
                </tbody>
              </table>"""

new_tbody_end = """                  }).join("")}
                </tbody>
                <tfoot class="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-900/80 font-bold">
                  <tr>
                    <td colspan="5" class="py-3 px-2 text-right text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 font-extrabold">
                      Total Accrued to Date (Day 11/30):
                    </td>
                    <td class="py-3 px-2 text-right font-mono font-black text-sky-600 dark:text-sky-300 text-sm">
                      ${fmtINR(totalAccruedToDate)}
                    </td>
                    <td class="py-3 px-2 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400 text-xs">
                      ${fmtINR(totalNetMonthlyLiability)}
                    </td>
                    <td colspan="2" class="py-3 px-2 text-center text-xs text-slate-500 font-semibold">
                      ${paidCount} of ${activeCount} Staff Disbursed
                    </td>
                  </tr>
                </tfoot>
              </table>"""

if old_tbody_end in content:
    content = content.replace(old_tbody_end, new_tbody_end)
    print("✓ Added <tfoot> with Total Accrued to table")

# In mobile cards: add bottom summary card
old_mobile_cards_end = """                </div>
                `;
              }).join("")}
            </div>"""

new_mobile_cards_end = """                </div>
                `;
              }).join("")}
              <!-- Mobile Accrued Liability Summary Card -->
              <div class="glass-card rounded-2xl p-3.5 border-2 border-sky-500/50 bg-sky-50/50 dark:bg-sky-950/20 text-xs mt-3">
                <div class="flex items-center justify-between font-extrabold text-slate-800 dark:text-slate-200">
                  <span>Total Accrued to Date (Day 11/30)</span>
                  <span class="font-mono font-black text-sky-600 dark:text-sky-400 text-sm">${fmtINR(totalAccruedToDate)}</span>
                </div>
                <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] mt-1">
                  <span>Full Month In-Hand Liability</span>
                  <span class="font-mono font-medium text-emerald-600 dark:text-emerald-400">${fmtINR(totalNetMonthlyLiability)}</span>
                </div>
              </div>
            </div>"""

if old_mobile_cards_end in content:
    content = content.replace(old_mobile_cards_end, new_mobile_cards_end)
    print("✓ Added Mobile Accrued Liability Summary Card")

with open(PORTAL_PATH, "w", encoding="utf-8") as f:
    f.write(content)

print("SUCCESS: apply_step3_polish.py executed!")
