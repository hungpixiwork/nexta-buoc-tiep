-- =================================================================
-- Migration 0007: Campaign Infrastructure (NEXTA RE:ACT Top 20)
--
-- Adds 11 tables for Campaign Hub, Mission Flow, Signal Detection,
-- Campaign Autopilot, Follow-up Chain, and Reverse Learning.
-- =================================================================

-- CAMPAIGNS — Core campaign entity
CREATE TABLE IF NOT EXISTS `campaigns` (
  `id`              TEXT PRIMARY KEY NOT NULL,
  `organization_id` TEXT NOT NULL,
  `created_by`      TEXT NOT NULL,
  `title`           TEXT NOT NULL,
  `description`     TEXT,
  `category`        TEXT NOT NULL,
  `district`        TEXT NOT NULL,
  `ward`            TEXT,
  `address`         TEXT,
  `latitude`        REAL,
  `longitude`       REAL,
  `starts_at`       TEXT NOT NULL,
  `ends_at`         TEXT,
  `duration_minutes` INTEGER DEFAULT 120,
  `total_slots`     INTEGER DEFAULT 20,
  `filled_slots`    INTEGER DEFAULT 0,
  `min_navigators`  INTEGER DEFAULT 1,
  `status`          TEXT DEFAULT 'DRAFT',
  `source`          TEXT DEFAULT 'MANUAL',
  `signal_id`       TEXT,
  `template_id`     TEXT,
  `required_skills` TEXT,
  `eligibility_json` TEXT,
  `created_at`      TEXT DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);

-- CAMPAIGN_SLOTS — Individual participation slots
CREATE TABLE IF NOT EXISTS `campaign_slots` (
  `id`              TEXT PRIMARY KEY NOT NULL,
  `campaign_id`     TEXT NOT NULL,
  `user_id`         TEXT,
  `role_in_campaign` TEXT DEFAULT 'NAVIGATOR',
  `status`          TEXT DEFAULT 'AVAILABLE',
  `reserved_at`     TEXT,
  `confirmed_at`    TEXT,
  `completed_at`    TEXT,
  `cancelled_at`    TEXT,
  `created_at`      TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

-- CAMPAIGN_PARTICIPANTS — Beneficiaries linked to campaign
CREATE TABLE IF NOT EXISTS `campaign_participants` (
  `id`                  TEXT PRIMARY KEY NOT NULL,
  `campaign_id`         TEXT NOT NULL,
  `beneficiary_alias`   TEXT NOT NULL,
  `referred_by`         TEXT,
  `need_id`             TEXT,
  `consent_given`       INTEGER DEFAULT 0,
  `status`              TEXT DEFAULT 'INVITED',
  `outcome_status`      TEXT,
  `outcome_notes`       TEXT,
  `outcome_verified_by` TEXT,
  `outcome_verified_at` TEXT,
  `created_at`          TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`),
  FOREIGN KEY (`referred_by`) REFERENCES `users`(`id`),
  FOREIGN KEY (`outcome_verified_by`) REFERENCES `users`(`id`)
);

-- MISSIONS — Atomic tasks within a campaign
CREATE TABLE IF NOT EXISTS `missions` (
  `id`              TEXT PRIMARY KEY NOT NULL,
  `campaign_id`     TEXT NOT NULL,
  `slot_id`         TEXT,
  `navigator_id`    TEXT NOT NULL,
  `title`           TEXT NOT NULL,
  `description`     TEXT,
  `duration_minutes` INTEGER DEFAULT 60,
  `status`          TEXT DEFAULT 'ASSIGNED',
  `checked_in_at`   TEXT,
  `evidence_url`    TEXT,
  `evidence_type`   TEXT,
  `evidence_notes`  TEXT,
  `verified_by`     TEXT,
  `verified_at`     TEXT,
  `completed_at`    TEXT,
  `created_at`      TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`),
  FOREIGN KEY (`slot_id`) REFERENCES `campaign_slots`(`id`),
  FOREIGN KEY (`navigator_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`)
);

-- MISSION_CHECKINS — QR check-in records
CREATE TABLE IF NOT EXISTS `mission_checkins` (
  `id`            TEXT PRIMARY KEY NOT NULL,
  `mission_id`    TEXT NOT NULL,
  `navigator_id`  TEXT NOT NULL,
  `qr_code`       TEXT,
  `latitude`      REAL,
  `longitude`     REAL,
  `checked_in_at` TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`),
  FOREIGN KEY (`navigator_id`) REFERENCES `users`(`id`)
);

-- COMMUNITY_SIGNALS — Aggregated need patterns
CREATE TABLE IF NOT EXISTS `community_signals` (
  `id`                      TEXT PRIMARY KEY NOT NULL,
  `category`                TEXT NOT NULL,
  `district`                TEXT NOT NULL,
  `ward`                    TEXT,
  `need_count`              INTEGER DEFAULT 0,
  `unresolved_count`        INTEGER DEFAULT 0,
  `available_navigators`    INTEGER DEFAULT 0,
  `detection_window_days`   INTEGER DEFAULT 14,
  `status`                  TEXT DEFAULT 'DETECTED',
  `campaign_id`             TEXT,
  `summary`                 TEXT,
  `detected_at`             TEXT DEFAULT CURRENT_TIMESTAMP,
  `reviewed_by`             TEXT,
  `reviewed_at`             TEXT,
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`),
  FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`)
);

-- COMMUNITY_SIGNAL_NEEDS — Needs linked to a signal cluster
CREATE TABLE IF NOT EXISTS `community_signal_needs` (
  `id`          TEXT PRIMARY KEY NOT NULL,
  `signal_id`   TEXT NOT NULL,
  `case_id`     TEXT NOT NULL,
  `created_at`  TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`signal_id`) REFERENCES `community_signals`(`id`)
);

-- CAMPAIGN_MATCHES — Autopilot match recommendations
CREATE TABLE IF NOT EXISTS `campaign_matches` (
  `id`              TEXT PRIMARY KEY NOT NULL,
  `campaign_id`     TEXT NOT NULL,
  `user_id`         TEXT NOT NULL,
  `match_score`     INTEGER DEFAULT 0,
  `match_reasons`   TEXT,
  `status`          TEXT DEFAULT 'RECOMMENDED',
  `recommended_at`  TEXT DEFAULT CURRENT_TIMESTAMP,
  `responded_at`    TEXT,
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

-- CAMPAIGN_FOLLOWUPS — Post-campaign follow-up chain
CREATE TABLE IF NOT EXISTS `campaign_followups` (
  `id`              TEXT PRIMARY KEY NOT NULL,
  `campaign_id`     TEXT NOT NULL,
  `participant_id`  TEXT NOT NULL,
  `type`            TEXT NOT NULL,
  `status`          TEXT DEFAULT 'PENDING',
  `response`        TEXT,
  `due_at`          TEXT NOT NULL,
  `sent_at`         TEXT,
  `responded_at`    TEXT,
  `created_at`      TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`),
  FOREIGN KEY (`participant_id`) REFERENCES `campaign_participants`(`id`)
);

-- CAMPAIGN_TEMPLATES — Reusable campaign blueprints
CREATE TABLE IF NOT EXISTS `campaign_templates` (
  `id`                  TEXT PRIMARY KEY NOT NULL,
  `source_campaign_id`  TEXT NOT NULL,
  `title`               TEXT NOT NULL,
  `description`         TEXT,
  `category`            TEXT NOT NULL,
  `duration_minutes`    INTEGER,
  `default_slots`       INTEGER,
  `required_skills`     TEXT,
  `eligibility_json`    TEXT,
  `success_rate`        REAL,
  `times_cloned`        INTEGER DEFAULT 0,
  `created_at`          TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`source_campaign_id`) REFERENCES `campaigns`(`id`)
);

-- REVERSE_LEARNING_CARDS — Micro-guides from success stories
CREATE TABLE IF NOT EXISTS `reverse_learning_cards` (
  `id`                  TEXT PRIMARY KEY NOT NULL,
  `source_case_id`      TEXT,
  `source_campaign_id`  TEXT,
  `category`            TEXT NOT NULL,
  `title`               TEXT NOT NULL,
  `situation`           TEXT NOT NULL,
  `action`              TEXT NOT NULL,
  `outcome`             TEXT NOT NULL,
  `tip`                 TEXT,
  `verified_by`         TEXT,
  `created_at`          TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`)
);

-- VERIFIED_ACTION_RECEIPTS — Immutable activity records
CREATE TABLE IF NOT EXISTS `verified_action_receipts` (
  `id`                TEXT PRIMARY KEY NOT NULL,
  `campaign_id`       TEXT NOT NULL,
  `mission_id`        TEXT,
  `navigator_id`      TEXT NOT NULL,
  `beneficiary_alias` TEXT,
  `action_summary`    TEXT NOT NULL,
  `evidence_url`      TEXT,
  `verified_by`       TEXT NOT NULL,
  `outcome_status`    TEXT NOT NULL,
  `issued_at`         TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`),
  FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`),
  FOREIGN KEY (`navigator_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`)
);

-- INDEXES for query performance
CREATE INDEX IF NOT EXISTS `idx_campaigns_status_starts`
  ON `campaigns` (`status`, `starts_at`);
CREATE INDEX IF NOT EXISTS `idx_campaigns_area_status`
  ON `campaigns` (`district`, `status`);
CREATE INDEX IF NOT EXISTS `idx_campaign_matches_user_status`
  ON `campaign_matches` (`user_id`, `status`);
CREATE INDEX IF NOT EXISTS `idx_campaign_participants_campaign_status`
  ON `campaign_participants` (`campaign_id`, `status`);
CREATE INDEX IF NOT EXISTS `idx_missions_navigator_status`
  ON `missions` (`navigator_id`, `status`);
CREATE INDEX IF NOT EXISTS `idx_campaign_followups_due`
  ON `campaign_followups` (`due_at`, `status`);
CREATE INDEX IF NOT EXISTS `idx_community_signals_area_status`
  ON `community_signals` (`district`, `status`);
CREATE INDEX IF NOT EXISTS `idx_campaign_slots_campaign_status`
  ON `campaign_slots` (`campaign_id`, `status`);
