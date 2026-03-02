#!/bin/bash

# R2 Custom Domain 設定腳本
# 使用方式: ./scripts/setup-r2-domain.sh <ZONE_ID>

set -e

# 檢查參數
if [ -z "$1" ]; then
    echo "❌ 錯誤: 請提供 Zone ID"
    echo ""
    echo "使用方式:"
    echo "  ./scripts/setup-r2-domain.sh <ZONE_ID>"
    echo ""
    echo "獲取 Zone ID:"
    echo "  1. 前往 https://dash.cloudflare.com/"
    echo "  2. 點擊 nobodyclimb.cc 域名"
    echo "  3. 複製右側的 Zone ID"
    exit 1
fi

ZONE_ID=$1

echo "🔧 設定 R2 Custom Domain..."
echo ""

# Production bucket
echo "📦 設定 Production bucket: nobodyclimb-storage"
wrangler r2 bucket domain add nobodyclimb-storage \
    --domain storage.nobodyclimb.cc \
    --zone-id "$ZONE_ID" \
    --force

echo "✅ Production bucket 設定完成"
echo ""

# Preview bucket (optional)
read -p "是否要設定 Preview 環境? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 設定 Preview bucket: nobodyclimb-storage-preview"
    wrangler r2 bucket domain add nobodyclimb-storage-preview \
        --domain storage-preview.nobodyclimb.cc \
        --zone-id "$ZONE_ID" \
        --force
    echo "✅ Preview bucket 設定完成"
fi

echo ""
echo "🎉 R2 Custom Domain 設定完成！"
echo ""
echo "接下來的步驟:"
echo "1. 等待 DNS 傳播 (1-5 分鐘)"
echo "2. 驗證設定: nslookup storage.nobodyclimb.cc"
echo "3. 重新部署前端: pnpm build:cf && wrangler deploy --env production"
