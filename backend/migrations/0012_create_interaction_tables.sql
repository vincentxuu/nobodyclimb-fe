-- ═══════════════════════════════════════════════════════════
-- Migration: Create social interaction tables
-- Description: Creates tables for likes, comments, references, follows, notifications
-- ═══════════════════════════════════════════════════════════

-- 人生清單按讚表
CREATE TABLE IF NOT EXISTS bucket_list_likes (
  id TEXT PRIMARY KEY,
  bucket_list_item_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (bucket_list_item_id) REFERENCES bucket_list_items(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(bucket_list_item_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_bucket_list_likes_item ON bucket_list_likes(bucket_list_item_id);
CREATE INDEX IF NOT EXISTS idx_bucket_list_likes_user ON bucket_list_likes(user_id);

-- 人生清單留言表
CREATE TABLE IF NOT EXISTS bucket_list_comments (
  id TEXT PRIMARY KEY,
  bucket_list_item_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (bucket_list_item_id) REFERENCES bucket_list_items(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bucket_list_comments_item ON bucket_list_comments(bucket_list_item_id);
CREATE INDEX IF NOT EXISTS idx_bucket_list_comments_user ON bucket_list_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_bucket_list_comments_created ON bucket_list_comments(created_at);

-- 目標參考表（我也想做）
CREATE TABLE IF NOT EXISTS bucket_list_references (
  id TEXT PRIMARY KEY,
  source_item_id TEXT NOT NULL,
  target_biography_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (source_item_id) REFERENCES bucket_list_items(id) ON DELETE CASCADE,
  FOREIGN KEY (target_biography_id) REFERENCES biographies(id) ON DELETE CASCADE,
  UNIQUE(source_item_id, target_biography_id)
);

CREATE INDEX IF NOT EXISTS idx_bucket_list_refs_source ON bucket_list_references(source_item_id);
CREATE INDEX IF NOT EXISTS idx_bucket_list_refs_target ON bucket_list_references(target_biography_id);

-- 追蹤表
CREATE TABLE IF NOT EXISTS follows (
  id TEXT PRIMARY KEY,
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('goal_completed', 'goal_liked', 'goal_commented', 'goal_referenced', 'new_follower', 'story_featured')),
  actor_id TEXT,
  target_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
