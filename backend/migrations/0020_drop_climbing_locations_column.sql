-- ═══════════════════════════════════════════════════════════
-- Migration: Drop climbing_locations column from biographies
-- Description: Remove the deprecated climbing_locations JSON column.
--              Climbing locations data is now stored in the normalized
--              climbing_locations table (created in migration 0014).
-- ═══════════════════════════════════════════════════════════

-- 移除 biographies 表中的 climbing_locations 欄位
-- 資料已在 0019 migration 中遷移到正規化的 climbing_locations 表
-- SQLite 3.35.0+ 支援 DROP COLUMN (Cloudflare D1 支援此語法)

ALTER TABLE biographies DROP COLUMN climbing_locations;
