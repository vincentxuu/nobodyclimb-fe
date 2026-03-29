import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { z } from 'zod'
import { adminMiddleware, authMiddleware } from '../middleware/auth'
import { Env } from '../types'

export const adminImportRoutes = new Hono<{ Bindings: Env }>()

// ============================================
// Validation Schemas
// ============================================

const videoSchema = z.object({
  id: z.string(), // YouTube video ID
  title: z.string(),
  channel: z.string(),
  channelId: z.string(),
  uploadDate: z.string(),
  duration: z.number(),
  viewCount: z.number(),
  thumbnailUrl: z.string(),
})

const routeVideoSchema = z.object({
  routeId: z.string(),
  videoId: z.string(),
  sortOrder: z.number(),
})

const sectorSchema = z.object({
  id: z.string(),
  areaId: z.string(),
  name: z.string(),
  nameEn: z.string().optional(),
  sortOrder: z.number(),
})

const areaSchema = z.object({
  id: z.string(),
  cragId: z.string(),
  name: z.string(),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  image: z.string().optional(),
  boltCount: z.number().optional(),
  routeCount: z.number().optional(),
  sortOrder: z.number(),
})

const routeSchema = z.object({
  id: z.string(),
  cragId: z.string(),
  areaId: z.string().nullable().optional(),
  sectorId: z.string().nullable().optional(),
  name: z.string(),
  nameEn: z.string().nullable().optional(),
  grade: z.string(),
  gradeSystem: z.string().optional(),
  height: z.number().nullable().optional(),
  boltCount: z.number().nullable().optional(),
  routeType: z.string().optional(),
  typeEn: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  firstAscent: z.string().nullable().optional(),
  firstAscentDate: z.string().nullable().optional(),
  firstAscentEn: z.string().nullable().optional(),
  safetyRating: z.string().nullable().optional(),
  status: z.string().optional(),
  sectorEn: z.string().nullable().optional(),
  tips: z.string().nullable().optional(),
  protection: z.string().nullable().optional(),
  anchorType: z.string().nullable().optional(),
})

const cragSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  altitude: z.number().nullable().optional(),
  rockType: z.string().nullable().optional(),
  climbingTypes: z.array(z.string()).optional(),
  difficultyRange: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  isFeatured: z.boolean().optional(),
  accessInfo: z.string().nullable().optional(),
  parkingInfo: z.string().nullable().optional(),
  approachTime: z.string().nullable().optional(),
  bestSeasons: z.array(z.string()).optional(),
  restrictions: z.string().nullable().optional(),
  // Metadata fields
  metadataSource: z.string().nullable().optional(),
  metadataSourceUrl: z.string().nullable().optional(),
  metadataMaintainer: z.string().nullable().optional(),
  metadataMaintainerUrl: z.string().nullable().optional(),
  liveVideoId: z.string().nullable().optional(),
  liveVideoTitle: z.string().nullable().optional(),
  liveVideoDescription: z.string().nullable().optional(),
  transportation: z
    .array(
      z.object({
        type: z.string(),
        description: z.string(),
      })
    )
    .nullable()
    .optional(),
  amenities: z.array(z.string()).nullable().optional(),
  googleMapsUrl: z.string().nullable().optional(),
  ratingAvg: z.number().nullable().optional(),
  heightMin: z.number().nullable().optional(),
  heightMax: z.number().nullable().optional(),
})

const importVideosSchema = z.object({
  videos: z.array(videoSchema),
})

const importRouteVideosSchema = z.object({
  routeVideos: z.array(routeVideoSchema),
})

const importCragSchema = z.object({
  crag: cragSchema,
  areas: z.array(areaSchema).optional(),
  sectors: z.array(sectorSchema).optional(),
  routes: z.array(routeSchema).optional(),
})

// ============================================
// POST /admin/import/videos - Batch import videos
// ============================================
adminImportRoutes.post(
  '/videos',
  describeRoute({
    tags: ['Admin Import'],
    summary: '批量導入影片',
    description: '批量導入 YouTube 影片 metadata，使用 D1 batch API',
    responses: {
      200: { description: '導入成功' },
      401: { description: '未認證' },
      403: { description: '沒有管理員權限' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  validator('json', importVideosSchema),
  async (c) => {
    const { videos } = c.req.valid('json')

    if (videos.length === 0) {
      return c.json({ success: true, imported: 0 })
    }

    try {
      // Build batch statements
      const statements = videos.map((video) => {
        const slug = `yt-${video.id}`
        return c.env.DB.prepare(
          `INSERT INTO videos (
            id, title, slug, youtube_id, thumbnail_url, duration,
            channel, channel_id, published_at, view_count, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            thumbnail_url = excluded.thumbnail_url,
            duration = excluded.duration,
            channel = excluded.channel,
            channel_id = excluded.channel_id,
            published_at = excluded.published_at,
            view_count = excluded.view_count,
            updated_at = datetime('now')`
        ).bind(
          video.id,
          video.title,
          slug,
          video.id,
          video.thumbnailUrl,
          video.duration,
          video.channel,
          video.channelId,
          video.uploadDate,
          video.viewCount
        )
      })

      // Execute batch
      await c.env.DB.batch(statements)

      return c.json({
        success: true,
        imported: videos.length,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return c.json(
        {
          success: false,
          error: 'Database Error',
          message: `批量導入失敗: ${message}`,
        },
        500
      )
    }
  }
)

// ============================================
// POST /admin/import/route-videos - Batch import route-video relations
// ============================================
adminImportRoutes.post(
  '/route-videos',
  describeRoute({
    tags: ['Admin Import'],
    summary: '批量導入路線影片關聯',
    description: '批量建立路線與影片的關聯',
    responses: {
      200: { description: '導入成功' },
      401: { description: '未認證' },
      403: { description: '沒有管理員權限' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  validator('json', importRouteVideosSchema),
  async (c) => {
    const { routeVideos } = c.req.valid('json')

    if (routeVideos.length === 0) {
      return c.json({ success: true, imported: 0 })
    }

    try {
      const statements = routeVideos.map((rv) => {
        const id = `${rv.routeId}-${rv.videoId}`
        return c.env.DB.prepare(
          `INSERT INTO route_videos (id, route_id, video_id, sort_order, created_at)
           VALUES (?, ?, ?, ?, datetime('now'))
           ON CONFLICT(route_id, video_id) DO UPDATE SET sort_order = excluded.sort_order`
        ).bind(id, rv.routeId, rv.videoId, rv.sortOrder)
      })

      await c.env.DB.batch(statements)

      return c.json({
        success: true,
        imported: routeVideos.length,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return c.json(
        {
          success: false,
          error: 'Database Error',
          message: `路線影片關聯導入失敗: ${message}`,
        },
        500
      )
    }
  }
)

// ============================================
// POST /admin/import/crag - Import a crag with all related data
// ============================================
adminImportRoutes.post(
  '/crag',
  describeRoute({
    tags: ['Admin Import'],
    summary: '導入岩場（含區域、分區、路線）',
    description: '導入單一岩場及其所有相關資料，使用 D1 batch API',
    responses: {
      200: { description: '導入成功' },
      401: { description: '未認證' },
      403: { description: '沒有管理員權限' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  validator('json', importCragSchema),
  async (c) => {
    const { crag, areas = [], sectors = [], routes = [] } = c.req.valid('json')

    try {
      const statements: ReturnType<typeof c.env.DB.prepare>[] = []

      // 1. Upsert crag
      statements.push(
        c.env.DB.prepare(
          `INSERT INTO crags (
          id, name, slug, description, location, region,
          latitude, longitude, altitude, rock_type, climbing_types,
          difficulty_range, cover_image, is_featured, access_info,
          parking_info, approach_time, best_seasons, restrictions,
          metadata_source, metadata_source_url, metadata_maintainer, metadata_maintainer_url,
          live_video_id, live_video_title, live_video_description,
          transportation, amenities, google_maps_url,
          rating_avg, height_min, height_max,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          datetime('now'), datetime('now')
        )
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          slug = excluded.slug,
          description = excluded.description,
          location = excluded.location,
          region = excluded.region,
          latitude = excluded.latitude,
          longitude = excluded.longitude,
          altitude = excluded.altitude,
          rock_type = excluded.rock_type,
          climbing_types = excluded.climbing_types,
          difficulty_range = excluded.difficulty_range,
          cover_image = excluded.cover_image,
          is_featured = excluded.is_featured,
          access_info = excluded.access_info,
          parking_info = excluded.parking_info,
          approach_time = excluded.approach_time,
          best_seasons = excluded.best_seasons,
          restrictions = excluded.restrictions,
          metadata_source = excluded.metadata_source,
          metadata_source_url = excluded.metadata_source_url,
          metadata_maintainer = excluded.metadata_maintainer,
          metadata_maintainer_url = excluded.metadata_maintainer_url,
          live_video_id = excluded.live_video_id,
          live_video_title = excluded.live_video_title,
          live_video_description = excluded.live_video_description,
          transportation = excluded.transportation,
          amenities = excluded.amenities,
          google_maps_url = excluded.google_maps_url,
          rating_avg = COALESCE(excluded.rating_avg, rating_avg),
          height_min = COALESCE(excluded.height_min, height_min),
          height_max = COALESCE(excluded.height_max, height_max),
          updated_at = datetime('now')`
        ).bind(
          crag.id,
          crag.name,
          crag.slug,
          crag.description || null,
          crag.location || null,
          crag.region || null,
          crag.latitude || null,
          crag.longitude || null,
          crag.altitude || null,
          crag.rockType || null,
          crag.climbingTypes ? JSON.stringify(crag.climbingTypes) : null,
          crag.difficultyRange || null,
          crag.coverImage || null,
          crag.isFeatured ? 1 : 0,
          crag.accessInfo || null,
          crag.parkingInfo || null,
          crag.approachTime || null,
          crag.bestSeasons ? JSON.stringify(crag.bestSeasons) : null,
          crag.restrictions || null,
          crag.metadataSource || null,
          crag.metadataSourceUrl || null,
          crag.metadataMaintainer || null,
          crag.metadataMaintainerUrl || null,
          crag.liveVideoId || null,
          crag.liveVideoTitle || null,
          crag.liveVideoDescription || null,
          crag.transportation ? JSON.stringify(crag.transportation) : null,
          crag.amenities ? JSON.stringify(crag.amenities) : null,
          crag.googleMapsUrl || null,
          crag.ratingAvg || null,
          crag.heightMin || null,
          crag.heightMax || null
        )
      )

      // 2. Upsert areas
      for (const area of areas) {
        statements.push(
          c.env.DB.prepare(
            `INSERT INTO areas (
            id, crag_id, name, name_en, slug, description, description_en,
            image, bolt_count, route_count, sort_order, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            name_en = excluded.name_en,
            slug = excluded.slug,
            description = excluded.description,
            description_en = excluded.description_en,
            image = excluded.image,
            bolt_count = excluded.bolt_count,
            route_count = excluded.route_count,
            sort_order = excluded.sort_order,
            updated_at = datetime('now')`
          ).bind(
            area.id,
            area.cragId,
            area.name,
            area.nameEn || null,
            area.id, // slug = id
            area.description || null,
            area.descriptionEn || null,
            area.image || null,
            area.boltCount || 0,
            area.routeCount || 0,
            area.sortOrder
          )
        )
      }

      // 3. Upsert sectors
      for (const sector of sectors) {
        statements.push(
          c.env.DB.prepare(
            `INSERT INTO sectors (
            id, area_id, name, name_en, sort_order, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            name_en = excluded.name_en,
            sort_order = excluded.sort_order,
            updated_at = datetime('now')`
          ).bind(sector.id, sector.areaId, sector.name, sector.nameEn || null, sector.sortOrder)
        )
      }

      // 4. Upsert routes
      for (const route of routes) {
        statements.push(
          c.env.DB.prepare(
            `INSERT INTO routes (
            id, crag_id, area_id, sector_id, name, name_en, grade, grade_system,
            height, bolt_count, route_type, type_en, description, first_ascent,
            first_ascent_date, first_ascent_en, safety_rating, status, sector_en,
            tips, protection, anchor_type, created_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, datetime('now')
          )
          ON CONFLICT(id) DO UPDATE SET
            area_id = excluded.area_id,
            sector_id = excluded.sector_id,
            name = excluded.name,
            name_en = excluded.name_en,
            grade = excluded.grade,
            grade_system = excluded.grade_system,
            height = excluded.height,
            bolt_count = excluded.bolt_count,
            route_type = excluded.route_type,
            type_en = excluded.type_en,
            description = excluded.description,
            first_ascent = excluded.first_ascent,
            first_ascent_date = excluded.first_ascent_date,
            first_ascent_en = excluded.first_ascent_en,
            safety_rating = excluded.safety_rating,
            status = excluded.status,
            sector_en = excluded.sector_en,
            tips = excluded.tips,
            protection = excluded.protection,
            anchor_type = excluded.anchor_type`
          ).bind(
            route.id,
            route.cragId,
            route.areaId || null,
            route.sectorId || null,
            route.name,
            route.nameEn || null,
            route.grade,
            route.gradeSystem || 'yds',
            route.height || null,
            route.boltCount || null,
            route.routeType || 'sport',
            route.typeEn || null,
            route.description || null,
            route.firstAscent || null,
            route.firstAscentDate || null,
            route.firstAscentEn || null,
            route.safetyRating || null,
            route.status || 'published',
            route.sectorEn || null,
            route.tips || null,
            route.protection || null,
            route.anchorType || null
          )
        )
      }

      // Execute all statements in batch
      await c.env.DB.batch(statements)

      // Update route count
      await c.env.DB.prepare(
        `UPDATE crags
       SET route_count = (SELECT COUNT(*) FROM routes WHERE crag_id = ?),
           bolt_count = (SELECT COALESCE(SUM(bolt_count), 0) FROM routes WHERE crag_id = ?),
           updated_at = datetime('now')
       WHERE id = ?`
      )
        .bind(crag.id, crag.id, crag.id)
        .run()

      return c.json({
        success: true,
        imported: {
          crag: 1,
          areas: areas.length,
          sectors: sectors.length,
          routes: routes.length,
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return c.json(
        {
          success: false,
          error: 'Database Error',
          message: `岩場導入失敗: ${message}`,
        },
        500
      )
    }
  }
)
