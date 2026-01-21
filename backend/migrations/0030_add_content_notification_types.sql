-- ═══════════════════════════════════════════════════════════
-- Migration: Add notification types for biography content interactions
-- Description:
--   - 新增 core_story_liked, core_story_commented 通知類型
--   - 新增 one_liner_liked, one_liner_commented 通知類型
--   - 新增 story_liked, story_commented 通知類型
--   - 新增 biography_liked 通知類型（修正之前用 goal_liked 的問題）
--   - 更新 notification_preferences 表
-- ═══════════════════════════════════════════════════════════

-- ============================================
-- Step 1: Recreate notifications table with new types
-- ============================================
-- Note: Disabling foreign keys to handle orphaned actor_id references
PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS notifications_v3 (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    -- 原有類型
    'goal_completed',
    'goal_liked',
    'goal_commented',
    'goal_referenced',
    'new_follower',
    'story_featured',
    'biography_commented',
    'post_liked',
    'post_commented',
    'system_announcement',
    -- 新增類型
    'biography_liked',
    'core_story_liked',
    'core_story_commented',
    'one_liner_liked',
    'one_liner_commented',
    'story_liked',
    'story_commented'
  )),
  actor_id TEXT,
  target_id TEXT,
  title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Copy existing data (filter out any rows with non-existent user_id)
INSERT INTO notifications_v3 (id, user_id, type, actor_id, target_id, title, message, is_read, created_at)
SELECT n.id, n.user_id, n.type, n.actor_id, n.target_id, n.title, n.message, n.is_read, n.created_at
FROM notifications n
INNER JOIN users u ON n.user_id = u.id;

-- Drop old table and rename
DROP TABLE notifications;
ALTER TABLE notifications_v3 RENAME TO notifications;

-- Re-enable foreign keys
PRAGMA foreign_keys = ON;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = 0;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ============================================
-- Step 2: Update notification_preferences with new columns
-- ============================================
ALTER TABLE notification_preferences ADD COLUMN biography_liked INTEGER DEFAULT 1;
ALTER TABLE notification_preferences ADD COLUMN core_story_liked INTEGER DEFAULT 1;
ALTER TABLE notification_preferences ADD COLUMN core_story_commented INTEGER DEFAULT 1;
ALTER TABLE notification_preferences ADD COLUMN one_liner_liked INTEGER DEFAULT 1;
ALTER TABLE notification_preferences ADD COLUMN one_liner_commented INTEGER DEFAULT 1;
ALTER TABLE notification_preferences ADD COLUMN story_liked INTEGER DEFAULT 1;
ALTER TABLE notification_preferences ADD COLUMN story_commented INTEGER DEFAULT 1;
