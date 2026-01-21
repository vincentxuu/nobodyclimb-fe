-- ═══════════════════════════════════════════════════════════
-- Migration: Add post notification types
-- Description: Adds post_liked and post_commented notification types
-- ═══════════════════════════════════════════════════════════

-- Create new table with updated type constraint
CREATE TABLE IF NOT EXISTS notifications_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'goal_completed', 'goal_liked', 'goal_commented', 'goal_referenced',
    'new_follower', 'story_featured', 'biography_commented',
    'post_liked', 'post_commented'
  )),
  actor_id TEXT,
  target_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Copy data from old table
INSERT INTO notifications_new (id, user_id, type, actor_id, target_id, title, message, is_read, created_at)
SELECT id, user_id, type, actor_id, target_id, title, message, is_read, created_at
FROM notifications;

-- Drop old table
DROP TABLE notifications;

-- Rename new table
ALTER TABLE notifications_new RENAME TO notifications;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
