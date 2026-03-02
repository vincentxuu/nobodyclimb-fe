#!/usr/bin/env node
/**
 * 路線影片搜尋腳本
 * 用路線名稱搜尋 YouTube，輸出建議影片到 CSV（可匯入 Google Sheets）
 *
 * 使用方式:
 *   node scripts/search-route-videos.js [crag-id] [--limit=5]
 *
 * 範例:
 *   node scripts/search-route-videos.js longdong
 *   node scripts/search-route-videos.js longdong --limit=3
 *
 * 輸出:
 *   output/route-videos-{crag-id}.csv  (可匯入 Google Sheets)
 *
 * 需求:
 *   - yt-dlp (brew install yt-dlp 或 pip install yt-dlp)
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// 路徑設定
const CRAGS_DIR = path.join(__dirname, '../src/data/crags')
const OUTPUT_DIR = path.join(__dirname, '../output')

// 確保輸出目錄存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

// 檢查 yt-dlp 是否安裝
function checkYtDlp() {
  try {
    execSync('yt-dlp --version', { stdio: 'pipe' })
    return true
  } catch {
    console.error('❌ yt-dlp 未安裝，請先安裝：')
    console.error('   macOS: brew install yt-dlp')
    console.error('   其他系統: pip install yt-dlp')
    return false
  }
}

// 讀取岩場資料
function readCragData(cragId) {
  const filePath = path.join(CRAGS_DIR, `${cragId}.json`)
  if (!fs.existsSync(filePath)) {
    console.error(`錯誤: 找不到岩場檔案 ${filePath}`)
    return null
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

// 搜尋 YouTube 影片
function searchYouTube(query, limit = 5) {
  try {
    const cmd = `yt-dlp "ytsearch${limit}:${query}" --dump-json --flat-playlist --no-warnings 2>/dev/null`
    const output = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })

    const results = output
      .trim()
      .split('\n')
      .filter((line) => line)
      .map((line) => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      })
      .filter((item) => item)

    return results.map((item) => ({
      videoId: item.id,
      title: item.title,
      channel: item.channel || item.uploader || '',
      channelId: item.channel_id || item.uploader_id || '',
      duration: item.duration_string || '',
      url: `https://www.youtube.com/watch?v=${item.id}`,
    }))
  } catch (error) {
    return []
  }
}

// 提取路線主要名稱（去除括號內容）
function extractMainName(name) {
  if (!name) return ''
  // "劍 (舊名：劍直上)" → "劍"
  // "Some Route (old name)" → "Some Route"
  return name.split(/[\(（]/)[0].trim()
}

// 已知的台灣攀岩頻道（從 video-metadata.json 提取的高頻頻道）
const TRUSTED_CHANNELS = new Set([
  '@Jimiras', '@samfang6357', '@洪覓逾', '@張峻豪-f5u', '@y8765gd',
  '@小魏教練的攀登紀錄', '@truman615167', '@戶外江', '@twyunghui',
  '@sammychen2000', '@lipper0802', '@MauriceChenChenYu', '@攀岩好好',
  '@kateberrychen', '@user-fruitlai', '@loik850617', '@ikon1218',
  '@HsuRex', '@rock6879', '@matleetube', '@sharonchang2048',
  '@yuchinglee5555', '@kenhuang0506', '@YiXiongLi',
])

// 計算影片相關性分數
function calculateRelevanceScore(video, routeName, routeNameEn, cragName, grade) {
  const title = video.title.toLowerCase()
  const channel = video.channel || ''
  let score = 0

  // 提取主要名稱
  const mainName = extractMainName(routeName).toLowerCase()
  const mainNameEn = extractMainName(routeNameEn).toLowerCase()
  const cragNameLower = cragName.toLowerCase()

  // 1. 路線名稱匹配（必要條件）
  const hasRouteName = mainName && mainName.length >= 2 && title.includes(mainName)
  const hasRouteNameEn = mainNameEn && mainNameEn.length > 2 && title.includes(mainNameEn)

  if (!hasRouteName && !hasRouteNameEn) {
    return 0 // 沒有路線名稱，直接排除
  }

  score += hasRouteName ? 30 : 0
  score += hasRouteNameEn ? 20 : 0

  // 2. 岩場名稱匹配（+25 分）
  if (title.includes(cragNameLower)) {
    score += 25
  }

  // 3. 難度匹配（+15 分）
  const gradeLower = grade.toLowerCase()
  if (title.includes(gradeLower)) {
    score += 15
  }

  // 4. 已知攀岩頻道（+20 分）
  if (TRUSTED_CHANNELS.has(video.channelId)) {
    score += 20
  }

  // 5. 攀岩相關詞彙（+10 分）
  const climbingKeywords = ['攀岩', 'climbing', 'climber', '完攀', 'redpoint', 'onsight', 'flash']
  for (const keyword of climbingKeywords) {
    if (title.includes(keyword)) {
      score += 5
      break
    }
  }

  return score
}

// 檢查影片是否足夠相關（分數門檻）
function isRelevantVideo(video, routeName, routeNameEn, cragName, grade) {
  const score = calculateRelevanceScore(video, routeName, routeNameEn, cragName, grade)
  // 至少要有路線名稱（30分）+ 岩場或難度或頻道（15-25分）= 45分以上
  return score >= 45
}

// 從 YouTube URL 提取影片 ID
function extractVideoId(url) {
  if (!url) return null
  const match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

// 過濾掉已存在的影片
function filterExistingVideos(videos, existingUrls) {
  if (!existingUrls || existingUrls.length === 0) return videos

  const existingIds = new Set(existingUrls.map(extractVideoId).filter(Boolean))
  return videos.filter(v => !existingIds.has(v.videoId))
}

// 轉義 CSV 欄位
function escapeCSV(str) {
  if (!str) return ''
  str = String(str)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// 主程式
async function main() {
  const args = process.argv.slice(2)

  // 解析參數
  let cragId = null
  let limit = 10

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1]) || 5
    } else if (!arg.startsWith('--')) {
      cragId = arg
    }
  }

  if (!cragId) {
    console.log('使用方式: node scripts/search-route-videos.js <crag-id> [--limit=5]')
    console.log('')
    console.log('範例:')
    console.log('  node scripts/search-route-videos.js longdong')
    console.log('  node scripts/search-route-videos.js longdong --limit=3')
    process.exit(1)
  }

  console.log('=== 路線影片搜尋工具 ===\n')

  // 檢查 yt-dlp
  if (!checkYtDlp()) {
    process.exit(1)
  }

  // 讀取岩場資料
  const data = readCragData(cragId)
  if (!data) {
    process.exit(1)
  }

  const { crag, routes } = data
  console.log(`岩場: ${crag.name} (${routes.length} 條路線)`)
  console.log(`每條路線搜尋 ${limit} 個影片\n`)

  // 建立 area 對照表
  const areaMap = {}
  for (const area of data.areas || []) {
    areaMap[area.id] = area.name
  }

  // CSV 標頭
  const csvRows = [
    [
      '岩場',
      '區域',
      '路線ID',
      '路線名稱',
      '路線英文名',
      '難度',
      '已有影片數',
      '新發現數',
      '建議影片（標題 | URL）',
      '選擇的YouTube影片',
      '選擇的Instagram貼文',
    ].join(','),
  ]

  // 搜尋每條路線
  let processed = 0
  let foundRelevant = 0
  const total = routes.length

  for (const route of routes) {
    processed++
    const progress = `[${processed}/${total}]`

    // 建立搜尋關鍵字（用主要名稱）
    const mainRouteName = extractMainName(route.name)
    const searchQuery = `${crag.name} ${mainRouteName} ${route.grade} 攀岩`
    process.stdout.write(`${progress} 搜尋: ${mainRouteName} (${route.grade})...`)

    const allVideos = searchYouTube(searchQuery, limit)

    // 過濾相關影片（使用分數門檻）
    let relevantVideos = allVideos.filter((v) =>
      isRelevantVideo(v, route.name, route.nameEn, crag.name, route.grade)
    )

    // 過濾掉已存在的影片
    const existingUrls = route.youtubeVideos || []
    const existingCount = existingUrls.length
    relevantVideos = filterExistingVideos(relevantVideos, existingUrls)

    // 如果沒有相關影片，嘗試用英文名搜尋
    let videos = relevantVideos
    if (videos.length === 0 && route.nameEn) {
      const mainRouteNameEn = extractMainName(route.nameEn)
      const searchQueryEn = `${crag.nameEn || crag.name} ${mainRouteNameEn} climbing`
      const allVideosEn = searchYouTube(searchQueryEn, limit)
      videos = allVideosEn.filter((v) =>
        isRelevantVideo(v, route.name, route.nameEn, crag.name, route.grade)
      )
      // 同樣過濾掉已存在的影片
      videos = filterExistingVideos(videos, existingUrls)
    }

    // 建立建議影片清單（按分數排序，顯示分數）
    const videosWithScore = videos.map(v => ({
      ...v,
      score: calculateRelevanceScore(v, route.name, route.nameEn, crag.name, route.grade)
    })).sort((a, b) => b.score - a.score)

    const videoList = videosWithScore
      .map((v) => `[${v.score}分] ${v.title} | ${v.url}`)
      .join('\n')

    // 建立 CSV 行
    const row = [
      escapeCSV(crag.name),
      escapeCSV(areaMap[route.areaId] || ''),
      escapeCSV(route.id),
      escapeCSV(route.name),
      escapeCSV(route.nameEn || ''),
      escapeCSV(route.grade),
      existingCount, // 已有影片數
      videos.length, // 新發現數
      escapeCSV(videoList),
      '', // 選擇的 YouTube 影片
      '', // 選擇的 Instagram 貼文
    ]

    csvRows.push(row.join(','))

    if (videos.length > 0) {
      foundRelevant++
      if (existingCount > 0) {
        console.log(` ✓ 找到 ${videos.length} 個新影片 (已有 ${existingCount} 個)`)
      } else {
        console.log(` ✓ 找到 ${videos.length} 個相關影片`)
      }
    } else {
      if (existingCount > 0) {
        console.log(` ─ 已有 ${existingCount} 個影片，無新發現`)
      } else {
        console.log(` ✗ 無相關影片`)
      }
    }

    // 避免請求太快
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  // 寫入 CSV
  const outputPath = path.join(OUTPUT_DIR, `route-videos-${cragId}.csv`)
  fs.writeFileSync(outputPath, '\uFEFF' + csvRows.join('\n'), 'utf-8') // BOM for Excel/Google Sheets

  console.log(`\n=== 搜尋統計 ===`)
  console.log(`總路線數: ${total}`)
  console.log(`找到相關影片: ${foundRelevant} 條 (${((foundRelevant / total) * 100).toFixed(1)}%)`)
  console.log(`無相關影片: ${total - foundRelevant} 條`)
  console.log(`\n✅ 輸出: ${outputPath}`)
  console.log('')
  console.log('下一步：')
  console.log('1. 將 CSV 匯入 Google Sheets')
  console.log('2. 檢視建議影片，正確的複製到「選擇的YouTube影片」欄位')
  console.log('3. 補充 Instagram 貼文連結')
  console.log('4. 下載為 CSV，執行: node scripts/import-route-videos.js <csv檔案>')
}

main().catch(console.error)
