-- ═══════════════════════════════════════════════════════════
-- Migration: Add advanced story fields to biographies table
-- Description: Adds 30 advanced story fields, media fields, and statistics
-- ═══════════════════════════════════════════════════════════

-- A. 成長與突破（6題）
ALTER TABLE biographies ADD COLUMN memorable_moment TEXT;
ALTER TABLE biographies ADD COLUMN biggest_challenge TEXT;
ALTER TABLE biographies ADD COLUMN breakthrough_story TEXT;
ALTER TABLE biographies ADD COLUMN first_outdoor TEXT;
ALTER TABLE biographies ADD COLUMN first_grade TEXT;
ALTER TABLE biographies ADD COLUMN frustrating_climb TEXT;

-- B. 心理與哲學（6題）
ALTER TABLE biographies ADD COLUMN fear_management TEXT;
ALTER TABLE biographies ADD COLUMN climbing_lesson TEXT;
ALTER TABLE biographies ADD COLUMN failure_perspective TEXT;
ALTER TABLE biographies ADD COLUMN flow_moment TEXT;
ALTER TABLE biographies ADD COLUMN life_balance TEXT;
ALTER TABLE biographies ADD COLUMN unexpected_gain TEXT;

-- C. 社群與連結（6題）
ALTER TABLE biographies ADD COLUMN climbing_mentor TEXT;
ALTER TABLE biographies ADD COLUMN climbing_partner TEXT;
ALTER TABLE biographies ADD COLUMN funny_moment TEXT;
ALTER TABLE biographies ADD COLUMN favorite_spot TEXT;
ALTER TABLE biographies ADD COLUMN advice_to_group TEXT;
ALTER TABLE biographies ADD COLUMN climbing_space TEXT;

-- D. 實用分享（6題）
ALTER TABLE biographies ADD COLUMN injury_recovery TEXT;
ALTER TABLE biographies ADD COLUMN memorable_route TEXT;
ALTER TABLE biographies ADD COLUMN training_method TEXT;
ALTER TABLE biographies ADD COLUMN effective_practice TEXT;
ALTER TABLE biographies ADD COLUMN technique_tip TEXT;
ALTER TABLE biographies ADD COLUMN gear_choice TEXT;

-- E. 夢想與探索（6題）
ALTER TABLE biographies ADD COLUMN dream_climb TEXT;
ALTER TABLE biographies ADD COLUMN climbing_trip TEXT;
ALTER TABLE biographies ADD COLUMN bucket_list_story TEXT;
ALTER TABLE biographies ADD COLUMN climbing_goal TEXT;
ALTER TABLE biographies ADD COLUMN climbing_style TEXT;
ALTER TABLE biographies ADD COLUMN climbing_inspiration TEXT;

-- F. 生活整合（1題）
ALTER TABLE biographies ADD COLUMN life_outside_climbing TEXT;

-- 攀岩足跡（JSON array）
ALTER TABLE biographies ADD COLUMN climbing_locations TEXT;

-- 媒體整合
ALTER TABLE biographies ADD COLUMN youtube_channel_id TEXT;
ALTER TABLE biographies ADD COLUMN featured_video_id TEXT;

-- 統計欄位
ALTER TABLE biographies ADD COLUMN total_likes INTEGER DEFAULT 0;
ALTER TABLE biographies ADD COLUMN total_views INTEGER DEFAULT 0;
ALTER TABLE biographies ADD COLUMN follower_count INTEGER DEFAULT 0;

-- 重命名現有欄位（使用新表方式處理 - SQLite 不直接支援 RENAME COLUMN）
-- 為了向後相容，保留原欄位，新增映射欄位
ALTER TABLE biographies ADD COLUMN climbing_origin TEXT;
ALTER TABLE biographies ADD COLUMN advice_to_self TEXT;

-- 將舊欄位資料複製到新欄位
UPDATE biographies SET climbing_origin = climbing_reason WHERE climbing_reason IS NOT NULL;
UPDATE biographies SET advice_to_self = advice WHERE advice IS NOT NULL;

-- 注意：保留 climbing_reason 和 advice 欄位以維持向後相容
-- 新程式碼應使用 climbing_origin 和 advice_to_self
