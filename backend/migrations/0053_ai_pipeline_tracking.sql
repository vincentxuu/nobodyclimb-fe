-- AI Pipeline 追蹤欄位：快取命中、HyDE 觸發
-- 讓 admin/ai/logs 可顯示每個查詢的完整 RAG 流程

ALTER TABLE ai_query_logs ADD COLUMN cache_hit INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ai_query_logs ADD COLUMN hyde_triggered INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_ai_query_logs_cache ON ai_query_logs(cache_hit);
