-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Consolidated Schema Updates (0027-0032)
-- Description:
--   This migration consolidates all changes from the original 0027-0032 migrations:
--   - Add tracking fields to users table (last_active_at, last_login_at, login_count, referral_source)
--   - Remove redundant climbing fields from users table (now in biographies)
--   - Update notifications table with all notification types
--   - Create notification_preferences table
--   - Create biography content tables (core_stories, one_liners, stories)
--   - Create question definition tables with seed data
--   - Migrate JSON data to new tables
--   - Clean up redundant biography columns
-- ═══════════════════════════════════════════════════════════════════════════

-- ============================================
-- PART 1: Users Table - Restructure with new fields
-- Using table rebuild for SQLite compatibility
-- ============================================

PRAGMA foreign_keys = OFF;

-- Create new users table with updated schema
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
  -- Removed: climbing_start_year, frequent_gym, favorite_route_type (now in biographies)
);

-- Copy data from old table
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
  created_at,                         -- last_login_at (use created_at as initial)
  1,                                  -- login_count (default to 1 for existing users)
  created_at, updated_at
FROM users;

-- Drop old table and rename new one
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);

PRAGMA foreign_keys = ON;

-- ============================================
-- PART 2: Notifications Table - Add all notification types
-- ============================================

PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS notifications_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    -- Original types
    'goal_completed',
    'goal_liked',
    'goal_commented',
    'goal_referenced',
    'new_follower',
    'story_featured',
    'biography_commented',
    'post_liked',
    'post_commented',
    'system_announcement',
    -- New content interaction types
    'biography_liked',
    'core_story_liked',
    'core_story_commented',
    'one_liner_liked',
    'one_liner_commented',
    'story_liked',
    'story_commented'
  )),
  actor_id TEXT,
  target_id TEXT,
  title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Copy existing data (filter out any rows with non-existent user_id)
INSERT INTO notifications_new (id, user_id, type, actor_id, target_id, title, message, is_read, created_at)
SELECT n.id, n.user_id, n.type, n.actor_id, n.target_id,
       COALESCE(n.title, ''), COALESCE(n.message, ''), n.is_read, n.created_at
FROM notifications n
INNER JOIN users u ON n.user_id = u.id;

DROP TABLE notifications;
ALTER TABLE notifications_new RENAME TO notifications;

PRAGMA foreign_keys = ON;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = 0;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ============================================
-- PART 3: Notification Preferences Table
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id TEXT PRIMARY KEY,

  -- Interaction notifications
  goal_liked INTEGER NOT NULL DEFAULT 1,
  goal_commented INTEGER NOT NULL DEFAULT 1,
  goal_referenced INTEGER NOT NULL DEFAULT 1,
  post_liked INTEGER NOT NULL DEFAULT 1,
  post_commented INTEGER NOT NULL DEFAULT 1,
  biography_commented INTEGER NOT NULL DEFAULT 1,
  biography_liked INTEGER NOT NULL DEFAULT 1,
  core_story_liked INTEGER NOT NULL DEFAULT 1,
  core_story_commented INTEGER NOT NULL DEFAULT 1,
  one_liner_liked INTEGER NOT NULL DEFAULT 1,
  one_liner_commented INTEGER NOT NULL DEFAULT 1,
  story_liked INTEGER NOT NULL DEFAULT 1,
  story_commented INTEGER NOT NULL DEFAULT 1,

  -- Social notifications
  new_follower INTEGER NOT NULL DEFAULT 1,

  -- System notifications
  story_featured INTEGER NOT NULL DEFAULT 1,
  goal_completed INTEGER NOT NULL DEFAULT 1,

  -- Notification methods
  email_digest INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
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
-- PART 6: Content Interaction Tables (Likes & Comments)
-- ============================================

-- One-liner likes
CREATE TABLE IF NOT EXISTS one_liner_likes (
  id TEXT PRIMARY KEY,
  one_liner_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (one_liner_id) REFERENCES biography_one_liners(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (one_liner_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_one_liner_likes_item ON one_liner_likes(one_liner_id);
CREATE INDEX IF NOT EXISTS idx_one_liner_likes_user ON one_liner_likes(user_id);

-- One-liner comments
CREATE TABLE IF NOT EXISTS one_liner_comments (
  id TEXT PRIMARY KEY,
  one_liner_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id TEXT,
  like_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (one_liner_id) REFERENCES biography_one_liners(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES one_liner_comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_one_liner_comments_item ON one_liner_comments(one_liner_id);
CREATE INDEX IF NOT EXISTS idx_one_liner_comments_user ON one_liner_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_one_liner_comments_parent ON one_liner_comments(parent_id);

-- Story likes
CREATE TABLE IF NOT EXISTS story_likes (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (story_id) REFERENCES biography_stories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_story_likes_item ON story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_user ON story_likes(user_id);

-- Story comments
CREATE TABLE IF NOT EXISTS story_comments (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id TEXT,
  like_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (story_id) REFERENCES biography_stories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES story_comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_story_comments_item ON story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_user ON story_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_parent ON story_comments(parent_id);

-- Core story likes
CREATE TABLE IF NOT EXISTS core_story_likes (
  id TEXT PRIMARY KEY,
  core_story_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (core_story_id) REFERENCES biography_core_stories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (core_story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_core_story_likes_item ON core_story_likes(core_story_id);
CREATE INDEX IF NOT EXISTS idx_core_story_likes_user ON core_story_likes(user_id);

-- Core story comments
CREATE TABLE IF NOT EXISTS core_story_comments (
  id TEXT PRIMARY KEY,
  core_story_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id TEXT,
  like_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (core_story_id) REFERENCES biography_core_stories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES core_story_comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_core_story_comments_item ON core_story_comments(core_story_id);
CREATE INDEX IF NOT EXISTS idx_core_story_comments_user ON core_story_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_core_story_comments_parent ON core_story_comments(parent_id);

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
  ('climbing_origin', '你與攀岩的相遇', '描述第一次接觸攀岩的情景', '大學社團體驗，一爬就愛上了', 1),
  ('climbing_meaning', '攀岩對你來說是什麼？', '攀岩在你生活中扮演什麼角色', '一種生活方式，也是認識自己的途徑', 2),
  ('advice_to_self', '給剛開始攀岩的自己', '如果能回到起點，你會對自己說什麼', '不要急，享受每一次攀爬的過程', 3);

-- ============================================
-- PART 9: Seed Data - One-liner Questions
-- ============================================

INSERT INTO one_liner_questions (id, question, format_hint, placeholder, display_order) VALUES
  ('best_moment', '爬岩最爽的是？', '當＿＿＿的時候', '終於送出卡了一個月的 project', 4),
  ('favorite_place', '最喜歡在哪裡爬？', NULL, '龍洞的海邊岩壁', 5),
  ('current_goal', '目前的攀岩小目標？', NULL, '這個月送出 V4', 6),
  ('climbing_takeaway', '攀岩教會我的一件事？', NULL, '失敗沒什麼，再來就好', 7),
  ('climbing_style_desc', '用一句話形容你的攀岩風格？', NULL, '慢慢來但很穩', 8),
  ('life_outside', '攀岩之外，你是誰？', NULL, '工程師/學生/全職岩棍', 9),
  ('bucket_list', '攀岩人生清單上有什麼？', NULL, '去優勝美地爬一次、完攀龍洞經典路線', 10);

-- ============================================
-- PART 10: Seed Data - Story Questions
-- ============================================

-- A. Growth & Breakthrough (6 questions)
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('memorable_moment', 'sys_cat_growth', '有沒有某次攀爬讓你一直記到現在？', '不一定要多厲害，只要對你有意義', '去年第一次去龍洞...', 'easy', 1),
  ('biggest_challenge', 'sys_cat_growth', '有遇過什麼卡關的時候嗎？', '卡關也是成長的一部分', '有一段時間怎麼爬都沒進步...', 'medium', 2),
  ('breakthrough_story', 'sys_cat_growth', '最近有沒有覺得自己進步的時刻？', '小小的進步也值得記錄', '上週終於送出卡了一個月的那條路線...', 'easy', 3),
  ('first_outdoor', 'sys_cat_growth', '還記得第一次戶外攀岩嗎？', '室內和戶外的差別', '第一次站在真的岩壁前...', 'easy', 4),
  ('first_grade', 'sys_cat_growth', '有沒有哪條路線讓你特別有成就感？', '可能是第一次突破某個難度', '第一次送出 V4 的時候...', 'easy', 5),
  ('frustrating_climb', 'sys_cat_growth', '有沒有讓你很挫折的經驗？後來怎麼面對？', '挫折也是故事的一部分', '有一次摔傷了，休息了三個月...', 'medium', 6);

-- B. Psychology & Philosophy (6 questions)
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('fear_management', 'sys_cat_psychology', '會怕高或怕墜落嗎？怎麼面對的？', '每個人都有害怕的時候', '剛開始真的很怕，每次爬高一點心跳就加速...', 'medium', 1),
  ('climbing_lesson', 'sys_cat_psychology', '攀岩有沒有讓你學到什麼？', '可能是對生活的啟發', '學會了面對失敗，一次不行就再來...', 'medium', 2),
  ('failure_perspective', 'sys_cat_psychology', '爬不上去的時候會怎麼想？', '你的心態是什麼', '會有點挫折，但告訴自己下次再來...', 'easy', 3),
  ('flow_moment', 'sys_cat_psychology', '有沒有爬到忘記時間的經驗？', '那種完全投入的感覺', '有一次在龍洞，不知不覺就爬了六小時...', 'easy', 4),
  ('life_balance', 'sys_cat_psychology', '怎麼安排攀岩和其他生活？', '工作、家庭、社交的平衡', '平日上班，週末盡量安排一天去爬...', 'medium', 5),
  ('unexpected_gain', 'sys_cat_psychology', '攀岩有帶給你什麼意外的收穫嗎？', '可能是你沒想到的好處', '認識了很多很棒的朋友...', 'deep', 6);

-- C. Community & Connection (6 questions)
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('climbing_mentor', 'sys_cat_community', '有沒有想感謝的人？', '可能是教你的人、一起爬的朋友', '很感謝第一個帶我去爬的朋友...', 'easy', 1),
  ('climbing_partner', 'sys_cat_community', '有沒有固定的攀岩夥伴？有什麼故事？', '你們怎麼認識的', '在岩館認識的，現在每週都約...', 'easy', 2),
  ('funny_moment', 'sys_cat_community', '有沒有什麼搞笑或尷尬的經歷？', '爬岩的糗事也很有趣', '有一次在岩館，爬到一半褲子裂開了...', 'easy', 3),
  ('favorite_spot', 'sys_cat_community', '最常去或最推薦哪裡爬？為什麼？', '分享你的秘密基地', '最常去原岩，因為離家近而且氣氛很好...', 'easy', 4),
  ('advice_to_group', 'sys_cat_community', '想對新手（或某個族群）說什麼？', '你的建議或鼓勵', '不要因為爬不上去就覺得丟臉...', 'medium', 5),
  ('climbing_space', 'sys_cat_community', '有沒有對你特別有意義的岩館或地點？', '那個地方對你有什麼意義', '龍洞對我來說是特別的地方...', 'medium', 6);

-- D. Practical Sharing (6 questions)
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('injury_recovery', 'sys_cat_practical', '有受過傷嗎？怎麼復原的？', '分享你的經驗', '有一次 A2 滑輪受傷，休息了兩個月...', 'medium', 1),
  ('memorable_route', 'sys_cat_practical', '有沒有想分享的路線或經驗？', '你的私房路線', '龍洞的那條 5.10a 很適合練習...', 'easy', 2),
  ('training_method', 'sys_cat_practical', '你平常怎麼練習？有什麼小習慣？', '你的訓練方式', '每次爬完都會做伸展...', 'easy', 3),
  ('effective_practice', 'sys_cat_practical', '有沒有對你特別有效的練習方法？', '分享你的秘訣', '用 4x4 訓練法之後，耐力進步很多...', 'medium', 4),
  ('technique_tip', 'sys_cat_practical', '有沒有學到什麼實用的技巧？', '可能是某個動作或心法', '學會 heel hook 之後，很多路線突然變簡單了...', 'easy', 5),
  ('gear_choice', 'sys_cat_practical', '關於裝備有沒有什麼心得？', '你的裝備觀', '攀岩鞋真的要試穿，網購踩雷過...', 'easy', 6);

-- E. Dreams & Exploration (6 questions)
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('dream_climb', 'sys_cat_dreams', '如果能去任何地方爬，你想去哪？', '你的夢想攀岩地點', '想去優勝美地爬 El Cap...', 'easy', 1),
  ('climbing_trip', 'sys_cat_dreams', '有沒有印象深刻的攀岩旅行？', '分享你的旅行故事', '去泰國的喀比爬了一週...', 'easy', 2),
  ('bucket_list_story', 'sys_cat_dreams', '有沒有完成過什麼攀岩目標？感覺如何？', '你的里程碑', '去年終於完成了龍洞的經典路線...', 'medium', 3),
  ('climbing_goal', 'sys_cat_dreams', '最近有什麼想達成的小目標？', '你現在在努力什麼', '想在這個月內送出那條紫色 V4...', 'easy', 4),
  ('climbing_style', 'sys_cat_dreams', '最喜歡什麼樣的路線或風格？', '你的攀岩偏好', '喜歡技巧型的 slab...', 'easy', 5),
  ('climbing_inspiration', 'sys_cat_dreams', '有沒有啟發你的人、影片或故事？', '誰或什麼啟發了你', 'Alex Honnold 的 Free Solo 看了好幾遍...', 'easy', 6);

-- F. Life Integration (1 question)
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('life_outside_climbing', 'sys_cat_life', '攀岩之外，還有什麼讓你著迷？', '你的其他興趣', '還喜歡衝浪和露營...', 'easy', 1);

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

-- ============================================
-- PART 12: Migrate JSON data to new tables
-- ============================================
-- Note: UUID generation uses the following SQLite expression pattern:
--   lower(hex(randomblob(8))) || '-' || lower(hex(randomblob(4))) || '-4' ||
--   substr(lower(hex(randomblob(2))),2) || '-' ||
--   substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' ||
--   lower(hex(randomblob(6)))
-- This generates a UUID v4 compatible string. SQLite doesn't support UDFs in D1 migrations,
-- so this pattern is repeated in each INSERT statement below.

-- Migrate one_liners_data to biography_core_stories
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

-- Migrate stories_data to biography_stories using temp table
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
  SELECT 1 FROM biography_stories
  WHERE biography_id = t.biography_id AND question_id = t.question_id
);

DROP TABLE IF EXISTS temp_stories_flat;

-- Migrate visibility: is_public to visibility column
UPDATE biographies
SET visibility = 'public'
WHERE visibility IS NULL AND is_public = 1;

UPDATE biographies
SET visibility = 'private'
WHERE visibility IS NULL AND (is_public = 0 OR is_public IS NULL);

-- ============================================
-- PART 13: Cleanup redundant biography columns
-- Using table rebuild for SQLite/D1 compatibility (DROP COLUMN not allowed)
-- ============================================

PRAGMA foreign_keys = OFF;

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
-- Note: Only selecting fields that exist after Part 12 migrations
INSERT INTO biographies_new (
  id, user_id, name, slug, title, bio, avatar_url, cover_image,
  visibility,
  achievements, social_links,
  youtube_channel_id, featured_video_id,
  total_likes, total_views, follower_count, comment_count,
  is_featured, published_at,
  created_at, updated_at
)
SELECT
  b.id, b.user_id, b.name, b.slug, b.title, b.bio, b.avatar_url, b.cover_image,
  COALESCE(b.visibility, 'private'),  -- Use migrated visibility value from Part 12
  b.achievements, b.social_links,
  b.youtube_channel_id, b.featured_video_id,
  COALESCE(b.total_likes, 0), COALESCE(b.total_views, 0),
  COALESCE(b.follower_count, 0), COALESCE(b.comment_count, 0),
  b.is_featured, b.published_at,
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

PRAGMA foreign_keys = ON;
