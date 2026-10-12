CREATE TABLE IF NOT EXISTS `pilots` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL UNIQUE,
	`name` text NOT NULL,
	`target_cases` integer DEFAULT 100,
	`start_date` text,
	`end_date` text,
	`is_demo` integer DEFAULT 0,
	`status` text DEFAULT 'PLANNED',
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `pilot_members` (
	`id` text PRIMARY KEY NOT NULL,
	`pilot_id` text NOT NULL REFERENCES pilots(id),
	`user_id` text NOT NULL REFERENCES users(id),
	`role_in_pilot` text DEFAULT 'NAVIGATOR'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `pilot_configuration` (
	`id` text PRIMARY KEY NOT NULL,
	`pilot_id` text NOT NULL REFERENCES pilots(id),
	`config_key` text NOT NULL,
	`config_value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE `cases` ADD `pilot_id` text REFERENCES pilots(id);
--> statement-breakpoint
ALTER TABLE `cases` ADD `current_owner_id` text REFERENCES users(id);
--> statement-breakpoint
ALTER TABLE `cases` ADD `risk_level` text DEFAULT 'LOW';
--> statement-breakpoint
ALTER TABLE `cases` ADD `created_by` text REFERENCES users(id);
--> statement-breakpoint
ALTER TABLE `cases` ADD `updated_at` text DEFAULT CURRENT_TIMESTAMP;
--> statement-breakpoint
ALTER TABLE `cases` ADD `closed_at` text;
--> statement-breakpoint
ALTER TABLE `resources` ADD `verification_status` text DEFAULT 'VERIFIED';
--> statement-breakpoint
ALTER TABLE `resources` ADD `verification_expires_at` text;
--> statement-breakpoint
ALTER TABLE `resources` ADD `capacity_status` text DEFAULT 'AVAILABLE';
--> statement-breakpoint
ALTER TABLE `resources` ADD `capacity_checked_at` text;
--> statement-breakpoint
ALTER TABLE `resources` ADD `organization_id` text REFERENCES organizations(id);
--> statement-breakpoint
ALTER TABLE `referrals` ADD `partner_id` text REFERENCES organizations(id);
--> statement-breakpoint
ALTER TABLE `referrals` ADD `accepted_at` text;
--> statement-breakpoint
ALTER TABLE `referrals` ADD `declined_at` text;
--> statement-breakpoint
ALTER TABLE `referrals` ADD `decline_reason` text;
--> statement-breakpoint
ALTER TABLE `referrals` ADD `action_taken_at` text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `case_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL REFERENCES cases(id),
	`assigned_by` text REFERENCES users(id),
	`assigned_to` text NOT NULL REFERENCES users(id),
	`reason` text,
	`active` integer DEFAULT 1,
	`assigned_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `case_facts` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL REFERENCES cases(id),
	`fact_type` text NOT NULL,
	`value` text NOT NULL,
	`source_type` text DEFAULT 'NAVIGATOR_OBSERVED',
	`verification_status` text DEFAULT 'UNVERIFIED',
	`confidence` integer DEFAULT 100,
	`created_by` text REFERENCES users(id),
	`verified_by` text REFERENCES users(id),
	`verified_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `safe_next_steps` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL REFERENCES cases(id),
	`resource_id` text REFERENCES resources(id),
	`title` text NOT NULL,
	`action` text NOT NULL,
	`owner` text NOT NULL,
	`channel_or_location` text NOT NULL,
	`due_at` text,
	`status` text DEFAULT 'PROPOSED',
	`proposed_by` text REFERENCES users(id),
	`confirmed_by` text REFERENCES users(id),
	`confirmed_at` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `safe_next_step_events` (
	`id` text PRIMARY KEY NOT NULL,
	`safe_next_step_id` text NOT NULL REFERENCES safe_next_steps(id),
	`case_id` text NOT NULL REFERENCES cases(id),
	`event_type` text NOT NULL,
	`actor_id` text REFERENCES users(id),
	`metadata_json` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL REFERENCES cases(id),
	`resource_id` text NOT NULL REFERENCES resources(id),
	`score` integer NOT NULL,
	`matched_skills` text,
	`passed_hard_rules` integer DEFAULT 1,
	`rejection_reason` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `escalations` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL REFERENCES cases(id),
	`reason` text NOT NULL,
	`level` text DEFAULT 'HOTLINE_111',
	`status` text DEFAULT 'PENDING',
	`escalated_by` text REFERENCES users(id),
	`resolved_by` text REFERENCES users(id),
	`resolved_at` text,
	`action_taken_summary` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `safeguarding_assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL REFERENCES cases(id),
	`beneficiary_is_child` integer DEFAULT 0,
	`risk_level` text DEFAULT 'LOW',
	`decision` text NOT NULL,
	`reviewer_id` text REFERENCES users(id),
	`reviewed_at` text DEFAULT CURRENT_TIMESTAMP,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `outcomes` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL REFERENCES cases(id),
	`follow_up_id` text REFERENCES follow_ups(id),
	`result_status` text NOT NULL,
	`notes` text,
	`recorded_by` text REFERENCES users(id),
	`recorded_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `resource_capacity_checks` (
	`id` text PRIMARY KEY NOT NULL,
	`resource_id` text NOT NULL REFERENCES resources(id),
	`capacity_status` text NOT NULL,
	`slots_available` integer,
	`notes` text,
	`checked_by` text REFERENCES users(id),
	`checked_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `referral_partner_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`referral_id` text NOT NULL REFERENCES referrals(id),
	`case_id` text NOT NULL REFERENCES cases(id),
	`alias_name` text NOT NULL,
	`district` text NOT NULL,
	`urgency` text DEFAULT 'MEDIUM',
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
