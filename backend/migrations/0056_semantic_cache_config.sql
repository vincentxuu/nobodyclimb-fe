-- 語義快取設定
-- 使用 VECTOR_INDEX 儲存查詢向量，對相似問題直接回傳快取結果，跳過完整 RAG pipeline

INSERT OR IGNORE INTO ai_config (key, value) VALUES
  -- 是否啟用語義快取（0=停用，1=啟用）；預設停用，待觀察效果後再開啟
  ('semantic_cache_enabled', '0'),
  -- 語義相似度門檻（0.8–1.0）；cosine similarity 高於此值視為相同問題
  -- 0.95 在實務上約等於「幾乎一模一樣的問法」，可依需求調低至 0.90 以提升命中率
  ('semantic_cache_threshold', '0.95');
