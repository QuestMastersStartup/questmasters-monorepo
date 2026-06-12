CREATE TABLE IF NOT EXISTS user_credentials (
  user_id       TEXT PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE UNIQUE INDEX IF NOT EXISTS IDX_user_credentials_email ON user_credentials(email);
