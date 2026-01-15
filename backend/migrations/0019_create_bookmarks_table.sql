-- Migration: Create bookmarks table and update likes table
-- Version: 1.2.0
-- Date: 2026-01-15
-- Description: Create separate bookmarks table for post bookmarks

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'gallery', 'video', 'gym', 'crag', 'biography')),
  entity_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, entity_type, entity_id)
);

-- Create indexes for bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_entity ON bookmarks(entity_type, entity_id);
