-- ============================================
-- 測試 JSON 提取邏輯
-- ============================================

-- 測試 1: 檢查 one_liners_data 的結構
SELECT
  id,
  user_id,
  json_extract(one_liners_data, '$.climbing_origin.answer') as climbing_origin,
  json_extract(one_liners_data, '$.climbing_meaning.answer') as climbing_meaning,
  json_extract(one_liners_data, '$.advice_to_self.answer') as advice_to_self
FROM biographies
WHERE one_liners_data IS NOT NULL
LIMIT 1;

-- 測試 2: 使用 json_each 遍歷 one_liners_data
SELECT
  b.id,
  j.key,
  json_extract(j.value, '$.answer') as answer,
  LENGTH(json_extract(j.value, '$.answer')) as answer_length
FROM biographies b, json_each(b.one_liners_data) j
WHERE b.one_liners_data IS NOT NULL
  AND json_valid(b.one_liners_data)
LIMIT 10;

-- 測試 3: 檢查 stories_data 的結構
SELECT
  id,
  json_type(stories_data) as type,
  json_tree.key,
  json_tree.value,
  json_tree.type,
  json_tree.path
FROM biographies, json_tree(biographies.stories_data)
WHERE stories_data IS NOT NULL
LIMIT 20;

-- 測試 4: 使用巢狀 json_each 遍歷 stories_data
SELECT
  b.id,
  cat.key as category_id,
  q.key as question_id,
  json_extract(q.value, '$.answer') as answer,
  LENGTH(json_extract(q.value, '$.answer')) as answer_length
FROM biographies b,
  json_each(b.stories_data) cat,
  json_each(cat.value) q
WHERE b.stories_data IS NOT NULL
  AND json_valid(b.stories_data)
LIMIT 10;

-- 測試 5: 計算會移轉的資料數量
-- Core stories (應該移轉 3 筆/每個 biography)
WITH core_questions (question_id, json_path) AS (
  VALUES
    ('climbing_origin', '$.climbing_origin.answer'),
    ('climbing_meaning', '$.climbing_meaning.answer'),
    ('advice_to_self', '$.advice_to_self.answer')
)
SELECT
  'core_stories' as type,
  COUNT(*) as count
FROM biographies b, core_questions q
WHERE b.one_liners_data IS NOT NULL
  AND json_extract(b.one_liners_data, q.json_path) IS NOT NULL
  AND TRIM(json_extract(b.one_liners_data, q.json_path)) != '';

-- One-liners (這個查詢會排除 core questions)
SELECT
  'one_liners' as type,
  COUNT(*) as count
FROM biographies b, json_each(b.one_liners_data) j
WHERE b.one_liners_data IS NOT NULL
  AND json_valid(b.one_liners_data)
  AND j.key NOT IN ('climbing_origin', 'climbing_meaning', 'advice_to_self')
  AND json_extract(j.value, '$.answer') IS NOT NULL
  AND TRIM(json_extract(j.value, '$.answer')) != '';

-- Stories
SELECT
  'stories' as type,
  COUNT(*) as count
FROM biographies b,
  json_each(b.stories_data) cat,
  json_each(cat.value) q
WHERE b.stories_data IS NOT NULL
  AND json_valid(b.stories_data)
  AND json_extract(q.value, '$.answer') IS NOT NULL
  AND TRIM(json_extract(q.value, '$.answer')) != '';
