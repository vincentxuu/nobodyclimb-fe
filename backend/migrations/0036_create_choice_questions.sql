-- 選擇題問題表
CREATE TABLE IF NOT EXISTS choice_questions (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  hint TEXT,
  follow_up_prompt TEXT,
  follow_up_placeholder TEXT,
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  stage TEXT DEFAULT 'onboarding',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 選項表
CREATE TABLE IF NOT EXISTS choice_options (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_other INTEGER DEFAULT 0,
  response_template TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (question_id) REFERENCES choice_questions(id) ON DELETE CASCADE
);

-- 用戶回答表
CREATE TABLE IF NOT EXISTS choice_answers (
  id TEXT PRIMARY KEY,
  biography_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  option_id TEXT,
  custom_text TEXT,
  follow_up_text TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (biography_id) REFERENCES biographies(id) ON DELETE CASCADE,
  UNIQUE (biography_id, question_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_choice_options_question ON choice_options(question_id);
CREATE INDEX IF NOT EXISTS idx_choice_answers_biography ON choice_answers(biography_id);
CREATE INDEX IF NOT EXISTS idx_choice_answers_option ON choice_answers(option_id);

-- 種子資料：第一個選擇題
INSERT OR IGNORE INTO choice_questions (id, question, hint, follow_up_prompt, follow_up_placeholder, display_order, is_active, stage)
VALUES (
  'how_started_climbing',
  '你是怎麼開始攀岩的？',
  NULL,
  '想不想用一句話描述那天的經歷？',
  '本來只是去看看，結果一爬就...',
  1,
  1,
  'onboarding'
);

-- 種子資料：選項
INSERT OR IGNORE INTO choice_options (id, question_id, label, value, sort_order, is_other, response_template)
VALUES
  ('opt_friend', 'how_started_climbing', '朋友拉我去的', 'friend_invited', 1, 0, '原來你也是被朋友拉進來的！'),
  ('opt_self', 'how_started_climbing', '自己想嘗試', 'self_curious', 2, 0, '好奇心是攀岩的開始！'),
  ('opt_media', 'how_started_climbing', '看了影片/比賽被吸引', 'media_inspired', 3, 0, '影片的魅力真的很大！'),
  ('opt_other', 'how_started_climbing', '其他', 'other', 4, 1, '每個人的開始都是獨特的故事！');
