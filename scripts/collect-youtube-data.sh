#!/bin/bash

# 通用 YouTube 頻道資料收集腳本
# 使用 yt-dlp 收集任何 YouTube 頻道的影片資料並轉換成專案所需格式

set -e  # 遇到錯誤時停止執行

# 顯示使用說明
show_usage() {
    echo "使用方法: $0 <頻道URL> <輸出名稱> [頻道名稱] [頻道ID] [頻道類型] [精選閾值]"
    echo ""
    echo "參數說明:"
    echo "  頻道URL     : YouTube 頻道的完整 URL"
    echo "  輸出名稱    : 輸出檔案的基本名稱（不含副檔名）"
    echo "  頻道名稱    : 頻道的顯示名稱 (可選，預設從 URL 推導)"
    echo "  頻道ID      : 頻道的 ID (可選，預設從 URL 推導)"
    echo "  頻道類型    : climbing|tech|general 等 (可選，預設 climbing)"
    echo "  精選閾值    : 精選影片的觀看次數閾值 (可選，預設 50000)"
    echo ""
    echo "範例:"
    echo "  $0 'https://www.youtube.com/@mellowclimbing' 'mellow'"
    echo "  $0 'https://www.youtube.com/@PetzlSportVideos' 'petzl' 'Petzl Sport Videos' '@PetzlSportVideos' 'climbing' '10000'"
    echo "  $0 'https://www.youtube.com/@TechReview' 'tech' 'Tech Review Channel' '@TechReview' 'tech'"
    echo ""
}

# 檢查參數數量
if [ $# -lt 2 ]; then
    echo "❌ 參數不足"
    show_usage
    exit 1
fi

# 解析參數
CHANNEL_URL=$1
OUTPUT_NAME=$2
CHANNEL_NAME=${3:-""}  # 如果未提供，從 URL 推導
CHANNEL_ID=${4:-""}    # 如果未提供，從 URL 推導
CHANNEL_TYPE=${5:-"climbing"}
FEATURED_THRESHOLD=${6:-50000}

# 從 URL 推導頻道資訊（如果未提供）
if [ -z "$CHANNEL_NAME" ] || [ -z "$CHANNEL_ID" ]; then
    # 從 URL 中提取頻道 handle (例如 @mellowclimbing)
    EXTRACTED_HANDLE=$(echo "$CHANNEL_URL" | sed -n 's/.*@\\([^/]*\\).*/\\1/p')
    
    if [ -z "$CHANNEL_ID" ]; then
        CHANNEL_ID="@$EXTRACTED_HANDLE"
    fi
    
    if [ -z "$CHANNEL_NAME" ]; then
        # 將 handle 轉換為標題格式 (例如 mellowclimbing -> Mellow Climbing)
        CHANNEL_NAME=$(echo "$EXTRACTED_HANDLE" | sed 's/\\([a-z]\\)\\([A-Z]\\)/\\1 \\2/g' | sed 's/^./\\U&/' | sed 's/ ./\\U&/g')
    fi
fi

echo "🚀 開始收集 YouTube 頻道資料..."
echo "📺 頻道 URL: $CHANNEL_URL"
echo "🏷️  頻道名稱: $CHANNEL_NAME"
echo "🆔 頻道 ID: $CHANNEL_ID"
echo "📂 輸出名稱: $OUTPUT_NAME"
echo "📊 頻道類型: $CHANNEL_TYPE"
echo "⭐ 精選閾值: $FEATURED_THRESHOLD"

# 檢查 yt-dlp 是否安裝
if ! command -v yt-dlp &> /dev/null; then
    echo ""
    echo "❌ yt-dlp 未安裝，請先安裝："
    echo "   macOS: brew install yt-dlp"
    echo "   其他系統: pip install yt-dlp"
    echo ""
    exit 1
fi

# 檢查 Node.js 是否可用
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安裝，請先安裝 Node.js"
    exit 1
fi

# 檢查轉換腳本是否存在
CONVERT_SCRIPT="scripts/convert-youtube-videos.js"
if [ ! -f "$CONVERT_SCRIPT" ]; then
    echo "❌ 轉換腳本不存在: $CONVERT_SCRIPT"
    exit 1
fi

DATA_DIR="scripts/data"
PUBLIC_DATA_DIR="public/data"
JSON_FILE="$DATA_DIR/${OUTPUT_NAME}_videos.json"
OUTPUT_FILE="$PUBLIC_DATA_DIR/${OUTPUT_NAME}_videos.json"
TEMP_DIR="temp"

# 創建暫存目錄和資料目錄
mkdir -p "$TEMP_DIR"
mkdir -p "$DATA_DIR"
mkdir -p "$PUBLIC_DATA_DIR"

echo ""
echo "📥 步驟 1: 收集影片資料..."
echo "⏳ 正在從 $CHANNEL_URL 收集資料，這可能需要幾分鐘..."

# 使用 yt-dlp 收集影片資料
if yt-dlp --dump-json --flat-playlist "$CHANNEL_URL/videos" > "$TEMP_DIR/$JSON_FILE"; then
    # 檢查是否成功收集到資料
    if [ ! -s "$TEMP_DIR/$JSON_FILE" ]; then
        echo "❌ 無法收集到影片資料，請檢查："
        echo "   1. 網路連接是否正常"
        echo "   2. 頻道 URL 是否正確"
        echo "   3. 頻道是否公開可見"
        exit 1
    fi
    
    VIDEO_COUNT=$(wc -l < "$TEMP_DIR/$JSON_FILE")
    echo "✅ 成功收集 $VIDEO_COUNT 部影片資料"
else
    echo "❌ yt-dlp 執行失敗"
    exit 1
fi

echo ""
echo "🔄 步驟 2: 轉換資料格式..."

# 建構頻道資訊 JSON
CHANNEL_INFO="{\\"name\\":\\"$CHANNEL_NAME\\",\\"id\\":\\"$CHANNEL_ID\\",\\"type\\":\\"$CHANNEL_TYPE\\",\\"featuredThreshold\\":$FEATURED_THRESHOLD}"

# 使用通用轉換腳本
if node "$CONVERT_SCRIPT" "$TEMP_DIR/$JSON_FILE" "$OUTPUT_FILE" --channel "$CHANNEL_INFO"; then
    echo "✅ 成功生成 JSON 檔案"
else
    echo "❌ 轉換失敗，請檢查轉換腳本"
    exit 1
fi

echo ""
echo "🧹 步驟 3: 清理暫存檔案..."
# 將 JSON 檔案移到 scripts/data 作為備份
TEMP_JSON="$TEMP_DIR/${OUTPUT_NAME}_videos.json"
mv "$TEMP_JSON" "$JSON_FILE"
rmdir "$TEMP_DIR" 2>/dev/null || true

echo ""
echo "🎉 YouTube 頻道資料收集完成！"
echo ""
echo "📂 生成的檔案:"
echo "   - 原始資料備份: $JSON_FILE"
echo "   - JSON 影片資料: $OUTPUT_FILE"
echo ""
echo "📊 頻道資訊:"
echo "   - 頻道名稱: $CHANNEL_NAME"
echo "   - 頻道 ID: $CHANNEL_ID"
echo "   - 頻道類型: $CHANNEL_TYPE"
echo "   - 精選閾值: $FEATURED_THRESHOLD 次觀看"
echo ""
echo "🔧 下一步:"
echo "   1. 檢查 $OUTPUT_FILE 檔案內容"
echo "   2. 在專案中匯入 JSON 資料"
echo "   3. 在網頁上顯示影片列表"
echo ""
echo "💡 提示:"
echo "   - 可以定期執行此腳本來更新影片資料"
echo "   - 調整精選閾值來改變精選影片的標準"
echo "   - 修改頻道類型來改變自動分類邏輯"