#!/usr/bin/env python3
import re

PORTAL_PATH = "/Users/rupesh/.gemini/antigravity/scratch/aaruni-payroll-repo/public/portal.html"

with open(PORTAL_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# =========================================================================
# 1. REMOVE ALL ZOHO MENTIONS ACROSS PORTAL.HTML
# =========================================================================
content = content.replace("zoho-layout-container", "at-admin-layout")
content = content.replace("zoho-sidebar-brand", "at-sidebar-brand")
content = content.replace("zoho-sidebar-nav", "at-sidebar-nav")
content = content.replace("zoho-sidebar", "at-sidebar")
content = content.replace("zoho-nav-btn", "at-nav-btn")
content = content.replace("zoho-workspace", "at-workspace")
content = content.replace("zoho-top-search", "at-top-search")
content = content.replace("zoho-search-input", "at-search-input")
content = content.replace("zoho-sub-nav", "at-sub-nav")
content = content.replace("zoho-sub-tab", "at-sub-tab")
content = content.replace("zoho-peach-banner", "at-peach-banner")
content = content.replace("zoho-payrun-card", "at-payrun-card")
content = content.replace("zoho-orange-btn", "at-orange-btn")
content = content.replace("zohoSearchInput", "atSearchInput")

# Comments and strings
content = content.replace("Zoho crisp white default", "Aaruni minimalist white default")
content = content.replace("ZOHO CLEAN HIGH CONTRAST", "AARUNI HIGH CONTRAST")
content = content.replace("ZOHO CRISP WHITE THEME", "AARUNI CRISP WHITE THEME")
content = content.replace("ZOHO-STYLE SUB NAVIGATION", "AARUNI SUB NAVIGATION")
content = content.replace("ZOHO PEACH DIRECT PAYOUT ANNOUNCEMENT BANNER", "AARUNI DIRECT PAYOUT ANNOUNCEMENT BANNER")
content = content.replace("ZOHO HERO PAY RUN CARD", "AARUNI HERO PAY RUN CARD")
content = content.replace("ZOHO PAYROLL THEME & PERSISTENT NAVY SIDEBAR", "AARUNI ENTERPRISE HR MINIMALIST SIDEBAR")
content = content.replace("Aaruni Directory ID", "Aaruni Employee Directory ID")

# =========================================================================
# 2. STANDARDIZE MODAL CLOSE BUTTONS (REPLACE MUDDY / DARK CLOSE BUTTONS)
# =========================================================================
# docModal container: make it clean white in light theme
old_doc_modal = """  <!-- PRINT / PDF DOCUMENT MODAL (Payslips, Offer Letters, Bank Loan Proofs, Experience Certs, CA Tax Report) -->
  <div id="docModal" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-2 md:p-6 overflow-y-auto">
    <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl my-4 md:my-auto">
      <div class="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 no-print">
        <div class="flex items-center gap-2">
          <span class="text-base">📄</span>
          <h3 id="docModalTitle" class="text-sm font-bold text-white">Official Aaruni Tech Document</h3>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.print()" class="brand-grad text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow hover:opacity-95">
            🖨️ Print / Save PDF
          </button>
          <button onclick="closeDocModal()" class="bg-slate-700 text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-slate-600">
            Close
          </button>
        </div>
      </div>"""

new_doc_modal = """  <!-- PRINT / PDF DOCUMENT MODAL (Payslips, Offer Letters, Bank Loan Proofs, Experience Certs, CA Tax Report) -->
  <div id="docModal" class="hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-2 md:p-6 overflow-y-auto">
    <div class="glass-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl my-4 md:my-auto">
      <div class="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 no-print">
        <div class="flex items-center gap-2">
          <span class="text-base">📄</span>
          <h3 id="docModalTitle" class="text-sm font-bold text-slate-900 dark:text-white">Official Aaruni Tech Document</h3>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.print()" class="brand-grad text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow hover:opacity-95">
            🖨️ Print / Save PDF
          </button>
          <button onclick="closeDocModal()" class="at-btn-close">
            Close
          </button>
        </div>
      </div>"""

if old_doc_modal in content:
    content = content.replace(old_doc_modal, new_doc_modal)

# Replace other dark close buttons with at-btn-close
content = re.sub(
    r'<button onclick="closeDocModal\(\)"[^>]*background:#334155[^>]*>Cancel</button>',
    r'<button onclick="closeDocModal()" class="at-btn-close">Cancel</button>',
    content
)
content = re.sub(
    r'<button onclick="closeDocModal\(\)"[^>]*background:#1e293b[^>]*>Cancel</button>',
    r'<button onclick="closeDocModal()" class="at-btn-close">Cancel</button>',
    content
)
content = re.sub(
    r'<button onclick="closeDocModal\(\)" class="bg-slate-700 text-slate-200[^>]*>Close</button>',
    r'<button onclick="closeDocModal()" class="at-btn-close">Close</button>',
    content
)

# =========================================================================
# 3. FIX TOP YELLOW REMINDER CARD (HIGH CONTRAST & CLEAN BUTTON)
# =========================================================================
old_reminder_card = """          <!-- 1-DAY BEFORE PAYMENT REMINDER WIDGET FOR ADMIN -->
          <div class="glass-card rounded-2xl p-4 mb-4 border-2 border-amber-500/80 bg-amber-950/20 flex items-center justify-between gap-3 flex-wrap">
            <div class="flex items-center gap-3">
              <span class="text-2xl p-2 rounded-xl bg-amber-500/20 border border-amber-500/40">⏰</span>
              <div>
                <div class="text-xs font-black uppercase tracking-wider text-amber-300">Admin Disbursement Reminder &bull; November 2026 Payroll</div>
                <div class="text-xs text-slate-300 mt-0.5">
                  Cutoff: <strong>30 Nov 2026</strong> &bull; Grace Day: <strong>01 Dec 2026</strong> &bull; Target Disbursement: <strong>04–05 Dec 2026</strong> (or early if all timesheets verified).
                </div>
                <div class="text-[11px] text-amber-200 mt-0.5">
                  Maintain <strong>₹${totalNetMonthlyLiability.toLocaleString('en-IN')}</strong> in Axis Bank Salary Account (A/C: xxxx3409).
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="openPolicyModal('SALARY_ATTENDANCE')" class="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer">
                📜 View Policy Timeline
              </button>
            </div>
          </div>"""

new_reminder_card = """          <!-- 1-DAY BEFORE PAYMENT REMINDER WIDGET FOR ADMIN (HIGH-CONTRAST CLEAN THEME) -->
          <div class="at-reminder-amber mb-4 flex items-center justify-between gap-3 flex-wrap">
            <div class="flex items-center gap-3">
              <span class="text-2xl p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 shrink-0">⏰</span>
              <div>
                <div class="reminder-title text-xs font-black uppercase tracking-wider">Admin Disbursement Reminder &bull; November 2026 Payroll</div>
                <div class="reminder-body text-xs mt-1">
                  Cutoff: <strong>30 Nov 2026</strong> &bull; Grace Day: <strong>01 Dec 2026</strong> &bull; Target Disbursement: <strong>04–05 Dec 2026</strong> (or early if all timesheets verified).
                </div>
                <div class="reminder-highlight text-xs mt-1">
                  Maintain <strong>₹${totalNetMonthlyLiability.toLocaleString('en-IN')}</strong> in Axis Bank Salary Account (A/C: xxxx3409).
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button onclick="openPolicyModal('SALARY_ATTENDANCE')" class="reminder-btn text-xs font-bold cursor-pointer">
                📜 View Policy Timeline
              </button>
            </div>
          </div>"""

if old_reminder_card in content:
    content = content.replace(old_reminder_card, new_reminder_card)

# =========================================================================
# 4. EMPLOYEES DIRECTORY TABLE: TYPOGRAPHY ADJUSTMENTS
# Net In-Hand less bold, Accrued to Date more bold, and show Total Accrued
# =========================================================================
old_table_headers = """                    <th class="py-2.5 px-2 text-right">Accrued to Date</th>
                    <th class="py-2.5 px-2 text-right font-black text-emerald-400">Net In-Hand Payable</th>"""

new_table_headers = """                    <th class="py-2.5 px-2 text-right font-black text-sky-600 dark:text-sky-400">Accrued to Date</th>
                    <th class="py-2.5 px-2 text-right font-medium text-slate-500 dark:text-slate-400">Net In-Hand Payable</th>"""

if old_table_headers in content:
    content = content.replace(old_table_headers, new_table_headers)

old_table_cells = """                      <td class="py-3 px-2 text-right font-mono font-semibold text-sky-300">
                        ${(!isFounder && !isInactive) ? fmtINR(payroll.accruedSalarySoFar) : '₹0'}
                      </td>
                      <td class="py-3 px-2 text-right">
                        ${(!isFounder && !isInactive) ? `
                          <div class="font-mono font-black text-emerald-400 text-sm">${fmtINR(payroll.netPay)}</div>
                          <div class="text-[10px] text-slate-400">${payroll.loanCut > 0 ? `-${fmtINR(payroll.loanCut)} advance recovery` : 'Full In-Hand'}</div>
                        ` : isFounder ? '<span class="text-amber-400 font-bold text-xs">₹0.00 (Deferred)</span>' : '<span class="text-slate-500 text-xs">₹0.00 (Relieved)</span>'}
                      </td>"""

new_table_cells = """                      <td class="py-3 px-2 text-right font-mono font-black text-sky-600 dark:text-sky-300 text-sm">
                        ${(!isFounder && !isInactive) ? fmtINR(payroll.accruedSalarySoFar) : '₹0'}
                      </td>
                      <td class="py-3 px-2 text-right">
                        ${(!isFounder && !isInactive) ? `
                          <div class="font-mono font-medium text-emerald-600 dark:text-emerald-400 text-xs">${fmtINR(payroll.netPay)}</div>
                          <div class="text-[10px] text-slate-400">${payroll.loanCut > 0 ? `-${fmtINR(payroll.loanCut)} advance recovery` : 'Full In-Hand'}</div>
                        ` : isFounder ? '<span class="text-amber-400 font-medium text-xs">₹0.00 (Deferred)</span>' : '<span class="text-slate-500 text-xs">₹0.00 (Relieved)</span>'}
                      </td>"""

if old_table_cells in content:
    content = content.replace(old_table_cells, new_table_cells)

# Add Totals Row at the bottom of the table
old_tbody_end = """                  </tbody>
              </table>
            </div>"""

new_tbody_end = """                  </tbody>
                <tfoot>
                  <tr class="border-t-2 border-slate-300 dark:border-slate-700 font-bold bg-slate-50 dark:bg-slate-900/80 text-xs">
                    <td colspan="3" class="py-3 px-2 font-bold text-slate-800 dark:text-slate-200">
                      TOTAL ACTIVE WORKING STAFF (${filteredEmployees.filter(e => e.monthlyCtc > 0 && e.status === 'Active').length} TEAM MEMBERS)
                    </td>
                    <td class="py-3 px-2 text-right font-bold text-slate-700 dark:text-slate-300">
                      ${fmtINR(totalMonthlyCtc)}
                    </td>
                    <td class="py-3 px-2 text-center text-slate-500 font-semibold text-[11px]">
                      Day 11/30
                    </td>
                    <td class="py-3 px-2 text-right font-black text-sky-600 dark:text-sky-300 text-sm">
                      <span class="inline-block px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-600 shadow-sm">
                        ${fmtINR(totalAccruedLiability)}
                      </span>
                    </td>
                    <td class="py-3 px-2 text-right font-medium text-emerald-600 dark:text-emerald-400 text-xs">
                      ${fmtINR(totalNetMonthlyLiability)}
                    </td>
                    <td colspan="2" class="py-3 px-2 text-center text-xs text-slate-600 dark:text-slate-300">
                      ${totalUnpaidStaff === 0 ? '🟢 All Staff Paid' : `⏳ ${totalUnpaidStaff} Disbursements Pending`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>"""

if old_tbody_end in content:
    content = content.replace(old_tbody_end, new_tbody_end)

# In Employees Directory Card Header, also add prominent Total Accrued Pill
old_emp_header = """            <!-- DIRECTORY HEADER & QUICK CONTROLS -->
            <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-bold" style="color:var(--at-text);">Employees Directory</h2>
                  <span class="text-xs px-2 py-0.5 rounded-full font-bold bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/40">
                    ${activeStaffCount} Staff
                  </span>
                </div>
                <p class="text-xs text-slate-400 mt-0.5">Showing actual In-hand payable calculations for the ${activeStaffCount} active working team members</p>
              </div>"""

new_emp_header = """            <!-- DIRECTORY HEADER & QUICK CONTROLS -->
            <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h2 class="text-base font-bold" style="color:var(--at-text);">Employees Directory</h2>
                  <span class="text-xs px-2 py-0.5 rounded-full font-bold bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/40">
                    ${activeStaffCount} Staff
                  </span>
                  <span class="text-xs px-2.5 py-0.5 rounded-full font-black bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-600">
                    ⏱️ Total Accrued to Date: ₹${totalAccruedLiability.toLocaleString('en-IN')}
                  </span>
                </div>
                <p class="text-xs text-slate-400 mt-0.5">Showing actual In-hand payable calculations for the ${activeStaffCount} active working team members</p>
              </div>"""

if old_emp_header in content:
    content = content.replace(old_emp_header, new_emp_header)

with open(PORTAL_PATH, "w", encoding="utf-8") as f:
    f.write(content)

print("SUCCESS: portal.html step 1 (zoho removal, close buttons, reminder card, table totals) applied successfully!")
