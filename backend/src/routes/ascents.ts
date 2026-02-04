import { Hono } from 'hono';
import { Env, UserRouteAscent } from '../types';
import { parsePagination, generateId, safeJsonParse, isValidAscentType, VALID_ASCENT_TYPES } from '../utils/id';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

export const ascentsRoutes = new Hono<{ Bindings: Env }>();

// ============================================
// GET /ascents - 取得當前使用者的攀爬記錄
// ============================================
ascentsRoutes.get('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );

  const routeId = c.req.query('route_id');
  const cragId = c.req.query('crag_id');
  const ascentType = c.req.query('ascent_type');
  const dateFrom = c.req.query('date_from');
  const dateTo = c.req.query('date_to');

  let whereClause = 'a.user_id = ?';
  const params: (string | number)[] = [userId];

  if (routeId) {
    whereClause += ' AND a.route_id = ?';
    params.push(routeId);
  }

  if (cragId) {
    whereClause += ' AND r.crag_id = ?';
    params.push(cragId);
  }

  if (ascentType) {
    whereClause += ' AND a.ascent_type = ?';
    params.push(ascentType);
  }

  if (dateFrom) {
    whereClause += ' AND a.ascent_date >= ?';
    params.push(dateFrom);
  }

  if (dateTo) {
    whereClause += ' AND a.ascent_date <= ?';
    params.push(dateTo);
  }

  // Get total count
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count
     FROM user_route_ascents a
     JOIN routes r ON a.route_id = r.id
     WHERE ${whereClause}`
  )
    .bind(...params)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  // Get paginated results with route info
  const ascents = await c.env.DB.prepare(
    `SELECT
       a.*,
       r.name as route_name,
       r.grade as route_grade,
       r.crag_id,
       c.name as crag_name
     FROM user_route_ascents a
     JOIN routes r ON a.route_id = r.id
     JOIN crags c ON r.crag_id = c.id
     WHERE ${whereClause}
     ORDER BY a.ascent_date DESC, a.created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(...params, limit, offset)
    .all();

  return c.json({
    success: true,
    data: ascents.results.map((ascent: Record<string, unknown>) => ({
      ...ascent,
      photos: safeJsonParse<string[]>(ascent.photos as string, []),
    })),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// ============================================
// GET /ascents/stats - 取得攀爬統計
// ============================================
ascentsRoutes.get('/stats', authMiddleware, async (c) => {
  const userId = c.get('userId');

  // 總攀爬統計
  const totalStats = await c.env.DB.prepare(
    `SELECT
       COUNT(*) as total_ascents,
       COUNT(DISTINCT route_id) as unique_routes,
       COUNT(DISTINCT r.crag_id) as unique_crags
     FROM user_route_ascents a
     JOIN routes r ON a.route_id = r.id
     WHERE a.user_id = ?`
  )
    .bind(userId)
    .first<{ total_ascents: number; unique_routes: number; unique_crags: number }>();

  // 按攀爬類型統計
  const byType = await c.env.DB.prepare(
    `SELECT ascent_type, COUNT(*) as count
     FROM user_route_ascents
     WHERE user_id = ?
     GROUP BY ascent_type`
  )
    .bind(userId)
    .all<{ ascent_type: string; count: number }>();

  // 按難度統計
  const byGrade = await c.env.DB.prepare(
    `SELECT r.grade, COUNT(*) as count
     FROM user_route_ascents a
     JOIN routes r ON a.route_id = r.id
     WHERE a.user_id = ? AND r.grade IS NOT NULL
     GROUP BY r.grade
     ORDER BY r.grade`
  )
    .bind(userId)
    .all<{ grade: string; count: number }>();

  // 最近 12 個月統計
  const byMonth = await c.env.DB.prepare(
    `SELECT
       strftime('%Y-%m', ascent_date) as month,
       COUNT(*) as count
     FROM user_route_ascents
     WHERE user_id = ? AND ascent_date >= date('now', '-12 months')
     GROUP BY month
     ORDER BY month DESC`
  )
    .bind(userId)
    .all<{ month: string; count: number }>();

  // 最高難度（按路線類型）
  const highestGrades = await c.env.DB.prepare(
    `SELECT r.route_type, MAX(r.grade) as highest_grade
     FROM user_route_ascents a
     JOIN routes r ON a.route_id = r.id
     WHERE a.user_id = ? AND a.ascent_type NOT IN ('attempt')
     GROUP BY r.route_type`
  )
    .bind(userId)
    .all<{ route_type: string; highest_grade: string }>();

  // 最近 5 筆攀爬記錄
  const recentAscents = await c.env.DB.prepare(
    `SELECT
       a.*,
       r.name as route_name,
       r.grade as route_grade,
       c.name as crag_name
     FROM user_route_ascents a
     JOIN routes r ON a.route_id = r.id
     JOIN crags c ON r.crag_id = c.id
     WHERE a.user_id = ?
     ORDER BY a.ascent_date DESC, a.created_at DESC
     LIMIT 5`
  )
    .bind(userId)
    .all();

  return c.json({
    success: true,
    data: {
      total_ascents: totalStats?.total_ascents || 0,
      unique_routes: totalStats?.unique_routes || 0,
      unique_crags: totalStats?.unique_crags || 0,
      by_type: byType.results.reduce((acc, item) => {
        acc[item.ascent_type] = item.count;
        return acc;
      }, {} as Record<string, number>),
      by_grade: byGrade.results.reduce((acc, item) => {
        acc[item.grade] = item.count;
        return acc;
      }, {} as Record<string, number>),
      by_month: byMonth.results,
      highest_grades: highestGrades.results.reduce((acc, item) => {
        acc[item.route_type] = item.highest_grade;
        return acc;
      }, {} as Record<string, string>),
      recent_ascents: recentAscents.results.map((ascent: Record<string, unknown>) => ({
        ...ascent,
        photos: safeJsonParse<string[]>(ascent.photos as string, []),
      })),
    },
  });
});

// ============================================
// GET /ascents/:id - 取得單筆攀爬記錄
// ============================================
ascentsRoutes.get('/:id', optionalAuthMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  const ascent = await c.env.DB.prepare(
    `SELECT
       a.*,
       r.name as route_name,
       r.grade as route_grade,
       r.crag_id,
       c.name as crag_name,
       u.username,
       u.display_name,
       u.avatar_url
     FROM user_route_ascents a
     JOIN routes r ON a.route_id = r.id
     JOIN crags c ON r.crag_id = c.id
     JOIN users u ON a.user_id = u.id
     WHERE a.id = ?`
  )
    .bind(id)
    .first();

  if (!ascent) {
    return c.json({ success: false, error: 'Not Found', message: 'Ascent not found' }, 404);
  }

  // 檢查隱私設定
  if (!ascent.is_public && ascent.user_id !== userId) {
    return c.json({ success: false, error: 'Forbidden', message: 'This ascent is private' }, 403);
  }

  return c.json({
    success: true,
    data: {
      ...ascent,
      photos: safeJsonParse<string[]>(ascent.photos as string, []),
    },
  });
});

// ============================================
// POST /ascents - 新增攀爬記錄
// ============================================
ascentsRoutes.post('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<Partial<UserRouteAscent>>();

  // 驗證必要欄位
  if (!body.route_id) {
    return c.json({ success: false, error: 'Bad Request', message: 'route_id is required' }, 400);
  }

  if (!body.ascent_type) {
    return c.json({ success: false, error: 'Bad Request', message: 'ascent_type is required' }, 400);
  }

  if (!isValidAscentType(body.ascent_type)) {
    return c.json({
      success: false,
      error: 'Bad Request',
      message: `Invalid ascent_type. Must be one of: ${VALID_ASCENT_TYPES.join(', ')}`
    }, 400);
  }

  if (!body.ascent_date) {
    return c.json({ success: false, error: 'Bad Request', message: 'ascent_date is required' }, 400);
  }

  // 驗證路線存在
  const route = await c.env.DB.prepare('SELECT id FROM routes WHERE id = ?')
    .bind(body.route_id)
    .first();

  if (!route) {
    return c.json({ success: false, error: 'Bad Request', message: 'Route not found' }, 400);
  }

  const id = generateId();

  await c.env.DB.prepare(
    `INSERT INTO user_route_ascents (
       id, user_id, route_id, ascent_type, ascent_date,
       attempts_count, rating, perceived_grade, notes,
       photos, youtube_url, instagram_url, is_public
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      userId,
      body.route_id,
      body.ascent_type,
      body.ascent_date,
      body.attempts_count || 1,
      body.rating || null,
      body.perceived_grade || null,
      body.notes || null,
      body.photos ? JSON.stringify(body.photos) : null,
      body.youtube_url || null,
      body.instagram_url || null,
      body.is_public !== undefined ? (body.is_public ? 1 : 0) : 1
    )
    .run();

  // 更新路線統計
  await c.env.DB.prepare(
    `UPDATE routes SET
       ascent_count = (SELECT COUNT(*) FROM user_route_ascents WHERE route_id = ? AND is_public = 1),
       community_rating_avg = (SELECT AVG(rating) FROM user_route_ascents WHERE route_id = ? AND rating IS NOT NULL),
       community_rating_count = (SELECT COUNT(*) FROM user_route_ascents WHERE route_id = ? AND rating IS NOT NULL)
     WHERE id = ?`
  )
    .bind(body.route_id, body.route_id, body.route_id, body.route_id)
    .run();

  // 取得完整記錄
  const ascent = await c.env.DB.prepare(
    `SELECT a.*, r.name as route_name, r.grade as route_grade, c.name as crag_name
     FROM user_route_ascents a
     JOIN routes r ON a.route_id = r.id
     JOIN crags c ON r.crag_id = c.id
     WHERE a.id = ?`
  )
    .bind(id)
    .first();

  return c.json({
    success: true,
    data: {
      ...ascent,
      photos: ascent?.photos ? JSON.parse(ascent.photos as string) : [],
    },
  }, 201);
});

// ============================================
// PUT /ascents/:id - 更新攀爬記錄
// ============================================
ascentsRoutes.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  const body = await c.req.json<Partial<UserRouteAscent>>();

  // 確認記錄存在且屬於當前使用者
  const existing = await c.env.DB.prepare(
    'SELECT id, user_id, route_id FROM user_route_ascents WHERE id = ?'
  )
    .bind(id)
    .first<{ id: string; user_id: string; route_id: string }>();

  if (!existing) {
    return c.json({ success: false, error: 'Not Found', message: 'Ascent not found' }, 404);
  }

  if (existing.user_id !== userId) {
    return c.json({ success: false, error: 'Forbidden', message: 'You can only edit your own ascents' }, 403);
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  const fields = ['ascent_type', 'ascent_date', 'attempts_count', 'rating', 'perceived_grade', 'notes', 'youtube_url', 'instagram_url'];

  for (const field of fields) {
    if (body[field as keyof UserRouteAscent] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field as keyof UserRouteAscent] as string | number | null);
    }
  }

  if (body.photos !== undefined) {
    updates.push('photos = ?');
    values.push(JSON.stringify(body.photos));
  }

  if (body.is_public !== undefined) {
    updates.push('is_public = ?');
    values.push(body.is_public ? 1 : 0);
  }

  if (updates.length === 0) {
    return c.json({ success: false, error: 'Bad Request', message: 'No fields to update' }, 400);
  }

  updates.push("updated_at = datetime('now')");
  values.push(id);

  await c.env.DB.prepare(
    `UPDATE user_route_ascents SET ${updates.join(', ')} WHERE id = ?`
  )
    .bind(...values)
    .run();

  // 更新路線統計
  await c.env.DB.prepare(
    `UPDATE routes SET
       ascent_count = (SELECT COUNT(*) FROM user_route_ascents WHERE route_id = ? AND is_public = 1),
       community_rating_avg = (SELECT AVG(rating) FROM user_route_ascents WHERE route_id = ? AND rating IS NOT NULL),
       community_rating_count = (SELECT COUNT(*) FROM user_route_ascents WHERE route_id = ? AND rating IS NOT NULL)
     WHERE id = ?`
  )
    .bind(existing.route_id, existing.route_id, existing.route_id, existing.route_id)
    .run();

  const ascent = await c.env.DB.prepare(
    `SELECT a.*, r.name as route_name, r.grade as route_grade, c.name as crag_name
     FROM user_route_ascents a
     JOIN routes r ON a.route_id = r.id
     JOIN crags c ON r.crag_id = c.id
     WHERE a.id = ?`
  )
    .bind(id)
    .first();

  return c.json({
    success: true,
    data: {
      ...ascent,
      photos: ascent?.photos ? JSON.parse(ascent.photos as string) : [],
    },
  });
});

// ============================================
// DELETE /ascents/:id - 刪除攀爬記錄
// ============================================
ascentsRoutes.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  const existing = await c.env.DB.prepare(
    'SELECT id, user_id, route_id FROM user_route_ascents WHERE id = ?'
  )
    .bind(id)
    .first<{ id: string; user_id: string; route_id: string }>();

  if (!existing) {
    return c.json({ success: false, error: 'Not Found', message: 'Ascent not found' }, 404);
  }

  if (existing.user_id !== userId) {
    return c.json({ success: false, error: 'Forbidden', message: 'You can only delete your own ascents' }, 403);
  }

  await c.env.DB.prepare('DELETE FROM user_route_ascents WHERE id = ?').bind(id).run();

  // 更新路線統計
  await c.env.DB.prepare(
    `UPDATE routes SET
       ascent_count = (SELECT COUNT(*) FROM user_route_ascents WHERE route_id = ? AND is_public = 1),
       community_rating_avg = (SELECT AVG(rating) FROM user_route_ascents WHERE route_id = ? AND rating IS NOT NULL),
       community_rating_count = (SELECT COUNT(*) FROM user_route_ascents WHERE route_id = ? AND rating IS NOT NULL)
     WHERE id = ?`
  )
    .bind(existing.route_id, existing.route_id, existing.route_id, existing.route_id)
    .run();

  return c.json({ success: true, message: 'Ascent deleted successfully' });
});

// ============================================
// GET /routes/:routeId/ascents - 取得路線的公開攀爬記錄
// ============================================
ascentsRoutes.get('/route/:routeId', optionalAuthMiddleware, async (c) => {
  const routeId = c.req.param('routeId');
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );

  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM user_route_ascents WHERE route_id = ? AND is_public = 1'
  )
    .bind(routeId)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  const ascents = await c.env.DB.prepare(
    `SELECT
       a.*,
       u.username,
       u.display_name,
       u.avatar_url
     FROM user_route_ascents a
     JOIN users u ON a.user_id = u.id
     WHERE a.route_id = ? AND a.is_public = 1
     ORDER BY a.ascent_date DESC, a.created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(routeId, limit, offset)
    .all();

  return c.json({
    success: true,
    data: ascents.results.map((ascent: Record<string, unknown>) => ({
      ...ascent,
      photos: safeJsonParse<string[]>(ascent.photos as string, []),
    })),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// ============================================
// GET /routes/:routeId/ascents/summary - 取得路線攀爬摘要
// ============================================
ascentsRoutes.get('/route/:routeId/summary', async (c) => {
  const routeId = c.req.param('routeId');

  const summary = await c.env.DB.prepare(
    `SELECT
       COUNT(*) as total_ascents,
       COUNT(DISTINCT user_id) as unique_climbers,
       AVG(rating) as avg_rating,
       COUNT(CASE WHEN rating IS NOT NULL THEN 1 END) as rating_count
     FROM user_route_ascents
     WHERE route_id = ? AND is_public = 1`
  )
    .bind(routeId)
    .first();

  const byType = await c.env.DB.prepare(
    `SELECT ascent_type, COUNT(*) as count
     FROM user_route_ascents
     WHERE route_id = ? AND is_public = 1
     GROUP BY ascent_type`
  )
    .bind(routeId)
    .all<{ ascent_type: string; count: number }>();

  return c.json({
    success: true,
    data: {
      total_ascents: summary?.total_ascents || 0,
      unique_climbers: summary?.unique_climbers || 0,
      avg_rating: summary?.avg_rating || null,
      rating_count: summary?.rating_count || 0,
      by_type: byType.results.reduce((acc, item) => {
        acc[item.ascent_type] = item.count;
        return acc;
      }, {} as Record<string, number>),
    },
  });
});
