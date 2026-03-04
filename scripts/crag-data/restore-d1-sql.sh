#!/bin/bash
# D1 資料庫 SQL 格式還原腳本
# Usage: ./restore-d1-sql.sh <backup_dir> [preview|production]

set -e

BACKUP_DIR_NAME=$1
ENV=${2:-production}

if [ -z "$BACKUP_DIR_NAME" ]; then
  echo "❌ 錯誤: 請指定備份目錄名稱"
  echo "Usage: ./restore-d1-sql.sh <backup_dir_name> [preview|production]"
  echo ""
  echo "可用的 SQL 備份:"
  ls -1 ../../backups/ | grep -E "^(preview|production)_sql_" | tail -5
  exit 1
fi

# 支援相對路徑或完整路徑
if [ -d "$BACKUP_DIR_NAME" ]; then
  BACKUP_DIR="$BACKUP_DIR_NAME"
elif [ -d "../../backups/$BACKUP_DIR_NAME" ]; then
  BACKUP_DIR="../../backups/$BACKUP_DIR_NAME"
else
  echo "❌ 錯誤: 備份目錄不存在: $BACKUP_DIR_NAME"
  exit 1
fi

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
echo "║    D1 SQL 格式還原工具                ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "🌍 目標環境: $ENV"
echo "🗄️  目標資料庫: $DB_NAME"
echo "📂 備份來源: $BACKUP_DIR"
echo ""

# 找到 SQL 備份檔案
SQL_FILE=""
if [ -f "$BACKUP_DIR/full_dump.sql" ]; then
  SQL_FILE="$BACKUP_DIR/full_dump.sql"
elif [ -f "$BACKUP_DIR/full_backup.sql" ]; then
  SQL_FILE="$BACKUP_DIR/full_backup.sql"
else
  # 尋找任何 .sql 檔案
  SQL_FILE=$(find "$BACKUP_DIR" -name "*.sql" -type f | head -1)
fi

if [ -z "$SQL_FILE" ] || [ ! -f "$SQL_FILE" ]; then
  echo "❌ 錯誤: 找不到 SQL 備份檔案"
  echo "   預期檔案: full_dump.sql 或 full_backup.sql"
  ls -la "$BACKUP_DIR"
  exit 1
fi

echo "📄 SQL 檔案: $(basename "$SQL_FILE")"

# 讀取備份資訊
if [ -f "$BACKUP_DIR/backup_info.json" ]; then
  echo ""
  echo "📋 備份資訊:"
  jq -r '. |
    "   來源環境: \(.environment)\n" +
    "   備份時間: \(.date)\n" +
    "   檔案大小: \(.size)\n" +
    "   資料表數: \(.table_count)\n" +
    "   記錄數: \(.insert_count)"' "$BACKUP_DIR/backup_info.json"
  echo ""
fi

# 檢查 SQL 檔案
SIZE=$(du -h "$SQL_FILE" | cut -f1)
LINES=$(wc -l < "$SQL_FILE" | tr -d ' ')
TABLE_COUNT=$(grep -c "^CREATE TABLE" "$SQL_FILE" 2>/dev/null || echo "0")
INSERT_COUNT=$(grep -c "^INSERT INTO" "$SQL_FILE" 2>/dev/null || echo "0")

echo "📊 SQL 檔案統計:"
echo "   - 大小: $SIZE"
echo "   - 行數: $LINES"
echo "   - 資料表: $TABLE_COUNT 個"
echo "   - INSERT 語句: $INSERT_COUNT 筆"
echo ""

# ============================================
# 警告確認
# ============================================
echo "⚠️  警告: 這將會清空目標資料庫並還原備份資料！"
echo "   目標: $ENV ($DB_NAME)"
echo ""
echo "⚠️  此操作無法撤銷！建議先備份目標環境："
echo "   ./backup-d1-sql.sh $ENV"
echo ""
read -p "確定要繼續嗎? 請輸入 'YES' 確認: " confirm

if [ "$confirm" != "YES" ]; then
  echo "❌ 已取消"
  exit 0
fi

# ============================================
# 執行還原
# ============================================
echo ""
echo "📥 開始還原資料庫..."
echo "   這可能需要幾分鐘，請耐心等待..."
echo ""

START_TIME=$(date +%s)

# 過濾掉 D1 不支援的 transaction 控制語句（BEGIN TRANSACTION / COMMIT / SAVEPOINT 等）
FILTERED_SQL_FILE=$(mktemp /tmp/d1_restore_XXXXXX.sql)
grep -v -E "^\s*(BEGIN TRANSACTION|COMMIT|ROLLBACK|SAVEPOINT|RELEASE SAVEPOINT)\s*;?\s*$" "$SQL_FILE" > "$FILTERED_SQL_FILE"
trap 'rm -f "$FILTERED_SQL_FILE"' EXIT

# 檢查 SQL 檔案大小，決定是否需要分段執行
FILE_SIZE_KB=$(du -k "$FILTERED_SQL_FILE" | cut -f1)

if [ "$FILE_SIZE_KB" -gt 10240 ]; then
  # 檔案大於 10MB，分段執行
  echo "📦 檔案較大 (${SIZE})，分段執行..."

  # 分割 SQL 檔案（每 1000 行一個檔案）
  SPLIT_DIR=$(mktemp -d /tmp/d1_split_XXXXXX)
  trap 'rm -f "$FILTERED_SQL_FILE"; rm -rf "$SPLIT_DIR"' EXIT

  split -l 1000 "$FILTERED_SQL_FILE" "$SPLIT_DIR/part_"

  PART_COUNT=$(ls -1 "$SPLIT_DIR" | wc -l | tr -d ' ')
  echo "   ✓ 分割為 $PART_COUNT 個部分"

  # 逐個執行
  PART_NUM=0
  for part_file in "$SPLIT_DIR"/part_*; do
    PART_NUM=$((PART_NUM + 1))
    echo "   ⏳ 執行部分 $PART_NUM/$PART_COUNT..."

    PART_OUTPUT=$(npx wrangler d1 execute "$DB_NAME" --remote --file="$part_file" 2>&1)
    PART_EXIT=$?
    echo "$PART_OUTPUT" | grep -v "Executing on" | grep -v "🌀" || true
    if [ $PART_EXIT -ne 0 ]; then
      echo "   ✗ 部分 $PART_NUM 執行失敗"
      echo "   💡 失敗的 SQL 檔案: $part_file"
      exit 1
    fi
  done

else
  # 檔案較小，直接執行
  echo "🚀 執行 SQL 還原..."

  WRANGLER_OUTPUT=$(npx wrangler d1 execute "$DB_NAME" --remote --file="$FILTERED_SQL_FILE" 2>&1)
  WRANGLER_EXIT=$?
  echo "$WRANGLER_OUTPUT" | grep -v "Executing on" | grep -v "🌀" || true

  if [ $WRANGLER_EXIT -eq 0 ]; then
    echo "   ✓ SQL 執行成功"
  else
    echo "   ✗ SQL 執行失敗"
    echo ""
    echo "💡 錯誤排查:"
    echo "   1. 檢查 SQL 檔案是否完整: head -20 $SQL_FILE"
    echo "   2. 檢查資料庫連接: npx wrangler d1 execute $DB_NAME --remote --command='SELECT 1'"
    echo "   3. 手動執行前 100 行測試:"
    echo "      head -100 $SQL_FILE > test.sql"
    echo "      npx wrangler d1 execute $DB_NAME --remote --file=test.sql"
    exit 1
  fi
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "   ⏱️  執行時間: ${DURATION} 秒"

# ============================================
# 驗證還原結果
# ============================================
echo ""
echo "🔍 驗證還原結果..."

# 檢查關鍵資料表的記錄數
declare -a KEY_TABLES=("users" "crags" "routes" "videos")
VERIFICATION_PASSED=true

for table in "${KEY_TABLES[@]}"; do
  COUNT_JSON=$(npx wrangler d1 execute "$DB_NAME" \
    --remote \
    --command="SELECT COUNT(*) as count FROM $table" \
    --json 2>/dev/null || echo '[]')

  COUNT=$(echo "$COUNT_JSON" | jq -r '.[0].results[0].count' 2>/dev/null || echo "ERROR")

  if [ "$COUNT" = "ERROR" ]; then
    echo "   ⚠️  $table: 無法查詢"
    VERIFICATION_PASSED=false
  elif [ "$COUNT" -eq 0 ]; then
    echo "   ⚠️  $table: 0 筆記錄（可能是空表）"
  else
    echo "   ✓ $table: $COUNT 筆記錄"
  fi
done

# ============================================
# 完成
# ============================================
echo ""
if [ "$VERIFICATION_PASSED" = true ]; then
  echo "✅ 還原完成！"
else
  echo "⚠️  還原完成，但部分驗證失敗"
fi

echo ""
echo "💡 進一步驗證指令:"
echo "   npx wrangler d1 execute $DB_NAME --remote --command='SELECT name FROM sqlite_master WHERE type=\"table\"'"
echo "   npx wrangler d1 execute $DB_NAME --remote --command='SELECT COUNT(*) FROM crags'"
echo ""
echo "🌐 測試 API:"
echo "   curl https://api$([ "$ENV" = "preview" ] && echo "-preview").nobodyclimb.cc/api/v1/stats"
echo "   curl https://api$([ "$ENV" = "preview" ] && echo "-preview").nobodyclimb.cc/api/v1/crags"
