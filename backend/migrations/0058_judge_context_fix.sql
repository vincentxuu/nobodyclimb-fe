-- 調整 Judge context 截斷長度，讓 Judge 能看到更多參考資料
-- 原始設定 800 字元太短，當多筆文件時 Judge 只看到前 2-3 筆，導致後面路線被判為非 grounded
INSERT OR REPLACE INTO ai_config (key, value) VALUES
  ('judge_context_truncate', '2000');
