-- ============================================
-- 驗證 JSON 資料遷移的完整性
-- 執行此腳本來確認所有 JSON 資料都已正確遷移到關聯式表格
-- ============================================

-- 檢查 1: 確認 JSON 欄位仍然存在且有資料
SELECT
  'JSON 資料保留檢查' as check_name,
  COUNT(*) as total_biographies,
  COUNT(CASE WHEN one_liners_data IS NOT NULL THEN 1 END) as has_one_liners,
  COUNT(CASE WHEN stories_data IS NOT NULL THEN 1 END) as has_stories
FROM biographies;

-- 檢查 2: Core Stories 遷移驗證
-- 計算 JSON 中的 core questions 數量
WITH core_questions (question_id, json_path) AS (
  VALUES
    ('climbing_origin', '$.climbing_origin.answer'),
    ('climbing_meaning', '$.climbing_meaning.answer'),
    ('advice_to_self', '$.advice_to_self.answer')
),
json_count AS (
  SELECT COUNT(*) as count
  FROM biographies b, core_questions q
  WHERE b.one_liners_data IS NOT NULL
    AND json_extract(b.one_liners_data, q.json_path) IS NOT NULL
    AND TRIM(json_extract(b.one_liners_data, q.json_path)) != ''
),
table_count AS (
  SELECT COUNT(*) as count
  FROM biography_core_stories
)
SELECT
  'Core Stories 遷移' as check_name,
  j.count as json_source_count,
  t.count as migrated_count,
  CASE
    WHEN j.count = t.count THEN '✓ 完全一致'
    WHEN t.count > j.count THEN '⚠ 遷移數量多於來源'
    ELSE '✗ 遷移數量少於來源'
  END as status
FROM json_count j, table_count t;

-- 檢查 3: One-liners 遷移驗證 (non-core questions)
WITH json_count AS (
  SELECT COUNT(*) as count
  FROM biographies b, json_each(b.one_liners_data) j
  WHERE b.one_liners_data IS NOT NULL
    AND json_valid(b.one_liners_data)
    AND j.key NOT IN ('climbing_origin', 'climbing_meaning', 'advice_to_self')
    AND json_extract(j.value, '$.answer') IS NOT NULL
    AND TRIM(json_extract(j.value, '$.answer')) != ''
),
table_count AS (
  SELECT COUNT(*) as count
  FROM biography_one_liners
)
SELECT
  'One-liners 遷移' as check_name,
  j.count as json_source_count,
  t.count as migrated_count,
  CASE
    WHEN j.count = t.count THEN '✓ 完全一致'
    WHEN t.count > j.count THEN '⚠ 遷移數量多於來源'
    WHEN j.count = 0 AND t.count = 0 THEN '✓ 無 non-core one-liners'
    ELSE '✗ 遷移數量少於來源'
  END as status
FROM json_count j, table_count t;

-- 檢查 4: Stories 遷移驗證
WITH json_count AS (
  SELECT COUNT(*) as count
  FROM biographies b,
    json_each(b.stories_data) cat,
    json_each(cat.value) q
  WHERE b.stories_data IS NOT NULL
    AND json_valid(b.stories_data)
    AND json_extract(q.value, '$.answer') IS NOT NULL
    AND TRIM(json_extract(q.value, '$.answer')) != ''
),
table_count AS (
  SELECT COUNT(*) as count
  FROM biography_stories
)
SELECT
  'Stories 遷移' as check_name,
  j.count as json_source_count,
  t.count as migrated_count,
  CASE
    WHEN j.count = t.count THEN '✓ 完全一致'
    WHEN t.count > j.count THEN '⚠ 遷移數量多於來源'
    ELSE '✗ 遷移數量少於來源'
  END as status
FROM json_count j, table_count t;

-- 檢查 4: 內容一致性抽樣驗證 (Core Stories)
-- 隨機抽取 5 筆資料比對 JSON 和遷移後的表格內容是否一致
SELECT
  'Core Stories 內容抽樣' as check_name,
  b.id as biography_id,
  bcs.question_id,
  SUBSTR(json_extract(b.one_liners_data, '$.' || bcs.question_id || '.answer'), 1, 50) as json_content_preview,
  SUBSTR(bcs.content, 1, 50) as table_content_preview,
  CASE
    WHEN json_extract(b.one_liners_data, '$.' || bcs.question_id || '.answer') = bcs.content THEN '✓'
    ELSE '✗'
  END as match_status
FROM biographies b
INNER JOIN biography_core_stories bcs ON b.id = bcs.biography_id
WHERE b.one_liners_data IS NOT NULL
LIMIT 5;

-- 檢查 5: 內容一致性抽樣驗證 (Stories)
SELECT
  'Stories 內容抽樣' as check_name,
  b.id as biography_id,
  bs.question_id,
  bs.category_id,
  SUBSTR(bs.content, 1, 50) as content_preview,
  LENGTH(bs.content) as content_length,
  bs.character_count
FROM biographies b
INNER JOIN biography_stories bs ON b.id = bs.biography_id
WHERE b.stories_data IS NOT NULL
LIMIT 5;

-- 檢查 6: 檢查是否有遺漏的資料
-- 找出在 JSON 中有資料但未遷移到表格的 biographies
SELECT
  '遺漏檢查' as check_name,
  COUNT(DISTINCT b.id) as biographies_with_json,
  COUNT(DISTINCT bcs.biography_id) as biographies_with_core_stories,
  COUNT(DISTINCT bs.biography_id) as biographies_with_stories
FROM biographies b
LEFT JOIN biography_core_stories bcs ON b.id = bcs.biography_id
LEFT JOIN biography_stories bs ON b.id = bs.biography_id
WHERE b.one_liners_data IS NOT NULL OR b.stories_data IS NOT NULL;

-- 檢查 7: 顯示每個 biography 的遷移統計
SELECT
  b.id,
  b.name,
  CASE WHEN b.one_liners_data IS NOT NULL THEN 'Y' ELSE 'N' END as has_json_oneliners,
  CASE WHEN b.stories_data IS NOT NULL THEN 'Y' ELSE 'N' END as has_json_stories,
  COUNT(DISTINCT bcs.id) as core_stories_count,
  COUNT(DISTINCT bs.id) as stories_count
FROM biographies b
LEFT JOIN biography_core_stories bcs ON b.id = bcs.biography_id
LEFT JOIN biography_stories bs ON b.id = bs.biography_id
GROUP BY b.id, b.name, b.one_liners_data, b.stories_data
HAVING has_json_oneliners = 'Y' OR has_json_stories = 'Y'
ORDER BY b.created_at DESC
LIMIT 10;
