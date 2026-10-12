CREATE TABLE `ai_analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`voice_note_id` text,
	`extracted_needs` text,
	`mil_scam_detected` integer DEFAULT false,
	`scam_risk_level` text DEFAULT 'low',
	`confidence_score` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`voice_note_id`) REFERENCES `voice_notes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text,
	`user_id` text,
	`action` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text,
	`ip_address` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `beneficiaries` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`alias_name` text NOT NULL,
	`full_name` text,
	`birth_year` integer,
	`is_minor` integer DEFAULT false,
	`gender` text,
	`current_area` text,
	`vulnerability_group` text,
	`is_sensitive` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cases` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`team_id` text,
	`beneficiary_id` text NOT NULL,
	`assigned_to` text,
	`status` text DEFAULT 'open',
	`priority` text DEFAULT 'medium',
	`next_follow_up_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`beneficiary_id`) REFERENCES `beneficiaries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `consents` (
	`id` text PRIMARY KEY NOT NULL,
	`encounter_id` text NOT NULL,
	`beneficiary_id` text NOT NULL,
	`voice_recording_allowed` integer DEFAULT true,
	`anonymity_requested` integer DEFAULT true,
	`voice_encryption_enabled` integer DEFAULT true,
	`agreed_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`beneficiary_id`) REFERENCES `beneficiaries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `encounters` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`journey_id` text,
	`volunteer_id` text NOT NULL,
	`encounter_date` text DEFAULT CURRENT_TIMESTAMP,
	`location_text` text,
	`summary` text,
	`health_state` text,
	`weather_condition` text,
	`client_generated_id` text,
	`sync_status` text DEFAULT 'synced',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`journey_id`) REFERENCES `journeys`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`volunteer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `follow_ups` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text,
	`passport_id` text,
	`social_worker_id` text,
	`assigned_to` text,
	`action_type` text NOT NULL,
	`notes` text,
	`status` text DEFAULT 'pending',
	`due_date` text,
	`completed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`passport_id`) REFERENCES `livelihood_passports`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`social_worker_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `impact_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`total_encounters` integer DEFAULT 0,
	`active_cases` integer DEFAULT 0,
	`successful_referrals` integer DEFAULT 0,
	`safeguarding_actions` integer DEFAULT 0,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `journeys` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`team_id` text NOT NULL,
	`title` text NOT NULL,
	`location_name` text NOT NULL,
	`scheduled_date` text NOT NULL,
	`status` text DEFAULT 'planned',
	`notes` text,
	`created_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `livelihood_passports` (
	`id` text PRIMARY KEY NOT NULL,
	`beneficiary_id` text,
	`user_id` text,
	`age_group` text,
	`skills` text,
	`work_preference` text,
	`health_status` text,
	`location` text,
	`status` text DEFAULT 'active',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`beneficiary_id`) REFERENCES `beneficiaries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role_in_team` text DEFAULT 'member',
	`joined_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `mil_incident_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`incident_type` text,
	`description` text,
	`risk_level` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `needs` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`priority` text DEFAULT 'medium',
	`status` text DEFAULT 'identified',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`is_read` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `opportunities` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`organization_name` text NOT NULL,
	`description` text NOT NULL,
	`category` text,
	`required_skills` text,
	`contact_info` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`resource_id` text NOT NULL,
	`referred_by` text NOT NULL,
	`status` text DEFAULT 'proposed',
	`notes` text,
	`outcome` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`referred_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`district` text NOT NULL,
	`address` text NOT NULL,
	`phone` text,
	`operating_hours` text,
	`verified_by` text,
	`verified_at` text,
	`is_verified` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `safeguarding_flags` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`reported_by` text NOT NULL,
	`reason` text NOT NULL,
	`severity` text DEFAULT 'high',
	`status` text DEFAULT 'open',
	`escalated_to_111` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reported_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`district` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `timeline_events` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`actor_id` text,
	`event_type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`event_date` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text,
	`full_name` text NOT NULL,
	`phone` text,
	`email` text,
	`role` text DEFAULT 'volunteer' NOT NULL,
	`avatar_url` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `voice_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`encounter_id` text NOT NULL,
	`storage_key` text NOT NULL,
	`duration_seconds` integer,
	`raw_transcript` text,
	`edited_transcript` text,
	`stt_status` text DEFAULT 'pending',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `beneficiaries_org_idx` ON `beneficiaries` (`organization_id`);--> statement-breakpoint
CREATE INDEX `beneficiaries_minor_idx` ON `beneficiaries` (`is_minor`);--> statement-breakpoint
CREATE INDEX `cases_org_idx` ON `cases` (`organization_id`);--> statement-breakpoint
CREATE INDEX `cases_assigned_idx` ON `cases` (`assigned_to`);--> statement-breakpoint
CREATE INDEX `cases_status_idx` ON `cases` (`status`);--> statement-breakpoint
CREATE INDEX `cases_followup_idx` ON `cases` (`next_follow_up_at`);--> statement-breakpoint
CREATE INDEX `encounters_case_idx` ON `encounters` (`case_id`);--> statement-breakpoint
CREATE INDEX `encounters_volunteer_idx` ON `encounters` (`volunteer_id`);--> statement-breakpoint
CREATE INDEX `followups_case_idx` ON `follow_ups` (`case_id`);--> statement-breakpoint
CREATE INDEX `followups_duedate_idx` ON `follow_ups` (`due_date`);--> statement-breakpoint
CREATE INDEX `followups_status_idx` ON `follow_ups` (`status`);--> statement-breakpoint
CREATE INDEX `journeys_org_team_idx` ON `journeys` (`organization_id`,`team_id`);--> statement-breakpoint
CREATE INDEX `journeys_status_idx` ON `journeys` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
CREATE INDEX `referrals_case_idx` ON `referrals` (`case_id`);--> statement-breakpoint
CREATE INDEX `referrals_status_idx` ON `referrals` (`status`);--> statement-breakpoint
CREATE INDEX `resources_dist_cat_idx` ON `resources` (`district`,`category`);--> statement-breakpoint
CREATE INDEX `teams_org_idx` ON `teams` (`organization_id`);--> statement-breakpoint
CREATE INDEX `timeline_case_date_idx` ON `timeline_events` (`case_id`,`event_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_org_idx` ON `users` (`organization_id`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);