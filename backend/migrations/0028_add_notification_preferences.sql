-- ═══════════════════════════════════════════════════════════
-- Migration: Add notification preferences table
-- Description: Allows users to customize which notifications they receive
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id TEXT PRIMARY KEY,

  -- 互動通知
  goal_liked BOOLEAN NOT NULL DEFAULT 1,
  goal_commented BOOLEAN NOT NULL DEFAULT 1,
  goal_referenced BOOLEAN NOT NULL DEFAULT 1,
  post_liked BOOLEAN NOT NULL DEFAULT 1,
  post_commented BOOLEAN NOT NULL DEFAULT 1,
  biography_commented BOOLEAN NOT NULL DEFAULT 1,

  -- 社交通知
  new_follower BOOLEAN NOT NULL DEFAULT 1,

  -- 系統通知
  story_featured BOOLEAN NOT NULL DEFAULT 1,
  goal_completed BOOLEAN NOT NULL DEFAULT 1,

  -- 通知方式
  email_digest BOOLEAN NOT NULL DEFAULT 0,  -- 每日 Email 摘要

  -- 時間戳記
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 為已存在的用戶創建預設偏好設定
INSERT OR IGNORE INTO notification_preferences (user_id)
SELECT id FROM users;
