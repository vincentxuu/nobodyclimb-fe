-- Migration: Add BiographyV2 fields for progressive disclosure design
-- Adds support for tags, one-liners, stories, and visibility system
-- Includes data migration from existing fields

-- ═══════════════════════════════════════════════════════════
-- STEP 1: Add new columns
-- ═══════════════════════════════════════════════════════════

-- Visibility column (private, anonymous, community, public)
ALTER TABLE biographies ADD COLUMN visibility TEXT DEFAULT 'public';

-- Tags data column (JSON array of tag selections)
-- Format: [{ "dimension": "climbing_style", "value": "bouldering", "customValue": null }]
ALTER TABLE biographies ADD COLUMN tags_data TEXT;

-- One-liners data column (JSON object with question answers)
-- Format: { "reasonStartClimbing": { "answer": "...", "visibility": "public" }, ... }
ALTER TABLE biographies ADD COLUMN one_liners_data TEXT;

-- Stories data column (JSON object with story answers by category)
-- Format: { "origin": { "q1": { "answer": "...", "visibility": "public", "updatedAt": "..." } }, ... }
ALTER TABLE biographies ADD COLUMN stories_data TEXT;

-- Basic info data column (structured basic info)
-- Format: { "nickname": "...", "yearsClimbing": "...", "climbingFrequency": "...", ... }
ALTER TABLE biographies ADD COLUMN basic_info_data TEXT;

-- Autosave timestamp for tracking
ALTER TABLE biographies ADD COLUMN autosave_at TEXT;

-- ═══════════════════════════════════════════════════════════
-- STEP 2: Create indexes
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_biographies_visibility ON biographies(visibility);

-- ═══════════════════════════════════════════════════════════
-- STEP 3: Migrate existing data to new format
-- ═══════════════════════════════════════════════════════════

-- Migrate visibility based on is_public
UPDATE biographies SET visibility = CASE
  WHEN is_public = 1 THEN 'public'
  ELSE 'private'
END;

-- Migrate basic info (name, title, bio, climbing_start_year, frequent_locations, favorite_route_type)
UPDATE biographies SET basic_info_data = json_object(
  'nickname', COALESCE(name, ''),
  'title', COALESCE(title, ''),
  'bio', COALESCE(bio, ''),
  'yearsClimbing', COALESCE(climbing_start_year, ''),
  'frequentLocations', COALESCE(frequent_locations, ''),
  'favoriteRouteType', COALESCE(favorite_route_type, '')
);

-- Migrate one-liners from existing fields
UPDATE biographies SET one_liners_data = json_object(
  'reasonStartClimbing', json_object('answer', COALESCE(climbing_reason, ''), 'visibility', 'public'),
  'climbingMeaning', json_object('answer', COALESCE(climbing_meaning, ''), 'visibility', 'public'),
  'bucketList', json_object('answer', COALESCE(bucket_list, ''), 'visibility', 'public'),
  'adviceToNewClimbers', json_object('answer', COALESCE(advice, ''), 'visibility', 'public')
);

-- Initialize tags_data as empty array
-- Note: climbing_style 舊欄位格式不一致，改為讓用戶在新介面重新選擇
UPDATE biographies SET tags_data = '[]' WHERE tags_data IS NULL;

-- Migrate stories from existing story fields
UPDATE biographies SET stories_data = json_object(
  'origin', json_object(
    'climbingOrigin', CASE WHEN climbing_origin IS NOT NULL AND climbing_origin != '' THEN json_object('answer', climbing_origin, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'memorableMoment', CASE WHEN memorable_moment IS NOT NULL AND memorable_moment != '' THEN json_object('answer', memorable_moment, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'firstOutdoor', CASE WHEN first_outdoor IS NOT NULL AND first_outdoor != '' THEN json_object('answer', first_outdoor, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'firstGrade', CASE WHEN first_grade IS NOT NULL AND first_grade != '' THEN json_object('answer', first_grade, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END
  ),
  'growth', json_object(
    'biggestChallenge', CASE WHEN biggest_challenge IS NOT NULL AND biggest_challenge != '' THEN json_object('answer', biggest_challenge, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'breakthroughStory', CASE WHEN breakthrough_story IS NOT NULL AND breakthrough_story != '' THEN json_object('answer', breakthrough_story, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'frustratingClimb', CASE WHEN frustrating_climb IS NOT NULL AND frustrating_climb != '' THEN json_object('answer', frustrating_climb, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'injuryRecovery', CASE WHEN injury_recovery IS NOT NULL AND injury_recovery != '' THEN json_object('answer', injury_recovery, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END
  ),
  'philosophy', json_object(
    'fearManagement', CASE WHEN fear_management IS NOT NULL AND fear_management != '' THEN json_object('answer', fear_management, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'climbingLesson', CASE WHEN climbing_lesson IS NOT NULL AND climbing_lesson != '' THEN json_object('answer', climbing_lesson, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'failurePerspective', CASE WHEN failure_perspective IS NOT NULL AND failure_perspective != '' THEN json_object('answer', failure_perspective, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'flowMoment', CASE WHEN flow_moment IS NOT NULL AND flow_moment != '' THEN json_object('answer', flow_moment, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'lifeBalance', CASE WHEN life_balance IS NOT NULL AND life_balance != '' THEN json_object('answer', life_balance, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'unexpectedGain', CASE WHEN unexpected_gain IS NOT NULL AND unexpected_gain != '' THEN json_object('answer', unexpected_gain, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END
  ),
  'community', json_object(
    'climbingMentor', CASE WHEN climbing_mentor IS NOT NULL AND climbing_mentor != '' THEN json_object('answer', climbing_mentor, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'climbingPartner', CASE WHEN climbing_partner IS NOT NULL AND climbing_partner != '' THEN json_object('answer', climbing_partner, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'funnyMoment', CASE WHEN funny_moment IS NOT NULL AND funny_moment != '' THEN json_object('answer', funny_moment, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'favoriteSpot', CASE WHEN favorite_spot IS NOT NULL AND favorite_spot != '' THEN json_object('answer', favorite_spot, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'adviceToGroup', CASE WHEN advice_to_group IS NOT NULL AND advice_to_group != '' THEN json_object('answer', advice_to_group, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'climbingSpace', CASE WHEN climbing_space IS NOT NULL AND climbing_space != '' THEN json_object('answer', climbing_space, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END
  ),
  'practical', json_object(
    'memorableRoute', CASE WHEN memorable_route IS NOT NULL AND memorable_route != '' THEN json_object('answer', memorable_route, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'trainingMethod', CASE WHEN training_method IS NOT NULL AND training_method != '' THEN json_object('answer', training_method, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'effectivePractice', CASE WHEN effective_practice IS NOT NULL AND effective_practice != '' THEN json_object('answer', effective_practice, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'techniqueTip', CASE WHEN technique_tip IS NOT NULL AND technique_tip != '' THEN json_object('answer', technique_tip, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'gearChoice', CASE WHEN gear_choice IS NOT NULL AND gear_choice != '' THEN json_object('answer', gear_choice, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END
  ),
  'dreams', json_object(
    'dreamClimb', CASE WHEN dream_climb IS NOT NULL AND dream_climb != '' THEN json_object('answer', dream_climb, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'climbingTrip', CASE WHEN climbing_trip IS NOT NULL AND climbing_trip != '' THEN json_object('answer', climbing_trip, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'bucketListStory', CASE WHEN bucket_list_story IS NOT NULL AND bucket_list_story != '' THEN json_object('answer', bucket_list_story, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'climbingGoal', CASE WHEN climbing_goal IS NOT NULL AND climbing_goal != '' THEN json_object('answer', climbing_goal, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'climbingInspiration', CASE WHEN climbing_inspiration IS NOT NULL AND climbing_inspiration != '' THEN json_object('answer', climbing_inspiration, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'lifeOutsideClimbing', CASE WHEN life_outside_climbing IS NOT NULL AND life_outside_climbing != '' THEN json_object('answer', life_outside_climbing, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END,
    'adviceToSelf', CASE WHEN advice_to_self IS NOT NULL AND advice_to_self != '' THEN json_object('answer', advice_to_self, 'visibility', 'public', 'updatedAt', datetime('now')) ELSE NULL END
  )
);
