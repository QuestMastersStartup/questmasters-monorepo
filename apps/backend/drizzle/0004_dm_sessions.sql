-- DM Sessions: sesiones de DM IA y turnos
CREATE TABLE `dm_sessions` (
  `id`                 TEXT PRIMARY KEY NOT NULL,
  `user_id`            TEXT NOT NULL REFERENCES `user_profiles`(`id`) ON DELETE CASCADE,
  `title`              TEXT NOT NULL,
  `campaign_prompt`    TEXT NOT NULL,
  `characters`         TEXT NOT NULL DEFAULT '[]',
  `architecture_type`  TEXT NOT NULL,
  `status`             TEXT NOT NULL DEFAULT 'initializing',
  `model_id`           TEXT NOT NULL,
  `memory_snapshot`    TEXT NOT NULL DEFAULT '{}',
  `narrative_notes`    TEXT NOT NULL DEFAULT '[]',
  `turn_count`         INTEGER NOT NULL DEFAULT 0,
  `total_input_tokens` INTEGER NOT NULL DEFAULT 0,
  `total_output_tokens`INTEGER NOT NULL DEFAULT 0,
  `total_latency_ms`   INTEGER NOT NULL DEFAULT 0,
  `created_at`         INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
  `updated_at`         INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
  `deleted_at`         INTEGER DEFAULT NULL
);

CREATE TABLE `dm_turns` (
  `id`                     TEXT PRIMARY KEY NOT NULL,
  `session_id`             TEXT NOT NULL REFERENCES `dm_sessions`(`id`) ON DELETE CASCADE,
  `turn_number`            INTEGER NOT NULL,
  `role`                   TEXT NOT NULL,
  `player_input`           TEXT,
  `dm_response`            TEXT NOT NULL,
  `memory_snapshot_after`  TEXT NOT NULL DEFAULT '{}',
  `narrative_notes_delta`  TEXT NOT NULL DEFAULT '[]',
  `input_tokens`           INTEGER NOT NULL DEFAULT 0,
  `output_tokens`          INTEGER NOT NULL DEFAULT 0,
  `latency_ms`             INTEGER NOT NULL DEFAULT 0,
  `model_id`               TEXT NOT NULL,
  `architecture_type`      TEXT NOT NULL,
  `created_at`             INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE INDEX `IDX_dm_turns_session_id` ON `dm_turns` (`session_id`);
CREATE UNIQUE INDEX `IDX_dm_turns_session_turn` ON `dm_turns` (`session_id`, `turn_number`);
