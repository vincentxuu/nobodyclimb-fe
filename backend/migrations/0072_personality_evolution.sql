-- Personality Evolution System
-- 人格演化系統：追蹤用戶攀岩人格隨行為數據的演變

CREATE TABLE IF NOT EXISTS personality_evolution (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  from_type TEXT,
  to_type TEXT NOT NULL,
  power_pct REAL NOT NULL,
  goal_pct REAL NOT NULL,
  bold_pct REAL NOT NULL,
  style_spectrum REAL,
  trigger TEXT NOT NULL,
  consecutive_count INTEGER DEFAULT 1,
  calculated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_evolution_user ON personality_evolution(user_id);
CREATE INDEX IF NOT EXISTS idx_evolution_date ON personality_evolution(calculated_at);

ALTER TABLE users ADD COLUMN style_spectrum REAL;
