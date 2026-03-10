-- Raise pipeline and generation timeout defaults
UPDATE ai_config SET value = '40000' WHERE key = 'pipeline_timeout_ms';
UPDATE ai_config SET value = '18000' WHERE key = 'generation_timeout_ms';
