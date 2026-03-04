#!/bin/bash
# 刪除所有資料表（用於還原前清空資料庫）
# Usage: ./drop-all-tables.sh [preview|production]

set -e

ENV=${1:-preview}

if [ "$ENV" != "preview" ] && [ "$ENV" != "production" ]; then
  echo "❌ 錯誤: 環境必須是 preview 或 production"
  exit 1
fi

# 設定資料庫名稱
if [ "$ENV" = "preview" ]; then
  DB_NAME="nobodyclimb-db-preview"
else
  DB_NAME="nobodyclimb-db"
fi

echo "╔════════════════════════════════════════╗"
echo "║    刪除所有資料表                      ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "🌍 環境: $ENV"
echo "🗄️  資料庫: $DB_NAME"
echo ""

# 警告
echo "⚠️  警告: 這將刪除所有資料表和資料！"
echo "   環境: $ENV"
echo ""
read -p "確定要繼續嗎? 請輸入 'YES' 確認: " confirm

if [ "$confirm" != "YES" ]; then
  echo "❌ 已取消"
  exit 0
fi

echo ""
echo "🔍 獲取資料表列表..."

# 獲取所有資料表
TABLES_JSON=$(npx wrangler d1 execute "$DB_NAME" \
  --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('d1_migrations', '_cf_KV') ORDER BY name" \
  --json 2>/dev/null)

TABLES=$(echo "$TABLES_JSON" | jq -r '.[0].results[].name' 2>/dev/null || true)

if [ -z "$TABLES" ]; then
  echo "   ℹ️  沒有資料表需要刪除"
  exit 0
fi

TABLE_COUNT=$(echo "$TABLES" | wc -l | tr -d ' ')
echo "   ✓ 發現 $TABLE_COUNT 個資料表"
echo ""

# 建立刪除 SQL
DROP_SQL=$(mktemp)

# 由於有外鍵約束，需要按照相反的依賴順序刪除
# 先刪除子表，最後刪除父表
# macOS 使用 tail -r 而不是 tac
if command -v tac &> /dev/null; then
  echo "$TABLES" | tac | while IFS= read -r table; do
    echo "DROP TABLE IF EXISTS \"$table\";" >> "$DROP_SQL"
  done
else
  # macOS 沒有 tac，使用 tail -r
  echo "$TABLES" | tail -r | while IFS= read -r table; do
    echo "DROP TABLE IF EXISTS \"$table\";" >> "$DROP_SQL"
  done
fi

echo ""
echo "🗑️  刪除資料表..."

# 執行刪除
npx wrangler d1 execute "$DB_NAME" \
  --remote \
  --file="$DROP_SQL" 2>&1 | grep -v "Executing on" || {
    echo "   ✗ 刪除失敗"
    cat "$DROP_SQL"
    rm -f "$DROP_SQL"
    exit 1
  }

rm -f "$DROP_SQL"

echo "   ✓ 已刪除 $TABLE_COUNT 個資料表"
echo ""

# 驗證
REMAINING=$(npx wrangler d1 execute "$DB_NAME" \
  --remote \
  --command="SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('d1_migrations', '_cf_KV')" \
  --json 2>/dev/null | jq -r '.[0].results[0].count')

if [ "$REMAINING" -eq 0 ]; then
  echo "✅ 資料庫已清空！"
else
  echo "⚠️  還有 $REMAINING 個資料表未刪除"
fi

echo ""
echo "💡 下一步: 執行還原"
echo "   ./restore-d1-sql.sh <backup_dir> $ENV"
echo ""
