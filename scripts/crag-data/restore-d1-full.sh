#!/bin/bash
# D1 完整資料庫還原腳本（還原所有資料表）
# Usage: ./restore-d1-full.sh <backup_dir> [preview|production]

set -e

BACKUP_DIR_NAME=$1
ENV=${2:-production}

if [ -z "$BACKUP_DIR_NAME" ]; then
  echo "❌ 錯誤: 請指定備份目錄名稱"
  echo "Usage: ./restore-d1-full.sh <backup_dir_name> [preview|production]"
  echo ""
  echo "可用的備份:"
  ls -1 ../../backups/ | grep -E "^(preview|production)_full_" | tail -5
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
echo "║    D1 完整資料庫還原工具              ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "🌍 目標環境: $ENV"
echo "🗄️  目標資料庫: $DB_NAME"
echo "📂 備份來源: $BACKUP_DIR"
echo ""

# 讀取備份資訊
if [ ! -f "$BACKUP_DIR/backup_info.json" ]; then
  echo "❌ 錯誤: 找不到備份資訊檔案"
  exit 1
fi

echo "📋 備份資訊:"
jq -r '. |
  "   來源環境: \(.environment)\n" +
  "   備份時間: \(.date)\n" +
  "   資料表數: \(.table_count)\n" +
  "   總記錄數: \(.total_records)"' "$BACKUP_DIR/backup_info.json"
echo ""

# ============================================
# 警告確認
# ============================================
echo "⚠️  警告: 這將會清空目標資料庫並還原備份資料！"
echo "   目標: $ENV ($DB_NAME)"
echo ""
echo "⚠️  此操作無法撤銷！建議先備份目標環境："
echo "   ./backup-d1-full.sh $ENV"
echo ""
read -p "確定要繼續嗎? 請輸入 'YES' 確認: " confirm

if [ "$confirm" != "YES" ]; then
  echo "❌ 已取消"
  exit 0
fi

# ============================================
# Step 1: 獲取資料表清單（按還原順序）
# ============================================
echo ""
echo "🔍 分析資料表依賴關係..."

# 定義還原順序（考慮外鍵依賴）
# 1. 基礎資料表（沒有外鍵依賴）
# 2. 內容資料表
# 3. 關聯資料表

# 讀取所有備份的資料表
AVAILABLE_TABLES=$(ls "$BACKUP_DIR"/*.json 2>/dev/null | xargs -n 1 basename | sed 's/\.json$//' | grep -v -E "^(backup_info|schema|indexes)$" || true)

if [ -z "$AVAILABLE_TABLES" ]; then
  echo "❌ 錯誤: 找不到備份的資料表"
  exit 1
fi

# 建立還原順序（優先級高到低）
declare -a RESTORE_ORDER=(
  # 1. 基礎用戶相關
  "users"
  "user_profiles"
  "guest_sessions"
  "refresh_tokens"

  # 2. 核心內容資料
  "videos"
  "crags"
  "gyms"
  "areas"
  "sectors"
  "routes"
  "climbing_locations"

  # 3. 社群基礎
  "follows"
  "posts"
  "galleries"

  # 4. 傳記系統
  "biographies"
  "biography_core_stories"
  "biography_one_liners"
  "biography_stories"
  "biography_videos"
  "biography_instagrams"

  # 5. 問卷/故事系統
  "story_categories"
  "story_prompts"
  "story_questions"
  "core_story_questions"
  "one_liner_questions"
  "choice_questions"
  "choice_options"

  # 6. Bucket List
  "bucket_list_items"

  # 7. 關聯資料表
  "route_videos"
  "route_stories"
  "user_route_ascents"
  "user_badges"
  "gallery_images"
  "post_tags"
  "choice_answers"
  "bucket_list_references"

  # 8. 互動資料
  "likes"
  "bookmarks"
  "comments"
  "reviews"
  "biography_likes"
  "biography_views"
  "bucket_list_likes"
  "bucket_list_comments"
  "content_reactions"

  # 9. 通知
  "notifications"
  "notification_preferences"

  # 10. 其他
  "content_claims"
  "share_eligibility_config"
)

# 找出未在順序中的資料表（附加到最後）
ORDERED_TABLES=""
for table in "${RESTORE_ORDER[@]}"; do
  if echo "$AVAILABLE_TABLES" | grep -q "^${table}$"; then
    ORDERED_TABLES="$ORDERED_TABLES $table"
  fi
done

# 添加未預期的資料表
for table in $AVAILABLE_TABLES; do
  if ! echo "$ORDERED_TABLES" | grep -q "\b${table}\b"; then
    ORDERED_TABLES="$ORDERED_TABLES $table"
  fi
done

ORDERED_TABLES=$(echo "$ORDERED_TABLES" | xargs)  # 清理空白
TABLE_COUNT=$(echo "$ORDERED_TABLES" | wc -w | tr -d ' ')

echo "   ✓ 將還原 $TABLE_COUNT 個資料表"
echo ""

# ============================================
# Step 2: 清空現有資料（逆序刪除）
# ============================================
echo "🗑️  清空現有資料（保留結構）..."

# 逆序刪除資料（避免外鍵衝突）
REVERSE_TABLES=$(echo "$ORDERED_TABLES" | awk '{for(i=NF;i>=1;i--) printf "%s ", $i}')

for table in $REVERSE_TABLES; do
  echo "   ⏳ 清空 $table..."
  npx wrangler d1 execute "$DB_NAME" \
    --remote \
    --command="DELETE FROM $table" 2>/dev/null || {
      echo "   ⚠️  $table 清空失敗（可能不存在）"
    }
done

echo "   ✓ 資料已清空"

# ============================================
# Step 3: 還原資料
# ============================================
echo ""
echo "📥 開始還原資料..."

TOTAL_RECORDS=0
SUCCESS_COUNT=0
FAILED_COUNT=0

for table in $ORDERED_TABLES; do
  backup_file="$BACKUP_DIR/${table}.json"

  if [ ! -f "$backup_file" ]; then
    echo "   ⏭️  跳過 $table (備份不存在)"
    continue
  fi

  record_count=$(jq 'length' "$backup_file" 2>/dev/null || echo "0")

  if [ "$record_count" -eq 0 ]; then
    echo "   ⏭️  跳過 $table (無資料)"
    continue
  fi

  echo "   ⏳ 還原 $table ($record_count 筆)..."

  # 生成 INSERT SQL
  node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync('$backup_file', 'utf-8'));

    if (data.length === 0) process.exit(0);

    const columns = Object.keys(data[0]);
    const tableName = '$table';

    let sql = '';
    let count = 0;

    data.forEach(row => {
      const values = columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'number') return val;
        if (typeof val === 'boolean') return val ? 1 : 0;
        // 處理 JSON 字串和特殊字元
        return \"'\" + String(val).replace(/'/g, \"''\").replace(/\\\\/g, '\\\\\\\\') + \"'\";
      }).join(', ');

      sql += \"INSERT OR REPLACE INTO \${tableName} (\${columns.join(', ')}) VALUES (\${values});\\n\";
      count++;

      // 每 100 筆寫入一次（避免單一檔案過大）
      if (count % 100 === 0) {
        fs.appendFileSync('$BACKUP_DIR/temp_${table}.sql', sql);
        sql = '';
      }
    });

    // 寫入剩餘的 SQL
    if (sql) {
      fs.appendFileSync('$BACKUP_DIR/temp_${table}.sql', sql);
    }
  " 2>/dev/null || {
    echo "   ✗ $table SQL 生成失敗"
    FAILED_COUNT=$((FAILED_COUNT + 1))
    continue
  }

  if [ -f "$BACKUP_DIR/temp_${table}.sql" ]; then
    # 執行 SQL（使用 --file 參數）
    npx wrangler d1 execute "$DB_NAME" \
      --remote \
      --file="$BACKUP_DIR/temp_${table}.sql" 2>/dev/null && {
        echo "   ✓ $table: $record_count 筆記錄已還原"
        TOTAL_RECORDS=$((TOTAL_RECORDS + record_count))
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        rm "$BACKUP_DIR/temp_${table}.sql"
      } || {
        echo "   ✗ $table 還原失敗"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        # 保留失敗的 SQL 檔案供檢查
      }
  else
    echo "   ✗ $table SQL 檔案不存在"
    FAILED_COUNT=$((FAILED_COUNT + 1))
  fi
done

# ============================================
# Step 4: 更新統計資料
# ============================================
echo ""
echo "🔄 更新統計資料..."

# 更新岩場統計
npx wrangler d1 execute "$DB_NAME" --remote --command="
  UPDATE crags SET
    route_count = (SELECT COUNT(*) FROM routes WHERE crag_id = crags.id),
    bolt_count = (SELECT COALESCE(SUM(bolt_count), 0) FROM routes WHERE crag_id = crags.id),
    updated_at = datetime('now')
  WHERE id IN (SELECT DISTINCT crag_id FROM routes)
" 2>/dev/null && echo "   ✓ 岩場統計已更新" || echo "   ⚠️  岩場統計更新失敗"

# 更新區域路線數
npx wrangler d1 execute "$DB_NAME" --remote --command="
  UPDATE areas SET
    route_count = (SELECT COUNT(*) FROM routes WHERE area_id = areas.id),
    updated_at = datetime('now')
  WHERE id IN (SELECT DISTINCT area_id FROM routes WHERE area_id IS NOT NULL)
" 2>/dev/null && echo "   ✓ 區域統計已更新" || echo "   ⚠️  區域統計更新失敗"

# ============================================
# 完成
# ============================================
echo ""
echo "✅ 還原完成！"
echo ""
echo "📊 還原統計:"
echo "   - 成功還原: $SUCCESS_COUNT 個資料表"
echo "   - 失敗: $FAILED_COUNT 個資料表"
echo "   - 總記錄數: $TOTAL_RECORDS"
echo ""
echo "💡 驗證指令:"
echo "   npx wrangler d1 execute $DB_NAME --remote --command='SELECT COUNT(*) as count FROM users'"
echo "   npx wrangler d1 execute $DB_NAME --remote --command='SELECT COUNT(*) as count FROM crags'"
echo "   npx wrangler d1 execute $DB_NAME --remote --command='SELECT COUNT(*) as count FROM routes'"
echo "   npx wrangler d1 execute $DB_NAME --remote --command='SELECT COUNT(*) as count FROM videos'"
echo ""
echo "🌐 測試 API:"
echo "   curl https://api$([ "$ENV" = "preview" ] && echo "-preview").nobodyclimb.cc/api/v1/stats"
