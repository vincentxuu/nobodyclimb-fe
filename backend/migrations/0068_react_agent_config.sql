-- React Agent 配置
-- react_models: JSON ModelMap，null 時用預設值
-- react_max_turns: 最大 turn 數
-- react_token_budget: token 預算上限
-- react_usd_to_twd: USD 轉 TWD 匯率
INSERT OR IGNORE INTO ai_config (key, value) VALUES ('react_max_turns', '3');
INSERT OR IGNORE INTO ai_config (key, value) VALUES ('react_token_budget', '8000');
INSERT OR IGNORE INTO ai_config (key, value) VALUES ('react_usd_to_twd', '32.0');
