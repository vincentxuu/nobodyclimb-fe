-- Migration: 遷移 biographies.climbing_locations JSON 資料到正規化表格
-- 此 migration 會將所有現有的 climbing_locations JSON 資料遷移到獨立的 climbing_locations 表

-- 使用 SQLite JSON 函數解析 JSON 陣列並插入到正規化表格
-- hex(randomblob(16)) 生成 32 字元的隨機 ID

INSERT INTO climbing_locations (
  id,
  biography_id,
  location,
  country,
  visit_year,
  notes,
  photos,
  is_public,
  sort_order,
  created_at,
  updated_at
)
SELECT
  lower(hex(randomblob(16))) as id,
  b.id as biography_id,
  json_extract(loc.value, '$.location') as location,
  json_extract(loc.value, '$.country') as country,
  json_extract(loc.value, '$.visit_year') as visit_year,
  json_extract(loc.value, '$.notes') as notes,
  json_extract(loc.value, '$.photos') as photos,
  CASE
    WHEN json_extract(loc.value, '$.is_public') = 0 THEN 0
    WHEN json_extract(loc.value, '$.is_public') = false THEN 0
    ELSE 1
  END as is_public,
  loc.key as sort_order,
  datetime('now') as created_at,
  datetime('now') as updated_at
FROM biographies b,
     json_each(b.climbing_locations) loc
WHERE b.climbing_locations IS NOT NULL
  AND b.climbing_locations != ''
  AND b.climbing_locations != '[]'
  AND json_valid(b.climbing_locations)
  -- 避免重複遷移：只遷移尚未在 climbing_locations 表中的資料
  AND NOT EXISTS (
    SELECT 1 FROM climbing_locations cl
    WHERE cl.biography_id = b.id
  );

-- 遷移完成後，清空 biographies.climbing_locations 欄位（可選）
-- 如果想保留原始資料作為備份，可以註解掉這行
-- UPDATE biographies SET climbing_locations = NULL WHERE climbing_locations IS NOT NULL;
