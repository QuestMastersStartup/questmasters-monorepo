CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`pack_id` text NOT NULL,
	`type` text NOT NULL,
	`index` text NOT NULL,
	`name` text NOT NULL,
	`data` text NOT NULL,
	`compatible_with` text DEFAULT '[]',
	`created_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL,
	FOREIGN KEY (`pack_id`) REFERENCES `content_packs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `IDX_assets_pack_type_index` ON `assets` (`pack_id`,`type`,`index`);--> statement-breakpoint
CREATE TABLE `campaign_installed_packs` (
	`campaign_id` text NOT NULL,
	`pack_id` text NOT NULL,
	`installed_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL,
	PRIMARY KEY(`campaign_id`, `pack_id`),
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pack_id`) REFERENCES `content_packs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `campaign_members` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'player' NOT NULL,
	`joined_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `IDX_campaign_members_unique` ON `campaign_members` (`campaign_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`system` text DEFAULT 'dnd-5e-2014' NOT NULL,
	`cover_image_url` text,
	`dm_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`race_asset_id` text,
	`class_asset_id` text,
	`background_asset_id` text,
	`level` integer DEFAULT 1 NOT NULL,
	`stats` text NOT NULL,
	`hit_points` integer NOT NULL,
	`portrait_url` text,
	`backstory` text,
	`status` text DEFAULT 'active' NOT NULL,
	`choices` text,
	`created_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `user_profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`race_asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`class_asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`background_asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `IDX_characters_user_id` ON `characters` (`user_id`);--> statement-breakpoint
CREATE INDEX `IDX_characters_campaign_id` ON `characters` (`campaign_id`);--> statement-breakpoint
CREATE TABLE `content_packs` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`version` text DEFAULT '1.0.0' NOT NULL,
	`type` text NOT NULL,
	`system` text DEFAULT 'dnd-5e-2014' NOT NULL,
	`creator_id` text,
	`dependencies` text DEFAULT '[]',
	`is_active` integer DEFAULT true NOT NULL,
	`is_suspended` integer DEFAULT false NOT NULL,
	`suspension_reason` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_packs_slug_unique` ON `content_packs` (`slug`);--> statement-breakpoint
CREATE TABLE `dm_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`campaign_prompt` text NOT NULL,
	`characters` text DEFAULT '[]' NOT NULL,
	`architecture_type` text NOT NULL,
	`status` text DEFAULT 'initializing' NOT NULL,
	`model_id` text NOT NULL,
	`memory_snapshot` text DEFAULT '{}' NOT NULL,
	`narrative_notes` text DEFAULT '[]' NOT NULL,
	`turn_count` integer DEFAULT 0 NOT NULL,
	`total_input_tokens` integer DEFAULT 0 NOT NULL,
	`total_output_tokens` integer DEFAULT 0 NOT NULL,
	`total_latency_ms` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `dm_turns` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`turn_number` integer NOT NULL,
	`role` text NOT NULL,
	`player_input` text,
	`dm_response` text NOT NULL,
	`memory_snapshot_after` text DEFAULT '{}' NOT NULL,
	`narrative_notes_delta` text DEFAULT '[]' NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`latency_ms` integer DEFAULT 0 NOT NULL,
	`model_id` text NOT NULL,
	`architecture_type` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `dm_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `IDX_dm_turns_session_id` ON `dm_turns` (`session_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `IDX_dm_turns_session_turn` ON `dm_turns` (`session_id`,`turn_number`);--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text,
	`avatar_url` text,
	`bio` text,
	`role` text DEFAULT 'player' NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_profiles_username_unique` ON `user_profiles` (`username`);