-- AI 路線推薦記錄資料表
-- 儲存每次系統或用戶手動觸發的 AI 路線推薦結果，永久保留歷史不覆蓋

CREATE TABLE IF NOT EXISTS user_recommendations (
  id TEXT PRIMARY KEY,                               -- UUID
  user_id INTEGER NOT NULL,
  triggered_by TEXT NOT NULL CHECK(triggered_by IN ('ascent', 'manual')),
  status TEXT NOT NULL DEFAULT 'success' CHECK(status IN ('success', 'failed')),
  recommendation TEXT,                               -- JSON: { answer, sources, query, context_ascents }
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id
  ON user_recommendations(user_id, created_at DESC);
