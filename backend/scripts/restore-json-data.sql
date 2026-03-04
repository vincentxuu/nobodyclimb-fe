-- ============================================
-- 從備份恢復 biographies 的 JSON 資料
-- ============================================

-- 步驟 1: 先增加缺少的欄位到當前的 biographies 表
ALTER TABLE biographies ADD COLUMN one_liners_data TEXT;
ALTER TABLE biographies ADD COLUMN stories_data TEXT;

-- 注意: 如果欄位已存在,上面的 ALTER TABLE 會報錯,但可以忽略
-- SQLite 不支援 IF NOT EXISTS 在 ALTER TABLE 中

-- 步驟 2: 現在可以手動執行以下 UPDATE 語句來恢復資料
-- 這需要從備份檔案中提取資料

-- 範例 (需要從備份檔案中複製實際的資料):
-- UPDATE biographies SET
--   one_liners_data = '{"climbing_meaning":...}',
--   stories_data = '{"uncategorized":...}'
-- WHERE id = 'b1cd382add6d110fdfefec231d6d83cd';
