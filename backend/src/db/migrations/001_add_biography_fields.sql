-- Migration: Add climbing-specific fields to biographies table
-- Run this migration to update existing biographies table

-- Add new columns (SQLite doesn't support adding multiple columns in one ALTER TABLE)
ALTER TABLE biographies ADD COLUMN climbing_start_year TEXT;
ALTER TABLE biographies ADD COLUMN frequent_locations TEXT;
ALTER TABLE biographies ADD COLUMN favorite_route_type TEXT;
ALTER TABLE biographies ADD COLUMN climbing_reason TEXT;
ALTER TABLE biographies ADD COLUMN climbing_meaning TEXT;
ALTER TABLE biographies ADD COLUMN bucket_list TEXT;
ALTER TABLE biographies ADD COLUMN advice TEXT;
ALTER TABLE biographies ADD COLUMN is_public INTEGER DEFAULT 0;
ALTER TABLE biographies ADD COLUMN published_at TEXT;

-- Create index for public biographies
CREATE INDEX IF NOT EXISTS idx_biographies_public ON biographies(is_public);
