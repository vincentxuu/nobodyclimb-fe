-- AI Security Guardrails
-- 新增 token 消耗追蹤欄位與高消耗告警標記

ALTER TABLE user_ranks ADD COLUMN daily_token_used INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_ranks ADD COLUMN daily_token_limit INTEGER NOT NULL DEFAULT 5000;

ALTER TABLE ai_query_logs ADD COLUMN is_high_consumption INTEGER NOT NULL DEFAULT 0;
