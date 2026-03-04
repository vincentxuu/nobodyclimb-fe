-- =============================================
-- ai_query_logs 品質保證欄位擴充
-- =============================================
ALTER TABLE ai_query_logs ADD COLUMN groundedness_score REAL;
ALTER TABLE ai_query_logs ADD COLUMN auto_score INTEGER;
ALTER TABLE ai_query_logs ADD COLUMN embedding_ms INTEGER;
ALTER TABLE ai_query_logs ADD COLUMN retrieval_ms INTEGER;
ALTER TABLE ai_query_logs ADD COLUMN generation_ms INTEGER;

-- =============================================
-- ai_flagged_responses: 低品質回應人工審核佇列
-- =============================================
CREATE TABLE IF NOT EXISTS ai_flagged_responses (
  id TEXT PRIMARY KEY,
  query_log_id TEXT NOT NULL,
  flag_reason TEXT NOT NULL,        -- 'low_groundedness' | 'low_feedback' | 'score_discrepancy'
  is_reviewed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (query_log_id) REFERENCES ai_query_logs(id) ON DELETE CASCADE,
  UNIQUE (query_log_id, flag_reason)
);

CREATE INDEX IF NOT EXISTS idx_ai_flagged_reviewed ON ai_flagged_responses(is_reviewed);
CREATE INDEX IF NOT EXISTS idx_ai_flagged_reason ON ai_flagged_responses(flag_reason);
CREATE INDEX IF NOT EXISTS idx_ai_flagged_created ON ai_flagged_responses(created_at);
