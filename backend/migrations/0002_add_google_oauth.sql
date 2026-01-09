-- Migration: Add Google OAuth support
-- Date: 2026-01-09

-- Add google_id column for Google OAuth users
ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE;

-- Add auth_provider column to track authentication method
ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local';

-- Make password_hash nullable for OAuth users (SQLite doesn't support ALTER COLUMN)
-- Note: password_hash is already nullable in the updated schema

-- Create index for google_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
