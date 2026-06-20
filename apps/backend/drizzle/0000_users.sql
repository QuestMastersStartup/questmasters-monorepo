-- Users: perfiles y credenciales
CREATE TABLE `user_profiles` (
  `id`         TEXT PRIMARY KEY NOT NULL,
  `username`   TEXT UNIQUE,
  `avatar_url` TEXT,
  `bio`        TEXT,
  `role`       TEXT NOT NULL DEFAULT 'player',
  `is_admin`   INTEGER NOT NULL DEFAULT false,
  `created_at` INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
  `updated_at` INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE UNIQUE INDEX `user_profiles_username_unique` ON `user_profiles` (`username`);

CREATE TABLE `user_credentials` (
  `user_id`       TEXT PRIMARY KEY NOT NULL REFERENCES `user_profiles`(`id`) ON DELETE CASCADE,
  `email`         TEXT NOT NULL UNIQUE,
  `password_hash` TEXT NOT NULL,
  `created_at`    INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE UNIQUE INDEX `IDX_user_credentials_email` ON `user_credentials` (`email`);
