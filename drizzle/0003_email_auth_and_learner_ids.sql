-- Idempotent D1 migration. Runtime setup also creates these tables for existing deployments.
CREATE TABLE IF NOT EXISTS email_credentials (
  user_id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  login_id TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS learner_id_counter (
  key TEXT PRIMARY KEY NOT NULL,
  next_value INTEGER NOT NULL
);
