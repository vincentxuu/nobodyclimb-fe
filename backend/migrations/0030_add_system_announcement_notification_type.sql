-- ═══════════════════════════════════════════════════════════
-- Migration: Add system_announcement notification type
-- Description: Adds 'system_announcement' to notifications.type CHECK constraint
-- ═══════════════════════════════════════════════════════════

-- SQLite 不支援直接修改 CHECK constraint，需要重建表
-- Step 1: 建立新表結構（包含 system_announcement 類型）
CREATE TABLE IF NOT EXISTS notifications_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'goal_completed', 'goal_liked', 'goal_commented', 'goal_referenced',
    'new_follower', 'story_featured', 'biography_commented',
    'post_liked', 'post_commented',
    'system_announcement'
  )),
  actor_id TEXT,
  target_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 2: 複製現有資料
INSERT INTO notifications_new (id, user_id, type, actor_id, target_id, title, message, is_read, created_at)
SELECT id, user_id, type, actor_id, target_id, title, message, is_read, created_at
FROM notifications;

-- Step 3: 刪除舊表
DROP TABLE notifications;

-- Step 4: 重命名新表
ALTER TABLE notifications_new RENAME TO notifications;

-- Step 5: 重建索引
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
