import { Hono } from 'hono';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';
import { Env } from '../types';
import { generateId } from '../utils/id';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { createNotification, createLikeNotificationWithAggregation } from './notifications';

export const bucketListRoutes = new Hono<{ Bindings: Env }>();

// ═══════════════════════════════════════════════════════════
// 探索功能 (MUST be defined before /:biographyId to avoid route conflicts)
// ═══════════════════════════════════════════════════════════

// GET /bucket-list/explore/trending - Get trending bucket list items
bucketListRoutes.get(
  '/explore/trending',
  describeRoute({
    tags: ['BucketList'],
    summary: '取得熱門人生清單項目',
    description: '依據按讚數和被引用數排序，取得熱門的公開人生清單項目',
    responses: {
      200: { description: '成功取得熱門人生清單項目' },
    },
  }),
  async (c) => {
  const limit = parseInt(c.req.query('limit') || '10', 10);

  const items = await c.env.DB.prepare(
    `SELECT bli.*, b.name as author_name, b.avatar_url as author_avatar, b.slug as author_slug
     FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.is_public = 1 AND b.visibility = 'public'
     ORDER BY (bli.likes_count + bli.inspired_count * 2) DESC, bli.created_at DESC
     LIMIT ?`
  )
    .bind(limit)
    .all();

  return c.json({
    success: true,
    data: items.results,
  });
});

// GET /bucket-list/explore/recent-completed - Get recently completed items
bucketListRoutes.get(
  '/explore/recent-completed',
  describeRoute({
    tags: ['BucketList'],
    summary: '取得最近完成的人生清單項目',
    description: '取得最近完成的公開人生清單項目，依完成時間排序',
    responses: {
      200: { description: '成功取得最近完成的人生清單項目' },
    },
  }),
  async (c) => {
  const limit = parseInt(c.req.query('limit') || '10', 10);

  const items = await c.env.DB.prepare(
    `SELECT bli.*, b.name as author_name, b.avatar_url as author_avatar, b.slug as author_slug
     FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.status = 'completed' AND bli.is_public = 1 AND b.visibility = 'public'
     ORDER BY bli.completed_at DESC
     LIMIT ?`
  )
    .bind(limit)
    .all();

  return c.json({
    success: true,
    data: items.results,
  });
});

// GET /bucket-list/explore/by-category/:category - Get items by category
bucketListRoutes.get(
  '/explore/by-category/:category',
  describeRoute({
    tags: ['BucketList'],
    summary: '依分類取得人生清單項目',
    description: '依據指定分類取得公開的人生清單項目',
    responses: {
      200: { description: '成功取得指定分類的人生清單項目' },
    },
  }),
  async (c) => {
  const category = c.req.param('category');
  const limit = parseInt(c.req.query('limit') || '20', 10);

  const items = await c.env.DB.prepare(
    `SELECT bli.*, b.name as author_name, b.avatar_url as author_avatar, b.slug as author_slug
     FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.category = ? AND bli.is_public = 1 AND b.visibility = 'public'
     ORDER BY bli.likes_count DESC, bli.created_at DESC
     LIMIT ?`
  )
    .bind(category, limit)
    .all();

  return c.json({
    success: true,
    data: items.results,
  });
});

// GET /bucket-list/explore/category-counts - Get counts for all categories (solves N+1 problem)
bucketListRoutes.get(
  '/explore/category-counts',
  describeRoute({
    tags: ['BucketList'],
    summary: '取得各分類的項目數量',
    description: '取得所有分類的公開人生清單項目數量統計',
    responses: {
      200: { description: '成功取得各分類的項目數量' },
    },
  }),
  async (c) => {
  const counts = await c.env.DB.prepare(
    `SELECT
      bli.category,
      COUNT(*) as count
     FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.is_public = 1 AND b.visibility = 'public'
     GROUP BY bli.category`
  ).all();

  return c.json({
    success: true,
    data: counts.results,
  });
});

// GET /bucket-list/explore/by-location/:location - Get items by location
bucketListRoutes.get(
  '/explore/by-location/:location',
  describeRoute({
    tags: ['BucketList'],
    summary: '依地點取得人生清單項目',
    description: '依據指定地點取得公開的人生清單項目',
    responses: {
      200: { description: '成功取得指定地點的人生清單項目' },
    },
  }),
  async (c) => {
  const location = c.req.param('location');
  const limit = parseInt(c.req.query('limit') || '20', 10);

  const items = await c.env.DB.prepare(
    `SELECT bli.*, b.name as author_name, b.avatar_url as author_avatar, b.slug as author_slug
     FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.target_location LIKE ? AND bli.is_public = 1 AND b.visibility = 'public'
     ORDER BY bli.likes_count DESC, bli.created_at DESC
     LIMIT ?`
  )
    .bind(`%${location}%`, limit)
    .all();

  return c.json({
    success: true,
    data: items.results,
  });
});

// GET /bucket-list/explore/locations - Get popular climbing locations from bucket list
bucketListRoutes.get(
  '/explore/locations',
  describeRoute({
    tags: ['BucketList'],
    summary: '取得熱門攀岩地點',
    description: '從人生清單項目中取得熱門攀岩地點列表，支援國家篩選',
    responses: {
      200: { description: '成功取得熱門攀岩地點列表' },
    },
  }),
  async (c) => {
  const limit = parseInt(c.req.query('limit') || '20', 10);
  const country = c.req.query('country'); // Optional country filter

  // Get locations from bucket list items (target_location field)
  let query = `
    SELECT
      bli.target_location as location,
      COUNT(DISTINCT bli.id) as item_count,
      COUNT(DISTINCT bli.biography_id) as user_count,
      SUM(CASE WHEN bli.status = 'completed' THEN 1 ELSE 0 END) as completed_count
    FROM bucket_list_items bli
    JOIN biographies b ON bli.biography_id = b.id
    WHERE bli.target_location IS NOT NULL
      AND bli.target_location != ''
      AND bli.is_public = 1
      AND b.visibility = 'public'
  `;

  const params: (string | number)[] = [];

  if (country) {
    query += ` AND bli.target_location LIKE ?`;
    params.push(`%${country}%`);
  }

  query += `
    GROUP BY bli.target_location
    ORDER BY user_count DESC, completed_count DESC
    LIMIT ?
  `;
  params.push(limit);

  const locations = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    success: true,
    data: locations.results,
  });
});

// GET /bucket-list/explore/locations/:location - Get location details
bucketListRoutes.get(
  '/explore/locations/:location',
  describeRoute({
    tags: ['BucketList'],
    summary: '取得特定地點詳情',
    description: '取得指定攀岩地點的詳細資訊，包含統計數據和訪客列表',
    responses: {
      200: { description: '成功取得地點詳情' },
    },
  }),
  async (c) => {
  const location = decodeURIComponent(c.req.param('location'));
  const limit = parseInt(c.req.query('limit') || '10', 10);

  // Get items for this location
  const items = await c.env.DB.prepare(
    `SELECT bli.*, b.name as author_name, b.avatar_url as author_avatar, b.slug as author_slug
     FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.target_location = ? AND bli.is_public = 1 AND b.visibility = 'public'
     ORDER BY bli.status = 'completed' DESC, bli.likes_count DESC, bli.created_at DESC
     LIMIT ?`
  )
    .bind(location, limit)
    .all();

  // Get statistics for this location
  const stats = await c.env.DB.prepare(
    `SELECT
      COUNT(DISTINCT bli.id) as total_items,
      COUNT(DISTINCT bli.biography_id) as total_users,
      SUM(CASE WHEN bli.status = 'completed' THEN 1 ELSE 0 END) as completed_count
     FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.target_location = ? AND bli.is_public = 1 AND b.visibility = 'public'`
  )
    .bind(location)
    .first<{ total_items: number; total_users: number; completed_count: number }>();

  // Get users who have visited (completed) this location
  const visitors = await c.env.DB.prepare(
    `SELECT DISTINCT b.id, b.name, b.avatar_url, b.slug, bli.completed_at
     FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.target_location = ?
       AND bli.status = 'completed'
       AND bli.is_public = 1
       AND b.visibility = 'public'
     ORDER BY bli.completed_at DESC
     LIMIT 10`
  )
    .bind(location)
    .all();

  return c.json({
    success: true,
    data: {
      location,
      stats: stats || { total_items: 0, total_users: 0, completed_count: 0 },
      items: items.results,
      visitors: visitors.results,
    },
  });
});

// GET /bucket-list/explore/climbing-footprints - Get climbing locations from normalized table
bucketListRoutes.get(
  '/explore/climbing-footprints',
  describeRoute({
    tags: ['BucketList'],
    summary: '取得攀岩足跡地點',
    description: '從標準化表格取得攀岩地點和訪客資訊，支援台灣/海外篩選',
    responses: {
      200: { description: '成功取得攀岩足跡地點' },
    },
  }),
  async (c) => {
  const limit = parseInt(c.req.query('limit') || '20', 10);
  const country = c.req.query('country'); // 'taiwan' or 'overseas'

  // Build country filter (使用統一的台灣名稱列表)
  let countryFilter = '';
  if (country === 'taiwan') {
    countryFilter = "AND LOWER(cl.country) IN ('台灣', '臺灣', 'taiwan', 'tw')";
  } else if (country === 'overseas') {
    countryFilter = "AND LOWER(cl.country) NOT IN ('台灣', '臺灣', 'taiwan', 'tw')";
  }

  // Step 1: 先查詢熱門地點（按訪客數排序，限制數量）
  const topLocations = await c.env.DB.prepare(
    `SELECT
      cl.location,
      cl.country,
      COUNT(DISTINCT cl.biography_id) as visitor_count
    FROM climbing_locations cl
    JOIN biographies b ON b.id = cl.biography_id AND b.visibility = 'public'
    WHERE cl.is_public = 1 ${countryFilter}
    GROUP BY cl.location, cl.country
    ORDER BY visitor_count DESC
    LIMIT ?`
  )
    .bind(limit)
    .all<{ location: string; country: string; visitor_count: number }>();

  if (!topLocations.results || topLocations.results.length === 0) {
    return c.json({
      success: true,
      data: [],
    });
  }

  // Step 2: 查詢這些地點的訪客詳情
  const locationNames = topLocations.results.map(loc => loc.location);
  const placeholders = locationNames.map(() => '?').join(',');

  const visitors = await c.env.DB.prepare(
    `SELECT
      cl.location,
      cl.country,
      b.id as biography_id,
      b.name,
      b.avatar_url,
      b.slug
    FROM climbing_locations cl
    JOIN biographies b ON b.id = cl.biography_id AND b.visibility = 'public'
    WHERE cl.is_public = 1 AND cl.location IN (${placeholders})
    ORDER BY cl.location, b.name`
  )
    .bind(...locationNames)
    .all<{
      location: string;
      country: string;
      biography_id: string;
      name: string;
      avatar_url: string | null;
      slug: string;
    }>();

  // Group visitors by location
  const locationMap = new Map<string, {
    location: string;
    country: string;
    visitors: Array<{ id: string; name: string; avatar_url: string | null; slug: string }>;
  }>();

  for (const row of visitors.results || []) {
    const key = `${row.location}|${row.country}`;
    if (!locationMap.has(key)) {
      locationMap.set(key, {
        location: row.location,
        country: row.country,
        visitors: [],
      });
    }

    const existing = locationMap.get(key)!;
    if (!existing.visitors.some(v => v.id === row.biography_id)) {
      existing.visitors.push({
        id: row.biography_id,
        name: row.name,
        avatar_url: row.avatar_url,
        slug: row.slug,
      });
    }
  }

  // Sort by visitor count (maintain the order from step 1)
  const result = topLocations.results.map(loc => {
    const key = `${loc.location}|${loc.country}`;
    return locationMap.get(key) || {
      location: loc.location,
      country: loc.country,
      visitors: [],
    };
  });

  return c.json({
    success: true,
    data: result,
  });
});

// ═══════════════════════════════════════════════════════════
// 人生清單項目 CRUD
// ═══════════════════════════════════════════════════════════

// GET /bucket-list/:biographyId - Get all bucket list items for a biography
bucketListRoutes.get(
  '/:biographyId',
  describeRoute({
    tags: ['BucketList'],
    summary: '取得指定人物誌的人生清單',
    description: '取得指定人物誌的公開人生清單項目，支援狀態和分類篩選',
    responses: {
      200: { description: '成功取得人生清單項目' },
    },
  }),
  async (c) => {
  const biographyId = c.req.param('biographyId');
  const status = c.req.query('status'); // active, completed, archived
  const category = c.req.query('category');

  let whereClause = 'biography_id = ? AND is_public = 1';
  const params: (string | number)[] = [biographyId];

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  if (category) {
    whereClause += ' AND category = ?';
    params.push(category);
  }

  const items = await c.env.DB.prepare(
    `SELECT * FROM bucket_list_items
     WHERE ${whereClause}
     ORDER BY sort_order ASC, created_at DESC`
  )
    .bind(...params)
    .all();

  return c.json({
    success: true,
    data: items.results,
  });
});

// POST /bucket-list - Create a new bucket list item
bucketListRoutes.post(
  '/',
  describeRoute({
    tags: ['BucketList'],
    summary: '新增人生清單項目',
    description: '建立新的人生清單項目，需要登入並擁有人物誌',
    responses: {
      201: { description: '成功建立人生清單項目' },
      400: { description: '缺少必要欄位' },
      401: { description: '未登入' },
      404: { description: '找不到人物誌' },
    },
  }),
  authMiddleware,
  async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  // Get user's biography
  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'You need to create a biography first',
      },
      404
    );
  }

  if (!body.title) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Title is required',
      },
      400
    );
  }

  const id = generateId();

  await c.env.DB.prepare(
    `INSERT INTO bucket_list_items (
      id, biography_id, title, category, description,
      target_grade, target_location, target_date,
      status, enable_progress, progress_mode, progress, milestones,
      is_public, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      biography.id,
      body.title,
      body.category || 'other',
      body.description || null,
      body.target_grade || null,
      body.target_location || null,
      body.target_date || null,
      body.status || 'active',
      body.enable_progress ? 1 : 0,
      body.progress_mode || null,
      body.progress || 0,
      body.milestones ? JSON.stringify(body.milestones) : null,
      body.is_public !== false ? 1 : 0,
      body.sort_order || 0
    )
    .run();

  const item = await c.env.DB.prepare(
    'SELECT * FROM bucket_list_items WHERE id = ?'
  )
    .bind(id)
    .first();

  return c.json(
    {
      success: true,
      data: item,
    },
    201
  );
});

// PUT /bucket-list/:id - Update a bucket list item
bucketListRoutes.put(
  '/:id',
  describeRoute({
    tags: ['BucketList'],
    summary: '更新人生清單項目',
    description: '更新指定的人生清單項目，僅限擁有者操作',
    responses: {
      200: { description: '成功更新人生清單項目' },
      401: { description: '未登入' },
      404: { description: '找不到項目或無權限' },
    },
  }),
  authMiddleware,
  async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();

  // Verify ownership
  const item = await c.env.DB.prepare(
    `SELECT bli.id FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.id = ? AND b.user_id = ?`
  )
    .bind(id, userId)
    .first<{ id: string }>();

  if (!item) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Bucket list item not found or not authorized',
      },
      404
    );
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  const fields = [
    'title', 'category', 'description', 'target_grade',
    'target_location', 'target_date', 'status',
    'enable_progress', 'progress_mode', 'progress',
    'is_public', 'sort_order',
  ];

  for (const field of fields) {
    if (body[field] !== undefined) {
      if (field === 'enable_progress' || field === 'is_public') {
        updates.push(`${field} = ?`);
        values.push(body[field] ? 1 : 0);
      } else {
        updates.push(`${field} = ?`);
        values.push(body[field]);
      }
    }
  }

  // Handle milestones (JSON)
  if (body.milestones !== undefined) {
    updates.push('milestones = ?');
    values.push(body.milestones ? JSON.stringify(body.milestones) : null);
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(id);

    await c.env.DB.prepare(
      `UPDATE bucket_list_items SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();
  }

  const updated = await c.env.DB.prepare(
    'SELECT * FROM bucket_list_items WHERE id = ?'
  )
    .bind(id)
    .first();

  return c.json({
    success: true,
    data: updated,
  });
});

// DELETE /bucket-list/:id - Delete a bucket list item
bucketListRoutes.delete(
  '/:id',
  describeRoute({
    tags: ['BucketList'],
    summary: '刪除人生清單項目',
    description: '刪除指定的人生清單項目，僅限擁有者操作',
    responses: {
      200: { description: '成功刪除人生清單項目' },
      401: { description: '未登入' },
      404: { description: '找不到項目或無權限' },
    },
  }),
  authMiddleware,
  async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  // Verify ownership
  const item = await c.env.DB.prepare(
    `SELECT bli.id FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.id = ? AND b.user_id = ?`
  )
    .bind(id, userId)
    .first<{ id: string }>();

  if (!item) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Bucket list item not found or not authorized',
      },
      404
    );
  }

  await c.env.DB.prepare('DELETE FROM bucket_list_items WHERE id = ?')
    .bind(id)
    .run();

  return c.json({
    success: true,
    message: 'Bucket list item deleted successfully',
  });
});

// ═══════════════════════════════════════════════════════════
// 完成目標
// ═══════════════════════════════════════════════════════════

// PUT /bucket-list/:id/complete - Mark a bucket list item as completed
bucketListRoutes.put(
  '/:id/complete',
  describeRoute({
    tags: ['BucketList'],
    summary: '標記目標為完成',
    description: '將人生清單項目標記為完成，可添加完成故事和心得',
    responses: {
      200: { description: '成功標記為完成' },
      401: { description: '未登入' },
      404: { description: '找不到項目或無權限' },
    },
  }),
  authMiddleware,
  async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();

  // Verify ownership
  const item = await c.env.DB.prepare(
    `SELECT bli.id, bli.biography_id FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.id = ? AND b.user_id = ?`
  )
    .bind(id, userId)
    .first<{ id: string; biography_id: string }>();

  if (!item) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Bucket list item not found or not authorized',
      },
      404
    );
  }

  const completionMedia = body.completion_media
    ? JSON.stringify(body.completion_media)
    : null;

  await c.env.DB.prepare(
    `UPDATE bucket_list_items SET
      status = 'completed',
      completed_at = datetime('now'),
      progress = 100,
      completion_story = ?,
      psychological_insights = ?,
      technical_insights = ?,
      completion_media = ?,
      updated_at = datetime('now')
    WHERE id = ?`
  )
    .bind(
      body.completion_story || null,
      body.psychological_insights || null,
      body.technical_insights || null,
      completionMedia,
      id
    )
    .run();

  const updated = await c.env.DB.prepare(
    'SELECT * FROM bucket_list_items WHERE id = ?'
  )
    .bind(id)
    .first();

  return c.json({
    success: true,
    data: updated,
  });
});

// PUT /bucket-list/:id/progress - Update progress
bucketListRoutes.put(
  '/:id/progress',
  describeRoute({
    tags: ['BucketList'],
    summary: '更新進度',
    description: '更新人生清單項目的進度百分比（0-100）',
    responses: {
      200: { description: '成功更新進度' },
      401: { description: '未登入' },
      404: { description: '找不到項目或無權限' },
    },
  }),
  authMiddleware,
  async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();

  // Verify ownership
  const item = await c.env.DB.prepare(
    `SELECT bli.id FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.id = ? AND b.user_id = ?`
  )
    .bind(id, userId)
    .first<{ id: string }>();

  if (!item) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Bucket list item not found or not authorized',
      },
      404
    );
  }

  const progress = Math.max(0, Math.min(100, body.progress || 0));

  await c.env.DB.prepare(
    `UPDATE bucket_list_items SET
      progress = ?,
      updated_at = datetime('now')
    WHERE id = ?`
  )
    .bind(progress, id)
    .run();

  return c.json({
    success: true,
    message: 'Progress updated',
    data: { progress },
  });
});

// PUT /bucket-list/:id/milestone - Update milestone
bucketListRoutes.put(
  '/:id/milestone',
  describeRoute({
    tags: ['BucketList'],
    summary: '更新里程碑',
    description: '更新人生清單項目的里程碑狀態，會自動計算整體進度',
    responses: {
      200: { description: '成功更新里程碑' },
      400: { description: '缺少必要欄位' },
      401: { description: '未登入' },
      404: { description: '找不到項目或無權限' },
    },
  }),
  authMiddleware,
  async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();

  // Verify ownership and get current milestones
  const item = await c.env.DB.prepare(
    `SELECT bli.id, bli.milestones FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.id = ? AND b.user_id = ?`
  )
    .bind(id, userId)
    .first<{ id: string; milestones: string | null }>();

  if (!item) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Bucket list item not found or not authorized',
      },
      404
    );
  }

  let milestones: Array<{ id: string; completed: boolean; completed_at: string | null; note: string | null }> = [];
  try {
    milestones = item.milestones ? JSON.parse(item.milestones) : [];
  } catch {
    milestones = [];
  }

  const milestoneId = body.milestone_id as string | undefined;
  const completed = body.completed as boolean | undefined;
  const note = body.note as string | undefined;

  if (!milestoneId || typeof milestoneId !== 'string') {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'milestone_id is required',
      },
      400
    );
  }

  // Update the specific milestone
  const updatedMilestones = milestones.map((m) => {
    if (m.id === milestoneId) {
      return {
        ...m,
        completed: completed !== undefined ? completed : m.completed,
        completed_at: completed ? new Date().toISOString() : m.completed_at,
        note: note !== undefined ? note : m.note,
      };
    }
    return m;
  });

  // Calculate overall progress from milestones
  const completedMilestones = updatedMilestones.filter((m: { completed: boolean }) => m.completed).length;
  const progress = Math.round((completedMilestones / updatedMilestones.length) * 100);

  await c.env.DB.prepare(
    `UPDATE bucket_list_items SET
      milestones = ?,
      progress = ?,
      updated_at = datetime('now')
    WHERE id = ?`
  )
    .bind(JSON.stringify(updatedMilestones), progress, id)
    .run();

  return c.json({
    success: true,
    data: {
      milestones: updatedMilestones,
      progress,
    },
  });
});

// ═══════════════════════════════════════════════════════════
// 互動功能
// ═══════════════════════════════════════════════════════════

// POST /bucket-list/:id/like - Like a bucket list item
bucketListRoutes.post(
  '/:id/like',
  describeRoute({
    tags: ['BucketList'],
    summary: '按讚人生清單項目',
    description: '對公開的人生清單項目按讚，會發送通知給擁有者',
    responses: {
      200: { description: '成功按讚' },
      401: { description: '未登入' },
      404: { description: '找不到項目' },
      409: { description: '已按讚過' },
    },
  }),
  authMiddleware,
  async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  // Check if item exists and is public, get owner info
  const item = await c.env.DB.prepare(
    `SELECT bli.id, bli.title, bli.biography_id, b.user_id as owner_id
     FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.id = ? AND bli.is_public = 1`
  )
    .bind(id)
    .first<{ id: string; title: string; biography_id: string; owner_id: string }>();

  if (!item) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Bucket list item not found',
      },
      404
    );
  }

  // Check if already liked
  const existing = await c.env.DB.prepare(
    'SELECT id FROM bucket_list_likes WHERE bucket_list_item_id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .first<{ id: string }>();

  if (existing) {
    return c.json(
      {
        success: false,
        error: 'Conflict',
        message: 'Already liked',
      },
      409
    );
  }

  const likeId = generateId();

  await c.env.DB.prepare(
    'INSERT INTO bucket_list_likes (id, bucket_list_item_id, user_id) VALUES (?, ?, ?)'
  )
    .bind(likeId, id, userId)
    .run();

  // Update likes count
  await c.env.DB.prepare(
    'UPDATE bucket_list_items SET likes_count = likes_count + 1 WHERE id = ?'
  )
    .bind(id)
    .run();

  // Create notification for owner (if not liking own item)
  // 使用聚合功能：1 小時內同一目標的按讚會合併成一則通知
  if (item.owner_id && item.owner_id !== userId) {
    const liker = await c.env.DB.prepare(
      'SELECT display_name, username FROM users WHERE id = ?'
    )
      .bind(userId)
      .first<{ display_name: string | null; username: string }>();

    const likerName = liker?.display_name || liker?.username || '有人';

    await createLikeNotificationWithAggregation(c.env.DB, {
      userId: item.owner_id,
      type: 'goal_liked',
      actorId: userId,
      actorName: likerName,
      targetId: id,
      targetTitle: item.title,
    });
  }

  return c.json({
    success: true,
    message: 'Liked successfully',
  });
});

// DELETE /bucket-list/:id/like - Unlike a bucket list item
bucketListRoutes.delete(
  '/:id/like',
  describeRoute({
    tags: ['BucketList'],
    summary: '取消按讚人生清單項目',
    description: '取消對人生清單項目的按讚',
    responses: {
      200: { description: '成功取消按讚' },
      401: { description: '未登入' },
      404: { description: '找不到按讚紀錄' },
    },
  }),
  authMiddleware,
  async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const existing = await c.env.DB.prepare(
    'SELECT id FROM bucket_list_likes WHERE bucket_list_item_id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .first<{ id: string }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Like not found',
      },
      404
    );
  }

  await c.env.DB.prepare(
    'DELETE FROM bucket_list_likes WHERE bucket_list_item_id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .run();

  // Update likes count
  await c.env.DB.prepare(
    'UPDATE bucket_list_items SET likes_count = CASE WHEN likes_count > 0 THEN likes_count - 1 ELSE 0 END WHERE id = ?'
  )
    .bind(id)
    .run();

  return c.json({
    success: true,
    message: 'Unliked successfully',
  });
});

// GET /bucket-list/:id/comments - Get comments for a bucket list item
bucketListRoutes.get(
  '/:id/comments',
  describeRoute({
    tags: ['BucketList'],
    summary: '取得留言列表',
    description: '取得指定人生清單項目的所有留言',
    responses: {
      200: { description: '成功取得留言列表' },
    },
  }),
  async (c) => {
  const id = c.req.param('id');

  const comments = await c.env.DB.prepare(
    `SELECT blc.*, u.username, u.display_name, u.avatar_url
     FROM bucket_list_comments blc
     JOIN users u ON blc.user_id = u.id
     WHERE blc.bucket_list_item_id = ?
     ORDER BY blc.created_at DESC`
  )
    .bind(id)
    .all();

  return c.json({
    success: true,
    data: comments.results,
  });
});

// POST /bucket-list/:id/comments - Add a comment to a bucket list item
bucketListRoutes.post(
  '/:id/comments',
  describeRoute({
    tags: ['BucketList'],
    summary: '新增留言',
    description: '對公開的人生清單項目新增留言，會發送通知給擁有者',
    responses: {
      201: { description: '成功新增留言' },
      400: { description: '缺少留言內容' },
      401: { description: '未登入' },
      404: { description: '找不到項目' },
    },
  }),
  authMiddleware,
  async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();

  if (!body.content || body.content.trim().length === 0) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Comment content is required',
      },
      400
    );
  }

  // Check if item exists and is public, get owner info
  const item = await c.env.DB.prepare(
    `SELECT bli.id, bli.title, bli.biography_id, b.user_id as owner_id
     FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.id = ? AND bli.is_public = 1`
  )
    .bind(id)
    .first<{ id: string; title: string; biography_id: string; owner_id: string }>();

  if (!item) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Bucket list item not found',
      },
      404
    );
  }

  const commentId = generateId();

  await c.env.DB.prepare(
    'INSERT INTO bucket_list_comments (id, bucket_list_item_id, user_id, content) VALUES (?, ?, ?, ?)'
  )
    .bind(commentId, id, userId, body.content.trim())
    .run();

  // Update comments count
  await c.env.DB.prepare(
    'UPDATE bucket_list_items SET comments_count = comments_count + 1 WHERE id = ?'
  )
    .bind(id)
    .run();

  // Get the comment with user info
  const comment = await c.env.DB.prepare(
    `SELECT blc.*, u.username, u.display_name, u.avatar_url
     FROM bucket_list_comments blc
     JOIN users u ON blc.user_id = u.id
     WHERE blc.id = ?`
  )
    .bind(commentId)
    .first();

  // Create notification for owner (if not commenting on own item)
  if (item.owner_id && item.owner_id !== userId) {
    const commenter = await c.env.DB.prepare(
      'SELECT display_name, username FROM users WHERE id = ?'
    )
      .bind(userId)
      .first<{ display_name: string | null; username: string }>();

    const commenterName = commenter?.display_name || commenter?.username || '有人';

    await createNotification(c.env.DB, {
      userId: item.owner_id,
      type: 'goal_commented',
      actorId: userId,
      targetId: id,
      title: '有人留言你的目標',
      message: `${commenterName} 在你的目標「${item.title}」留言`,
    });
  }

  return c.json(
    {
      success: true,
      data: comment,
    },
    201
  );
});

// DELETE /bucket-list/comments/:id - Delete a comment
bucketListRoutes.delete(
  '/comments/:id',
  describeRoute({
    tags: ['BucketList'],
    summary: '刪除留言',
    description: '刪除自己的留言，僅限留言者操作',
    responses: {
      200: { description: '成功刪除留言' },
      401: { description: '未登入' },
      404: { description: '找不到留言或無權限' },
    },
  }),
  authMiddleware,
  async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  // Check ownership
  const comment = await c.env.DB.prepare(
    'SELECT id, bucket_list_item_id FROM bucket_list_comments WHERE id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .first<{ id: string; bucket_list_item_id: string }>();

  if (!comment) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Comment not found or not authorized',
      },
      404
    );
  }

  await c.env.DB.prepare('DELETE FROM bucket_list_comments WHERE id = ?')
    .bind(id)
    .run();

  // Update comments count
  await c.env.DB.prepare(
    'UPDATE bucket_list_items SET comments_count = CASE WHEN comments_count > 0 THEN comments_count - 1 ELSE 0 END WHERE id = ?'
  )
    .bind(comment.bucket_list_item_id)
    .run();

  return c.json({
    success: true,
    message: 'Comment deleted successfully',
  });
});

// POST /bucket-list/:id/reference - Add item to my list (reference)
bucketListRoutes.post(
  '/:id/reference',
  describeRoute({
    tags: ['BucketList'],
    summary: '加入我的清單（引用）',
    description: '將他人的人生清單項目加入自己的清單，會建立新項目並記錄引用關係',
    responses: {
      201: { description: '成功加入清單' },
      401: { description: '未登入' },
      404: { description: '找不到項目或人物誌' },
      409: { description: '已引用過' },
    },
  }),
  authMiddleware,
  async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  // Get user's biography
  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'You need to create a biography first',
      },
      404
    );
  }

  // Get source item with owner info
  const sourceItem = await c.env.DB.prepare(
    `SELECT bli.*, b.id as source_biography_id, b.user_id as owner_id FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.id = ? AND bli.is_public = 1`
  )
    .bind(id)
    .first<{ id: string; title: string; category: string; description: string; target_grade: string; target_location: string; source_biography_id: string; owner_id: string }>();

  if (!sourceItem) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Bucket list item not found',
      },
      404
    );
  }

  // Check if already referenced
  const existingRef = await c.env.DB.prepare(
    'SELECT id FROM bucket_list_references WHERE source_item_id = ? AND target_biography_id = ?'
  )
    .bind(id, biography.id)
    .first<{ id: string }>();

  if (existingRef) {
    return c.json(
      {
        success: false,
        error: 'Conflict',
        message: 'Already referenced',
      },
      409
    );
  }

  // Create reference record
  const refId = generateId();
  await c.env.DB.prepare(
    'INSERT INTO bucket_list_references (id, source_item_id, target_biography_id) VALUES (?, ?, ?)'
  )
    .bind(refId, id, biography.id)
    .run();

  // Create new bucket list item for the user
  const newItemId = generateId();
  await c.env.DB.prepare(
    `INSERT INTO bucket_list_items (
      id, biography_id, title, category, description,
      target_grade, target_location, status, is_public
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 1)`
  )
    .bind(
      newItemId,
      biography.id,
      sourceItem.title,
      sourceItem.category,
      sourceItem.description,
      sourceItem.target_grade,
      sourceItem.target_location
    )
    .run();

  // Update inspired count on source item
  await c.env.DB.prepare(
    'UPDATE bucket_list_items SET inspired_count = inspired_count + 1 WHERE id = ?'
  )
    .bind(id)
    .run();

  const newItem = await c.env.DB.prepare(
    'SELECT * FROM bucket_list_items WHERE id = ?'
  )
    .bind(newItemId)
    .first();

  // Create notification for owner (if not referencing own item)
  if (sourceItem.owner_id && sourceItem.owner_id !== userId) {
    const referencer = await c.env.DB.prepare(
      'SELECT display_name, username FROM users WHERE id = ?'
    )
      .bind(userId)
      .first<{ display_name: string | null; username: string }>();

    const referencerName = referencer?.display_name || referencer?.username || '有人';

    await createNotification(c.env.DB, {
      userId: sourceItem.owner_id,
      type: 'goal_referenced',
      actorId: userId,
      targetId: id,
      title: '有人也想達成你的目標',
      message: `${referencerName} 把你的目標「${sourceItem.title}」加入了他的清單`,
    });
  }

  return c.json(
    {
      success: true,
      data: newItem,
      message: 'Added to your bucket list',
    },
    201
  );
});

// DELETE /bucket-list/:id/reference - Remove item from my list (cancel reference)
bucketListRoutes.delete(
  '/:id/reference',
  describeRoute({
    tags: ['BucketList'],
    summary: '移除引用',
    description: '取消對他人人生清單項目的引用',
    responses: {
      200: { description: '成功移除引用' },
      401: { description: '未登入' },
      404: { description: '找不到引用紀錄或人物誌' },
    },
  }),
  authMiddleware,
  async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  // Get user's biography
  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found',
      },
      404
    );
  }

  // Check if reference exists
  const reference = await c.env.DB.prepare(
    'SELECT id FROM bucket_list_references WHERE source_item_id = ? AND target_biography_id = ?'
  )
    .bind(id, biography.id)
    .first<{ id: string }>();

  if (!reference) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Reference not found',
      },
      404
    );
  }

  // Delete the reference
  await c.env.DB.prepare(
    'DELETE FROM bucket_list_references WHERE source_item_id = ? AND target_biography_id = ?'
  )
    .bind(id, biography.id)
    .run();

  // Update inspired count on source item
  await c.env.DB.prepare(
    'UPDATE bucket_list_items SET inspired_count = CASE WHEN inspired_count > 0 THEN inspired_count - 1 ELSE 0 END WHERE id = ?'
  )
    .bind(id)
    .run();

  return c.json({
    success: true,
    message: 'Reference removed successfully',
  });
});

// GET /bucket-list/:id/references - Get who referenced this item
bucketListRoutes.get(
  '/:id/references',
  describeRoute({
    tags: ['BucketList'],
    summary: '取得引用者列表',
    description: '取得引用此人生清單項目的用戶列表',
    responses: {
      200: { description: '成功取得引用者列表' },
    },
  }),
  async (c) => {
  const id = c.req.param('id');

  const references = await c.env.DB.prepare(
    `SELECT blr.*, b.name as referencer_name, b.avatar_url as referencer_avatar, b.slug as referencer_slug
     FROM bucket_list_references blr
     JOIN biographies b ON blr.target_biography_id = b.id
     WHERE blr.source_item_id = ? AND b.visibility = 'public'
     ORDER BY blr.created_at DESC`
  )
    .bind(id)
    .all();

  return c.json({
    success: true,
    data: references.results,
  });
});
