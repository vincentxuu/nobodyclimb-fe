-- ═══════════════════════════════════════════════════════════
-- Migration: Create question definition tables for admin management
-- Description:
--   - one_liner_questions: 一句話問題定義（可由 Admin 管理）
--   - story_questions: 小故事問題定義（可由 Admin 管理）
--   - story_categories: 故事分類定義
-- ═══════════════════════════════════════════════════════════

-- ============================================
-- 故事分類表
-- ============================================
CREATE TABLE IF NOT EXISTS story_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT,
  icon TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_story_categories_order ON story_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_story_categories_active ON story_categories(is_active) WHERE is_active = 1;

-- ============================================
-- 一句話問題定義表
-- ============================================
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

-- ============================================
-- 小故事問題定義表
-- ============================================
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
-- 初始資料：故事分類
-- ============================================
INSERT INTO story_categories (id, name, emoji, icon, description, display_order) VALUES
  ('growth', '成長與突破', '🌱', 'TrendingUp', '關於攀岩旅程中的成長經歷', 1),
  ('psychology', '心理與哲學', '🧠', 'Brain', '攀岩帶來的心理層面收穫', 2),
  ('community', '社群與連結', '👥', 'Users', '攀岩社群中的人際故事', 3),
  ('practical', '實用分享', '🔧', 'Wrench', '技術、訓練、裝備等實用經驗', 4),
  ('dreams', '夢想與探索', '🧭', 'Compass', '未來目標與攀岩夢想', 5),
  ('life', '生活整合', '🎨', 'Palette', '攀岩與生活的平衡', 6);

-- ============================================
-- 初始資料：一句話問題（核心題目）
-- ============================================
INSERT INTO one_liner_questions (id, question, format_hint, placeholder, display_order, is_core) VALUES
  ('climbing_origin', '你與攀岩的相遇', '描述第一次接觸攀岩的情景', '大學社團體驗，一爬就愛上了', 1, 1),
  ('climbing_meaning', '攀岩對你來說是什麼？', '攀岩在你生活中扮演什麼角色', '一種生活方式，也是認識自己的途徑', 2, 1),
  ('advice_to_self', '給剛開始攀岩的自己', '如果能回到起點，你會對自己說什麼', '不要急，享受每一次攀爬的過程', 3, 1),
  ('best_moment', '爬岩最爽的是？', '當＿＿＿的時候', '終於送出卡了一個月的 project', 4, 0),
  ('favorite_place', '最喜歡在哪裡爬？', NULL, '龍洞的海邊岩壁', 5, 0),
  ('current_goal', '目前的攀岩小目標？', NULL, '這個月送出 V4', 6, 0),
  ('climbing_takeaway', '攀岩教會我的一件事？', NULL, '失敗沒什麼，再來就好', 7, 0),
  ('climbing_style_desc', '用一句話形容你的攀岩風格？', NULL, '穩紮穩打型，喜歡把每個動作做扎實', 8, 0),
  ('life_outside', '不爬岩的時候在幹嘛？', NULL, '看電影、煮咖啡、發呆', 9, 0),
  ('bucket_list', '攀岩願望清單第一名？', NULL, '去優勝美地爬 El Capitan', 10, 0);

-- ============================================
-- 初始資料：小故事問題
-- ============================================
-- 成長與突破
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('memorable_moment', 'growth', '最難忘的攀岩時刻', '那個讓你印象最深刻的瞬間', '記得那天在龍洞...', 'easy', 1),
  ('biggest_challenge', 'growth', '最大的挑戰', '你曾經面臨過什麼樣的困難？', '有一次我卡在一條路線上整整三個月...', 'medium', 2),
  ('breakthrough_story', 'growth', '突破的故事', '分享一個你突破自我的經歷', '當我終於完成那條 project...', 'deep', 3),
  ('first_outdoor', 'growth', '第一次戶外攀岩', '描述你的戶外初體驗', '第一次到龍洞，被那片岩壁震撼到...', 'easy', 4),
  ('first_grade', 'growth', '突破新難度的故事', '分享突破個人最高難度的經歷', '從 V3 到 V4 花了我半年時間...', 'medium', 5);

-- 心理與哲學
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('fear_management', 'psychology', '如何面對恐懼', '分享你克服恐懼的方法', '站在高處時，我會深呼吸...', 'medium', 1),
  ('climbing_lesson', 'psychology', '攀岩教會我的事', '攀岩帶給你什麼人生啟發？', '攀岩讓我學會了耐心...', 'deep', 2),
  ('failure_perspective', 'psychology', '如何看待失敗', '你怎麼面對攀爬中的挫折？', '每次 fall 都是學習的機會...', 'medium', 3),
  ('flow_moment', 'psychology', '心流體驗', '描述一次完全投入的攀爬經歷', '有一次在爬一條熟悉的路線時...', 'deep', 4);

-- 社群與連結
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('climbing_mentor', 'community', '我的攀岩導師', '誰對你的攀岩之路影響最深？', '我的第一個教練教會我...', 'easy', 1),
  ('climbing_partner', 'community', '最佳攀岩夥伴', '分享你和攀岩夥伴的故事', '我們認識三年了，每週都會一起練習...', 'easy', 2),
  ('funny_moment', 'community', '最好笑的攀岩故事', '分享一個有趣的經歷', '有一次我在岩館...', 'easy', 3),
  ('favorite_spot', 'community', '秘密基地', '你最喜歡的攀岩地點是哪裡？', '有一個小眾的岩場...', 'easy', 4);

-- 實用分享
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('training_method', 'practical', '訓練心得', '分享你的訓練方法', '我每週會安排兩次指力訓練...', 'medium', 1),
  ('technique_tip', 'practical', '技術小撇步', '分享一個實用的攀岩技巧', '腳踩點的時候要注意...', 'easy', 2),
  ('gear_choice', 'practical', '裝備推薦', '推薦你最愛的攀岩裝備', '我的第一雙攀岩鞋是...', 'easy', 3),
  ('injury_recovery', 'practical', '傷後復健經驗', '分享受傷和復健的經歷', '去年手指受傷後...', 'medium', 4);

-- 夢想與探索
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('dream_climb', 'dreams', '夢想路線', '你最想完成的路線是什麼？', 'El Capitan 的 The Nose...', 'easy', 1),
  ('climbing_trip', 'dreams', '攀岩旅行計畫', '未來想去哪裡攀岩？', '一直很想去日本小川山...', 'easy', 2),
  ('climbing_goal', 'dreams', '長期目標', '你的攀岩長期目標是什麼？', '希望能在五年內...', 'medium', 3);

-- 生活整合
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('life_balance', 'life', '生活平衡', '如何平衡攀岩與其他生活？', '工作日晚上會去岩館放鬆...', 'medium', 1),
  ('life_outside_climbing', 'life', '岩壁以外的生活', '分享你攀岩以外的興趣', '除了攀岩，我還喜歡...', 'easy', 2);
