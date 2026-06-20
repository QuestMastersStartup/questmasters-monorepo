-- ═══════════════════════════════════════════════════════════════
-- Content: packs y assets del marketplace
-- ═══════════════════════════════════════════════════════════════

-- Tablas ──────────────────────────────────────────────────────

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

-- Índices ─────────────────────────────────────────────────────

CREATE UNIQUE INDEX `content_packs_slug_unique` ON `content_packs` (`slug`);
CREATE UNIQUE INDEX `IDX_assets_pack_type_index` ON `assets` (`pack_id`, `type`, `index`);
