#!/bin/bash

# 逐步驗證 JSON 遷移的腳本
# 使用方法: ./verify-migration-step-by-step.sh [preview|production]

ENV=${1:-preview}

if [ "$ENV" = "production" ]; then
  DB_NAME="nobodyclimb-db"
else
  DB_NAME="nobodyclimb-db-preview"
fi

echo "=========================================="
echo "驗證環境: $DB_NAME"
echo "=========================================="
echo ""

# 檢查 1: JSON 資料保留檢查
echo "🔍 檢查 1: JSON 資料保留"
pnpm wrangler d1 execute "$DB_NAME" --remote --command "
SELECT
  'JSON 資料保留檢查' as check_name,
  COUNT(*) as total_biographies,
  COUNT(CASE WHEN one_liners_data IS NOT NULL THEN 1 END) as has_one_liners,
  COUNT(CASE WHEN stories_data IS NOT NULL THEN 1 END) as has_stories
FROM biographies;
"
echo ""

# 檢查 2: Core Stories 遷移
echo "🔍 檢查 2: Core Stories 遷移數量"
pnpm wrangler d1 execute "$DB_NAME" --remote --command "
WITH core_questions (question_id, json_path) AS (
  VALUES
    ('climbing_origin', '\$.climbing_origin.answer'),
    ('climbing_meaning', '\$.climbing_meaning.answer'),
    ('advice_to_self', '\$.advice_to_self.answer')
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
"
echo ""

# 檢查 3: One-liners 遷移
echo "🔍 檢查 3: One-liners 遷移數量"
pnpm wrangler d1 execute "$DB_NAME" --remote --command "
WITH json_count AS (
  SELECT COUNT(*) as count
  FROM biographies b, json_each(b.one_liners_data) j
  WHERE b.one_liners_data IS NOT NULL
    AND json_valid(b.one_liners_data)
    AND j.key NOT IN ('climbing_origin', 'climbing_meaning', 'advice_to_self')
    AND json_extract(j.value, '\$.answer') IS NOT NULL
    AND TRIM(json_extract(j.value, '\$.answer')) != ''
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
"
echo ""

# 檢查 4: Stories 遷移
echo "🔍 檢查 4: Stories 遷移數量"
pnpm wrangler d1 execute "$DB_NAME" --remote --command "
WITH json_count AS (
  SELECT COUNT(*) as count
  FROM biographies b,
    json_each(b.stories_data) cat,
    json_each(cat.value) q
  WHERE b.stories_data IS NOT NULL
    AND json_valid(b.stories_data)
    AND json_extract(q.value, '\$.answer') IS NOT NULL
    AND TRIM(json_extract(q.value, '\$.answer')) != ''
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
"
echo ""

# 檢查 5: 內容抽樣 (Core Stories)
echo "🔍 檢查 5: Core Stories 內容一致性抽樣"
pnpm wrangler d1 execute "$DB_NAME" --remote --command "
SELECT
  'Core Stories 抽樣' as check_name,
  b.name as biography_name,
  bcs.question_id,
  CASE
    WHEN json_extract(b.one_liners_data, '\$.' || bcs.question_id || '.answer') = bcs.content THEN '✓'
    ELSE '✗'
  END as match_status,
  SUBSTR(bcs.content, 1, 30) || '...' as content_preview
FROM biographies b
INNER JOIN biography_core_stories bcs ON b.id = bcs.biography_id
WHERE b.one_liners_data IS NOT NULL
LIMIT 5;
"
echo ""

# 檢查 6: 統計摘要
echo "🔍 檢查 6: 遷移統計摘要"
pnpm wrangler d1 execute "$DB_NAME" --remote --command "
SELECT
  b.name,
  CASE WHEN b.one_liners_data IS NOT NULL THEN 'Y' ELSE 'N' END as has_json_oneliners,
  CASE WHEN b.stories_data IS NOT NULL THEN 'Y' ELSE 'N' END as has_json_stories,
  COUNT(DISTINCT bcs.id) as core_stories_count,
  COUNT(DISTINCT bol.id) as one_liners_count,
  COUNT(DISTINCT bs.id) as stories_count
FROM biographies b
LEFT JOIN biography_core_stories bcs ON b.id = bcs.biography_id
LEFT JOIN biography_one_liners bol ON b.id = bol.biography_id
LEFT JOIN biography_stories bs ON b.id = bs.biography_id
GROUP BY b.id, b.name, b.one_liners_data, b.stories_data
HAVING has_json_oneliners = 'Y' OR has_json_stories = 'Y'
ORDER BY b.created_at DESC
LIMIT 10;
"
echo ""

echo "=========================================="
echo "✅ 驗證完成"
echo "=========================================="
