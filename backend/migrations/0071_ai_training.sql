-- AI 訓練計畫：儲存 AI 生成的個人化訓練計畫與用戶回饋

CREATE TABLE IF NOT EXISTS ai_training_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  personality_type TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  difficulty_level INTEGER NOT NULL DEFAULT 2,
  plan_content TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'ai',
  model_id TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  generated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, personality_type, week_number)
);

CREATE TABLE IF NOT EXISTS ai_training_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  rating TEXT NOT NULL,
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES ai_training_plans(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_training_plans_user ON ai_training_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_training_plans_lookup ON ai_training_plans(user_id, personality_type, week_number);
CREATE INDEX IF NOT EXISTS idx_ai_training_feedback_user ON ai_training_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_training_feedback_plan ON ai_training_feedback(plan_id);
