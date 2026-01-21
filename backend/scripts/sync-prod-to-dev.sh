#!/bin/bash
# 將 Production D1 資料同步到 Dev/Preview 環境
# 使用方式: CLOUDFLARE_API_TOKEN=your_token ./scripts/sync-prod-to-dev.sh

set -e

PROD_DB="nobodyclimb-db"
DEV_DB="nobodyclimb-db-preview"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Production to Dev 資料同步工具 ===${NC}"
echo ""

# 檢查 CLOUDFLARE_API_TOKEN
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${RED}錯誤: 請設定 CLOUDFLARE_API_TOKEN 環境變數${NC}"
    echo "範例: CLOUDFLARE_API_TOKEN=your_token ./scripts/sync-prod-to-dev.sh"
    exit 1
fi

# 建立備份目錄
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}步驟 1/5: 檢查兩邊的 migrations 狀態${NC}"
echo "Production migrations:"
npx wrangler d1 migrations list "$PROD_DB" --remote
echo ""
echo "Dev/Preview migrations:"
npx wrangler d1 migrations list "$DEV_DB" --remote
echo ""

read -p "migrations 狀態是否一致？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}請先執行 migrations 同步:${NC}"
    echo "npx wrangler d1 migrations apply $DEV_DB --remote"
    exit 1
fi

echo -e "${YELLOW}步驟 2/5: 從 Production 導出完整資料${NC}"
PROD_BACKUP="$BACKUP_DIR/prod_backup_$TIMESTAMP.sql"
npx wrangler d1 export "$PROD_DB" --remote --output="$PROD_BACKUP"
echo -e "${GREEN}已導出到: $PROD_BACKUP${NC}"

echo -e "${YELLOW}步驟 3/5: 備份 Dev 現有資料${NC}"
DEV_BACKUP="$BACKUP_DIR/dev_backup_$TIMESTAMP.sql"
npx wrangler d1 export "$DEV_DB" --remote --output="$DEV_BACKUP"
echo -e "${GREEN}已備份到: $DEV_BACKUP${NC}"

echo -e "${YELLOW}步驟 4/5: 取得所有表格名稱並清空 Dev 資料${NC}"
# 從備份檔案中提取表格名稱（排除 sqlite 系統表和 _cf_KV, d1_migrations）
TABLES=$(grep -oP 'CREATE TABLE (?:IF NOT EXISTS )?\K["`]?\w+["`]?' "$PROD_BACKUP" | tr -d '"`' | grep -v '^_cf' | grep -v '^d1_migrations' | grep -v '^sqlite' | sort -u)

echo "找到以下表格:"
echo "$TABLES"
echo ""

# 產生清空資料的 SQL（使用 DELETE 而非 DROP，保留 schema）
CLEAR_SQL="$BACKUP_DIR/clear_dev_$TIMESTAMP.sql"
echo "PRAGMA foreign_keys = OFF;" > "$CLEAR_SQL"
for table in $TABLES; do
    echo "DELETE FROM $table;" >> "$CLEAR_SQL"
done
echo "PRAGMA foreign_keys = ON;" >> "$CLEAR_SQL"

echo "清空 Dev 資料..."
npx wrangler d1 execute "$DEV_DB" --remote --file="$CLEAR_SQL"
echo -e "${GREEN}Dev 資料已清空${NC}"

echo -e "${YELLOW}步驟 5/5: 導入 Production 資料到 Dev${NC}"
# 從 prod backup 中只提取 INSERT 語句
INSERT_SQL="$BACKUP_DIR/prod_inserts_$TIMESTAMP.sql"
grep -E '^INSERT INTO' "$PROD_BACKUP" > "$INSERT_SQL" || true

if [ -s "$INSERT_SQL" ]; then
    echo "PRAGMA foreign_keys = OFF;" | cat - "$INSERT_SQL" > "$BACKUP_DIR/temp.sql"
    echo "PRAGMA foreign_keys = ON;" >> "$BACKUP_DIR/temp.sql"
    mv "$BACKUP_DIR/temp.sql" "$INSERT_SQL"

    npx wrangler d1 execute "$DEV_DB" --remote --file="$INSERT_SQL"
    echo -e "${GREEN}資料導入完成！${NC}"
else
    echo -e "${YELLOW}沒有找到 INSERT 語句，可能 production 資料庫是空的${NC}"
fi

echo ""
echo -e "${GREEN}=== 同步完成 ===${NC}"
echo "備份檔案位置:"
echo "  - Production 備份: $PROD_BACKUP"
echo "  - Dev 備份: $DEV_BACKUP"
echo "  - 清空 SQL: $CLEAR_SQL"
echo "  - INSERT SQL: $INSERT_SQL"
