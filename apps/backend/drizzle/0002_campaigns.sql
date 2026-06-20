-- ═══════════════════════════════════════════════════════════════
-- Campaigns: campañas, miembros y packs instalados
-- ═══════════════════════════════════════════════════════════════

-- Tablas ──────────────────────────────────────────────────────

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

-- Índices ─────────────────────────────────────────────────────

CREATE UNIQUE INDEX `IDX_campaign_members_unique` ON `campaign_members` (`campaign_id`, `user_id`);
