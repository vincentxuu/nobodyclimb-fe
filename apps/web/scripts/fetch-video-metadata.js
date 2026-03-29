/**
 * 路線影片元數據抓取腳本
 *
 * 從所有岩場 JSON 中提取 YouTube URL，使用 yt-dlp 抓取元數據。
 * 支援斷點續傳：如果 video-metadata.json 已存在，只會抓取缺失的影片。
 *
 * 使用方式：
 *   cd apps/web
 *   node scripts/fetch-video-metadata.js
 *
 * 選項：
 *   --dry-run    只顯示統計，不實際抓取
 *   --force      強制重新抓取所有影片
 *   --limit N    只抓取前 N 個缺失的影片（用於測試）
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// 路徑設定
const CRAGS_DIR = path.join(__dirname, '../src/data/crags')
const OUTPUT_FILE = path.join(__dirname, '../public/data/video-metadata.json')

// 解析命令列參數
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const isForce = args.includes('--force')
const limitIndex = args.indexOf('--limit')
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null

/**
 * 從 YouTube URL 解析出影片 ID
 * 支援格式：
 *   - https://www.youtube.com/watch?v=xxx
 *   - https://youtu.be/xxx
 *   - https://www.youtube.com/embed/xxx
 */
function extractYoutubeId(url) {
  if (!url) return null

  // 標準格式 ?v=xxx
  const vMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (vMatch) return vMatch[1]

  // 短網址 youtu.be/xxx
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return shortMatch[1]

  // embed 格式 /embed/xxx
  const embedMatch = url.match(/\/embed\/([a-zA-Z0-9_-]{11})/)
  if (embedMatch) return embedMatch[1]

  return null
}

/**
 * 從岩場 JSON 檔案中提取所有 YouTube URL
 */
function extractUrlsFromCragFile(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const urls = []

  if (data.routes && Array.isArray(data.routes)) {
    for (const route of data.routes) {
      if (route.youtubeVideos && Array.isArray(route.youtubeVideos)) {
        urls.push(...route.youtubeVideos)
      }
    }
  }

  return urls
}

/**
 * 使用 yt-dlp 抓取單個影片的元數據
 */
function fetchVideoMetadata(youtubeId) {
  const url = `https://www.youtube.com/watch?v=${youtubeId}`

  try {
    // 使用 yt-dlp 抓取元數據（不下載影片）
    const result = execSync(`yt-dlp --dump-json --no-download "${url}"`, {
      encoding: 'utf8',
      timeout: 30000, // 30 秒超時
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    const data = JSON.parse(result)

    return {
      title: data.title || '',
      channel: data.uploader || data.channel || '',
      channelId: data.uploader_id || data.channel_id || '',
      uploadDate: formatUploadDate(data.upload_date),
      duration: data.duration || 0,
      viewCount: data.view_count || 0,
      thumbnailUrl: data.thumbnail || `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    }
  } catch (error) {
    const stderr = error.stderr || ''

    // 檢查是否是影片不可用
    if (
      stderr.includes('Video unavailable') ||
      stderr.includes('Private video') ||
      stderr.includes('This video has been removed')
    ) {
      return {
        error: 'unavailable',
        message: 'Video unavailable or private',
      }
    }

    // 檢查是否是年齡限制
    if (stderr.includes('Sign in to confirm your age')) {
      return {
        error: 'age_restricted',
        message: 'Age-restricted video',
        thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      }
    }

    // 其他錯誤
    console.error(`  ❌ 抓取失敗: ${youtubeId} - ${error.message}`)
    return null
  }
}

/**
 * 格式化上傳日期（YYYYMMDD -> YYYY-MM-DD）
 */
function formatUploadDate(dateString) {
  if (!dateString) return null

  if (typeof dateString === 'string' && dateString.length === 8) {
    return `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`
  }

  return dateString
}

/**
 * 載入現有的元數據檔案
 */
function loadExistingMetadata() {
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'))
    } catch (_error) {
      console.warn('⚠️ 無法讀取現有元數據檔案，將重新建立')
      return {}
    }
  }
  return {}
}

/**
 * 儲存元數據到檔案
 */
function saveMetadata(metadata) {
  const outputDir = path.dirname(OUTPUT_FILE)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(metadata, null, 2))
}

/**
 * 主程式
 */
async function main() {
  // 1. 收集所有岩場檔案
  const cragFiles = fs
    .readdirSync(CRAGS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(CRAGS_DIR, f))

  // 2. 從所有岩場中提取 YouTube URL
  const allUrls = []
  const cragStats = {}

  for (const filePath of cragFiles) {
    const cragName = path.basename(filePath, '.json')
    const urls = extractUrlsFromCragFile(filePath)
    allUrls.push(...urls)
    cragStats[cragName] = urls.length
  }

  // 3. 解析並去重 YouTube ID
  const uniqueIds = new Set()
  for (const url of allUrls) {
    const id = extractYoutubeId(url)
    if (id) {
      uniqueIds.add(id)
    } else {
      console.warn(`⚠️ 無法解析 URL: ${url}`)
    }
  }

  // 4. 載入現有元數據
  const existingMetadata = isForce ? {} : loadExistingMetadata()
  const existingCount = Object.keys(existingMetadata).length

  if (existingCount > 0 && !isForce) {
  }

  // 5. 找出缺失的影片
  const missingIds = [...uniqueIds].filter((id) => !existingMetadata[id])

  if (isDryRun) {
    return
  }

  if (missingIds.length === 0) {
    return
  }

  // 6. 抓取缺失的元數據
  const toFetch = limit ? missingIds.slice(0, limit) : missingIds

  const metadata = { ...existingMetadata }
  let _successCount = 0
  let _failCount = 0
  let _unavailableCount = 0
  let _ageRestrictedCount = 0

  for (let i = 0; i < toFetch.length; i++) {
    const id = toFetch[i]
    const progress = `[${i + 1}/${toFetch.length}]`

    process.stdout.write(`${progress} 抓取 ${id}...`)

    const result = fetchVideoMetadata(id)

    if (result === null) {
      _failCount++
    } else if (result.error === 'unavailable') {
      _unavailableCount++
      metadata[id] = { error: 'unavailable' }
    } else if (result.error === 'age_restricted') {
      _ageRestrictedCount++
      metadata[id] = result
    } else {
      _successCount++
      metadata[id] = result
    }

    // 每 10 個影片儲存一次（防止中斷時遺失）
    if ((i + 1) % 10 === 0) {
      saveMetadata(metadata)
    }

    // 加入延遲避免被封鎖
    if (i < toFetch.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  // 7. 儲存最終結果
  saveMetadata(metadata)
}

main().catch((error) => {
  console.error('❌ 執行失敗:', error)
  process.exit(1)
})
