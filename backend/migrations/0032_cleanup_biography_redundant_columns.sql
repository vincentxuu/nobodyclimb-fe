-- ═══════════════════════════════════════════════════════════
-- Migration: Clean up biographies table redundant columns
-- Status: PENDING - DO NOT RUN until code is updated
-- Description:
--   Remove columns that are now stored in separate tables:
--   - is_public → replaced by visibility
--   - Core stories → biography_core_stories
--   - Advanced stories → biography_stories
--   - one_liners_data/stories_data → biography_one_liners/biography_stories
--
-- PREREQUISITES before running this migration:
--   1. Update backend/src/types.ts - remove fields from Biography interface
--   2. Update backend/src/routes/biographies.ts - remove all SQL references
--   3. Update frontend types if needed
--   4. Test all biography endpoints
-- ═══════════════════════════════════════════════════════════

-- ============================================
-- Remove is_public (replaced by visibility)
-- ============================================
ALTER TABLE biographies DROP COLUMN is_public;

-- ============================================
-- Remove core story columns (now in biography_core_stories)
-- ============================================
ALTER TABLE biographies DROP COLUMN climbing_origin;
ALTER TABLE biographies DROP COLUMN climbing_meaning;
ALTER TABLE biographies DROP COLUMN advice_to_self;

-- ============================================
-- Remove legacy story columns (never used in V2)
-- ============================================
ALTER TABLE biographies DROP COLUMN climbing_reason;
ALTER TABLE biographies DROP COLUMN bucket_list;
ALTER TABLE biographies DROP COLUMN advice;

-- ============================================
-- Remove advanced story columns (now in biography_stories)
-- Level 3A: Growth & Breakthrough
-- ============================================
ALTER TABLE biographies DROP COLUMN memorable_moment;
ALTER TABLE biographies DROP COLUMN biggest_challenge;
ALTER TABLE biographies DROP COLUMN breakthrough_story;
ALTER TABLE biographies DROP COLUMN first_outdoor;
ALTER TABLE biographies DROP COLUMN first_grade;
ALTER TABLE biographies DROP COLUMN frustrating_climb;

-- ============================================
-- Level 3B: Psychology & Philosophy
-- ============================================
ALTER TABLE biographies DROP COLUMN fear_management;
ALTER TABLE biographies DROP COLUMN climbing_lesson;
ALTER TABLE biographies DROP COLUMN failure_perspective;
ALTER TABLE biographies DROP COLUMN flow_moment;
ALTER TABLE biographies DROP COLUMN life_balance;
ALTER TABLE biographies DROP COLUMN unexpected_gain;

-- ============================================
-- Level 3C: Community & Connection
-- ============================================
ALTER TABLE biographies DROP COLUMN climbing_mentor;
ALTER TABLE biographies DROP COLUMN climbing_partner;
ALTER TABLE biographies DROP COLUMN funny_moment;
ALTER TABLE biographies DROP COLUMN favorite_spot;
ALTER TABLE biographies DROP COLUMN advice_to_group;
ALTER TABLE biographies DROP COLUMN climbing_space;

-- ============================================
-- Level 3D: Practical Sharing
-- ============================================
ALTER TABLE biographies DROP COLUMN injury_recovery;
ALTER TABLE biographies DROP COLUMN memorable_route;
ALTER TABLE biographies DROP COLUMN training_method;
ALTER TABLE biographies DROP COLUMN effective_practice;
ALTER TABLE biographies DROP COLUMN technique_tip;
ALTER TABLE biographies DROP COLUMN gear_choice;

-- ============================================
-- Level 3E: Dreams & Exploration
-- ============================================
ALTER TABLE biographies DROP COLUMN dream_climb;
ALTER TABLE biographies DROP COLUMN climbing_trip;
ALTER TABLE biographies DROP COLUMN bucket_list_story;
ALTER TABLE biographies DROP COLUMN climbing_goal;
ALTER TABLE biographies DROP COLUMN climbing_style;
ALTER TABLE biographies DROP COLUMN climbing_inspiration;

-- ============================================
-- Level 3F: Life Integration
-- ============================================
ALTER TABLE biographies DROP COLUMN life_outside_climbing;

-- ============================================
-- Remove JSON data columns (now synced to tables)
-- ============================================
ALTER TABLE biographies DROP COLUMN one_liners_data;
ALTER TABLE biographies DROP COLUMN stories_data;

-- ============================================
-- Remove gallery_images (can use separate media table)
-- ============================================
ALTER TABLE biographies DROP COLUMN gallery_images;

-- ============================================
-- Drop index for is_public (no longer exists)
-- ============================================
DROP INDEX IF EXISTS idx_biographies_public;
