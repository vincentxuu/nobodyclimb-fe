-- Quiz 系統：人格測驗結果 + 訓練進度

-- 用戶表新增攀岩性格欄位
ALTER TABLE users ADD COLUMN personality_type TEXT;
ALTER TABLE users ADD COLUMN personality_taken_at TEXT;

-- 測驗結果表
CREATE TABLE IF NOT EXISTS quiz_results (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  personality_type TEXT NOT NULL,
  power_pct INTEGER NOT NULL DEFAULT 50,
  goal_pct INTEGER NOT NULL DEFAULT 50,
  bold_pct INTEGER NOT NULL DEFAULT 50,
  grit_index INTEGER,
  flow_index INTEGER,
  answers TEXT NOT NULL DEFAULT '[]',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_personality_type ON quiz_results(personality_type);
CREATE INDEX IF NOT EXISTS idx_quiz_results_created_at ON quiz_results(created_at);

-- 訓練進度表
CREATE TABLE IF NOT EXISTS training_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  personality_type TEXT NOT NULL,
  week INTEGER NOT NULL,
  day INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, personality_type, week, day)
);

CREATE INDEX IF NOT EXISTS idx_training_progress_user_type ON training_progress(user_id, personality_type);
