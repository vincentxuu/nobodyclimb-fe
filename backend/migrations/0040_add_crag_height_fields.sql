-- Migration: 0034_add_crag_height_fields
-- Description: 新增岩壁高度欄位 (height_min, height_max)
-- 與 altitude (海拔) 區分開來

-- 新增岩壁最小高度欄位
ALTER TABLE crags ADD COLUMN height_min INTEGER;

-- 新增岩壁最大高度欄位
ALTER TABLE crags ADD COLUMN height_max INTEGER;
