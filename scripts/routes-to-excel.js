#!/usr/bin/env node
/**
 * 路線資料匯出腳本
 * 將岩場 JSON 檔案中的路線資料匯出成 Excel 檔案
 *
 * 使用方式:
 *   node scripts/routes-to-excel.js [crag-id]
 *
 * 範例:
 *   node scripts/routes-to-excel.js longdong
 *   node scripts/routes-to-excel.js          # 匯出所有岩場
 *
 * 輸出:
 *   output/routes-{crag-id}.xlsx
 */

const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')

// 路徑設定
const CRAGS_DIR = path.join(__dirname, '../src/data/crags')
const OUTPUT_DIR = path.join(__dirname, '../output')

// 確保輸出目錄存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

// 取得所有岩場檔案
function getCragFiles() {
  return fs
    .readdirSync(CRAGS_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace('.json', ''))
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

// 建立 area 名稱對照表
function buildAreaMap(areas) {
  const map = {}
  for (const area of areas) {
    map[area.id] = area.name
  }
  return map
}

// 將路線資料轉換成 Excel 格式
function routesToExcelData(routes, areaMap, cragId, cragName) {
  return routes.map((route) => ({
    // 基本識別資訊
    岩場ID: cragId,
    岩場名稱: cragName,
    路線ID: route.id,

    // 區域資訊
    區域ID: route.areaId || '',
    區域名稱: areaMap[route.areaId] || '',
    分區: route.sector || '',
    分區英文: route.sectorEn || '',

    // 路線基本資訊
    路線名稱: route.name || '',
    路線英文名: route.nameEn || '',
    難度: route.grade || '',
    類型: route.type || '',
    類型英文: route.typeEn || '',
    長度: route.length || '',

    // 首攀資訊
    首攀者: route.firstAscent || '',
    首攀者英文: route.firstAscentEn || '',

    // 路線描述
    描述: route.description || '',
    安全評級: route.safetyRating || '',
    bolt數量: route.boltCount || 0,
    狀態: route.status || 'published',

    // 社群媒體連結 (新增欄位)
    YouTube影片: (route.youtubeVideos || []).join('\n'),
    Instagram貼文: (route.instagramPosts || []).join('\n'),
  }))
}

// 匯出單一岩場
function exportCrag(cragId) {
  console.log(`處理岩場: ${cragId}`)

  const data = readCragData(cragId)
  if (!data) return false

  const { crag, areas, routes } = data

  if (!routes || routes.length === 0) {
    console.log(`  跳過: ${cragId} 沒有路線資料`)
    return false
  }

  const areaMap = buildAreaMap(areas || [])
  const excelData = routesToExcelData(routes, areaMap, crag.id, crag.name)

  // 建立工作表
  const worksheet = XLSX.utils.json_to_sheet(excelData)

  // 設定欄位寬度
  const colWidths = [
    { wch: 12 }, // 岩場ID
    { wch: 10 }, // 岩場名稱
    { wch: 20 }, // 路線ID
    { wch: 15 }, // 區域ID
    { wch: 12 }, // 區域名稱
    { wch: 12 }, // 分區
    { wch: 15 }, // 分區英文
    { wch: 20 }, // 路線名稱
    { wch: 25 }, // 路線英文名
    { wch: 8 }, // 難度
    { wch: 10 }, // 類型
    { wch: 12 }, // 類型英文
    { wch: 8 }, // 長度
    { wch: 20 }, // 首攀者
    { wch: 20 }, // 首攀者英文
    { wch: 40 }, // 描述
    { wch: 10 }, // 安全評級
    { wch: 10 }, // bolt數量
    { wch: 10 }, // 狀態
    { wch: 50 }, // YouTube影片
    { wch: 50 }, // Instagram貼文
  ]
  worksheet['!cols'] = colWidths

  // 建立工作簿
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '路線資料')

  // 新增說明工作表
  const instructionData = [
    { 欄位: 'YouTube影片', 說明: '每行一個 YouTube 連結，支援格式：youtube.com/watch?v=xxx, youtu.be/xxx' },
    { 欄位: 'Instagram貼文', 說明: '每行一個 Instagram 連結，支援格式：instagram.com/p/xxx, instagram.com/reel/xxx' },
    { 欄位: '注意事項', 說明: '請勿修改「岩場ID」、「路線ID」、「區域ID」欄位，這些是系統識別用的關鍵欄位' },
  ]
  const instructionSheet = XLSX.utils.json_to_sheet(instructionData)
  instructionSheet['!cols'] = [{ wch: 15 }, { wch: 80 }]
  XLSX.utils.book_append_sheet(workbook, instructionSheet, '編輯說明')

  // 寫入檔案
  const outputPath = path.join(OUTPUT_DIR, `routes-${cragId}.xlsx`)
  XLSX.writeFile(workbook, outputPath)

  console.log(`  完成: ${outputPath} (${routes.length} 條路線)`)
  return true
}

// 主程式
function main() {
  const args = process.argv.slice(2)
  const targetCrag = args[0]

  console.log('=== 路線資料匯出工具 ===\n')

  if (targetCrag) {
    // 匯出指定岩場
    const success = exportCrag(targetCrag)
    if (!success) {
      process.exit(1)
    }
  } else {
    // 匯出所有岩場
    const crags = getCragFiles()
    console.log(`找到 ${crags.length} 個岩場檔案\n`)

    let successCount = 0
    for (const cragId of crags) {
      if (exportCrag(cragId)) {
        successCount++
      }
    }

    console.log(`\n總計匯出 ${successCount} 個岩場`)
  }

  console.log(`\n輸出目錄: ${OUTPUT_DIR}`)
}

main()
