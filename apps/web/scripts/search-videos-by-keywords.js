#!/usr/bin/env node
/**
 * 根據 CSV 關鍵字搜尋 YouTube 影片
 * 按區域整理輸出結果
 *
 * 使用方式:
 *   node scripts/search-videos-by-keywords.js <csv檔案> [--limit=5] [--area=區域名稱]
 *
 * 範例:
 *   node scripts/search-videos-by-keywords.js output/keywords-longdong.csv
 *   node scripts/search-videos-by-keywords.js output/keywords-longdong.csv --limit=3
 *   node scripts/search-videos-by-keywords.js output/keywords-longdong.csv --area=大禮堂
 *
 * 輸出:
 *   output/videos-{岩場}-{區域}.csv (每個區域一個檔案)
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

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

// 解析 CSV 行
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

// 讀取 CSV 檔案
function readCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  // 移除 BOM
  const cleanContent = content.replace(/^\uFEFF/, '')
  const lines = cleanContent.split('\n').filter((line) => line.trim())

  const headers = parseCSVLine(lines[0])
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    rows.push(row)
  }

  return { headers, rows }
}

// 搜尋 YouTube 影片
function searchYouTube(query, limit = 5) {
  try {
    // 轉義特殊字元
    const escapedQuery = query.replace(/"/g, '\\"')
    const cmd = `yt-dlp "ytsearch${limit}:${escapedQuery}" --dump-json --flat-playlist --no-warnings 2>/dev/null`
    const output = execSync(cmd, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000,
    })

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
      viewCount: item.view_count || 0,
      url: `https://www.youtube.com/watch?v=${item.id}`,
    }))
  } catch (_error) {
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

// 將檔名安全化
function sanitizeFileName(name) {
  return name.replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, '-')
}

// 主程式
async function main() {
  const args = process.argv.slice(2)

  // 解析參數
  let csvPath = null
  let limit = 5
  let filterArea = null

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1]) || 5
    } else if (arg.startsWith('--area=')) {
      filterArea = arg.split('=')[1]
    } else if (!arg.startsWith('--')) {
      csvPath = arg
    }
  }

  if (!csvPath) {
    process.exit(1)
  }

  // 檢查 yt-dlp
  if (!checkYtDlp()) {
    process.exit(1)
  }

  // 讀取 CSV
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ 找不到檔案: ${csvPath}`)
    process.exit(1)
  }

  const { rows } = readCSV(csvPath)

  // 按區域分組
  const areaGroups = {}
  for (const row of rows) {
    const area = row['區域'] || row['區域英文'] || '未分類'
    if (!areaGroups[area]) {
      areaGroups[area] = []
    }
    areaGroups[area].push(row)
  }

  const areas = Object.keys(areaGroups)

  if (filterArea) {
    if (!areaGroups[filterArea]) {
      console.error(`❌ 找不到區域: ${filterArea}`)

      process.exit(1)
    }
  }

  // 取得岩場名稱
  const cragName = rows[0]?.['岩場'] || 'unknown'

  // 處理每個區域
  const areasToProcess = filterArea ? [filterArea] : areas

  // 追蹤已使用的影片 ID（全域去重）
  const usedVideoIds = new Set()

  for (const area of areasToProcess) {
    const areaRoutes = areaGroups[area]

    // CSV 標頭
    const csvRows = [
      [
        '岩場',
        '區域',
        '路線ID',
        '路線名稱',
        '路線英文名',
        '難度',
        '搜尋關鍵字',
        '找到數量',
        '影片1標題',
        '影片1網址',
        '影片1頻道',
        '影片2標題',
        '影片2網址',
        '影片2頻道',
        '影片3標題',
        '影片3網址',
        '影片3頻道',
      ].join(','),
    ]

    let processed = 0
    let _foundCount = 0

    for (const route of areaRoutes) {
      processed++
      const keyword = route['搜尋關鍵字'] || ''
      const routeName = route['路線名稱'] || ''
      const progress = `[${processed}/${areaRoutes.length}]`

      if (!keyword) {
        continue
      }

      process.stdout.write(`${progress} 🔍 ${routeName}...`)

      const allVideos = searchYouTube(keyword, limit)

      // 過濾掉已使用的影片
      const videos = allVideos.filter((v) => !usedVideoIds.has(v.videoId))

      // 將新影片加入已使用集合
      videos.forEach((v) => usedVideoIds.add(v.videoId))

      // 建立 CSV 行
      const row = [
        escapeCSV(route['岩場'] || cragName),
        escapeCSV(area),
        escapeCSV(route['路線ID'] || ''),
        escapeCSV(routeName),
        escapeCSV(route['路線英文名'] || ''),
        escapeCSV(route['難度'] || ''),
        escapeCSV(keyword),
        videos.length,
      ]

      // 添加前 3 個影片資訊
      for (let i = 0; i < 3; i++) {
        if (videos[i]) {
          row.push(escapeCSV(videos[i].title))
          row.push(escapeCSV(videos[i].url))
          row.push(escapeCSV(videos[i].channel))
        } else {
          row.push('', '', '')
        }
      }

      csvRows.push(row.join(','))

      if (videos.length > 0) {
        _foundCount++
      } else {
      }

      // 避免請求太快
      await new Promise((resolve) => setTimeout(resolve, 800))
    }

    // 寫入區域 CSV
    const safeAreaName = sanitizeFileName(area)
    const safeCragName = sanitizeFileName(cragName)
    const outputPath = path.join(OUTPUT_DIR, `videos-${safeCragName}-${safeAreaName}.csv`)
    fs.writeFileSync(outputPath, '\uFEFF' + csvRows.join('\n'), 'utf-8')
  }
}

main().catch(console.error)
