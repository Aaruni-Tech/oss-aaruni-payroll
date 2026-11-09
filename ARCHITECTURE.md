# Aaruni Tech HR, Attendance & Payroll Portal — Architecture & Open-Source Stack

**Company**: Aaruni Tech (`Aarunitech Private Limited`)  
**Registered Office**: Villa 257, Praneeth Pranav Knight Woods, Beeramguda, Telangana 502319, India  
**Official HR Notification Sender**: `hr@fullstackmaster.net` (Executive: `rupesh@fullstackmaster.net`)

---

## 1. Open-Source Foundation & Design Philosophy

Rather than reinventing HR/Payroll workflows from scratch, the **Aaruni Tech HR & Payroll Portal** adopts the battle-tested data models and self-service workflows of:
- **Frappe HRMS (MIT Open Source)** — Employee lifecycle, Attendance/Timesheet check-in/out, Salary Structure (`Basic 50% + Fixed Allowance 50%`), Employee Advances/Loans ledger, and Self-Service HR Letter generation.
- **Zoho Payroll India** — 5-Tab Employee Profile (`Overview`, `Salary Details`, `Investments`, `Payslips & Forms`, `Loans`), Indian Number-to-Words net pay formatting, masked bank account numbers (`XXXX4004` with `Show A/C No`), and default masked salary figures (`₹ ••••••`).
- **Aaruni Tech Monochrome Design System (`/public/aaruni-brand.css`)** — High-contrast Black & White UI with a 3-way theme switcher (`☀️ Day` | `🌙 Night` | `💻 Auto`).

### Forked & Owned Internal Modules
All open-source payroll, PDF generation, QR code, and Cloudflare Worker push/email scheduling logic is owned directly inside this repository so Aaruni Tech has zero external SaaS lock-in:
1. **Payroll & Proration Engine**: Indian calendar-day proration, automatic Paid Sunday rest days, 1:1 Sunday extra-hours Comp-Off offset, and Pending vs. Paid Personal Advance recovery.
2. **Client-Side PDF Document Engine**: Instant print/PDF rendering for Zoho-layout Monthly Payslips, Offer Letters, Salary Certificates (Bank Loan/Visa proof), Digital Employee ID Cards, and Experience Certificates.
3. **Zero-Salary Email Guard (`hr@fullstackmaster.net`)**: Strips any `₹` or compensation figures from outbound email notifications so shared office computers never leak staff salaries.
4. **Android Google Play TWA Packaging**: Pre-configured `twa-manifest.json` and `.well-known/assetlinks.json` (`com.aarunitech.payroll`).
