#!/usr/bin/env node
/**
 * 生成種子數據 migration 腳本
 * 將 JSON 數據轉換為 D1 SQL INSERT 語句
 */

const fs = require('fs')
const path = require('path')

// 路徑配置
const DATA_DIR = path.join(__dirname, '../src/data')
const CRAGS_DIR = path.join(DATA_DIR, 'crags')
const PUBLIC_DATA_DIR = path.join(__dirname, '../public/data')
const MIGRATIONS_DIR = path.join(__dirname, '../backend/migrations')

// 轉義 SQL 字串
function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL'
  if (typeof str !== 'string') str = String(str)
  return `'${str.replace(/'/g, "''")}'`
}

// JSON 轉 SQL 字串
function jsonToSql(obj) {
  if (obj === null || obj === undefined) return 'NULL'
  return escapeSql(JSON.stringify(obj))
}

// 生成 gyms migration
function generateGymsMigration() {
  console.log('生成 gyms migration...')

  const gymsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'gyms.json'), 'utf8'))
  const gyms = gymsData.gyms

  let sql = `-- 岩館種子數據
-- 從 src/data/gyms.json 自動生成
-- 生成時間: ${new Date().toISOString()}

-- 清空現有數據
DELETE FROM gyms;

-- 插入岩館數據
`

  for (const gym of gyms) {
    sql += `INSERT INTO gyms (id, name, slug, description, address, city, region, latitude, longitude, phone, email, website, cover_image, is_featured, opening_hours, facilities, price_info, created_at, updated_at)
VALUES (
  ${escapeSql(gym.id)},
  ${escapeSql(gym.name)},
  ${escapeSql(gym.slug)},
  ${escapeSql(gym.description)},
  ${escapeSql(gym.location?.address)},
  ${escapeSql(gym.location?.city)},
  ${escapeSql(gym.location?.region)},
  ${gym.location?.latitude || 'NULL'},
  ${gym.location?.longitude || 'NULL'},
  ${escapeSql(gym.contact?.phone)},
  ${escapeSql(gym.contact?.email || null)},
  ${escapeSql(gym.contact?.website)},
  ${escapeSql(gym.coverImage)},
  ${gym.featured ? 1 : 0},
  ${jsonToSql(gym.openingHours)},
  ${jsonToSql(gym.facilities)},
  ${jsonToSql(gym.pricing)},
  ${escapeSql(gym.createdAt)},
  ${escapeSql(gym.updatedAt)}
);

`
  }

  console.log(`  - 共 ${gyms.length} 間岩館`)
  return sql
}

// 生成 crags 和 routes migration
function generateCragsMigration() {
  console.log('生成 crags 和 routes migration...')

  const cragFiles = fs.readdirSync(CRAGS_DIR).filter(f => f.endsWith('.json'))

  let sql = `-- 岩場和路線種子數據
-- 從 src/data/crags/*.json 自動生成
-- 生成時間: ${new Date().toISOString()}

-- 清空現有數據
DELETE FROM routes;
DELETE FROM crags;

-- 插入岩場數據
`

  let totalCrags = 0
  let totalRoutes = 0

  for (const file of cragFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(CRAGS_DIR, file), 'utf8'))
    const crag = data.crag
    const routes = data.routes || []

    totalCrags++

    sql += `-- ${crag.name}
INSERT INTO crags (id, name, slug, description, location, region, latitude, longitude, rock_type, climbing_types, difficulty_range, route_count, bolt_count, cover_image, images, is_featured, access_info, parking_info, approach_time, best_seasons, created_at, updated_at)
VALUES (
  ${escapeSql(crag.id)},
  ${escapeSql(crag.name)},
  ${escapeSql(crag.slug)},
  ${escapeSql(crag.description)},
  ${escapeSql(crag.location?.address)},
  ${escapeSql(crag.location?.region)},
  ${crag.location?.latitude || 'NULL'},
  ${crag.location?.longitude || 'NULL'},
  ${escapeSql(crag.rockType)},
  ${jsonToSql([crag.type])},
  ${escapeSql(crag.difficulty ? `${crag.difficulty.min}-${crag.difficulty.max}` : null)},
  ${crag.routesCount || routes.length},
  ${crag.boltCount || 0},
  ${escapeSql(crag.images?.[0] || null)},
  ${jsonToSql(crag.images)},
  ${crag.featured ? 1 : 0},
  ${escapeSql(crag.access?.approach)},
  ${escapeSql(crag.access?.parking)},
  NULL,
  ${jsonToSql(crag.seasons)},
  ${escapeSql(crag.createdAt)},
  ${escapeSql(crag.updatedAt)}
);

`

    // 插入路線
    for (const route of routes) {
      totalRoutes++
      sql += `INSERT INTO routes (id, crag_id, name, grade, grade_system, height, bolt_count, route_type, description, first_ascent, created_at)
VALUES (
  ${escapeSql(route.id)},
  ${escapeSql(crag.id)},
  ${escapeSql(route.name)},
  ${escapeSql(route.grade)},
  'yds',
  ${route.length || 'NULL'},
  ${route.bolts || 'NULL'},
  ${escapeSql(route.type || 'sport')},
  ${escapeSql(route.description || null)},
  ${escapeSql(route.firstAscent || null)},
  datetime('now')
);
`
    }

    sql += '\n'
  }

  console.log(`  - 共 ${totalCrags} 個岩場, ${totalRoutes} 條路線`)
  return sql
}

// 生成 videos migration (只插入基本資料，數量較大)
function generateVideosMigration() {
  console.log('生成 videos migration...')

  const videosPath = path.join(PUBLIC_DATA_DIR, 'videos.json')
  if (!fs.existsSync(videosPath)) {
    console.log('  - videos.json 不存在，跳過')
    return ''
  }

  const videos = JSON.parse(fs.readFileSync(videosPath, 'utf8'))

  let sql = `-- 影片種子數據
-- 從 public/data/videos.json 自動生成
-- 生成時間: ${new Date().toISOString()}

-- 清空現有數據
DELETE FROM videos;

-- 插入影片數據
`

  for (const video of videos) {
    const slug = video.youtubeId || video.id
    sql += `INSERT INTO videos (id, title, slug, description, youtube_id, thumbnail_url, category, tags, is_featured, published_at, created_at)
VALUES (
  ${escapeSql(video.id)},
  ${escapeSql(video.title)},
  ${escapeSql(slug)},
  ${escapeSql(video.description || null)},
  ${escapeSql(video.youtubeId)},
  ${escapeSql(video.thumbnailUrl)},
  ${escapeSql(video.category || null)},
  ${jsonToSql(video.tags || [])},
  0,
  ${escapeSql(video.publishedAt || null)},
  datetime('now')
);
`
  }

  console.log(`  - 共 ${videos.length} 部影片`)
  return sql
}

// 主函數
function main() {
  console.log('開始生成種子數據 migration...\n')

  // 獲取下一個 migration 編號
  const existingMigrations = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .map(f => parseInt(f.split('_')[0]))
    .filter(n => !isNaN(n))

  const nextNumber = Math.max(...existingMigrations, 0) + 1
  const paddedNumber = String(nextNumber).padStart(4, '0')

  // 生成 gyms migration
  const gymsSql = generateGymsMigration()
  const gymsPath = path.join(MIGRATIONS_DIR, `${paddedNumber}_seed_gyms.sql`)
  fs.writeFileSync(gymsPath, gymsSql)
  console.log(`  ✓ 已生成: ${path.basename(gymsPath)}`)

  // 生成 crags migration
  const cragsSql = generateCragsMigration()
  const cragsPath = path.join(MIGRATIONS_DIR, `${String(nextNumber + 1).padStart(4, '0')}_seed_crags_routes.sql`)
  fs.writeFileSync(cragsPath, cragsSql)
  console.log(`  ✓ 已生成: ${path.basename(cragsPath)}`)

  // 生成 videos migration
  const videosSql = generateVideosMigration()
  if (videosSql) {
    const videosPath = path.join(MIGRATIONS_DIR, `${String(nextNumber + 2).padStart(4, '0')}_seed_videos.sql`)
    fs.writeFileSync(videosPath, videosSql)
    console.log(`  ✓ 已生成: ${path.basename(videosPath)}`)
  }

  console.log('\n完成！請執行以下命令來運行 migration:')
  console.log('  cd backend && pnpm db:migrate:remote')
}

main()
