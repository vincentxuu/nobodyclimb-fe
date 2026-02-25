-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Biography Content Tables (Part 6 of 7)
-- Description: Create tables for biography content (core stories, one-liners, stories)
-- ═══════════════════════════════════════════════════════════════════════════

-- ============================================
-- Core Stories Table (3 required questions)
-- ============================================

CREATE TABLE IF NOT EXISTS biography_core_stories (
  id TEXT PRIMARY KEY,
  biography_id TEXT NOT NULL,
  question_id TEXT NOT NULL CHECK (question_id IN ('climbing_origin', 'climbing_meaning', 'advice_to_self')),
  content TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_hidden INTEGER DEFAULT 0,
  hidden_reason TEXT,
  hidden_by TEXT,
  hidden_at TEXT,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (biography_id) REFERENCES biographies(id) ON DELETE CASCADE,
  FOREIGN KEY (hidden_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE (biography_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_core_stories_biography ON biography_core_stories(biography_id);
CREATE INDEX IF NOT EXISTS idx_core_stories_question ON biography_core_stories(question_id);
CREATE INDEX IF NOT EXISTS idx_core_stories_popular ON biography_core_stories(like_count DESC);

-- ============================================
-- One-liners Table
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
  is_hidden INTEGER DEFAULT 0,
  hidden_reason TEXT,
  hidden_by TEXT,
  hidden_at TEXT,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (biography_id) REFERENCES biographies(id) ON DELETE CASCADE,
  FOREIGN KEY (hidden_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE (biography_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_one_liners_biography ON biography_one_liners(biography_id);
CREATE INDEX IF NOT EXISTS idx_one_liners_popular ON biography_one_liners(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_one_liners_featured ON biography_one_liners(is_featured) WHERE is_featured = 1;
CREATE INDEX IF NOT EXISTS idx_one_liners_hidden ON biography_one_liners(is_hidden) WHERE is_hidden = 1;

-- ============================================
-- Stories Table
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
  is_hidden INTEGER DEFAULT 0,
  hidden_reason TEXT,
  hidden_by TEXT,
  hidden_at TEXT,
  character_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (biography_id) REFERENCES biographies(id) ON DELETE CASCADE,
  FOREIGN KEY (hidden_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE (biography_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_stories_biography ON biography_stories(biography_id);
CREATE INDEX IF NOT EXISTS idx_stories_category ON biography_stories(category_id);
CREATE INDEX IF NOT EXISTS idx_stories_popular ON biography_stories(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_stories_featured ON biography_stories(is_featured) WHERE is_featured = 1;
CREATE INDEX IF NOT EXISTS idx_stories_hidden ON biography_stories(is_hidden) WHERE is_hidden = 1;

-- ============================================
-- Universal Interactions - Likes Table
-- ============================================

CREATE TABLE IF NOT EXISTS likes_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (
    entity_type IN (
      'biography', 'post', 'bucket_list_item',
      'core_story', 'one_liner', 'story',
      'gallery', 'video', 'gym', 'crag', 'route'
    )
  ),
  entity_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, entity_type, entity_id)
);

-- Migrate existing likes data
INSERT INTO likes_new (id, user_id, entity_type, entity_id, created_at)
SELECT id, user_id, entity_type, entity_id, created_at
FROM likes
WHERE entity_type IN ('post', 'gallery', 'video', 'gym', 'crag');

-- Migrate biography_likes to unified likes table
INSERT OR IGNORE INTO likes_new (id, user_id, entity_type, entity_id, created_at)
SELECT id, user_id, 'biography', biography_id, created_at
FROM biography_likes;

-- Migrate bucket_list_likes to unified likes table
INSERT OR IGNORE INTO likes_new (id, user_id, entity_type, entity_id, created_at)
SELECT id, user_id, 'bucket_list_item', bucket_list_item_id, created_at
FROM bucket_list_likes;

-- Replace old likes table
DROP TABLE likes;
ALTER TABLE likes_new RENAME TO likes;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_likes_entity ON likes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_created ON likes(created_at DESC);

-- ============================================
-- Universal Interactions - Comments Table
-- ============================================

CREATE TABLE IF NOT EXISTS comments_new2 (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (
    entity_type IN (
      'biography', 'post', 'bucket_list_item',
      'core_story', 'one_liner', 'story',
      'gallery', 'video', 'gym', 'crag', 'route'
    )
  ),
  entity_id TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id TEXT,
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  is_hidden INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments_new2(id) ON DELETE CASCADE
);

-- Migrate existing comments data
INSERT INTO comments_new2 (id, user_id, entity_type, entity_id, content, parent_id, created_at, updated_at)
SELECT
  id, user_id, entity_type, entity_id, content, parent_id,
  created_at, updated_at
FROM comments
WHERE entity_type IN ('post', 'gallery', 'video', 'biography');

-- Migrate bucket_list_comments to unified comments table
INSERT OR IGNORE INTO comments_new2 (id, user_id, entity_type, entity_id, content, created_at, updated_at)
SELECT
  id, user_id, 'bucket_list_item', bucket_list_item_id, content,
  created_at, created_at
FROM bucket_list_comments;

-- Replace old comments table
DROP TABLE comments;
ALTER TABLE comments_new2 RENAME TO comments;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);
