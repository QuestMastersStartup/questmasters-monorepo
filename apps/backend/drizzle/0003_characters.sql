-- Characters: personajes de jugadores
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

CREATE INDEX `IDX_characters_user_id` ON `characters` (`user_id`);
CREATE INDEX `IDX_characters_campaign_id` ON `characters` (`campaign_id`);
