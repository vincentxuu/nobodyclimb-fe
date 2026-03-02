import { Hono } from 'hono';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';
import { D1Database } from '@cloudflare/workers-types';
import { Env, Gallery } from '../types';
import { parsePagination, generateId, generateSlug } from '../utils/id';
import { authMiddleware } from '../middleware/auth';
import { trackAndUpdateViewCount } from '../utils/viewTracker';
import { deleteR2Images } from '../utils/storage';

export const galleriesRoutes = new Hono<{ Bindings: Env }>();

// ═══════════════════════════════════════════════════════════════════════════════
// Validation Schemas
// ═══════════════════════════════════════════════════════════════════════════════

const paginationQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

const galleryListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  featured: z.enum(['true', 'false']).optional(),
});

const popularQuerySchema = z.object({
  limit: z.string().optional(),
});

const uploadPhotoSchema = z.object({
  image_url: z.string().url(),
  thumbnail_url: z.string().url().optional(),
  caption: z.string().optional(),
  location_country: z.string().optional(),
  location_city: z.string().optional(),
  location_spot: z.string().optional(),
});

const updatePhotoSchema = z.object({
  caption: z.string().optional(),
  location_country: z.string().optional(),
  location_city: z.string().optional(),
  location_spot: z.string().optional(),
});

const createGallerySchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  cover_image: z.string().optional(),
  is_featured: z.number().optional(),
  images: z.array(z.object({
    image_url: z.string().url(),
    thumbnail_url: z.string().url().optional(),
    caption: z.string().optional(),
  })).optional(),
});

const updateGallerySchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  cover_image: z.string().optional(),
  is_featured: z.number().optional(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

// SQL query for photo details with author info - reusable across endpoints
const PHOTO_DETAIL_SQL = `
  SELECT
    gi.id,
    gi.image_url,
    gi.thumbnail_url,
    gi.caption,
    gi.location_country,
    gi.location_city,
    gi.location_spot,
    gi.created_at,
    g.author_id,
    u.username,
    u.display_name,
    u.avatar_url as author_avatar
  FROM gallery_images gi
  JOIN galleries g ON gi.gallery_id = g.id
  JOIN users u ON g.author_id = u.id
`;

// Helper function to get photo details by ID
const getPhotoById = async (db: D1Database, photoId: string) => {
  return db
    .prepare(`${PHOTO_DETAIL_SQL} WHERE gi.id = ?`)
    .bind(photoId)
    .first();
};

// ═══════════════════════════════════════════════════════════════════════════════
// 照片管理 API
// ═══════════════════════════════════════════════════════════════════════════════

// GET /galleries/photos - Get all photos with uploader info (for gallery page)
galleriesRoutes.get(
  '/photos',
  describeRoute({
    tags: ['Galleries'],
    summary: '取得所有照片列表',
    description: '取得所有照片的分頁列表，包含上傳者資訊。用於照片牆展示。',
    responses: {
      200: { description: '成功取得照片列表' },
    },
  }),
  validator('query', paginationQuerySchema),
  async (c) => {
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );

  // Use batch to run count and data queries in parallel
  const [countResult, photosResult] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT COUNT(*) as count FROM gallery_images'),
    c.env.DB.prepare(
      `${PHOTO_DETAIL_SQL} ORDER BY gi.created_at DESC LIMIT ? OFFSET ?`
    ).bind(limit, offset),
  ]);

  const total = (countResult.results[0] as { count: number })?.count || 0;

  return c.json({
    success: true,
    data: photosResult.results,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// POST /galleries/photos - Upload a single photo
galleriesRoutes.post(
  '/photos',
  describeRoute({
    tags: ['Galleries'],
    summary: '上傳單張照片',
    description: '上傳單張照片到使用者的預設相簿。如果預設相簿不存在，會自動建立「我的照片」相簿。',
    responses: {
      201: { description: '成功上傳照片' },
      400: { description: '請求無效，缺少必要的 image_url' },
      401: { description: '未授權，需要登入' },
    },
  }),
  authMiddleware,
  validator('json', uploadPhotoSchema),
  async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{
    image_url: string;
    thumbnail_url?: string;
    caption?: string;
    location_country?: string;
    location_city?: string;
    location_spot?: string;
  }>();

  if (!body.image_url) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'image_url is required',
      },
      400
    );
  }

  // Find or create a default gallery for this user
  let gallery = await c.env.DB.prepare(
    "SELECT id FROM galleries WHERE author_id = ? AND title = '我的照片'"
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!gallery) {
    const galleryId = generateId();
    await c.env.DB.prepare(
      `INSERT INTO galleries (id, author_id, title, slug, description)
       VALUES (?, ?, '我的照片', ?, '個人攝影集')`
    )
      .bind(galleryId, userId, `my-photos-${galleryId.substring(0, 8)}`)
      .run();
    gallery = { id: galleryId };
  }

  // Get current max sort_order for this gallery
  const maxOrder = await c.env.DB.prepare(
    'SELECT MAX(sort_order) as max_order FROM gallery_images WHERE gallery_id = ?'
  )
    .bind(gallery.id)
    .first<{ max_order: number | null }>();

  const photoId = generateId();
  const sortOrder = (maxOrder?.max_order ?? -1) + 1;

  await c.env.DB.prepare(
    `INSERT INTO gallery_images (id, gallery_id, image_url, thumbnail_url, caption, location_country, location_city, location_spot, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      photoId,
      gallery.id,
      body.image_url,
      body.thumbnail_url || null,
      body.caption || null,
      body.location_country || null,
      body.location_city || null,
      body.location_spot || null,
      sortOrder
    )
    .run();

  // Get the created photo with author info
  const photo = await getPhotoById(c.env.DB, photoId);

  return c.json(
    {
      success: true,
      data: photo,
    },
    201
  );
});

// GET /galleries/photos/me - Get current user's photos
galleriesRoutes.get(
  '/photos/me',
  describeRoute({
    tags: ['Galleries'],
    summary: '取得當前使用者的照片',
    description: '取得當前登入使用者上傳的所有照片，支援分頁。',
    responses: {
      200: { description: '成功取得照片列表' },
      401: { description: '未授權，需要登入' },
    },
  }),
  authMiddleware,
  validator('query', paginationQuerySchema),
  async (c) => {
  const userId = c.get('userId');
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );

  // Use batch to run count and data queries in parallel
  const [countResult, photosResult] = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT COUNT(*) as count
       FROM gallery_images gi
       JOIN galleries g ON gi.gallery_id = g.id
       WHERE g.author_id = ?`
    ).bind(userId),
    c.env.DB.prepare(
      `${PHOTO_DETAIL_SQL} WHERE g.author_id = ? ORDER BY gi.created_at DESC LIMIT ? OFFSET ?`
    ).bind(userId, limit, offset),
  ]);

  const total = (countResult.results[0] as { count: number })?.count || 0;

  return c.json({
    success: true,
    data: photosResult.results,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// PUT /galleries/photos/:id - Update a photo's metadata
galleriesRoutes.put(
  '/photos/:id',
  describeRoute({
    tags: ['Galleries'],
    summary: '更新照片資訊',
    description: '更新照片的描述、地點等資訊。只能更新自己上傳的照片，管理員可以更新任何照片。',
    responses: {
      200: { description: '成功更新照片資訊' },
      400: { description: '請求無效，沒有要更新的欄位' },
      401: { description: '未授權，需要登入' },
      403: { description: '權限不足，只能編輯自己的照片' },
      404: { description: '照片不存在' },
    },
  }),
  authMiddleware,
  validator('json', updatePhotoSchema),
  async (c) => {
  const userId = c.get('userId');
  const user = c.get('user');
  const photoId = c.req.param('id');
  const body = await c.req.json<{
    caption?: string;
    location_country?: string;
    location_city?: string;
    location_spot?: string;
  }>();

  // Check if photo exists and user owns it
  const photo = await c.env.DB.prepare(
    `SELECT gi.id, g.author_id
     FROM gallery_images gi
     JOIN galleries g ON gi.gallery_id = g.id
     WHERE gi.id = ?`
  )
    .bind(photoId)
    .first<{ id: string; author_id: string }>();

  if (!photo) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Photo not found',
      },
      404
    );
  }

  if (photo.author_id !== userId && user.role !== 'admin') {
    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'You can only edit your own photos',
      },
      403
    );
  }

  // Build update query
  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (body.caption !== undefined) {
    updates.push('caption = ?');
    values.push(body.caption || null);
  }
  if (body.location_country !== undefined) {
    updates.push('location_country = ?');
    values.push(body.location_country || null);
  }
  if (body.location_city !== undefined) {
    updates.push('location_city = ?');
    values.push(body.location_city || null);
  }
  if (body.location_spot !== undefined) {
    updates.push('location_spot = ?');
    values.push(body.location_spot || null);
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

  values.push(photoId);

  await c.env.DB.prepare(
    `UPDATE gallery_images SET ${updates.join(', ')} WHERE id = ?`
  )
    .bind(...values)
    .run();

  // Get updated photo with author info
  const updatedPhoto = await getPhotoById(c.env.DB, photoId);

  return c.json({
    success: true,
    data: updatedPhoto,
  });
});

// DELETE /galleries/photos/:id - Delete a photo
galleriesRoutes.delete(
  '/photos/:id',
  describeRoute({
    tags: ['Galleries'],
    summary: '刪除照片',
    description: '刪除指定的照片，同時從 R2 儲存空間移除圖片檔案。只能刪除自己上傳的照片，管理員可以刪除任何照片。',
    responses: {
      200: { description: '成功刪除照片' },
      401: { description: '未授權，需要登入' },
      403: { description: '權限不足，只能刪除自己的照片' },
      404: { description: '照片不存在' },
    },
  }),
  authMiddleware,
  async (c) => {
  const userId = c.get('userId');
  const user = c.get('user');
  const photoId = c.req.param('id');

  // Check if photo exists and user owns it, and get image_url
  const photo = await c.env.DB.prepare(
    `SELECT gi.id, gi.image_url, g.author_id
     FROM gallery_images gi
     JOIN galleries g ON gi.gallery_id = g.id
     WHERE gi.id = ?`
  )
    .bind(photoId)
    .first<{ id: string; image_url: string; author_id: string }>();

  if (!photo) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Photo not found',
      },
      404
    );
  }

  if (photo.author_id !== userId && user.role !== 'admin') {
    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'You can only delete your own photos',
      },
      403
    );
  }

  // Delete from R2 storage
  if (photo.image_url) {
    try {
      const key = new URL(photo.image_url).pathname.substring(1);
      await c.env.STORAGE.delete(key);
    } catch (err) {
      console.error(`Failed to delete R2 object for photo ${photoId}: ${err}`);
      // Log the error but continue with database deletion
    }
  }

  await c.env.DB.prepare('DELETE FROM gallery_images WHERE id = ?')
    .bind(photoId)
    .run();

  return c.json({
    success: true,
    message: 'Photo deleted successfully',
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 相簿管理 API
// ═══════════════════════════════════════════════════════════════════════════════

// GET /galleries - List all galleries
galleriesRoutes.get(
  '/',
  describeRoute({
    tags: ['Galleries'],
    summary: '取得相簿列表',
    description: '取得所有相簿的分頁列表，可篩選精選相簿。依精選優先、建立時間排序。',
    responses: {
      200: { description: '成功取得相簿列表' },
    },
  }),
  validator('query', galleryListQuerySchema),
  async (c) => {
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );
  const featured = c.req.query('featured');

  let whereClause = '1=1';
  const params: (string | number)[] = [];

  if (featured === 'true') {
    whereClause += ' AND g.is_featured = 1';
  }

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM galleries g WHERE ${whereClause}`
  )
    .bind(...params)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  const galleries = await c.env.DB.prepare(
    `SELECT g.*, u.username, u.display_name, u.avatar_url as author_avatar
     FROM galleries g
     JOIN users u ON g.author_id = u.id
     WHERE ${whereClause}
     ORDER BY g.is_featured DESC, g.created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(...params, limit, offset)
    .all();

  return c.json({
    success: true,
    data: galleries.results,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// GET /galleries/popular - Get popular galleries
galleriesRoutes.get(
  '/popular',
  describeRoute({
    tags: ['Galleries'],
    summary: '取得熱門相簿',
    description: '取得瀏覽次數最高的相簿列表。預設回傳 6 個相簿。',
    responses: {
      200: { description: '成功取得熱門相簿列表' },
    },
  }),
  validator('query', popularQuerySchema),
  async (c) => {
  const limit = parseInt(c.req.query('limit') || '6', 10);

  const galleries = await c.env.DB.prepare(
    `SELECT g.*, u.username, u.display_name, u.avatar_url as author_avatar
     FROM galleries g
     JOIN users u ON g.author_id = u.id
     ORDER BY g.view_count DESC
     LIMIT ?`
  )
    .bind(limit)
    .all();

  return c.json({
    success: true,
    data: galleries.results,
  });
});

// GET /galleries/:id - Get gallery by ID
galleriesRoutes.get(
  '/:id',
  describeRoute({
    tags: ['Galleries'],
    summary: '取得單一相簿詳情',
    description: '依 ID 取得相簿詳細資訊，包含所有照片。會追蹤瀏覽次數（同一 IP 24 小時內只計算一次）。',
    responses: {
      200: { description: '成功取得相簿詳情' },
      404: { description: '相簿不存在' },
    },
  }),
  async (c) => {
  const id = c.req.param('id');

  const gallery = await c.env.DB.prepare(
    `SELECT g.*, u.username, u.display_name, u.avatar_url as author_avatar
     FROM galleries g
     JOIN users u ON g.author_id = u.id
     WHERE g.id = ?`
  )
    .bind(id)
    .first();

  if (!gallery) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Gallery not found',
      },
      404
    );
  }

  // Get images
  const images = await c.env.DB.prepare(
    'SELECT * FROM gallery_images WHERE gallery_id = ? ORDER BY sort_order ASC'
  )
    .bind(id)
    .all();

  // Track unique view (only increment if not viewed by this IP in 24h)
  const viewCount = await trackAndUpdateViewCount(
    c.env.DB,
    c.env.CACHE,
    c.req.raw,
    'gallery',
    id,
    gallery.view_count as number
  );

  return c.json({
    success: true,
    data: {
      ...gallery,
      view_count: viewCount,
      images: images.results,
    },
  });
});

// GET /galleries/slug/:slug - Get gallery by slug
galleriesRoutes.get(
  '/slug/:slug',
  describeRoute({
    tags: ['Galleries'],
    summary: '依 Slug 取得相簿詳情',
    description: '依 Slug 取得相簿詳細資訊，包含所有照片。會追蹤瀏覽次數（同一 IP 24 小時內只計算一次）。',
    responses: {
      200: { description: '成功取得相簿詳情' },
      404: { description: '相簿不存在' },
    },
  }),
  async (c) => {
  const slug = c.req.param('slug');

  const gallery = await c.env.DB.prepare(
    `SELECT g.*, u.username, u.display_name, u.avatar_url as author_avatar
     FROM galleries g
     JOIN users u ON g.author_id = u.id
     WHERE g.slug = ?`
  )
    .bind(slug)
    .first();

  if (!gallery) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Gallery not found',
      },
      404
    );
  }

  const images = await c.env.DB.prepare(
    'SELECT * FROM gallery_images WHERE gallery_id = ? ORDER BY sort_order ASC'
  )
    .bind(gallery.id as string)
    .all();

  // Track unique view (only increment if not viewed by this IP in 24h)
  const viewCount = await trackAndUpdateViewCount(
    c.env.DB,
    c.env.CACHE,
    c.req.raw,
    'gallery',
    gallery.id as string,
    gallery.view_count as number
  );

  return c.json({
    success: true,
    data: {
      ...gallery,
      view_count: viewCount,
      images: images.results,
    },
  });
});

// POST /galleries - Create new gallery
galleriesRoutes.post(
  '/',
  describeRoute({
    tags: ['Galleries'],
    summary: '建立新相簿',
    description: '建立新的相簿，可同時上傳多張照片。標題為必填欄位。',
    responses: {
      201: { description: '成功建立相簿' },
      400: { description: '請求無效，缺少必要的標題' },
      401: { description: '未授權，需要登入' },
    },
  }),
  authMiddleware,
  validator('json', createGallerySchema),
  async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<
    Partial<Gallery> & {
      images?: Array<{
        image_url: string;
        thumbnail_url?: string;
        caption?: string;
      }>;
    }
  >();

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
  const slug = body.slug || generateSlug(body.title);

  await c.env.DB.prepare(
    `INSERT INTO galleries (id, author_id, title, slug, description, cover_image, is_featured)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      userId,
      body.title,
      slug,
      body.description || null,
      body.cover_image || null,
      body.is_featured || 0
    )
    .run();

  // Add images
  if (body.images && body.images.length > 0) {
    for (let i = 0; i < body.images.length; i++) {
      const img = body.images[i];
      await c.env.DB.prepare(
        `INSERT INTO gallery_images (id, gallery_id, image_url, thumbnail_url, caption, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(
          generateId(),
          id,
          img.image_url,
          img.thumbnail_url || null,
          img.caption || null,
          i
        )
        .run();
    }
  }

  const gallery = await c.env.DB.prepare('SELECT * FROM galleries WHERE id = ?')
    .bind(id)
    .first();

  const images = await c.env.DB.prepare(
    'SELECT * FROM gallery_images WHERE gallery_id = ? ORDER BY sort_order ASC'
  )
    .bind(id)
    .all();

  return c.json(
    {
      success: true,
      data: {
        ...gallery,
        images: images.results,
      },
    },
    201
  );
});

// PUT /galleries/:id - Update gallery
galleriesRoutes.put(
  '/:id',
  describeRoute({
    tags: ['Galleries'],
    summary: '更新相簿資訊',
    description: '更新相簿的標題、描述、封面圖片或精選狀態。只能更新自己建立的相簿，管理員可以更新任何相簿。',
    responses: {
      200: { description: '成功更新相簿' },
      400: { description: '請求無效，沒有要更新的欄位' },
      401: { description: '未授權，需要登入' },
      403: { description: '權限不足，只能編輯自己的相簿' },
      404: { description: '相簿不存在' },
    },
  }),
  authMiddleware,
  validator('json', updateGallerySchema),
  async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  const user = c.get('user');
  const body = await c.req.json<Partial<Gallery>>();

  const existing = await c.env.DB.prepare(
    'SELECT author_id FROM galleries WHERE id = ?'
  )
    .bind(id)
    .first<{ author_id: string }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Gallery not found',
      },
      404
    );
  }

  if (existing.author_id !== userId && user.role !== 'admin') {
    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'You can only edit your own galleries',
      },
      403
    );
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  const fields = ['title', 'description', 'cover_image', 'is_featured'];

  for (const field of fields) {
    if (body[field as keyof Gallery] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field as keyof Gallery] as string | number | null);
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

  updates.push("updated_at = datetime('now')");
  values.push(id);

  await c.env.DB.prepare(
    `UPDATE galleries SET ${updates.join(', ')} WHERE id = ?`
  )
    .bind(...values)
    .run();

  const gallery = await c.env.DB.prepare('SELECT * FROM galleries WHERE id = ?')
    .bind(id)
    .first();

  return c.json({
    success: true,
    data: gallery,
  });
});

// DELETE /galleries/:id - Delete gallery
galleriesRoutes.delete(
  '/:id',
  describeRoute({
    tags: ['Galleries'],
    summary: '刪除相簿',
    description: '刪除指定的相簿及其所有照片。會同時從 R2 儲存空間移除所有圖片檔案。只能刪除自己建立的相簿，管理員可以刪除任何相簿。',
    responses: {
      200: { description: '成功刪除相簿' },
      401: { description: '未授權，需要登入' },
      403: { description: '權限不足，只能刪除自己的相簿' },
      404: { description: '相簿不存在' },
    },
  }),
  authMiddleware,
  async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  const user = c.get('user');

  const existing = await c.env.DB.prepare(
    'SELECT author_id, cover_image FROM galleries WHERE id = ?'
  )
    .bind(id)
    .first<{ author_id: string; cover_image: string | null }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Gallery not found',
      },
      404
    );
  }

  if (existing.author_id !== userId && user.role !== 'admin') {
    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'You can only delete your own galleries',
      },
      403
    );
  }

  // Get all images in the gallery
  const images = await c.env.DB.prepare(
    'SELECT image_url FROM gallery_images WHERE gallery_id = ?'
  )
    .bind(id)
    .all<{ image_url: string }>();

  // Delete all images from R2
  const imageUrls = images.results?.map((img) => img.image_url) || [];
  await deleteR2Images(c.env.STORAGE, [existing.cover_image, ...imageUrls]);

  await c.env.DB.prepare('DELETE FROM galleries WHERE id = ?').bind(id).run();

  return c.json({
    success: true,
    message: 'Gallery deleted successfully',
  });
});
