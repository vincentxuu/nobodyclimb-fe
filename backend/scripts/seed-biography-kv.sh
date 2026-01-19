#!/bin/bash

# 一次性腳本：將現有人物誌 metadata 批次寫入 KV
# 使用方式：
#   cd backend
#   ./scripts/seed-biography-kv.sh preview    # Preview 環境
#   ./scripts/seed-biography-kv.sh production # Production 環境

set -e

ENV=${1:-preview}

if [[ "$ENV" != "preview" && "$ENV" != "production" ]]; then
  echo "Usage: $0 [preview|production]"
  exit 1
fi

echo "=== Seeding biography metadata to KV ($ENV) ==="

# 設定資料庫和 KV 名稱
if [[ "$ENV" == "production" ]]; then
  DB_NAME="nobodyclimb-db"
  KV_ID="608d1fb3c4424146abe50ab56e246aca"
else
  DB_NAME="nobodyclimb-db-preview"
  KV_ID="396df52e16864a35a3cb7898fcd686e7"
fi

# 建立暫存目錄
TEMP_DIR=$(mktemp -d)
echo "Using temp directory: $TEMP_DIR"

# 從 D1 查詢所有可公開顯示的人物誌
# 包含 visibility = 'public', 'community', 'anonymous' 或舊的 is_public = 1
echo "Querying biographies from D1..."
wrangler d1 execute "$DB_NAME" --remote --env "$ENV" \
  --command "SELECT id, name, avatar_url, bio, title, climbing_meaning FROM biographies WHERE visibility IN ('public', 'community', 'anonymous') OR (visibility IS NULL AND is_public = 1)" \
  --json > "$TEMP_DIR/biographies.json"

# 用 Node.js 處理 JSON 並產生 KV bulk 格式
echo "Processing data..."
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('$TEMP_DIR/biographies.json', 'utf8'));

// wrangler d1 execute --json 回傳格式
const results = data[0]?.results || [];

if (results.length === 0) {
  console.log('No biographies found');
  process.exit(0);
}

console.log('Found ' + results.length + ' biographies');

// 產生 KV bulk put 格式
const kvData = results.map(bio => ({
  key: 'bio-meta:' + bio.id,
  value: JSON.stringify({
    id: bio.id,
    name: bio.name,
    avatar_url: bio.avatar_url,
    bio: bio.bio,
    title: bio.title,
    climbing_meaning: bio.climbing_meaning
  }),
  expiration_ttl: 604800 // 7 days
}));

fs.writeFileSync('$TEMP_DIR/kv-data.json', JSON.stringify(kvData, null, 2));
console.log('Generated KV data for ' + kvData.length + ' entries');
"

# 檢查是否有資料
if [[ ! -s "$TEMP_DIR/kv-data.json" ]]; then
  echo "No data to seed"
  rm -rf "$TEMP_DIR"
  exit 0
fi

# 上傳到 KV
echo "Uploading to KV namespace $KV_ID..."
wrangler kv bulk put "$TEMP_DIR/kv-data.json" --namespace-id "$KV_ID"

# 清理
rm -rf "$TEMP_DIR"

echo "=== Done! ==="
