#!/usr/bin/env node
/**
 * 路線影片匯入腳本
 * 從 CSV（Google Sheets 下載）匯入影片連結到岩場 JSON
 *
 * 使用方式:
 *   node scripts/import-route-videos.js <csv-file>
 *
 * 範例:
 *   node scripts/import-route-videos.js output/route-videos-longdong.csv
 *
 * CSV 格式要求:
 *   - 必須有「路線ID」欄位
 *   - 必須有「選擇的YouTube影片」欄位（每行一個 URL，或用分號分隔）
 *   - 可選有「選擇的Instagram貼文」欄位
 */

const fs = require('fs')
const path = require('path')

// 路徑設定
const CRAGS_DIR = path.join(__dirname, '../src/data/crags')

// 讀取岩場 JSON 檔案
function readCragData(cragId) {
  const filePath = path.join(CRAGS_DIR, `${cragId}.json`)
  if (!fs.existsSync(filePath)) {
    return null
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

// 寫入岩場 JSON 檔案
function writeCragData(cragId, data) {
  const filePath = path.join(CRAGS_DIR, `${cragId}.json`)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

// 解析 CSV
function parseCSV(content) {
  // 移除 BOM
  content = content.replace(/^\uFEFF/, '')

  // 正確處理帶有換行的引號欄位
  const rows = []
  let currentRow = []
  let currentCell = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const nextChar = content[i + 1]

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // 轉義的引號
        currentCell += '"'
        i++
      } else if (char === '"') {
        // 結束引號
        inQuotes = false
      } else {
        // 引號內的任何字元（包括換行）
        currentCell += char
      }
    } else {
      if (char === '"') {
        // 開始引號
        inQuotes = true
      } else if (char === ',') {
        // 欄位分隔
        currentRow.push(currentCell)
        currentCell = ''
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        // 行結束
        if (char === '\r') i++ // 跳過 \r\n 的 \n
        currentRow.push(currentCell)
        if (currentRow.some(cell => cell.trim())) {
          rows.push(currentRow)
        }
        currentRow = []
        currentCell = ''
      } else if (char !== '\r') {
        currentCell += char
      }
    }
  }

  // 處理最後一行
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell)
    if (currentRow.some(cell => cell.trim())) {
      rows.push(currentRow)
    }
  }

  if (rows.length < 2) return []

  // 第一行是標頭
  const headers = rows[0]
  const result = []

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i]
    const row = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || ''
    }
    result.push(row)
  }

  return result
}

// 解析單行 CSV（處理引號）
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"'
        i++ // 跳過下一個引號
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
  }

  result.push(current)
  return result
}

// 解析多種格式的 URL（以 https 為錨點）
function parseUrls(text) {
  if (!text) return []

  // 匹配所有 https:// 開頭的 URL（直到空白、逗號、分號或換行）
  const matches = text.match(/https:\/\/[^\s,;，；\n]+/g)
  return matches || []
}

// 從「標題 | URL」格式中提取 URL
function parseVideoList(text) {
  if (!text) return []

  return text
    .split('\n')
    .map((line) => {
      // 格式: "標題 | https://www.youtube.com/watch?v=xxx"
      const parts = line.split('|')
      if (parts.length >= 2) {
        return parts[parts.length - 1].trim() // 取最後一個部分作為 URL
      }
      return line.trim()
    })
    .filter((url) => url.length > 0)
}

// 驗證 YouTube URL
function isValidYoutubeUrl(url) {
  return (
    url.includes('youtube.com/watch') ||
    url.includes('youtu.be/') ||
    url.includes('youtube.com/embed/')
  )
}

// 驗證 Instagram URL
function isValidInstagramUrl(url) {
  return url.includes('instagram.com/p/') || url.includes('instagram.com/reel/')
}

// 主程式
function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('使用方式: node scripts/import-route-videos.js <csv-file>')
    console.log('')
    console.log('範例:')
    console.log('  node scripts/import-route-videos.js output/route-videos-longdong.csv')
    process.exit(1)
  }

  const csvFile = args[0]
  const filePath = path.isAbsolute(csvFile) ? csvFile : path.join(process.cwd(), csvFile)

  console.log('=== 路線影片匯入工具 ===\n')
  console.log(`讀取檔案: ${filePath}\n`)

  if (!fs.existsSync(filePath)) {
    console.error(`錯誤: 找不到檔案 ${filePath}`)
    process.exit(1)
  }

  // 讀取並解析 CSV
  const content = fs.readFileSync(filePath, 'utf-8')
  const rows = parseCSV(content)

  console.log(`CSV 共有 ${rows.length} 筆資料\n`)

  // 按岩場分組
  const cragGroups = {}
  for (const row of rows) {
    // 嘗試從路線ID推斷岩場ID
    const routeId = row['路線ID']
    if (!routeId) continue

    // 路線ID格式: LD-MUSIC-HALL-329 → longdong
    let cragId = null
    if (routeId.startsWith('LD-')) cragId = 'longdong'
    else if (routeId.startsWith('DF-')) cragId = 'defulan'
    else if (routeId.startsWith('GZ-') || routeId.startsWith('GZL-')) cragId = 'guanziling'
    else if (routeId.startsWith('KT-')) cragId = 'kenting'
    else if (routeId.startsWith('SS-')) cragId = 'shoushan'

    if (!cragId) {
      console.log(`  跳過: 無法識別岩場 (${routeId})`)
      continue
    }

    if (!cragGroups[cragId]) {
      cragGroups[cragId] = []
    }
    cragGroups[cragId].push(row)
  }

  // 統計
  const stats = {
    cragsUpdated: 0,
    routesUpdated: 0,
    youtubeAdded: 0,
    instagramAdded: 0,
    errors: [],
  }

  // 處理每個岩場
  for (const [cragId, rows] of Object.entries(cragGroups)) {
    console.log(`處理岩場: ${cragId} (${rows.length} 條路線)`)

    const cragData = readCragData(cragId)
    if (!cragData) {
      stats.errors.push(`找不到岩場: ${cragId}`)
      continue
    }

    // 建立路線對照表
    const routeMap = {}
    for (const route of cragData.routes) {
      routeMap[route.id] = route
    }

    let routesUpdatedInCrag = 0

    for (const row of rows) {
      const routeId = row['路線ID']
      const route = routeMap[routeId]

      if (!route) {
        stats.errors.push(`找不到路線: ${routeId}`)
        continue
      }

      let hasChanges = false

      // 處理 YouTube 影片
      // 優先讀取「選擇的YouTube影片」，如果沒有則讀取「建議影片（標題 | URL）」
      const selectedYoutube = row['選擇的YouTube影片'] || row['YouTube影片'] || ''
      const suggestedYoutube = row['建議影片（標題 | URL）'] || row['建議影片'] || ''

      // 合併所有可能的 URL 來源，統一用 parseUrls 提取
      const allYoutubeText = [selectedYoutube, suggestedYoutube].filter(Boolean).join(' ')
      let youtubeUrls = parseUrls(allYoutubeText)

      youtubeUrls = youtubeUrls.filter((url) => {
        if (isValidYoutubeUrl(url)) return true
        if (url) stats.errors.push(`無效的 YouTube URL: ${url}`)
        return false
      })

      if (youtubeUrls.length > 0) {
        // 過濾掉已存在的 URL
        const existingUrls = route.youtubeVideos || []
        const newUrls = youtubeUrls.filter((url) => !existingUrls.includes(url))

        if (newUrls.length > 0) {
          route.youtubeVideos = [...existingUrls, ...newUrls]
          stats.youtubeAdded += newUrls.length
          hasChanges = true
        }
      }

      // 處理 Instagram 貼文
      const instagramText = row['選擇的Instagram貼文'] || row['Instagram貼文'] || ''
      const instagramUrls = parseUrls(instagramText).filter((url) => {
        if (isValidInstagramUrl(url)) return true
        if (url) stats.errors.push(`無效的 Instagram URL: ${url}`)
        return false
      })

      if (instagramUrls.length > 0) {
        route.instagramPosts = instagramUrls
        stats.instagramAdded += instagramUrls.length
        hasChanges = true
      }

      if (hasChanges) {
        routesUpdatedInCrag++
      }
    }

    // 寫入更新
    if (routesUpdatedInCrag > 0) {
      writeCragData(cragId, cragData)
      stats.cragsUpdated++
      stats.routesUpdated += routesUpdatedInCrag
      console.log(`  ✅ 更新了 ${routesUpdatedInCrag} 條路線`)
    } else {
      console.log(`  無變更`)
    }
  }

  // 輸出統計
  console.log('\n=== 匯入統計 ===')
  console.log(`更新岩場數: ${stats.cragsUpdated}`)
  console.log(`更新路線數: ${stats.routesUpdated}`)
  console.log(`新增 YouTube 影片: ${stats.youtubeAdded}`)
  console.log(`新增 Instagram 貼文: ${stats.instagramAdded}`)

  if (stats.errors.length > 0) {
    console.log(`\n=== 警告/錯誤 (${stats.errors.length}) ===`)
    stats.errors.slice(0, 10).forEach((err) => console.log(`  - ${err}`))
    if (stats.errors.length > 10) {
      console.log(`  ... 還有 ${stats.errors.length - 10} 個錯誤`)
    }
  }

  console.log('\n完成!')
}

main()
