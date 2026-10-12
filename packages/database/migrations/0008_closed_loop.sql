-- NEXTA Closed Loop schema (RE:ACT SSOT)
-- Idempotent: only CREATE ... IF NOT EXISTS, safe to run repeatedly on local and remote D1.
-- Trước đây chạy tay bằng db:loop:*; nay là migration để DB mới (và test) luôn đủ bảng.
-- DB remote đã có các bảng này → IF NOT EXISTS khiến lần apply đầu không đổi gì.
-- Privacy by design: cases hold an alias only — never a full name, ID number or photo.

CREATE TABLE IF NOT EXISTS directory_resources (
  id TEXT PRIMARY KEY,
  organisation_name TEXT NOT NULL,
  service_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  target_group TEXT,
  eligibility_json TEXT,
  service_area_json TEXT,
  district TEXT NOT NULL,
  ward TEXT,
  address TEXT,
  latitude REAL,
  longitude REAL,
  phone TEXT,
  website TEXT,
  contact_method TEXT,
  availability_json TEXT,
  accepts_referral INTEGER NOT NULL DEFAULT 1,
  capacity_status TEXT NOT NULL DEFAULT 'UNKNOWN',
  slots_available INTEGER,
  capacity_checked_at TEXT,
  verification_status TEXT NOT NULL DEFAULT 'UNCONFIRMED',
  verified_at TEXT,
  verification_expires_at TEXT,
  verified_by TEXT,
  verified_by_name TEXT,
  verification_method TEXT,
  verification_source_url TEXT,
  verification_notes TEXT,
  partner_org_id TEXT,
  keywords TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS directory_resources_cat_idx ON directory_resources (category, district);
CREATE INDEX IF NOT EXISTS directory_resources_ver_idx ON directory_resources (verification_status);

CREATE TABLE IF NOT EXISTS directory_verifications (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES directory_resources(id),
  status_before TEXT,
  status_after TEXT NOT NULL,
  method TEXT NOT NULL,
  notes TEXT,
  source_url TEXT,
  capacity_status TEXT,
  slots_available INTEGER,
  verified_by TEXT NOT NULL,
  verified_by_name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS directory_verifications_res_idx ON directory_verifications (resource_id);

CREATE TABLE IF NOT EXISTS loop_cases (
  id TEXT PRIMARY KEY,
  alias TEXT NOT NULL,
  preferred_address TEXT,
  age INTEGER,
  is_minor INTEGER NOT NULL DEFAULT 0,
  target_group TEXT,
  has_identity_doc INTEGER,
  district TEXT,
  ward TEXT,
  need_category TEXT,
  priority_statement TEXT,
  observation TEXT,
  keywords_json TEXT,
  strengths_json TEXT,
  constraints_json TEXT,
  urgency TEXT NOT NULL DEFAULT 'normal',
  consent_json TEXT,
  consent_given_at TEXT,
  risk_decision TEXT,
  risk_json TEXT,
  risk_reviewed_by TEXT,
  risk_reviewed_at TEXT,
  stage TEXT NOT NULL DEFAULT 'CONSENT',
  status TEXT NOT NULL DEFAULT 'OPEN',
  navigator_id TEXT,
  navigator_name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TEXT
);
CREATE INDEX IF NOT EXISTS loop_cases_stage_idx ON loop_cases (stage, status);

CREATE TABLE IF NOT EXISTS loop_facts (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES loop_cases(id),
  field TEXT NOT NULL,
  value TEXT NOT NULL,
  source TEXT NOT NULL,
  recorded_by TEXT,
  recorded_by_name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS loop_facts_case_idx ON loop_facts (case_id);

CREATE TABLE IF NOT EXISTS loop_matches (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES loop_cases(id),
  result_json TEXT NOT NULL,
  candidate_count INTEGER NOT NULL DEFAULT 0,
  run_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS loop_matches_case_idx ON loop_matches (case_id);

CREATE TABLE IF NOT EXISTS loop_next_steps (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES loop_cases(id),
  resource_id TEXT REFERENCES directory_resources(id),
  action TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_role TEXT NOT NULL,
  place TEXT NOT NULL,
  due_at TEXT NOT NULL,
  verification_snapshot TEXT NOT NULL,
  verified_at_snapshot TEXT,
  status TEXT NOT NULL DEFAULT 'PROPOSED',
  proposed_by TEXT,
  confirmed_by TEXT,
  confirmed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS loop_next_steps_case_idx ON loop_next_steps (case_id);

CREATE TABLE IF NOT EXISTS loop_referrals (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  case_id TEXT NOT NULL REFERENCES loop_cases(id),
  next_step_id TEXT REFERENCES loop_next_steps(id),
  resource_id TEXT REFERENCES directory_resources(id),
  stage TEXT NOT NULL DEFAULT 'CREATED',
  decline_reason TEXT,
  outcome_note TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS loop_referrals_stage_idx ON loop_referrals (stage);
CREATE INDEX IF NOT EXISTS loop_referrals_case_idx ON loop_referrals (case_id);

CREATE TABLE IF NOT EXISTS loop_referral_events (
  id TEXT PRIMARY KEY,
  referral_id TEXT NOT NULL REFERENCES loop_referrals(id),
  case_id TEXT NOT NULL,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT,
  actor_role TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS loop_referral_events_ref_idx ON loop_referral_events (referral_id);

CREATE TABLE IF NOT EXISTS loop_follow_ups (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES loop_cases(id),
  referral_id TEXT REFERENCES loop_referrals(id),
  due_at TEXT NOT NULL,
  result TEXT,
  note TEXT,
  completed_by TEXT,
  completed_by_name TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS loop_follow_ups_due_idx ON loop_follow_ups (due_at, result);

CREATE TABLE IF NOT EXISTS loop_escalations (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES loop_cases(id),
  kind TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_by TEXT,
  resolved_by TEXT,
  resolution_note TEXT,
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS loop_escalations_status_idx ON loop_escalations (status);
