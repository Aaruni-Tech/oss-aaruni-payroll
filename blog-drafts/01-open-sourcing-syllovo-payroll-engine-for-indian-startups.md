---
title: "Why We Open-Sourced Syllovo Payroll Engine: Zero-Cost Attendance, Encrypted Salary Vaults & Zoho-Grade Payslips on Cloudflare Edge"
author: "Rupesh Kumar Tiwari (Founder, Syllovo & Strategic Advisor, Aaruni Tech)"
date: "2026-11-09"
tags: ["open-source", "cloudflare-workers", "payroll", "india-startups", "syllovo-oss", "pwa"]
status: "Ready for Syllovo Blog"
---

# Why We Built & Open-Sourced `@syllovo-oss/payroll-engine`

As founders building **Syllovo** and operating **Aaruni Tech** in India, we hit a wall that almost every 5-to-25 person startup faces:
1. **Google Forms & Excel are disconnected from payroll math**: Staff couldn't easily enter **Entry Time** and **Exit Time** on mobile, couldn't see their own monthly hours or accrued salary, and logging in with an alternate Gmail account broke spreadsheet VLOOKUPs.
2. **SaaS Payroll Free Tiers Lock You In**: Tools like Zoho Payroll are great for generating PDF payslips, but once trial periods end, custom earning/deduction rules, API triggers, and self-service HR letters (like Bank Loan Income Proof or Offer Letters) sit behind steep recurring tiers.
3. **Shared Office Machines Create Salary Privacy Risks**: In small teams where founder browser profiles are signed in on studio/office machines, keeping plain-text salary spreadsheets in Google Drive is a major privacy hazard.

## Our Open-Source Solution (`syllovo-oss`)

Rather than depending on proprietary SaaS or heavy VPS monoliths, we built and open-sourced three modular MIT packages under our **Syllovo Open-Source Commons**:
- **`@syllovo-oss/payroll-engine`**: Implements Indian calendar-day proration (`Monthly CTC ÷ Calendar Days`), mandatory paid Sunday rest days, 1:1 Sunday Comp-Off offsets, multi-email alias resolution, and an **AES-256 Encrypted Salary Vault** with default `₹ ••••••` screen-share masking.
- **`@syllovo-oss/pdf-payslip`**: Zero-dependency HTML/PDF payslip and HR document generator (Offer Letters, Bank Loan Income Proofs, Experience Certificates, and CA FY Business Loss Statements).
- **`@syllovo-oss/cf-webpush`**: Cloudflare Workers Cron scheduler that dispatches Web Push reminders every 30 minutes between **6:00 PM and 9:00 PM IST** *only* to employees who haven't logged today's timesheet yet—stopping automatically the second they submit.

By owning and forking our open-source dependencies, we pay **₹0/month** on Cloudflare Pages + D1 while giving back clean, battle-tested modules to the startup community.
