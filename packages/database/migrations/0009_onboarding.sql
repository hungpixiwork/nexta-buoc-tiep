-- NEXTA Onboarding & Approval (partners, volunteers, host organisations, observers)
-- Idempotent: CREATE ... IF NOT EXISTS only — an toàn khi DB remote đã có bảng (trước đây chạy tay bằng db:loop:*).
-- Identity lives in the existing `users` table; approval state lives here.

CREATE TABLE IF NOT EXISTS email_otps (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'signin',
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS email_otps_email_idx ON email_otps (email, created_at);

CREATE TABLE IF NOT EXISTS nx_accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'applicant',
  org_id TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nx_orgs (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  short_name TEXT,
  legal_form TEXT,
  registration_ref TEXT,
  district TEXT,
  address TEXT,
  website TEXT,
  public_source_url TEXT,
  representative_name TEXT,
  representative_title TEXT,
  dpo_contact TEXT,
  safeguarding_contact TEXT,
  host_org_id TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  approved_by TEXT,
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  kind TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_account_id TEXT,
  host_org_id TEXT,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SUBMITTED',
  screening_json TEXT,
  score INTEGER,
  recommendation TEXT,
  reviewer_id TEXT,
  reviewer_name TEXT,
  decision_note TEXT,
  decided_at TEXT,
  sla_due_at TEXT,
  created_org_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS applications_status_idx ON applications (kind, status);
CREATE INDEX IF NOT EXISTS applications_email_idx ON applications (applicant_email);

CREATE TABLE IF NOT EXISTS application_events (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS application_events_app_idx ON application_events (application_id);

CREATE TABLE IF NOT EXISTS volunteer_profiles (
  account_id TEXT PRIMARY KEY,
  host_org_id TEXT,
  district TEXT,
  availability_json TEXT,
  status TEXT NOT NULL DEFAULT 'TRAINING',
  activated_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_completions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  module_code TEXT NOT NULL,
  module_version TEXT NOT NULL,
  score INTEGER NOT NULL,
  passed INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS training_completions_acc_idx ON training_completions (account_id, module_code);

CREATE TABLE IF NOT EXISTS agreement_acceptances (
  id TEXT PRIMARY KEY,
  agreement_code TEXT NOT NULL,
  agreement_version TEXT NOT NULL,
  agreement_sha256 TEXT NOT NULL,
  email TEXT NOT NULL,
  account_id TEXT,
  application_id TEXT,
  org_name TEXT,
  signer_name TEXT,
  signer_title TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  accepted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS agreement_acceptances_email_idx ON agreement_acceptances (email);

CREATE TABLE IF NOT EXISTS data_subject_requests (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  email TEXT,
  case_alias TEXT,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  handled_by TEXT,
  resolution TEXT,
  due_at TEXT NOT NULL,
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cost_ledger (
  id TEXT PRIMARY KEY,
  month TEXT NOT NULL,
  direction TEXT NOT NULL,
  category TEXT NOT NULL,
  amount_vnd INTEGER NOT NULL,
  counterparty TEXT,
  evidence_ref TEXT,
  note TEXT,
  recorded_by TEXT,
  recorded_by_name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS cost_ledger_month_idx ON cost_ledger (month);

-- Loop scoping: which host org a journey belongs to (NULL = platform demo data)
CREATE TABLE IF NOT EXISTS loop_case_scope (
  case_id TEXT PRIMARY KEY,
  host_org_id TEXT,
  navigator_account_id TEXT
);
