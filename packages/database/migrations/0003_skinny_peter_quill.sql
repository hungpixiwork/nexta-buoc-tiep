CREATE TABLE `case_provenance` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`field_path` text NOT NULL,
	`value_hash` text,
	`provenance_type` text NOT NULL,
	`source_entity_id` text,
	`created_by_actor_id` text,
	`generated_by_model` text,
	`confidence` integer,
	`verified_by` text,
	`verified_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `case_provenance_case_idx` ON `case_provenance` (`case_id`);--> statement-breakpoint
CREATE INDEX `case_provenance_type_idx` ON `case_provenance` (`provenance_type`);--> statement-breakpoint
CREATE TABLE `mil_modules` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`category` text NOT NULL,
	`content_json` text,
	`quiz_questions_count` integer DEFAULT 5,
	`is_published` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mil_modules_slug_unique` ON `mil_modules` (`slug`);--> statement-breakpoint
CREATE INDEX `mil_modules_cat_idx` ON `mil_modules` (`category`);--> statement-breakpoint
CREATE TABLE `passport_events` (
	`id` text PRIMARY KEY NOT NULL,
	`passport_id` text NOT NULL,
	`stage` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`actor_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`passport_id`) REFERENCES `livelihood_passports`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `passport_events_passport_idx` ON `passport_events` (`passport_id`);--> statement-breakpoint
CREATE INDEX `passport_events_stage_idx` ON `passport_events` (`stage`);--> statement-breakpoint
CREATE INDEX `idx_cases_navigator` ON `cases` (`assigned_to`,`status`,`priority`);--> statement-breakpoint
CREATE INDEX `idx_referrals_closed_loop` ON `referrals` (`case_id`,`status`,`type`);--> statement-breakpoint
CREATE INDEX `idx_verified_resources_matching` ON `resources` (`district`,`category`,`is_verified`);