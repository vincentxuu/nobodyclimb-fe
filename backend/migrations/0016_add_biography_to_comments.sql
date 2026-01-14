-- ═══════════════════════════════════════════════════════════
-- Migration: Add biography to comments entity_type
-- Description: Extends comments table to support biography comments
-- ═══════════════════════════════════════════════════════════

-- SQLite doesn't support ALTER TABLE ... ALTER COLUMN for CHECK constraints
-- We need to recreate the table with the new constraint

-- Step 1: Create new table with updated constraint
CREATE TABLE IF NOT EXISTS comments_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'gallery', 'video', 'biography')),
  entity_id TEXT NOT NULL,
  parent_id TEXT,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Step 2: Copy data from old table
INSERT INTO comments_new SELECT * FROM comments;

-- Step 3: Drop old table
DROP TABLE comments;

-- Step 4: Rename new table
ALTER TABLE comments_new RENAME TO comments;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
