-- ═══════════════════════════════════════════════════════════
-- Migration: Create question definition tables for admin management
-- Description:
--   - core_story_questions: 核心故事問題定義（3題固定）
--   - one_liner_questions: 一句話問題定義（可由 Admin 管理）
--   - story_questions: 小故事問題定義（可由 Admin 管理）
--   - story_categories: 故事分類定義
-- Note: Data matches frontend constants in src/lib/constants/biography-questions.ts
-- ═══════════════════════════════════════════════════════════

-- ============================================
-- 核心故事問題定義表（固定3題，未來可擴充）
-- ============================================
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
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_one_liner_questions_order ON one_liner_questions(display_order);
CREATE INDEX IF NOT EXISTS idx_one_liner_questions_active ON one_liner_questions(is_active) WHERE is_active = 1;

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
-- 初始資料：故事分類（使用 sys_cat_* ID）
-- ============================================
INSERT INTO story_categories (id, name, emoji, icon, description, display_order) VALUES
  ('sys_cat_growth', '成長與突破', '🌱', 'TrendingUp', '你的攀岩成長故事', 1),
  ('sys_cat_psychology', '心理與哲學', '🧠', 'Brain', '攀岩帶給你的思考', 2),
  ('sys_cat_community', '社群與連結', '😄', 'Users', '攀岩社群的故事', 3),
  ('sys_cat_practical', '實用分享', '🔧', 'Wrench', '經驗與技巧分享', 4),
  ('sys_cat_dreams', '夢想與探索', '🎯', 'Compass', '攀岩的夢想與目標', 5),
  ('sys_cat_life', '生活整合', '🌈', 'Palette', '攀岩與生活的交集', 6);

-- ============================================
-- 初始資料：核心故事問題（3題）
-- ============================================
INSERT INTO core_story_questions (id, title, subtitle, placeholder, display_order) VALUES
  ('climbing_origin', '你與攀岩的相遇', '描述第一次接觸攀岩的情景', '大學社團體驗，一爬就愛上了', 1),
  ('climbing_meaning', '攀岩對你來說是什麼？', '攀岩在你生活中扮演什麼角色', '一種生活方式，也是認識自己的途徑', 2),
  ('advice_to_self', '給剛開始攀岩的自己', '如果能回到起點，你會對自己說什麼', '不要急，享受每一次攀爬的過程', 3);

-- ============================================
-- 初始資料：一句話問題（不含核心3題，從 order 4 開始）
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
-- 初始資料：小故事問題
-- ============================================

-- A. 成長與突破（6題）
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('memorable_moment', 'sys_cat_growth', '有沒有某次攀爬讓你一直記到現在？', '不一定要多厲害，只要對你有意義', '去年第一次去龍洞...', 'easy', 1),
  ('biggest_challenge', 'sys_cat_growth', '有遇過什麼卡關的時候嗎？', '卡關也是成長的一部分', '有一段時間怎麼爬都沒進步...', 'medium', 2),
  ('breakthrough_story', 'sys_cat_growth', '最近有沒有覺得自己進步的時刻？', '小小的進步也值得記錄', '上週終於送出卡了一個月的那條路線...', 'easy', 3),
  ('first_outdoor', 'sys_cat_growth', '還記得第一次戶外攀岩嗎？', '室內和戶外的差別', '第一次站在真的岩壁前...', 'easy', 4),
  ('first_grade', 'sys_cat_growth', '有沒有哪條路線讓你特別有成就感？', '可能是第一次突破某個難度', '第一次送出 V4 的時候...', 'easy', 5),
  ('frustrating_climb', 'sys_cat_growth', '有沒有讓你很挫折的經驗？後來怎麼面對？', '挫折也是故事的一部分', '有一次摔傷了，休息了三個月...', 'medium', 6);

-- B. 心理與哲學（6題）
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('fear_management', 'sys_cat_psychology', '會怕高或怕墜落嗎？怎麼面對的？', '每個人都有害怕的時候', '剛開始真的很怕，每次爬高一點心跳就加速...', 'medium', 1),
  ('climbing_lesson', 'sys_cat_psychology', '攀岩有沒有讓你學到什麼？', '可能是對生活的啟發', '學會了面對失敗，一次不行就再來...', 'medium', 2),
  ('failure_perspective', 'sys_cat_psychology', '爬不上去的時候會怎麼想？', '你的心態是什麼', '會有點挫折，但告訴自己下次再來...', 'easy', 3),
  ('flow_moment', 'sys_cat_psychology', '有沒有爬到忘記時間的經驗？', '那種完全投入的感覺', '有一次在龍洞，不知不覺就爬了六小時...', 'easy', 4),
  ('life_balance', 'sys_cat_psychology', '怎麼安排攀岩和其他生活？', '工作、家庭、社交的平衡', '平日上班，週末盡量安排一天去爬...', 'medium', 5),
  ('unexpected_gain', 'sys_cat_psychology', '攀岩有帶給你什麼意外的收穫嗎？', '可能是你沒想到的好處', '認識了很多很棒的朋友...', 'deep', 6);

-- C. 社群與連結（6題）
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('climbing_mentor', 'sys_cat_community', '有沒有想感謝的人？', '可能是教你的人、一起爬的朋友', '很感謝第一個帶我去爬的朋友...', 'easy', 1),
  ('climbing_partner', 'sys_cat_community', '有沒有固定的攀岩夥伴？有什麼故事？', '你們怎麼認識的', '在岩館認識的，現在每週都約...', 'easy', 2),
  ('funny_moment', 'sys_cat_community', '有沒有什麼搞笑或尷尬的經歷？', '爬岩的糗事也很有趣', '有一次在岩館，爬到一半褲子裂開了...', 'easy', 3),
  ('favorite_spot', 'sys_cat_community', '最常去或最推薦哪裡爬？為什麼？', '分享你的秘密基地', '最常去原岩，因為離家近而且氣氛很好...', 'easy', 4),
  ('advice_to_group', 'sys_cat_community', '想對新手（或某個族群）說什麼？', '你的建議或鼓勵', '不要因為爬不上去就覺得丟臉...', 'medium', 5),
  ('climbing_space', 'sys_cat_community', '有沒有對你特別有意義的岩館或地點？', '那個地方對你有什麼意義', '龍洞對我來說是特別的地方...', 'medium', 6);

-- D. 實用分享（6題）
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('injury_recovery', 'sys_cat_practical', '有受過傷嗎？怎麼復原的？', '分享你的經驗', '有一次 A2 滑輪受傷，休息了兩個月...', 'medium', 1),
  ('memorable_route', 'sys_cat_practical', '有沒有想分享的路線或經驗？', '你的私房路線', '龍洞的那條 5.10a 很適合練習...', 'easy', 2),
  ('training_method', 'sys_cat_practical', '你平常怎麼練習？有什麼小習慣？', '你的訓練方式', '每次爬完都會做伸展...', 'easy', 3),
  ('effective_practice', 'sys_cat_practical', '有沒有對你特別有效的練習方法？', '分享你的秘訣', '用 4x4 訓練法之後，耐力進步很多...', 'medium', 4),
  ('technique_tip', 'sys_cat_practical', '有沒有學到什麼實用的技巧？', '可能是某個動作或心法', '學會 heel hook 之後，很多路線突然變簡單了...', 'easy', 5),
  ('gear_choice', 'sys_cat_practical', '關於裝備有沒有什麼心得？', '你的裝備觀', '攀岩鞋真的要試穿，網購踩雷過...', 'easy', 6);

-- E. 夢想與探索（6題）
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('dream_climb', 'sys_cat_dreams', '如果能去任何地方爬，你想去哪？', '你的夢想攀岩地點', '想去優勝美地爬 El Cap...', 'easy', 1),
  ('climbing_trip', 'sys_cat_dreams', '有沒有印象深刻的攀岩旅行？', '分享你的旅行故事', '去泰國的喀比爬了一週...', 'easy', 2),
  ('bucket_list_story', 'sys_cat_dreams', '有沒有完成過什麼攀岩目標？感覺如何？', '你的里程碑', '去年終於完成了龍洞的經典路線...', 'medium', 3),
  ('climbing_goal', 'sys_cat_dreams', '最近有什麼想達成的小目標？', '你現在在努力什麼', '想在這個月內送出那條紫色 V4...', 'easy', 4),
  ('climbing_style', 'sys_cat_dreams', '最喜歡什麼樣的路線或風格？', '你的攀岩偏好', '喜歡技巧型的 slab...', 'easy', 5),
  ('climbing_inspiration', 'sys_cat_dreams', '有沒有啟發你的人、影片或故事？', '誰或什麼啟發了你', 'Alex Honnold 的 Free Solo 看了好幾遍...', 'easy', 6);

-- F. 生活整合（1題）
INSERT INTO story_questions (id, category_id, title, subtitle, placeholder, difficulty, display_order) VALUES
  ('life_outside_climbing', 'sys_cat_life', '攀岩之外，還有什麼讓你著迷？', '你的其他興趣', '還喜歡衝浪和露營...', 'easy', 1);
