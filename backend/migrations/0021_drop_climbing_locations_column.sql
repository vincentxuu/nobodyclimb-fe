-- ═══════════════════════════════════════════════════════════
-- Migration: Drop climbing_locations column from biographies
--
-- 注意：此 migration 已在 production 以 0020_drop_climbing_locations_column.sql
-- 的名稱執行過。此檔案保留為 no-op 以確保 migration 記錄一致性。
--
-- 原始功能：移除 biographies 表中已棄用的 climbing_locations JSON 欄位
-- 資料已遷移到正規化的 climbing_locations 表 (migration 0014 建立)
-- ═══════════════════════════════════════════════════════════

-- No-op: 此 migration 已執行，保留空操作以維持檔案追蹤
SELECT 1;
