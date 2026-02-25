import { Hono } from 'hono';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';
import { Env, Crag } from '../types';
import { parsePagination, generateId, generateSlug } from '../utils/id';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { deleteR2Images } from '../utils/storage';

export const cragsRoutes = new Hono<{ Bindings: Env }>();

// Validation schemas
const listCragsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  region: z.string().optional(),
  featured: z.enum(['true', 'false']).optional(),
});

const cragIdParamSchema = z.object({
  id: z.string().min(1),
});

const cragSlugParamSchema = z.object({
  slug: z.string().min(1),
});

const createCragSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
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
});

const updateCragSchema = z.object({
  name: z.string().optional(),
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
});

const featuredQuerySchema = z.object({
  limit: z.string().optional(),
});

const featuredRoutesQuerySchema = z.object({
  limit: z.string().optional(),
});

// GET /crags - List all crags
cragsRoutes.get(
  '/',
  describeRoute({
    tags: ['Crags'],
    summary: '取得岩場列表',
    description: '取得所有岩場列表，支援分頁、地區過濾和精選過濾',
    responses: {
      200: { description: '成功取得岩場列表' },
    },
  }),
  validator('query', listCragsQuerySchema),
  async (c) => {
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );
  const region = c.req.query('region');
  const featured = c.req.query('featured');

  let whereClause = '1=1';
  const params: (string | number)[] = [];

  if (region) {
    whereClause += ' AND region = ?';
    params.push(region);
  }

  if (featured === 'true') {
    whereClause += ' AND is_featured = 1';
  }

  // Get total count
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM crags WHERE ${whereClause}`
  )
    .bind(...params)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  // Get paginated results
  // 按照北中南東離島順序排列，同地區內按緯度從北到南
  const crags = await c.env.DB.prepare(
    `SELECT * FROM crags WHERE ${whereClause}
     ORDER BY is_featured DESC,
       CASE region
         WHEN '北部' THEN 1
         WHEN '中部' THEN 2
         WHEN '南部' THEN 3
         WHEN '東部' THEN 4
         WHEN '離島' THEN 5
         ELSE 6
       END,
       latitude DESC
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

// GET /crags/featured - Get featured crags
cragsRoutes.get(
  '/featured',
  describeRoute({
    tags: ['Crags'],
    summary: '取得精選岩場',
    description: '取得精選岩場列表，可指定數量限制',
    responses: {
      200: { description: '成功取得精選岩場列表' },
    },
  }),
  validator('query', featuredQuerySchema),
  async (c) => {
  const limit = parseInt(c.req.query('limit') || '6', 10);

  // 按照北中南東離島順序排列，同地區內按緯度從北到南
  const crags = await c.env.DB.prepare(
    `SELECT * FROM crags WHERE is_featured = 1
     ORDER BY
       CASE region
         WHEN '北部' THEN 1
         WHEN '中部' THEN 2
         WHEN '南部' THEN 3
         WHEN '東部' THEN 4
         WHEN '離島' THEN 5
         ELSE 6
       END,
       latitude DESC
     LIMIT ?`
  )
    .bind(limit)
    .all<Crag>();

  return c.json({
    success: true,
    data: crags.results.map((crag) => ({
      ...crag,
      climbing_types: crag.climbing_types ? JSON.parse(crag.climbing_types) : [],
      images: crag.images ? JSON.parse(crag.images) : [],
      best_seasons: crag.best_seasons ? JSON.parse(crag.best_seasons) : [],
      transportation: crag.transportation ? JSON.parse(crag.transportation) : [],
      amenities: crag.amenities ? JSON.parse(crag.amenities) : [],
    })),
  });
});

// GET /routes/featured - Get featured routes across all crags
cragsRoutes.get(
  '/routes/featured',
  describeRoute({
    tags: ['Routes'],
    summary: '取得熱門路線',
    description: '取得熱門路線列表，按攀登次數和故事數量排序，從不同岩場輪流選取確保多樣性',
    responses: {
      200: { description: '成功取得熱門路線列表' },
    },
  }),
  validator('query', featuredRoutesQuerySchema),
  async (c) => {
    const limit = parseInt(c.req.query('limit') || '8', 10);

    // 獲取所有路線，包含岩場和區域資訊，按影片數量優先排序
    const routes = await c.env.DB.prepare(
      `SELECT
        r.id,
        r.name,
        r.name_en,
        r.grade,
        r.route_type,
        r.height,
        r.bolt_count,
        r.description,
        r.ascent_count,
        r.story_count,
        r.crag_id,
        c.name as crag_name,
        r.area_id,
        a.name as area_name,
        (SELECT v.thumbnail_url FROM route_videos rv
         JOIN videos v ON rv.video_id = v.id
         WHERE rv.route_id = r.id
         ORDER BY rv.sort_order
         LIMIT 1) as youtube_thumbnail,
        (SELECT COUNT(*) FROM route_videos rv WHERE rv.route_id = r.id) as video_count
      FROM routes r
      JOIN crags c ON r.crag_id = c.id
      LEFT JOIN areas a ON r.area_id = a.id
      ORDER BY
        video_count DESC,
        (COALESCE(r.ascent_count, 0) + COALESCE(r.story_count, 0)) DESC,
        r.created_at DESC
      LIMIT ?`
    )
      .bind(limit * 3) // 取多一些以便從不同岩場輪流選取
      .all<{
        id: string;
        name: string;
        name_en: string | null;
        grade: string;
        route_type: string;
        height: string | null;
        bolt_count: number;
        description: string | null;
        ascent_count: number | null;
        story_count: number | null;
        crag_id: string;
        crag_name: string;
        area_id: string | null;
        area_name: string | null;
        youtube_thumbnail: string | null;
        video_count: number;
      }>();

    // 將難度分組的輔助函數
    const getGradeLevel = (grade: string): string => {
      // 解析 YDS 難度 (5.x 格式)
      const match = grade.match(/5\.(\d+)([a-d])?/i);
      if (!match) return 'other';
      const num = parseInt(match[1], 10);
      if (num <= 8) return 'beginner';      // 5.6-5.8: 初學
      if (num <= 10) return 'intermediate'; // 5.9-5.10: 中等
      if (num <= 12) return 'advanced';     // 5.11-5.12: 進階
      return 'expert';                       // 5.13+: 專家
    };

    // 按難度等級分組，每個等級內再按岩場分組
    const routesByGradeAndCrag = new Map<string, Map<string, typeof routes.results>>();
    const gradeLevels = ['beginner', 'intermediate', 'advanced', 'expert'];

    for (const level of gradeLevels) {
      routesByGradeAndCrag.set(level, new Map());
    }

    for (const route of routes.results) {
      const level = getGradeLevel(route.grade);
      const cragMap = routesByGradeAndCrag.get(level);
      if (cragMap) {
        const list = cragMap.get(route.crag_id) || [];
        list.push(route);
        cragMap.set(route.crag_id, list);
      }
    }

    // 從不同難度等級和岩場輪流選取
    const result: typeof routes.results = [];
    const gradeIndices = new Map<string, Map<string, number>>();

    for (const level of gradeLevels) {
      const cragMap = routesByGradeAndCrag.get(level)!;
      const indices = new Map<string, number>();
      for (const cragId of cragMap.keys()) {
        indices.set(cragId, 0);
      }
      gradeIndices.set(level, indices);
    }

    let levelIndex = 0;
    const usedIds = new Set<string>();

    while (result.length < limit) {
      let added = false;

      // 嘗試每個難度等級
      for (let i = 0; i < gradeLevels.length && result.length < limit; i++) {
        const level = gradeLevels[(levelIndex + i) % gradeLevels.length];
        const cragMap = routesByGradeAndCrag.get(level)!;
        const indices = gradeIndices.get(level)!;
        const cragIds = Array.from(cragMap.keys());

        // 在該難度等級內從不同岩場選取
        for (const cragId of cragIds) {
          if (result.length >= limit) break;
          const cragRoutes = cragMap.get(cragId)!;
          const idx = indices.get(cragId)!;

          // 找到下一個未使用的路線
          let foundIdx = idx;
          while (foundIdx < cragRoutes.length && usedIds.has(cragRoutes[foundIdx].id)) {
            foundIdx++;
          }

          if (foundIdx < cragRoutes.length) {
            const route = cragRoutes[foundIdx];
            result.push(route);
            usedIds.add(route.id);
            indices.set(cragId, foundIdx + 1);
            added = true;
            break; // 每輪每個難度等級只選一條
          }
        }
      }

      levelIndex++;
      if (!added) break;
    }

    // 直接使用從 videos 表查詢的縮圖
    const data = result.map(route => ({
      id: route.id,
      name: route.name,
      nameEn: route.name_en || '',
      grade: route.grade,
      type: route.route_type,
      length: route.height || undefined,
      boltCount: route.bolt_count,
      cragId: route.crag_id,
      cragName: route.crag_name,
      areaId: route.area_id || undefined,
      areaName: route.area_name || undefined,
      youtubeThumbnail: route.youtube_thumbnail || undefined,
      ascentCount: route.ascent_count || 0,
      storyCount: route.story_count || 0,
    }));

    return c.json({
      success: true,
      data,
    });
  }
);

// GET /crags/:id - Get crag by ID
cragsRoutes.get(
  '/:id',
  describeRoute({
    tags: ['Crags'],
    summary: '取得單一岩場',
    description: '根據岩場 ID 取得岩場詳細資訊',
    responses: {
      200: { description: '成功取得岩場資訊' },
      404: { description: '找不到岩場' },
    },
  }),
  validator('param', cragIdParamSchema),
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

  return c.json({
    success: true,
    data: {
      ...crag,
      climbing_types: crag.climbing_types ? JSON.parse(crag.climbing_types) : [],
      images: crag.images ? JSON.parse(crag.images) : [],
      best_seasons: crag.best_seasons ? JSON.parse(crag.best_seasons) : [],
      transportation: crag.transportation ? JSON.parse(crag.transportation) : [],
      amenities: crag.amenities ? JSON.parse(crag.amenities) : [],
    },
  });
});

// GET /crags/slug/:slug - Get crag by slug
cragsRoutes.get(
  '/slug/:slug',
  describeRoute({
    tags: ['Crags'],
    summary: '根據 Slug 取得岩場',
    description: '根據岩場的 URL slug 取得岩場詳細資訊',
    responses: {
      200: { description: '成功取得岩場資訊' },
      404: { description: '找不到岩場' },
    },
  }),
  validator('param', cragSlugParamSchema),
  async (c) => {
  const slug = c.req.param('slug');

  const crag = await c.env.DB.prepare('SELECT * FROM crags WHERE slug = ?')
    .bind(slug)
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

  return c.json({
    success: true,
    data: {
      ...crag,
      climbing_types: crag.climbing_types ? JSON.parse(crag.climbing_types) : [],
      images: crag.images ? JSON.parse(crag.images) : [],
      best_seasons: crag.best_seasons ? JSON.parse(crag.best_seasons) : [],
      transportation: crag.transportation ? JSON.parse(crag.transportation) : [],
      amenities: crag.amenities ? JSON.parse(crag.amenities) : [],
    },
  });
});

// GET /crags/:id/routes - Get routes for a crag
cragsRoutes.get(
  '/:id/routes',
  describeRoute({
    tags: ['Crags'],
    summary: '取得岩場的路線列表',
    description: '根據岩場 ID 取得該岩場的所有攀岩路線，包含關聯影片資訊',
    responses: {
      200: { description: '成功取得路線列表' },
    },
  }),
  validator('param', cragIdParamSchema),
  async (c) => {
  const cragId = c.req.param('id');

  // 取得路線列表
  const routes = await c.env.DB.prepare(
    'SELECT * FROM routes WHERE crag_id = ? ORDER BY grade ASC'
  )
    .bind(cragId)
    .all<{
      id: string;
      crag_id: string;
      name: string;
      grade: string | null;
      grade_system: string | null;
      height: number | null;
      bolt_count: number | null;
      route_type: string | null;
      description: string | null;
      first_ascent: string | null;
      created_at: string | null;
    }>();

  if (routes.results.length === 0) {
    return c.json({
      success: true,
      data: [],
    });
  }

  // 透過 crag_id JOIN 查詢路線關聯的影片，避免 IN 子句的變數限制
  const routeVideos = await c.env.DB.prepare(
    `SELECT rv.route_id, v.id, v.title, v.youtube_id, v.thumbnail_url, v.duration, v.channel, v.channel_id, v.published_at
     FROM route_videos rv
     JOIN videos v ON rv.video_id = v.id
     JOIN routes r ON rv.route_id = r.id
     WHERE r.crag_id = ?
     ORDER BY v.published_at DESC NULLS LAST`
  )
    .bind(cragId)
    .all<{
      route_id: string;
      id: string;
      title: string;
      youtube_id: string | null;
      thumbnail_url: string | null;
      duration: number | null;
      channel: string | null;
      channel_id: string | null;
      published_at: string | null;
    }>();

  // 建立路線 ID 到影片陣列的映射
  const videosByRoute = new Map<string, typeof routeVideos.results>();
  for (const rv of routeVideos.results) {
    const list = videosByRoute.get(rv.route_id) || [];
    list.push(rv);
    videosByRoute.set(rv.route_id, list);
  }

  // 組合路線與影片資料
  const data = routes.results.map((route) => ({
    ...route,
    videos: (videosByRoute.get(route.id) || []).map(v => ({
      id: v.id,
      title: v.title,
      youtubeId: v.youtube_id,
      thumbnailUrl: v.thumbnail_url,
      duration: v.duration,
      channel: v.channel,
      channelId: v.channel_id,
      publishedAt: v.published_at,
    })),
  }));

  return c.json({
    success: true,
    data,
  });
});

// GET /crags/:id/areas - Get areas for a crag
cragsRoutes.get(
  '/:id/areas',
  describeRoute({
    tags: ['Crags'],
    summary: '取得岩場的區域列表',
    description: '根據岩場 ID 取得該岩場的所有區域',
    responses: {
      200: { description: '成功取得區域列表' },
    },
  }),
  validator('param', cragIdParamSchema),
  async (c) => {
  const cragId = c.req.param('id');

  const areas = await c.env.DB.prepare(
    'SELECT * FROM areas WHERE crag_id = ? ORDER BY sort_order ASC, name ASC'
  )
    .bind(cragId)
    .all();

  return c.json({
    success: true,
    data: areas.results,
  });
});

// POST /crags - Create new crag (admin only)
cragsRoutes.post(
  '/',
  describeRoute({
    tags: ['Crags'],
    summary: '新增岩場',
    description: '建立新的岩場資料，需要管理員權限',
    responses: {
      201: { description: '成功建立岩場' },
      400: { description: '請求參數錯誤，缺少必填欄位' },
      401: { description: '未認證' },
      403: { description: '沒有管理員權限' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  validator('json', createCragSchema),
  async (c) => {
  const body = c.req.valid('json');

  const id = generateId();
  const slug = body.slug || generateSlug(body.name);

  await c.env.DB.prepare(
    `INSERT INTO crags (
      id, name, slug, description, location, region,
      latitude, longitude, altitude, rock_type, climbing_types,
      difficulty_range, route_count, bolt_count, cover_image, images,
      is_featured, access_info, parking_info, approach_time, best_seasons, restrictions
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      body.name,
      slug,
      body.description || null,
      body.location || null,
      body.region || null,
      body.latitude || null,
      body.longitude || null,
      body.altitude || null,
      body.rock_type || null,
      body.climbing_types ? JSON.stringify(body.climbing_types) : null,
      body.difficulty_range || null,
      body.route_count || 0,
      body.bolt_count || 0,
      body.cover_image || null,
      body.images ? JSON.stringify(body.images) : null,
      body.is_featured || 0,
      body.access_info || null,
      body.parking_info || null,
      body.approach_time || null,
      body.best_seasons ? JSON.stringify(body.best_seasons) : null,
      body.restrictions || null
    )
    .run();

  const crag = await c.env.DB.prepare('SELECT * FROM crags WHERE id = ?')
    .bind(id)
    .first<Crag>();

  return c.json(
    {
      success: true,
      data: crag,
    },
    201
  );
});

// PUT /crags/:id - Update crag (admin only)
cragsRoutes.put(
  '/:id',
  describeRoute({
    tags: ['Crags'],
    summary: '更新岩場',
    description: '更新岩場資料，需要管理員權限',
    responses: {
      200: { description: '成功更新岩場' },
      400: { description: '請求參數錯誤，沒有提供要更新的欄位' },
      401: { description: '未認證' },
      403: { description: '沒有管理員權限' },
      404: { description: '找不到岩場' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  validator('param', cragIdParamSchema),
  validator('json', updateCragSchema),
  async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');

  const existing = await c.env.DB.prepare('SELECT id FROM crags WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Crag not found',
      },
      404
    );
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  const fields = [
    'name',
    'description',
    'location',
    'region',
    'latitude',
    'longitude',
    'altitude',
    'rock_type',
    'difficulty_range',
    'route_count',
    'bolt_count',
    'cover_image',
    'is_featured',
    'access_info',
    'parking_info',
    'approach_time',
    'restrictions',
  ];

  for (const field of fields) {
    if (body[field as keyof typeof body] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field as keyof typeof body] as string | number | null);
    }
  }

  // Handle JSON fields
  if (body.climbing_types !== undefined) {
    updates.push('climbing_types = ?');
    values.push(JSON.stringify(body.climbing_types));
  }
  if (body.images !== undefined) {
    updates.push('images = ?');
    values.push(JSON.stringify(body.images));
  }
  if (body.best_seasons !== undefined) {
    updates.push('best_seasons = ?');
    values.push(JSON.stringify(body.best_seasons));
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

  updates.push("updated_at = datetime('now')");
  values.push(id);

  await c.env.DB.prepare(
    `UPDATE crags SET ${updates.join(', ')} WHERE id = ?`
  )
    .bind(...values)
    .run();

  const crag = await c.env.DB.prepare('SELECT * FROM crags WHERE id = ?')
    .bind(id)
    .first<Crag>();

  return c.json({
    success: true,
    data: crag,
  });
});

// DELETE /crags/:id - Delete crag (admin only)
cragsRoutes.delete(
  '/:id',
  describeRoute({
    tags: ['Crags'],
    summary: '刪除岩場',
    description: '刪除岩場資料及其相關圖片，需要管理員權限',
    responses: {
      200: { description: '成功刪除岩場' },
      401: { description: '未認證' },
      403: { description: '沒有管理員權限' },
      404: { description: '找不到岩場' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  validator('param', cragIdParamSchema),
  async (c) => {
  const id = c.req.param('id');

  const existing = await c.env.DB.prepare('SELECT id, images FROM crags WHERE id = ?')
    .bind(id)
    .first<{ id: string; images: string | null }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Crag not found',
      },
      404
    );
  }

  // Delete images from R2 (images is JSON array)
  if (existing.images) {
    try {
      const imageUrls = JSON.parse(existing.images) as string[];
      await deleteR2Images(c.env.STORAGE, imageUrls);
    } catch {
      // Ignore JSON parse errors
    }
  }

  await c.env.DB.prepare('DELETE FROM crags WHERE id = ?').bind(id).run();

  return c.json({
    success: true,
    message: 'Crag deleted successfully',
  });
});
