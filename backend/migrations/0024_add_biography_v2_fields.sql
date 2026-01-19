-- ═══════════════════════════════════════════════════════════
-- Migration: Add BiographyV2 fields for progressive disclosure design
--
-- 注意：此 migration 已在 production 以 0023_add_biography_v2_fields.sql
-- 的名稱執行過。此檔案保留為 no-op 以確保 migration 記錄一致性。
--
-- 原始功能：
-- - 添加 visibility, tags_data, one_liners_data, stories_data,
--   basic_info_data, autosave_at 等欄位
-- - 建立索引
-- - 遷移現有資料到新格式
-- ═══════════════════════════════════════════════════════════

-- No-op: 此 migration 已執行，保留空操作以維持檔案追蹤
SELECT 1;
