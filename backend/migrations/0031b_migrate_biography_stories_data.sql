-- ═══════════════════════════════════════════════════════════
-- Migration: Migrate JSON data to separate tables
-- Description:
--   Migrate data from JSON columns to independent tables:
--   - one_liners_data → biography_core_stories / biography_one_liners
--   - stories_data → biography_stories
--   This must run BEFORE 0032_cleanup_biography_redundant_columns.sql
-- ═══════════════════════════════════════════════════════════

-- ============================================
-- Migrate one_liners_data JSON to biography_core_stories
-- Core stories: climbing_origin, climbing_meaning, advice_to_self
-- ============================================

-- climbing_origin
INSERT INTO biography_core_stories (id, biography_id, question_id, content, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  b.id,
  'climbing_origin',
  json_extract(b.one_liners_data, '$.climbing_origin.answer'),
  COALESCE(b.created_at, datetime('now')),
  COALESCE(b.updated_at, datetime('now'))
FROM biographies b
WHERE b.one_liners_data IS NOT NULL
  AND json_extract(b.one_liners_data, '$.climbing_origin.answer') IS NOT NULL
  AND TRIM(json_extract(b.one_liners_data, '$.climbing_origin.answer')) != ''
  AND NOT EXISTS (
    SELECT 1 FROM biography_core_stories
    WHERE biography_id = b.id AND question_id = 'climbing_origin'
  );

-- climbing_meaning
INSERT INTO biography_core_stories (id, biography_id, question_id, content, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  b.id,
  'climbing_meaning',
  json_extract(b.one_liners_data, '$.climbing_meaning.answer'),
  COALESCE(b.created_at, datetime('now')),
  COALESCE(b.updated_at, datetime('now'))
FROM biographies b
WHERE b.one_liners_data IS NOT NULL
  AND json_extract(b.one_liners_data, '$.climbing_meaning.answer') IS NOT NULL
  AND TRIM(json_extract(b.one_liners_data, '$.climbing_meaning.answer')) != ''
  AND NOT EXISTS (
    SELECT 1 FROM biography_core_stories
    WHERE biography_id = b.id AND question_id = 'climbing_meaning'
  );

-- advice_to_self
INSERT INTO biography_core_stories (id, biography_id, question_id, content, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  b.id,
  'advice_to_self',
  json_extract(b.one_liners_data, '$.advice_to_self.answer'),
  COALESCE(b.created_at, datetime('now')),
  COALESCE(b.updated_at, datetime('now'))
FROM biographies b
WHERE b.one_liners_data IS NOT NULL
  AND json_extract(b.one_liners_data, '$.advice_to_self.answer') IS NOT NULL
  AND TRIM(json_extract(b.one_liners_data, '$.advice_to_self.answer')) != ''
  AND NOT EXISTS (
    SELECT 1 FROM biography_core_stories
    WHERE biography_id = b.id AND question_id = 'advice_to_self'
  );

-- ============================================
-- Migrate one_liners_data JSON to biography_one_liners
-- (non-core questions using json_each)
-- ============================================
INSERT INTO biography_one_liners (id, biography_id, question_id, answer, source, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  b.id,
  j.key,
  json_extract(j.value, '$.answer'),
  'system',
  COALESCE(b.created_at, datetime('now')),
  COALESCE(b.updated_at, datetime('now'))
FROM biographies b, json_each(b.one_liners_data) j
WHERE b.one_liners_data IS NOT NULL
  AND json_valid(b.one_liners_data)
  AND j.key NOT IN ('climbing_origin', 'climbing_meaning', 'advice_to_self')
  AND json_extract(j.value, '$.answer') IS NOT NULL
  AND TRIM(json_extract(j.value, '$.answer')) != ''
  AND NOT EXISTS (
    SELECT 1 FROM biography_one_liners
    WHERE biography_id = b.id AND question_id = j.key
  );

-- ============================================
-- Migrate stories_data JSON to biography_stories
-- Format: { category: { question_id: { answer, visibility } } }
-- ============================================

-- Create temp table to flatten nested JSON
CREATE TEMP TABLE IF NOT EXISTS temp_stories_flat AS
SELECT
  b.id as biography_id,
  cat.key as category_id,
  q.key as question_id,
  json_extract(q.value, '$.answer') as content,
  b.created_at,
  b.updated_at
FROM biographies b,
  json_each(b.stories_data) cat,
  json_each(cat.value) q
WHERE b.stories_data IS NOT NULL
  AND json_valid(b.stories_data)
  AND json_extract(q.value, '$.answer') IS NOT NULL
  AND TRIM(json_extract(q.value, '$.answer')) != '';

-- Insert from temp table
INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, source, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  t.biography_id,
  t.question_id,
  CASE WHEN t.category_id = 'uncategorized' THEN NULL ELSE t.category_id END,
  t.content,
  'system',
  LENGTH(t.content),
  COALESCE(t.created_at, datetime('now')),
  COALESCE(t.updated_at, datetime('now'))
FROM temp_stories_flat t
WHERE NOT EXISTS (
  SELECT 1 FROM biography_stories
  WHERE biography_id = t.biography_id AND question_id = t.question_id
);

-- Clean up temp table
DROP TABLE IF EXISTS temp_stories_flat;

-- ============================================
-- Migrate visibility: is_public to visibility column
-- ============================================
UPDATE biographies
SET visibility = 'public'
WHERE visibility IS NULL AND is_public = 1;

UPDATE biographies
SET visibility = 'private'
WHERE visibility IS NULL AND (is_public = 0 OR is_public IS NULL);
