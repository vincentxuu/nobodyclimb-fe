# YouTube 數據下載與轉換完整計畫

## 概述
本文件提供完整的 YouTube 頻道數據收集、處理與轉換流程，可用於收集任何 YouTube 頻道的影片資訊並將其轉換為專案所需的格式。

## 完整工作流程

### 階段一：數據收集
使用 yt-dlp 工具收集 YouTube 頻道的原始數據

### 階段二：數據轉換
使用 Node.js 腳本將原始數據轉換為專案所需的 TypeScript 格式

### 階段三：整合與驗證
將轉換後的數據整合到專案中並進行驗證

## 必要工具安裝

### 安裝 yt-dlp
```bash
# macOS (使用 Homebrew)
brew install yt-dlp

# 或使用 pip
pip install yt-dlp

# Windows (使用 pip)
pip install yt-dlp
```

### 安裝 Node.js 依賴
```bash
npm install
```

## 完整執行流程

### 步驟 1: 收集 YouTube 數據

#### 方法 A: 收集平面數據（推薦用於快速處理）
```bash
# 獲取頻道影片列表的基本資訊
yt-dlp --dump-json --flat-playlist "https://www.youtube.com/@[CHANNEL_NAME]/videos" > videos_flat.json
```

#### 方法 B: 收集詳細數據（包含完整統計資訊）
```bash
# 獲取每個影片的詳細資訊（包含觀看次數、時長等）
yt-dlp --dump-json "https://www.youtube.com/@[CHANNEL_NAME]/videos" > videos_detailed.json
```

#### 實際範例（以 Mellow Climbing 為例）
```bash
# 收集 Mellow Climbing 頻道的影片資訊
yt-dlp --dump-json --flat-playlist "https://www.youtube.com/@mellowclimbing/videos" > mellow_videos_flat.json

# 或收集詳細資訊（需要較長時間）
yt-dlp --dump-json "https://www.youtube.com/@mellowclimbing/videos" > mellow_videos_detailed.json
```

### 步驟 2: 建立轉換腳本

建立 `scripts/convert-youtube-videos.js` 腳本：

```javascript
const fs = require('fs');

function convertYouTubeToVideoType(inputFile, outputFile, channelInfo = {}) {
  // Read the YouTube videos JSON file (NDJSON format)
  const fileContent = fs.readFileSync(inputFile, 'utf8');
  const videoData = fileContent.trim().split('\n').map(line => JSON.parse(line));
  
  // Function to format duration from seconds to MM:SS or HH:MM:SS
  function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }
  
  // Function to determine duration category
  function getDurationCategory(seconds) {
    if (!seconds) return 'short';
    if (seconds < 300) return 'short'; // < 5 minutes
    if (seconds <= 1200) return 'medium'; // 5-20 minutes
    return 'long'; // > 20 minutes
  }
  
  // Function to format view count
  function formatViewCount(count) {
    if (!count) return '0';
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }
  
  // Function to categorize videos based on title/description
  function categorizeVideo(title, description = '') {
    const content = (title + ' ' + description).toLowerCase();
    
    if (content.includes('competition') || content.includes('world cup') || content.includes('championship')) {
      return '競技攀岩';
    }
    if (content.includes('indoor') || content.includes('gym') || content.includes('boulder') && content.includes('gym')) {
      return '室內攀岩';
    }
    if (content.includes('gear') || content.includes('review') || content.includes('equipment')) {
      return '裝備評測';
    }
    if (content.includes('tutorial') || content.includes('how to') || content.includes('technique') || content.includes('training')) {
      return '教學影片';
    }
    if (content.includes('documentary') || content.includes('story') || content.includes('film')) {
      return '紀錄片';
    }
    
    // Default to outdoor climbing
    return '戶外攀岩';
  }
  
  // Function to format upload date
  function formatUploadDate(dateString) {
    if (!dateString) return new Date().toISOString().split('T')[0];
    
    // Handle YYYYMMDD format from yt-dlp
    if (typeof dateString === 'string' && dateString.length === 8) {
      return `${dateString.substring(0,4)}-${dateString.substring(4,6)}-${dateString.substring(6,8)}`;
    }
    
    // Handle ISO date string
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    
    return dateString;
  }
  
  // Convert each video
  const convertedVideos = videoData.map((video, index) => {
    const duration = formatDuration(video.duration);
    const durationCategory = getDurationCategory(video.duration);
    const viewCount = formatViewCount(video.view_count);
    const category = categorizeVideo(video.title, video.description || '');
    
    // Get best thumbnail (highest resolution available)
    const bestThumbnail = video.thumbnails && video.thumbnails.length > 0
      ? video.thumbnails[video.thumbnails.length - 1].url
      : `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`;
    
    return {
      id: (index + 1).toString(),
      youtubeId: video.id,
      title: video.title,
      description: video.description || '',
      thumbnailUrl: bestThumbnail,
      channel: video.uploader || video.playlist_uploader || channelInfo.name || 'YouTube Channel',
      channelId: video.uploader_id || video.playlist_uploader_id || channelInfo.id || '@channel',
      publishedAt: formatUploadDate(video.upload_date),
      duration: duration,
      durationCategory: durationCategory,
      viewCount: viewCount,
      category: category,
      tags: video.tags || [],
      featured: (video.view_count || 0) > 50000 // Mark high-view videos as featured
    };
  });
  
  // Generate TypeScript content
  const tsContent = `import type { Video } from '@/lib/types/video'

export const videoList: Video[] = ${JSON.stringify(convertedVideos, null, 2)}
`;
  
  // Write to output file
  fs.writeFileSync(outputFile, tsContent);
  
  console.log(`✅ 轉換完成: ${convertedVideos.length} 部影片`);
  console.log(`📁 輸出檔案: ${outputFile}`);
  console.log(`📊 分類統計:`, [...new Set(convertedVideos.map(v => v.category))].map(cat => 
    `${cat}: ${convertedVideos.filter(v => v.category === cat).length}`
  ).join(', '));
  console.log(`⭐ 精選影片: ${convertedVideos.filter(v => v.featured).length} 部`);
  
  return convertedVideos;
}

// Command line usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('使用方法: node convert-youtube-videos.js <input_file> <output_file> [channel_name] [channel_id]');
    console.log('範例: node convert-youtube-videos.js mellow_videos_flat.json src/lib/constants/videos.ts "Mellow Climbing" "@mellowclimbing"');
    process.exit(1);
  }
  
  const [inputFile, outputFile, channelName, channelId] = args;
  const channelInfo = {
    name: channelName,
    id: channelId
  };
  
  try {
    convertYouTubeToVideoType(inputFile, outputFile, channelInfo);
  } catch (error) {
    console.error('❌ 轉換失敗:', error.message);
    process.exit(1);
  }
}

module.exports = { convertYouTubeToVideoType };
```

### 步驟 3: 執行完整流程

建立一鍵執行腳本 `scripts/collect-and-convert.sh`：

```bash
#!/bin/bash

# YouTube 頻道資料收集與轉換腳本
# 使用方法: ./collect-and-convert.sh <頻道URL> <輸出檔案名稱> [頻道名稱] [頻道ID]

set -e  # 遇到錯誤時停止執行

# 檢查參數
if [ $# -lt 2 ]; then
    echo "使用方法: $0 <頻道URL> <輸出檔案名稱> [頻道名稱] [頻道ID]"
    echo "範例: $0 'https://www.youtube.com/@mellowclimbing' mellow 'Mellow Climbing' '@mellowclimbing'"
    exit 1
fi

CHANNEL_URL=$1
OUTPUT_NAME=$2
CHANNEL_NAME=${3:-"YouTube Channel"}
CHANNEL_ID=${4:-"@channel"}

echo "🚀 開始收集 YouTube 頻道資料..."
echo "📺 頻道: $CHANNEL_URL"
echo "📝 輸出名稱: $OUTPUT_NAME"

# 步驟 1: 收集影片資料
echo ""
echo "📥 步驟 1: 收集影片資料..."
JSON_FILE="${OUTPUT_NAME}_videos.json"
yt-dlp --dump-json --flat-playlist "$CHANNEL_URL/videos" > "$JSON_FILE"

# 檢查是否成功收集到資料
if [ ! -s "$JSON_FILE" ]; then
    echo "❌ 無法收集到影片資料，請檢查頻道 URL 是否正確"
    exit 1
fi

VIDEO_COUNT=$(wc -l < "$JSON_FILE")
echo "✅ 成功收集 $VIDEO_COUNT 部影片資料"

# 步驟 2: 轉換資料格式
echo ""
echo "🔄 步驟 2: 轉換資料格式..."
OUTPUT_FILE="src/lib/constants/${OUTPUT_NAME}_videos.ts"
node scripts/convert-youtube-videos.js "$JSON_FILE" "$OUTPUT_FILE" "$CHANNEL_NAME" "$CHANNEL_ID"

# 步驟 3: 清理暫存檔
echo ""
echo "🧹 步驟 3: 清理暫存檔案..."
# rm "$JSON_FILE"  # 保留 JSON 檔案以供備用

echo ""
echo "🎉 所有步驟完成！"
echo "📂 生成的檔案:"
echo "   - JSON 原始資料: $JSON_FILE"
echo "   - TypeScript 影片資料: $OUTPUT_FILE"
echo ""
echo "🔧 下一步:"
echo "   1. 檢查 $OUTPUT_FILE 檔案內容"
echo "   2. 在專案中匯入並使用影片資料"
echo "   3. 根據需要調整分類和標籤"
```

### 步驟 4: 使用範例

#### 收集 Mellow Climbing 頻道資料
```bash
# 方法 A: 使用一鍵腳本
chmod +x scripts/collect-and-convert.sh
./scripts/collect-and-convert.sh "https://www.youtube.com/@mellowclimbing" "mellow" "Mellow Climbing" "@mellowclimbing"

# 方法 B: 分步執行
# 1. 收集資料
yt-dlp --dump-json --flat-playlist "https://www.youtube.com/@mellowclimbing/videos" > mellow_videos.json

# 2. 轉換格式
node scripts/convert-youtube-videos.js mellow_videos.json src/lib/constants/mellow_videos.ts "Mellow Climbing" "@mellowclimbing"
```

#### 收集其他頻道資料
```bash
# 範例：收集其他攀岩頻道
./scripts/collect-and-convert.sh "https://www.youtube.com/@AlexHonnold" "honnold" "Alex Honnold" "@AlexHonnold"
./scripts/collect-and-convert.sh "https://www.youtube.com/@EpicTV" "epictv" "EpicTV" "@EpicTV"
```

## 進階功能

### 自定義分類邏輯
在轉換腳本中的 `categorizeVideo` 函數可以根據不同頻道調整分類邏輯：

```javascript
function categorizeVideo(title, description = '', channelType = 'climbing') {
  const content = (title + ' ' + description).toLowerCase();
  
  if (channelType === 'climbing') {
    // 攀岩相關分類
    if (content.includes('competition') || content.includes('world cup')) {
      return '競技攀岩';
    }
    if (content.includes('boulder')) {
      return '抱石';
    }
    // ... 更多攀岩分類
  } else if (channelType === 'tech') {
    // 技術頻道分類
    if (content.includes('tutorial') || content.includes('how to')) {
      return '教學';
    }
    // ... 更多技術分類
  }
  
  return '其他';
}
```

### 批量處理多個頻道
建立 `scripts/batch-collect.js`：

```javascript
const { spawn } = require('child_process');
const fs = require('fs');

const channels = [
  {
    url: 'https://www.youtube.com/@mellowclimbing',
    name: 'mellow',
    displayName: 'Mellow Climbing',
    id: '@mellowclimbing'
  },
  {
    url: 'https://www.youtube.com/@AlexHonnold',
    name: 'honnold',
    displayName: 'Alex Honnold',
    id: '@AlexHonnold'
  }
  // 添加更多頻道...
];

async function collectAllChannels() {
  for (const channel of channels) {
    console.log(`開始處理: ${channel.displayName}`);
    
    try {
      await new Promise((resolve, reject) => {
        const process = spawn('./scripts/collect-and-convert.sh', [
          channel.url,
          channel.name,
          channel.displayName,
          channel.id
        ]);
        
        process.on('close', (code) => {
          if (code === 0) {
            console.log(`✅ ${channel.displayName} 處理完成`);
            resolve();
          } else {
            reject(new Error(`Process exited with code ${code}`));
          }
        });
      });
    } catch (error) {
      console.error(`❌ ${channel.displayName} 處理失敗:`, error.message);
    }
  }
  
  console.log('🎉 所有頻道處理完成！');
}

collectAllChannels();
```

## 資料驗證與品質檢查

### 建立驗證腳本 `scripts/validate-videos.js`
```javascript
const fs = require('fs');

function validateVideoData(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const videoData = eval(content.replace('export const videoList: Video[] = ', '').replace('import type { Video } from \'@/lib/types/video\'', ''));
  
  const issues = [];
  
  videoData.forEach((video, index) => {
    // 檢查必要欄位
    if (!video.title) issues.push(`影片 ${index + 1}: 缺少標題`);
    if (!video.youtubeId) issues.push(`影片 ${index + 1}: 缺少 YouTube ID`);
    if (!video.thumbnailUrl) issues.push(`影片 ${index + 1}: 缺少縮圖 URL`);
    
    // 檢查資料格式
    if (video.duration && !video.duration.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
      issues.push(`影片 ${index + 1}: 時長格式錯誤 "${video.duration}"`);
    }
    
    if (video.publishedAt && !video.publishedAt.match(/^\d{4}-\d{2}-\d{2}$/)) {
      issues.push(`影片 ${index + 1}: 日期格式錯誤 "${video.publishedAt}"`);
    }
  });
  
  if (issues.length === 0) {
    console.log(`✅ 驗證通過: ${videoData.length} 部影片資料正確`);
  } else {
    console.log(`❌ 發現 ${issues.length} 個問題:`);
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  return issues;
}

// 如果直接執行此腳本
if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.log('使用方法: node validate-videos.js <影片資料檔案>');
    process.exit(1);
  }
  
  validateVideoData(filePath);
}

module.exports = { validateVideoData };
```

## 疑難排解

### 常見問題與解決方案

1. **yt-dlp 下載失敗**
   ```bash
   # 更新 yt-dlp 到最新版本
   pip install --upgrade yt-dlp
   
   # 或使用不同的提取器
   yt-dlp --extractor-args "youtube:skip=hls" --dump-json "URL"
   ```

2. **JSON 解析錯誤**
   - 檢查 JSON 檔案是否完整
   - 確保沒有換行符號或特殊字符問題
   - 使用 `jq` 工具驗證 JSON 格式：
   ```bash
   # 檢查 JSON 格式
   head -1 video_data.json | jq .
   ```

3. **記憶體不足（大量影片）**
   - 分批處理影片
   - 使用串流方式讀取大型 JSON 檔案

4. **頻道 URL 無法識別**
   - 嘗試使用頻道 ID 代替用戶名
   - 檢查頻道是否公開可見

## 自動化與定期更新

### 建立 GitHub Actions 工作流程
建立 `.github/workflows/update-videos.yml`：

```yaml
name: Update Video Data

on:
  schedule:
    - cron: '0 0 * * 0'  # 每週日執行
  workflow_dispatch:  # 手動觸發

jobs:
  update-videos:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.x'
    
    - name: Install yt-dlp
      run: pip install yt-dlp
    
    - name: Update video data
      run: |
        chmod +x scripts/collect-and-convert.sh
        ./scripts/collect-and-convert.sh "https://www.youtube.com/@mellowclimbing" "mellow" "Mellow Climbing" "@mellowclimbing"
    
    - name: Validate data
      run: node scripts/validate-videos.js src/lib/constants/mellow_videos.ts
    
    - name: Create Pull Request
      uses: peter-evans/create-pull-request@v5
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        commit-message: 'chore: update video data'
        title: 'Update YouTube video data'
        body: 'Automated update of YouTube video data'
        branch: update-videos
```

## 結論

此完整計畫提供了：
- ✅ 自動化的 YouTube 數據收集
- ✅ 靈活的資料格式轉換
- ✅ 品質驗證與錯誤檢查
- ✅ 批量處理多個頻道
- ✅ 自動化部署與更新

使用此計畫可以輕鬆收集任何 YouTube 頻道的影片資訊，並將其整合到專案中使用。