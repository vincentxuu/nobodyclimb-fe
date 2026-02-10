import { Hono } from 'hono';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';
import { Env, Gym } from '../types';
import { parsePagination, generateId, generateSlug } from '../utils/id';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { deleteR2Images } from '../utils/storage';

export const gymsRoutes = new Hono<{ Bindings: Env }>();

// Validation schemas
const listGymsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  city: z.string().optional(),
  featured: z.enum(['true', 'false']).optional(),
});

const gymIdParamSchema = z.object({
  id: z.string().min(1),
});

const gymSlugParamSchema = z.object({
  slug: z.string().min(1),
});

const featuredQuerySchema = z.object({
  limit: z.string().optional(),
});

const reviewsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

const createGymSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  cover_image: z.string().optional(),
  is_featured: z.number().optional(),
  opening_hours: z.record(z.string()).optional(),
  facilities: z.array(z.string()).optional(),
  price_info: z.record(z.any()).optional(),
});

const updateGymSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  cover_image: z.string().optional(),
  is_featured: z.number().optional(),
  opening_hours: z.record(z.string()).optional(),
  facilities: z.array(z.string()).optional(),
  price_info: z.record(z.any()).optional(),
});

// GET /gyms - List all gyms
gymsRoutes.get(
  '/',
  describeRoute({
    tags: ['Gyms'],
    summary: '取得岩館列表',
    description: '取得所有岩館列表，支援分頁、城市過濾和精選過濾',
    responses: {
      200: { description: '成功取得岩館列表' },
    },
  }),
  validator('query', listGymsQuerySchema),
  async (c) => {
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );
  const city = c.req.query('city');
  const featured = c.req.query('featured');

  let whereClause = '1=1';
  const params: (string | number)[] = [];

  if (city) {
    whereClause += ' AND city = ?';
    params.push(city);
  }

  if (featured === 'true') {
    whereClause += ' AND is_featured = 1';
  }

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM gyms WHERE ${whereClause}`
  )
    .bind(...params)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  const gyms = await c.env.DB.prepare(
    `SELECT * FROM gyms WHERE ${whereClause}
     ORDER BY is_featured DESC, rating_avg DESC, name ASC
     LIMIT ? OFFSET ?`
  )
    .bind(...params, limit, offset)
    .all<Gym>();

  return c.json({
    success: true,
    data: gyms.results.map((gym) => ({
      ...gym,
      opening_hours: gym.opening_hours ? JSON.parse(gym.opening_hours) : null,
      facilities: gym.facilities ? JSON.parse(gym.facilities) : [],
      price_info: gym.price_info ? JSON.parse(gym.price_info) : null,
    })),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// GET /gyms/featured - Get featured gyms
gymsRoutes.get(
  '/featured',
  describeRoute({
    tags: ['Gyms'],
    summary: '取得精選岩館',
    description: '取得精選岩館列表，可指定數量限制',
    responses: {
      200: { description: '成功取得精選岩館列表' },
    },
  }),
  validator('query', featuredQuerySchema),
  async (c) => {
  const limit = parseInt(c.req.query('limit') || '6', 10);

  const gyms = await c.env.DB.prepare(
    `SELECT * FROM gyms WHERE is_featured = 1 ORDER BY rating_avg DESC LIMIT ?`
  )
    .bind(limit)
    .all<Gym>();

  return c.json({
    success: true,
    data: gyms.results.map((gym) => ({
      ...gym,
      opening_hours: gym.opening_hours ? JSON.parse(gym.opening_hours) : null,
      facilities: gym.facilities ? JSON.parse(gym.facilities) : [],
      price_info: gym.price_info ? JSON.parse(gym.price_info) : null,
    })),
  });
});

// GET /gyms/:id - Get gym by ID
gymsRoutes.get(
  '/:id',
  describeRoute({
    tags: ['Gyms'],
    summary: '根據 ID 取得岩館',
    description: '根據岩館 ID 取得單一岩館的詳細資訊',
    responses: {
      200: { description: '成功取得岩館資料' },
      404: { description: '找不到指定的岩館' },
    },
  }),
  validator('param', gymIdParamSchema),
  async (c) => {
  const id = c.req.param('id');

  const gym = await c.env.DB.prepare('SELECT * FROM gyms WHERE id = ?')
    .bind(id)
    .first<Gym>();

  if (!gym) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Gym not found',
      },
      404
    );
  }

  return c.json({
    success: true,
    data: {
      ...gym,
      opening_hours: gym.opening_hours ? JSON.parse(gym.opening_hours) : null,
      facilities: gym.facilities ? JSON.parse(gym.facilities) : [],
      price_info: gym.price_info ? JSON.parse(gym.price_info) : null,
    },
  });
});

// GET /gyms/slug/:slug - Get gym by slug
gymsRoutes.get(
  '/slug/:slug',
  describeRoute({
    tags: ['Gyms'],
    summary: '根據 slug 取得岩館',
    description: '根據岩館 slug 取得單一岩館的詳細資訊',
    responses: {
      200: { description: '成功取得岩館資料' },
      404: { description: '找不到指定的岩館' },
    },
  }),
  validator('param', gymSlugParamSchema),
  async (c) => {
  const slug = c.req.param('slug');

  const gym = await c.env.DB.prepare('SELECT * FROM gyms WHERE slug = ?')
    .bind(slug)
    .first<Gym>();

  if (!gym) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Gym not found',
      },
      404
    );
  }

  return c.json({
    success: true,
    data: {
      ...gym,
      opening_hours: gym.opening_hours ? JSON.parse(gym.opening_hours) : null,
      facilities: gym.facilities ? JSON.parse(gym.facilities) : [],
      price_info: gym.price_info ? JSON.parse(gym.price_info) : null,
    },
  });
});

// GET /gyms/:id/reviews - Get reviews for a gym
gymsRoutes.get(
  '/:id/reviews',
  describeRoute({
    tags: ['Gyms'],
    summary: '取得岩館評論',
    description: '取得指定岩館的所有評論，支援分頁',
    responses: {
      200: { description: '成功取得岩館評論列表' },
    },
  }),
  validator('param', gymIdParamSchema),
  validator('query', reviewsQuerySchema),
  async (c) => {
  const gymId = c.req.param('id');
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM reviews WHERE entity_type = 'gym' AND entity_id = ?`
  )
    .bind(gymId)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  const reviews = await c.env.DB.prepare(
    `SELECT r.*, u.username, u.display_name, u.avatar_url
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.entity_type = 'gym' AND r.entity_id = ?
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(gymId, limit, offset)
    .all();

  return c.json({
    success: true,
    data: reviews.results,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// POST /gyms - Create new gym (admin only)
gymsRoutes.post(
  '/',
  describeRoute({
    tags: ['Gyms'],
    summary: '建立新岩館',
    description: '建立一個新的岩館資料（僅限管理員）',
    responses: {
      201: { description: '成功建立岩館' },
      400: { description: '請求參數錯誤' },
      401: { description: '未授權，需要登入' },
      403: { description: '無權限，僅限管理員' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  validator('json', createGymSchema),
  async (c) => {
  const body = await c.req.json<Partial<Gym>>();

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

  const id = generateId();
  const slug = body.slug || generateSlug(body.name);

  await c.env.DB.prepare(
    `INSERT INTO gyms (
      id, name, slug, description, address, city, region,
      latitude, longitude, phone, email, website, cover_image,
      is_featured, opening_hours, facilities, price_info
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      body.name,
      slug,
      body.description || null,
      body.address || null,
      body.city || null,
      body.region || null,
      body.latitude || null,
      body.longitude || null,
      body.phone || null,
      body.email || null,
      body.website || null,
      body.cover_image || null,
      body.is_featured || 0,
      body.opening_hours ? JSON.stringify(body.opening_hours) : null,
      body.facilities ? JSON.stringify(body.facilities) : null,
      body.price_info ? JSON.stringify(body.price_info) : null
    )
    .run();

  const gym = await c.env.DB.prepare('SELECT * FROM gyms WHERE id = ?')
    .bind(id)
    .first<Gym>();

  return c.json(
    {
      success: true,
      data: gym,
    },
    201
  );
});

// PUT /gyms/:id - Update gym (admin only)
gymsRoutes.put(
  '/:id',
  describeRoute({
    tags: ['Gyms'],
    summary: '更新岩館資料',
    description: '更新指定岩館的資料（僅限管理員）',
    responses: {
      200: { description: '成功更新岩館資料' },
      400: { description: '請求參數錯誤或無欄位需更新' },
      401: { description: '未授權，需要登入' },
      403: { description: '無權限，僅限管理員' },
      404: { description: '找不到指定的岩館' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  validator('param', gymIdParamSchema),
  validator('json', updateGymSchema),
  async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<Partial<Gym>>();

  const existing = await c.env.DB.prepare('SELECT id FROM gyms WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Gym not found',
      },
      404
    );
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  const fields = [
    'name',
    'description',
    'address',
    'city',
    'region',
    'latitude',
    'longitude',
    'phone',
    'email',
    'website',
    'cover_image',
    'is_featured',
  ];

  for (const field of fields) {
    if (body[field as keyof Gym] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field as keyof Gym] as string | number | null);
    }
  }

  // Handle JSON fields
  if (body.opening_hours !== undefined) {
    updates.push('opening_hours = ?');
    values.push(JSON.stringify(body.opening_hours));
  }
  if (body.facilities !== undefined) {
    updates.push('facilities = ?');
    values.push(JSON.stringify(body.facilities));
  }
  if (body.price_info !== undefined) {
    updates.push('price_info = ?');
    values.push(JSON.stringify(body.price_info));
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

  await c.env.DB.prepare(`UPDATE gyms SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const gym = await c.env.DB.prepare('SELECT * FROM gyms WHERE id = ?')
    .bind(id)
    .first<Gym>();

  return c.json({
    success: true,
    data: gym,
  });
});

// DELETE /gyms/:id - Delete gym (admin only)
gymsRoutes.delete(
  '/:id',
  describeRoute({
    tags: ['Gyms'],
    summary: '刪除岩館',
    description: '刪除指定的岩館及其相關圖片資料（僅限管理員）',
    responses: {
      200: { description: '成功刪除岩館' },
      401: { description: '未授權，需要登入' },
      403: { description: '無權限，僅限管理員' },
      404: { description: '找不到指定的岩館' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  validator('param', gymIdParamSchema),
  async (c) => {
  const id = c.req.param('id');

  const existing = await c.env.DB.prepare('SELECT id, cover_image FROM gyms WHERE id = ?')
    .bind(id)
    .first<{ id: string; cover_image: string | null }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Gym not found',
      },
      404
    );
  }

  // Delete cover image from R2
  await deleteR2Images(c.env.STORAGE, existing.cover_image);

  await c.env.DB.prepare('DELETE FROM gyms WHERE id = ?').bind(id).run();

  return c.json({
    success: true,
    message: 'Gym deleted successfully',
  });
});
