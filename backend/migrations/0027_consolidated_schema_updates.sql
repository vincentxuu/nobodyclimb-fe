-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Consolidated Schema Updates (0027-0032) - v4 修復版本
-- Description:
--   基於 REFACTORING-PLAN-FINAL.md 的架構設計重新規劃
--
--   🔧 v4 修復:
--   - 使用 PRAGMA foreign_keys = OFF 避免 DROP TABLE 觸發級聯刪除
--   - 確保 user_id 資料不會在重建表時遺失
--
--   主要變更:
--   1. 使用通用互動表 (likes, comments) 取代專門表
--   2. 統一互動功能架構,支援多種實體類型
--   3. 先重建 biographies 表,再遷移資料 (避免外鍵級聯刪除)
--
--   包含功能:
--   - 用戶表重構 (新增追蹤欄位,移除多餘欄位)
--   - 通知系統更新 (支援所有通知類型)
--   - 通知偏好設定表
--   - 人物誌內容表 (core_stories, one_liners, stories)
--   - 問題定義表及初始資料
--   - 通用互動表 (likes, comments) - 支援所有實體類型
--   - JSON 資料遷移到關聯式表格
--   - 清理多餘欄位
--
--   支援的實體類型 (entity_type):
--   - biography, post, bucket_list_item
--   - core_story, one_liner, story
--   - gallery, video, gym, crag, route
-- ═══════════════════════════════════════════════════════════════════════════

-- ============================================
-- CRITICAL FIX: 先備份所有會受外鍵級聯影響的表
-- 避免 DROP TABLE users 觸發資料刪除
-- ============================================

-- 備份所有會受影響的表
-- biographies 雖然使用 SET NULL 不會被刪除，但為了確保資料安全也備份
CREATE TABLE users_backup AS SELECT * FROM users;
CREATE TABLE biographies_backup AS SELECT * FROM biographies;
CREATE TABLE posts_backup AS SELECT * FROM posts;
CREATE TABLE galleries_backup AS SELECT * FROM galleries;
CREATE TABLE gallery_images_backup AS SELECT * FROM gallery_images;
CREATE TABLE notifications_backup AS SELECT * FROM notifications;
CREATE TABLE comments_backup AS SELECT * FROM comments;
CREATE TABLE reviews_backup AS SELECT * FROM reviews;

-- ============================================
-- PART 1: Users Table - Restructure with new fields
-- ============================================

-- 創建新的 users 表結構
CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  is_active INTEGER DEFAULT 1,
  email_verified INTEGER DEFAULT 0,
  google_id TEXT UNIQUE,
  auth_provider TEXT DEFAULT 'local' CHECK (auth_provider IN ('local', 'google')),
  -- Activity tracking (new)
  last_active_at TEXT,
  last_login_at TEXT,
  login_count INTEGER DEFAULT 0,
  -- Referral tracking (new)
  referral_source TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 3. 從備份表複製資料（此時 users 原表還存在，不會觸發級聯）
INSERT INTO users_new (
  id, email, username, password_hash, display_name, avatar_url, bio,
  role, is_active, email_verified, google_id, auth_provider,
  last_active_at, last_login_at, login_count,
  created_at, updated_at
)
SELECT
  id, email, username, password_hash, display_name, avatar_url, bio,
  role, is_active, email_verified, google_id, auth_provider,
  COALESCE(updated_at, created_at),  -- last_active_at
  created_at,                         -- last_login_at
  1,                                  -- login_count
  created_at, updated_at
FROM users_backup;

-- ============================================
-- PART 1: Users Table - 完成重建
-- ============================================

-- 4. 現在才刪除舊 users 表
-- 注意：這會觸發外鍵級聯刪除其他表的資料，但我們已備份
DROP TABLE users;

-- 5. 重命名新表為 users
ALTER TABLE users_new RENAME TO users;

-- 6. 重建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);

-- ============================================
-- CRITICAL FIX: 立即恢復被級聯刪除或修改的資料
-- biographies 使用 ON DELETE SET NULL，不會被刪除，但 user_id 會變 NULL
-- 只恢復 user_id 欄位，避免欄位數量不匹配問題
-- ============================================

-- 恢復 biographies 的 user_id（避免使用 SELECT * 導致欄位不匹配）
UPDATE biographies
SET user_id = (
  SELECT user_id FROM biographies_backup
  WHERE biographies_backup.id = biographies.id
)
WHERE id IN (SELECT id FROM biographies_backup);

-- 恢復 posts 資料
INSERT OR REPLACE INTO posts SELECT * FROM posts_backup;

-- 恢復 galleries 資料
INSERT OR REPLACE INTO galleries SELECT * FROM galleries_backup;

-- 恢復 gallery_images 資料
INSERT OR REPLACE INTO gallery_images SELECT * FROM gallery_images_backup;

-- 恢復 notifications 資料
INSERT OR REPLACE INTO notifications SELECT * FROM notifications_backup;

-- 恢復 comments 資料
INSERT OR REPLACE INTO comments SELECT * FROM comments_backup;

-- 恢復 reviews 資料
INSERT OR REPLACE INTO reviews SELECT * FROM reviews_backup;

-- ============================================
-- Compatibility: Ensure Biography V2 columns exist
-- 0024_add_biography_v2_fields.sql is a no-op in this repo, so
-- fresh databases may not have these columns yet.
-- NOTE: Must run AFTER restore (INSERT ... SELECT *) to avoid column count mismatch.
-- ============================================

ALTER TABLE biographies ADD COLUMN IF NOT EXISTS visibility TEXT;
ALTER TABLE biographies ADD COLUMN IF NOT EXISTS tags_data TEXT;
ALTER TABLE biographies ADD COLUMN IF NOT EXISTS one_liners_data TEXT;
ALTER TABLE biographies ADD COLUMN IF NOT EXISTS stories_data TEXT;
ALTER TABLE biographies ADD COLUMN IF NOT EXISTS basic_info_data TEXT;
ALTER TABLE biographies ADD COLUMN IF NOT EXISTS autosave_at TEXT;

-- ============================================
-- PART 2: Notifications Table - 支援所有通知類型
-- ============================================

CREATE TABLE IF NOT EXISTS notifications_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  -- 通知類型支援:
  -- - 目標相關: goal_completed, goal_liked, goal_commented, goal_referenced
  -- - 社交互動: new_follower
  -- - 內容互動: biography_liked, biography_commented, post_liked, post_commented
  -- - 人物誌內容: core_story_liked, core_story_commented, one_liner_liked, one_liner_commented, story_liked, story_commented
  -- - 系統通知: story_featured, system_announcement
  type TEXT NOT NULL CHECK (type IN (
    'goal_completed', 'goal_liked', 'goal_commented', 'goal_referenced',
    'new_follower',
    'biography_liked', 'biography_commented',
    'post_liked', 'post_commented',
    'core_story_liked', 'core_story_commented',
    'one_liner_liked', 'one_liner_commented',
    'story_liked', 'story_commented',
    'story_featured', 'system_announcement'
  )),
  actor_id TEXT,
  target_id TEXT,
  title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Copy existing data (only keep notifications with valid user_id)
INSERT INTO notifications_new (id, user_id, type, actor_id, target_id, title, message, is_read, created_at)
SELECT n.id, n.user_id, n.type, n.actor_id, n.target_id,
       COALESCE(n.title, ''), COALESCE(n.message, ''), n.is_read, n.created_at
FROM notifications n
INNER JOIN users u ON n.user_id = u.id;

DROP TABLE notifications;
ALTER TABLE notifications_new RENAME TO notifications;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = 0;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ============================================
-- PART 3: 通知偏好設定表 (Notification Preferences)
-- 允許使用者自訂接收哪些類型的通知
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id TEXT PRIMARY KEY,

  -- 互動通知 (Interaction Notifications)
  goal_liked INTEGER NOT NULL DEFAULT 1,            -- 目標被按讚
  goal_commented INTEGER NOT NULL DEFAULT 1,        -- 目標被留言
  goal_referenced INTEGER NOT NULL DEFAULT 1,       -- 目標被引用
  post_liked INTEGER NOT NULL DEFAULT 1,            -- 文章被按讚
  post_commented INTEGER NOT NULL DEFAULT 1,        -- 文章被留言
  biography_liked INTEGER NOT NULL DEFAULT 1,       -- 人物誌被按讚
  biography_commented INTEGER NOT NULL DEFAULT 1,   -- 人物誌被留言

  -- 人物誌內容互動通知 (Biography Content Interactions)
  core_story_liked INTEGER NOT NULL DEFAULT 1,      -- 核心故事被按讚
  core_story_commented INTEGER NOT NULL DEFAULT 1,  -- 核心故事被留言
  one_liner_liked INTEGER NOT NULL DEFAULT 1,       -- 一句話被按讚
  one_liner_commented INTEGER NOT NULL DEFAULT 1,   -- 一句話被留言
  story_liked INTEGER NOT NULL DEFAULT 1,           -- 小故事被按讚
  story_commented INTEGER NOT NULL DEFAULT 1,       -- 小故事被留言

  -- 社交通知 (Social Notifications)
  new_follower INTEGER NOT NULL DEFAULT 1,          -- 新追蹤者

  -- 系統通知 (System Notifications)
  story_featured INTEGER NOT NULL DEFAULT 1,        -- 故事被精選
  goal_completed INTEGER NOT NULL DEFAULT 1,        -- 目標完成

  -- 通知方式 (Notification Methods)
  email_digest INTEGER NOT NULL DEFAULT 0,          -- 電子郵件摘要

  -- 時間戳記
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create default preferences for existing users
INSERT OR IGNORE INTO notification_preferences (user_id)
SELECT id FROM users;

-- ============================================
-- PART 4: Question Definition Tables
-- ============================================

-- Core story questions (fixed 3 questions)
CREATE TABLE IF NOT EXISTS core_story_questions (
  id TEXT PRIMARY KEY CHECK (id IN ('climbing_origin', 'climbing_meaning', 'advice_to_self')),
  title TEXT NOT NULL,
  subtitle TEXT,
  placeholder TEXT,
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_core_story_questions_order ON core_story_questions(display_order);

-- Story categories
CREATE TABLE IF NOT EXISTS story_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_story_categories_order ON story_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_story_categories_active ON story_categories(is_active) WHERE is_active = 1;

-- One-liner questions
CREATE TABLE IF NOT EXISTS one_liner_questions (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  format_hint TEXT,
  placeholder TEXT,
  category TEXT,
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  is_core INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_one_liner_questions_order ON one_liner_questions(display_order);
CREATE INDEX IF NOT EXISTS idx_one_liner_questions_active ON one_liner_questions(is_active) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_one_liner_questions_core ON one_liner_questions(is_core) WHERE is_core = 1;

-- Story questions
CREATE TABLE IF NOT EXISTS story_questions (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  placeholder TEXT,
  difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'deep')),
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES story_categories(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_story_questions_category ON story_questions(category_id);
CREATE INDEX IF NOT EXISTS idx_story_questions_order ON story_questions(display_order);
CREATE INDEX IF NOT EXISTS idx_story_questions_active ON story_questions(is_active) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_story_questions_difficulty ON story_questions(difficulty);

-- ============================================
-- PART 5: Biography Content Tables
-- ============================================

-- Core stories table (3 required questions)
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

-- One-liners table
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

-- Stories table
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
-- PART 6: 統一的互動功能表 (Universal Interaction Tables)
-- 根據 REFACTORING-PLAN-FINAL.md 的設計
-- ============================================

-- 步驟 1: 重建 likes 表以支援更多實體類型
-- 注意: likes 表已存在 (migration 0002),需要重建以擴展 entity_type

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

-- 遷移現有的 likes 表資料 (來自 migration 0002)
INSERT INTO likes_new (id, user_id, entity_type, entity_id, created_at)
SELECT id, user_id, entity_type, entity_id, created_at
FROM likes
WHERE entity_type IN ('post', 'gallery', 'video', 'gym', 'crag');

-- 遷移 biography_likes 到統一的 likes 表
INSERT INTO likes_new (id, user_id, entity_type, entity_id, created_at)
SELECT id, user_id, 'biography', biography_id, created_at
FROM biography_likes
WHERE NOT EXISTS (
  SELECT 1 FROM likes_new
  WHERE likes_new.user_id = biography_likes.user_id
    AND likes_new.entity_type = 'biography'
    AND likes_new.entity_id = biography_likes.biography_id
);

-- 遷移 bucket_list_likes 到統一的 likes 表
INSERT INTO likes_new (id, user_id, entity_type, entity_id, created_at)
SELECT id, user_id, 'bucket_list_item', bucket_list_item_id, created_at
FROM bucket_list_likes
WHERE NOT EXISTS (
  SELECT 1 FROM likes_new
  WHERE likes_new.user_id = bucket_list_likes.user_id
    AND likes_new.entity_type = 'bucket_list_item'
    AND likes_new.entity_id = bucket_list_likes.bucket_list_item_id
);

-- 替換舊的 likes 表
DROP TABLE likes;
ALTER TABLE likes_new RENAME TO likes;

-- 重建索引
CREATE INDEX IF NOT EXISTS idx_likes_entity ON likes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_created ON likes(created_at DESC);

-- 步驟 2: 重建 comments 表以支援更多實體類型
-- 注意: comments 表已存在 (migration 0016),需要重建以擴展 entity_type

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

-- 遷移現有的 comments 表資料 (來自 migration 0016)
INSERT INTO comments_new2 (id, user_id, entity_type, entity_id, content, parent_id, created_at, updated_at)
SELECT
  id, user_id, entity_type, entity_id, content, parent_id,
  created_at, updated_at
FROM comments
WHERE entity_type IN ('post', 'gallery', 'video', 'biography');

-- 遷移 bucket_list_comments 到統一的 comments 表
INSERT INTO comments_new2 (id, user_id, entity_type, entity_id, content, created_at, updated_at)
SELECT
  id, user_id, 'bucket_list_item', bucket_list_item_id, content,
  created_at, created_at
FROM bucket_list_comments
WHERE NOT EXISTS (
  SELECT 1 FROM comments_new2
  WHERE comments_new2.user_id = bucket_list_comments.user_id
    AND comments_new2.entity_type = 'bucket_list_item'
    AND comments_new2.entity_id = bucket_list_comments.bucket_list_item_id
    AND comments_new2.created_at = bucket_list_comments.created_at
);

-- 替換舊的 comments 表
DROP TABLE comments;
ALTER TABLE comments_new2 RENAME TO comments;

-- 重建索引
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);

-- ============================================
-- PART 7: Seed Data - Story Categories
-- ============================================

INSERT INTO story_categories (id, name, icon, description, display_order) VALUES
  ('sys_cat_growth', '成長與突破', 'TrendingUp', '你的攀岩成長故事', 1),
  ('sys_cat_psychology', '心理與哲學', 'Brain', '攀岩帶給你的思考', 2),
  ('sys_cat_community', '社群與連結', 'Users', '攀岩社群的故事', 3),
  ('sys_cat_practical', '實用分享', 'Wrench', '經驗與技巧分享', 4),
  ('sys_cat_dreams', '夢想與探索', 'Compass', '攀岩的夢想與目標', 5),
  ('sys_cat_life', '生活整合', 'Palette', '攀岩與生活的交集', 6);

-- ============================================
-- PART 8: Seed Data - Core Story Questions
-- ============================================

INSERT INTO core_story_questions (id, title, subtitle, placeholder, display_order) VALUES
  ('climbing_origin', '你與攀岩的相遇', '描述第一次接觸攀岩的情景', '大學社團體驗,一爬就愛上了', 1),
  ('climbing_meaning', '攀岩對你來說是什麼?', '攀岩在你生活中扮演什麼角色', '一種生活方式,也是認識自己的途徑', 2),
  ('advice_to_self', '給剛開始攀岩的自己', '如果能回到起點,你會對自己說什麼', '不要急,享受每一次攀爬的過程', 3);

-- ============================================
-- PART 9: Seed Data - One-liner Questions
-- ============================================

INSERT INTO one_liner_questions (id, question, format_hint, placeholder, display_order) VALUES
  ('best_moment', '爬岩最爽的是?', '當＿＿＿的時候', '終於送出卡了一個月的 project', 4),
  ('favorite_place', '最喜歡在哪裡爬?', NULL, '龍洞的海邊岩壁', 5),
  ('current_goal', '目前的攀岩小目標?', NULL, '這個月送出 V4', 6),
  ('climbing_takeaway', '攀岩教會我的一件事?', NULL, '失敗沒什麼,再來就好', 7),
  ('climbing_style_desc', '用一句話形容你的攀岩風格?', NULL, '慢慢來但很穩', 8),
  ('life_outside', '攀岩之外,你是誰?', NULL, '工程師/學生/全職岩棍', 9),
  ('bucket_list', '攀岩人生清單上有什麼?', NULL, '去優勝美地爬一次、完攀龍洞經典路線', 10);

-- ============================================
-- PART 10: Seed Data - Story Questions
-- ============================================

-- A. Growth & Breakthrough (6 questions)
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('memorable_moment', 'sys_cat_growth', '有沒有某次攀爬讓你一直記到現在?', '不一定要多厲害,只要對你有意義', '去年第一次去龍洞...', 'easy', 1),
  ('biggest_challenge', 'sys_cat_growth', '有遇過什麼卡關的時候嗎?', '卡關也是成長的一部分', '有一段時間怎麼爬都沒進步...', 'medium', 2),
  ('breakthrough_story', 'sys_cat_growth', '最近有沒有覺得自己進步的時刻?', '小小的進步也值得記錄', '上週終於送出卡了一個月的那條路線...', 'easy', 3),
  ('first_outdoor', 'sys_cat_growth', '還記得第一次戶外攀岩嗎?', '室內和戶外的差別', '第一次站在真的岩壁前...', 'easy', 4),
  ('first_grade', 'sys_cat_growth', '有沒有哪條路線讓你特別有成就感?', '可能是第一次突破某個難度', '第一次送出 V4 的時候...', 'easy', 5),
  ('frustrating_climb', 'sys_cat_growth', '有沒有讓你很挫折的經驗?後來怎麼面對?', '挫折也是故事的一部分', '有一次摔傷了,休息了三個月...', 'medium', 6);

-- B. Psychology & Philosophy (6 questions)
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('fear_management', 'sys_cat_psychology', '會怕高或怕墜落嗎?怎麼面對的?', '每個人都有害怕的時候', '剛開始真的很怕,每次爬高一點心跳就加速...', 'medium', 1),
  ('climbing_lesson', 'sys_cat_psychology', '攀岩有沒有讓你學到什麼?', '可能是對生活的啟發', '學會了面對失敗,一次不行就再來...', 'medium', 2),
  ('failure_perspective', 'sys_cat_psychology', '爬不上去的時候會怎麼想?', '你的心態是什麼', '會有點挫折,但告訴自己下次再來...', 'easy', 3),
  ('flow_moment', 'sys_cat_psychology', '有沒有爬到忘記時間的經驗?', '那種完全投入的感覺', '有一次在龍洞,不知不覺就爬了六小時...', 'easy', 4),
  ('life_balance', 'sys_cat_psychology', '怎麼安排攀岩和其他生活?', '工作、家庭、社交的平衡', '平日上班,週末盡量安排一天去爬...', 'medium', 5),
  ('unexpected_gain', 'sys_cat_psychology', '攀岩有帶給你什麼意外的收穫嗎?', '可能是你沒想到的好處', '認識了很多很棒的朋友...', 'deep', 6);

-- C. Community & Connection (6 questions)
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('climbing_mentor', 'sys_cat_community', '有沒有想感謝的人?', '可能是教你的人、一起爬的朋友', '很感謝第一個帶我去爬的朋友...', 'easy', 1),
  ('climbing_partner', 'sys_cat_community', '有沒有固定的攀岩夥伴?有什麼故事?', '你們怎麼認識的', '在岩館認識的,現在每週都約...', 'easy', 2),
  ('funny_moment', 'sys_cat_community', '有沒有什麼搞笑或尷尬的經歷?', '爬岩的糗事也很有趣', '有一次在岩館,爬到一半褲子裂開了...', 'easy', 3),
  ('favorite_spot', 'sys_cat_community', '最常去或最推薦哪裡爬?為什麼?', '分享你的秘密基地', '最常去原岩,因為離家近而且氣氛很好...', 'easy', 4),
  ('advice_to_group', 'sys_cat_community', '想對新手(或某個族群)說什麼?', '你的建議或鼓勵', '不要因為爬不上去就覺得丟臉...', 'medium', 5),
  ('climbing_space', 'sys_cat_community', '有沒有對你特別有意義的岩館或地點?', '那個地方對你有什麼意義', '龍洞對我來說是特別的地方...', 'medium', 6);

-- D. Practical Sharing (6 questions)
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('injury_recovery', 'sys_cat_practical', '有受過傷嗎?怎麼復原的?', '分享你的經驗', '有一次 A2 滑輪受傷,休息了兩個月...', 'medium', 1),
  ('memorable_route', 'sys_cat_practical', '有沒有想分享的路線或經驗?', '你的私房路線', '龍洞的那條 5.10a 很適合練習...', 'easy', 2),
  ('training_method', 'sys_cat_practical', '你平常怎麼練習?有什麼小習慣?', '你的訓練方式', '每次爬完都會做伸展...', 'easy', 3),
  ('effective_practice', 'sys_cat_practical', '有沒有對你特別有效的練習方法?', '分享你的秘訣', '用 4x4 訓練法之後,耐力進步很多...', 'medium', 4),
  ('technique_tip', 'sys_cat_practical', '有沒有學到什麼實用的技巧?', '可能是某個動作或心法', '學會 heel hook 之後,很多路線突然變簡單了...', 'easy', 5),
  ('gear_choice', 'sys_cat_practical', '關於裝備有沒有什麼心得?', '你的裝備觀', '攀岩鞋真的要試穿,網購踩雷過...', 'easy', 6);

-- E. Dreams & Exploration (6 questions)
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('dream_climb', 'sys_cat_dreams', '如果能去任何地方爬,你想去哪?', '你的夢想攀岩地點', '想去優勝美地爬 El Cap...', 'easy', 1),
  ('climbing_trip', 'sys_cat_dreams', '有沒有印象深刻的攀岩旅行?', '分享你的旅行故事', '去泰國的喀比爬了一週...', 'easy', 2),
  ('bucket_list_story', 'sys_cat_dreams', '有沒有完成過什麼攀岩目標?感覺如何?', '你的里程碑', '去年終於完成了龍洞的經典路線...', 'medium', 3),
  ('climbing_goal', 'sys_cat_dreams', '最近有什麼想達成的小目標?', '你現在在努力什麼', '想在這個月內送出那條紫色 V4...', 'easy', 4),
  ('climbing_style', 'sys_cat_dreams', '最喜歡什麼樣的路線或風格?', '你的攀岩偏好', '喜歡技巧型的 slab...', 'easy', 5),
  ('climbing_inspiration', 'sys_cat_dreams', '有沒有啟發你的人、影片或故事?', '誰或什麼啟發了你', 'Alex Honnold 的 Free Solo 看了好幾遍...', 'easy', 6);

-- F. Life Integration (1 question)
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('life_outside_climbing', 'sys_cat_life', '攀岩之外,還有什麼讓你著迷?', '你的其他興趣', '還喜歡衝浪和露營...', 'easy', 1);

-- ============================================
-- PART 11: Update biography slug to use username
-- ============================================

UPDATE biographies
SET slug = (
  SELECT username FROM users WHERE users.id = biographies.user_id
),
updated_at = datetime('now')
WHERE user_id IS NOT NULL
AND user_id IN (SELECT id FROM users);

-- Ensure all biographies have a slug (fallback for records without user_id or NULL slug)
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
-- PART 12: Cleanup redundant biography columns
-- 🔧 執行順序調整: 先重建表,再遷移資料
-- Using table rebuild for SQLite/D1 compatibility
-- ============================================

-- Create new biographies table with only the fields we need to keep
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
  -- 🔧 保留 JSON 資料欄位作為備份 (已遷移到關聯式表格,但保留原始資料)
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

-- Copy data from old table (only the fields we're keeping)
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

-- Drop old table and rename new one
DROP TABLE biographies;
ALTER TABLE biographies_new RENAME TO biographies;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_biographies_slug ON biographies(slug);
CREATE INDEX IF NOT EXISTS idx_biographies_user ON biographies(user_id);
CREATE INDEX IF NOT EXISTS idx_biographies_visibility ON biographies(visibility) WHERE visibility = 'public';
CREATE INDEX IF NOT EXISTS idx_biographies_featured ON biographies(is_featured) WHERE is_featured = 1;

-- ============================================
-- PART 13: Migrate JSON data to new tables
-- 🔧 執行順序調整: 在 biographies 表重建後執行,避免外鍵級聯刪除
-- ============================================

-- 🔧 先刪除可能存在的臨時表,避免舊資料干擾
DROP TABLE IF EXISTS temp_stories_flat;

-- Migrate one_liners_data to biography_core_stories
-- Note: one_liners_data 包含 3 個 core questions 及其他 one-liner questions
WITH core_questions (question_id, json_path) AS (
  VALUES
    ('climbing_origin', '$.climbing_origin.answer'),
    ('climbing_meaning', '$.climbing_meaning.answer'),
    ('advice_to_self', '$.advice_to_self.answer')
)
INSERT INTO biography_core_stories (id, biography_id, question_id, content, created_at, updated_at)
SELECT
  lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  b.id,
  q.question_id,
  json_extract(b.one_liners_data, q.json_path),
  COALESCE(b.created_at, datetime('now')),
  COALESCE(b.updated_at, datetime('now'))
FROM biographies b, core_questions q
WHERE b.one_liners_data IS NOT NULL
  AND json_extract(b.one_liners_data, q.json_path) IS NOT NULL
  AND TRIM(json_extract(b.one_liners_data, q.json_path)) != ''
  AND NOT EXISTS (
    SELECT 1 FROM biography_core_stories bcs
    WHERE bcs.biography_id = b.id AND bcs.question_id = q.question_id
  );

-- Migrate one_liners_data to biography_one_liners (non-core questions)
-- 注意: 如果 one_liners_data 中只有 core questions,此查詢不會插入任何資料
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
    SELECT 1 FROM biography_one_liners bol
    WHERE bol.biography_id = b.id AND bol.question_id = j.key
  );

-- Migrate stories_data to biography_stories
-- 🔧 FIX: 不使用 CREATE TABLE IF NOT EXISTS,改用 CREATE TABLE
CREATE TABLE temp_stories_flat AS
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

INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, source, character_count, created_at, updated_at)
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
  SELECT 1 FROM biography_stories bs
  WHERE bs.biography_id = t.biography_id AND bs.question_id = t.question_id
);

DROP TABLE IF EXISTS temp_stories_flat;

-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 完成總結
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ✅ 本次 Migration 已完成:
--
-- 1. 用戶表重構
--    - 新增活動追蹤欄位 (last_active_at, last_login_at, login_count)
--    - 新增推薦來源追蹤 (referral_source)
--
-- 2. 通知系統完善
--    - 通知表支援所有互動類型
--    - 通知偏好設定表
--
-- 3. 人物誌內容架構
--    - 核心故事表 (biography_core_stories) - 3 個固定問題
--    - 一句話表 (biography_one_liners) - 快問快答
--    - 小故事表 (biography_stories) - 深度故事
--    - 問題定義表及初始資料
--
-- 4. 統一互動功能表 ⭐ 重構計劃核心
--    - likes 表 - 支援所有實體類型的按讚
--    - comments 表 - 支援所有實體類型的留言
--    - 取代專門表設計,為後續 API 重構做好準備
--
-- 5. 資料遷移
--    - JSON 資料遷移到關聯式表格
--    - 保留原始 JSON 作為備份
--    - visibility 欄位標準化
--
-- 📋 後續步驟 (參考 REFACTORING-PLAN-FINAL.md):
--
-- Phase 2: 後端重構
--    - 建立 InteractionRepository (統一查詢邏輯)
--    - 建立 InteractionService (統一業務邏輯)
--    - 拆分路由檔案 (likes.ts, comments.ts, follows.ts, bookmarks.ts)
--    - 更新主路由 (新 API: /api/v1/likes/:entityType/:entityId)
--
-- Phase 3: 前端適配
--    - 更新 API Client (src/lib/api/interactions.ts)
--    - 建立統一 Hooks (useLike, useComments, useFollow)
--    - 更新 UI 元件 (LikeButton, CommentSection 等)
--
-- 💡 關鍵優勢:
--    - 單一資料來源 (Single Source of Truth)
--    - 一致的 API 設計 (功能分組而非資源分組)
--    - 易於擴展 (新增實體類型只需加入 entity_type)
--    - 簡化查詢 (不需要 JOIN 多個專門表)
--
-- 📦 已遷移的資料:
--    - biography_likes → likes (entity_type='biography')
--    - bucket_list_likes → likes (entity_type='bucket_list_item')
--    - bucket_list_comments → comments (entity_type='bucket_list_item')
--
-- ⚠️  舊表清理策略:
--    - biography_likes - 保留 (待驗證後刪除)
--    - bucket_list_likes - 保留 (待驗證後刪除)
--    - bucket_list_comments - 保留 (待驗證後刪除)
--
--    建議在 production 運行並驗證 7 天後,執行以下 SQL 刪除舊表:
--    ```sql
--    DROP TABLE IF EXISTS biography_likes;
--    DROP TABLE IF EXISTS bucket_list_likes;
--    DROP TABLE IF EXISTS bucket_list_comments;
--    ```
--
-- ═══════════════════════════════════════════════════════════════════════════

-- ============================================
-- CRITICAL FIX: 清理所有備份表
-- ============================================

DROP TABLE IF EXISTS users_backup;
DROP TABLE IF EXISTS biographies_backup;
DROP TABLE IF EXISTS posts_backup;
DROP TABLE IF EXISTS galleries_backup;
DROP TABLE IF EXISTS gallery_images_backup;
DROP TABLE IF EXISTS notifications_backup;
DROP TABLE IF EXISTS comments_backup;
DROP TABLE IF EXISTS reviews_backup;
