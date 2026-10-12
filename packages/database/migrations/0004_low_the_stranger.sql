CREATE TABLE `domain_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`aggregate_type` text NOT NULL,
	`aggregate_id` text NOT NULL,
	`event_type` text NOT NULL,
	`payload_json` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`published_at` text
);
--> statement-breakpoint
CREATE INDEX `domain_outbox_status_idx` ON `domain_outbox` (`status`);--> statement-breakpoint
CREATE INDEX `domain_outbox_aggregate_idx` ON `domain_outbox` (`aggregate_type`,`aggregate_id`);--> statement-breakpoint
CREATE INDEX `domain_outbox_event_type_idx` ON `domain_outbox` (`event_type`);