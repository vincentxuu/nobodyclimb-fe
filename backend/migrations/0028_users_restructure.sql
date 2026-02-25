-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Users Table Restructure (Part 2 of 7)
-- Description: Rebuild users table with new activity tracking and referral fields
-- ═══════════════════════════════════════════════════════════════════════════

-- Create new users table with enhanced fields
CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  is_active INTEGER DEFAULT 1,
  email_verified INTEGER DEFAULT 0,
  google_id TEXT UNIQUE,
  auth_provider TEXT DEFAULT 'local' CHECK (auth_provider IN ('local', 'google')),
  -- Activity tracking (new)
  last_active_at TEXT,
  last_login_at TEXT,
  login_count INTEGER DEFAULT 0,
  -- Referral tracking (new)
  referral_source TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Copy data from backup (users table still exists at this point)
INSERT INTO users_new (
  id, email, username, password_hash, display_name, avatar_url, bio,
  role, is_active, email_verified, google_id, auth_provider,
  last_active_at, last_login_at, login_count,
  created_at, updated_at
)
SELECT
  id, email, username, password_hash, display_name, avatar_url, bio,
  role, is_active, email_verified, google_id, auth_provider,
  COALESCE(updated_at, created_at),  -- last_active_at
  created_at,                         -- last_login_at
  1,                                  -- login_count
  created_at, updated_at
FROM users_backup;

-- Drop old table and rename
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);
