#!/bin/bash
# ============================================
# Preview → Production 完整重建流程
# ============================================
# 此腳本會完全刪除並重建 production 資料庫
# 將 preview 資料還原至 production
#
# ⚠️  極度危險：此操作會覆蓋 PRODUCTION 資料！
#
# 流程:
# 1. 備份 preview 資料庫
# 2. 刪除整個 production 資料庫
# 3. 重建 production 資料庫 (新的 database_id)
# 4. 自動更新 wrangler.toml
# 5. 還原 preview 資料到 production
#
# Usage:
#   ./restore-preview-to-prod-rebuild.sh              # 完整流程
#   ./restore-preview-to-prod-rebuild.sh --skip-backup # 跳過備份
#   ./restore-preview-to-prod-rebuild.sh --help        # 顯示說明
# ============================================

set -e  # 遇到錯誤立即停止

# ============================================
# 設定與參數
# ============================================

SKIP_BACKUP=false

# 解析參數
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-backup)
      SKIP_BACKUP=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --skip-backup   跳過備份步驟（使用最新的 preview 備份）"
      echo "  --help          顯示此說明"
      echo ""
      echo "⚠️  此腳本會覆蓋 PRODUCTION 資料庫！請謹慎使用。"
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
LOG_FILE="restore_preview_to_prod_${TIMESTAMP}.log"

# 路徑設定
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRAG_DATA_DIR="$SCRIPT_DIR/crag-data"
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
command -v jq >/dev/null 2>&1 || error "找不到 jq，請執行: brew install jq"

# 檢查目錄
[ -d "$CRAG_DATA_DIR" ] || error "找不到 crag-data 目錄: $CRAG_DATA_DIR"
[ -d "$BACKEND_DIR" ] || error "找不到 backend 目錄: $BACKEND_DIR"
[ -f "$WRANGLER_TOML" ] || error "找不到 wrangler.toml: $WRANGLER_TOML"

# 檢查腳本
[ -f "$CRAG_DATA_DIR/backup-d1-sql.sh" ] || error "找不到 backup-d1-sql.sh"
[ -f "$CRAG_DATA_DIR/restore-d1-sql.sh" ] || error "找不到 restore-d1-sql.sh"

success "前置檢查完成"

# ============================================
# 流程說明與最終確認
# ============================================

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Preview → Production 完整重建流程"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "🚨 極度警告："
echo ""
echo "  此腳本會 **完全刪除並重建** PRODUCTION 資料庫！"
echo "  - 刪除整個資料庫 (不只是資料表)"
echo "  - 重建資料庫 (會產生新的 database_id)"
echo "  - 自動更新 wrangler.toml"
echo "  - 覆蓋正式環境所有資料！"
echo ""
echo "此腳本將執行以下步驟:"
echo ""
if [ "$SKIP_BACKUP" = false ]; then
  echo "  1️⃣  備份 preview 資料庫"
else
  echo "  1️⃣  備份 preview 資料庫 [跳過]"
fi
echo "  2️⃣  刪除整個 production 資料庫"
echo "  3️⃣  重建 production 資料庫"
echo "  4️⃣  更新 wrangler.toml (database_id)"
echo "  5️⃣  還原 preview 資料到 production"
echo ""
echo "⚠️  此操作不可逆！確認前請確保 preview 資料已驗證完畢。"
echo ""
read -p "確定要繼續嗎? 請輸入 'YES-PRODUCTION' 確認: " confirm

if [ "$confirm" != "YES-PRODUCTION" ]; then
  echo "❌ 已取消"
  exit 0
fi

# 記錄開始時間
START_TIME=$(date +%s)

# ============================================
# Step 1: 備份 preview
# ============================================

if [ "$SKIP_BACKUP" = false ]; then
  step "Step 1/5: 備份 preview 資料庫"

  cd "$CRAG_DATA_DIR"

  # 執行備份 (自動回答 'n' 不壓縮，以加快速度)
  echo "n" | ./backup-d1-sql.sh preview || error "備份 preview 失敗"

  # 取得最新的備份目錄
  BACKUP_DIR=$(ls -td ../../backups/preview_sql_* 2>/dev/null | head -1)

  if [ -z "$BACKUP_DIR" ]; then
    error "找不到備份目錄"
  fi

  BACKUP_DIR_NAME=$(basename "$BACKUP_DIR")

  success "Preview 備份完成: $BACKUP_DIR_NAME"

  cd "$SCRIPT_DIR"
else
  log "跳過備份步驟"

  # 尋找最新的 preview 備份
  BACKUP_DIR=$(ls -td "$SCRIPT_DIR/../backups/preview_sql_"* 2>/dev/null | head -1)

  if [ -z "$BACKUP_DIR" ]; then
    error "找不到現有的 preview 備份，請先執行備份"
  fi

  BACKUP_DIR_NAME=$(basename "$BACKUP_DIR")
  log "使用現有備份: $BACKUP_DIR_NAME"
fi

# ============================================
# Step 2: 讀取舊的 database_id (在刪除之前)
# ============================================

step "Step 2/5: 讀取舊的 production database_id"

cd "$BACKEND_DIR"

# 讀取舊的 database_id (production 環境)
OLD_DB_ID=$(grep -A 10 "\[\[env\.production\.d1_databases\]\]" "$WRANGLER_TOML" | grep "database_id" | sed -E 's/.*database_id[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/')

if [ -z "$OLD_DB_ID" ]; then
  error "無法從 wrangler.toml 讀取舊的 database_id，請檢查檔案格式"
fi

log "舊的 database_id: $OLD_DB_ID"

cd "$SCRIPT_DIR"

# ============================================
# Step 3: 刪除整個 production 資料庫
# ============================================

step "Step 3/5: 刪除整個 production 資料庫"

cd "$BACKEND_DIR"

# 先檢查資料庫是否存在
log "檢查 production 資料庫..."
DB_LIST=$(npx wrangler d1 list --json 2>/dev/null)
DB_LIST_EXIT=$?

if [ $DB_LIST_EXIT -ne 0 ]; then
  error "無法列出 D1 資料庫，請確認 wrangler 登入狀態 (執行 'npx wrangler login' 重新登入)"
fi

DB_EXISTS=$(echo "$DB_LIST" | jq -r --arg name "$PROD_DB" '.[] | select(.name == $name) | .name' || echo "")

if [ -n "$DB_EXISTS" ]; then
  warning "準備刪除 PRODUCTION 資料庫: $PROD_DB"
  echo ""
  read -p "最後確認，確定要刪除正式環境資料庫嗎? 請輸入 'DELETE-PRODUCTION' 確認: " confirm_delete

  if [ "$confirm_delete" != "DELETE-PRODUCTION" ]; then
    error "已取消刪除操作"
  fi

  log "刪除資料庫中..."
  npx wrangler d1 delete "$PROD_DB" -y || error "刪除資料庫失敗"
  success "Production 資料庫已刪除"
else
  log "Production 資料庫不存在，跳過刪除步驟"
fi

cd "$SCRIPT_DIR"

# ============================================
# Step 4: 重建 production 資料庫
# ============================================

step "Step 4/5: 重建 production 資料庫"

cd "$BACKEND_DIR"

log "建立新的 production 資料庫..."
CREATE_OUTPUT=$(npx wrangler d1 create "$PROD_DB" 2>&1)
CREATE_EXIT=$?

if [ $CREATE_EXIT -ne 0 ]; then
  echo ""
  log "wrangler 輸出:"
  echo "$CREATE_OUTPUT"
  echo ""
  error "建立 production 資料庫失敗。若 Cloudflare 上仍有同名資料庫殘留，請先手動執行: npx wrangler d1 delete $PROD_DB -y"
fi

# 從輸出中提取 database_id
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

step "Step 5/5 (更新): 更新 wrangler.toml (database_id)"

cd "$BACKEND_DIR"

# 備份 wrangler.toml
WRANGLER_BACKUP="wrangler.toml.backup_${TIMESTAMP}"
cp "$WRANGLER_TOML" "$WRANGLER_BACKUP"
log "已備份 wrangler.toml → $WRANGLER_BACKUP"

log "舊的 database_id: $OLD_DB_ID"
log "新的 database_id: $NEW_DB_ID"

# 使用 sed 替換 database_id (只替換 production 環境的)
# macOS 的 sed 需要 -i '' 而不是 -i
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "/\[\[env\.production\.d1_databases\]\]/,/^\[\[/ s/database_id = \"$OLD_DB_ID\"/database_id = \"$NEW_DB_ID\"/" "$WRANGLER_TOML"
else
  sed -i "/\[\[env\.production\.d1_databases\]\]/,/^\[\[/ s/database_id = \"$OLD_DB_ID\"/database_id = \"$NEW_DB_ID\"/" "$WRANGLER_TOML"
fi

# 驗證更新
UPDATED_DB_ID=$(grep -A 10 "\[\[env\.production\.d1_databases\]\]" "$WRANGLER_TOML" | grep "database_id" | sed -E 's/.*database_id[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/')

if [ "$UPDATED_DB_ID" = "$NEW_DB_ID" ]; then
  success "wrangler.toml 已更新"
else
  error "wrangler.toml 更新失敗"
fi

cd "$SCRIPT_DIR"

# ============================================
# Step 6: 還原 preview 資料到 production
# ============================================

step "Step 5/5: 還原 preview 資料到 production"

cd "$CRAG_DATA_DIR"

# 執行還原 (自動回答 'YES' 確認)
echo "YES" | ./restore-d1-sql.sh "$BACKUP_DIR_NAME" production || error "還原資料失敗"

success "資料還原完成"

cd "$SCRIPT_DIR"

# ============================================
# 完成
# ============================================

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅  Preview → Production 重建流程執行完成！"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📊 執行摘要:"
echo "   - 備份來源: $BACKUP_DIR_NAME"
echo "   - 目標環境: production ($PROD_DB)"
echo "   - 舊 database_id: $OLD_DB_ID"
echo "   - 新 database_id: $NEW_DB_ID"
echo "   - 執行時間: ${MINUTES}分${SECONDS}秒"
echo "   - 日誌檔案: $LOG_FILE"
echo "   - wrangler.toml 備份: $WRANGLER_BACKUP"
echo ""
echo "⚠️  重要提醒:"
echo "   - wrangler.toml 已自動更新 database_id"
echo "   - 如需還原設定，使用: cp backend/$WRANGLER_BACKUP backend/wrangler.toml"
echo "   - 請記得將更新後的 wrangler.toml commit 到 git"
echo ""
echo "🔍 驗證指令:"
echo "   # 檢查資料表"
echo "   cd $BACKEND_DIR"
echo "   npx wrangler d1 execute $PROD_DB --remote --command='SELECT name FROM sqlite_master WHERE type=\"table\"'"
echo ""
echo "   # 檢查資料數量"
echo "   npx wrangler d1 execute $PROD_DB --remote --command='SELECT COUNT(*) FROM crags'"
echo "   npx wrangler d1 execute $PROD_DB --remote --command='SELECT COUNT(*) FROM routes'"
echo "   npx wrangler d1 execute $PROD_DB --remote --command='SELECT COUNT(*) FROM gyms'"
echo ""
echo "🌐 測試 API:"
echo "   curl https://api.nobodyclimb.cc/api/v1/stats"
echo "   curl https://api.nobodyclimb.cc/api/v1/crags"
echo "   curl https://api.nobodyclimb.cc/api/v1/gyms"
echo ""
echo "📝 Git 操作:"
echo "   cd $BACKEND_DIR"
echo "   git diff wrangler.toml  # 檢查變更"
echo "   git add wrangler.toml   # 加入變更"
echo "   git commit -m 'chore: update production database_id after rebuild'"
echo ""
