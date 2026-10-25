CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`username` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_student_id_unique` ON `accounts` (`student_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_username_unique` ON `accounts` (`username`);