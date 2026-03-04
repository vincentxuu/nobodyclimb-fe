#!/bin/bash
# ============================================
# Production → Preview 完整重建流程
# ============================================
# 此腳本會完全刪除並重建 preview 資料庫
# 解決 schema 不相容問題
#
# 流程:
# 1. 備份 production 資料庫
# 2. 刪除整個 preview 資料庫
# 3. 重建 preview 資料庫 (新的 database_id)
# 4. 自動更新 wrangler.toml
# 5. 還原 production 資料
# 6. 執行最新的 migrations
# 7. 執行資料遷移
#
# Usage:
#   ./restore-prod-to-preview-rebuild.sh              # 完整流程
#   ./restore-prod-to-preview-rebuild.sh --skip-backup # 跳過備份
#   ./restore-prod-to-preview-rebuild.sh --help        # 顯示說明
# ============================================

set -e  # 遇到錯誤立即停止

# ============================================
# 設定與參數
# ============================================

SKIP_BACKUP=false
SKIP_MIGRATION=false
SKIP_DATA_MIGRATION=false

# 解析參數
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-backup)
      SKIP_BACKUP=true
      shift
      ;;
    --skip-migration)
      SKIP_MIGRATION=true
      shift
      ;;
    --skip-data-migration)
      SKIP_DATA_MIGRATION=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --skip-backup          跳過備份步驟"
      echo "  --skip-migration       跳過 D1 migrations"
      echo "  --skip-data-migration  跳過資料遷移 (routes/videos/gyms)"
      echo "  --help                 顯示此說明"
      exit 0
      ;;
    *)
      echo "未知參數: $1"
      echo "使用 --help 查看說明"
      exit 1
      ;;
  esac
done

# 時間戳記
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="restore_rebuild_${TIMESTAMP}.log"

# 路徑設定
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRAG_DATA_DIR="$SCRIPT_DIR/crag-data"
GYM_DATA_DIR="$SCRIPT_DIR/gym-data"
BACKEND_DIR="$SCRIPT_DIR/../backend"
WRANGLER_TOML="$BACKEND_DIR/wrangler.toml"

# 資料庫名稱
PROD_DB="nobodyclimb-db"
PREVIEW_DB="nobodyclimb-db-preview"

# ============================================
# 輔助函數
# ============================================

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

step() {
  echo ""
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║  $1"
  echo "╚════════════════════════════════════════════════════════════════╝"
  echo ""
  log "開始: $1"
}

success() {
  echo "✅ $1"
  log "成功: $1"
}

error() {
  echo "❌ $1"
  log "錯誤: $1"
  exit 1
}

warning() {
  echo "⚠️  $1"
  log "警告: $1"
}

# ============================================
# 前置檢查
# ============================================

step "前置檢查"

# 檢查必要的工具
log "檢查必要工具..."
command -v npx >/dev/null 2>&1 || error "找不到 npx，請安裝 Node.js"
command -v pnpm >/dev/null 2>&1 || error "找不到 pnpm，請執行: npm install -g pnpm"
command -v jq >/dev/null 2>&1 || error "找不到 jq，請執行: brew install jq"

# 檢查目錄
[ -d "$CRAG_DATA_DIR" ] || error "找不到 crag-data 目錄: $CRAG_DATA_DIR"
[ -d "$GYM_DATA_DIR" ] || error "找不到 gym-data 目錄: $GYM_DATA_DIR"
[ -d "$BACKEND_DIR" ] || error "找不到 backend 目錄: $BACKEND_DIR"
[ -f "$WRANGLER_TOML" ] || error "找不到 wrangler.toml: $WRANGLER_TOML"

# 檢查腳本
[ -f "$CRAG_DATA_DIR/backup-d1-sql.sh" ] || error "找不到 backup-d1-sql.sh"
[ -f "$CRAG_DATA_DIR/restore-d1-sql.sh" ] || error "找不到 restore-d1-sql.sh"

success "前置檢查完成"

# ============================================
# 流程開始
# ============================================

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Production → Preview 完整重建流程"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "⚠️  重要提醒:"
echo ""
echo "  此腳本會 **完全刪除並重建** preview 資料庫！"
echo "  - 刪除整個資料庫 (不只是資料表)"
echo "  - 重建資料庫 (會產生新的 database_id)"
echo "  - 自動更新 wrangler.toml"
echo ""
echo "此腳本將執行以下步驟:"
echo ""
if [ "$SKIP_BACKUP" = false ]; then
  echo "  1️⃣  備份 production 資料庫"
else
  echo "  1️⃣  備份 production 資料庫 [跳過]"
fi
echo "  2️⃣  刪除整個 preview 資料庫"
echo "  3️⃣  重建 preview 資料庫"
echo "  4️⃣  更新 wrangler.toml (database_id)"
echo "  5️⃣  還原 production 資料"
if [ "$SKIP_MIGRATION" = false ]; then
  echo "  6️⃣  執行最新的 migrations"
else
  echo "  6️⃣  執行最新的 migrations [跳過]"
fi
if [ "$SKIP_DATA_MIGRATION" = false ]; then
  echo "  7️⃣  執行資料遷移 (routes/videos/gyms)"
else
  echo "  7️⃣  執行資料遷移 [跳過]"
fi
echo ""
echo "⚠️  警告: 此操作不可逆！"
echo ""
read -p "確定要繼續嗎? 請輸入 'YES' 確認: " confirm

if [ "$confirm" != "YES" ]; then
  echo "❌ 已取消"
  exit 0
fi

# 記錄開始時間
START_TIME=$(date +%s)

# ============================================
# Step 1: 備份 production
# ============================================

if [ "$SKIP_BACKUP" = false ]; then
  step "Step 1/7: 備份 production 資料庫"

  cd "$CRAG_DATA_DIR"

  # 執行備份 (自動回答 'n' 不壓縮，以加快速度)
  echo "n" | ./backup-d1-sql.sh production || error "備份 production 失敗"

  # 取得最新的備份目錄
  BACKUP_DIR=$(ls -td ../../backups/production_sql_* 2>/dev/null | head -1)

  if [ -z "$BACKUP_DIR" ]; then
    error "找不到備份目錄"
  fi

  BACKUP_DIR_NAME=$(basename "$BACKUP_DIR")

  success "Production 備份完成: $BACKUP_DIR_NAME"

  cd "$SCRIPT_DIR"
else
  log "跳過備份步驟"

  # 尋找最新的 production 備份
  BACKUP_DIR=$(ls -td "$SCRIPT_DIR/../backups/production_sql_"* 2>/dev/null | head -1)

  if [ -z "$BACKUP_DIR" ]; then
    error "找不到現有的 production 備份，請先執行備份"
  fi

  BACKUP_DIR_NAME=$(basename "$BACKUP_DIR")
  log "使用現有備份: $BACKUP_DIR_NAME"
fi

# ============================================
# Step 2: 讀取舊的 database_id (在刪除之前)
# ============================================

step "Step 2/7: 讀取舊的 database_id"

cd "$BACKEND_DIR"

# 讀取舊的 database_id (使用雙中括號 pattern，-A 10 因為有空行)
OLD_DB_ID=$(grep -A 10 "\[\[env\.preview\.d1_databases\]\]" "$WRANGLER_TOML" | grep "database_id" | sed -E 's/.*database_id[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/')

if [ -z "$OLD_DB_ID" ]; then
  error "無法從 wrangler.toml 讀取舊的 database_id，請檢查檔案格式"
fi

log "舊的 database_id: $OLD_DB_ID"

cd "$SCRIPT_DIR"

# ============================================
# Step 3: 刪除整個 preview 資料庫
# ============================================

step "Step 3/7: 刪除整個 preview 資料庫"

cd "$BACKEND_DIR"

# 先檢查資料庫是否存在
log "檢查 preview 資料庫..."
DB_LIST=$(npx wrangler d1 list --json 2>/dev/null)
DB_LIST_EXIT=$?

if [ $DB_LIST_EXIT -ne 0 ]; then
  error "無法列出 D1 資料庫，請確認 wrangler 登入狀態 (執行 'npx wrangler login' 重新登入)"
fi

DB_EXISTS=$(echo "$DB_LIST" | jq -r --arg name "$PREVIEW_DB" '.[] | select(.name == $name) | .name' || echo "")

if [ -n "$DB_EXISTS" ]; then
  warning "準備刪除 preview 資料庫: $PREVIEW_DB"
  echo ""
  read -p "再次確認，確定要刪除嗎? 請輸入 'DELETE' 確認: " confirm_delete

  if [ "$confirm_delete" != "DELETE" ]; then
    error "已取消刪除操作"
  fi

  log "刪除資料庫中..."
  npx wrangler d1 delete "$PREVIEW_DB" -y || error "刪除資料庫失敗"
  success "Preview 資料庫已刪除"
else
  log "Preview 資料庫不存在，跳過刪除步驟"
fi

cd "$SCRIPT_DIR"

# ============================================
# Step 4: 重建 preview 資料庫
# ============================================

step "Step 4/7: 重建 preview 資料庫"

cd "$BACKEND_DIR"

log "建立新的 preview 資料庫..."
CREATE_OUTPUT=$(npx wrangler d1 create "$PREVIEW_DB" 2>&1)
CREATE_EXIT=$?

if [ $CREATE_EXIT -ne 0 ]; then
  echo ""
  log "wrangler 輸出:"
  echo "$CREATE_OUTPUT"
  echo ""
  error "建立 preview 資料庫失敗。若 Cloudflare 上仍有同名資料庫殘留，請先手動執行: npx wrangler d1 delete $PREVIEW_DB -y"
fi

# 從輸出中提取 database_id
# 預期格式: [[d1_databases]]
#           binding = "DB"
#           database_name = "nobodyclimb-db-preview"
#           database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

NEW_DB_ID=$(echo "$CREATE_OUTPUT" | grep -E "database_id[[:space:]]*=[[:space:]]*\"" | sed -E 's/.*database_id[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/')

if [ -z "$NEW_DB_ID" ]; then
  echo ""
  log "wrangler 輸出:"
  echo "$CREATE_OUTPUT"
  echo ""
  error "無法取得新的 database_id，請檢查 wrangler 輸出"
fi

success "資料庫已建立，database_id: $NEW_DB_ID"

cd "$SCRIPT_DIR"

# ============================================
# Step 5: 更新 wrangler.toml
# ============================================

step "Step 5/7: 更新 wrangler.toml (database_id)"

cd "$BACKEND_DIR"

# 備份 wrangler.toml
WRANGLER_BACKUP="wrangler.toml.backup_${TIMESTAMP}"
cp "$WRANGLER_TOML" "$WRANGLER_BACKUP"
log "已備份 wrangler.toml → $WRANGLER_BACKUP"

log "舊的 database_id: $OLD_DB_ID"
log "新的 database_id: $NEW_DB_ID"

# 使用 sed 替換 database_id (只替換 preview 環境的)
# macOS 的 sed 需要 -i '' 而不是 -i
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS - 使用雙中括號 pattern
  sed -i '' "/\[\[env\.preview\.d1_databases\]\]/,/^\[\[/ s/database_id = \"$OLD_DB_ID\"/database_id = \"$NEW_DB_ID\"/" "$WRANGLER_TOML"
else
  # Linux - 使用雙中括號 pattern
  sed -i "/\[\[env\.preview\.d1_databases\]\]/,/^\[\[/ s/database_id = \"$OLD_DB_ID\"/database_id = \"$NEW_DB_ID\"/" "$WRANGLER_TOML"
fi

# 驗證更新 (使用雙中括號 pattern，-A 10 因為有空行)
UPDATED_DB_ID=$(grep -A 10 "\[\[env\.preview\.d1_databases\]\]" "$WRANGLER_TOML" | grep "database_id" | sed -E 's/.*database_id[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/')

if [ "$UPDATED_DB_ID" = "$NEW_DB_ID" ]; then
  success "wrangler.toml 已更新"
else
  error "wrangler.toml 更新失敗"
fi

cd "$SCRIPT_DIR"

# ============================================
# Step 6: 還原 production 資料
# ============================================

step "Step 6/8: 還原 production 資料到 preview"

cd "$CRAG_DATA_DIR"

# 執行還原 (自動回答 'YES' 確認)
echo "YES" | ./restore-d1-sql.sh "$BACKUP_DIR_NAME" preview || error "還原資料失敗"

success "資料還原完成"

cd "$SCRIPT_DIR"

# ============================================
# Step 7: 執行 D1 migrations
# ============================================

if [ "$SKIP_MIGRATION" = false ]; then
  step "Step 7/8: 執行 D1 migrations"

  cd "$BACKEND_DIR"

  # 檢查並執行 migrations
  log "檢查待執行的 migrations..."

  npx wrangler d1 migrations list "$PREVIEW_DB" --remote --env preview || error "無法列出 migrations"

  echo ""
  read -p "是否執行 migrations? (y/n): " run_migrations

  if [ "$run_migrations" = "y" ] || [ "$run_migrations" = "Y" ]; then
    npx wrangler d1 migrations apply "$PREVIEW_DB" --remote --env preview || error "執行 migrations 失敗"
    success "Migrations 執行完成"
  else
    log "跳過 migrations"
  fi

  cd "$SCRIPT_DIR"
else
  log "跳過 D1 migrations"
fi

# ============================================
# Step 8: 執行資料遷移
# ============================================

if [ "$SKIP_DATA_MIGRATION" = false ]; then
  step "Step 8/8: 執行資料遷移 (routes/videos/gyms)"

  echo ""
  echo "請選擇要執行的資料遷移:"
  echo "  1) Routes/Videos 遷移 (crag-data)"
  echo "  2) Gyms 遷移 (gym-data)"
  echo "  3) 全部執行"
  echo "  4) 跳過"
  echo ""
  read -p "請選擇 (1-4): " migration_choice

  case $migration_choice in
    1)
      log "執行 Routes/Videos 遷移..."
      cd "$CRAG_DATA_DIR"
      pnpm migrate:json || error "Routes/Videos 遷移失敗"
      success "Routes/Videos 遷移完成"
      cd "$SCRIPT_DIR"
      ;;
    2)
      log "執行 Gyms 遷移..."
      cd "$GYM_DATA_DIR"
      pnpm migrate:json || error "Gyms 遷移失敗"
      success "Gyms 遷移完成"
      cd "$SCRIPT_DIR"
      ;;
    3)
      log "執行 Routes/Videos 遷移..."
      cd "$CRAG_DATA_DIR"
      pnpm migrate:json || error "Routes/Videos 遷移失敗"
      success "Routes/Videos 遷移完成"

      log "執行 Gyms 遷移..."
      cd "$GYM_DATA_DIR"
      pnpm migrate:json || error "Gyms 遷移失敗"
      success "Gyms 遷移完成"

      cd "$SCRIPT_DIR"
      ;;
    4)
      log "跳過資料遷移"
      ;;
    *)
      log "無效選擇，跳過資料遷移"
      ;;
  esac
else
  log "跳過資料遷移"
fi

# ============================================
# 完成
# ============================================

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅  完整重建流程執行完成！"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📊 執行摘要:"
echo "   - 備份來源: $BACKUP_DIR_NAME"
echo "   - 目標環境: preview ($PREVIEW_DB)"
echo "   - 舊 database_id: $OLD_DB_ID"
echo "   - 新 database_id: $NEW_DB_ID"
echo "   - 執行時間: ${MINUTES}分${SECONDS}秒"
echo "   - 日誌檔案: $LOG_FILE"
echo "   - wrangler.toml 備份: $WRANGLER_BACKUP"
echo ""
echo "⚠️  重要提醒:"
echo "   - wrangler.toml 已自動更新 database_id"
echo "   - 如需還原設定，使用: cp $WRANGLER_BACKUP wrangler.toml"
echo "   - 請記得將更新後的 wrangler.toml commit 到 git"
echo ""
echo "🔍 驗證指令:"
echo "   # 檢查資料表"
echo "   cd $BACKEND_DIR"
echo "   npx wrangler d1 execute $PREVIEW_DB --remote --command='SELECT name FROM sqlite_master WHERE type=\"table\"'"
echo ""
echo "   # 檢查資料數量"
echo "   npx wrangler d1 execute $PREVIEW_DB --remote --command='SELECT COUNT(*) FROM crags'"
echo "   npx wrangler d1 execute $PREVIEW_DB --remote --command='SELECT COUNT(*) FROM routes'"
echo "   npx wrangler d1 execute $PREVIEW_DB --remote --command='SELECT COUNT(*) FROM gyms'"
echo ""
echo "🌐 測試 API:"
echo "   curl https://api-preview.nobodyclimb.cc/api/v1/stats"
echo "   curl https://api-preview.nobodyclimb.cc/api/v1/crags"
echo "   curl https://api-preview.nobodyclimb.cc/api/v1/gyms"
echo ""
echo "📝 Git 操作:"
echo "   cd $BACKEND_DIR"
echo "   git diff wrangler.toml  # 檢查變更"
echo "   git add wrangler.toml   # 加入變更"
echo "   git commit -m 'chore: update preview database_id after rebuild'"
echo ""
