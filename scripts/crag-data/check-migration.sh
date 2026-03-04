#!/bin/bash
# 檢查遷移結果

DB_NAME="${ENVIRONMENT:-preview}"
if [ "$DB_NAME" = "production" ]; then
  DB_NAME="nobodyclimb-db"
else
  DB_NAME="nobodyclimb-db-preview"
fi

cd "$(dirname "$0")/../../backend" || exit 1

echo "🔍 檢查遷移結果..."
echo "資料庫: $DB_NAME"
echo ""

# 檢查各表的資料數量
echo "📊 資料表統計："
echo ""

echo "Videos:"
pnpm wrangler d1 execute "$DB_NAME" --remote --command "SELECT COUNT(*) as count FROM videos;"

echo ""
echo "Crags:"
pnpm wrangler d1 execute "$DB_NAME" --remote --command "SELECT COUNT(*) as count FROM crags;"

echo ""
echo "Areas:"
pnpm wrangler d1 execute "$DB_NAME" --remote --command "SELECT COUNT(*) as count FROM crag_areas;"

echo ""
echo "Sectors:"
pnpm wrangler d1 execute "$DB_NAME" --remote --command "SELECT COUNT(*) as count FROM crag_sectors;"

echo ""
echo "Routes:"
pnpm wrangler d1 execute "$DB_NAME" --remote --command "SELECT COUNT(*) as count FROM routes;"

echo ""
echo "Route-Video Links:"
pnpm wrangler d1 execute "$DB_NAME" --remote --command "SELECT COUNT(*) as count FROM route_videos;"

echo ""
echo "📍 各岩場路線數量："
pnpm wrangler d1 execute "$DB_NAME" --remote --command "SELECT slug, name, route_count FROM crags ORDER BY route_count DESC;"

echo ""
echo "✅ 檢查完成！"
