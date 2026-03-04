#!/bin/bash
# D1 資料庫還原腳本
# Usage: ./restore-d1.sh <backup_dir> [preview|production]

set -e

BACKUP_DIR=$1
ENV=${2:-production}

if [ -z "$BACKUP_DIR" ]; then
  echo "❌ 錯誤: 請指定備份目錄"
  echo "Usage: ./restore-d1.sh <backup_dir> [preview|production]"
  exit 1
fi

if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ 錯誤: 備份目錄不存在: $BACKUP_DIR"
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
echo "║    D1 資料庫還原工具                  ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "🌍 目標環境: $ENV"
echo "🗄️  目標資料庫: $DB_NAME"
echo "📂 備份來源: $BACKUP_DIR"
echo ""

# 讀取備份資訊
if [ -f "$BACKUP_DIR/backup_info.json" ]; then
  echo "📋 備份資訊:"
  jq -r '. | "   來源環境: \(.environment)\n   備份時間: \(.date)"' "$BACKUP_DIR/backup_info.json"
  echo ""
fi

# 警告訊息
echo "⚠️  警告: 這將會清空目標資料庫並還原備份資料！"
echo "   目標: $ENV ($DB_NAME)"
echo ""
read -p "確定要繼續嗎? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ 已取消"
  exit 0
fi

echo ""
echo "🗑️  清空現有資料..."

# 清空資料表（保留結構）
tables=("route_videos" "routes" "sectors" "areas" "crags" "videos" "featured_routes" "gyms")

for table in "${tables[@]}"; do
  echo "   ⏳ 清空 $table..."
  npx wrangler d1 execute "$DB_NAME" \
    --remote \
    --command="DELETE FROM $table" 2>/dev/null || {
      echo "   ⚠️  $table 清空失敗（可能不存在）"
    }
done

echo ""
echo "📥 開始還原資料..."

# 還原順序很重要（因為有外鍵關聯）
restore_order=("videos" "crags" "areas" "sectors" "routes" "route_videos" "gyms" "featured_routes")

for table in "${restore_order[@]}"; do
  backup_file="$BACKUP_DIR/${table}.json"

  if [ ! -f "$backup_file" ]; then
    echo "   ⏭️  跳過 $table (備份不存在)"
    continue
  fi

  record_count=$(jq 'length' "$backup_file")

  if [ "$record_count" -eq 0 ]; then
    echo "   ⏭️  跳過 $table (無資料)"
    continue
  fi

  echo "   ⏳ 還原 $table ($record_count 筆)..."

  # 使用 Admin API 批量導入（需要實作對應的 API）
  # 或使用 wrangler d1 execute + SQL

  # 暫時方案：生成 INSERT SQL
  node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync('$backup_file', 'utf-8'));

    if (data.length === 0) process.exit(0);

    const columns = Object.keys(data[0]);
    const tableName = '$table';

    let sql = '';
    data.forEach(row => {
      const values = columns.map(col => {
        const val = row[col];
        if (val === null) return 'NULL';
        if (typeof val === 'number') return val;
        return \"'\" + String(val).replace(/'/g, \"''\") + \"'\";
      }).join(', ');

      sql += \"INSERT INTO \${tableName} (\${columns.join(', ')}) VALUES (\${values});\\n\";
    });

    fs.writeFileSync('$BACKUP_DIR/temp_${table}.sql', sql);
  "

  if [ -f "$BACKUP_DIR/temp_${table}.sql" ]; then
    npx wrangler d1 execute "$DB_NAME" \
      --remote \
      --file="$BACKUP_DIR/temp_${table}.sql" && {
        echo "   ✓ $table: $record_count 筆記錄已還原"
        rm "$BACKUP_DIR/temp_${table}.sql"
      } || {
        echo "   ✗ $table 還原失敗"
      }
  fi
done

# 更新統計資料
echo ""
echo "🔄 更新統計資料..."
npx wrangler d1 execute "$DB_NAME" --remote --command="
  UPDATE crags SET
    route_count = (SELECT COUNT(*) FROM routes WHERE crag_id = crags.id),
    bolt_count = (SELECT COALESCE(SUM(bolt_count), 0) FROM routes WHERE crag_id = crags.id),
    updated_at = datetime('now')
"

echo "   ✓ 岩場統計已更新"

echo ""
echo "✅ 還原完成！"
echo ""
echo "💡 驗證指令:"
echo "   npx wrangler d1 execute $DB_NAME --remote --command='SELECT COUNT(*) as count FROM crags'"
echo "   npx wrangler d1 execute $DB_NAME --remote --command='SELECT COUNT(*) as count FROM routes'"
echo "   npx wrangler d1 execute $DB_NAME --remote --command='SELECT COUNT(*) as count FROM videos'"
