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
 *
 * Excel 工作表:
 *   1. 岩場資訊 - 岩場基本資料
 *   2. 路線資料 - 所有路線清單
 *   3. 編輯說明 - 欄位格式說明
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

// 將岩場資訊轉換成 Excel 格式（垂直排列，欄位名稱在左，值在右）
function cragToExcelData(crag) {
  // 處理交通方式為多行文字
  const transportationText = (crag.access?.transportation || [])
    .map((t) => `${t.type}: ${t.description}`)
    .join('\n')

  const transportationTextEn = (crag.access?.transportation || [])
    .map((t) => `${t.type}: ${t.descriptionEn || ''}`)
    .join('\n')

  return [
    { 欄位: '岩場ID', 值: crag.id, 說明: '🔒 請勿修改' },
    { 欄位: 'slug', 值: crag.slug, 說明: '🔒 請勿修改' },
    { 欄位: '名稱', 值: crag.name, 說明: '' },
    { 欄位: '英文名稱', 值: crag.nameEn, 說明: '' },
    { 欄位: '地址', 值: crag.location?.address || '', 說明: '' },
    { 欄位: '英文地址', 值: crag.location?.addressEn || '', 說明: '' },
    { 欄位: '地區', 值: crag.location?.region || '', 說明: '如：北部、中部、南部、東部' },
    { 欄位: '英文地區', 值: crag.location?.regionEn || '', 說明: '' },
    { 欄位: '緯度', 值: crag.location?.latitude || '', 說明: '🔒 請勿修改' },
    { 欄位: '經度', 值: crag.location?.longitude || '', 說明: '🔒 請勿修改' },
    { 欄位: '描述', 值: crag.description || '', 說明: '' },
    { 欄位: '英文描述', 值: crag.descriptionEn || '', 說明: '' },
    { 欄位: '岩場類型', 值: crag.type || '', 說明: 'boulder / sport / trad / mixed' },
    { 欄位: '岩質', 值: crag.rockType || '', 說明: '' },
    { 欄位: '英文岩質', 值: crag.rockTypeEn || '', 說明: '' },
    { 欄位: '路線數量', 值: crag.routesCount || 0, 說明: '🔒 自動計算' },
    { 欄位: '最低難度', 值: crag.difficulty?.min || '', 說明: '' },
    { 欄位: '最高難度', 值: crag.difficulty?.max || '', 說明: '' },
    { 欄位: '最低高度', 值: crag.height?.min || '', 說明: '單位：公尺' },
    { 欄位: '最高高度', 值: crag.height?.max || '', 說明: '單位：公尺' },
    { 欄位: '適合季節', 值: (crag.seasons || []).join(', '), 說明: '春, 夏, 秋, 冬（逗號分隔）' },
    {
      欄位: '英文季節',
      值: (crag.seasonsEn || []).join(', '),
      說明: 'Spring, Summer, Autumn, Winter',
    },
    { 欄位: '接近時間', 值: crag.access?.approach || '', 說明: '' },
    { 欄位: '英文接近時間', 值: crag.access?.approachEn || '', 說明: '' },
    { 欄位: '停車場', 值: crag.access?.parking || '', 說明: '' },
    { 欄位: '英文停車場', 值: crag.access?.parkingEn || '', 說明: '' },
    { 欄位: '交通方式', 值: transportationText, 說明: '格式：類型: 說明（每行一種）' },
    { 欄位: '英文交通方式', 值: transportationTextEn, 說明: '' },
    { 欄位: '設施', 值: (crag.amenities || []).join(', '), 說明: '逗號分隔' },
    { 欄位: '英文設施', 值: (crag.amenitiesEn || []).join(', '), 說明: '' },
    { 欄位: '影片網址', 值: crag.videoUrl || '', 說明: 'YouTube 影片連結' },
    { 欄位: '即時影像ID', 值: crag.liveVideoId || '', 說明: 'YouTube 影片 ID' },
    { 欄位: '即時影像標題', 值: crag.liveVideoTitle || '', 說明: '' },
    { 欄位: '即時影像描述', 值: crag.liveVideoDescription || '', 說明: '' },
    { 欄位: '圖片', 值: (crag.images || []).join('\n'), 說明: '每行一個圖片路徑' },
    { 欄位: '精選', 值: crag.featured ? '是' : '否', 說明: '是 / 否' },
    { 欄位: '評分', 值: crag.rating || '', 說明: '1-5' },
    { 欄位: '狀態', 值: crag.status || 'published', 說明: 'published / draft' },
  ]
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
  const data = readCragData(cragId)
  if (!data) return false

  const { crag, areas, routes } = data

  if (!routes || routes.length === 0) {
    return false
  }

  const areaMap = buildAreaMap(areas || [])

  // 建立工作簿
  const workbook = XLSX.utils.book_new()

  // 1. 岩場資訊工作表
  const cragExcelData = cragToExcelData(crag)
  const cragSheet = XLSX.utils.json_to_sheet(cragExcelData)
  cragSheet['!cols'] = [{ wch: 15 }, { wch: 60 }, { wch: 35 }]
  XLSX.utils.book_append_sheet(workbook, cragSheet, '岩場資訊')

  // 2. 路線資料工作表
  const routesExcelData = routesToExcelData(routes, areaMap, crag.id, crag.name)
  const routesSheet = XLSX.utils.json_to_sheet(routesExcelData)
  routesSheet['!cols'] = [
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
  XLSX.utils.book_append_sheet(workbook, routesSheet, '路線資料')

  // 3. 編輯說明工作表
  const instructionData = [
    { 欄位: '🔒 標記', 說明: '標有 🔒 的欄位為系統識別用，請勿修改' },
    { 欄位: '---', 說明: '--- 岩場資訊 ---' },
    { 欄位: '適合季節', 說明: '使用逗號分隔，如：春, 秋, 冬' },
    { 欄位: '交通方式', 說明: '每行一種，格式：類型: 說明' },
    { 欄位: '設施', 說明: '使用逗號分隔，如：停車場, 廁所, 海灘' },
    { 欄位: '圖片', 說明: '每行一個圖片路徑' },
    { 欄位: '---', 說明: '--- 路線資料 ---' },
    { 欄位: 'YouTube影片', 說明: '每行一個連結，支援 youtube.com/watch?v=xxx, youtu.be/xxx' },
    {
      欄位: 'Instagram貼文',
      說明: '每行一個連結，支援 instagram.com/p/xxx, instagram.com/reel/xxx',
    },
    { 欄位: '---', 說明: '--- 操作說明 ---' },
    { 欄位: '儲存格換行', 說明: 'Windows: Alt+Enter / Mac: Option+Enter' },
  ]
  const instructionSheet = XLSX.utils.json_to_sheet(instructionData)
  instructionSheet['!cols'] = [{ wch: 15 }, { wch: 70 }]
  XLSX.utils.book_append_sheet(workbook, instructionSheet, '編輯說明')

  // 寫入檔案
  const outputPath = path.join(OUTPUT_DIR, `routes-${cragId}.xlsx`)
  XLSX.writeFile(workbook, outputPath)

  return true
}

// 主程式
function main() {
  const args = process.argv.slice(2)
  const targetCrag = args[0]

  if (targetCrag) {
    // 匯出指定岩場
    const success = exportCrag(targetCrag)
    if (!success) {
      process.exit(1)
    }
  } else {
    // 匯出所有岩場
    const crags = getCragFiles()

    let _successCount = 0
    for (const cragId of crags) {
      if (exportCrag(cragId)) {
        _successCount++
      }
    }
  }
}

main()
