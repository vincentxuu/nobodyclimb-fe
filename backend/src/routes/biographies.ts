import { Hono } from 'hono';
import { Env, Biography } from '../types';
import { parsePagination, generateId, generateSlug } from '../utils/id';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

export const biographiesRoutes = new Hono<{ Bindings: Env }>();

// GET /biographies - List all public biographies
biographiesRoutes.get('/', async (c) => {
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );
  const featured = c.req.query('featured');
  const search = c.req.query('search');

  let whereClause = 'is_public = 1';
  const params: (string | number)[] = [];

  if (featured === 'true') {
    whereClause += ' AND is_featured = 1';
  }

  if (search) {
    whereClause += ` AND (
      name LIKE ? OR
      frequent_locations LIKE ? OR
      favorite_route_type LIKE ? OR
      climbing_origin LIKE ? OR
      climbing_meaning LIKE ? OR
      advice_to_self LIKE ? OR
      memorable_moment LIKE ? OR
      biggest_challenge LIKE ? OR
      breakthrough_story LIKE ? OR
      dream_climb LIKE ? OR
      climbing_goal LIKE ?
    )`;
    const searchPattern = `%${search}%`;
    // Push search pattern for each field in the OR clause
    for (let i = 0; i < 11; i++) {
      params.push(searchPattern);
    }
  }

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM biographies WHERE ${whereClause}`
  )
    .bind(...params)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  const biographies = await c.env.DB.prepare(
    `SELECT * FROM biographies
     WHERE ${whereClause}
     ORDER BY is_featured DESC, published_at DESC, created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(...params, limit, offset)
    .all();

  return c.json({
    success: true,
    data: biographies.results,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// GET /biographies/featured - Get featured biographies
biographiesRoutes.get('/featured', async (c) => {
  const limit = parseInt(c.req.query('limit') || '3', 10);

  const biographies = await c.env.DB.prepare(
    `SELECT * FROM biographies
     WHERE is_public = 1 AND is_featured = 1
     ORDER BY published_at DESC, created_at DESC
     LIMIT ?`
  )
    .bind(limit)
    .all();

  return c.json({
    success: true,
    data: biographies.results,
  });
});

// GET /biographies/me - Get current user's biography
biographiesRoutes.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');

  const biography = await c.env.DB.prepare(
    'SELECT * FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first();

  if (!biography) {
    return c.json({
      success: true,
      data: null,
    });
  }

  return c.json({
    success: true,
    data: biography,
  });
});

// GET /biographies/:id - Get biography by ID
biographiesRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const biography = await c.env.DB.prepare(
    'SELECT * FROM biographies WHERE id = ? AND is_public = 1'
  )
    .bind(id)
    .first();

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

  return c.json({
    success: true,
    data: biography,
  });
});

// GET /biographies/slug/:slug - Get biography by slug
biographiesRoutes.get('/slug/:slug', async (c) => {
  const slug = c.req.param('slug');

  const biography = await c.env.DB.prepare(
    'SELECT * FROM biographies WHERE slug = ? AND is_public = 1'
  )
    .bind(slug)
    .first();

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

  return c.json({
    success: true,
    data: biography,
  });
});

// POST /biographies - Create new biography (or update if exists)
biographiesRoutes.post('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<Partial<Biography>>();

  if (!body.name) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Name is required',
      },
      400
    );
  }

  // Check if user already has a biography
  const existing = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (existing) {
    // Update existing biography
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    // All biography fields including new advanced story fields
    const fields = [
      // Basic info
      'name', 'title', 'bio', 'avatar_url', 'cover_image',
      // Level 1: Basic climbing info
      'climbing_start_year', 'frequent_locations', 'favorite_route_type',
      // Level 2: Core stories
      'climbing_origin', 'climbing_meaning', 'advice_to_self',
      // Level 3A: Growth & Breakthrough
      'memorable_moment', 'biggest_challenge', 'breakthrough_story',
      'first_outdoor', 'first_grade', 'frustrating_climb',
      // Level 3B: Psychology & Philosophy
      'fear_management', 'climbing_lesson', 'failure_perspective',
      'flow_moment', 'life_balance', 'unexpected_gain',
      // Level 3C: Community & Connection
      'climbing_mentor', 'climbing_partner', 'funny_moment',
      'favorite_spot', 'advice_to_group', 'climbing_space',
      // Level 3D: Practical Sharing
      'injury_recovery', 'memorable_route', 'training_method',
      'effective_practice', 'technique_tip', 'gear_choice',
      // Level 3E: Dreams & Exploration
      'dream_climb', 'climbing_trip', 'bucket_list_story',
      'climbing_goal', 'climbing_style', 'climbing_inspiration',
      // Level 3F: Life Integration
      'life_outside_climbing',
      // Climbing locations
      'climbing_locations',
      // Media & Social
      'gallery_images', 'social_links', 'youtube_channel_id', 'featured_video_id',
      // Status & Legacy
      'achievements', 'is_featured', 'is_public',
      // Legacy fields (backward compatibility)
      'climbing_reason', 'advice', 'bucket_list',
    ];

    for (const field of fields) {
      if (body[field as keyof Biography] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field as keyof Biography] as string | number | null);
      }
    }

    // Update slug if name changed
    if (body.name) {
      const newSlug = generateSlug(body.name) + '-' + existing.id.substring(0, 8);
      updates.push('slug = ?');
      values.push(newSlug);
    }

    // Set published_at when going public for first time
    if (body.is_public === 1) {
      const currentBio = await c.env.DB.prepare(
        'SELECT published_at, is_public FROM biographies WHERE id = ?'
      )
        .bind(existing.id)
        .first<{ published_at: string | null; is_public: number }>();

      if (currentBio && !currentBio.published_at && Number(currentBio.is_public) !== 1) {
        updates.push('published_at = ?');
        values.push(new Date().toISOString());
      }
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(existing.id);

      await c.env.DB.prepare(
        `UPDATE biographies SET ${updates.join(', ')} WHERE id = ?`
      )
        .bind(...values)
        .run();
    }

    const biography = await c.env.DB.prepare(
      'SELECT * FROM biographies WHERE id = ?'
    )
      .bind(existing.id)
      .first();

    return c.json({
      success: true,
      data: biography,
    });
  }

  // Create new biography
  const id = generateId();
  const slug = generateSlug(body.name) + '-' + id.substring(0, 8);

  await c.env.DB.prepare(
    `INSERT INTO biographies (
      id, user_id, name, slug, title, bio, avatar_url, cover_image,
      climbing_start_year, frequent_locations, favorite_route_type,
      climbing_reason, climbing_meaning, bucket_list, advice,
      achievements, social_links, is_featured, is_public, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      userId,
      body.name,
      slug,
      body.title || null,
      body.bio || null,
      body.avatar_url || null,
      body.cover_image || null,
      body.climbing_start_year || null,
      body.frequent_locations || null,
      body.favorite_route_type || null,
      body.climbing_reason || null,
      body.climbing_meaning || null,
      body.bucket_list || null,
      body.advice || null,
      body.achievements || null,
      body.social_links || null,
      body.is_featured || 0,
      body.is_public || 0,
      body.is_public ? new Date().toISOString() : null
    )
    .run();

  const biography = await c.env.DB.prepare(
    'SELECT * FROM biographies WHERE id = ?'
  )
    .bind(id)
    .first();

  return c.json(
    {
      success: true,
      data: biography,
    },
    201
  );
});

// PUT /biographies/me - Update current user's biography
biographiesRoutes.put('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<Partial<Biography>>();

  const existing = await c.env.DB.prepare(
    'SELECT id, published_at, is_public FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string; published_at: string | null; is_public: number }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found. Create one first.',
      },
      404
    );
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  // All biography fields including new advanced story fields
  const fields = [
    // Basic info
    'name', 'title', 'bio', 'avatar_url', 'cover_image',
    // Level 1: Basic climbing info
    'climbing_start_year', 'frequent_locations', 'favorite_route_type',
    // Level 2: Core stories
    'climbing_origin', 'climbing_meaning', 'advice_to_self',
    // Level 3A: Growth & Breakthrough
    'memorable_moment', 'biggest_challenge', 'breakthrough_story',
    'first_outdoor', 'first_grade', 'frustrating_climb',
    // Level 3B: Psychology & Philosophy
    'fear_management', 'climbing_lesson', 'failure_perspective',
    'flow_moment', 'life_balance', 'unexpected_gain',
    // Level 3C: Community & Connection
    'climbing_mentor', 'climbing_partner', 'funny_moment',
    'favorite_spot', 'advice_to_group', 'climbing_space',
    // Level 3D: Practical Sharing
    'injury_recovery', 'memorable_route', 'training_method',
    'effective_practice', 'technique_tip', 'gear_choice',
    // Level 3E: Dreams & Exploration
    'dream_climb', 'climbing_trip', 'bucket_list_story',
    'climbing_goal', 'climbing_style', 'climbing_inspiration',
    // Level 3F: Life Integration
    'life_outside_climbing',
    // Climbing locations
    'climbing_locations',
    // Media & Social
    'gallery_images', 'social_links', 'youtube_channel_id', 'featured_video_id',
    // Status
    'achievements', 'is_public',
    // Legacy fields (backward compatibility)
    'climbing_reason', 'advice', 'bucket_list',
  ];

  for (const field of fields) {
    if (body[field as keyof Biography] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field as keyof Biography] as string | number | null);
    }
  }

  // Update slug if name changed
  if (body.name) {
    const newSlug = generateSlug(body.name) + '-' + existing.id.substring(0, 8);
    updates.push('slug = ?');
    values.push(newSlug);
  }

  // Set published_at when going public for first time
  if (body.is_public === 1 && !existing.published_at && Number(existing.is_public) !== 1) {
    updates.push('published_at = ?');
    values.push(new Date().toISOString());
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(existing.id);

    await c.env.DB.prepare(
      `UPDATE biographies SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();
  }

  const biography = await c.env.DB.prepare(
    'SELECT * FROM biographies WHERE id = ?'
  )
    .bind(existing.id)
    .first();

  return c.json({
    success: true,
    data: biography,
  });
});

// DELETE /biographies/me - Delete current user's biography
biographiesRoutes.delete('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');

  const existing = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found',
      },
      404
    );
  }

  await c.env.DB.prepare('DELETE FROM biographies WHERE id = ?')
    .bind(existing.id)
    .run();

  return c.json({
    success: true,
    message: 'Biography deleted successfully',
  });
});

// GET /biographies/:id/adjacent - Get previous and next biographies
biographiesRoutes.get('/:id/adjacent', async (c) => {
  const id = c.req.param('id');

  const current = await c.env.DB.prepare(
    'SELECT published_at, created_at FROM biographies WHERE id = ? AND is_public = 1'
  )
    .bind(id)
    .first<{ published_at: string | null; created_at: string }>();

  if (!current) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found',
      },
      404
    );
  }

  const orderDate = current.published_at || current.created_at;

  // Get previous (newer) biography
  const previous = await c.env.DB.prepare(
    `SELECT id, name, avatar_url FROM biographies
     WHERE is_public = 1 AND id != ?
     AND COALESCE(published_at, created_at) > ?
     ORDER BY COALESCE(published_at, created_at) ASC
     LIMIT 1`
  )
    .bind(id, orderDate)
    .first();

  // Get next (older) biography
  const next = await c.env.DB.prepare(
    `SELECT id, name, avatar_url FROM biographies
     WHERE is_public = 1 AND id != ?
     AND COALESCE(published_at, created_at) < ?
     ORDER BY COALESCE(published_at, created_at) DESC
     LIMIT 1`
  )
    .bind(id, orderDate)
    .first();

  return c.json({
    success: true,
    data: {
      previous,
      next,
    },
  });
});

// GET /biographies/:id/stats - Get biography statistics
biographiesRoutes.get('/:id/stats', async (c) => {
  const id = c.req.param('id');

  const biography = await c.env.DB.prepare(
    'SELECT id, total_likes, total_views, follower_count FROM biographies WHERE id = ? AND is_public = 1'
  )
    .bind(id)
    .first<{ id: string; total_likes: number; total_views: number; follower_count: number }>();

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

  // Count bucket list items
  const bucketListStats = await c.env.DB.prepare(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM bucket_list_items WHERE biography_id = ? AND is_public = 1`
  )
    .bind(id)
    .first<{ total: number; active: number; completed: number }>();

  return c.json({
    success: true,
    data: {
      total_likes: biography.total_likes || 0,
      total_views: biography.total_views || 0,
      follower_count: biography.follower_count || 0,
      bucket_list: {
        total: bucketListStats?.total || 0,
        active: bucketListStats?.active || 0,
        completed: bucketListStats?.completed || 0,
      },
    },
  });
});

// PUT /biographies/:id/view - Record a view
biographiesRoutes.put('/:id/view', async (c) => {
  const id = c.req.param('id');

  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE id = ? AND is_public = 1'
  )
    .bind(id)
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

  // Increment view count
  await c.env.DB.prepare(
    'UPDATE biographies SET total_views = COALESCE(total_views, 0) + 1 WHERE id = ?'
  )
    .bind(id)
    .run();

  return c.json({
    success: true,
    message: 'View recorded',
  });
});
