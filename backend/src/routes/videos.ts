import { Hono } from 'hono';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';
import { Env, Video } from '../types';
import { parsePagination, generateId, generateSlug } from '../utils/id';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { trackAndUpdateViewCount } from '../utils/viewTracker';

// Validation schemas
const createVideoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  youtube_id: z.string().optional(),
  vimeo_id: z.string().optional(),
  thumbnail_url: z.string().url().optional(),
  duration: z.number().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  is_featured: z.number().min(0).max(1).optional(),
  published_at: z.string().optional(),
}).refine((data) => data.youtube_id || data.vimeo_id, {
  message: 'Either youtube_id or vimeo_id is required',
});

const updateVideoSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  youtube_id: z.string().optional(),
  vimeo_id: z.string().optional(),
  thumbnail_url: z.string().url().optional(),
  duration: z.number().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  is_featured: z.number().min(0).max(1).optional(),
  published_at: z.string().optional(),
});

export const videosRoutes = new Hono<{ Bindings: Env }>();

// GET /videos - List all videos
videosRoutes.get(
  '/',
  describeRoute({
    tags: ['Videos'],
    summary: '取得影片列表',
    description: '取得所有影片列表，支援分頁、分類篩選和精選篩選',
    responses: {
      200: { description: '成功回傳影片列表及分頁資訊' },
    },
  }),
  async (c) => {
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
videosRoutes.get(
  '/featured',
  describeRoute({
    tags: ['Videos'],
    summary: '取得精選影片',
    description: '取得精選影片列表，預設回傳 6 部，可透過 limit 參數調整',
    responses: {
      200: { description: '成功回傳精選影片列表' },
    },
  }),
  async (c) => {
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
  }
);

// GET /videos/categories - Get all video categories
videosRoutes.get(
  '/categories',
  describeRoute({
    tags: ['Videos'],
    summary: '取得影片分類列表',
    description: '取得所有影片分類及各分類的影片數量',
    responses: {
      200: { description: '成功回傳分類列表及各分類數量' },
    },
  }),
  async (c) => {
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
  }
);

// GET /videos/:id - Get video by ID
videosRoutes.get(
  '/:id',
  describeRoute({
    tags: ['Videos'],
    summary: '取得單一影片',
    description: '根據影片 ID 取得影片詳細資訊，並自動追蹤觀看次數',
    responses: {
      200: { description: '成功回傳影片詳細資訊' },
      404: { description: '找不到指定的影片' },
    },
  }),
  async (c) => {
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
  }
);

// GET /videos/slug/:slug - Get video by slug
videosRoutes.get(
  '/slug/:slug',
  describeRoute({
    tags: ['Videos'],
    summary: '根據 slug 取得影片',
    description: '根據影片 slug 取得影片詳細資訊，並自動追蹤觀看次數',
    responses: {
      200: { description: '成功回傳影片詳細資訊' },
      404: { description: '找不到指定的影片' },
    },
  }),
  async (c) => {
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
  }
);

// POST /videos - Create new video (admin only)
videosRoutes.post(
  '/',
  describeRoute({
    tags: ['Videos'],
    summary: '建立新影片',
    description: '建立新影片（需要管理員權限），需提供標題和 YouTube 或 Vimeo ID',
    responses: {
      201: { description: '成功建立影片' },
      400: { description: '請求資料格式錯誤' },
      401: { description: '未授權，需要登入' },
      403: { description: '禁止存取，需要管理員權限' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  validator('json', createVideoSchema),
  async (c) => {
    const body = c.req.valid('json');

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
  }
);

// PUT /videos/:id - Update video (admin only)
videosRoutes.put(
  '/:id',
  describeRoute({
    tags: ['Videos'],
    summary: '更新影片',
    description: '更新指定影片的資料（需要管理員權限）',
    responses: {
      200: { description: '成功更新影片' },
      400: { description: '請求資料格式錯誤或沒有欄位需要更新' },
      401: { description: '未授權，需要登入' },
      403: { description: '禁止存取，需要管理員權限' },
      404: { description: '找不到指定的影片' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  validator('json', updateVideoSchema),
  async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');

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
      if (body[field as keyof typeof body] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field as keyof typeof body] as string | number | null);
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
  }
);

// DELETE /videos/:id - Delete video (admin only)
videosRoutes.delete(
  '/:id',
  describeRoute({
    tags: ['Videos'],
    summary: '刪除影片',
    description: '刪除指定的影片（需要管理員權限）',
    responses: {
      200: { description: '成功刪除影片' },
      401: { description: '未授權，需要登入' },
      403: { description: '禁止存取，需要管理員權限' },
      404: { description: '找不到指定的影片' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  async (c) => {
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
  }
);
