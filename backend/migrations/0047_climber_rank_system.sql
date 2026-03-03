-- 攀岩段位系統
-- climber_ranks: 段位定義表
-- user_ranks: 用戶段位狀態表

-- =============================================
-- climber_ranks: 段位定義（麓/壁/稜/巔）
-- =============================================
CREATE TABLE IF NOT EXISTS climber_ranks (
  id TEXT PRIMARY KEY,                    -- foothill, wall, ridge, summit
  name TEXT NOT NULL UNIQUE,              -- 英文識別名
  display_name TEXT NOT NULL,             -- 顯示名稱（麓、壁、稜、巔）
  min_score INTEGER NOT NULL DEFAULT 0,   -- 達到此段位所需最低積分
  daily_ai_limit INTEGER NOT NULL,        -- 每日 AI 使用次數上限
  color TEXT NOT NULL,                    -- 前端顯示色彩 token
  description TEXT,                       -- 段位說明
  created_at TEXT DEFAULT (datetime('now'))
);

-- 預設段位資料
INSERT OR IGNORE INTO climber_ranks (id, name, display_name, min_score, daily_ai_limit, color, description) VALUES
  ('foothill', 'foothill', '麓', 0,  2,  'stone',  '踏上山腳，攀岩旅途的起點'),
  ('wall',     'wall',     '壁', 25, 6,  'slate',  '面對岩壁，開始真正的攀爬'),
  ('ridge',    'ridge',    '稜', 55, 12, 'amber',  '站上稜線，俯瞰山谷與天際'),
  ('summit',   'summit',   '巔', 85, 24, 'indigo', '登上頂點，攀岩已融入靈魂');

-- =============================================
-- user_ranks: 用戶段位狀態
-- =============================================
CREATE TABLE IF NOT EXISTS user_ranks (
  user_id TEXT PRIMARY KEY,
  score INTEGER NOT NULL DEFAULT 0,                            -- 當前段位積分
  rank_id TEXT NOT NULL DEFAULT 'foothill',                    -- 當前段位 ID
  daily_ai_used INTEGER NOT NULL DEFAULT 0,                    -- 今日已使用 AI 次數
  daily_ai_limit INTEGER NOT NULL DEFAULT 2,                   -- 今日 AI 使用上限（冗餘，避免 JOIN）
  last_reset_date TEXT DEFAULT (date('now')),                  -- 最後重置日期（YYYY-MM-DD）
  last_score_calculated_at TEXT DEFAULT (datetime('now')),     -- 最後積分計算時間
  rank_override_id TEXT,                                       -- 管理員手動覆寫段位（NULL 表示自動計算）
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (rank_id) REFERENCES climber_ranks(id),
  FOREIGN KEY (rank_override_id) REFERENCES climber_ranks(id)
);

CREATE INDEX IF NOT EXISTS idx_user_ranks_rank ON user_ranks(rank_id);
CREATE INDEX IF NOT EXISTS idx_user_ranks_score ON user_ranks(score DESC);
CREATE INDEX IF NOT EXISTS idx_user_ranks_reset ON user_ranks(last_reset_date);
