#!/bin/bash
# D1 完整資料庫備份腳本（包含所有資料表）
# Usage: ./backup-d1-full.sh [preview|production]

set -e

ENV=${1:-preview}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="../../backups/${ENV}_full_${TIMESTAMP}"

if [ "$ENV" != "preview" ] && [ "$ENV" != "production" ]; then
  echo "❌ 錯誤: 環境必須是 preview 或 production"
  echo "Usage: ./backup-d1-full.sh [preview|production]"
  exit 1
fi

# 設定資料庫名稱
if [ "$ENV" = "preview" ]; then
  DB_NAME="nobodyclimb-db-preview"
else
  DB_NAME="nobodyclimb-db"
fi

echo "╔════════════════════════════════════════╗"
echo "║    D1 完整資料庫備份工具              ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "🌍 環境: $ENV"
echo "🗄️  資料庫: $DB_NAME"
echo "📂 備份目錄: $BACKUP_DIR"
echo ""

# 建立備份目錄
mkdir -p "$BACKUP_DIR"

# ============================================
# Step 1: 獲取所有資料表列表
# ============================================
echo "🔍 發現資料表..."

# 排除系統表
EXCLUDED_TABLES=("d1_migrations" "sqlite_sequence" "_cf_KV")

# 獲取所有資料表
TABLES_JSON=$(npx wrangler d1 execute "$DB_NAME" \
  --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name" \
  --json 2>/dev/null)

# 解析資料表名稱
TABLES=$(echo "$TABLES_JSON" | jq -r '.[0].results[].name' | grep -v -E "^(d1_migrations|sqlite_sequence|_cf_KV)$" || true)

if [ -z "$TABLES" ]; then
  echo "❌ 錯誤: 無法取得資料表列表"
  exit 1
fi

TABLE_COUNT=$(echo "$TABLES" | wc -l | tr -d ' ')
echo "   ✓ 發現 $TABLE_COUNT 個資料表"
echo ""

# ============================================
# Step 2: 備份資料表
# ============================================
echo "📦 開始備份資料..."

TOTAL_RECORDS=0
SUCCESS_COUNT=0
FAILED_COUNT=0

while IFS= read -r table; do
  echo "   ⏳ 備份 $table..."

  # 取得記錄數
  COUNT_JSON=$(npx wrangler d1 execute "$DB_NAME" \
    --remote \
    --command="SELECT COUNT(*) as count FROM $table" \
    --json 2>/dev/null || echo '[]')

  COUNT=$(echo "$COUNT_JSON" | jq -r '.[0].results[0].count // 0' 2>/dev/null || echo "0")

  if [ "$COUNT" -eq 0 ]; then
    echo "   ⏭️  $table: 無資料"
    continue
  fi

  # 備份資料
  npx wrangler d1 execute "$DB_NAME" \
    --remote \
    --command="SELECT * FROM $table" \
    --json > "$BACKUP_DIR/${table}.json" 2>/dev/null && {
      echo "   ✓ $table: $COUNT 筆記錄"
      TOTAL_RECORDS=$((TOTAL_RECORDS + COUNT))
      SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    } || {
      echo "   ✗ $table: 備份失敗"
      FAILED_COUNT=$((FAILED_COUNT + 1))
    }

done <<< "$TABLES"

# ============================================
# Step 3: 備份資料庫結構 (Schema)
# ============================================
echo ""
echo "📋 備份資料庫結構..."

npx wrangler d1 execute "$DB_NAME" \
  --remote \
  --command="SELECT sql FROM sqlite_master WHERE type='table' AND sql IS NOT NULL ORDER BY name" \
  --json > "$BACKUP_DIR/schema.json" 2>/dev/null && {
    echo "   ✓ Schema 已備份"
  } || {
    echo "   ✗ Schema 備份失敗"
  }

# 備份索引
npx wrangler d1 execute "$DB_NAME" \
  --remote \
  --command="SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL ORDER BY name" \
  --json > "$BACKUP_DIR/indexes.json" 2>/dev/null && {
    echo "   ✓ 索引已備份"
  } || {
    echo "   ✗ 索引備份失敗"
  }

# ============================================
# Step 4: 建立備份清單
# ============================================
echo ""
echo "📝 建立備份清單..."

# 建立資料表清單（按記錄數排序）
TABLE_LIST="["
first=true
while IFS= read -r table; do
  if [ -f "$BACKUP_DIR/${table}.json" ]; then
    COUNT=$(jq 'length' "$BACKUP_DIR/${table}.json" 2>/dev/null || echo "0")

    if [ "$first" = true ]; then
      first=false
    else
      TABLE_LIST="${TABLE_LIST},"
    fi

    TABLE_LIST="${TABLE_LIST}{\"name\":\"$table\",\"records\":$COUNT}"
  fi
done <<< "$TABLES"
TABLE_LIST="${TABLE_LIST}]"

# 建立備份資訊檔案
cat > "$BACKUP_DIR/backup_info.json" <<EOF
{
  "environment": "$ENV",
  "database": "$DB_NAME",
  "timestamp": "$TIMESTAMP",
  "date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "table_count": $SUCCESS_COUNT,
  "total_records": $TOTAL_RECORDS,
  "failed_tables": $FAILED_COUNT,
  "tables": $TABLE_LIST
}
EOF

# 建立 README
cat > "$BACKUP_DIR/README.md" <<EOF
# D1 資料庫備份

## 備份資訊
- **環境**: $ENV
- **資料庫**: $DB_NAME
- **時間**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
- **資料表數量**: $SUCCESS_COUNT
- **總記錄數**: $TOTAL_RECORDS

## 還原指令

\`\`\`bash
# 還原到 Preview
./restore-d1-full.sh $(basename "$BACKUP_DIR") preview

# 還原到 Production
./restore-d1-full.sh $(basename "$BACKUP_DIR") production
\`\`\`

## 檔案說明
- \`backup_info.json\`: 備份元資料
- \`schema.json\`: 資料表結構
- \`indexes.json\`: 索引定義
- \`{table_name}.json\`: 各資料表的資料

## 資料表清單
EOF

# 添加資料表清單到 README
echo "$TABLE_LIST" | jq -r '.[] | "- \(.name): \(.records) 筆記錄"' >> "$BACKUP_DIR/README.md"

echo "   ✓ 備份清單已建立"

# ============================================
# Step 5: 壓縮備份（選用）
# ============================================
echo ""
read -p "是否壓縮備份? (y/n): " compress

if [ "$compress" = "y" ] || [ "$compress" = "Y" ]; then
  echo "🗜️  壓縮備份中..."

  ARCHIVE_NAME="${ENV}_full_${TIMESTAMP}.tar.gz"
  tar -czf "../../backups/$ARCHIVE_NAME" -C "../../backups" "$(basename "$BACKUP_DIR")" && {
    echo "   ✓ 已壓縮: $ARCHIVE_NAME"
    echo "   📦 大小: $(du -h "../../backups/$ARCHIVE_NAME" | cut -f1)"

    read -p "是否刪除原始備份目錄? (y/n): " delete
    if [ "$delete" = "y" ] || [ "$delete" = "Y" ]; then
      rm -rf "$BACKUP_DIR"
      echo "   ✓ 已刪除原始目錄"
    fi
  } || {
    echo "   ✗ 壓縮失敗"
  }
fi

# ============================================
# 完成
# ============================================
echo ""
echo "✅ 備份完成！"
echo ""
echo "📊 備份統計:"
echo "   - 成功備份: $SUCCESS_COUNT 個資料表"
echo "   - 失敗: $FAILED_COUNT 個資料表"
echo "   - 總記錄數: $TOTAL_RECORDS"
echo ""
echo "📁 備份位置: $BACKUP_DIR"
echo ""
echo "💡 還原指令:"
echo "   ./restore-d1-full.sh $(basename "$BACKUP_DIR") production"
echo ""
echo "💡 查看備份內容:"
echo "   cat $BACKUP_DIR/backup_info.json | jq ."
