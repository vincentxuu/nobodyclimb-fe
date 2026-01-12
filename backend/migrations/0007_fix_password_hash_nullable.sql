-- Migration: Make password_hash nullable for OAuth users
-- Date: 2026-01-12
-- Issue: SQLite doesn't support ALTER COLUMN, so we need to recreate the table

-- Disable foreign key checks for safe table recreation
PRAGMA foreign_keys=off;

BEGIN TRANSACTION;

-- Step 1: Create new table with password_hash as nullable
CREATE TABLE IF NOT EXISTS users_new (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT,  -- Changed from NOT NULL to nullable for OAuth users
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  is_active INTEGER DEFAULT 1,
  email_verified INTEGER DEFAULT 0,
  google_id TEXT UNIQUE,
  auth_provider TEXT DEFAULT 'local' CHECK (auth_provider IN ('local', 'google')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  climbing_start_year TEXT,
  frequent_gym TEXT,
  favorite_route_type TEXT
);

-- Step 2: Copy data from old table
INSERT INTO users_new (
  id, email, username, password_hash, display_name, avatar_url, bio,
  role, is_active, email_verified, google_id, auth_provider,
  created_at, updated_at, climbing_start_year, frequent_gym, favorite_route_type
)
SELECT
  id, email, username, password_hash, display_name, avatar_url, bio,
  role, is_active, email_verified, google_id, auth_provider,
  created_at, updated_at, climbing_start_year, frequent_gym, favorite_route_type
FROM users;

-- Step 3: Drop old table
DROP TABLE users;

-- Step 4: Rename new table to users
ALTER TABLE users_new RENAME TO users;

-- Step 5: Recreate indexes (google_id UNIQUE is already in table definition)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

COMMIT;

-- Re-enable foreign key checks
PRAGMA foreign_keys=on;
