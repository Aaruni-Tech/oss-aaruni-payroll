-- Dedicated corporate database only. Do not apply to payroll.
CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  sender_email TEXT NOT NULL,
  org_name TEXT NOT NULL DEFAULT '',
  offering TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);
