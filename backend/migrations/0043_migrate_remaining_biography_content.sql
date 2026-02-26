-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Migrate Remaining Biography Content
-- Description: Migrate stories and one-liners from JSON columns to relational tables
-- This completes the migration that was skipped in 0033 due to complexity
-- ═══════════════════════════════════════════════════════════════════════════

-- ============================================
-- PART 1: Migrate Stories from stories_data JSON
-- ============================================

-- Insert stories directly from JSON into biography_stories table
INSERT OR IGNORE INTO biography_stories (
  id,
  biography_id,
  question_id,
  content,
  category_id,
  source,
  character_count,
  created_at,
  updated_at
)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' ||
    substr(lower(hex(randomblob(2))),2) || '-' ||
    substr('89ab',abs(random()) % 4 + 1, 1) ||
    substr(lower(hex(randomblob(2))),2) || '-' ||
    lower(hex(randomblob(6))) as id,
  b.id as biography_id,
  story.key as question_id,
  json_extract(story.value, '$.answer') as content,
  'uncategorized' as category_id,
  'system' as source,
  LENGTH(json_extract(story.value, '$.answer')) as character_count,
  COALESCE(b.created_at, datetime('now')) as created_at,
  COALESCE(json_extract(story.value, '$.updated_at'), b.created_at, datetime('now')) as updated_at
FROM biographies b,
  json_each(json_extract(b.stories_data, '$.uncategorized')) as story
WHERE b.stories_data IS NOT NULL
  AND json_valid(b.stories_data)
  AND json_extract(story.value, '$.answer') IS NOT NULL
  AND LENGTH(TRIM(json_extract(story.value, '$.answer'))) > 0
  AND json_extract(story.value, '$.visibility') = 'public';  -- Only migrate public stories

-- ============================================
-- PART 2: Migrate One-liners from one_liners_data JSON
-- (Excluding core stories which are already migrated)
-- ============================================

-- Core story question IDs that should be skipped
-- (already migrated to biography_core_stories)
-- climbing_origin, climbing_meaning, advice_to_self

-- Insert one-liners directly from JSON into biography_one_liners table
INSERT OR IGNORE INTO biography_one_liners (
  id,
  biography_id,
  question_id,
  answer,
  source,
  created_at,
  updated_at
)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' ||
    substr(lower(hex(randomblob(2))),2) || '-' ||
    substr('89ab',abs(random()) % 4 + 1, 1) ||
    substr(lower(hex(randomblob(2))),2) || '-' ||
    lower(hex(randomblob(6))) as id,
  b.id as biography_id,
  oneliner.key as question_id,
  json_extract(oneliner.value, '$.answer') as answer,
  'system' as source,
  COALESCE(b.created_at, datetime('now')) as created_at,
  COALESCE(b.created_at, datetime('now')) as updated_at
FROM biographies b,
  json_each(b.one_liners_data) as oneliner
WHERE b.one_liners_data IS NOT NULL
  AND json_valid(b.one_liners_data)
  AND json_extract(oneliner.value, '$.answer') IS NOT NULL
  AND LENGTH(TRIM(json_extract(oneliner.value, '$.answer'))) > 0
  AND json_extract(oneliner.value, '$.visibility') = 'public'  -- Only migrate public one-liners
  -- Exclude core stories (already migrated to biography_core_stories)
  AND oneliner.key NOT IN ('climbing_origin', 'climbing_meaning', 'advice_to_self');

-- ============================================
-- PART 3: Verify Migration Results
-- ============================================

-- Log migration results (for debugging)
-- SELECT
--   'Stories migrated:' as label,
--   COUNT(*) as count
-- FROM biography_stories;

-- SELECT
--   'One-liners migrated:' as label,
--   COUNT(*) as count
-- FROM biography_one_liners;

-- SELECT
--   'Core stories (existing):' as label,
--   COUNT(*) as count
-- FROM biography_core_stories;
