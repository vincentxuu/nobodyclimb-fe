const fs = require('fs')
const path = require('path')

/**
 * 合併多個頻道的影片資料到統一的 videos.ts 檔案
 */
function mergeVideoSources() {
  // 自動掃描 public/data/ 目錄中所有 *_videos.json 檔案
  const publicDataDir = 'public/data'
  const sourceFiles = []

  // 掃描目錄中的檔案
  if (fs.existsSync(publicDataDir)) {
    const files = fs.readdirSync(publicDataDir)
    for (const file of files) {
      // 匹配 *_videos.json 格式，但排除 videos.json（目標檔案）
      if (file.endsWith('_videos.json') && file !== 'videos.json') {
        sourceFiles.push(path.join(publicDataDir, file))
      }
    }
  }

  const outputFile = 'public/data/videos.json'
  let allVideos = []
  let idCounter = 1

  // 讀取每個來源檔案
  for (const sourceFile of sourceFiles) {
    if (fs.existsSync(sourceFile)) {
      try {
        // 直接讀取 JSON 檔案
        const content = fs.readFileSync(sourceFile, 'utf8')
        const videoData = JSON.parse(content)

        // 重新分配 ID 以避免衝突
        const processedVideos = videoData.map((video) => ({
          ...video,
          id: (idCounter++).toString(),
        }))

        allVideos.push(...processedVideos)
      } catch (error) {
        console.error(`❌ 讀取 ${sourceFile} 時發生錯誤:`, error.message)
      }
    } else {
    }
  }

  if (allVideos.length === 0) {
    console.error('❌ 沒有找到任何影片資料')
    return
  }

  // 解析觀看次數
  const parseViewCount = (viewCount) => {
    if (typeof viewCount === 'string') {
      if (viewCount.includes('M')) {
        return parseFloat(viewCount) * 1000000
      }
      if (viewCount.includes('K')) {
        return parseFloat(viewCount) * 1000
      }
      return parseInt(viewCount) || 0
    }
    return viewCount || 0
  }

  // 頻道交錯排序：避免同一頻道霸榜，保持多樣性
  // 1. 分離精選和非精選影片
  const featuredVideos = allVideos.filter((v) => v.featured)
  const regularVideos = allVideos.filter((v) => !v.featured)

  // 2. 精選影片按觀看次數排序
  featuredVideos.sort((a, b) => parseViewCount(b.viewCount) - parseViewCount(a.viewCount))

  // 3. 非精選影片按頻道分組，每組內按觀看次數排序
  const channelGroups = {}
  for (const video of regularVideos) {
    const channel = video.channel
    if (!channelGroups[channel]) {
      channelGroups[channel] = []
    }
    channelGroups[channel].push(video)
  }

  // 每個頻道內按觀看次數排序
  for (const channel of Object.keys(channelGroups)) {
    channelGroups[channel].sort((a, b) => parseViewCount(b.viewCount) - parseViewCount(a.viewCount))
  }

  // 4. 頻道交錯取出：每輪從每個頻道取一部
  const interleavedVideos = []
  const channelNames = Object.keys(channelGroups)
  let round = 0
  let hasMore = true

  while (hasMore) {
    hasMore = false
    for (const channel of channelNames) {
      if (channelGroups[channel].length > round) {
        interleavedVideos.push(channelGroups[channel][round])
        hasMore = true
      }
    }
    round++
  }

  // 5. 合併：精選在前，交錯排序的在後
  allVideos = [...featuredVideos, ...interleavedVideos]

  // 生成統計資訊
  const _channels = [...new Set(allVideos.map((v) => v.channel))]
  const _categories = [...new Set(allVideos.map((v) => v.category))]
  const _featuredCount = allVideos.filter((v) => v.featured).length

  // 直接寫入 JSON 格式
  fs.writeFileSync(outputFile, JSON.stringify(allVideos, null, 2))

  let _deletedCount = 0
  for (const sourceFile of sourceFiles) {
    try {
      if (fs.existsSync(sourceFile)) {
        fs.unlinkSync(sourceFile)

        _deletedCount++
      }
    } catch (_error) {}
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  try {
    mergeVideoSources()
  } catch (error) {
    console.error('❌ 合併失敗:', error.message)
    process.exit(1)
  }
}

module.exports = { mergeVideoSources }
