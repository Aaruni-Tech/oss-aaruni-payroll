> **Repository transition:** This repository currently contains the corporate site, Cloud platform, and staff portal. See [deployment boundaries](docs/deployment-boundaries.md) for isolated build targets and the staged migration. Public source is not evidence of live service availability.

# 🏢 Aaruni Tech — Open-Source Self-Service HR, Timesheet, Encrypted Payroll & Play Store Portal

<div align="center">
  <img src=".github/assets/aaruni_tech_banner.png" alt="Aaruni Tech Banner" width="100%" style="border-radius: 12px; margin-bottom: 12px;" />
  <br/>
  <img src=".github/assets/aaruni_square_logo.png" alt="Aaruni Tech Logo" width="90" style="border-radius: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);" />
  <br/>
  <h3>Next-Generation Employee-First HRMS, Live Accrued Salary Engine & Bank Dossier Generator</h3>
  <p><strong>Villa 257 Chaitanya Nagar Colony, Praneeth Pranav Knight Woods, Beeramguda, Telangana - 502319</strong></p>

  [![Cloudflare Pages](https://img.shields.io/badge/Live%20Portal-aaruni--payroll.pages.dev-2563EB?logo=cloudflare)](https://my.aarunitech.com)
  [![Android TWA](https://img.shields.io/badge/Google%20Play%20ID-com.aarunitech.payroll-34D399?logo=google-play)](twa-manifest.json)
  [![Flutter App](https://img.shields.io/badge/Flutter%20Mobile%20App-Aaruni--Tech%2Foss--horilla--hr--mobile-8B5CF6?logo=flutter)](https://github.com/Aaruni-Tech/oss-horilla-hr-mobile)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
</div>

---

## 🌟 Executive Overview
**Aaruni Tech (Aarunitech Private Limited)** is an open-source-first engineering organization based in Sangareddy / Hyderabad, Telangana. This repository houses the official public client, Progressive Web App (PWA), and Android Trusted Web Activity (TWA) portal for Aaruni Tech staff and administrators.

### Core Architecture & Open-Source Ecosystem
1. **`Aaruni-Tech/oss-aaruni-payroll`** (This Repo): Fast, responsive, staff-first Web & PWA Portal deployed globally on Cloudflare Pages, featuring zero-plain-text salary exposure, daily accrued salary engine, and self-service bank dossiers.
2. **`Aaruni-Tech/oss-horilla-hr-mobile`**: Full open-source Flutter mobile client for Android & iOS (supporting one-tap punch in/out, biometric unlock, and payslip downloads).
3. **`Aaruni-Tech/oss-horilla-hr`**: Python/Django backend HRMS fork with custom Axis Bank NEFT bulk payout generator, Zoho payslip seed data, and UPI deep-linking.

---

## ✨ Features

### 👤 For Employees / Staff Members
- **💰 Daily Accrued Salary Tracker**: Real-time live calculation of accrued take-home salary earned so far in the current month based on verified work hours and approved attendance.
- **⏰ Smart Timesheet Inactivity Reminder**: Automated banner alerting employees if a timesheet entry was missed for yesterday or the previous working day.
- **📅 Official 2026 & 2027 Holiday Calendars**: Instant in-app access to all 7 declared Telangana festival holidays (Sankranti, Maha Shivaratri, Holi, Ramzan, Ganesh Chaturthi, Dussehra, Diwali) with explicit confirmation that festival holidays are fully paid.
- **📄 1-Click Self-Service Document Downloads**:
  - **Historical & Current Payslips**: Detailed breakdown of Basic, HRA, Fixed Allowances, Sunday Comp-Offs, and Loan/Advance deductions.
  - **🏡 Home Loan Bank Submission Dossier**: Pre-built, bank-ready comprehensive dossier tailored for SBI, HDFC, ICICI, and Axis Bank home loan applications (includes Employment Verification, 3-Month Certified Salary Ledger, Form 16 Part A & B, and Official Letterhead Seal).
  - **📜 Official Offer & Appointment Letters**: Pre-filled with designation, CTC, standard shift, and terms of service.
  - **🎖️ Experience & Relieving Certificates**: Official verification of employment duration and conduct.
- **🔒 Zero Pre-Created Password Exposure**: High-security private password model where employees set and manage their own passwords with end-to-end encryption.

### 👑 For Administrators & Leadership
- **📊 Unified Salary & Deductions Roster**: Granular control over gross salary, LOP days, overtime bonus, loan advances, and final net payable amounts.
- **🏦 Axis Bank Bulk NEFT CSV Export**: Single-click export formatted specifically for corporate net banking uploads to Axis Bank.
- **⚡ 1-Tap UPI Deep Links & QR**: Instant settlement via UPI URI (`upi://pay?pa=...&am=...`) supporting BHIM, Google Pay, PhonePe, and Axis Mobile.
- **📢 Publish Payroll & Push Notification Engine**: One-click payroll publication that stamps the month, locks the payslips, and automatically dispatches high-priority notification messages to all active employees.

---

## 📲 Mobile App & Play Store Setup

### 1. Instant Mobile PWA (Zero App Store Wait)
Open **[https://my.aarunitech.com](https://my.aarunitech.com)** on any mobile browser:
- **Android Chrome**: Tap `⋮` (Menu) → **"Add to Home Screen"** / **"Install App"**.
- **iOS Safari**: Tap `Share ⬆️` → **"Add to Home Screen"**.
- Features full offline caching via `sw.js` and automated 6:00 PM – 9:00 PM IST push notifications.

### 2. Android Play Store (TWA)
Configured using Google's official Trusted Web Activity (`bubblewrap-cli`):
- **Package ID**: `com.aarunitech.payroll`
- **Manifest**: [`twa-manifest.json`](twa-manifest.json)
- **Digital Asset Links**: [`public/.well-known/assetlinks.json`](public/.well-known/assetlinks.json)

### 3. Flutter Open-Source Companion App
Clone and build the companion Flutter client:
```bash
git clone https://github.com/Aaruni-Tech/oss-horilla-hr-mobile.git
cd oss-horilla-hr-mobile
flutter pub get
flutter build apk --release
```

---

## 🛠️ Local Development & Deployment

### Run Locally
```bash
# Clone the repository
git clone https://github.com/Aaruni-Tech/oss-aaruni-payroll.git
cd oss-aaruni-payroll

# Start static preview server
npx serve public
```

### Deploy to Cloudflare Pages
```bash
# Authenticate with Cloudflare
npx wrangler login

# Deploy public folder to production
npx wrangler pages deploy public --project-name aaruni-payroll --branch master
```

---

## 🏛️ Company Information
- **Entity**: Aaruni Tech (Aarunitech Private Limited)
- **Address**: Villa 257 Chaitanya Nagar Colony, Praneeth Pranav Knight Woods, Beeramguda, Telangana - 502319
- **Corporate Account**: Axis Bank (Sangareddy / Hyderabad Branch)
- **Support**: `tech.aaruni@gmail.com` • `rupesh@fullstackmaster.net`
- **GitHub Organization**: [https://github.com/Aaruni-Tech](https://github.com/Aaruni-Tech)
