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
 *   - 會更新岩場資訊和路線的社群媒體欄位
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
  return workbook
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

// 解析逗號分隔文字為陣列
function parseCommaToArray(text) {
  if (!text || typeof text !== 'string') return []

  return text
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

// 解析交通方式文字為物件陣列
function parseTransportation(text, existingTransportation = []) {
  if (!text || typeof text !== 'string') return existingTransportation

  const lines = text.split('\n').filter((line) => line.trim())
  if (lines.length === 0) return existingTransportation

  return lines.map((line, index) => {
    const match = line.match(/^(.+?):\s*(.+)$/)
    if (match) {
      const existing = existingTransportation[index] || {}
      return {
        type: match[1].trim(),
        description: match[2].trim(),
        descriptionEn: existing.descriptionEn || '',
      }
    }
    return existingTransportation[index] || { type: '', description: line.trim(), descriptionEn: '' }
  })
}

// 解析英文交通方式文字
function parseTransportationEn(text, transportation = []) {
  if (!text || typeof text !== 'string') return transportation

  const lines = text.split('\n').filter((line) => line.trim())

  return transportation.map((t, index) => {
    const line = lines[index]
    if (line) {
      const match = line.match(/^(.+?):\s*(.+)$/)
      if (match) {
        return { ...t, descriptionEn: match[2].trim() }
      }
    }
    return t
  })
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

// 從岩場資訊工作表讀取資料並建立對照表
function readCragInfoSheet(workbook) {
  const sheet = workbook.Sheets['岩場資訊']
  if (!sheet) return null

  const data = XLSX.utils.sheet_to_json(sheet)
  // 轉換為 key-value 對照表
  const info = {}
  for (const row of data) {
    if (row['欄位'] && row['值'] !== undefined) {
      info[row['欄位']] = row['值']
    }
  }
  return info
}

// 更新岩場資訊
function updateCragInfo(crag, excelInfo) {
  const changes = []

  // 基本資訊
  if (excelInfo['名稱'] && excelInfo['名稱'] !== crag.name) {
    crag.name = excelInfo['名稱']
    changes.push('名稱')
  }
  if (excelInfo['英文名稱'] && excelInfo['英文名稱'] !== crag.nameEn) {
    crag.nameEn = excelInfo['英文名稱']
    changes.push('英文名稱')
  }

  // 位置資訊
  if (!crag.location) crag.location = {}
  if (excelInfo['地址'] !== undefined) {
    crag.location.address = excelInfo['地址']
  }
  if (excelInfo['英文地址'] !== undefined) {
    crag.location.addressEn = excelInfo['英文地址']
  }
  if (excelInfo['地區'] !== undefined) {
    crag.location.region = excelInfo['地區']
  }
  if (excelInfo['英文地區'] !== undefined) {
    crag.location.regionEn = excelInfo['英文地區']
  }

  // 描述
  if (excelInfo['描述'] !== undefined) {
    crag.description = excelInfo['描述']
  }
  if (excelInfo['英文描述'] !== undefined) {
    crag.descriptionEn = excelInfo['英文描述']
  }

  // 岩場類型
  if (excelInfo['岩場類型'] !== undefined) {
    crag.type = excelInfo['岩場類型']
  }
  if (excelInfo['岩質'] !== undefined) {
    crag.rockType = excelInfo['岩質']
  }
  if (excelInfo['英文岩質'] !== undefined) {
    crag.rockTypeEn = excelInfo['英文岩質']
  }

  // 難度
  if (!crag.difficulty) crag.difficulty = {}
  if (excelInfo['最低難度'] !== undefined) {
    crag.difficulty.min = String(excelInfo['最低難度'])
  }
  if (excelInfo['最高難度'] !== undefined) {
    crag.difficulty.max = String(excelInfo['最高難度'])
  }

  // 高度
  if (!crag.height) crag.height = { unit: 'm' }
  if (excelInfo['最低高度'] !== undefined) {
    crag.height.min = Number(excelInfo['最低高度']) || 0
  }
  if (excelInfo['最高高度'] !== undefined) {
    crag.height.max = Number(excelInfo['最高高度']) || 0
  }

  // 季節
  if (excelInfo['適合季節'] !== undefined) {
    crag.seasons = parseCommaToArray(excelInfo['適合季節'])
  }
  if (excelInfo['英文季節'] !== undefined) {
    crag.seasonsEn = parseCommaToArray(excelInfo['英文季節'])
  }

  // 交通資訊
  if (!crag.access) crag.access = {}
  if (excelInfo['接近時間'] !== undefined) {
    crag.access.approach = excelInfo['接近時間']
  }
  if (excelInfo['英文接近時間'] !== undefined) {
    crag.access.approachEn = excelInfo['英文接近時間']
  }
  if (excelInfo['停車場'] !== undefined) {
    crag.access.parking = excelInfo['停車場']
  }
  if (excelInfo['英文停車場'] !== undefined) {
    crag.access.parkingEn = excelInfo['英文停車場']
  }

  // 交通方式
  if (excelInfo['交通方式'] !== undefined) {
    crag.access.transportation = parseTransportation(
      excelInfo['交通方式'],
      crag.access.transportation || []
    )
  }
  if (excelInfo['英文交通方式'] !== undefined) {
    crag.access.transportation = parseTransportationEn(
      excelInfo['英文交通方式'],
      crag.access.transportation || []
    )
  }

  // 設施
  if (excelInfo['設施'] !== undefined) {
    crag.amenities = parseCommaToArray(excelInfo['設施'])
  }
  if (excelInfo['英文設施'] !== undefined) {
    crag.amenitiesEn = parseCommaToArray(excelInfo['英文設施'])
  }

  // 影片
  if (excelInfo['影片網址'] !== undefined) {
    crag.videoUrl = excelInfo['影片網址']
  }
  if (excelInfo['即時影像ID'] !== undefined) {
    crag.liveVideoId = excelInfo['即時影像ID']
  }
  if (excelInfo['即時影像標題'] !== undefined) {
    crag.liveVideoTitle = excelInfo['即時影像標題']
  }
  if (excelInfo['即時影像描述'] !== undefined) {
    crag.liveVideoDescription = excelInfo['即時影像描述']
  }

  // 圖片
  if (excelInfo['圖片'] !== undefined) {
    crag.images = parseMultilineToArray(excelInfo['圖片'])
  }

  // 精選
  if (excelInfo['精選'] !== undefined) {
    crag.featured = excelInfo['精選'] === '是' || excelInfo['精選'] === true
  }

  // 評分
  if (excelInfo['評分'] !== undefined && excelInfo['評分'] !== '') {
    crag.rating = Number(excelInfo['評分']) || crag.rating
  }

  // 狀態
  if (excelInfo['狀態'] !== undefined) {
    crag.status = excelInfo['狀態']
  }

  // 更新時間
  crag.updatedAt = new Date().toISOString()

  return changes
}

// 處理路線資料
function processRoutesSheet(workbook, stats) {
  const sheet = workbook.Sheets['路線資料']
  if (!sheet) {
    console.log('找不到「路線資料」工作表')
    return {}
  }

  const excelData = XLSX.utils.sheet_to_json(sheet)

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

  return cragGroups
}

// 更新路線的社群媒體連結
function updateRouteMedia(route, row, stats) {
  let hasChanges = false

  // 處理 YouTube 影片
  const youtubeRaw = row['YouTube影片']
  const youtubeUrls = parseMultilineToArray(youtubeRaw)
  const validYoutubeUrls = youtubeUrls.filter((url) => {
    if (isValidYoutubeUrl(url)) return true
    if (url) stats.errors.push(`無效的 YouTube URL: ${url} (路線: ${route.id})`)
    return false
  })

  if (validYoutubeUrls.length > 0) {
    route.youtubeVideos = validYoutubeUrls
    stats.youtubeAdded += validYoutubeUrls.length
    hasChanges = true
  } else if (route.youtubeVideos) {
    delete route.youtubeVideos
    hasChanges = true
  }

  // 處理 Instagram 貼文
  const instagramRaw = row['Instagram貼文']
  const instagramUrls = parseMultilineToArray(instagramRaw)
  const validInstagramUrls = instagramUrls.filter((url) => {
    if (isValidInstagramUrl(url)) return true
    if (url) stats.errors.push(`無效的 Instagram URL: ${url} (路線: ${route.id})`)
    return false
  })

  if (validInstagramUrls.length > 0) {
    route.instagramPosts = validInstagramUrls
    stats.instagramAdded += validInstagramUrls.length
    hasChanges = true
  } else if (route.instagramPosts) {
    delete route.instagramPosts
    hasChanges = true
  }

  return hasChanges
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

  const workbook = readExcelFile(filePath)
  if (!workbook) {
    process.exit(1)
  }

  const stats = {
    cragsUpdated: 0,
    cragInfoUpdated: false,
    routesUpdated: 0,
    youtubeAdded: 0,
    instagramAdded: 0,
    errors: [],
  }

  // 1. 處理岩場資訊工作表
  const cragInfo = readCragInfoSheet(workbook)
  let targetCragId = null

  if (cragInfo && cragInfo['岩場ID']) {
    targetCragId = cragInfo['岩場ID']
    console.log(`處理岩場資訊: ${targetCragId}`)

    const cragData = readCragData(targetCragId)
    if (cragData) {
      const changes = updateCragInfo(cragData.crag, cragInfo)
      if (changes.length > 0) {
        stats.cragInfoUpdated = true
        console.log(`  岩場資訊已更新`)
      }

      // 2. 處理路線資料工作表
      const cragGroups = processRoutesSheet(workbook, stats)

      if (cragGroups[targetCragId]) {
        const rows = cragGroups[targetCragId]
        console.log(`處理路線資料: ${rows.length} 條`)

        // 建立路線 ID 對照表
        const routeMap = {}
        for (const route of cragData.routes) {
          routeMap[route.id] = route
        }

        let routesUpdatedInCrag = 0

        for (const row of rows) {
          const routeId = row['路線ID']
          if (!routeId) continue

          const route = routeMap[routeId]
          if (!route) {
            stats.errors.push(`找不到路線: ${routeId}`)
            continue
          }

          if (updateRouteMedia(route, row, stats)) {
            routesUpdatedInCrag++
          }
        }

        stats.routesUpdated = routesUpdatedInCrag
      }

      // 寫入更新後的資料
      if (stats.cragInfoUpdated || stats.routesUpdated > 0) {
        writeCragData(targetCragId, cragData)
        stats.cragsUpdated = 1
      } else {
        console.log('  無變更')
      }
    }
  } else {
    // 沒有岩場資訊工作表，只處理路線資料
    const cragGroups = processRoutesSheet(workbook, stats)

    console.log(`找到 ${Object.keys(cragGroups).length} 個岩場的路線資料\n`)

    for (const [cragId, rows] of Object.entries(cragGroups)) {
      console.log(`處理岩場: ${cragId} (${rows.length} 條路線)`)

      const cragData = readCragData(cragId)
      if (!cragData) {
        stats.errors.push(`找不到岩場: ${cragId}`)
        continue
      }

      const routeMap = {}
      for (const route of cragData.routes) {
        routeMap[route.id] = route
      }

      let routesUpdatedInCrag = 0

      for (const row of rows) {
        const routeId = row['路線ID']
        if (!routeId) continue

        const route = routeMap[routeId]
        if (!route) {
          stats.errors.push(`找不到路線: ${routeId} (岩場: ${cragId})`)
          continue
        }

        if (updateRouteMedia(route, row, stats)) {
          routesUpdatedInCrag++
        }
      }

      if (routesUpdatedInCrag > 0) {
        writeCragData(cragId, cragData)
        stats.cragsUpdated++
        stats.routesUpdated += routesUpdatedInCrag
        console.log(`  更新了 ${routesUpdatedInCrag} 條路線`)
      } else {
        console.log(`  無變更`)
      }
    }
  }

  // 輸出統計
  console.log('\n=== 匯入統計 ===')
  console.log(`更新岩場數: ${stats.cragsUpdated}`)
  if (stats.cragInfoUpdated) {
    console.log(`岩場資訊: 已更新`)
  }
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
