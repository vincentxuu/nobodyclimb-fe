#!/bin/bash

# 測試抓取單一 YouTube 影片元數據
# 使用方式: ./fetch-video-metadata.sh [VIDEO_URL]

VIDEO_URL="${1:-https://www.youtube.com/watch?v=f_SDlBGYcWo}"

echo "測試影片: $VIDEO_URL"
echo ""

yt-dlp --dump-json --skip-download "$VIDEO_URL" 2>/dev/null | python3 -c "
import sys, json
d = json.loads(sys.stdin.read())
print('=== 影片元數據 ===')
print('標題:', d.get('title'))
print('頻道:', d.get('uploader'))
print('上傳日期:', d.get('upload_date'))
print('時間戳:', d.get('timestamp'))
print('時長:', d.get('duration'), '秒')
print('觀看數:', d.get('view_count'))
print('影片ID:', d.get('id'))
"
