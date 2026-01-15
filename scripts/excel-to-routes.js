#!/usr/bin/env node
/**
 * 路線資料匯入腳本
 * 將編輯過的 Excel 檔案匯入回岩場 JSON 檔案
 *
 * 使用方式:
 *   node scripts/excel-to-routes.js <excel-file>
 *
 * 範例:
 *   node scripts/excel-to-routes.js output/routes-longdong.xlsx
 *
 * 注意:
 *   - 此腳本會直接修改 src/data/crags/*.json 檔案
 *   - 建議先備份原始檔案或使用 git 追蹤變更
 *   - 只會更新 YouTube影片 和 Instagram貼文 欄位
 */

const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')

// 路徑設定
const CRAGS_DIR = path.join(__dirname, '../src/data/crags')

// 讀取 Excel 檔案
function readExcelFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`錯誤: 找不到檔案 ${filePath}`)
    return null
  }

  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0] // 讀取第一個工作表

  if (!sheetName) {
    console.error('錯誤: Excel 檔案沒有工作表')
    return null
  }

  const worksheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json(worksheet)
}

// 讀取岩場 JSON 檔案
function readCragData(cragId) {
  const filePath = path.join(CRAGS_DIR, `${cragId}.json`)
  if (!fs.existsSync(filePath)) {
    console.error(`錯誤: 找不到岩場檔案 ${filePath}`)
    return null
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

// 寫入岩場 JSON 檔案
function writeCragData(cragId, data) {
  const filePath = path.join(CRAGS_DIR, `${cragId}.json`)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  console.log(`  已寫入: ${filePath}`)
}

// 解析多行文字為陣列 (過濾空行)
function parseMultilineToArray(text) {
  if (!text || typeof text !== 'string') return []

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
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

// 處理 Excel 資料，更新 JSON
function processExcelData(excelData) {
  // 按岩場ID分組
  const cragGroups = {}
  for (const row of excelData) {
    const cragId = row['岩場ID']
    if (!cragId) continue

    if (!cragGroups[cragId]) {
      cragGroups[cragId] = []
    }
    cragGroups[cragId].push(row)
  }

  console.log(`找到 ${Object.keys(cragGroups).length} 個岩場的資料\n`)

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

    // 建立路線 ID 對照表
    const routeMap = {}
    for (const route of cragData.routes) {
      routeMap[route.id] = route
    }

    let cragHasChanges = false
    let routesUpdatedInCrag = 0

    // 更新路線資料
    for (const row of rows) {
      const routeId = row['路線ID']
      if (!routeId) continue

      const route = routeMap[routeId]
      if (!route) {
        stats.errors.push(`找不到路線: ${routeId} (岩場: ${cragId})`)
        continue
      }

      let routeHasChanges = false

      // 處理 YouTube 影片
      const youtubeRaw = row['YouTube影片']
      const youtubeUrls = parseMultilineToArray(youtubeRaw)
      const validYoutubeUrls = youtubeUrls.filter((url) => {
        if (isValidYoutubeUrl(url)) return true
        if (url) stats.errors.push(`無效的 YouTube URL: ${url} (路線: ${routeId})`)
        return false
      })

      if (validYoutubeUrls.length > 0) {
        route.youtubeVideos = validYoutubeUrls
        stats.youtubeAdded += validYoutubeUrls.length
        routeHasChanges = true
      } else if (route.youtubeVideos) {
        // 如果 Excel 中清空了，也清空 JSON
        delete route.youtubeVideos
        routeHasChanges = true
      }

      // 處理 Instagram 貼文
      const instagramRaw = row['Instagram貼文']
      const instagramUrls = parseMultilineToArray(instagramRaw)
      const validInstagramUrls = instagramUrls.filter((url) => {
        if (isValidInstagramUrl(url)) return true
        if (url) stats.errors.push(`無效的 Instagram URL: ${url} (路線: ${routeId})`)
        return false
      })

      if (validInstagramUrls.length > 0) {
        route.instagramPosts = validInstagramUrls
        stats.instagramAdded += validInstagramUrls.length
        routeHasChanges = true
      } else if (route.instagramPosts) {
        // 如果 Excel 中清空了，也清空 JSON
        delete route.instagramPosts
        routeHasChanges = true
      }

      if (routeHasChanges) {
        routesUpdatedInCrag++
        cragHasChanges = true
      }
    }

    // 寫入更新後的資料
    if (cragHasChanges) {
      writeCragData(cragId, cragData)
      stats.cragsUpdated++
      stats.routesUpdated += routesUpdatedInCrag
      console.log(`  更新了 ${routesUpdatedInCrag} 條路線`)
    } else {
      console.log(`  無變更`)
    }
  }

  return stats
}

// 主程式
function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('使用方式: node scripts/excel-to-routes.js <excel-file>')
    console.log('')
    console.log('範例:')
    console.log('  node scripts/excel-to-routes.js output/routes-longdong.xlsx')
    process.exit(1)
  }

  const excelFile = args[0]
  const filePath = path.isAbsolute(excelFile) ? excelFile : path.join(process.cwd(), excelFile)

  console.log('=== 路線資料匯入工具 ===\n')
  console.log(`讀取檔案: ${filePath}\n`)

  const excelData = readExcelFile(filePath)
  if (!excelData) {
    process.exit(1)
  }

  console.log(`Excel 共有 ${excelData.length} 筆資料\n`)

  const stats = processExcelData(excelData)

  // 輸出統計
  console.log('\n=== 匯入統計 ===')
  console.log(`更新岩場數: ${stats.cragsUpdated}`)
  console.log(`更新路線數: ${stats.routesUpdated}`)
  console.log(`新增 YouTube 影片: ${stats.youtubeAdded}`)
  console.log(`新增 Instagram 貼文: ${stats.instagramAdded}`)

  if (stats.errors.length > 0) {
    console.log(`\n=== 警告/錯誤 (${stats.errors.length}) ===`)
    stats.errors.forEach((err) => console.log(`  - ${err}`))
  }

  console.log('\n完成!')
}

main()
