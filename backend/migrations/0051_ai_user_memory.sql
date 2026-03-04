-- AI User Memory
-- 建立用戶 AI 記憶表，儲存從對話中自動提取的個人偏好與行為記憶

CREATE TABLE IF NOT EXISTS user_ai_memory (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  memory_key TEXT NOT NULL,     -- 結構化識別碼：climbing_level / preferred_region / preferred_style / preferred_crag / goals
  memory_type TEXT NOT NULL CHECK (memory_type IN ('preference', 'behavior', 'fact')),
  content TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- (user_id, memory_key) 唯一索引，確保同 key 記憶只保留最新版本
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_ai_memory_user_key ON user_ai_memory(user_id, memory_key);

-- 查詢單一用戶所有記憶（依更新時間倒序）
CREATE INDEX IF NOT EXISTS idx_user_ai_memory_user_id ON user_ai_memory(user_id, updated_at DESC);
