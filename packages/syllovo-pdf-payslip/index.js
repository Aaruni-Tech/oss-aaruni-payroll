/**
 * @syllovo-oss/pdf-payslip (MIT License)
 * Official Aaruni Tech & Syllovo HR Document & Zoho-Style Payslip Generator.
 * Generates print-ready PDFs for:
 * 1. Monthly Payslip (exact replica of Payslip_004_Oct_2026.pdf)
 * 2. Official Offer / Appointment Letter
 * 3. Bank Loan Salary & Income Proof Certificate
 * 4. Experience & Relieving Certificate (for active/inactive staff)
 * 5. Chartered Accountant (CA) FY 2025-26 & 2026-27 Business Loss & Payroll Tax Binder
 */

export const AARUNI_COMPANY_HEADER = {
  legalName: "Aaruni Tech",
  corporateName: "Aarunitech Private Limited",
  tagline: "learn build grow",
  address: "Villa 257 Praneeth Pranav Knight Woods Beeramguda Telangana 502319 India",
  phone: "+91 7842097003",
  email: "tech.aaruni@gmail.com",
  proprietor: "Nisha Tiwari (AAR-0001)",
  strategicAdvisor: "Rupesh Kumar Tiwari (AAR-0002)",
};

export function renderZohoStylePayslipHTML(payslip, employee) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Payslip_${employee.zohoId || employee.id}_${payslip.periodLabel.replace(/\s+/g, "_")}</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1e293b; margin: 0; padding: 36px; background: #fff; }
    .sheet { max-width: 780px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #cbd5e1; padding-bottom: 20px; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .logo-triangle { width: 46px; height: 42px; position: relative; }
    .co-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; }
    .co-addr { font-size: 12px; color: #64748b; max-width: 340px; line-height: 1.4; margin-top: 4px; }
    .period-box { text-align: right; }
    .period-label { font-size: 12px; color: #64748b; }
    .period-val { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px; }
    .summary-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 24px; margin-top: 24px; padding-bottom: 20px; border-bottom: 1px dashed #cbd5e1; }
    .kv-row { display: grid; grid-template-columns: 140px 16px 1fr; font-size: 13px; padding: 5px 0; }
    .kv-label { color: #64748b; }
    .kv-val { font-weight: 600; color: #0f172a; }
    .net-card { border: 1px solid #bbf7d0; background: #f0fdf4; border-radius: 10px; padding: 18px; }
    .net-amount { font-size: 26px; font-weight: 800; color: #14532d; border-left: 4px solid #22c55e; padding-left: 12px; }
    .net-sub { font-size: 12px; color: #16a34a; padding-left: 16px; margin-top: 2px; }
    .table-wrap { margin-top: 24px; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f8fafc; color: #475569; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; padding: 12px 14px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; }
    .num { text-align: right; font-weight: 600; }
    .total-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 22px; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
    .total-left { padding: 14px 18px; }
    .total-right { background: #f0fdf4; padding: 16px 24px; font-size: 18px; font-weight: 800; color: #0f172a; }
    .words { text-align: right; font-size: 12px; color: #475569; margin-top: 14px; padding-bottom: 18px; border-bottom: 1px solid #e2e8f0; }
    .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="brand">
        <svg width="48" height="44" viewBox="0 0 60 52" fill="none">
          <path d="M8 46L26 8H35L17 46H8Z" fill="#111827"/>
          <path d="M27 8L46 46H36L22 18L27 8Z" fill="#EA580C"/>
        </svg>
        <div>
          <h1 class="co-title">Aaruni Tech</h1>
          <div class="co-addr">${AARUNI_COMPANY_HEADER.address}</div>
        </div>
      </div>
      <div class="period-box">
        <div class="period-label">Payslip For the Month</div>
        <div class="period-val">${payslip.periodLabel}</div>
      </div>
    </div>

    <div class="summary-grid">
      <div>
        <div style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.06em;margin-bottom:8px;">EMPLOYEE SUMMARY</div>
        <div class="kv-row"><span class="kv-label">Employee Name</span><span>:</span><span class="kv-val">${employee.name}</span></div>
        <div class="kv-row"><span class="kv-label">Designation</span><span>:</span><span class="kv-val">${employee.role}</span></div>
        <div class="kv-row"><span class="kv-label">Employee ID</span><span>:</span><span class="kv-val">${employee.id} (${employee.zohoId || employee.id})</span></div>
        <div class="kv-row"><span class="kv-label">Date of Joining</span><span>:</span><span class="kv-val">${employee.joiningDate}</span></div>
        <div class="kv-row"><span class="kv-label">Pay Period</span><span>:</span><span class="kv-val">${payslip.periodLabel}</span></div>
        <div class="kv-row"><span class="kv-label">Pay Date</span><span>:</span><span class="kv-val">${payslip.payDate}</span></div>
      </div>
      <div class="net-card">
        <div class="net-amount">₹${Number(payslip.netPay).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        <div class="net-sub">Total Net Pay</div>
        <div style="border-top:1px dashed #bbf7d0;margin:14px 0 10px;"></div>
        <div class="kv-row"><span class="kv-label">Paid Days</span><span>:</span><span class="kv-val">${payslip.paidDays}</span></div>
        <div class="kv-row"><span class="kv-label">LOP Days</span><span>:</span><span class="kv-val">${payslip.lopDays}</span></div>
      </div>
    </div>

    <div style="padding:12px 0;border-bottom:1px dashed #cbd5e1;font-size:13px;">
      <span style="color:#64748b;display:inline-block;width:140px;">Bank Account No</span> : <strong>${employee.bankAccount || "On File"}</strong> (${employee.bankName || "Bank Transfer"} • IFSC: ${employee.ifsc || "N/A"})
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>EARNINGS</th>
            <th class="num">AMOUNT</th>
            <th class="num">YTD</th>
            <th>DEDUCTIONS</th>
            <th class="num">AMOUNT</th>
            <th class="num">YTD</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Basic</td>
            <td class="num">₹${Number(payslip.basic).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td class="num">₹${Number(payslip.basic).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td>Personal Advance / Loan</td>
            <td class="num">₹${Number(payslip.deductions).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td class="num">₹${Number(payslip.deductions).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td>Fixed Allowance</td>
            <td class="num">₹${Number(payslip.fixedAllowance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td class="num">₹${Number(payslip.fixedAllowance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td>LOP Deduction (${payslip.lopDays}d)</td>
            <td class="num">₹${Number(payslip.lopDeduction || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td class="num">₹${Number(payslip.lopDeduction || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td>Bonus / Comp-Off</td>
            <td class="num">₹${Number(payslip.bonus || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td class="num">₹${Number(payslip.bonus || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td></td>
            <td class="num"></td>
            <td class="num"></td>
          </tr>
          <tr style="background:#f8fafc;font-weight:700;">
            <td>Gross Earnings</td>
            <td class="num">₹${Number(payslip.grossEarnings).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td></td>
            <td>Total Deductions</td>
            <td class="num">₹${Number(payslip.deductions).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="total-bar">
      <div class="total-left">
        <div style="font-weight:800;font-size:13px;">TOTAL NET PAYABLE</div>
        <div style="font-size:12px;color:#64748b;">Gross Earnings - Total Deductions</div>
      </div>
      <div class="total-right">₹${Number(payslip.netPay).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
    </div>

    <div class="words">Amount In Words : <strong>${payslip.amountInWords}</strong></div>
    <div class="footer">-- This is a system-generated document issued by Aaruni Tech (Powered by Syllovo Payroll). --</div>
  </div>
</body>
</html>`;
}
