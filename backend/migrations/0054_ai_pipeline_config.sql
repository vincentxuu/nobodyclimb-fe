-- AI Pipeline 可設定參數
-- 讓 admin/ai/settings 可控制整個 RAG pipeline 的核心配置

-- 新增各階段可設定的 config key
INSERT OR IGNORE INTO ai_config (key, value) VALUES
  -- 簡單查詢模型（queryType=simple）
  ('simple_model', '@cf/meta/llama-3.1-8b-instruct'),
  -- 輕量模型（judge、general-knowledge）
  ('lightweight_model', '@cf/meta/llama-3.1-8b-instruct'),
  -- 生成階段最大 token 數（main generation + self-reflection 重生成）
  ('max_tokens_generation', '800'),
  -- 通識回答最大 token 數（general-knowledge 路徑）
  ('max_tokens_gk', '600'),
  -- Vectorize 候選池大小（單岩場；多岩場自動 ×2）
  ('merge_top_k', '10');

-- 確保 max_results 存在（0046 已 INSERT OR IGNORE，此處補保險）
INSERT OR IGNORE INTO ai_config (key, value) VALUES ('max_results', '5');
