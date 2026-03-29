#!/usr/bin/env tsx
/**
 * JSON → D1 遷移腳本
 * 將現有的 JSON 靜態資料遷移到 D1 資料庫
 *
 * Usage:
 *   pnpm migrate:json           # 執行遷移
 *   pnpm migrate:json --dry-run # 預覽模式
 */

import { readdirSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { config } from './config.js'
import type {
  CragJsonArea,
  CragJsonFullData,
  CragJsonSector,
  CragSheetRow,
  RouteSheetRow,
} from './types.js'
import {
  buildRouteExtendedSQL,
  buildRouteVideoSQL,
  buildVideoSQL,
  type CragMetadataUpdate,
  executeBatchD1Query,
  type RouteExtendedFields,
  updateCragMetadata,
  updateCragRouteCount,
  upsertArea,
  upsertCrag,
  upsertSector,
  type VideoMetadata,
} from './utils/d1.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Video metadata JSON 路徑
const VIDEO_METADATA_PATH = join(__dirname, '../../../apps/web/public/data/video-metadata.json')

// ============================================
// JSON to Sheet Row Converters
// ============================================

function jsonToCragRow(json: CragJsonFullData): CragSheetRow {
  const crag = json.crag

  // Determine climbing types from routes
  const routeTypes = new Set(json.routes.map((r) => r.type?.toLowerCase() || 'sport'))
  const climbingTypes = Array.from(routeTypes).filter((t) =>
    ['sport', 'trad', 'boulder', 'mixed'].includes(t)
  )

  // Calculate difficulty range from routes
  let difficultyRange = ''
  if (crag.difficulty) {
    difficultyRange = `${crag.difficulty.min}-${crag.difficulty.max}`
  }

  // Handle nested location object or flat fields
  const location = crag.location || {}
  const region = location.region || crag.region || '北部'
  const address = location.address || crag.address || ''
  const latitude = location.latitude || crag.latitude || 0
  const longitude = location.longitude || crag.longitude || 0

  // Handle nested access object or flat fields
  const access = crag.access || {}
  const approach = access.approach || crag.approach
  const parking = access.parking || crag.parking

  return {
    status: 'approved',
    id: crag.id || crag.slug,
    name: crag.name,
    nameEn: crag.nameEn,
    slug: crag.slug,
    region: region as CragSheetRow['region'],
    location: address,
    latitude,
    longitude,
    altitude: undefined,
    rockType: crag.rockType,
    climbingTypes: climbingTypes.join(',') || 'sport',
    difficultyRange,
    description: crag.description,
    accessInfo: approach,
    parkingInfo: parking,
    approachTime: undefined,
    bestSeasons: crag.seasons?.join(','),
    restrictions: undefined,
    coverImage: crag.images?.[0],
    isFeatured: crag.featured || false,
    submittedBy: 'migration@nobodyclimb.cc',
    submittedAt: new Date().toISOString(),
    reviewedBy: 'migration@nobodyclimb.cc',
    reviewedAt: new Date().toISOString(),
    reviewNotes: 'Migrated from static JSON',
  }
}

function jsonToRouteRow(route: CragJsonFullData['routes'][0], cragSlug: string): RouteSheetRow {
  // Determine grade system based on grade format
  let gradeSystem: RouteSheetRow['gradeSystem'] = 'yds'
  if (route.grade.startsWith('V')) {
    gradeSystem = 'v-scale'
  } else if (/^\d+[a-c]?\+?$/.test(route.grade)) {
    gradeSystem = 'french'
  }

  // Map route type
  let routeType: RouteSheetRow['routeType'] = 'sport'
  const type = route.type?.toLowerCase()
  if (type === 'trad' || type === 'traditional') {
    routeType = 'trad'
  } else if (type === 'boulder' || type === 'bouldering') {
    routeType = 'boulder'
  } else if (type === 'mixed') {
    routeType = 'mixed'
  }

  return {
    status: 'approved',
    id: route.id || `${cragSlug}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    cragSlug,
    areaId: route.areaId,
    sector: route.sector,
    name: route.name,
    grade: route.grade,
    gradeSystem,
    routeType,
    length: route.length,
    boltCount: route.boltCount,
    boltType: route.boltType,
    anchorType: route.anchorType,
    description: route.description,
    firstAscent: route.firstAscent,
    firstAscentDate: route.firstAscentDate,
    protection: route.protection,
    tips: route.tips,
    submittedBy: 'migration@nobodyclimb.cc',
    submittedAt: new Date().toISOString(),
  }
}

// ============================================
// Video Metadata Loading
// ============================================

interface VideoMetadataJson {
  [videoId: string]: {
    title: string
    channel: string
    channelId: string
    uploadDate: string
    duration: number
    viewCount: number
    thumbnailUrl: string
  }
}

function loadVideoMetadata(): Map<string, VideoMetadata> {
  const map = new Map<string, VideoMetadata>()

  try {
    const content = readFileSync(VIDEO_METADATA_PATH, 'utf-8')
    const data = JSON.parse(content) as VideoMetadataJson

    for (const [videoId, meta] of Object.entries(data)) {
      map.set(videoId, {
        id: videoId,
        title: meta.title,
        channel: meta.channel,
        channelId: meta.channelId,
        uploadDate: meta.uploadDate,
        duration: meta.duration,
        viewCount: meta.viewCount,
        thumbnailUrl: meta.thumbnailUrl,
      })
    }
  } catch (error) {
    console.error(
      `   ✗ Failed to load video metadata:`,
      error instanceof Error ? error.message : error
    )
  }

  return map
}

/**
 * 從 YouTube URL 提取 video ID
 */
function extractYouTubeVideoId(url: string): string | null {
  // 格式: https://www.youtube.com/watch?v=VIDEO_ID
  const vMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (vMatch) return vMatch[1]

  // 格式: https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return shortMatch[1]

  return null
}

// ============================================
// Migration Logic
// ============================================

function loadJsonFiles(): CragJsonFullData[] {
  const dataPath = join(__dirname, config.jsonDataPath)

  let files: string[]
  try {
    files = readdirSync(dataPath).filter((f) => f.endsWith('.json'))
  } catch {
    console.error(`❌ Cannot read directory: ${dataPath}`)

    process.exit(1)
  }

  const crags: CragJsonFullData[] = []

  for (const file of files) {
    const filePath = join(dataPath, file)
    try {
      const content = readFileSync(filePath, 'utf-8')
      const data = JSON.parse(content) as CragJsonFullData
      crags.push(data)
    } catch (error) {
      console.error(`   ✗ Failed to load ${file}:`, error instanceof Error ? error.message : error)
    }
  }

  return crags
}

// Build sector name → sector ID mapping for a crag
function buildSectorNameToIdMap(areas: CragJsonArea[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const area of areas) {
    if (area.sectors) {
      for (const sector of area.sectors as CragJsonSector[]) {
        // Map by sector name (用於 route.sector 文字比對)
        map.set(sector.name, sector.id)
        // Also map by sector ID in case route uses ID
        map.set(sector.id, sector.id)
      }
    }
  }
  return map
}

// Build sector ID → area ID mapping
function buildSectorToAreaMap(areas: CragJsonArea[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const area of areas) {
    if (area.sectors) {
      for (const sector of area.sectors as CragJsonSector[]) {
        map.set(sector.id, area.id)
      }
    }
  }
  return map
}

function migrateToD1(
  crags: CragJsonFullData[],
  videoMetadata: Map<string, VideoMetadata>,
  dryRun: boolean
): void {
  let _totalCrags = 0
  let _totalAreas = 0
  let _totalSectors = 0
  let _totalRoutes = 0
  let _totalVideos = 0
  let _totalRouteVideos = 0

  // ============================================
  // Step 0: 遷移影片 metadata
  // ============================================
  if (!dryRun && videoMetadata.size > 0) {
    const videoSQLs: string[] = []
    for (const video of videoMetadata.values()) {
      videoSQLs.push(buildVideoSQL(video))
    }

    const { success: videoCount, failed: videoFailed } = executeBatchD1Query(videoSQLs, 50)
    _totalVideos = videoCount
    if (videoFailed > 0) {
    } else {
    }
  } else if (dryRun) {
  }

  // ============================================
  // Step 1-6: 遷移岩場、區域、路線
  // ============================================
  for (const cragData of crags) {
    const cragRow = jsonToCragRow(cragData)
    const cragId = cragRow.id || cragRow.slug
    const areas = cragData.areas || []

    // Build lookup maps
    const sectorNameToId = buildSectorNameToIdMap(areas)
    const sectorToArea = buildSectorToAreaMap(areas)

    // 統計有 YouTube 影片的路線數
    const _routesWithVideos = cragData.routes.filter(
      (r) => r.youtubeVideos && r.youtubeVideos.length > 0
    )

    if (dryRun) {
      // Show areas and sectors
      for (const area of areas) {
        const _sectors = (area.sectors as CragJsonSector[]) || []
      }
    } else {
      try {
        // 1. Upsert crag
        upsertCrag(cragRow)
        _totalCrags++

        // 2. Upsert areas
        let areaCount = 0
        for (let i = 0; i < areas.length; i++) {
          const area = areas[i]
          try {
            upsertArea(area, cragId, i)
            areaCount++

            // 3. Upsert sectors for this area
            const sectors = (area.sectors as CragJsonSector[]) || []
            for (let j = 0; j < sectors.length; j++) {
              const sector = sectors[j]
              try {
                upsertSector(sector, area.id, j)
                _totalSectors++
              } catch (error) {
                console.error(
                  `   ✗ Failed to migrate sector "${sector.name}":`,
                  error instanceof Error ? error.message : error
                )
              }
            }
          } catch (error) {
            console.error(
              `   ✗ Failed to migrate area "${area.name}":`,
              error instanceof Error ? error.message : error
            )
          }
        }
        _totalAreas += areaCount

        // 4. Batch upsert routes with extended fields
        const routeSQLs: string[] = []
        const routeVideoSQLs: string[] = []

        for (const route of cragData.routes) {
          const routeRow = jsonToRouteRow(route, cragRow.slug)
          const routeId = routeRow.id

          // Resolve area_id and sector_id
          let areaId: string | null = route.areaId || null
          let sectorId: string | null = null

          // Try to find sector ID from sector name
          if (route.sector) {
            const foundSectorId = sectorNameToId.get(route.sector)
            if (foundSectorId) {
              sectorId = foundSectorId
              // If areaId not set, derive from sector
              if (!areaId) {
                areaId = sectorToArea.get(foundSectorId) || null
              }
            }
          }

          // Extended fields from JSON
          const extended: RouteExtendedFields = {
            nameEn: route.nameEn || null,
            typeEn: route.typeEn || null,
            firstAscentDate: route.firstAscentDate || null,
            firstAscentEn: route.firstAscentEn || null,
            safetyRating: route.safetyRating || null,
            status: route.status || 'published',
            sectorEn: route.sectorEn || null,
            tips: route.tips || null,
            protection: route.protection || null,
            anchorType: route.anchorType || null,
          }

          routeSQLs.push(buildRouteExtendedSQL(routeRow, cragId, areaId, sectorId, extended))

          // 5. Build route_videos relations
          if (route.youtubeVideos && route.youtubeVideos.length > 0) {
            for (let i = 0; i < route.youtubeVideos.length; i++) {
              const videoUrl = route.youtubeVideos[i]
              const videoId = extractYouTubeVideoId(videoUrl)

              if (videoId && videoMetadata.has(videoId)) {
                routeVideoSQLs.push(buildRouteVideoSQL(routeId, videoId, i))
              }
            }
          }
        }

        // 批量執行路線 SQL（每批 50 條）
        const { success: routeCount, failed: routeFailed } = executeBatchD1Query(routeSQLs, 50)
        _totalRoutes += routeCount
        if (routeFailed > 0) {
        } else {
        }

        // 6. 批量執行 route_videos SQL
        if (routeVideoSQLs.length > 0) {
          const { success: rvCount, failed: rvFailed } = executeBatchD1Query(routeVideoSQLs, 50)
          _totalRouteVideos += rvCount
          if (rvFailed > 0) {
          } else {
          }
        }

        // 7. Update route count
        updateCragRouteCount(cragId)

        // 8. Update metadata fields (if present in JSON)
        const cragJson = cragData.crag
        const metadataJson = cragData.metadata
        const accessJson = cragJson.access

        const metadataUpdate: CragMetadataUpdate = {
          metadataSource: metadataJson?.source || null,
          metadataSourceUrl: metadataJson?.sourceUrl || null,
          metadataMaintainer: metadataJson?.maintainer || null,
          metadataMaintainerUrl: metadataJson?.maintainerUrl || null,
          liveVideoId: cragJson.liveVideoId || null,
          liveVideoTitle: cragJson.liveVideoTitle || null,
          liveVideoDescription: cragJson.liveVideoDescription || null,
          transportation: accessJson?.transportation || null,
          amenities: cragJson.amenities || null,
          googleMapsUrl: cragJson.location?.googleMapsUrl || cragJson.googleMapsUrl || null,
          ratingAvg: cragJson.rating || null,
          heightMin: cragJson.height?.min || null,
          heightMax: cragJson.height?.max || null,
        }

        // 只有有值才更新
        const hasMetadata = Object.values(metadataUpdate).some((v) => v !== null)
        if (hasMetadata) {
          updateCragMetadata(cragId, metadataUpdate)
        }
      } catch (error) {
        console.error(
          `   ✗ Failed to migrate crag:`,
          error instanceof Error ? error.message : error
        )
      }
    }
  }

  if (!dryRun) {
  }
}

// ============================================
// CLI Entry Point
// ============================================

function sleep(ms: number): void {
  const end = Date.now() + ms
  while (Date.now() < end) {
    // busy wait
  }
}

function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')

  if (dryRun) {
  } else {
  }

  const videoMetadata = loadVideoMetadata()

  const crags = loadJsonFiles()

  if (crags.length === 0) {
    process.exit(0)
  }

  // Count routes with videos
  let _totalRoutesWithVideos = 0
  for (const crag of crags) {
    for (const route of crag.routes) {
      if (route.youtubeVideos && route.youtubeVideos.length > 0) {
        _totalRoutesWithVideos++
      }
    }
  }

  for (const crag of crags) {
    const _name = crag.crag.name.padEnd(15).slice(0, 15)
    const _routes = String(crag.routes.length).padStart(6)
    const _videos = String(crag.routes.filter((r) => r.youtubeVideos?.length).length).padStart(6)
    const _region = (crag.crag.region || '北部').padEnd(6)
  }

  if (!dryRun) {
    sleep(3000)
  }

  migrateToD1(crags, videoMetadata, dryRun)
}

try {
  main()
} catch (error) {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
}
