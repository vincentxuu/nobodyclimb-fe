#!/bin/bash

# 自動新增 YouTube 頻道到 channels.json
# 使用方法: ./scripts/add-channel.sh <YouTube頻道URL> [精選閾值]

set -e

CHANNELS_FILE="scripts/channels.json"

# 互動式輸入
if [ -z "$1" ]; then
    echo "🎬 新增 YouTube 頻道"
    echo "========================"
    echo ""
    read -p "📺 請輸入 YouTube 頻道 URL: " CHANNEL_URL
    read -p "⭐ 精選閾值 (預設 20000): " FEATURED_THRESHOLD
    FEATURED_THRESHOLD=${FEATURED_THRESHOLD:-20000}
else
    CHANNEL_URL=$1
    FEATURED_THRESHOLD=${2:-20000}
fi

# 檢查 URL
if [ -z "$CHANNEL_URL" ]; then
    echo "❌ 請輸入有效的 URL"
    exit 1
fi

# 檢查 yt-dlp 是否安裝
if ! command -v yt-dlp &> /dev/null; then
    echo "❌ yt-dlp 未安裝，請先安裝："
    echo "   macOS: brew install yt-dlp"
    exit 1
fi

# 檢查 jq 是否安裝
if ! command -v jq &> /dev/null; then
    echo "❌ jq 未安裝，請先安裝："
    echo "   macOS: brew install jq"
    exit 1
fi

echo "🔍 正在取得頻道資訊..."

# 使用 yt-dlp 取得頻道資訊
CHANNEL_INFO=$(yt-dlp --dump-single-json --playlist-items 0 "$CHANNEL_URL" 2>/dev/null)

if [ -z "$CHANNEL_INFO" ]; then
    echo "❌ 無法取得頻道資訊，請確認 URL 是否正確"
    exit 1
fi

# 解析頻道資訊
DISPLAY_NAME=$(echo "$CHANNEL_INFO" | jq -r '.channel // .uploader')
CHANNEL_ID=$(echo "$CHANNEL_INFO" | jq -r '.uploader_id')

# 從 channel ID 產生 name（小寫，移除 @）
NAME=$(echo "$CHANNEL_ID" | sed 's/@//' | tr '[:upper:]' '[:lower:]')

echo ""
echo "📺 頻道資訊:"
echo "   顯示名稱: $DISPLAY_NAME"
echo "   頻道 ID: $CHANNEL_ID"
echo "   內部名稱: $NAME"
echo "   精選閾值: $FEATURED_THRESHOLD"
echo ""

# 檢查是否已存在
if jq -e ".channels[] | select(.channelId == \"$CHANNEL_ID\")" "$CHANNELS_FILE" > /dev/null 2>&1; then
    echo "⚠️  頻道已存在於 channels.json"
    exit 1
fi

# 建立新的頻道物件
NEW_CHANNEL=$(jq -n \
    --arg url "$CHANNEL_URL" \
    --arg name "$NAME" \
    --arg displayName "$DISPLAY_NAME" \
    --arg channelId "$CHANNEL_ID" \
    --argjson featuredThreshold "$FEATURED_THRESHOLD" \
    '{
        url: $url,
        name: $name,
        displayName: $displayName,
        channelId: $channelId,
        type: "climbing",
        featuredThreshold: $featuredThreshold
    }')

# 新增到 channels.json
jq ".channels += [$NEW_CHANNEL]" "$CHANNELS_FILE" > "${CHANNELS_FILE}.tmp" && mv "${CHANNELS_FILE}.tmp" "$CHANNELS_FILE"

echo "✅ 已新增頻道: $DISPLAY_NAME"
echo ""
echo "📂 已更新: $CHANNELS_FILE"
