import { Hono } from 'hono';
import { Env, Video } from '../types';
import { parsePagination, generateId, generateSlug } from '../utils/id';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { trackAndUpdateViewCount } from '../utils/viewTracker';

export const videosRoutes = new Hono<{ Bindings: Env }>();

// GET /videos - List all videos
videosRoutes.get('/', async (c) => {
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );
  const category = c.req.query('category');
  const featured = c.req.query('featured');

  let whereClause = '1=1';
  const params: (string | number)[] = [];

  if (category) {
    whereClause += ' AND category = ?';
    params.push(category);
  }

  if (featured === 'true') {
    whereClause += ' AND is_featured = 1';
  }

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM videos WHERE ${whereClause}`
  )
    .bind(...params)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  const videos = await c.env.DB.prepare(
    `SELECT * FROM videos WHERE ${whereClause}
     ORDER BY is_featured DESC, published_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(...params, limit, offset)
    .all<Video>();

  return c.json({
    success: true,
    data: videos.results.map((video) => ({
      ...video,
      tags: video.tags ? JSON.parse(video.tags) : [],
    })),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// GET /videos/featured - Get featured videos
videosRoutes.get('/featured', async (c) => {
  const limit = parseInt(c.req.query('limit') || '6', 10);

  const videos = await c.env.DB.prepare(
    `SELECT * FROM videos WHERE is_featured = 1
     ORDER BY published_at DESC
     LIMIT ?`
  )
    .bind(limit)
    .all<Video>();

  return c.json({
    success: true,
    data: videos.results.map((video) => ({
      ...video,
      tags: video.tags ? JSON.parse(video.tags) : [],
    })),
  });
});

// GET /videos/categories - Get all video categories
videosRoutes.get('/categories', async (c) => {
  const categories = await c.env.DB.prepare(
    `SELECT category, COUNT(*) as count
     FROM videos
     WHERE category IS NOT NULL
     GROUP BY category
     ORDER BY count DESC`
  ).all();

  return c.json({
    success: true,
    data: categories.results,
  });
});

// GET /videos/:id - Get video by ID
videosRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const video = await c.env.DB.prepare('SELECT * FROM videos WHERE id = ?')
    .bind(id)
    .first<Video>();

  if (!video) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Video not found',
      },
      404
    );
  }

  // Track unique view (only increment if not viewed by this IP in 24h)
  const viewCount = await trackAndUpdateViewCount(
    c.env.DB,
    c.env.CACHE,
    c.req.raw,
    'video',
    id,
    video.view_count
  );

  return c.json({
    success: true,
    data: {
      ...video,
      view_count: viewCount,
      tags: video.tags ? JSON.parse(video.tags) : [],
    },
  });
});

// GET /videos/slug/:slug - Get video by slug
videosRoutes.get('/slug/:slug', async (c) => {
  const slug = c.req.param('slug');

  const video = await c.env.DB.prepare('SELECT * FROM videos WHERE slug = ?')
    .bind(slug)
    .first<Video>();

  if (!video) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Video not found',
      },
      404
    );
  }

  // Track unique view (only increment if not viewed by this IP in 24h)
  const viewCount = await trackAndUpdateViewCount(
    c.env.DB,
    c.env.CACHE,
    c.req.raw,
    'video',
    video.id,
    video.view_count
  );

  return c.json({
    success: true,
    data: {
      ...video,
      view_count: viewCount,
      tags: video.tags ? JSON.parse(video.tags) : [],
    },
  });
});

// POST /videos - Create new video (admin only)
videosRoutes.post('/', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json<Partial<Video> & { tags?: string[] }>();

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

  if (!body.youtube_id && !body.vimeo_id) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Either youtube_id or vimeo_id is required',
      },
      400
    );
  }

  const id = generateId();
  const slug = body.slug || generateSlug(body.title);

  await c.env.DB.prepare(
    `INSERT INTO videos (
      id, title, slug, description, youtube_id, vimeo_id,
      thumbnail_url, duration, category, tags, is_featured, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      body.title,
      slug,
      body.description || null,
      body.youtube_id || null,
      body.vimeo_id || null,
      body.thumbnail_url || null,
      body.duration || null,
      body.category || null,
      body.tags ? JSON.stringify(body.tags) : null,
      body.is_featured || 0,
      body.published_at || new Date().toISOString()
    )
    .run();

  const video = await c.env.DB.prepare('SELECT * FROM videos WHERE id = ?')
    .bind(id)
    .first<Video>();

  return c.json(
    {
      success: true,
      data: {
        ...video,
        tags: video?.tags ? JSON.parse(video.tags) : [],
      },
    },
    201
  );
});

// PUT /videos/:id - Update video (admin only)
videosRoutes.put('/:id', authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<Partial<Video> & { tags?: string[] }>();

  const existing = await c.env.DB.prepare('SELECT id FROM videos WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Video not found',
      },
      404
    );
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  const fields = [
    'title',
    'description',
    'youtube_id',
    'vimeo_id',
    'thumbnail_url',
    'duration',
    'category',
    'is_featured',
    'published_at',
  ];

  for (const field of fields) {
    if (body[field as keyof Video] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field as keyof Video] as string | number | null);
    }
  }

  if (body.tags !== undefined) {
    updates.push('tags = ?');
    values.push(JSON.stringify(body.tags));
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

  await c.env.DB.prepare(`UPDATE videos SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const video = await c.env.DB.prepare('SELECT * FROM videos WHERE id = ?')
    .bind(id)
    .first<Video>();

  return c.json({
    success: true,
    data: {
      ...video,
      tags: video?.tags ? JSON.parse(video.tags) : [],
    },
  });
});

// DELETE /videos/:id - Delete video (admin only)
videosRoutes.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param('id');

  const existing = await c.env.DB.prepare('SELECT id FROM videos WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Video not found',
      },
      404
    );
  }

  await c.env.DB.prepare('DELETE FROM videos WHERE id = ?').bind(id).run();

  return c.json({
    success: true,
    message: 'Video deleted successfully',
  });
});
