import { Hono } from 'hono';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';
import { Env } from '../types';
import { generateId } from '../utils/id';
import { authMiddleware } from '../middleware/auth';

export const climbingLocationsRoutes = new Hono<{ Bindings: Env }>();

// ═══════════════════════════════════════════════════════════
// 攀岩足跡 API (正規化表格)
// ═══════════════════════════════════════════════════════════

interface ClimbingLocation {
  id: string;
  biography_id: string;
  location: string;
  country: string;
  visit_year: string | null;
  notes: string | null;
  photos: string | null;
  is_public: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// GET /climbing-locations - Get current user's climbing locations
climbingLocationsRoutes.get(
  '/',
  describeRoute({
    tags: ['ClimbingLocations'],
    summary: '取得當前使用者的攀岩足跡',
    description: '取得當前已登入使用者的所有攀岩足跡紀錄，依排序順序和建立時間排列',
    responses: {
      200: { description: '成功取得攀岩足跡列表' },
      401: { description: '未授權，需要登入' },
    },
  }),
  authMiddleware,
  async (c) => {
  const userId = c.get('userId');

  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json({
      success: true,
      data: [],
    });
  }

  const locations = await c.env.DB.prepare(
    `SELECT * FROM climbing_locations
     WHERE biography_id = ?
     ORDER BY sort_order ASC, created_at DESC`
  )
    .bind(biography.id)
    .all<ClimbingLocation>();

  // Parse photos JSON
  const parsedLocations = (locations.results || []).map((loc) => ({
    ...loc,
    photos: loc.photos ? JSON.parse(loc.photos) : null,
    is_public: Boolean(loc.is_public),
  }));

  return c.json({
    success: true,
    data: parsedLocations,
  });
});

// GET /climbing-locations/biography/:id - Get a biography's public climbing locations
climbingLocationsRoutes.get(
  '/biography/:id',
  describeRoute({
    tags: ['ClimbingLocations'],
    summary: '取得指定自傳的公開攀岩足跡',
    description: '根據自傳 ID 取得該使用者的公開攀岩足跡紀錄',
    responses: {
      200: { description: '成功取得攀岩足跡列表' },
    },
  }),
  async (c) => {
  const biographyId = c.req.param('id');

  const locations = await c.env.DB.prepare(
    `SELECT * FROM climbing_locations
     WHERE biography_id = ? AND is_public = 1
     ORDER BY sort_order ASC, created_at DESC`
  )
    .bind(biographyId)
    .all<ClimbingLocation>();

  const parsedLocations = (locations.results || []).map((loc) => ({
    ...loc,
    photos: loc.photos ? JSON.parse(loc.photos) : null,
    is_public: true,
  }));

  return c.json({
    success: true,
    data: parsedLocations,
  });
});

// POST /climbing-locations - Add a new climbing location
climbingLocationsRoutes.post(
  '/',
  describeRoute({
    tags: ['ClimbingLocations'],
    summary: '新增攀岩足跡',
    description: '為當前使用者新增一筆攀岩足跡紀錄，需提供地點和國家',
    responses: {
      201: { description: '成功新增攀岩足跡' },
      400: { description: '請求格式錯誤，缺少必要欄位' },
      401: { description: '未授權，需要登入' },
      404: { description: '找不到使用者的自傳' },
    },
  }),
  authMiddleware,
  async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{
    location: string;
    country: string;
    visit_year?: string;
    notes?: string;
    photos?: string[];
    is_public?: boolean;
  }>();

  if (!body.location || !body.country) {
    return c.json({
      success: false,
      error: 'Bad Request',
      message: 'Location and country are required',
    }, 400);
  }

  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json({
      success: false,
      error: 'Not Found',
      message: 'Biography not found. Create one first.',
    }, 404);
  }

  // Get max sort_order
  const maxOrder = await c.env.DB.prepare(
    'SELECT MAX(sort_order) as max_order FROM climbing_locations WHERE biography_id = ?'
  )
    .bind(biography.id)
    .first<{ max_order: number | null }>();

  const id = generateId();
  const sortOrder = (maxOrder?.max_order ?? -1) + 1;

  await c.env.DB.prepare(
    `INSERT INTO climbing_locations
     (id, biography_id, location, country, visit_year, notes, photos, is_public, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      biography.id,
      body.location,
      body.country,
      body.visit_year || null,
      body.notes || null,
      body.photos ? JSON.stringify(body.photos) : null,
      body.is_public !== false ? 1 : 0,
      sortOrder
    )
    .run();

  const location = await c.env.DB.prepare(
    'SELECT * FROM climbing_locations WHERE id = ?'
  )
    .bind(id)
    .first<ClimbingLocation>();

  return c.json({
    success: true,
    data: {
      ...location,
      photos: location?.photos ? JSON.parse(location.photos) : null,
      is_public: Boolean(location?.is_public),
    },
  }, 201);
});

// PUT /climbing-locations/:id - Update a climbing location
climbingLocationsRoutes.put(
  '/:id',
  describeRoute({
    tags: ['ClimbingLocations'],
    summary: '更新攀岩足跡',
    description: '更新指定 ID 的攀岩足跡紀錄，只能更新自己的紀錄',
    responses: {
      200: { description: '成功更新攀岩足跡' },
      401: { description: '未授權，需要登入' },
      404: { description: '找不到指定的攀岩足跡' },
    },
  }),
  authMiddleware,
  async (c) => {
  const userId = c.get('userId');
  const locationId = c.req.param('id');
  const body = await c.req.json<{
    location?: string;
    country?: string;
    visit_year?: string | null;
    notes?: string | null;
    photos?: string[] | null;
    is_public?: boolean;
    sort_order?: number;
  }>();

  // Verify ownership
  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json({
      success: false,
      error: 'Not Found',
      message: 'Biography not found',
    }, 404);
  }

  const existing = await c.env.DB.prepare(
    'SELECT id FROM climbing_locations WHERE id = ? AND biography_id = ?'
  )
    .bind(locationId, biography.id)
    .first<{ id: string }>();

  if (!existing) {
    return c.json({
      success: false,
      error: 'Not Found',
      message: 'Climbing location not found',
    }, 404);
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (body.location !== undefined) {
    updates.push('location = ?');
    values.push(body.location);
  }
  if (body.country !== undefined) {
    updates.push('country = ?');
    values.push(body.country);
  }
  if (body.visit_year !== undefined) {
    updates.push('visit_year = ?');
    values.push(body.visit_year);
  }
  if (body.notes !== undefined) {
    updates.push('notes = ?');
    values.push(body.notes);
  }
  if (body.photos !== undefined) {
    updates.push('photos = ?');
    values.push(body.photos ? JSON.stringify(body.photos) : null);
  }
  if (body.is_public !== undefined) {
    updates.push('is_public = ?');
    values.push(body.is_public ? 1 : 0);
  }
  if (body.sort_order !== undefined) {
    updates.push('sort_order = ?');
    values.push(body.sort_order);
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(locationId);

    await c.env.DB.prepare(
      `UPDATE climbing_locations SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();
  }

  const location = await c.env.DB.prepare(
    'SELECT * FROM climbing_locations WHERE id = ?'
  )
    .bind(locationId)
    .first<ClimbingLocation>();

  return c.json({
    success: true,
    data: {
      ...location,
      photos: location?.photos ? JSON.parse(location.photos) : null,
      is_public: Boolean(location?.is_public),
    },
  });
});

// DELETE /climbing-locations/:id - Delete a climbing location
climbingLocationsRoutes.delete(
  '/:id',
  describeRoute({
    tags: ['ClimbingLocations'],
    summary: '刪除攀岩足跡',
    description: '刪除指定 ID 的攀岩足跡紀錄，只能刪除自己的紀錄',
    responses: {
      200: { description: '成功刪除攀岩足跡' },
      401: { description: '未授權，需要登入' },
      404: { description: '找不到指定的攀岩足跡' },
    },
  }),
  authMiddleware,
  async (c) => {
  const userId = c.get('userId');
  const locationId = c.req.param('id');

  // Verify ownership
  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json({
      success: false,
      error: 'Not Found',
      message: 'Biography not found',
    }, 404);
  }

  const existing = await c.env.DB.prepare(
    'SELECT id FROM climbing_locations WHERE id = ? AND biography_id = ?'
  )
    .bind(locationId, biography.id)
    .first<{ id: string }>();

  if (!existing) {
    return c.json({
      success: false,
      error: 'Not Found',
      message: 'Climbing location not found',
    }, 404);
  }

  await c.env.DB.prepare('DELETE FROM climbing_locations WHERE id = ?')
    .bind(locationId)
    .run();

  return c.json({
    success: true,
    message: 'Climbing location deleted',
  });
});

// PUT /climbing-locations/reorder - Reorder climbing locations
climbingLocationsRoutes.put(
  '/reorder',
  describeRoute({
    tags: ['ClimbingLocations'],
    summary: '重新排序攀岩足跡',
    description: '根據提供的 ID 陣列重新排序使用者的攀岩足跡',
    responses: {
      200: { description: '成功更新排序' },
      400: { description: '請求格式錯誤，缺少排序陣列' },
      401: { description: '未授權，需要登入' },
      404: { description: '找不到使用者的自傳' },
    },
  }),
  authMiddleware,
  async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{
    order: string[]; // Array of location IDs in desired order
  }>();

  if (!body.order || !Array.isArray(body.order)) {
    return c.json({
      success: false,
      error: 'Bad Request',
      message: 'Order array is required',
    }, 400);
  }

  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json({
      success: false,
      error: 'Not Found',
      message: 'Biography not found',
    }, 404);
  }

  // Update sort_order for each location
  for (let i = 0; i < body.order.length; i++) {
    await c.env.DB.prepare(
      'UPDATE climbing_locations SET sort_order = ? WHERE id = ? AND biography_id = ?'
    )
      .bind(i, body.order[i], biography.id)
      .run();
  }

  return c.json({
    success: true,
    message: 'Order updated',
  });
});

// POST /climbing-locations/migrate - Migrate JSON data to table (one-time use)
climbingLocationsRoutes.post(
  '/migrate',
  describeRoute({
    tags: ['ClimbingLocations'],
    summary: '遷移攀岩足跡資料',
    description: '將舊版 JSON 格式的攀岩足跡資料遷移到正規化表格（一次性使用）',
    responses: {
      200: { description: '成功遷移資料或無需遷移' },
      400: { description: 'JSON 格式錯誤' },
      401: { description: '未授權，需要登入' },
      404: { description: '找不到使用者的自傳' },
      500: { description: '遷移失敗' },
    },
  }),
  authMiddleware,
  async (c) => {
  const userId = c.get('userId');

  const biography = await c.env.DB.prepare(
    'SELECT id, climbing_locations FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string; climbing_locations: string | null }>();

  if (!biography) {
    return c.json({
      success: false,
      error: 'Not Found',
      message: 'Biography not found',
    }, 404);
  }

  if (!biography.climbing_locations) {
    return c.json({
      success: true,
      message: 'No data to migrate',
      data: { migrated: 0 },
    });
  }

  // Check if already migrated
  const existingCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM climbing_locations WHERE biography_id = ?'
  )
    .bind(biography.id)
    .first<{ count: number }>();

  if ((existingCount?.count || 0) > 0) {
    return c.json({
      success: true,
      message: 'Already migrated',
      data: { migrated: 0 },
    });
  }

  try {
    const jsonLocations = JSON.parse(biography.climbing_locations) as Array<{
      location: string;
      country: string;
      visit_year?: string;
      notes?: string;
      photos?: string[];
      is_public?: boolean;
    }>;

    if (!Array.isArray(jsonLocations)) {
      return c.json({
        success: false,
        error: 'Bad Data',
        message: 'Invalid JSON format',
      }, 400);
    }

    let migrated = 0;
    for (let i = 0; i < jsonLocations.length; i++) {
      const loc = jsonLocations[i];
      const id = generateId();

      await c.env.DB.prepare(
        `INSERT INTO climbing_locations
         (id, biography_id, location, country, visit_year, notes, photos, is_public, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          id,
          biography.id,
          loc.location,
          loc.country,
          loc.visit_year || null,
          loc.notes || null,
          loc.photos ? JSON.stringify(loc.photos) : null,
          loc.is_public !== false ? 1 : 0,
          i
        )
        .run();
      migrated++;
    }

    return c.json({
      success: true,
      message: 'Migration completed',
      data: { migrated },
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Migration Failed',
      message: 'Failed to parse JSON data',
    }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
// 探索 API - 使用正規化表格
// ═══════════════════════════════════════════════════════════

// GET /climbing-locations/explore - Get all public locations with visitor stats
climbingLocationsRoutes.get(
  '/explore',
  describeRoute({
    tags: ['ClimbingLocations'],
    summary: '探索攀岩地點',
    description: '取得所有公開的攀岩地點及訪客統計資料，支援國家篩選和分頁',
    responses: {
      200: { description: '成功取得攀岩地點列表' },
    },
  }),
  async (c) => {
  const country = c.req.query('country');
  const limit = parseInt(c.req.query('limit') || '20', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  let whereClause = 'cl.is_public = 1';
  const params: (string | number)[] = [];

  if (country) {
    whereClause += ' AND cl.country = ?';
    params.push(country);
  }

  // Get locations with visitor counts
  const locations = await c.env.DB.prepare(
    `SELECT
      cl.location,
      cl.country,
      COUNT(DISTINCT cl.biography_id) as visitor_count
     FROM climbing_locations cl
     JOIN biographies b ON b.id = cl.biography_id AND b.visibility = 'public'
     WHERE ${whereClause}
     GROUP BY cl.location, cl.country
     ORDER BY visitor_count DESC
     LIMIT ? OFFSET ?`
  )
    .bind(...params, limit, offset)
    .all();

  // Get total count
  const totalResult = await c.env.DB.prepare(
    `SELECT COUNT(DISTINCT cl.location || '|' || cl.country) as count
     FROM climbing_locations cl
     JOIN biographies b ON b.id = cl.biography_id AND b.visibility = 'public'
     WHERE ${whereClause}`
  )
    .bind(...params)
    .first<{ count: number }>();

  return c.json({
    success: true,
    data: locations.results,
    pagination: {
      total: totalResult?.count || 0,
      limit,
      offset,
    },
  });
});

// GET /climbing-locations/explore/:location - Get location details with visitors
climbingLocationsRoutes.get(
  '/explore/:location',
  describeRoute({
    tags: ['ClimbingLocations'],
    summary: '取得攀岩地點詳情',
    description: '根據地點名稱取得該地點的詳細資訊及所有訪客清單',
    responses: {
      200: { description: '成功取得地點詳情' },
      404: { description: '找不到該地點或無訪客紀錄' },
    },
  }),
  async (c) => {
  const locationName = decodeURIComponent(c.req.param('location'));

  const visitors = await c.env.DB.prepare(
    `SELECT
      cl.biography_id,
      b.name as biography_name,
      b.slug as biography_slug,
      b.avatar_url,
      cl.country,
      cl.visit_year,
      cl.notes
     FROM climbing_locations cl
     JOIN biographies b ON b.id = cl.biography_id AND b.visibility = 'public'
     WHERE cl.location = ? AND cl.is_public = 1
     ORDER BY cl.visit_year DESC`
  )
    .bind(locationName)
    .all();

  if (!visitors.results || visitors.results.length === 0) {
    return c.json({
      success: false,
      error: 'Not Found',
      message: 'Location not found or no visitors',
    }, 404);
  }

  const firstResult = visitors.results[0] as { country?: string };

  return c.json({
    success: true,
    data: {
      location: locationName,
      country: firstResult.country,
      visitor_count: visitors.results.length,
      visitors: visitors.results,
    },
  });
});

// GET /climbing-locations/explore/countries - Get countries with location counts
climbingLocationsRoutes.get(
  '/explore/countries',
  describeRoute({
    tags: ['ClimbingLocations'],
    summary: '取得國家列表及統計',
    description: '取得所有有攀岩地點紀錄的國家列表，包含各國的地點數和訪客數',
    responses: {
      200: { description: '成功取得國家統計列表' },
    },
  }),
  async (c) => {
  const countries = await c.env.DB.prepare(
    `SELECT
      cl.country,
      COUNT(DISTINCT cl.location) as location_count,
      COUNT(DISTINCT cl.biography_id) as visitor_count
     FROM climbing_locations cl
     JOIN biographies b ON b.id = cl.biography_id AND b.visibility = 'public'
     WHERE cl.is_public = 1
     GROUP BY cl.country
     ORDER BY visitor_count DESC`
  ).all();

  return c.json({
    success: true,
    data: countries.results,
  });
});
