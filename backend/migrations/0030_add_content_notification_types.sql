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
  message TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Copy existing data
INSERT INTO notifications_v3 (id, user_id, type, actor_id, target_id, message, is_read, created_at)
SELECT id, user_id, type, actor_id, target_id, message, is_read, created_at
FROM notifications;

-- Drop old table and rename
DROP TABLE notifications;
ALTER TABLE notifications_v3 RENAME TO notifications;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = 0;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

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
