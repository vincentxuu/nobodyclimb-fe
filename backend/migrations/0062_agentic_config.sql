-- Migration 0062: Agentic Multi-Step RAG 設定
-- rag_strategy: 'baseline'（預設）| 'agentic'（multi-step 模式）
-- agentic_max_steps: Agentic loop 最多幾輪額外搜尋（1–5）
-- agentic_min_docs_to_answer: 累積超過此文件數後提前結束迴圈（1–10）
INSERT OR IGNORE INTO ai_config (key, value) VALUES
  ('rag_strategy',               'baseline'),
  ('agentic_max_steps',          '3'),
  ('agentic_min_docs_to_answer', '3');
