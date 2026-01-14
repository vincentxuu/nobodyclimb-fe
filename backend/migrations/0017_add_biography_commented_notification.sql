-- ═══════════════════════════════════════════════════════════
-- Migration: Add biography_commented to notification types
-- Description: Extends notifications table to support biography comment notifications
-- ═══════════════════════════════════════════════════════════

-- SQLite doesn't support ALTER TABLE ... ALTER COLUMN for CHECK constraints
-- We need to recreate the table with the new constraint

-- Step 1: Create new table with updated constraint
CREATE TABLE IF NOT EXISTS notifications_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('goal_completed', 'goal_liked', 'goal_commented', 'goal_referenced', 'new_follower', 'story_featured', 'biography_commented')),
  actor_id TEXT,
  target_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 2: Copy data from old table
INSERT INTO notifications_new SELECT * FROM notifications;

-- Step 3: Drop old table
DROP TABLE notifications;

-- Step 4: Rename new table
ALTER TABLE notifications_new RENAME TO notifications;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
