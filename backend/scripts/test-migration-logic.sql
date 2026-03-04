-- 測試遷移邏輯是否能正確提取資料

-- 測試 1: 檢查能提取多少 core stories
WITH core_questions (question_id, json_path) AS (
  VALUES
    ('climbing_origin', '$.climbing_origin.answer'),
    ('climbing_meaning', '$.climbing_meaning.answer'),
    ('advice_to_self', '$.advice_to_self.answer')
)
SELECT
  'Core Stories 可提取數量' as test_name,
  COUNT(*) as extractable_count
FROM biographies b, core_questions q
WHERE b.one_liners_data IS NOT NULL
  AND json_extract(b.one_liners_data, q.json_path) IS NOT NULL
  AND TRIM(json_extract(b.one_liners_data, q.json_path)) != '';

-- 測試 2: 顯示提取的樣本
WITH core_questions (question_id, json_path) AS (
  VALUES
    ('climbing_origin', '$.climbing_origin.answer'),
    ('climbing_meaning', '$.climbing_meaning.answer'),
    ('advice_to_self', '$.advice_to_self.answer')
)
SELECT
  b.name,
  q.question_id,
  SUBSTR(json_extract(b.one_liners_data, q.json_path), 1, 50) as answer_preview
FROM biographies b, core_questions q
WHERE b.one_liners_data IS NOT NULL
  AND json_extract(b.one_liners_data, q.json_path) IS NOT NULL
  AND TRIM(json_extract(b.one_liners_data, q.json_path)) != ''
LIMIT 10;

-- 測試 3: 檢查是否有重複的 biography_id + question_id 在目標表中
SELECT
  'Core Stories 表中現有資料' as test_name,
  COUNT(*) as existing_count,
  COUNT(DISTINCT biography_id) as unique_biographies
FROM biography_core_stories;

-- 測試 4: 測試 Stories 提取
SELECT
  'Stories 可提取數量' as test_name,
  COUNT(*) as extractable_count
FROM biographies b,
  json_each(b.stories_data) cat,
  json_each(cat.value) q
WHERE b.stories_data IS NOT NULL
  AND json_valid(b.stories_data)
  AND json_extract(q.value, '$.answer') IS NOT NULL
  AND TRIM(json_extract(q.value, '$.answer')) != '';

-- 測試 5: 檢查實際執行插入會遇到的問題
-- 模擬插入但不實際執行 (使用 EXPLAIN QUERY PLAN)
EXPLAIN QUERY PLAN
WITH core_questions (question_id, json_path) AS (
  VALUES
    ('climbing_origin', '$.climbing_origin.answer'),
    ('climbing_meaning', '$.climbing_meaning.answer'),
    ('advice_to_self', '$.advice_to_self.answer')
)
SELECT
  b.id as biography_id,
  q.question_id,
  json_extract(b.one_liners_data, q.json_path) as content
FROM biographies b, core_questions q
WHERE b.one_liners_data IS NOT NULL
  AND json_extract(b.one_liners_data, q.json_path) IS NOT NULL
  AND TRIM(json_extract(b.one_liners_data, q.json_path)) != ''
  AND NOT EXISTS (
    SELECT 1 FROM biography_core_stories bcs
    WHERE bcs.biography_id = b.id AND bcs.question_id = q.question_id
  );
