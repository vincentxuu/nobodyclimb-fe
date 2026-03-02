-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Biography Cleanup and Data Migration (Part 7 of 7) - v2 Safe Version
-- Description: Cleanup biography table and migrate JSON data to relational tables
-- Changes from v1: Added better error handling for malformed JSON
-- ═══════════════════════════════════════════════════════════════════════════

-- ============================================
-- PART 1: Update Biography Slugs
-- ============================================

-- Update biography slug to use username
UPDATE biographies
SET slug = (
  SELECT username FROM users WHERE users.id = biographies.user_id
),
updated_at = datetime('now')
WHERE user_id IS NOT NULL
AND user_id IN (SELECT id FROM users);

-- Ensure all biographies have a slug (fallback)
UPDATE biographies
SET slug = LOWER(REPLACE(name, ' ', '-')) || '-' || SUBSTR(id, 1, 8),
    updated_at = datetime('now')
WHERE slug IS NULL OR TRIM(slug) = '';

-- Migrate visibility: is_public to visibility column
UPDATE biographies
SET visibility = CASE
  WHEN is_public = 1 THEN 'public'
  ELSE 'private'
END
WHERE visibility IS NULL OR visibility NOT IN ('private', 'public', 'unlisted');

-- ============================================
-- PART 2: Rebuild Biographies Table
-- ============================================

CREATE TABLE biographies_new (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT,
  bio TEXT,
  avatar_url TEXT,
  cover_image TEXT,
  -- Visibility (replaces is_public)
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'unlisted')),
  -- Metadata
  achievements TEXT,
  social_links TEXT,
  tags_data TEXT,
  basic_info_data TEXT,
  -- Keep JSON data fields as backup (migrated to relational tables)
  one_liners_data TEXT,
  stories_data TEXT,
  -- Media integration
  youtube_channel_id TEXT,
  featured_video_id TEXT,
  -- Statistics
  total_likes INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  -- Status
  is_featured INTEGER DEFAULT 0,
  published_at TEXT,
  autosave_at TEXT,
  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Copy data from old table
INSERT INTO biographies_new (
  id, user_id, name, slug, title, bio, avatar_url, cover_image,
  visibility,
  achievements, social_links, tags_data, basic_info_data,
  one_liners_data, stories_data,
  youtube_channel_id, featured_video_id,
  total_likes, total_views, follower_count, comment_count,
  is_featured, published_at, autosave_at,
  created_at, updated_at
)
SELECT
  b.id, b.user_id, b.name, b.slug, b.title, b.bio, b.avatar_url, b.cover_image,
  CASE
    WHEN b.visibility IN ('private', 'public', 'unlisted') THEN b.visibility
    WHEN b.is_public = 1 THEN 'public'
    ELSE 'private'
  END,
  b.achievements, b.social_links, b.tags_data, b.basic_info_data,
  b.one_liners_data, b.stories_data,
  b.youtube_channel_id, b.featured_video_id,
  COALESCE(b.total_likes, 0), COALESCE(b.total_views, 0),
  COALESCE(b.follower_count, 0), COALESCE(b.comment_count, 0),
  b.is_featured, b.published_at, b.autosave_at,
  b.created_at, b.updated_at
FROM biographies b;

-- Drop old table and rename
DROP TABLE biographies;
ALTER TABLE biographies_new RENAME TO biographies;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_biographies_slug ON biographies(slug);
CREATE INDEX IF NOT EXISTS idx_biographies_user ON biographies(user_id);
CREATE INDEX IF NOT EXISTS idx_biographies_visibility ON biographies(visibility) WHERE visibility = 'public';
CREATE INDEX IF NOT EXISTS idx_biographies_featured ON biographies(is_featured) WHERE is_featured = 1;

-- ============================================
-- PART 3: Migrate JSON Data to Relational Tables (Safe Version)
-- Skip any biographies with malformed or empty JSON data
-- ============================================

-- Migrate core stories (from one_liners_data)
-- Only process biographies where one_liners_data is valid JSON and not empty
INSERT OR IGNORE INTO biography_core_stories (id, biography_id, question_id, content, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  b.id,
  'climbing_origin',
  json_extract(b.one_liners_data, '$.climbing_origin.answer'),
  COALESCE(b.created_at, datetime('now')),
  COALESCE(b.updated_at, datetime('now'))
FROM biographies b
WHERE b.one_liners_data IS NOT NULL
  AND json_valid(b.one_liners_data)
  AND LENGTH(TRIM(b.one_liners_data)) > 2
  AND json_extract(b.one_liners_data, '$.climbing_origin.answer') IS NOT NULL
  AND LENGTH(TRIM(json_extract(b.one_liners_data, '$.climbing_origin.answer'))) > 0;

INSERT OR IGNORE INTO biography_core_stories (id, biography_id, question_id, content, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  b.id,
  'climbing_meaning',
  json_extract(b.one_liners_data, '$.climbing_meaning.answer'),
  COALESCE(b.created_at, datetime('now')),
  COALESCE(b.updated_at, datetime('now'))
FROM biographies b
WHERE b.one_liners_data IS NOT NULL
  AND json_valid(b.one_liners_data)
  AND LENGTH(TRIM(b.one_liners_data)) > 2
  AND json_extract(b.one_liners_data, '$.climbing_meaning.answer') IS NOT NULL
  AND LENGTH(TRIM(json_extract(b.one_liners_data, '$.climbing_meaning.answer'))) > 0;

INSERT OR IGNORE INTO biography_core_stories (id, biography_id, question_id, content, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  b.id,
  'advice_to_self',
  json_extract(b.one_liners_data, '$.advice_to_self.answer'),
  COALESCE(b.created_at, datetime('now')),
  COALESCE(b.updated_at, datetime('now'))
FROM biographies b
WHERE b.one_liners_data IS NOT NULL
  AND json_valid(b.one_liners_data)
  AND LENGTH(TRIM(b.one_liners_data)) > 2
  AND json_extract(b.one_liners_data, '$.advice_to_self.answer') IS NOT NULL
  AND LENGTH(TRIM(json_extract(b.one_liners_data, '$.advice_to_self.answer'))) > 0;

-- Note: Skipping one-liners and stories migration for now due to complexity
-- These can be migrated manually or in a follow-up migration
-- The JSON data is preserved in one_liners_data and stories_data columns
