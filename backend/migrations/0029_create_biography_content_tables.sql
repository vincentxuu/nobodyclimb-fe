-- ═══════════════════════════════════════════════════════════
-- Migration: Create biography content independent tables
-- Description:
--   - biography_one_liners: 一句話系列（從 JSON 欄位獨立出來）
--   - biography_stories: 小故事（從 JSON 欄位獨立出來）
--   - 各自的 likes 和 comments 表
-- ═══════════════════════════════════════════════════════════

-- ============================================
-- 一句話系列表
-- ============================================
CREATE TABLE IF NOT EXISTS biography_one_liners (
  id TEXT PRIMARY KEY,
  biography_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  question_text TEXT,
  answer TEXT NOT NULL,
  source TEXT DEFAULT 'system' CHECK (source IN ('system', 'user')),
  display_order INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (biography_id) REFERENCES biographies(id) ON DELETE CASCADE,
  UNIQUE (biography_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_one_liners_biography ON biography_one_liners(biography_id);
CREATE INDEX IF NOT EXISTS idx_one_liners_popular ON biography_one_liners(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_one_liners_featured ON biography_one_liners(is_featured) WHERE is_featured = 1;

-- ============================================
-- 小故事表
-- ============================================
CREATE TABLE IF NOT EXISTS biography_stories (
  id TEXT PRIMARY KEY,
  biography_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  question_text TEXT,
  category_id TEXT,
  content TEXT NOT NULL,
  source TEXT DEFAULT 'system' CHECK (source IN ('system', 'user')),
  display_order INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (biography_id) REFERENCES biographies(id) ON DELETE CASCADE,
  UNIQUE (biography_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_stories_biography ON biography_stories(biography_id);
CREATE INDEX IF NOT EXISTS idx_stories_category ON biography_stories(category_id);
CREATE INDEX IF NOT EXISTS idx_stories_popular ON biography_stories(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_stories_featured ON biography_stories(is_featured) WHERE is_featured = 1;

-- ============================================
-- 一句話按讚表
-- ============================================
CREATE TABLE IF NOT EXISTS one_liner_likes (
  id TEXT PRIMARY KEY,
  one_liner_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (one_liner_id) REFERENCES biography_one_liners(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (one_liner_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_one_liner_likes_item ON one_liner_likes(one_liner_id);
CREATE INDEX IF NOT EXISTS idx_one_liner_likes_user ON one_liner_likes(user_id);

-- ============================================
-- 一句話留言表
-- ============================================
CREATE TABLE IF NOT EXISTS one_liner_comments (
  id TEXT PRIMARY KEY,
  one_liner_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id TEXT,
  like_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (one_liner_id) REFERENCES biography_one_liners(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES one_liner_comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_one_liner_comments_item ON one_liner_comments(one_liner_id);
CREATE INDEX IF NOT EXISTS idx_one_liner_comments_user ON one_liner_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_one_liner_comments_parent ON one_liner_comments(parent_id);

-- ============================================
-- 小故事按讚表
-- ============================================
CREATE TABLE IF NOT EXISTS story_likes (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (story_id) REFERENCES biography_stories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_story_likes_item ON story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_user ON story_likes(user_id);

-- ============================================
-- 小故事留言表
-- ============================================
CREATE TABLE IF NOT EXISTS story_comments (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id TEXT,
  like_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (story_id) REFERENCES biography_stories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES story_comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_story_comments_item ON story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_user ON story_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_parent ON story_comments(parent_id);
