-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Notifications System (Part 4 of 7)
-- Description: Enhanced notifications table and preferences
-- ═══════════════════════════════════════════════════════════════════════════

-- ============================================
-- PART 1: Enhanced Notifications Table
-- ============================================

CREATE TABLE IF NOT EXISTS notifications_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  -- Supported notification types:
  -- Goal: goal_completed, goal_liked, goal_commented, goal_referenced
  -- Social: new_follower
  -- Biography: biography_liked, biography_commented
  -- Posts: post_liked, post_commented
  -- Biography content: core_story_liked, core_story_commented, one_liner_liked, one_liner_commented, story_liked, story_commented
  -- System: story_featured, system_announcement
  type TEXT NOT NULL CHECK (type IN (
    'goal_completed', 'goal_liked', 'goal_commented', 'goal_referenced',
    'new_follower',
    'biography_liked', 'biography_commented',
    'post_liked', 'post_commented',
    'core_story_liked', 'core_story_commented',
    'one_liner_liked', 'one_liner_commented',
    'story_liked', 'story_commented',
    'story_featured', 'system_announcement'
  )),
  actor_id TEXT,
  target_id TEXT,
  title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Copy existing data (only notifications with valid user_id)
INSERT INTO notifications_new (id, user_id, type, actor_id, target_id, title, message, is_read, created_at)
SELECT n.id, n.user_id, n.type, n.actor_id, n.target_id,
       COALESCE(n.title, ''), COALESCE(n.message, ''), n.is_read, n.created_at
FROM notifications n
INNER JOIN users u ON n.user_id = u.id;

DROP TABLE notifications;
ALTER TABLE notifications_new RENAME TO notifications;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = 0;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ============================================
-- PART 2: Notification Preferences Table
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id TEXT PRIMARY KEY,

  -- Interaction Notifications
  goal_liked INTEGER NOT NULL DEFAULT 1,
  goal_commented INTEGER NOT NULL DEFAULT 1,
  goal_referenced INTEGER NOT NULL DEFAULT 1,
  post_liked INTEGER NOT NULL DEFAULT 1,
  post_commented INTEGER NOT NULL DEFAULT 1,
  biography_liked INTEGER NOT NULL DEFAULT 1,
  biography_commented INTEGER NOT NULL DEFAULT 1,

  -- Biography Content Interactions
  core_story_liked INTEGER NOT NULL DEFAULT 1,
  core_story_commented INTEGER NOT NULL DEFAULT 1,
  one_liner_liked INTEGER NOT NULL DEFAULT 1,
  one_liner_commented INTEGER NOT NULL DEFAULT 1,
  story_liked INTEGER NOT NULL DEFAULT 1,
  story_commented INTEGER NOT NULL DEFAULT 1,

  -- Social Notifications
  new_follower INTEGER NOT NULL DEFAULT 1,

  -- System Notifications
  story_featured INTEGER NOT NULL DEFAULT 1,
  goal_completed INTEGER NOT NULL DEFAULT 1,

  -- Notification Methods
  email_digest INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create default preferences for existing users
INSERT OR IGNORE INTO notification_preferences (user_id)
SELECT id FROM users;
