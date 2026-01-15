-- Migration: Add action_type column to likes table
-- Version: 1.2.0
-- Date: 2026-01-15
-- Description: Add action_type column to distinguish between 'like' and 'bookmark' actions

-- Step 1: Create new table with action_type column
CREATE TABLE IF NOT EXISTS likes_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'gallery', 'video', 'gym', 'crag', 'biography')),
  entity_id TEXT NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'bookmark' CHECK (action_type IN ('like', 'bookmark')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, entity_type, entity_id, action_type)
);

-- Step 2: Copy existing data (all existing likes become bookmarks)
INSERT OR IGNORE INTO likes_new (id, user_id, entity_type, entity_id, action_type, created_at)
SELECT id, user_id, entity_type, entity_id, 'bookmark', created_at FROM likes;

-- Step 3: Drop old table
DROP TABLE IF EXISTS likes;

-- Step 4: Rename new table
ALTER TABLE likes_new RENAME TO likes;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_entity ON likes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_likes_action ON likes(action_type);
CREATE INDEX IF NOT EXISTS idx_likes_entity_action ON likes(entity_type, entity_id, action_type);
