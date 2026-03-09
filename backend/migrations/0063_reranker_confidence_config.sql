-- Reranker 相關性閾值過濾 + Tool Selection 信心分數配置
-- Rollback: DELETE FROM ai_config WHERE key IN ('reranker_relevance_threshold', 'reranker_min_keep', 'tool_confidence_threshold');

INSERT OR IGNORE INTO ai_config (key, value) VALUES ('reranker_relevance_threshold', '0.3');
INSERT OR IGNORE INTO ai_config (key, value) VALUES ('reranker_min_keep', '2');
INSERT OR IGNORE INTO ai_config (key, value) VALUES ('tool_confidence_threshold', '0.7');
