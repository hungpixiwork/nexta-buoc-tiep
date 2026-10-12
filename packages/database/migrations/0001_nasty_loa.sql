CREATE TABLE `case_consents` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`scope` text NOT NULL,
	`status` text DEFAULT 'UNKNOWN',
	`captured_by` text,
	`captured_at` text DEFAULT CURRENT_TIMESTAMP,
	`evidence_note` text,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`captured_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `document_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`version` text NOT NULL,
	`jurisdiction` text DEFAULT 'VN',
	`effective_from` text,
	`effective_to` text,
	`verification_status` text DEFAULT 'UNVERIFIED',
	`template_content` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `referral_channel_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`organization_name` text NOT NULL,
	`channel_type` text NOT NULL,
	`phone` text,
	`email` text,
	`url` text,
	`jurisdiction` text,
	`verification_status` text DEFAULT 'UNVERIFIED',
	`verified_at` text,
	`verified_by` text,
	`verification_source` text,
	`enabled` integer DEFAULT true,
	`metadata_json` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `referral_events` (
	`id` text PRIMARY KEY NOT NULL,
	`referral_id` text NOT NULL,
	`case_id` text NOT NULL,
	`event_type` text NOT NULL,
	`actor_id` text NOT NULL,
	`metadata_json` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`referral_id`) REFERENCES `referrals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `survey_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`contact_name` text NOT NULL,
	`contact_phone` text NOT NULL,
	`contact_email` text,
	`contact_org` text,
	`a1_experience` text,
	`a2_frequency` text,
	`a3_org_type` text,
	`a4_role` text,
	`a4_tool_usage` text,
	`a5_stop_reasons` text,
	`b1_adoption_rate` text,
	`b2_churn_factors` text,
	`b3_tradeoff` text,
	`b4_extra_time` text,
	`b5_retention_driver` text,
	`b6_data_purpose` text,
	`c1_fears` text,
	`c2_motivation_impact` text,
	`c3_authenticity_skepticism` integer,
	`c4_doubt_action` text,
	`c5_verify_method` text,
	`c6_referral_willingness` text,
	`d1_child_safeguarding_priority` text,
	`d2_livelihood_passport_barrier` text,
	`d3_ui_friction` text,
	`d4_intake_preference` text,
	`beta_optin` text,
	`user_feedback` text,
	`is_priority_lead` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
/*
 SQLite does not support "Drop not null from column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html
                  https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
/*
 SQLite does not support "Set default to column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html
                  https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
ALTER TABLE `ai_analyses` ADD `raw_input` text;--> statement-breakpoint
ALTER TABLE `ai_analyses` ADD `ai_generated_value` text;--> statement-breakpoint
ALTER TABLE `ai_analyses` ADD `verification_status` text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `ai_analyses` ADD `verified_by` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `ai_analyses` ADD `verified_at` text;--> statement-breakpoint
ALTER TABLE `ai_analyses` ADD `source_type` text;--> statement-breakpoint
ALTER TABLE `cases` ADD `three_khong_check` text;--> statement-breakpoint
ALTER TABLE `cases` ADD `privacy_gate_completed_at` text;--> statement-breakpoint
ALTER TABLE `cases` ADD `signed_qr_token` text;--> statement-breakpoint
ALTER TABLE `cases` ADD `qr_expires_at` text;--> statement-breakpoint
ALTER TABLE `cases` ADD `qr_revoked_at` text;--> statement-breakpoint
ALTER TABLE `referrals` ADD `type` text DEFAULT 'GENERAL' NOT NULL;--> statement-breakpoint
ALTER TABLE `referrals` ADD `version` integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE `referrals` ADD `payload_json` text;--> statement-breakpoint
ALTER TABLE `referrals` ADD `rendered_text` text;--> statement-breakpoint
ALTER TABLE `referrals` ADD `template_version` text;--> statement-breakpoint
ALTER TABLE `referrals` ADD `destination_config_id` text;--> statement-breakpoint
ALTER TABLE `referrals` ADD `approved_by` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `referrals` ADD `approved_at` text;--> statement-breakpoint
ALTER TABLE `referrals` ADD `opened_externally_at` text;--> statement-breakpoint
ALTER TABLE `referrals` ADD `submitted_at` text;--> statement-breakpoint
ALTER TABLE `referrals` ADD `privacy_classification` text DEFAULT 'RESTRICTED';--> statement-breakpoint
ALTER TABLE `referrals` ADD `expires_at` text;--> statement-breakpoint
ALTER TABLE `referrals` ADD `updated_at` text DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` ADD `password_hash` text;--> statement-breakpoint
CREATE INDEX `case_consents_case_scope_idx` ON `case_consents` (`case_id`,`scope`);--> statement-breakpoint
CREATE INDEX `doc_templates_code_ver_idx` ON `document_templates` (`code`,`version`);--> statement-breakpoint
CREATE UNIQUE INDEX `referral_channel_configs_code_unique` ON `referral_channel_configs` (`code`);--> statement-breakpoint
CREATE INDEX `ref_channels_code_idx` ON `referral_channel_configs` (`code`);--> statement-breakpoint
CREATE INDEX `ref_channels_status_idx` ON `referral_channel_configs` (`verification_status`);--> statement-breakpoint
CREATE INDEX `ref_events_ref_idx` ON `referral_events` (`referral_id`);--> statement-breakpoint
CREATE INDEX `ref_events_case_idx` ON `referral_events` (`case_id`);--> statement-breakpoint
CREATE INDEX `survey_responses_phone_idx` ON `survey_responses` (`contact_phone`);--> statement-breakpoint
CREATE INDEX `survey_responses_priority_idx` ON `survey_responses` (`is_priority_lead`);--> statement-breakpoint
CREATE INDEX `ai_analyses_voice_note_idx` ON `ai_analyses` (`voice_note_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_org_idx` ON `audit_logs` (`organization_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_user_idx` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_resource_idx` ON `audit_logs` (`resource_type`,`resource_id`);--> statement-breakpoint
CREATE INDEX `cases_team_idx` ON `cases` (`team_id`);--> statement-breakpoint
CREATE INDEX `cases_beneficiary_idx` ON `cases` (`beneficiary_id`);--> statement-breakpoint
CREATE INDEX `consents_encounter_idx` ON `consents` (`encounter_id`);--> statement-breakpoint
CREATE INDEX `consents_beneficiary_idx` ON `consents` (`beneficiary_id`);--> statement-breakpoint
CREATE INDEX `encounters_journey_idx` ON `encounters` (`journey_id`);--> statement-breakpoint
CREATE INDEX `passports_beneficiary_idx` ON `livelihood_passports` (`beneficiary_id`);--> statement-breakpoint
CREATE INDEX `memberships_team_idx` ON `memberships` (`team_id`);--> statement-breakpoint
CREATE INDEX `memberships_user_idx` ON `memberships` (`user_id`);--> statement-breakpoint
CREATE INDEX `mil_incidents_user_idx` ON `mil_incident_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `needs_case_idx` ON `needs` (`case_id`);--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `referrals_resource_idx` ON `referrals` (`resource_id`);--> statement-breakpoint
CREATE INDEX `referrals_referred_by_idx` ON `referrals` (`referred_by`);--> statement-breakpoint
CREATE INDEX `referrals_type_idx` ON `referrals` (`type`);--> statement-breakpoint
CREATE INDEX `safeguarding_case_idx` ON `safeguarding_flags` (`case_id`);--> statement-breakpoint
CREATE INDEX `voice_notes_encounter_idx` ON `voice_notes` (`encounter_id`);--> statement-breakpoint
/*
 SQLite does not support "Creating foreign key on existing column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html

 Due to that we don't generate migration automatically and it has to be done manually
*/