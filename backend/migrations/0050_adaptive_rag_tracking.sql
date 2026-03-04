-- Adaptive RAG 追蹤欄位：查詢類型、使用模型、retrieval 品質、self-reflection 觸發
ALTER TABLE ai_query_logs ADD COLUMN query_type TEXT;
ALTER TABLE ai_query_logs ADD COLUMN model_used TEXT;
ALTER TABLE ai_query_logs ADD COLUMN retrieval_score REAL;
ALTER TABLE ai_query_logs ADD COLUMN self_reflection_triggered INTEGER DEFAULT 0;
