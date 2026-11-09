-- Aaruni Tech (Powered by Syllovo Payroll) — Cloudflare D1 SQLite Schema
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  zoho_id TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active', -- 'Active' | 'Inactive'
  shift_hours REAL NOT NULL DEFAULT 8.0,
  encrypted_monthly_ctc TEXT NOT NULL, -- Stored in AES-256 / Vault format, never exposed unmasked
  joining_date TEXT,
  relieving_date TEXT,
  dob TEXT,
  father_name TEXT,
  pan TEXT,
  aadhaar TEXT,
  mobile TEXT,
  email TEXT,
  alternate_emails TEXT, -- JSON array of alternate emails (e.g. kjhanvi88@gmail.com, nandinichukka72@gmail.com)
  address TEXT,
  bank_name TEXT,
  account_holder TEXT,
  bank_account TEXT,
  ifsc TEXT,
  upi_id TEXT,
  track_timesheet INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS timesheets (
  id TEXT PRIMARY KEY,
  emp_id TEXT NOT NULL,
  emp_name TEXT NOT NULL,
  email TEXT,
  date TEXT NOT NULL,
  month TEXT NOT NULL,
  entry_time TEXT NOT NULL,
  exit_time TEXT NOT NULL,
  hours REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Worked',
  summary TEXT,
  task_link TEXT,
  source TEXT DEFAULT 'Mobile PWA',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loans_advances (
  id TEXT PRIMARY KEY,
  emp_id TEXT NOT NULL,
  emp_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Personal Advance',
  total_amount REAL NOT NULL,
  monthly_deduction REAL NOT NULL,
  remaining_balance REAL NOT NULL,
  start_month TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS payslips (
  id TEXT PRIMARY KEY,
  emp_id TEXT NOT NULL,
  year_month TEXT NOT NULL,
  period_label TEXT NOT NULL,
  pay_date TEXT NOT NULL,
  paid_days REAL NOT NULL,
  lop_days REAL NOT NULL,
  basic REAL NOT NULL,
  fixed_allowance REAL NOT NULL,
  bonus REAL NOT NULL DEFAULT 0,
  gross_earnings REAL NOT NULL,
  deductions REAL NOT NULL DEFAULT 0,
  net_pay REAL NOT NULL,
  amount_in_words TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'Paid',
  utr_reference TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  recipient_id TEXT NOT NULL, -- 'ALL' or specific emp_id
  recipient_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tax_loss_ledger (
  id TEXT PRIMARY KEY,
  fiscal_year TEXT NOT NULL, -- 'FY 2025-26' | 'FY 2026-27'
  month TEXT NOT NULL,
  revenue REAL NOT NULL DEFAULT 0,
  payroll_expense REAL NOT NULL DEFAULT 0,
  ops_expense REAL NOT NULL DEFAULT 0,
  notes TEXT
);
