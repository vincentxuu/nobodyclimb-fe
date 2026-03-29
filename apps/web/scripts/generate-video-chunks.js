const fs = require('fs')
const path = require('path')
const { normalizeChannelName } = require('./utils')

/**
 * 生成影片分塊資料
 *
 * 將 videos.json 分割成多個 chunks 以提升前端載入效能
 * 同時生成 videos-meta.json 和 featured-videos.json
 */

const PUBLIC_DATA_DIR = path.join(__dirname, '../public/data')
const VIDEOS_FILE = path.join(PUBLIC_DATA_DIR, 'videos.json')
const META_FILE = path.join(PUBLIC_DATA_DIR, 'videos-meta.json')
const FEATURED_FILE = path.join(PUBLIC_DATA_DIR, 'featured-videos.json')
const CHANNEL_INDEX_FILE = path.join(PUBLIC_DATA_DIR, 'channel-index.json')
const CHUNKS_DIR = path.join(PUBLIC_DATA_DIR, 'videos-chunks')

// 每個 chunk 的影片數量
const CHUNK_SIZE = 500

/**
 * 將完整影片資料轉換為列表所需的精簡格式
 */
function toListItem(video) {
  const item = {
    id: video.id,
    youtubeId: video.youtubeId,
    title: video.title,
    thumbnailUrl: video.thumbnailUrl,
    channel: normalizeChannelName(video.channel),
    duration: video.duration,
    viewCount: video.viewCount,
    category: video.category,
  }
  // 只有被排除的影片才加入 excluded 欄位
  if (video.excluded) {
    item.excluded = true
  }
  // 只有有 tags 的影片才加入 tags 欄位
  if (video.tags && video.tags.length > 0) {
    item.tags = video.tags
  }
  return item
}

/**
 * 主要執行函數
 */
function generateVideoChunks() {
  // 檢查來源檔案是否存在
  if (!fs.existsSync(VIDEOS_FILE)) {
    console.error(`❌ 來源檔案不存在: ${VIDEOS_FILE}`)
    console.error('   請先執行 ./scripts/update-videos.sh 收集影片資料')
    process.exit(1)
  }

  const videosContent = fs.readFileSync(VIDEOS_FILE, 'utf8')
  const videos = JSON.parse(videosContent)

  // 確保 chunks 目錄存在
  if (!fs.existsSync(CHUNKS_DIR)) {
    fs.mkdirSync(CHUNKS_DIR, { recursive: true })
  } else {
    // 清空舊的 chunk 檔案
    const oldFiles = fs.readdirSync(CHUNKS_DIR)
    for (const file of oldFiles) {
      fs.unlinkSync(path.join(CHUNKS_DIR, file))
    }
  }

  const totalChunks = Math.ceil(videos.length / CHUNK_SIZE)
  const channelChunkMap = {} // 記錄每個頻道在哪些 chunks 中

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, videos.length)
    const chunk = videos.slice(start, end).map(toListItem)

    // 記錄該 chunk 中每個頻道的出現
    chunk.forEach((video) => {
      if (!channelChunkMap[video.channel]) {
        channelChunkMap[video.channel] = { chunks: new Set(), count: 0 }
      }
      channelChunkMap[video.channel].chunks.add(i)
      channelChunkMap[video.channel].count++
    })

    const chunkFile = path.join(CHUNKS_DIR, `videos-${i}.json`)
    fs.writeFileSync(chunkFile, JSON.stringify(chunk))
  }

  // 收集所有頻道名稱（正規化後）
  const channelsSet = new Set(videos.map((v) => normalizeChannelName(v.channel)))
  const channels = [...channelsSet].sort()

  const meta = {
    totalVideos: videos.length,
    chunkSize: CHUNK_SIZE,
    totalChunks: totalChunks,
    channels: channels,
  }

  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2))

  const channelIndex = {}
  Object.keys(channelChunkMap)
    .sort()
    .forEach((channel) => {
      channelIndex[channel] = {
        chunks: Array.from(channelChunkMap[channel].chunks).sort((a, b) => a - b),
        count: channelChunkMap[channel].count,
      }
    })
  fs.writeFileSync(CHANNEL_INDEX_FILE, JSON.stringify(channelIndex, null, 2))

  const featuredVideos = videos.filter((v) => v.featured === true)
  fs.writeFileSync(FEATURED_FILE, JSON.stringify(featuredVideos, null, 2))

  return {
    totalVideos: videos.length,
    totalChunks,
    channels: channels.length,
    featuredCount: featuredVideos.length,
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  try {
    generateVideoChunks()
  } catch (error) {
    console.error('❌ 生成失敗:', error.message)
    process.exit(1)
  }
}

module.exports = { generateVideoChunks, CHUNK_SIZE }
