#!/usr/bin/env node
/**
 * 頻道影片比對路線腳本
 * 下載指定頻道的影片清單，比對路線名稱，輸出 CSV
 *
 * 使用方式:
 *   node scripts/match-channel-videos.js <crag-id> <channel-url>
 *   node scripts/match-channel-videos.js <crag-id> --channels=<channels-file>
 *
 * 範例:
 *   node scripts/match-channel-videos.js longdong "https://www.youtube.com/@somechannel"
 *   node scripts/match-channel-videos.js longdong --channels=channels.txt
 *
 * channels.txt 格式（每行一個頻道 URL）:
 *   https://www.youtube.com/@channel1
 *   https://www.youtube.com/@channel2
 *
 * 輸出:
 *   output/channel-match-{crag-id}.csv
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

// 下載頻道影片清單
function fetchChannelVideos(channelUrl) {
  try {
    const cmd = `yt-dlp "${channelUrl}/videos" --dump-json --flat-playlist --no-warnings 2>/dev/null`
    const output = execSync(cmd, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
      timeout: 120000,
    })

    const videos = output
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
      .map((item) => ({
        videoId: item.id,
        title: item.title || '',
        channel: item.channel || item.uploader || '',
        url: `https://www.youtube.com/watch?v=${item.id}`,
      }))

    return videos
  } catch (error) {
    console.error(`  下載失敗: ${error.message}`)
    return []
  }
}

// 提取路線主要名稱（去除括號內容）
function extractMainName(name) {
  if (!name) return ''
  return name.split(/[\(（]/)[0].trim()
}

// 從 YouTube URL 提取影片 ID
function extractVideoId(url) {
  if (!url) return null
  const match =
    url.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

// 比對影片與路線
function matchVideoToRoutes(video, routes) {
  const title = video.title.toLowerCase()
  const matches = []

  for (const route of routes) {
    const mainName = extractMainName(route.name).toLowerCase()
    const mainNameEn = extractMainName(route.nameEn || '').toLowerCase()

    // 檢查標題是否包含路線名稱
    if (mainName && mainName.length >= 2 && title.includes(mainName)) {
      matches.push(route)
    } else if (mainNameEn && mainNameEn.length > 2 && title.includes(mainNameEn)) {
      matches.push(route)
    }
  }

  return matches
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

  if (args.length < 2) {
    process.exit(1)
  }

  if (!checkYtDlp()) {
    process.exit(1)
  }

  const cragId = args[0]
  let channelUrls = []

  // 解析頻道參數
  for (let i = 1; i < args.length; i++) {
    const arg = args[i]
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

  // 讀取岩場資料
  const data = readCragData(cragId)
  if (!data) {
    process.exit(1)
  }

  const { crag, routes, areas } = data

  // 建立 area 對照表
  const areaMap = {}
  for (const area of areas || []) {
    areaMap[area.id] = area.name
  }

  // 收集所有影片
  const allVideos = []
  for (const url of channelUrls) {
    const videos = fetchChannelVideos(url)

    allVideos.push(...videos)
  }

  // 建立路線已有影片的 ID Set
  const routeExistingIds = new Map()
  for (const route of routes) {
    const existingUrls = route.youtubeVideos || []
    const existingIds = new Set(existingUrls.map(extractVideoId).filter(Boolean))
    routeExistingIds.set(route.id, existingIds)
  }

  // 比對結果：路線 → 影片
  const routeMatches = new Map()
  for (const route of routes) {
    routeMatches.set(route.id, [])
  }

  // 比對每個影片
  let _matchedVideos = 0
  for (const video of allVideos) {
    const matches = matchVideoToRoutes(video, routes)
    if (matches.length > 0) {
      _matchedVideos++
      for (const route of matches) {
        // 過濾掉已存在的影片
        const existingIds = routeExistingIds.get(route.id)
        if (!existingIds.has(video.videoId)) {
          routeMatches.get(route.id).push(video)
        }
      }
    }
  }

  // 建立 CSV
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

  let _routesWithMatches = 0
  let _routesWithExisting = 0
  let _totalNewVideos = 0
  for (const route of routes) {
    const videos = routeMatches.get(route.id)
    const existingCount = (route.youtubeVideos || []).length
    if (videos.length > 0) _routesWithMatches++
    if (existingCount > 0) _routesWithExisting++
    _totalNewVideos += videos.length

    const videoList = videos.map((v) => `${v.title} | ${v.url}`).join('\n')

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
      '',
      '',
    ]

    csvRows.push(row.join(','))
  }

  // 寫入 CSV
  const outputPath = path.join(OUTPUT_DIR, `channel-match-${cragId}.csv`)
  fs.writeFileSync(outputPath, '\uFEFF' + csvRows.join('\n'), 'utf-8')
}

main().catch(console.error)
