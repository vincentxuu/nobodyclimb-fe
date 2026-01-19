-- Migration: Add BiographyV2 fields for progressive disclosure design
-- Adds support for tags, one-liners, stories, and visibility system
-- Includes data migration from existing fields
-- Uses snake_case keys to match existing project conventions

-- ═══════════════════════════════════════════════════════════
-- STEP 1: Add new columns
-- ═══════════════════════════════════════════════════════════

-- Visibility column (private, anonymous, community, public)
ALTER TABLE biographies ADD COLUMN visibility TEXT DEFAULT 'public';

-- Tags data column (JSON array of tag selections)
ALTER TABLE biographies ADD COLUMN tags_data TEXT;

-- One-liners data column (JSON object with question answers)
ALTER TABLE biographies ADD COLUMN one_liners_data TEXT;

-- Stories data column (JSON object with story answers by category)
ALTER TABLE biographies ADD COLUMN stories_data TEXT;

-- Basic info data column (structured basic info)
ALTER TABLE biographies ADD COLUMN basic_info_data TEXT;

-- Autosave timestamp for tracking
ALTER TABLE biographies ADD COLUMN autosave_at TEXT;

-- ═══════════════════════════════════════════════════════════
-- STEP 2: Create indexes
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_biographies_visibility ON biographies(visibility);

-- ═══════════════════════════════════════════════════════════
-- STEP 3: Migrate existing data to new format (snake_case keys)
-- ═══════════════════════════════════════════════════════════

-- Migrate visibility based on is_public
UPDATE biographies SET visibility = CASE
  WHEN is_public = 1 THEN 'public'
  ELSE 'private'
END;

-- Migrate basic info
UPDATE biographies SET basic_info_data = json_object(
  'name', COALESCE(name, ''),
  'title', COALESCE(title, ''),
  'bio', COALESCE(bio, ''),
  'climbing_start_year', COALESCE(climbing_start_year, ''),
  'frequent_locations', COALESCE(frequent_locations, ''),
  'favorite_route_type', COALESCE(favorite_route_type, '')
);

-- Migrate one-liners from existing fields (using field names as keys)
UPDATE biographies SET one_liners_data = json_object(
  'climbing_reason', json_object('answer', COALESCE(climbing_reason, ''), 'visibility', 'public'),
  'climbing_meaning', json_object('answer', COALESCE(climbing_meaning, ''), 'visibility', 'public'),
  'bucket_list', json_object('answer', COALESCE(bucket_list, ''), 'visibility', 'public'),
  'advice', json_object('answer', COALESCE(advice, ''), 'visibility', 'public')
);

-- Initialize tags_data as empty array
UPDATE biographies SET tags_data = '[]' WHERE tags_data IS NULL;

-- Migrate stories from existing story fields (using field names as keys)
-- Categories match biography-stories.ts: growth, psychology, community, practical, dreams, life
UPDATE biographies SET stories_data = json_object(
  'growth', json_object(
    'climbing_origin', CASE WHEN climbing_origin IS NOT NULL AND climbing_origin != '' THEN json_object('answer', climbing_origin, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'memorable_moment', CASE WHEN memorable_moment IS NOT NULL AND memorable_moment != '' THEN json_object('answer', memorable_moment, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'biggest_challenge', CASE WHEN biggest_challenge IS NOT NULL AND biggest_challenge != '' THEN json_object('answer', biggest_challenge, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'breakthrough_story', CASE WHEN breakthrough_story IS NOT NULL AND breakthrough_story != '' THEN json_object('answer', breakthrough_story, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'first_outdoor', CASE WHEN first_outdoor IS NOT NULL AND first_outdoor != '' THEN json_object('answer', first_outdoor, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'first_grade', CASE WHEN first_grade IS NOT NULL AND first_grade != '' THEN json_object('answer', first_grade, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'frustrating_climb', CASE WHEN frustrating_climb IS NOT NULL AND frustrating_climb != '' THEN json_object('answer', frustrating_climb, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END
  ),
  'psychology', json_object(
    'fear_management', CASE WHEN fear_management IS NOT NULL AND fear_management != '' THEN json_object('answer', fear_management, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'climbing_lesson', CASE WHEN climbing_lesson IS NOT NULL AND climbing_lesson != '' THEN json_object('answer', climbing_lesson, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'failure_perspective', CASE WHEN failure_perspective IS NOT NULL AND failure_perspective != '' THEN json_object('answer', failure_perspective, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'flow_moment', CASE WHEN flow_moment IS NOT NULL AND flow_moment != '' THEN json_object('answer', flow_moment, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'life_balance', CASE WHEN life_balance IS NOT NULL AND life_balance != '' THEN json_object('answer', life_balance, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'unexpected_gain', CASE WHEN unexpected_gain IS NOT NULL AND unexpected_gain != '' THEN json_object('answer', unexpected_gain, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END
  ),
  'community', json_object(
    'climbing_mentor', CASE WHEN climbing_mentor IS NOT NULL AND climbing_mentor != '' THEN json_object('answer', climbing_mentor, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'climbing_partner', CASE WHEN climbing_partner IS NOT NULL AND climbing_partner != '' THEN json_object('answer', climbing_partner, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'funny_moment', CASE WHEN funny_moment IS NOT NULL AND funny_moment != '' THEN json_object('answer', funny_moment, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'favorite_spot', CASE WHEN favorite_spot IS NOT NULL AND favorite_spot != '' THEN json_object('answer', favorite_spot, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'advice_to_group', CASE WHEN advice_to_group IS NOT NULL AND advice_to_group != '' THEN json_object('answer', advice_to_group, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'climbing_space', CASE WHEN climbing_space IS NOT NULL AND climbing_space != '' THEN json_object('answer', climbing_space, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END
  ),
  'practical', json_object(
    'advice_to_self', CASE WHEN advice_to_self IS NOT NULL AND advice_to_self != '' THEN json_object('answer', advice_to_self, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'injury_recovery', CASE WHEN injury_recovery IS NOT NULL AND injury_recovery != '' THEN json_object('answer', injury_recovery, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'memorable_route', CASE WHEN memorable_route IS NOT NULL AND memorable_route != '' THEN json_object('answer', memorable_route, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'training_method', CASE WHEN training_method IS NOT NULL AND training_method != '' THEN json_object('answer', training_method, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'effective_practice', CASE WHEN effective_practice IS NOT NULL AND effective_practice != '' THEN json_object('answer', effective_practice, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'technique_tip', CASE WHEN technique_tip IS NOT NULL AND technique_tip != '' THEN json_object('answer', technique_tip, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'gear_choice', CASE WHEN gear_choice IS NOT NULL AND gear_choice != '' THEN json_object('answer', gear_choice, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END
  ),
  'dreams', json_object(
    'dream_climb', CASE WHEN dream_climb IS NOT NULL AND dream_climb != '' THEN json_object('answer', dream_climb, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'climbing_trip', CASE WHEN climbing_trip IS NOT NULL AND climbing_trip != '' THEN json_object('answer', climbing_trip, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'bucket_list_story', CASE WHEN bucket_list_story IS NOT NULL AND bucket_list_story != '' THEN json_object('answer', bucket_list_story, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'climbing_goal', CASE WHEN climbing_goal IS NOT NULL AND climbing_goal != '' THEN json_object('answer', climbing_goal, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'climbing_style', CASE WHEN climbing_style IS NOT NULL AND climbing_style != '' THEN json_object('answer', climbing_style, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END,
    'climbing_inspiration', CASE WHEN climbing_inspiration IS NOT NULL AND climbing_inspiration != '' THEN json_object('answer', climbing_inspiration, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END
  ),
  'life', json_object(
    'life_outside_climbing', CASE WHEN life_outside_climbing IS NOT NULL AND life_outside_climbing != '' THEN json_object('answer', life_outside_climbing, 'visibility', 'public', 'updated_at', datetime('now')) ELSE NULL END
  )
);
