-- Migration: Add likes table
-- Version: 1.1.0
-- Date: 2026-01-09
-- Description: Add likes/favorites table for posts, galleries, videos, gyms, and crags

-- Create likes table if not exists
CREATE TABLE IF NOT EXISTS likes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'gallery', 'video', 'gym', 'crag')),
  entity_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, entity_type, entity_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_entity ON likes(entity_type, entity_id);
