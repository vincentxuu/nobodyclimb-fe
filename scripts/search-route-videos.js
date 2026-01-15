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
      duration: item.duration_string || '',
      url: `https://www.youtube.com/watch?v=${item.id}`,
    }))
  } catch (error) {
    return []
  }
}

// 檢查影片標題是否與路線相關
function isRelevantVideo(video, routeName, routeNameEn) {
  const title = video.title.toLowerCase()
  const name = routeName.toLowerCase()
  const nameEn = (routeNameEn || '').toLowerCase()

  // 標題必須包含路線名稱（中文或英文）
  if (name && title.includes(name)) return true
  if (nameEn && nameEn.length > 2 && title.includes(nameEn)) return true

  return false
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
      '建議影片1_標題',
      '建議影片1_頻道',
      '建議影片1_URL',
      '建議影片2_標題',
      '建議影片2_頻道',
      '建議影片2_URL',
      '建議影片3_標題',
      '建議影片3_頻道',
      '建議影片3_URL',
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

    // 建立搜尋關鍵字（更精確）
    const searchQuery = `${crag.name} ${route.name} ${route.grade} 攀岩`
    process.stdout.write(`${progress} 搜尋: ${route.name} (${route.grade})...`)

    const allVideos = searchYouTube(searchQuery, limit)

    // 過濾相關影片
    const relevantVideos = allVideos.filter((v) =>
      isRelevantVideo(v, route.name, route.nameEn)
    )

    // 如果沒有相關影片，嘗試用英文名搜尋
    let videos = relevantVideos
    if (videos.length === 0 && route.nameEn) {
      const searchQueryEn = `${crag.nameEn || crag.name} ${route.nameEn} climbing`
      const allVideosEn = searchYouTube(searchQueryEn, limit)
      videos = allVideosEn.filter((v) =>
        isRelevantVideo(v, route.name, route.nameEn)
      )
    }

    // 建立 CSV 行
    const row = [
      escapeCSV(crag.name),
      escapeCSV(areaMap[route.areaId] || ''),
      escapeCSV(route.id),
      escapeCSV(route.name),
      escapeCSV(route.nameEn || ''),
      escapeCSV(route.grade),
    ]

    // 加入搜尋結果（最多 3 個）
    for (let i = 0; i < 3; i++) {
      if (videos[i]) {
        row.push(escapeCSV(videos[i].title))
        row.push(escapeCSV(videos[i].channel))
        row.push(escapeCSV(videos[i].url))
      } else {
        row.push('', '', '')
      }
    }

    // 空白欄位給用戶填寫
    row.push('') // 選擇的 YouTube 影片
    row.push('') // 選擇的 Instagram 貼文

    csvRows.push(row.join(','))

    if (videos.length > 0) {
      foundRelevant++
      console.log(` ✓ 找到 ${videos.length} 個相關影片`)
    } else {
      console.log(` ✗ 無相關影片`)
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
