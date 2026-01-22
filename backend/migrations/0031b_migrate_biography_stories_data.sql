-- ═══════════════════════════════════════════════════════════
-- Migration: Migrate biography stories data to new tables
-- Description:
--   Migrate data from biographies table columns to independent tables:
--   - Core stories (climbing_origin, climbing_meaning, advice_to_self)
--     → biography_core_stories
--   - Advanced stories (31 fields) → biography_stories
--   This must run BEFORE 0032_cleanup_biography_redundant_columns.sql
-- ═══════════════════════════════════════════════════════════

-- ============================================
-- Migrate core stories to biography_core_stories
-- ============================================

-- climbing_origin
INSERT INTO biography_core_stories (id, biography_id, question_id, content, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id,
  'climbing_origin',
  climbing_origin,
  COALESCE(created_at, datetime('now')),
  COALESCE(updated_at, datetime('now'))
FROM biographies
WHERE climbing_origin IS NOT NULL AND TRIM(climbing_origin) != ''
  AND NOT EXISTS (
    SELECT 1 FROM biography_core_stories
    WHERE biography_id = biographies.id AND question_id = 'climbing_origin'
  );

-- climbing_meaning
INSERT INTO biography_core_stories (id, biography_id, question_id, content, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id,
  'climbing_meaning',
  climbing_meaning,
  COALESCE(created_at, datetime('now')),
  COALESCE(updated_at, datetime('now'))
FROM biographies
WHERE climbing_meaning IS NOT NULL AND TRIM(climbing_meaning) != ''
  AND NOT EXISTS (
    SELECT 1 FROM biography_core_stories
    WHERE biography_id = biographies.id AND question_id = 'climbing_meaning'
  );

-- advice_to_self
INSERT INTO biography_core_stories (id, biography_id, question_id, content, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id,
  'advice_to_self',
  advice_to_self,
  COALESCE(created_at, datetime('now')),
  COALESCE(updated_at, datetime('now'))
FROM biographies
WHERE advice_to_self IS NOT NULL AND TRIM(advice_to_self) != ''
  AND NOT EXISTS (
    SELECT 1 FROM biography_core_stories
    WHERE biography_id = biographies.id AND question_id = 'advice_to_self'
  );

-- ============================================
-- Migrate advanced stories to biography_stories
-- ============================================

-- Level 3A: Growth & Breakthrough
INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'memorable_moment', 'growth_breakthrough', memorable_moment, LENGTH(memorable_moment),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE memorable_moment IS NOT NULL AND TRIM(memorable_moment) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'memorable_moment');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'biggest_challenge', 'growth_breakthrough', biggest_challenge, LENGTH(biggest_challenge),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE biggest_challenge IS NOT NULL AND TRIM(biggest_challenge) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'biggest_challenge');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'breakthrough_story', 'growth_breakthrough', breakthrough_story, LENGTH(breakthrough_story),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE breakthrough_story IS NOT NULL AND TRIM(breakthrough_story) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'breakthrough_story');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'first_outdoor', 'growth_breakthrough', first_outdoor, LENGTH(first_outdoor),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE first_outdoor IS NOT NULL AND TRIM(first_outdoor) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'first_outdoor');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'first_grade', 'growth_breakthrough', first_grade, LENGTH(first_grade),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE first_grade IS NOT NULL AND TRIM(first_grade) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'first_grade');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'frustrating_climb', 'growth_breakthrough', frustrating_climb, LENGTH(frustrating_climb),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE frustrating_climb IS NOT NULL AND TRIM(frustrating_climb) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'frustrating_climb');

-- Level 3B: Psychology & Philosophy
INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'fear_management', 'psychology_philosophy', fear_management, LENGTH(fear_management),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE fear_management IS NOT NULL AND TRIM(fear_management) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'fear_management');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'climbing_lesson', 'psychology_philosophy', climbing_lesson, LENGTH(climbing_lesson),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE climbing_lesson IS NOT NULL AND TRIM(climbing_lesson) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'climbing_lesson');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'failure_perspective', 'psychology_philosophy', failure_perspective, LENGTH(failure_perspective),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE failure_perspective IS NOT NULL AND TRIM(failure_perspective) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'failure_perspective');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'flow_moment', 'psychology_philosophy', flow_moment, LENGTH(flow_moment),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE flow_moment IS NOT NULL AND TRIM(flow_moment) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'flow_moment');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'life_balance', 'psychology_philosophy', life_balance, LENGTH(life_balance),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE life_balance IS NOT NULL AND TRIM(life_balance) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'life_balance');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'unexpected_gain', 'psychology_philosophy', unexpected_gain, LENGTH(unexpected_gain),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE unexpected_gain IS NOT NULL AND TRIM(unexpected_gain) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'unexpected_gain');

-- Level 3C: Community & Connection
INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'climbing_mentor', 'community_connection', climbing_mentor, LENGTH(climbing_mentor),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE climbing_mentor IS NOT NULL AND TRIM(climbing_mentor) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'climbing_mentor');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'climbing_partner', 'community_connection', climbing_partner, LENGTH(climbing_partner),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE climbing_partner IS NOT NULL AND TRIM(climbing_partner) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'climbing_partner');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'funny_moment', 'community_connection', funny_moment, LENGTH(funny_moment),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE funny_moment IS NOT NULL AND TRIM(funny_moment) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'funny_moment');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'favorite_spot', 'community_connection', favorite_spot, LENGTH(favorite_spot),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE favorite_spot IS NOT NULL AND TRIM(favorite_spot) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'favorite_spot');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'advice_to_group', 'community_connection', advice_to_group, LENGTH(advice_to_group),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE advice_to_group IS NOT NULL AND TRIM(advice_to_group) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'advice_to_group');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'climbing_space', 'community_connection', climbing_space, LENGTH(climbing_space),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE climbing_space IS NOT NULL AND TRIM(climbing_space) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'climbing_space');

-- Level 3D: Practical Sharing
INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'injury_recovery', 'practical_sharing', injury_recovery, LENGTH(injury_recovery),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE injury_recovery IS NOT NULL AND TRIM(injury_recovery) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'injury_recovery');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'memorable_route', 'practical_sharing', memorable_route, LENGTH(memorable_route),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE memorable_route IS NOT NULL AND TRIM(memorable_route) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'memorable_route');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'training_method', 'practical_sharing', training_method, LENGTH(training_method),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE training_method IS NOT NULL AND TRIM(training_method) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'training_method');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'effective_practice', 'practical_sharing', effective_practice, LENGTH(effective_practice),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE effective_practice IS NOT NULL AND TRIM(effective_practice) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'effective_practice');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'technique_tip', 'practical_sharing', technique_tip, LENGTH(technique_tip),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE technique_tip IS NOT NULL AND TRIM(technique_tip) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'technique_tip');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'gear_choice', 'practical_sharing', gear_choice, LENGTH(gear_choice),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE gear_choice IS NOT NULL AND TRIM(gear_choice) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'gear_choice');

-- Level 3E: Dreams & Exploration
INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'dream_climb', 'dreams_exploration', dream_climb, LENGTH(dream_climb),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE dream_climb IS NOT NULL AND TRIM(dream_climb) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'dream_climb');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'climbing_trip', 'dreams_exploration', climbing_trip, LENGTH(climbing_trip),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE climbing_trip IS NOT NULL AND TRIM(climbing_trip) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'climbing_trip');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'bucket_list_story', 'dreams_exploration', bucket_list_story, LENGTH(bucket_list_story),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE bucket_list_story IS NOT NULL AND TRIM(bucket_list_story) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'bucket_list_story');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'climbing_goal', 'dreams_exploration', climbing_goal, LENGTH(climbing_goal),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE climbing_goal IS NOT NULL AND TRIM(climbing_goal) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'climbing_goal');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'climbing_style', 'dreams_exploration', climbing_style, LENGTH(climbing_style),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE climbing_style IS NOT NULL AND TRIM(climbing_style) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'climbing_style');

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'climbing_inspiration', 'dreams_exploration', climbing_inspiration, LENGTH(climbing_inspiration),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE climbing_inspiration IS NOT NULL AND TRIM(climbing_inspiration) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'climbing_inspiration');

-- Level 3F: Life Integration
INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, word_count, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 'life_outside_climbing', 'life_integration', life_outside_climbing, LENGTH(life_outside_climbing),
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM biographies WHERE life_outside_climbing IS NOT NULL AND TRIM(life_outside_climbing) != ''
  AND NOT EXISTS (SELECT 1 FROM biography_stories WHERE biography_id = biographies.id AND question_id = 'life_outside_climbing');

-- ============================================
-- Migrate visibility: is_public to visibility column
-- ============================================
UPDATE biographies
SET visibility = 'public'
WHERE visibility IS NULL AND is_public = 1;

UPDATE biographies
SET visibility = 'private'
WHERE visibility IS NULL AND (is_public = 0 OR is_public IS NULL);
