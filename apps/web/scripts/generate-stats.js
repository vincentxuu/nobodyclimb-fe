#!/usr/bin/env node
/**
 * 生成統計數據 JSON 檔案
 * 在 build 時執行，計算岩館、岩場、路線、影片數量
 *
 * 使用方式: node scripts/generate-stats.js
 */

const fs = require('fs')
const path = require('path')

// 路徑配置
const DATA_DIR = path.join(__dirname, '../src/data')
const CRAGS_DIR = path.join(DATA_DIR, 'crags')
const PUBLIC_DATA_DIR = path.join(__dirname, '../public/data')
const OUTPUT_PATH = path.join(PUBLIC_DATA_DIR, 'stats.json')

function main() {
  // 1. 計算岩館數量
  const gymsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'gyms.json'), 'utf8'))
  const gymsCount = gymsData.gyms?.length ?? 0

  // 2. 計算岩場和路線數量
  const cragFiles = fs.readdirSync(CRAGS_DIR).filter((f) => f.endsWith('.json'))
  const cragsCount = cragFiles.length

  let routesCount = 0
  for (const file of cragFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(CRAGS_DIR, file), 'utf8'))
    // 優先使用 crag.routesCount，否則計算 routes 陣列長度
    routesCount += data.crag?.routesCount ?? data.routes?.length ?? 0
  }

  // 3. 計算影片數量
  const videosPath = path.join(PUBLIC_DATA_DIR, 'videos.json')
  let videosCount = 0
  if (fs.existsSync(videosPath)) {
    const videosData = JSON.parse(fs.readFileSync(videosPath, 'utf8'))
    videosCount = Array.isArray(videosData) ? videosData.length : 0
  }

  // 4. 生成統計 JSON
  const stats = {
    gyms: gymsCount,
    crags: cragsCount,
    routes: routesCount,
    videos: videosCount,
    // biographies 和 posts 從後端 API 讀取
    generatedAt: new Date().toISOString(),
  }

  // 確保目錄存在
  if (!fs.existsSync(PUBLIC_DATA_DIR)) {
    fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true })
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(stats, null, 2))
}

main()
