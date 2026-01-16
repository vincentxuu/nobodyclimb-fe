import { Hono } from 'hono';
import { Env, Crag } from '../types';
import { parsePagination, generateId, generateSlug } from '../utils/id';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { deleteR2Images } from '../utils/storage';

export const cragsRoutes = new Hono<{ Bindings: Env }>();

// GET /crags - List all crags
cragsRoutes.get('/', async (c) => {
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );
  const region = c.req.query('region');
  const featured = c.req.query('featured');

  let whereClause = '1=1';
  const params: (string | number)[] = [];

  if (region) {
    whereClause += ' AND region = ?';
    params.push(region);
  }

  if (featured === 'true') {
    whereClause += ' AND is_featured = 1';
  }

  // Get total count
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM crags WHERE ${whereClause}`
  )
    .bind(...params)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  // Get paginated results
  const crags = await c.env.DB.prepare(
    `SELECT * FROM crags WHERE ${whereClause}
     ORDER BY is_featured DESC, name ASC
     LIMIT ? OFFSET ?`
  )
    .bind(...params, limit, offset)
    .all<Crag>();

  return c.json({
    success: true,
    data: crags.results.map((crag) => ({
      ...crag,
      climbing_types: crag.climbing_types ? JSON.parse(crag.climbing_types) : [],
      images: crag.images ? JSON.parse(crag.images) : [],
      best_seasons: crag.best_seasons ? JSON.parse(crag.best_seasons) : [],
    })),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// GET /crags/featured - Get featured crags
cragsRoutes.get('/featured', async (c) => {
  const limit = parseInt(c.req.query('limit') || '6', 10);

  const crags = await c.env.DB.prepare(
    `SELECT * FROM crags WHERE is_featured = 1 ORDER BY name ASC LIMIT ?`
  )
    .bind(limit)
    .all<Crag>();

  return c.json({
    success: true,
    data: crags.results.map((crag) => ({
      ...crag,
      climbing_types: crag.climbing_types ? JSON.parse(crag.climbing_types) : [],
      images: crag.images ? JSON.parse(crag.images) : [],
      best_seasons: crag.best_seasons ? JSON.parse(crag.best_seasons) : [],
    })),
  });
});

// GET /crags/:id - Get crag by ID
cragsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const crag = await c.env.DB.prepare('SELECT * FROM crags WHERE id = ?')
    .bind(id)
    .first<Crag>();

  if (!crag) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Crag not found',
      },
      404
    );
  }

  return c.json({
    success: true,
    data: {
      ...crag,
      climbing_types: crag.climbing_types ? JSON.parse(crag.climbing_types) : [],
      images: crag.images ? JSON.parse(crag.images) : [],
      best_seasons: crag.best_seasons ? JSON.parse(crag.best_seasons) : [],
    },
  });
});

// GET /crags/slug/:slug - Get crag by slug
cragsRoutes.get('/slug/:slug', async (c) => {
  const slug = c.req.param('slug');

  const crag = await c.env.DB.prepare('SELECT * FROM crags WHERE slug = ?')
    .bind(slug)
    .first<Crag>();

  if (!crag) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Crag not found',
      },
      404
    );
  }

  return c.json({
    success: true,
    data: {
      ...crag,
      climbing_types: crag.climbing_types ? JSON.parse(crag.climbing_types) : [],
      images: crag.images ? JSON.parse(crag.images) : [],
      best_seasons: crag.best_seasons ? JSON.parse(crag.best_seasons) : [],
    },
  });
});

// GET /crags/:id/routes - Get routes for a crag
cragsRoutes.get('/:id/routes', async (c) => {
  const cragId = c.req.param('id');

  const routes = await c.env.DB.prepare(
    'SELECT * FROM routes WHERE crag_id = ? ORDER BY grade ASC'
  )
    .bind(cragId)
    .all();

  return c.json({
    success: true,
    data: routes.results,
  });
});

// POST /crags - Create new crag (admin only)
cragsRoutes.post('/', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json<Partial<Crag>>();

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
    `INSERT INTO crags (
      id, name, slug, description, location, region,
      latitude, longitude, altitude, rock_type, climbing_types,
      difficulty_range, route_count, bolt_count, cover_image, images,
      is_featured, access_info, parking_info, approach_time, best_seasons, restrictions
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      body.name,
      slug,
      body.description || null,
      body.location || null,
      body.region || null,
      body.latitude || null,
      body.longitude || null,
      body.altitude || null,
      body.rock_type || null,
      body.climbing_types ? JSON.stringify(body.climbing_types) : null,
      body.difficulty_range || null,
      body.route_count || 0,
      body.bolt_count || 0,
      body.cover_image || null,
      body.images ? JSON.stringify(body.images) : null,
      body.is_featured || 0,
      body.access_info || null,
      body.parking_info || null,
      body.approach_time || null,
      body.best_seasons ? JSON.stringify(body.best_seasons) : null,
      body.restrictions || null
    )
    .run();

  const crag = await c.env.DB.prepare('SELECT * FROM crags WHERE id = ?')
    .bind(id)
    .first<Crag>();

  return c.json(
    {
      success: true,
      data: crag,
    },
    201
  );
});

// PUT /crags/:id - Update crag (admin only)
cragsRoutes.put('/:id', authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<Partial<Crag>>();

  const existing = await c.env.DB.prepare('SELECT id FROM crags WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Crag not found',
      },
      404
    );
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  const fields = [
    'name',
    'description',
    'location',
    'region',
    'latitude',
    'longitude',
    'altitude',
    'rock_type',
    'difficulty_range',
    'route_count',
    'bolt_count',
    'cover_image',
    'is_featured',
    'access_info',
    'parking_info',
    'approach_time',
    'restrictions',
  ];

  for (const field of fields) {
    if (body[field as keyof Crag] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field as keyof Crag] as string | number | null);
    }
  }

  // Handle JSON fields
  if (body.climbing_types !== undefined) {
    updates.push('climbing_types = ?');
    values.push(JSON.stringify(body.climbing_types));
  }
  if (body.images !== undefined) {
    updates.push('images = ?');
    values.push(JSON.stringify(body.images));
  }
  if (body.best_seasons !== undefined) {
    updates.push('best_seasons = ?');
    values.push(JSON.stringify(body.best_seasons));
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
    `UPDATE crags SET ${updates.join(', ')} WHERE id = ?`
  )
    .bind(...values)
    .run();

  const crag = await c.env.DB.prepare('SELECT * FROM crags WHERE id = ?')
    .bind(id)
    .first<Crag>();

  return c.json({
    success: true,
    data: crag,
  });
});

// DELETE /crags/:id - Delete crag (admin only)
cragsRoutes.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param('id');

  const existing = await c.env.DB.prepare('SELECT id, images FROM crags WHERE id = ?')
    .bind(id)
    .first<{ id: string; images: string | null }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Crag not found',
      },
      404
    );
  }

  // Delete images from R2 (images is JSON array)
  if (existing.images) {
    try {
      const imageUrls = JSON.parse(existing.images) as string[];
      await deleteR2Images(c.env.STORAGE, imageUrls);
    } catch {
      // Ignore JSON parse errors
    }
  }

  await c.env.DB.prepare('DELETE FROM crags WHERE id = ?').bind(id).run();

  return c.json({
    success: true,
    message: 'Crag deleted successfully',
  });
});
