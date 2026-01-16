import { Hono } from 'hono';
import { Env, Gym } from '../types';
import { parsePagination, generateId, generateSlug } from '../utils/id';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { deleteR2Images } from '../utils/storage';

export const gymsRoutes = new Hono<{ Bindings: Env }>();

// GET /gyms - List all gyms
gymsRoutes.get('/', async (c) => {
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
gymsRoutes.get('/featured', async (c) => {
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
gymsRoutes.get('/:id', async (c) => {
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
gymsRoutes.get('/slug/:slug', async (c) => {
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
gymsRoutes.get('/:id/reviews', async (c) => {
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
gymsRoutes.post('/', authMiddleware, adminMiddleware, async (c) => {
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
gymsRoutes.put('/:id', authMiddleware, adminMiddleware, async (c) => {
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
gymsRoutes.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
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
