import { Hono } from 'hono';
import { Env, RouteStory } from '../types';
import { parsePagination, generateId, safeJsonParse, toBool } from '../utils/id';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

export const routeStoriesRoutes = new Hono<{ Bindings: Env }>();

// ============================================
// GET /route-stories - 取得路線故事列表
// ============================================
routeStoriesRoutes.get('/', optionalAuthMiddleware, async (c) => {
  const userId = c.get('userId');
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );

  const routeId = c.req.query('route_id');
  const cragId = c.req.query('crag_id');
  const storyType = c.req.query('story_type');
  const featured = c.req.query('featured');

  let whereClause = "(s.visibility = 'public' OR (s.visibility = 'community' AND ? IS NOT NULL))";
  const params: (string | number | null)[] = [userId];

  if (routeId) {
    whereClause += ' AND s.route_id = ?';
    params.push(routeId);
  }

  if (cragId) {
    whereClause += ' AND r.crag_id = ?';
    params.push(cragId);
  }

  if (storyType) {
    whereClause += ' AND s.story_type = ?';
    params.push(storyType);
  }

  if (featured === 'true') {
    whereClause += ' AND s.is_featured = 1';
  }

  // Get total count
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count
     FROM route_stories s
     JOIN routes r ON s.route_id = r.id
     WHERE ${whereClause}`
  )
    .bind(...params)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  // Get paginated results
  const stories = await c.env.DB.prepare(
    `SELECT
       s.*,
       r.name as route_name,
       r.grade as route_grade,
       r.crag_id,
       c.name as crag_name,
       u.username,
       u.display_name,
       u.avatar_url,
       CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END as is_liked,
       CASE WHEN h.id IS NOT NULL THEN 1 ELSE 0 END as is_helpful
     FROM route_stories s
     JOIN routes r ON s.route_id = r.id
     JOIN crags c ON r.crag_id = c.id
     JOIN users u ON s.user_id = u.id
     LEFT JOIN likes l ON l.entity_type = 'route_story' AND l.entity_id = s.id AND l.user_id = ?
     LEFT JOIN content_reactions h ON h.content_type = 'route_story' AND h.content_id = s.id AND h.reaction_type = 'helpful' AND h.user_id = ?
     WHERE ${whereClause}
     ORDER BY s.is_featured DESC, s.created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(userId || '', userId || '', ...params, limit, offset)
    .all();

  return c.json({
    success: true,
    data: stories.results.map((story: Record<string, unknown>) => ({
      ...story,
      photos: safeJsonParse<string[]>(story.photos as string, []),
      is_featured: toBool(story.is_featured as number),
      is_liked: Boolean(story.is_liked),
      is_helpful: Boolean(story.is_helpful),
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
// GET /route-stories/:id - 取得單筆路線故事
// ============================================
routeStoriesRoutes.get('/:id', optionalAuthMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  const story = await c.env.DB.prepare(
    `SELECT
       s.*,
       r.name as route_name,
       r.grade as route_grade,
       r.crag_id,
       c.name as crag_name,
       u.username,
       u.display_name,
       u.avatar_url,
       CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END as is_liked,
       CASE WHEN h.id IS NOT NULL THEN 1 ELSE 0 END as is_helpful
     FROM route_stories s
     JOIN routes r ON s.route_id = r.id
     JOIN crags c ON r.crag_id = c.id
     JOIN users u ON s.user_id = u.id
     LEFT JOIN likes l ON l.entity_type = 'route_story' AND l.entity_id = s.id AND l.user_id = ?
     LEFT JOIN content_reactions h ON h.content_type = 'route_story' AND h.content_id = s.id AND h.reaction_type = 'helpful' AND h.user_id = ?
     WHERE s.id = ?`
  )
    .bind(userId || '', userId || '', id)
    .first();

  if (!story) {
    return c.json({ success: false, error: 'Not Found', message: 'Story not found' }, 404);
  }

  // 檢查隱私設定
  if (story.visibility === 'private' && story.user_id !== userId) {
    return c.json({ success: false, error: 'Forbidden', message: 'This story is private' }, 403);
  }

  if (story.visibility === 'community' && !userId) {
    return c.json({ success: false, error: 'Unauthorized', message: 'Login required to view this story' }, 401);
  }

  return c.json({
    success: true,
    data: {
      ...story,
      photos: safeJsonParse<string[]>(story.photos as string, []),
      is_featured: toBool(story.is_featured as number),
      is_liked: Boolean(story.is_liked),
      is_helpful: Boolean(story.is_helpful),
    },
  });
});

// ============================================
// POST /route-stories - 新增路線故事
// ============================================
routeStoriesRoutes.post('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<Partial<RouteStory>>();

  // 驗證必要欄位
  if (!body.route_id) {
    return c.json({ success: false, error: 'Bad Request', message: 'route_id is required' }, 400);
  }

  if (!body.content) {
    return c.json({ success: false, error: 'Bad Request', message: 'content is required' }, 400);
  }

  // 驗證路線存在
  const route = await c.env.DB.prepare('SELECT id FROM routes WHERE id = ?')
    .bind(body.route_id)
    .first();

  if (!route) {
    return c.json({ success: false, error: 'Bad Request', message: 'Route not found' }, 400);
  }

  const id = generateId();

  // story_type 預設為 'other'，符合 CHECK constraint
  const storyType = body.story_type || 'other';

  await c.env.DB.prepare(
    `INSERT INTO route_stories (
       id, user_id, route_id, story_type, title, content,
       photos, youtube_url, instagram_url, visibility
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      userId,
      body.route_id,
      storyType,
      body.title || null,
      body.content,
      body.photos ? JSON.stringify(body.photos) : null,
      body.youtube_url || null,
      body.instagram_url || null,
      body.visibility || 'public'
    )
    .run();

  // 更新路線統計 - 使用增量更新
  const visibility = body.visibility || 'public';
  if (visibility === 'public') {
    await c.env.DB.prepare(
      'UPDATE routes SET story_count = story_count + 1 WHERE id = ?'
    )
      .bind(body.route_id)
      .run();
  }

  // 取得完整記錄
  const story = await c.env.DB.prepare(
    `SELECT s.*, r.name as route_name, r.grade as route_grade, c.name as crag_name,
            u.username, u.display_name, u.avatar_url
     FROM route_stories s
     JOIN routes r ON s.route_id = r.id
     JOIN crags c ON r.crag_id = c.id
     JOIN users u ON s.user_id = u.id
     WHERE s.id = ?`
  )
    .bind(id)
    .first();

  return c.json({
    success: true,
    data: {
      ...story,
      photos: safeJsonParse<string[]>(story?.photos as string, []),
      is_featured: toBool(story?.is_featured as number),
    },
  }, 201);
});

// ============================================
// PUT /route-stories/:id - 更新路線故事
// ============================================
routeStoriesRoutes.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  const body = await c.req.json<Partial<RouteStory>>();

  const existing = await c.env.DB.prepare(
    'SELECT id, user_id, route_id FROM route_stories WHERE id = ?'
  )
    .bind(id)
    .first<{ id: string; user_id: string; route_id: string }>();

  if (!existing) {
    return c.json({ success: false, error: 'Not Found', message: 'Story not found' }, 404);
  }

  if (existing.user_id !== userId) {
    return c.json({ success: false, error: 'Forbidden', message: 'You can only edit your own stories' }, 403);
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  const fields = ['story_type', 'title', 'content', 'youtube_url', 'instagram_url', 'visibility'];

  for (const field of fields) {
    if (body[field as keyof RouteStory] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field as keyof RouteStory] as string | number | null);
    }
  }

  if (body.photos !== undefined) {
    updates.push('photos = ?');
    values.push(JSON.stringify(body.photos));
  }

  if (updates.length === 0) {
    return c.json({ success: false, error: 'Bad Request', message: 'No fields to update' }, 400);
  }

  updates.push("updated_at = datetime('now')");
  values.push(id);

  await c.env.DB.prepare(
    `UPDATE route_stories SET ${updates.join(', ')} WHERE id = ?`
  )
    .bind(...values)
    .run();

  // 更新路線統計
  await c.env.DB.prepare(
    `UPDATE routes SET
       story_count = (SELECT COUNT(*) FROM route_stories WHERE route_id = ? AND visibility = 'public')
     WHERE id = ?`
  )
    .bind(existing.route_id, existing.route_id)
    .run();

  const story = await c.env.DB.prepare(
    `SELECT s.*, r.name as route_name, r.grade as route_grade, c.name as crag_name,
            u.username, u.display_name, u.avatar_url
     FROM route_stories s
     JOIN routes r ON s.route_id = r.id
     JOIN crags c ON r.crag_id = c.id
     JOIN users u ON s.user_id = u.id
     WHERE s.id = ?`
  )
    .bind(id)
    .first();

  return c.json({
    success: true,
    data: {
      ...story,
      photos: safeJsonParse<string[]>(story?.photos as string, []),
      is_featured: toBool(story?.is_featured as number),
    },
  });
});

// ============================================
// DELETE /route-stories/:id - 刪除路線故事
// ============================================
routeStoriesRoutes.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  const existing = await c.env.DB.prepare(
    'SELECT id, user_id, route_id, visibility FROM route_stories WHERE id = ?'
  )
    .bind(id)
    .first<{ id: string; user_id: string; route_id: string; visibility: string }>();

  if (!existing) {
    return c.json({ success: false, error: 'Not Found', message: 'Story not found' }, 404);
  }

  if (existing.user_id !== userId) {
    return c.json({ success: false, error: 'Forbidden', message: 'You can only delete your own stories' }, 403);
  }

  // 刪除相關互動
  await c.env.DB.prepare("DELETE FROM likes WHERE entity_type = 'route_story' AND entity_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM comments WHERE entity_type = 'route_story' AND entity_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM content_reactions WHERE content_type = 'route_story' AND content_id = ?").bind(id).run();

  await c.env.DB.prepare('DELETE FROM route_stories WHERE id = ?').bind(id).run();

  // 更新路線統計 - 使用增量更新
  if (existing.visibility === 'public') {
    await c.env.DB.prepare(
      'UPDATE routes SET story_count = MAX(0, story_count - 1) WHERE id = ?'
    )
      .bind(existing.route_id)
      .run();
  }

  return c.json({ success: true, message: 'Story deleted successfully' });
});

// ============================================
// POST /route-stories/:id/like - 按讚/取消按讚
// ============================================
routeStoriesRoutes.post('/:id/like', authMiddleware, async (c) => {
  const storyId = c.req.param('id');
  const userId = c.get('userId');

  // 確認故事存在
  const story = await c.env.DB.prepare('SELECT id FROM route_stories WHERE id = ?')
    .bind(storyId)
    .first();

  if (!story) {
    return c.json({ success: false, error: 'Not Found', message: 'Story not found' }, 404);
  }

  // 檢查是否已按讚
  const existing = await c.env.DB.prepare(
    "SELECT id FROM likes WHERE entity_type = 'route_story' AND entity_id = ? AND user_id = ?"
  )
    .bind(storyId, userId)
    .first();

  if (existing) {
    // 取消按讚
    await c.env.DB.prepare('DELETE FROM likes WHERE id = ?').bind(existing.id).run();
    await c.env.DB.prepare(
      'UPDATE route_stories SET like_count = like_count - 1 WHERE id = ?'
    ).bind(storyId).run();

    return c.json({ success: true, data: { is_liked: false } });
  } else {
    // 按讚
    const id = generateId();
    await c.env.DB.prepare(
      "INSERT INTO likes (id, user_id, entity_type, entity_id) VALUES (?, ?, 'route_story', ?)"
    )
      .bind(id, userId, storyId)
      .run();
    await c.env.DB.prepare(
      'UPDATE route_stories SET like_count = like_count + 1 WHERE id = ?'
    ).bind(storyId).run();

    return c.json({ success: true, data: { is_liked: true } });
  }
});

// ============================================
// POST /route-stories/:id/helpful - 標記有幫助
// ============================================
routeStoriesRoutes.post('/:id/helpful', authMiddleware, async (c) => {
  const storyId = c.req.param('id');
  const userId = c.get('userId');

  // 確認故事存在
  const story = await c.env.DB.prepare('SELECT id FROM route_stories WHERE id = ?')
    .bind(storyId)
    .first();

  if (!story) {
    return c.json({ success: false, error: 'Not Found', message: 'Story not found' }, 404);
  }

  // 檢查是否已標記
  const existing = await c.env.DB.prepare(
    "SELECT id FROM content_reactions WHERE content_type = 'route_story' AND content_id = ? AND reaction_type = 'helpful' AND user_id = ?"
  )
    .bind(storyId, userId)
    .first();

  if (existing) {
    // 取消標記
    await c.env.DB.prepare('DELETE FROM content_reactions WHERE id = ?').bind(existing.id).run();
    await c.env.DB.prepare(
      'UPDATE route_stories SET helpful_count = helpful_count - 1 WHERE id = ?'
    ).bind(storyId).run();

    return c.json({ success: true, data: { is_helpful: false } });
  } else {
    // 標記有幫助
    await c.env.DB.prepare(
      "INSERT INTO content_reactions (content_type, content_id, reaction_type, user_id) VALUES ('route_story', ?, 'helpful', ?)"
    )
      .bind(storyId, userId)
      .run();
    await c.env.DB.prepare(
      'UPDATE route_stories SET helpful_count = helpful_count + 1 WHERE id = ?'
    ).bind(storyId).run();

    return c.json({ success: true, data: { is_helpful: true } });
  }
});

// ============================================
// GET /route-stories/:id/comments - 取得故事留言
// ============================================
routeStoriesRoutes.get('/:id/comments', async (c) => {
  const storyId = c.req.param('id');
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );

  const countResult = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM comments WHERE entity_type = 'route_story' AND entity_id = ?"
  )
    .bind(storyId)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  const comments = await c.env.DB.prepare(
    `SELECT
       c.*,
       u.username,
       u.display_name,
       u.avatar_url
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.entity_type = 'route_story' AND c.entity_id = ?
     ORDER BY c.created_at ASC
     LIMIT ? OFFSET ?`
  )
    .bind(storyId, limit, offset)
    .all();

  return c.json({
    success: true,
    data: comments.results,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// ============================================
// POST /route-stories/:id/comments - 新增故事留言
// ============================================
routeStoriesRoutes.post('/:id/comments', authMiddleware, async (c) => {
  const storyId = c.req.param('id');
  const userId = c.get('userId');
  const body = await c.req.json<{ content: string; parent_id?: string }>();

  if (!body.content) {
    return c.json({ success: false, error: 'Bad Request', message: 'content is required' }, 400);
  }

  // 確認故事存在
  const story = await c.env.DB.prepare('SELECT id, user_id FROM route_stories WHERE id = ?')
    .bind(storyId)
    .first<{ id: string; user_id: string }>();

  if (!story) {
    return c.json({ success: false, error: 'Not Found', message: 'Story not found' }, 404);
  }

  const id = generateId();

  await c.env.DB.prepare(
    `INSERT INTO comments (id, user_id, entity_type, entity_id, content, parent_id)
     VALUES (?, ?, 'route_story', ?, ?, ?)`
  )
    .bind(id, userId, storyId, body.content, body.parent_id || null)
    .run();

  // 更新故事留言計數
  await c.env.DB.prepare(
    'UPDATE route_stories SET comment_count = comment_count + 1 WHERE id = ?'
  ).bind(storyId).run();

  // 取得完整留言
  const comment = await c.env.DB.prepare(
    `SELECT c.*, u.username, u.display_name, u.avatar_url
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.id = ?`
  )
    .bind(id)
    .first();

  return c.json({ success: true, data: comment }, 201);
});

// ============================================
// GET /route/:routeId/stories - 取得路線的故事
// ============================================
routeStoriesRoutes.get('/route/:routeId', optionalAuthMiddleware, async (c) => {
  const routeId = c.req.param('routeId');
  const userId = c.get('userId');
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );
  const storyType = c.req.query('story_type');

  let whereClause = "s.route_id = ? AND (s.visibility = 'public' OR (s.visibility = 'community' AND ? IS NOT NULL))";
  const params: (string | null)[] = [routeId, userId];

  if (storyType) {
    whereClause += ' AND s.story_type = ?';
    params.push(storyType);
  }

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM route_stories s WHERE ${whereClause}`
  )
    .bind(...params)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  const stories = await c.env.DB.prepare(
    `SELECT
       s.*,
       u.username,
       u.display_name,
       u.avatar_url,
       CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END as is_liked,
       CASE WHEN h.id IS NOT NULL THEN 1 ELSE 0 END as is_helpful
     FROM route_stories s
     JOIN users u ON s.user_id = u.id
     LEFT JOIN likes l ON l.entity_type = 'route_story' AND l.entity_id = s.id AND l.user_id = ?
     LEFT JOIN content_reactions h ON h.content_type = 'route_story' AND h.content_id = s.id AND h.reaction_type = 'helpful' AND h.user_id = ?
     WHERE ${whereClause}
     ORDER BY s.is_featured DESC, s.helpful_count DESC, s.created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(userId || '', userId || '', ...params, limit, offset)
    .all();

  return c.json({
    success: true,
    data: stories.results.map((story: Record<string, unknown>) => ({
      ...story,
      photos: safeJsonParse<string[]>(story.photos as string, []),
      is_featured: toBool(story.is_featured as number),
      is_liked: Boolean(story.is_liked),
      is_helpful: Boolean(story.is_helpful),
    })),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});
