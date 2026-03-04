#!/bin/bash
# ============================================
# Production → Preview 完整還原流程
# ============================================
# 此腳本整合以下步驟:
# 1. 備份 production 資料庫
# 2. 刪除 preview 所有資料表
# 3. 還原 production 資料到 preview
# 4. 執行 D1 migrations
# 5. 執行資料遷移 (routes/videos/gyms)
#
# Usage:
#   ./restore-prod-to-preview.sh              # 完整流程
#   ./restore-prod-to-preview.sh --skip-backup # 跳過備份步驟
#   ./restore-prod-to-preview.sh --help        # 顯示說明
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
LOG_FILE="restore_${TIMESTAMP}.log"

# 路徑設定
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRAG_DATA_DIR="$SCRIPT_DIR/crag-data"
GYM_DATA_DIR="$SCRIPT_DIR/gym-data"
BACKEND_DIR="$SCRIPT_DIR/../backend"

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

# 檢查腳本
[ -f "$CRAG_DATA_DIR/backup-d1-sql.sh" ] || error "找不到 backup-d1-sql.sh"
[ -f "$CRAG_DATA_DIR/drop-all-tables.sh" ] || error "找不到 drop-all-tables.sh"
[ -f "$CRAG_DATA_DIR/restore-d1-sql.sh" ] || error "找不到 restore-d1-sql.sh"

success "前置檢查完成"

# ============================================
# 流程開始
# ============================================

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Production → Preview 完整還原流程"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "此腳本將執行以下步驟:"
echo ""
if [ "$SKIP_BACKUP" = false ]; then
  echo "  1️⃣  備份 production 資料庫"
else
  echo "  1️⃣  備份 production 資料庫 [跳過]"
fi
echo "  2️⃣  刪除 preview 所有資料表"
echo "  3️⃣  還原 production 資料到 preview"
if [ "$SKIP_MIGRATION" = false ]; then
  echo "  4️⃣  執行 D1 migrations"
else
  echo "  4️⃣  執行 D1 migrations [跳過]"
fi
if [ "$SKIP_DATA_MIGRATION" = false ]; then
  echo "  5️⃣  執行資料遷移 (routes/videos/gyms)"
else
  echo "  5️⃣  執行資料遷移 [跳過]"
fi
echo ""
echo "⚠️  警告: 這將會清空 preview 資料庫並還原 production 資料！"
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
  step "Step 1/5: 備份 production 資料庫"

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
# Step 2: 刪除 preview 所有資料表
# ============================================

step "Step 2/5: 刪除 preview 所有資料表"

cd "$CRAG_DATA_DIR"

# 執行刪除 (自動回答 'YES' 確認)
echo "YES" | ./drop-all-tables.sh preview || error "刪除 preview 資料表失敗"

success "Preview 資料表已清空"

cd "$SCRIPT_DIR"

# ============================================
# Step 3: 還原 production 資料到 preview
# ============================================

step "Step 3/5: 還原 production 資料到 preview"

cd "$CRAG_DATA_DIR"

# 執行還原 (自動回答 'YES' 確認)
echo "YES" | ./restore-d1-sql.sh "$BACKUP_DIR_NAME" preview || error "還原資料失敗"

success "資料還原完成"

cd "$SCRIPT_DIR"

# ============================================
# Step 4: 執行 D1 migrations
# ============================================

if [ "$SKIP_MIGRATION" = false ]; then
  step "Step 4/5: 執行 D1 migrations"

  cd "$BACKEND_DIR"

  # 檢查並執行 migrations
  log "檢查待執行的 migrations..."

  npx wrangler d1 migrations list "$PREVIEW_DB" --remote || error "無法列出 migrations"

  echo ""
  read -p "是否執行 migrations? (y/n): " run_migrations

  if [ "$run_migrations" = "y" ] || [ "$run_migrations" = "Y" ]; then
    npx wrangler d1 migrations apply "$PREVIEW_DB" --remote || error "執行 migrations 失敗"
    success "Migrations 執行完成"
  else
    log "跳過 migrations"
  fi

  cd "$SCRIPT_DIR"
else
  log "跳過 D1 migrations"
fi

# ============================================
# Step 5: 執行資料遷移
# ============================================

if [ "$SKIP_DATA_MIGRATION" = false ]; then
  step "Step 5/5: 執行資料遷移 (routes/videos/gyms)"

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
echo "✅  完整還原流程執行完成！"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📊 執行摘要:"
echo "   - 備份來源: $BACKUP_DIR_NAME"
echo "   - 目標環境: preview ($PREVIEW_DB)"
echo "   - 執行時間: ${MINUTES}分${SECONDS}秒"
echo "   - 日誌檔案: $LOG_FILE"
echo ""
echo "🔍 驗證指令:"
echo "   # 檢查資料表"
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
