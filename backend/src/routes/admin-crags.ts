import { Hono } from 'hono';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';
import { D1Database } from '@cloudflare/workers-types';
import { Env, Crag, Route } from '../types';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { parsePagination, generateId } from '../utils/id';

// Validation schemas
const batchImportCragsSchema = z.object({
  crags: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    location: z.string().optional(),
    region: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    altitude: z.number().optional(),
    rock_type: z.string().optional(),
    climbing_types: z.array(z.string()).optional(),
    difficulty_range: z.string().optional(),
    route_count: z.number().optional(),
    bolt_count: z.number().optional(),
    cover_image: z.string().optional(),
    images: z.array(z.string()).optional(),
    is_featured: z.number().optional(),
    access_info: z.string().optional(),
    parking_info: z.string().optional(),
    approach_time: z.string().optional(),
    best_seasons: z.array(z.string()).optional(),
    restrictions: z.string().optional(),
  })),
  skipExisting: z.boolean().optional(),
});

const createRouteSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  grade: z.string().optional(),
  grade_system: z.string().optional(),
  height: z.number().optional(),
  bolt_count: z.number().optional(),
  route_type: z.string().optional(),
  description: z.string().optional(),
  first_ascent: z.string().optional(),
  area_id: z.string().optional(),
  sector_id: z.string().optional(),
});

const updateRouteSchema = z.object({
  name: z.string().optional(),
  grade: z.string().nullable().optional(),
  grade_system: z.string().nullable().optional(),
  height: z.number().nullable().optional(),
  bolt_count: z.number().nullable().optional(),
  route_type: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  first_ascent: z.string().nullable().optional(),
  area_id: z.string().nullable().optional(),
  sector_id: z.string().nullable().optional(),
});

const batchImportRoutesSchema = z.object({
  routes: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    grade: z.string().optional(),
    grade_system: z.string().optional(),
    height: z.number().optional(),
    bolt_count: z.number().optional(),
    route_type: z.string().optional(),
    description: z.string().optional(),
    first_ascent: z.string().optional(),
    area_id: z.string().optional(),
    sector_id: z.string().optional(),
  })),
  skipExisting: z.boolean().optional(),
});

// Helper function to update crag route and bolt counts
async function updateCragCounts(db: D1Database, cragId: string) {
  return db
    .prepare(
      `
    UPDATE crags
    SET route_count = (SELECT COUNT(*) FROM routes WHERE crag_id = ?),
        bolt_count = (SELECT COALESCE(SUM(bolt_count), 0) FROM routes WHERE crag_id = ?),
        updated_at = datetime('now')
    WHERE id = ?
  `
    )
    .bind(cragId, cragId, cragId)
    .run();
}

export const adminCragsRoutes = new Hono<{ Bindings: Env }>();

// All routes require admin authentication
adminCragsRoutes.use('*', authMiddleware, adminMiddleware);

// ============================================
// Static routes MUST come before dynamic routes
// ============================================

// GET /admin/crags - List all crags with admin info
adminCragsRoutes.get(
  '/',
  describeRoute({
    tags: ['Admin'],
    summary: '取得所有岩場列表',
    description: '取得所有岩場的管理列表，支援分頁、搜尋和區域篩選',
    responses: {
      200: { description: '成功取得岩場列表' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  async (c) => {
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );
  const search = c.req.query('search');
  const region = c.req.query('region');

  let whereClause = '1=1';
  const params: (string | number)[] = [];

  if (search) {
    whereClause += ' AND (name LIKE ? OR slug LIKE ? OR location LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (region) {
    whereClause += ' AND region = ?';
    params.push(region);
  }

  // Get total count
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM crags WHERE ${whereClause}`
  )
    .bind(...params)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  // Get paginated results
  const crags = await c.env.DB.prepare(
    `SELECT * FROM crags WHERE ${whereClause}
     ORDER BY updated_at DESC, name ASC
     LIMIT ? OFFSET ?`
  )
    .bind(...params, limit, offset)
    .all<Crag>();

  return c.json({
    success: true,
    data: crags.results.map((crag) => ({
      ...crag,
      climbing_types: crag.climbing_types ? JSON.parse(crag.climbing_types) : [],
      images: crag.images ? JSON.parse(crag.images) : [],
      best_seasons: crag.best_seasons ? JSON.parse(crag.best_seasons) : [],
    })),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// GET /admin/crags/stats - Get crag statistics (MUST be before /:id)
adminCragsRoutes.get(
  '/stats',
  describeRoute({
    tags: ['Admin'],
    summary: '取得岩場統計資料',
    description: '取得岩場的總數、路線數、bolt 數及區域分布統計',
    responses: {
      200: { description: '成功取得統計資料' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  async (c) => {
  const stats = await c.env.DB.prepare(`
    SELECT
      COUNT(*) as total_crags,
      SUM(route_count) as total_routes,
      SUM(bolt_count) as total_bolts,
      SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) as featured_count,
      COUNT(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 END) as new_this_month
    FROM crags
  `).first<{
    total_crags: number;
    total_routes: number;
    total_bolts: number;
    featured_count: number;
    new_this_month: number;
  }>();

  // Get region distribution
  const regionStats = await c.env.DB.prepare(`
    SELECT region, COUNT(*) as count
    FROM crags
    WHERE region IS NOT NULL
    GROUP BY region
    ORDER BY count DESC
  `).all<{ region: string; count: number }>();

  return c.json({
    success: true,
    data: {
      ...stats,
      regions: regionStats.results,
    },
  });
});

// POST /admin/crags/batch-import - Batch import crags (MUST be before /:id)
adminCragsRoutes.post(
  '/batch-import',
  describeRoute({
    tags: ['Admin'],
    summary: '批次匯入岩場',
    description: '批次匯入多個岩場資料，可選擇是否跳過已存在的岩場',
    responses: {
      200: { description: '匯入完成，回傳匯入、跳過及錯誤數量' },
      400: { description: 'crags 陣列為必填' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  validator('json', batchImportCragsSchema),
  async (c) => {
  const body = c.req.valid('json');

  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const cragData of body.crags) {
    try {
      if (!cragData.name || !cragData.slug) {
        results.errors.push(`Missing name or slug for crag`);
        continue;
      }

      // Check if exists
      if (body.skipExisting) {
        const existing = await c.env.DB.prepare(
          'SELECT id FROM crags WHERE slug = ?'
        )
          .bind(cragData.slug)
          .first();

        if (existing) {
          results.skipped++;
          continue;
        }
      }

      const id = cragData.id || generateId();

      await c.env.DB.prepare(`
        INSERT INTO crags (
          id, name, slug, description, location, region,
          latitude, longitude, altitude, rock_type, climbing_types,
          difficulty_range, route_count, bolt_count, cover_image, images,
          is_featured, access_info, parking_info, approach_time, best_seasons, restrictions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          description = excluded.description,
          location = excluded.location,
          region = excluded.region,
          latitude = excluded.latitude,
          longitude = excluded.longitude,
          altitude = excluded.altitude,
          rock_type = excluded.rock_type,
          climbing_types = excluded.climbing_types,
          difficulty_range = excluded.difficulty_range,
          route_count = excluded.route_count,
          bolt_count = excluded.bolt_count,
          cover_image = excluded.cover_image,
          images = excluded.images,
          is_featured = excluded.is_featured,
          access_info = excluded.access_info,
          parking_info = excluded.parking_info,
          approach_time = excluded.approach_time,
          best_seasons = excluded.best_seasons,
          restrictions = excluded.restrictions,
          updated_at = datetime('now')
      `)
        .bind(
          id,
          cragData.name,
          cragData.slug,
          cragData.description || null,
          cragData.location || null,
          cragData.region || null,
          cragData.latitude || null,
          cragData.longitude || null,
          cragData.altitude || null,
          cragData.rock_type || null,
          cragData.climbing_types
            ? JSON.stringify(cragData.climbing_types)
            : null,
          cragData.difficulty_range || null,
          cragData.route_count || 0,
          cragData.bolt_count || 0,
          cragData.cover_image || null,
          cragData.images ? JSON.stringify(cragData.images) : null,
          cragData.is_featured || 0,
          cragData.access_info || null,
          cragData.parking_info || null,
          cragData.approach_time || null,
          cragData.best_seasons ? JSON.stringify(cragData.best_seasons) : null,
          cragData.restrictions || null
        )
        .run();

      results.imported++;
    } catch (error) {
      results.errors.push(
        `Failed to import ${cragData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return c.json({
    success: results.errors.length === 0,
    data: results,
  });
});

// ============================================
// Video Search (MUST be before /:id)
// ============================================

// GET /admin/crags/videos/search - Search videos
adminCragsRoutes.get(
  '/videos/search',
  describeRoute({
    tags: ['Admin'],
    summary: '搜尋影片',
    description: '搜尋已匯入的影片，用於關聯到路線',
    responses: {
      200: { description: '成功取得影片列表' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  async (c) => {
    const search = c.req.query('q') || '';
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);

    let query = `SELECT id, title, youtube_id, thumbnail_url, duration, channel, channel_id, published_at, view_count
                 FROM videos`;
    const params: (string | number)[] = [];

    if (search) {
      query += ' WHERE title LIKE ? OR channel LIKE ? OR youtube_id = ?';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, search);
    }

    query += ' ORDER BY published_at DESC NULLS LAST LIMIT ?';
    params.push(limit);

    const videos = await c.env.DB.prepare(query)
      .bind(...params)
      .all<{
        id: string;
        title: string;
        youtube_id: string | null;
        thumbnail_url: string | null;
        duration: number | null;
        channel: string | null;
        channel_id: string | null;
        published_at: string | null;
        view_count: number | null;
      }>();

    return c.json({
      success: true,
      data: videos.results.map((v) => ({
        id: v.id,
        title: v.title,
        youtubeId: v.youtube_id,
        thumbnailUrl: v.thumbnail_url,
        duration: v.duration,
        channel: v.channel,
        channelId: v.channel_id,
        publishedAt: v.published_at,
        viewCount: v.view_count,
      })),
    });
  }
);

// ============================================
// Dynamic crag routes (/:id)
// ============================================

// GET /admin/crags/:id - Get crag details with routes
adminCragsRoutes.get(
  '/:id',
  describeRoute({
    tags: ['Admin'],
    summary: '取得單一岩場詳情',
    description: '取得指定 ID 的岩場詳細資料，包含該岩場的所有路線',
    responses: {
      200: { description: '成功取得岩場詳情' },
      404: { description: '找不到岩場' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  async (c) => {
  const id = c.req.param('id');

  const crag = await c.env.DB.prepare('SELECT * FROM crags WHERE id = ?')
    .bind(id)
    .first<Crag>();

  if (!crag) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Crag not found',
      },
      404
    );
  }

  // Get routes for this crag
  const routes = await c.env.DB.prepare(
    'SELECT * FROM routes WHERE crag_id = ? ORDER BY grade ASC'
  )
    .bind(id)
    .all<Route>();

  return c.json({
    success: true,
    data: {
      ...crag,
      climbing_types: crag.climbing_types ? JSON.parse(crag.climbing_types) : [],
      images: crag.images ? JSON.parse(crag.images) : [],
      best_seasons: crag.best_seasons ? JSON.parse(crag.best_seasons) : [],
      routes: routes.results,
    },
  });
});

// POST /admin/crags/:id/update-counts - Update route and bolt counts
adminCragsRoutes.post(
  '/:id/update-counts',
  describeRoute({
    tags: ['Admin'],
    summary: '更新岩場路線及 bolt 數量',
    description: '重新計算並更新指定岩場的路線數量和 bolt 數量',
    responses: {
      200: { description: '成功更新數量' },
      404: { description: '找不到岩場' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  async (c) => {
  const id = c.req.param('id');

  // First verify crag exists
  const cragExists = await c.env.DB.prepare('SELECT id FROM crags WHERE id = ?')
    .bind(id)
    .first();

  if (!cragExists) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Crag not found',
      },
      404
    );
  }

  // Calculate counts from routes table
  const counts = await c.env.DB.prepare(`
    SELECT
      COUNT(*) as route_count,
      COALESCE(SUM(bolt_count), 0) as bolt_count
    FROM routes
    WHERE crag_id = ?
  `)
    .bind(id)
    .first<{ route_count: number; bolt_count: number }>();

  // Update crag
  await c.env.DB.prepare(`
    UPDATE crags
    SET route_count = ?, bolt_count = ?, updated_at = datetime('now')
    WHERE id = ?
  `)
    .bind(counts?.route_count || 0, counts?.bolt_count || 0, id)
    .run();

  return c.json({
    success: true,
    data: {
      route_count: counts?.route_count || 0,
      bolt_count: counts?.bolt_count || 0,
    },
  });
});

// ============================================
// Route Management - Static routes first
// ============================================

// POST /admin/crags/:cragId/routes/batch-import - Batch import routes (MUST be before /:cragId/routes)
adminCragsRoutes.post(
  '/:cragId/routes/batch-import',
  describeRoute({
    tags: ['Admin'],
    summary: '批次匯入路線',
    description: '批次匯入多個路線到指定岩場',
    responses: {
      200: { description: '匯入完成，回傳匯入、跳過及錯誤數量' },
      400: { description: 'routes 陣列為必填' },
      404: { description: '找不到岩場' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  validator('json', batchImportRoutesSchema),
  async (c) => {
  const cragId = c.req.param('cragId');
  const body = c.req.valid('json');

  // Verify crag exists
  const crag = await c.env.DB.prepare('SELECT id FROM crags WHERE id = ?')
    .bind(cragId)
    .first();

  if (!crag) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Crag not found',
      },
      404
    );
  }

  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const routeData of body.routes) {
    try {
      if (!routeData.name) {
        results.errors.push('Missing name for route');
        continue;
      }

      const id = routeData.id || generateId();

      await c.env.DB.prepare(`
        INSERT INTO routes (
          id, crag_id, name, grade, grade_system,
          height, bolt_count, route_type, description, first_ascent,
          area_id, sector_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          grade = excluded.grade,
          grade_system = excluded.grade_system,
          height = excluded.height,
          bolt_count = excluded.bolt_count,
          route_type = excluded.route_type,
          description = excluded.description,
          first_ascent = excluded.first_ascent,
          area_id = excluded.area_id,
          sector_id = excluded.sector_id
      `)
        .bind(
          id,
          cragId,
          routeData.name,
          routeData.grade || null,
          routeData.grade_system || 'yds',
          routeData.height || null,
          routeData.bolt_count || null,
          routeData.route_type || 'sport',
          routeData.description || null,
          routeData.first_ascent || null,
          routeData.area_id || null,
          routeData.sector_id || null
        )
        .run();

      results.imported++;
    } catch (error) {
      results.errors.push(
        `Failed to import ${routeData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Update crag counts
  await updateCragCounts(c.env.DB, cragId);

  return c.json({
    success: results.errors.length === 0,
    data: results,
  });
});

// ============================================
// Dynamic route routes
// ============================================

// GET /admin/crags/:cragId/routes - List routes for a crag
adminCragsRoutes.get(
  '/:cragId/routes',
  describeRoute({
    tags: ['Admin'],
    summary: '取得岩場的路線列表',
    description: '取得指定岩場的所有路線，支援分頁和區域篩選',
    responses: {
      200: { description: '成功取得路線列表' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  async (c) => {
  const cragId = c.req.param('cragId');
  const areaId = c.req.query('area_id');
  const sectorId = c.req.query('sector_id');
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );

  // Build WHERE clause
  let whereClause = 'crag_id = ?';
  const bindParams: (string | number)[] = [cragId];

  if (areaId) {
    whereClause += ' AND area_id = ?';
    bindParams.push(areaId);
  }

  if (sectorId) {
    whereClause += ' AND sector_id = ?';
    bindParams.push(sectorId);
  }

  // Get total count
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM routes WHERE ${whereClause}`
  )
    .bind(...bindParams)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  // Get paginated results
  const routes = await c.env.DB.prepare(
    `SELECT * FROM routes WHERE ${whereClause}
     ORDER BY grade ASC, name ASC
     LIMIT ? OFFSET ?`
  )
    .bind(...bindParams, limit, offset)
    .all<Route>();

  return c.json({
    success: true,
    data: routes.results,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// POST /admin/crags/:cragId/routes - Create route
adminCragsRoutes.post(
  '/:cragId/routes',
  describeRoute({
    tags: ['Admin'],
    summary: '新增路線',
    description: '在指定岩場新增一條路線',
    responses: {
      201: { description: '路線已成功新增' },
      400: { description: '路線名稱為必填' },
      404: { description: '找不到岩場' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  validator('json', createRouteSchema),
  async (c) => {
  const cragId = c.req.param('cragId');
  const body = c.req.valid('json');

  // Verify crag exists
  const crag = await c.env.DB.prepare('SELECT id FROM crags WHERE id = ?')
    .bind(cragId)
    .first();

  if (!crag) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Crag not found',
      },
      404
    );
  }

  const id = body.id || generateId();

  await c.env.DB.prepare(`
    INSERT INTO routes (
      id, crag_id, name, grade, grade_system,
      height, bolt_count, route_type, description, first_ascent,
      area_id, sector_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      id,
      cragId,
      body.name,
      body.grade || null,
      body.grade_system || 'yds',
      body.height || null,
      body.bolt_count || null,
      body.route_type || 'sport',
      body.description || null,
      body.first_ascent || null,
      body.area_id || null,
      body.sector_id || null
    )
    .run();

  // Update crag route count
  await updateCragCounts(c.env.DB, cragId);

  const route = await c.env.DB.prepare('SELECT * FROM routes WHERE id = ?')
    .bind(id)
    .first<Route>();

  return c.json(
    {
      success: true,
      data: route,
    },
    201
  );
});

// PUT /admin/crags/:cragId/routes/:routeId - Update route
adminCragsRoutes.put(
  '/:cragId/routes/:routeId',
  describeRoute({
    tags: ['Admin'],
    summary: '更新路線',
    description: '更新指定岩場的指定路線',
    responses: {
      200: { description: '路線已成功更新' },
      400: { description: '沒有欄位需要更新' },
      404: { description: '找不到路線' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  validator('json', updateRouteSchema),
  async (c) => {
  const cragId = c.req.param('cragId');
  const routeId = c.req.param('routeId');
  const body = c.req.valid('json');

  // Query existing route with bolt_count for incremental update
  const existing = await c.env.DB.prepare(
    'SELECT id, bolt_count FROM routes WHERE id = ? AND crag_id = ?'
  )
    .bind(routeId, cragId)
    .first<{ id: string; bolt_count: number | null }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Route not found',
      },
      404
    );
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  const fields = [
    'name',
    'grade',
    'grade_system',
    'height',
    'bolt_count',
    'route_type',
    'description',
    'first_ascent',
    'area_id',
    'sector_id',
  ];

  for (const field of fields) {
    if (body[field as keyof typeof body] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field as keyof typeof body] as string | number | null);
    }
  }

  if (updates.length === 0) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'No fields to update',
      },
      400
    );
  }

  values.push(routeId);

  await c.env.DB.prepare(`UPDATE routes SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  // Use incremental bolt_count update if bolt_count was changed
  if (body.bolt_count !== undefined) {
    const oldBoltCount = existing.bolt_count || 0;
    const newBoltCount = body.bolt_count || 0;
    const diff = newBoltCount - oldBoltCount;

    if (diff !== 0) {
      await c.env.DB.prepare(
        `
        UPDATE crags
        SET bolt_count = bolt_count + ?,
            updated_at = datetime('now')
        WHERE id = ?
      `
      )
        .bind(diff, cragId)
        .run();
    }
  }

  const route = await c.env.DB.prepare('SELECT * FROM routes WHERE id = ?')
    .bind(routeId)
    .first<Route>();

  return c.json({
    success: true,
    data: route,
  });
});

// DELETE /admin/crags/:cragId/routes/:routeId - Delete route
adminCragsRoutes.delete(
  '/:cragId/routes/:routeId',
  describeRoute({
    tags: ['Admin'],
    summary: '刪除路線',
    description: '刪除指定岩場的指定路線',
    responses: {
      200: { description: '路線已成功刪除' },
      404: { description: '找不到路線' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  async (c) => {
  const cragId = c.req.param('cragId');
  const routeId = c.req.param('routeId');

  const existing = await c.env.DB.prepare(
    'SELECT id FROM routes WHERE id = ? AND crag_id = ?'
  )
    .bind(routeId, cragId)
    .first();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Route not found',
      },
      404
    );
  }

  await c.env.DB.prepare('DELETE FROM routes WHERE id = ?').bind(routeId).run();

  // Update crag counts
  await updateCragCounts(c.env.DB, cragId);

  return c.json({
    success: true,
    message: 'Route deleted successfully',
  });
});

// ============================================
// Route Video Management
// ============================================

// GET /admin/crags/:cragId/routes/:routeId/videos - List videos for a route
adminCragsRoutes.get(
  '/:cragId/routes/:routeId/videos',
  describeRoute({
    tags: ['Admin'],
    summary: '取得路線的影片列表',
    description: '取得指定路線關聯的所有 YouTube 影片',
    responses: {
      200: { description: '成功取得影片列表' },
      404: { description: '找不到路線' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  async (c) => {
    const cragId = c.req.param('cragId');
    const routeId = c.req.param('routeId');

    // Verify route exists
    const route = await c.env.DB.prepare(
      'SELECT id FROM routes WHERE id = ? AND crag_id = ?'
    )
      .bind(routeId, cragId)
      .first();

    if (!route) {
      return c.json(
        { success: false, error: 'Not Found', message: 'Route not found' },
        404
      );
    }

    const videos = await c.env.DB.prepare(
      `SELECT v.id, v.title, v.youtube_id, v.thumbnail_url, v.duration,
              v.channel, v.channel_id, v.published_at, v.view_count,
              rv.sort_order
       FROM route_videos rv
       JOIN videos v ON rv.video_id = v.id
       WHERE rv.route_id = ?
       ORDER BY rv.sort_order ASC, COALESCE(v.published_at, rv.created_at) DESC`
    )
      .bind(routeId)
      .all<{
        id: string;
        title: string;
        youtube_id: string | null;
        thumbnail_url: string | null;
        duration: number | null;
        channel: string | null;
        channel_id: string | null;
        published_at: string | null;
        view_count: number | null;
        sort_order: number;
      }>();

    return c.json({
      success: true,
      data: videos.results.map((v) => ({
        id: v.id,
        title: v.title,
        youtubeId: v.youtube_id,
        thumbnailUrl: v.thumbnail_url,
        duration: v.duration,
        channel: v.channel,
        channelId: v.channel_id,
        publishedAt: v.published_at,
        viewCount: v.view_count,
        sortOrder: v.sort_order,
      })),
    });
  }
);

const addRouteVideoSchema = z.object({
  youtubeId: z.string().min(1),
  title: z.string().optional(),
  channel: z.string().optional(),
  channelId: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  duration: z.number().optional(),
  publishedAt: z.string().optional(),
  viewCount: z.number().optional(),
  sortOrder: z.number().optional(),
});

// POST /admin/crags/:cragId/routes/:routeId/videos - Add video to a route
adminCragsRoutes.post(
  '/:cragId/routes/:routeId/videos',
  describeRoute({
    tags: ['Admin'],
    summary: '新增路線影片',
    description: '將 YouTube 影片關聯到指定路線（若影片不存在則自動建立）',
    responses: {
      201: { description: '影片已成功關聯' },
      400: { description: '影片已關聯到此路線' },
      404: { description: '找不到路線' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  validator('json', addRouteVideoSchema),
  async (c) => {
    const cragId = c.req.param('cragId');
    const routeId = c.req.param('routeId');
    const body = c.req.valid('json');

    // Verify route exists
    const route = await c.env.DB.prepare(
      'SELECT id FROM routes WHERE id = ? AND crag_id = ?'
    )
      .bind(routeId, cragId)
      .first();

    if (!route) {
      return c.json(
        { success: false, error: 'Not Found', message: 'Route not found' },
        404
      );
    }

    // Check if video already exists in videos table
    let videoId = body.youtubeId;
    const existingVideo = await c.env.DB.prepare(
      'SELECT id FROM videos WHERE id = ? OR youtube_id = ?'
    )
      .bind(videoId, videoId)
      .first<{ id: string }>();

    if (existingVideo) {
      videoId = existingVideo.id;
    } else {
      // Create the video record
      const slug = `yt-${body.youtubeId}`;
      await c.env.DB.prepare(
        `INSERT OR IGNORE INTO videos (id, title, slug, youtube_id, thumbnail_url, duration,
          channel, channel_id, published_at, view_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      )
        .bind(
          videoId,
          body.title || `YouTube Video ${body.youtubeId}`,
          slug,
          body.youtubeId,
          body.thumbnailUrl || null,
          body.duration || null,
          body.channel || null,
          body.channelId || null,
          body.publishedAt || null,
          body.viewCount || 0
        )
        .run();
    }

    // Check if route-video link already exists
    const existingLink = await c.env.DB.prepare(
      'SELECT id FROM route_videos WHERE route_id = ? AND video_id = ?'
    )
      .bind(routeId, videoId)
      .first();

    if (existingLink) {
      return c.json(
        {
          success: false,
          error: 'Conflict',
          message: '此影片已關聯到此路線',
        },
        400
      );
    }

    // Create the route-video link
    const linkId = `${routeId}-${videoId}`;
    const sortOrder = body.sortOrder ?? 0;
    await c.env.DB.prepare(
      `INSERT INTO route_videos (id, route_id, video_id, sort_order, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`
    )
      .bind(linkId, routeId, videoId, sortOrder)
      .run();

    return c.json(
      {
        success: true,
        data: {
          id: videoId,
          title: body.title || `YouTube Video ${body.youtubeId}`,
          youtubeId: body.youtubeId,
          thumbnailUrl: body.thumbnailUrl || null,
          duration: body.duration || null,
          channel: body.channel || null,
          channelId: body.channelId || null,
          publishedAt: body.publishedAt || null,
          sortOrder,
        },
      },
      201
    );
  }
);

// DELETE /admin/crags/:cragId/routes/:routeId/videos/:videoId - Remove video from route
adminCragsRoutes.delete(
  '/:cragId/routes/:routeId/videos/:videoId',
  describeRoute({
    tags: ['Admin'],
    summary: '移除路線影片關聯',
    description: '移除指定路線與影片的關聯（不會刪除影片本身）',
    responses: {
      200: { description: '影片關聯已移除' },
      404: { description: '找不到路線或影片關聯' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  async (c) => {
    const cragId = c.req.param('cragId');
    const routeId = c.req.param('routeId');
    const videoId = c.req.param('videoId');

    // Verify route exists
    const route = await c.env.DB.prepare(
      'SELECT id FROM routes WHERE id = ? AND crag_id = ?'
    )
      .bind(routeId, cragId)
      .first();

    if (!route) {
      return c.json(
        { success: false, error: 'Not Found', message: 'Route not found' },
        404
      );
    }

    const existing = await c.env.DB.prepare(
      'SELECT id FROM route_videos WHERE route_id = ? AND video_id = ?'
    )
      .bind(routeId, videoId)
      .first();

    if (!existing) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Route-video link not found',
        },
        404
      );
    }

    await c.env.DB.prepare(
      'DELETE FROM route_videos WHERE route_id = ? AND video_id = ?'
    )
      .bind(routeId, videoId)
      .run();

    return c.json({
      success: true,
      message: 'Video removed from route successfully',
    });
  }
);

