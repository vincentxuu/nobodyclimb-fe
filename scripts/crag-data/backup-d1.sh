#!/bin/bash
# D1 資料庫備份腳本
# Usage: ./backup-d1.sh [preview|production]

set -e

ENV=${1:-preview}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="../../backups/${ENV}_${TIMESTAMP}"

if [ "$ENV" != "preview" ] && [ "$ENV" != "production" ]; then
  echo "❌ 錯誤: 環境必須是 preview 或 production"
  echo "Usage: ./backup-d1.sh [preview|production]"
  exit 1
fi

# 設定資料庫名稱
if [ "$ENV" = "preview" ]; then
  DB_NAME="nobodyclimb-db-preview"
else
  DB_NAME="nobodyclimb-db"
fi

echo "╔════════════════════════════════════════╗"
echo "║    D1 資料庫備份工具                  ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "🌍 環境: $ENV"
echo "🗄️  資料庫: $DB_NAME"
echo "📂 備份目錄: $BACKUP_DIR"
echo ""

# 建立備份目錄
mkdir -p "$BACKUP_DIR"

# 備份資料表
echo "📦 開始備份資料..."

tables=("videos" "crags" "areas" "sectors" "routes" "route_videos" "gyms" "featured_routes")

for table in "${tables[@]}"; do
  echo "   ⏳ 備份 $table..."

  npx wrangler d1 execute "$DB_NAME" \
    --remote \
    --command="SELECT * FROM $table" \
    --json > "$BACKUP_DIR/${table}.json" 2>/dev/null || {
      echo "   ⚠️  $table 備份失敗（可能不存在）"
    }

  if [ -f "$BACKUP_DIR/${table}.json" ]; then
    COUNT=$(jq 'length' "$BACKUP_DIR/${table}.json" 2>/dev/null || echo "0")
    echo "   ✓ $table: $COUNT 筆記錄"
  fi
done

# 備份 schema
echo ""
echo "📋 備份資料庫結構..."
npx wrangler d1 execute "$DB_NAME" \
  --remote \
  --command="SELECT sql FROM sqlite_master WHERE type='table'" \
  --json > "$BACKUP_DIR/schema.json"

echo "   ✓ Schema 已備份"

# 建立備份資訊檔案
cat > "$BACKUP_DIR/backup_info.json" <<EOF
{
  "environment": "$ENV",
  "database": "$DB_NAME",
  "timestamp": "$TIMESTAMP",
  "date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "tables": $(echo "${tables[@]}" | jq -R -c 'split(" ")')
}
EOF

echo ""
echo "✅ 備份完成！"
echo "📁 備份位置: $BACKUP_DIR"
echo ""
echo "💡 還原指令:"
echo "   ./restore-d1.sh $BACKUP_DIR production"
