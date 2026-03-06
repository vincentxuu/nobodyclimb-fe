-- Migration 0061: 新增 pipeline_trace 欄位，儲存每次查詢的決策細節（HyDE 內容、Multi-Query 子查詢、Retrieval 路徑、RRF 候選數等）
ALTER TABLE ai_query_logs ADD COLUMN pipeline_trace TEXT;
