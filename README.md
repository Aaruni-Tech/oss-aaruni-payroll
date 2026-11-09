# Aaruni Tech — Mobile-First Timesheet, HR Docs & Encrypted Payroll PWA
*(Powered by `@syllovo-oss/payroll-engine`, `@syllovo-oss/pdf-payslip`, and `@syllovo-oss/cf-webpush`)*

## Overview
Built for **Aaruni Tech (GST Registered, Beeramguda, Telangana)** and powered by the **Syllovo Open-Source Commons**:
- **Zero Plain-Text Salary Leaks**: All compensation figures are stored in an encrypted payroll vault and default to **`₹ ••••••` (Salaries Hidden)** across the UI with a click-to-reveal `👁️` toggle (safe for shared office PCs & video recording).
- **Mobile-First Daily Entry/Exit Timesheet**: Employees enter **Entry Time** & **Exit Time**, auto-calculating daily working hours and live accrued salary so far.
- **Persistent 6:00 PM – 9:00 PM IST Push Reminders**: Cloudflare Workers Cron runs every 30 minutes between 6 PM and 9 PM IST (Mon–Sat) to notify only those active employees who haven't logged today's timesheet yet.
- **1st-of-Month 1-Tap UPI & 1-Click PDF Payslip Publisher**: Admin reviews monthly LOP & Sunday Comp-Off offsets on mobile, taps **"1-Tap Pay via UPI"** (or downloads the Axis Bank Bulk NEFT CSV), and clicks **"Payment Done — Publish All PDF Payslips"** to generate Zoho-layout PDF payslips for all staff.
- **Self-Service HR Document Center**: Instant PDF generation for **Official Offer Letters**, **Bank Loan Salary & Income Proof Certificates**, **Bonafide Letters**, **Digital ID Cards (`AAR-0001` to `AAR-0008`)**, and **Experience & Relieving Certificates** (including for inactive staff `AAR-0007 Sonali Roy`).
- **Chartered Accountant (CA) Tax Loss Tracker (FY 2025–26 & FY 2026–27)**: Tracks `₹0` revenue vs cumulative staff payroll and office operational expenses to generate an 8-year Income Tax Business Loss Carry-Forward statement.

## Deployment to Cloudflare Pages
```bash
npx wrangler pages deploy public --project-name aaruni-tech-payroll
```
