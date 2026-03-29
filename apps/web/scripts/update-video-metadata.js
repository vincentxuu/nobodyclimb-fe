#!/usr/bin/env node
/**
 * 頻道影片元數據更新腳本
 *
 * 補抓 videos.json 中缺少的元數據（uploadDate, likeCount, tags 等）
 * 支援斷點續傳：只會更新缺少資料的影片
 * 支援分批處理：適合在 GitHub Actions 中分批執行
 *
 * 使用方式：
 *   cd apps/web
 *   node scripts/update-video-metadata.js
 *
 * 選項：
 *   --dry-run      只顯示統計，不實際抓取
 *   --force        強制重新抓取所有影片
 *   --limit N      只抓取 N 個影片
 *   --offset N     跳過前 N 個影片（搭配 --force 分批更新）
 *   --newest-first 按發布日期排序（新→舊），優先更新最新影片
 *   --batch N      分批處理，每批 N 個（預設 200）
 *   --regenerate   更新後重新生成 chunks
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// 路徑設定
const VIDEOS_FILE = path.join(__dirname, '../public/data/videos.json')

// 解析命令列參數
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const isForce = args.includes('--force')
const shouldRegenerate = args.includes('--regenerate')
const retryFailed = args.includes('--retry-failed')
const isNewestFirst = args.includes('--newest-first')
const limitIndex = args.indexOf('--limit')
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null
const offsetIndex = args.indexOf('--offset')
const offset = offsetIndex !== -1 ? parseInt(args[offsetIndex + 1], 10) : 0
const batchIndex = args.indexOf('--batch')
const batchSize = batchIndex !== -1 ? parseInt(args[batchIndex + 1], 10) : 200

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
 * 格式化數量（觀看數、按讚數等）
 */
function formatCount(count) {
  if (!count) return '0'
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M'
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K'
  }
  return count.toString()
}

/**
 * 使用 yt-dlp 抓取單個影片的元數據
 */
function fetchVideoMetadata(youtubeId) {
  const url = `https://www.youtube.com/watch?v=${youtubeId}`

  try {
    const result = execSync(`yt-dlp --dump-json --skip-download --no-warnings "${url}"`, {
      encoding: 'utf8',
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    const data = JSON.parse(result)

    return {
      publishedAt: formatUploadDate(data.upload_date),
      likeCount: formatCount(data.like_count),
      viewCount: formatCount(data.view_count),
      tags: data.tags || [],
      categories: data.categories || [],
    }
  } catch (error) {
    const stderr = error.stderr || ''

    if (
      stderr.includes('Video unavailable') ||
      stderr.includes('Private video') ||
      stderr.includes('This video has been removed')
    ) {
      return { error: 'unavailable' }
    }

    console.error(`  ❌ 抓取失敗: ${youtubeId} - ${error.message}`)
    return null
  }
}

/**
 * 頻道分類映射
 * 特定頻道的影片直接歸類
 */
const CHANNEL_CATEGORY_MAP = {
  // 賽事頻道
  '@JMACompetitionTV': '賽事',
  '@worldclimbing': '賽事',
  // 紀錄片頻道（非品牌）
  '@REELROCK1': '紀錄片',
}

/**
 * 品牌頻道列表（用於識別廣告）
 */
const BRAND_CHANNELS = [
  '@arcteryx',
  '@TheNorthFace',
  '@patagonia',
  '@blackdiamondequipment',
  '@paborern',
  '@Petzl',
  '@LaSportiva',
  '@Scarpa_official',
]

/**
 * 檢查是否為品牌廣告（應排除）
 * 條件：品牌頻道 + 時長 < 2 分鐘 + 標題無攀岩內容
 */
function isBrandAd(video) {
  const channelId = video.channelId || ''
  const isBrandChannel = BRAND_CHANNELS.some((ch) => ch.toLowerCase() === channelId.toLowerCase())

  if (!isBrandChannel) return false

  // 檢查時長 < 2 分鐘
  const duration = video.duration || ''
  const minutes = parseDurationMinutes(duration)
  if (minutes >= 2) return false

  // 檢查標題是否有攀岩內容關鍵字
  const title = (video.title || '').toLowerCase()
  const climbingContentKeywords = [
    'climb',
    'boulder',
    'ascent',
    'route',
    'crag',
    'summit',
    'expedition',
    'athlete',
    'pro climber',
  ]
  const hasClimbingContent = climbingContentKeywords.some((kw) => title.includes(kw))

  // 品牌頻道 + 短片 + 無攀岩內容 = 廣告
  return !hasClimbingContent
}

/**
 * 檢查是否為非攀岩內容（應排除）
 * 用於過濾攀岩頻道中的非攀岩影片
 */
function isNonClimbingContent(video) {
  const title = (video.title || '').toLowerCase()
  const tags = (video.tags || []).map((t) => t.toLowerCase())
  const allText = [...tags, title].join(' ')

  // 攀岩相關關鍵字
  const climbingKeywords = [
    'climb',
    'boulder',
    'crag',
    'route',
    'ascent',
    'rope',
    'belay',
    'harness',
    'carabiner',
    'gym',
    'wall',
    'v[0-9]',
    '5\\.',
    'font',
    'grade',
    'send',
    'flash',
    'onsight',
    'crimp',
    'pinch',
    'sloper',
    'jug',
    'hold',
    'dyno',
    'campus',
    'fingerboard',
    'hangboard',
  ]

  // 檢查是否有任何攀岩相關內容
  const hasClimbingContent = climbingKeywords.some((kw) => {
    if (kw.includes('[') || kw.includes('\\.')) {
      return new RegExp(kw, 'i').test(allText)
    }
    return allText.includes(kw)
  })

  // 非攀岩內容的明確指標
  const nonClimbingPatterns = [
    /\b(legion|military|army|navy|air force)\b(?!.*climb)/i,
    /\b(cave|caving|spelunk)\b(?!.*climb)/i,
  ]
  const isExplicitlyNonClimbing = nonClimbingPatterns.some((p) => p.test(title))

  return !hasClimbingContent && isExplicitlyNonClimbing
}

/**
 * 根據 tags 和標題分類影片
 * 頻道都是攀岩相關，所以直接進行細分類
 */
function categorizeByTags(video) {
  const channelId = video.channelId || ''
  const tags = (video.tags || []).map((t) => t.toLowerCase())
  const title = (video.title || '').toLowerCase()
  const description = (video.description || '').toLowerCase()
  const allText = [...tags, title, description].join(' ')

  // === 0. 根據頻道直接分類 ===
  if (CHANNEL_CATEGORY_MAP[channelId]) {
    return CHANNEL_CATEGORY_MAP[channelId]
  }

  // === 1. 賽事（攀岩比賽）- 只看標題，避免 tags 誤判 ===
  const competitionTitlePatterns = [
    /\bifsc\b/i,
    /world cup/i,
    /world championship/i,
    /olympics.*climb|climb.*olympics/i,
    /\b(boulder|lead|speed)\s*(finals?|semi-?finals?|qualifiers?)\b/i,
    /climbing\s*(competition|championship)/i,
  ]
  if (competitionTitlePatterns.some((pattern) => pattern.test(video.title || ''))) {
    return '賽事'
  }

  // === 2. 挑戰影片（強人 vs 攀岩、名人挑戰等）===
  const challengePatterns = [
    /vs\.?\s*(rock|climb|boulder)/i,
    /strongman|strongest\s+man|arm\s*wrestler|bodybuilder|powerlifter/i,
    /beginner\s+vs|pro\s+vs|pretends\s+to\s+be|sneaks\s+into/i,
    /pro\s+(climber|athlete).*beginner|sign\s+up.*beginner/i,
    /(military|soldier|marine|special\s+forces).*(climb|boulder|gym)/i,
    /(climb|boulder|gym).*(military|soldier|marine|special\s+forces)/i,
    /random.*climb|stranger.*climb/i,
    /challenging\s+(random|strangers?|people)/i, // "Challenging random people..."
    /reacting\s+to|girlfriend\s+react|boyfriend\s+react/i,
    /world.?s\s+(best|strongest).*(arm|wrestler|strongman|grip)/i,
    /destroyed\s+by|humiliated\s+by|schooled\s+by/i,
  ]
  if (challengePatterns.some((pattern) => pattern.test(video.title || ''))) {
    return '挑戰影片'
  }

  // === 3. 訪談 ===
  const interviewKeywords = [
    'interview',
    'podcast',
    'q&a',
    'talks with',
    'conversation with',
    'chatting with',
  ]
  if (
    interviewKeywords.some((kw) => allText.includes(kw)) ||
    (title.includes('with') && tags.some((t) => t.includes('interview')))
  ) {
    return '訪談'
  }

  // === 4. 裝備評測 ===
  const gearKeywords = [
    'gear',
    'equipment',
    'shoe',
    'shoes',
    'harness',
    'rope',
    'carabiner',
    'quickdraw',
    'chalk',
    'crash pad',
    'review',
    'unboxing',
    'test',
  ]
  if (
    gearKeywords.some((kw) => tags.includes(kw)) ||
    ((title.includes('review') || title.includes('test')) && !title.includes('strength'))
  ) {
    return '裝備評測'
  }

  // === 5. 訓練 ===
  const trainingKeywords = [
    'training',
    'workout',
    'exercise',
    'fingerboard',
    'hangboard',
    'campus board',
    'conditioning',
    'warm up',
    'warmup',
    'finger strength',
  ]
  if (trainingKeywords.some((kw) => allText.includes(kw))) {
    return '訓練'
  }
  // 標題中明確的訓練相關
  if (/\b(pull\s*up|pullup|strength\s+training)\b/i.test(video.title || '')) {
    return '訓練'
  }

  // === 6. 教學影片 ===
  const tutorialKeywords = [
    'tutorial',
    'technique',
    'how to',
    'tips',
    'lesson',
    'learn to climb',
    'basics',
    'fundamentals',
    'guide',
    'explained',
  ]
  if (tutorialKeywords.some((kw) => allText.includes(kw))) {
    return '教學影片'
  }
  // 標題明確包含 beginner 且是教學性質
  if (/beginner.*(guide|tutorial|tips|learn)/i.test(video.title || '')) {
    return '教學影片'
  }

  // === 7. 紀錄片 ===
  const docKeywords = [
    'documentary',
    'the story of',
    'the dawn wall',
    'free solo',
    'silence 9c',
    'first ascent',
    'full film',
    'full movie',
  ]
  if (docKeywords.some((kw) => allText.includes(kw))) {
    return '紀錄片'
  }

  // === 8. 抱石 vs 上攀判斷 ===
  const isBouldering =
    tags.some((t) => ['boulder', 'bouldering'].includes(t)) ||
    /boulder|bouldering|\bv([0-9]|1[0-7])\b|font\s*[0-9]/i.test(title)

  const isLeadClimbing =
    tags.some((t) => ['lead', 'sport climb', 'trad', 'rope', 'multipitch'].includes(t)) ||
    /lead climb|sport climb|trad climb|rope climb|multi-?pitch|\b5\.[0-9]+[a-d]?/i.test(title)

  // === 9. 室內 vs 戶外判斷 ===
  const isIndoor =
    tags.some((t) => ['indoor', 'gym', 'climbing gym'].includes(t)) ||
    /indoor|gym|climbing gym|climbing hall/i.test(title)

  const isOutdoor =
    tags.some((t) => ['outdoor', 'crag', 'nature', 'mountain'].includes(t)) ||
    /outdoor|crag|nature|mountain|yosemite|el cap|fontainebleau|bishop|rocklands/i.test(title)

  // 根據組合返回分類
  if (isBouldering) {
    // 抱石大部分是室內，除非有明確戶外指標
    return isOutdoor ? '戶外抱石' : '室內抱石'
  }

  if (isLeadClimbing) {
    // 上攀大部分是戶外，除非有明確室內指標
    return isIndoor ? '室內上攀' : '戶外上攀'
  }

  // 只有場地資訊
  if (isIndoor) {
    return '室內抱石' // 室內預設抱石（較常見）
  }

  if (isOutdoor) {
    return '戶外上攀' // 戶外預設上攀
  }

  // 預設：根據影片長度猜測
  const duration = video.duration || ''
  const minutes = parseDurationMinutes(duration)
  if (minutes >= 15) {
    return '紀錄片' // 長影片可能是紀錄片
  }

  return '室內抱石' // 最終預設
}

/**
 * 解析影片時長為分鐘數
 */
function parseDurationMinutes(duration) {
  if (!duration) return 0
  const parts = duration.split(':').map(Number)
  if (parts.length === 3) {
    return parts[0] * 60 + parts[1] + parts[2] / 60
  } else if (parts.length === 2) {
    return parts[0] + parts[1] / 60
  }
  return 0
}

/**
 * 檢查影片是否需要更新
 */
function needsUpdate(video, options = {}) {
  // 如果已標記為已抓取，跳過（即使沒有 tags）
  if (video.metadataFetched === true) {
    return false
  }

  // 如果標記為抓取失敗
  if (video.fetchError) {
    // 只有在 --retry-failed 時才重試
    return options.retryFailed === true
  }

  // 向下相容：如果有 tags 陣列且不為空，也視為已抓取
  if (video.tags && video.tags.length > 0) {
    return false
  }

  // 檢查 publishedAt 是否是有效日期（不是今天或預設值）
  const today = new Date().toISOString().split('T')[0]
  const hasValidDate =
    video.publishedAt && video.publishedAt !== today && video.publishedAt !== '1970-01-01'

  // 檢查 likeCount 是否存在且不是 '0'
  const hasLikeCount = video.likeCount && video.likeCount !== '0'

  return !hasValidDate || !hasLikeCount
}

/**
 * 主程式
 */
async function main() {
  // 1. 讀取現有影片資料
  if (!fs.existsSync(VIDEOS_FILE)) {
    console.error(`❌ 找不到檔案: ${VIDEOS_FILE}`)
    process.exit(1)
  }

  const videos = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf8'))

  // 2. 找出需要更新的影片
  const videosToUpdate = isForce ? videos : videos.filter((v) => needsUpdate(v, { retryFailed }))

  // 按日期排序（新→舊）
  if (isNewestFirst) {
    videosToUpdate.sort((a, b) => {
      const dateA = a.publishedAt || '1970-01-01'
      const dateB = b.publishedAt || '1970-01-01'
      return dateB.localeCompare(dateA)
    })
  }

  if (isDryRun) {
    return
  }

  if (videosToUpdate.length === 0) {
    return
  }

  // 3. 抓取缺失的元數據（使用 offset + limit）
  const fetchLimit = limit || (process.env.GITHUB_ACTIONS ? batchSize : null)
  const toFetch = fetchLimit
    ? videosToUpdate.slice(offset, offset + fetchLimit)
    : videosToUpdate.slice(offset)

  if (offset > 0) {
  }

  let successCount = 0
  let _failCount = 0
  let _unavailableCount = 0

  // 建立 youtubeId 到 video 的映射
  const videoMap = new Map(videos.map((v) => [v.youtubeId, v]))

  for (let i = 0; i < toFetch.length; i++) {
    const video = toFetch[i]
    const progress = `[${i + 1}/${toFetch.length}]`

    process.stdout.write(
      `${progress} 更新 ${video.youtubeId} (${video.title.substring(0, 30)}...)...`
    )

    const result = fetchVideoMetadata(video.youtubeId)

    if (result === null) {
      _failCount++
      // 標記失敗，下次跳過
      const existingVideo = videoMap.get(video.youtubeId)
      if (existingVideo) {
        existingVideo.fetchError = true
      }
    } else if (result.error === 'unavailable') {
      _unavailableCount++
      // 標記不可用
      const existingVideo = videoMap.get(video.youtubeId)
      if (existingVideo) {
        existingVideo.fetchError = 'unavailable'
      }
    } else {
      successCount++
      // 更新影片資料
      const existingVideo = videoMap.get(video.youtubeId)
      if (existingVideo) {
        existingVideo.publishedAt = result.publishedAt || existingVideo.publishedAt
        existingVideo.likeCount = result.likeCount
        existingVideo.viewCount = result.viewCount
        existingVideo.tags = result.tags
        existingVideo.metadataFetched = true // 標記已抓取
        delete existingVideo.fetchError // 清除失敗標記
        // 根據 tags 重新分類
        const newCategory = categorizeByTags({ ...existingVideo, tags: result.tags })
        const oldCategory = existingVideo.category
        existingVideo.category = newCategory
        const _categoryChanged =
          oldCategory !== newCategory ? ` (${oldCategory} → ${newCategory})` : ''

        // 檢查是否應排除
        const isAd = isBrandAd(existingVideo)
        const isNonClimbing = isNonClimbingContent(existingVideo)

        if (isAd) {
          existingVideo.excluded = true
        } else if (isNonClimbing) {
          existingVideo.excluded = true
        } else {
          delete existingVideo.excluded
        }
      }
    }

    // 每 20 個影片儲存一次（防止中斷時遺失）
    if ((i + 1) % 20 === 0) {
      fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2))
    }

    // 加入延遲避免被封鎖（GitHub Actions 環境用較長延遲）
    if (i < toFetch.length - 1) {
      const delay = process.env.GITHUB_ACTIONS ? 2000 : 500
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // 4. 儲存最終結果
  fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2))

  // 5. 重新生成 chunks（如果指定）
  if (shouldRegenerate && successCount > 0) {
    try {
      const { generateVideoChunks } = require('./generate-video-chunks')
      generateVideoChunks()
    } catch (error) {
      console.error('❌ 生成 chunks 失敗:', error.message)
    }
  }

  // 輸出 GitHub Actions 需要的資訊
  if (process.env.GITHUB_ACTIONS) {
    const _remaining = videosToUpdate.length - toFetch.length
  }
}

main().catch((error) => {
  console.error('❌ 執行失敗:', error)
  process.exit(1)
})
