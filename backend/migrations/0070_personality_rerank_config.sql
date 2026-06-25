-- 人格感知推薦 pipeline 參數
INSERT OR IGNORE INTO ai_config (key, value, description) VALUES
  ('personality_weight', '0.15', 'personality rerank 在最終分數中的權重'),
  ('personality_mode', 'balanced', 'balanced 或 anti_style'),
  ('personality_anti_ratio', '0.4', 'balanced 模式下反風格的基礎分數'),
  ('personality_anti_retrieve_count', '10', '反風格補充檢索的最大數量');
