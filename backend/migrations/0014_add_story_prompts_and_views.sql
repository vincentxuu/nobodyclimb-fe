-- ═══════════════════════════════════════════════════════════
-- Migration: Add story prompts tracking and biography views
-- Description: Creates tables for tracking story prompt history,
--              biography views (for explorer badge), and normalized climbing locations
-- ═══════════════════════════════════════════════════════════

-- 故事推題追蹤表
-- Tracks when users are prompted with story questions and their responses
CREATE TABLE IF NOT EXISTS story_prompts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  biography_id TEXT NOT NULL,
  field_name TEXT NOT NULL,           -- 欄位名稱 (e.g., 'memorable_moment')
  category TEXT NOT NULL,             -- 分類 (growth/psychology/community/practical/dreams/life)
  prompted_at TEXT NOT NULL DEFAULT (datetime('now')),  -- 推題時間
  completed_at TEXT,                  -- 完成時間
  dismissed_count INTEGER NOT NULL DEFAULT 0,  -- 跳過次數
  last_dismissed_at TEXT,             -- 最後跳過時間

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (biography_id) REFERENCES biographies(id) ON DELETE CASCADE,
  UNIQUE(biography_id, field_name)
);

CREATE INDEX IF NOT EXISTS idx_story_prompts_user ON story_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_story_prompts_biography ON story_prompts(biography_id);
CREATE INDEX IF NOT EXISTS idx_story_prompts_field ON story_prompts(field_name);
CREATE INDEX IF NOT EXISTS idx_story_prompts_prompted ON story_prompts(prompted_at);

-- 人物誌瀏覽記錄表
-- Tracks which biographies a user has viewed (for explorer badge)
CREATE TABLE IF NOT EXISTS biography_views (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,              -- 誰瀏覽
  biography_id TEXT NOT NULL,         -- 被瀏覽的人物誌
  view_count INTEGER NOT NULL DEFAULT 1,  -- 瀏覽次數
  first_viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_viewed_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (biography_id) REFERENCES biographies(id) ON DELETE CASCADE,
  UNIQUE(user_id, biography_id)
);

CREATE INDEX IF NOT EXISTS idx_biography_views_user ON biography_views(user_id);
CREATE INDEX IF NOT EXISTS idx_biography_views_biography ON biography_views(biography_id);
CREATE INDEX IF NOT EXISTS idx_biography_views_last ON biography_views(last_viewed_at);

-- 攀岩足跡表（正規化）
-- Normalized climbing locations table
CREATE TABLE IF NOT EXISTS climbing_locations (
  id TEXT PRIMARY KEY,
  biography_id TEXT NOT NULL,
  location TEXT NOT NULL,             -- 地點名稱
  country TEXT NOT NULL,              -- 國家
  visit_year TEXT,                    -- 造訪年份
  notes TEXT,                         -- 心得筆記
  photos TEXT,                        -- 照片 JSON array
  is_public INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (biography_id) REFERENCES biographies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_climbing_locations_biography ON climbing_locations(biography_id);
CREATE INDEX IF NOT EXISTS idx_climbing_locations_location ON climbing_locations(location);
CREATE INDEX IF NOT EXISTS idx_climbing_locations_country ON climbing_locations(country);
CREATE INDEX IF NOT EXISTS idx_climbing_locations_public ON climbing_locations(is_public);
