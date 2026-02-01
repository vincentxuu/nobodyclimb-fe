-- 測試會移轉的資料數量

-- Core stories
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
