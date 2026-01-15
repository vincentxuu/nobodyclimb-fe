#!/usr/bin/env node
/**
 * 影片關鍵字提取腳本
 * 從頻道影片標題中提取岩場、區域、路線名稱
 *
 * 使用方式:
 *   node scripts/extract-video-keywords.js <channel-url>
 *   node scripts/extract-video-keywords.js --channels=<channels-file>
 *
 * 範例:
 *   node scripts/extract-video-keywords.js "https://www.youtube.com/@somechannel"
 *   node scripts/extract-video-keywords.js --channels=channels.txt
 *
 * 輸出:
 *   output/video-keywords.csv
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

// 讀取所有岩場資料
function loadAllCrags() {
  const crags = []
  const files = fs.readdirSync(CRAGS_DIR).filter((f) => f.endsWith('.json'))

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(CRAGS_DIR, file), 'utf-8'))
    crags.push(data)
  }

  return crags
}

// 提取路線主要名稱（去除括號內容）
function extractMainName(name) {
  if (!name) return ''
  return name.split(/[\(（]/)[0].trim()
}

// 建立關鍵字對照表
function buildKeywordMap(cragsData) {
  const map = {
    crags: [], // { name, nameEn, id }
    areas: [], // { name, nameEn, cragId, cragName, areaId }
    routes: [], // { name, nameEn, cragId, cragName, areaId, areaName, routeId, grade }
  }

  for (const data of cragsData) {
    const { crag, areas, routes } = data

    // 岩場
    map.crags.push({
      name: crag.name,
      nameEn: crag.nameEn,
      id: crag.id,
    })

    // 區域
    const areaMap = {}
    for (const area of areas || []) {
      areaMap[area.id] = area.name
      map.areas.push({
        name: area.name,
        nameEn: area.nameEn,
        cragId: crag.id,
        cragName: crag.name,
        areaId: area.id,
      })
    }

    // 路線
    for (const route of routes || []) {
      map.routes.push({
        name: extractMainName(route.name),
        nameEn: extractMainName(route.nameEn),
        cragId: crag.id,
        cragName: crag.name,
        areaId: route.areaId,
        areaName: areaMap[route.areaId] || '',
        routeId: route.id,
        grade: route.grade,
      })
    }
  }

  return map
}

// 從標題中提取關鍵字
function extractKeywords(title, keywordMap) {
  const titleLower = title.toLowerCase()
  const result = {
    crag: null,
    area: null,
    route: null,
  }

  // 1. 找岩場
  for (const crag of keywordMap.crags) {
    if (crag.name && titleLower.includes(crag.name.toLowerCase())) {
      result.crag = crag
      break
    }
    if (crag.nameEn && crag.nameEn.length > 2 && titleLower.includes(crag.nameEn.toLowerCase())) {
      result.crag = crag
      break
    }
  }

  // 2. 找區域（優先找已匹配岩場的區域）
  const areasToSearch = result.crag
    ? keywordMap.areas.filter((a) => a.cragId === result.crag.id)
    : keywordMap.areas

  for (const area of areasToSearch) {
    if (area.name && area.name.length >= 2 && titleLower.includes(area.name.toLowerCase())) {
      result.area = area
      // 如果還沒找到岩場，從區域補上
      if (!result.crag) {
        result.crag = keywordMap.crags.find((c) => c.id === area.cragId)
      }
      break
    }
  }

  // 3. 找路線（優先找已匹配岩場/區域的路線）
  let routesToSearch = keywordMap.routes
  if (result.crag) {
    routesToSearch = routesToSearch.filter((r) => r.cragId === result.crag.id)
  }
  if (result.area) {
    routesToSearch = routesToSearch.filter((r) => r.areaId === result.area.areaId)
  }

  for (const route of routesToSearch) {
    if (route.name && route.name.length >= 2 && titleLower.includes(route.name.toLowerCase())) {
      result.route = route
      // 補上岩場和區域
      if (!result.crag) {
        result.crag = keywordMap.crags.find((c) => c.id === route.cragId)
      }
      if (!result.area && route.areaName) {
        result.area = keywordMap.areas.find(
          (a) => a.cragId === route.cragId && a.areaId === route.areaId
        )
      }
      break
    }
    if (
      route.nameEn &&
      route.nameEn.length > 2 &&
      titleLower.includes(route.nameEn.toLowerCase())
    ) {
      result.route = route
      if (!result.crag) {
        result.crag = keywordMap.crags.find((c) => c.id === route.cragId)
      }
      if (!result.area && route.areaName) {
        result.area = keywordMap.areas.find(
          (a) => a.cragId === route.cragId && a.areaId === route.areaId
        )
      }
      break
    }
  }

  return result
}

// 下載頻道影片清單
function fetchChannelVideos(channelUrl) {
  try {
    console.log(`  下載影片清單...`)
    const cmd = `yt-dlp "${channelUrl}/videos" --dump-json --flat-playlist --no-warnings 2>/dev/null`
    const output = execSync(cmd, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
      timeout: 120000,
    })

    return output
      .trim()
      .split('\n')
      .filter((line) => line)
      .map((line) => {
        try {
          const item = JSON.parse(line)
          return {
            videoId: item.id,
            title: item.title || '',
            channel: item.channel || item.uploader || '',
            url: `https://www.youtube.com/watch?v=${item.id}`,
          }
        } catch {
          return null
        }
      })
      .filter((item) => item)
  } catch (error) {
    console.error(`  下載失敗: ${error.message}`)
    return []
  }
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

  if (args.length < 1) {
    console.log('使用方式:')
    console.log('  node scripts/extract-video-keywords.js <channel-url>')
    console.log('  node scripts/extract-video-keywords.js --channels=<file>')
    console.log('')
    console.log('範例:')
    console.log('  node scripts/extract-video-keywords.js "https://www.youtube.com/@channel"')
    console.log('  node scripts/extract-video-keywords.js --channels=channels.txt')
    process.exit(1)
  }

  console.log('=== 影片關鍵字提取工具 ===\n')

  if (!checkYtDlp()) {
    process.exit(1)
  }

  // 解析頻道參數
  let channelUrls = []
  for (const arg of args) {
    if (arg.startsWith('--channels=')) {
      const file = arg.split('=')[1]
      const filePath = path.isAbsolute(file) ? file : path.join(process.cwd(), file)
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8')
        const urls = content
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith('#'))
        channelUrls.push(...urls)
      } else {
        console.error(`找不到檔案: ${filePath}`)
        process.exit(1)
      }
    } else if (arg.includes('youtube.com') || arg.includes('youtu.be')) {
      channelUrls.push(arg)
    }
  }

  if (channelUrls.length === 0) {
    console.error('錯誤: 請提供頻道 URL')
    process.exit(1)
  }

  // 載入所有岩場資料
  console.log('載入岩場資料...')
  const cragsData = loadAllCrags()
  const keywordMap = buildKeywordMap(cragsData)
  console.log(
    `  ${keywordMap.crags.length} 個岩場, ${keywordMap.areas.length} 個區域, ${keywordMap.routes.length} 條路線\n`
  )

  // 收集所有影片
  const allVideos = []
  for (const url of channelUrls) {
    console.log(`處理頻道: ${url}`)
    const videos = fetchChannelVideos(url)
    console.log(`  找到 ${videos.length} 個影片`)
    allVideos.push(...videos)
  }

  console.log(`\n總共 ${allVideos.length} 個影片，開始提取關鍵字...\n`)

  // 建立 CSV
  const csvRows = [
    [
      '影片標題',
      '影片URL',
      '頻道',
      '岩場',
      '區域',
      '路線名稱',
      '路線ID',
      '難度',
      '是否匹配',
    ].join(','),
  ]

  let matchedCount = 0
  for (const video of allVideos) {
    const keywords = extractKeywords(video.title, keywordMap)
    const hasMatch = keywords.crag || keywords.area || keywords.route

    if (hasMatch) matchedCount++

    const row = [
      escapeCSV(video.title),
      escapeCSV(video.url),
      escapeCSV(video.channel),
      escapeCSV(keywords.crag?.name || ''),
      escapeCSV(keywords.area?.name || ''),
      escapeCSV(keywords.route?.name || ''),
      escapeCSV(keywords.route?.routeId || ''),
      escapeCSV(keywords.route?.grade || ''),
      hasMatch ? '是' : '否',
    ]

    csvRows.push(row.join(','))
  }

  // 寫入 CSV
  const outputPath = path.join(OUTPUT_DIR, 'video-keywords.csv')
  fs.writeFileSync(outputPath, '\uFEFF' + csvRows.join('\n'), 'utf-8')

  console.log('=== 提取統計 ===')
  console.log(`總影片數: ${allVideos.length}`)
  console.log(`有匹配的: ${matchedCount} (${((matchedCount / allVideos.length) * 100).toFixed(1)}%)`)
  console.log(`無匹配的: ${allVideos.length - matchedCount}`)
  console.log(`\n✅ 輸出: ${outputPath}`)
}

main().catch(console.error)
