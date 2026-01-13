-- ═══════════════════════════════════════════════════════════
-- Migration: Create bucket list tables
-- Description: Creates bucket_list_items table for structured goal tracking
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bucket_list_items (
  id TEXT PRIMARY KEY,
  biography_id TEXT NOT NULL,

  -- 基本內容
  title TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  description TEXT,
  target_grade TEXT,
  target_location TEXT,
  target_date TEXT,

  -- 狀態
  status TEXT DEFAULT 'active',  -- active, completed, archived
  completed_at TEXT,

  -- 進度追蹤
  enable_progress INTEGER DEFAULT 0,
  progress_mode TEXT,  -- manual, milestone
  progress INTEGER DEFAULT 0,
  milestones TEXT,  -- JSON array of Milestone objects

  -- 完成故事
  completion_story TEXT,
  psychological_insights TEXT,
  technical_insights TEXT,
  completion_media TEXT,  -- JSON object with youtube_videos, instagram_posts, photos

  -- 社群
  is_public INTEGER DEFAULT 1,
  likes_count INTEGER DEFAULT 0,
  inspired_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  -- 其他
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (biography_id) REFERENCES biographies(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_bucket_list_biography ON bucket_list_items(biography_id);
CREATE INDEX IF NOT EXISTS idx_bucket_list_status ON bucket_list_items(status);
CREATE INDEX IF NOT EXISTS idx_bucket_list_public ON bucket_list_items(is_public);
CREATE INDEX IF NOT EXISTS idx_bucket_list_category ON bucket_list_items(category);
CREATE INDEX IF NOT EXISTS idx_bucket_list_location ON bucket_list_items(target_location);
CREATE INDEX IF NOT EXISTS idx_bucket_list_created ON bucket_list_items(created_at);
