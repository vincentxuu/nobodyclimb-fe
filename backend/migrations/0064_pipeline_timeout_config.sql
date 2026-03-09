-- Pipeline 超時與熔斷機制配置
INSERT OR IGNORE INTO ai_config (key, value) VALUES ('pipeline_timeout_ms', '20000');
INSERT OR IGNORE INTO ai_config (key, value) VALUES ('embedding_timeout_ms', '3000');
INSERT OR IGNORE INTO ai_config (key, value) VALUES ('search_timeout_ms', '4000');
INSERT OR IGNORE INTO ai_config (key, value) VALUES ('generation_timeout_ms', '12000');
INSERT OR IGNORE INTO ai_config (key, value) VALUES ('hyde_timeout_ms', '5000');
INSERT OR IGNORE INTO ai_config (key, value) VALUES ('multi_query_timeout_ms', '5000');
INSERT OR IGNORE INTO ai_config (key, value) VALUES ('circuit_breaker_threshold', '5');
INSERT OR IGNORE INTO ai_config (key, value) VALUES ('circuit_breaker_reset_ms', '30000');
