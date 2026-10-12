CREATE INDEX `cases_org_status_idx` ON `cases` (`organization_id`,`status`);--> statement-breakpoint
CREATE INDEX `encounters_case_date_idx` ON `encounters` (`case_id`,`encounter_date`);--> statement-breakpoint
CREATE INDEX `survey_responses_created_at_idx` ON `survey_responses` (`created_at`);