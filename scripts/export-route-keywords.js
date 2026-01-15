#!/usr/bin/env node
/**
 * 匯出路線關鍵字清單
 * 將岩場路線資料整理成關鍵字清單 CSV，按區域分組
 *
 * 使用方式:
 *   node scripts/export-route-keywords.js [crag-id]
 *
 * 範例:
 *   node scripts/export-route-keywords.js longdong
 *   node scripts/export-route-keywords.js          # 匯出所有岩場
 *
 * 輸出:
 *   output/keywords-{crag-id}.csv
 *   output/keywords-all.csv (所有岩場)
 */

const fs = require('fs')
const path = require('path')

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

// 提取路線主要名稱（去除括號內容）
function extractMainName(name) {
  if (!name) return ''
  return name.split(/[\(（]/)[0].trim()
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

// 處理單一岩場
function processCrag(cragId) {
  const data = readCragData(cragId)
  if (!data) return null

  const { crag, areas, routes } = data

  // 建立區域對照表
  const areaMap = {}
  for (const area of areas || []) {
    areaMap[area.id] = {
      name: area.name,
      nameEn: area.nameEn || '',
    }
  }

  // 按區域分組路線
  const routesByArea = {}
  for (const route of routes || []) {
    const areaId = route.areaId || 'unknown'
    if (!routesByArea[areaId]) {
      routesByArea[areaId] = []
    }
    routesByArea[areaId].push(route)
  }

  return {
    crag,
    areaMap,
    routesByArea,
    routes,
  }
}

// 主程式
function main() {
  const args = process.argv.slice(2)
  const targetCrag = args[0]

  console.log('=== 路線關鍵字匯出工具 ===\n')

  let cragsToProcess = []
  if (targetCrag) {
    cragsToProcess = [targetCrag]
  } else {
    cragsToProcess = getCragFiles()
  }

  console.log(`處理 ${cragsToProcess.length} 個岩場\n`)

  // 收集所有資料
  const allData = []

  for (const cragId of cragsToProcess) {
    console.log(`處理: ${cragId}`)
    const result = processCrag(cragId)
    if (result) {
      allData.push(result)

      // 輸出單一岩場 CSV
      const csvRows = [
        ['岩場', '岩場英文', '區域', '區域英文', '路線ID', '路線名稱', '路線英文名', '難度', '搜尋關鍵字'].join(','),
      ]

      // 按區域排序
      const sortedAreaIds = Object.keys(result.routesByArea).sort((a, b) => {
        const aName = result.areaMap[a]?.name || ''
        const bName = result.areaMap[b]?.name || ''
        return aName.localeCompare(bName)
      })

      for (const areaId of sortedAreaIds) {
        const routes = result.routesByArea[areaId]
        const area = result.areaMap[areaId] || { name: '', nameEn: '' }

        for (const route of routes) {
          const mainName = extractMainName(route.name)
          const mainNameEn = extractMainName(route.nameEn)

          // 建立搜尋關鍵字
          const keywords = [result.crag.name, area.name, mainName]
            .filter((k) => k)
            .join(' ')

          csvRows.push(
            [
              escapeCSV(result.crag.name),
              escapeCSV(result.crag.nameEn),
              escapeCSV(area.name),
              escapeCSV(area.nameEn),
              escapeCSV(route.id),
              escapeCSV(route.name),
              escapeCSV(route.nameEn || ''),
              escapeCSV(route.grade),
              escapeCSV(keywords),
            ].join(',')
          )
        }
      }

      const outputPath = path.join(OUTPUT_DIR, `keywords-${cragId}.csv`)
      fs.writeFileSync(outputPath, '\uFEFF' + csvRows.join('\n'), 'utf-8')
      console.log(`  ✅ ${outputPath} (${result.routes.length} 條路線)`)
    }
  }

  // 如果處理多個岩場，輸出合併的 CSV
  if (allData.length > 1) {
    const csvRows = [
      ['岩場', '岩場英文', '區域', '區域英文', '路線ID', '路線名稱', '路線英文名', '難度', '搜尋關鍵字'].join(','),
    ]

    for (const data of allData) {
      const sortedAreaIds = Object.keys(data.routesByArea).sort((a, b) => {
        const aName = data.areaMap[a]?.name || ''
        const bName = data.areaMap[b]?.name || ''
        return aName.localeCompare(bName)
      })

      for (const areaId of sortedAreaIds) {
        const routes = data.routesByArea[areaId]
        const area = data.areaMap[areaId] || { name: '', nameEn: '' }

        for (const route of routes) {
          const mainName = extractMainName(route.name)
          const keywords = [data.crag.name, area.name, mainName]
            .filter((k) => k)
            .join(' ')

          csvRows.push(
            [
              escapeCSV(data.crag.name),
              escapeCSV(data.crag.nameEn),
              escapeCSV(area.name),
              escapeCSV(area.nameEn),
              escapeCSV(route.id),
              escapeCSV(route.name),
              escapeCSV(route.nameEn || ''),
              escapeCSV(route.grade),
              escapeCSV(keywords),
            ].join(',')
          )
        }
      }
    }

    const outputPath = path.join(OUTPUT_DIR, 'keywords-all.csv')
    fs.writeFileSync(outputPath, '\uFEFF' + csvRows.join('\n'), 'utf-8')
    console.log(`\n✅ 合併輸出: ${outputPath}`)
  }

  // 統計
  const totalRoutes = allData.reduce((sum, d) => sum + d.routes.length, 0)
  console.log(`\n總計: ${allData.length} 個岩場, ${totalRoutes} 條路線`)
}

main()
