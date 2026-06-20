-- ═══════════════════════════════════════════════════════════════
-- QuestMasters — Schema completo (referencia, no ejecutar)
-- Fuente de verdad: schema.ts + migraciones 0000-0004
-- ═══════════════════════════════════════════════════════════════


-- ─── USERS ───────────────────────────────────────────────────

CREATE TABLE `user_profiles` (
  `id`         TEXT PRIMARY KEY NOT NULL,
  `username`   TEXT,
  `avatar_url` TEXT,
  `bio`        TEXT,
  `role`       TEXT NOT NULL DEFAULT 'player',
  `is_admin`   INTEGER NOT NULL DEFAULT false,
  `created_at` INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
  `updated_at` INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE `user_credentials` (
  `user_id`       TEXT PRIMARY KEY NOT NULL REFERENCES `user_profiles`(`id`) ON DELETE CASCADE,
  `email`         TEXT NOT NULL,
  `password_hash` TEXT NOT NULL,
  `created_at`    INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);


-- ─── CONTENT ─────────────────────────────────────────────────

CREATE TABLE `content_packs` (
  `id`                TEXT PRIMARY KEY NOT NULL,
  `slug`              TEXT NOT NULL,
  `name`              TEXT NOT NULL,
  `description`       TEXT,
  `version`           TEXT NOT NULL DEFAULT '1.0.0',
  `type`              TEXT NOT NULL,
  `system`            TEXT NOT NULL DEFAULT 'dnd-5e-2014',
  `creator_id`        TEXT,
  `dependencies`      TEXT DEFAULT '[]',
  `is_active`         INTEGER NOT NULL DEFAULT true,
  `is_suspended`      INTEGER NOT NULL DEFAULT false,
  `suspension_reason` TEXT,
  `status`            TEXT NOT NULL DEFAULT 'draft',
  `created_at`        INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
  `updated_at`        INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE `assets` (
  `id`              TEXT PRIMARY KEY NOT NULL,
  `pack_id`         TEXT NOT NULL REFERENCES `content_packs`(`id`) ON DELETE CASCADE,
  `type`            TEXT NOT NULL,
  `index`           TEXT NOT NULL,
  `name`            TEXT NOT NULL,
  `data`            TEXT NOT NULL,
  `compatible_with` TEXT DEFAULT '[]',
  `created_at`      INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
  `updated_at`      INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);


-- ─── CAMPAIGNS ───────────────────────────────────────────────

CREATE TABLE `campaigns` (
  `id`              TEXT PRIMARY KEY NOT NULL,
  `name`            TEXT NOT NULL,
  `description`     TEXT NOT NULL,
  `system`          TEXT NOT NULL DEFAULT 'dnd-5e-2014',
  `cover_image_url` TEXT,
  `dm_id`           TEXT NOT NULL,
  `status`          TEXT NOT NULL DEFAULT 'active',
  `created_at`      INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
  `updated_at`      INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE `campaign_members` (
  `id`          TEXT PRIMARY KEY NOT NULL,
  `campaign_id` TEXT NOT NULL REFERENCES `campaigns`(`id`) ON DELETE CASCADE,
  `user_id`     TEXT NOT NULL REFERENCES `user_profiles`(`id`) ON DELETE CASCADE,
  `role`        TEXT NOT NULL DEFAULT 'player',
  `joined_at`   INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE `campaign_installed_packs` (
  `campaign_id`  TEXT NOT NULL REFERENCES `campaigns`(`id`) ON DELETE CASCADE,
  `pack_id`      TEXT NOT NULL REFERENCES `content_packs`(`id`) ON DELETE CASCADE,
  `installed_at` INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
  PRIMARY KEY (`campaign_id`, `pack_id`)
);


-- ─── CHARACTERS ──────────────────────────────────────────────

CREATE TABLE `characters` (
  `id`                  TEXT PRIMARY KEY NOT NULL,
  `campaign_id`         TEXT REFERENCES `campaigns`(`id`) ON DELETE SET NULL,
  `user_id`             TEXT NOT NULL REFERENCES `user_profiles`(`id`) ON DELETE CASCADE,
  `name`                TEXT NOT NULL,
  `race_asset_id`       TEXT REFERENCES `assets`(`id`) ON DELETE SET NULL,
  `class_asset_id`      TEXT REFERENCES `assets`(`id`) ON DELETE SET NULL,
  `background_asset_id` TEXT REFERENCES `assets`(`id`) ON DELETE SET NULL,
  `level`               INTEGER NOT NULL DEFAULT 1,
  `stats`               TEXT NOT NULL,
  `hit_points`          INTEGER NOT NULL,
  `portrait_url`        TEXT,
  `backstory`           TEXT,
  `status`              TEXT NOT NULL DEFAULT 'active',
  `choices`             TEXT,
  `created_at`          INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
  `updated_at`          INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);


-- ─── DM SESSIONS ─────────────────────────────────────────────

CREATE TABLE `dm_sessions` (
  `id`                  TEXT PRIMARY KEY NOT NULL,
  `user_id`             TEXT NOT NULL REFERENCES `user_profiles`(`id`) ON DELETE CASCADE,
  `title`               TEXT NOT NULL,
  `campaign_prompt`     TEXT NOT NULL,
  `characters`          TEXT NOT NULL DEFAULT '[]',
  `architecture_type`   TEXT NOT NULL,
  `status`              TEXT NOT NULL DEFAULT 'initializing',
  `model_id`            TEXT NOT NULL,
  `memory_snapshot`     TEXT NOT NULL DEFAULT '{}',
  `narrative_notes`     TEXT NOT NULL DEFAULT '[]',
  `turn_count`          INTEGER NOT NULL DEFAULT 0,
  `total_input_tokens`  INTEGER NOT NULL DEFAULT 0,
  `total_output_tokens` INTEGER NOT NULL DEFAULT 0,
  `total_latency_ms`    INTEGER NOT NULL DEFAULT 0,
  `created_at`          INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
  `updated_at`          INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
  `deleted_at`          INTEGER DEFAULT NULL
);

CREATE TABLE `dm_turns` (
  `id`                    TEXT PRIMARY KEY NOT NULL,
  `session_id`            TEXT NOT NULL REFERENCES `dm_sessions`(`id`) ON DELETE CASCADE,
  `turn_number`           INTEGER NOT NULL,
  `role`                  TEXT NOT NULL,
  `player_input`          TEXT,
  `dm_response`           TEXT NOT NULL,
  `memory_snapshot_after` TEXT NOT NULL DEFAULT '{}',
  `narrative_notes_delta` TEXT NOT NULL DEFAULT '[]',
  `input_tokens`          INTEGER NOT NULL DEFAULT 0,
  `output_tokens`         INTEGER NOT NULL DEFAULT 0,
  `latency_ms`            INTEGER NOT NULL DEFAULT 0,
  `model_id`              TEXT NOT NULL,
  `architecture_type`     TEXT NOT NULL,
  `created_at`            INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);


-- ═══════════════════════════════════════════════════════════════
-- INDICES
-- ═══════════════════════════════════════════════════════════════

-- Users
CREATE UNIQUE INDEX `user_profiles_username_unique` ON `user_profiles` (`username`);
CREATE UNIQUE INDEX `IDX_user_credentials_email` ON `user_credentials` (`email`);

-- Content
CREATE UNIQUE INDEX `content_packs_slug_unique` ON `content_packs` (`slug`);
CREATE UNIQUE INDEX `IDX_assets_pack_type_index` ON `assets` (`pack_id`, `type`, `index`);

-- Campaigns
CREATE UNIQUE INDEX `IDX_campaign_members_unique` ON `campaign_members` (`campaign_id`, `user_id`);

-- Characters
CREATE INDEX `IDX_characters_user_id` ON `characters` (`user_id`);
CREATE INDEX `IDX_characters_campaign_id` ON `characters` (`campaign_id`);

-- DM Sessions
CREATE INDEX `IDX_dm_turns_session_id` ON `dm_turns` (`session_id`);
CREATE UNIQUE INDEX `IDX_dm_turns_session_turn` ON `dm_turns` (`session_id`, `turn_number`);
