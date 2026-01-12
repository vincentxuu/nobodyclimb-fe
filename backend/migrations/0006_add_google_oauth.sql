-- Migration: Add Google OAuth support
-- Date: 2026-01-09

-- Add google_id column for Google OAuth users
-- Note: SQLite doesn't support UNIQUE constraint in ALTER TABLE ADD COLUMN
-- Using UNIQUE INDEX instead to enforce uniqueness
ALTER TABLE users ADD COLUMN google_id TEXT;

-- Add auth_provider column to track authentication method
ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local';

-- Make password_hash nullable for OAuth users (SQLite doesn't support ALTER COLUMN)
-- Note: password_hash is already nullable in the updated schema

-- Create UNIQUE index for google_id to enforce uniqueness and enable fast lookups
-- Drop any existing non-unique index first to ensure idempotency
DROP INDEX IF EXISTS idx_users_google_id;
CREATE UNIQUE INDEX idx_users_google_id ON users(google_id);
