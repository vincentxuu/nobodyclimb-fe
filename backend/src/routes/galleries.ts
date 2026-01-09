import { Hono } from 'hono';
import { Env, Gallery } from '../types';
import { parsePagination, generateId, generateSlug } from '../utils/id';
import { authMiddleware } from '../middleware/auth';

export const galleriesRoutes = new Hono<{ Bindings: Env }>();

// GET /galleries - List all galleries
galleriesRoutes.get('/', async (c) => {
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
galleriesRoutes.get('/popular', async (c) => {
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
galleriesRoutes.get('/:id', async (c) => {
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

  // Increment view count
  await c.env.DB.prepare(
    'UPDATE galleries SET view_count = view_count + 1 WHERE id = ?'
  )
    .bind(id)
    .run();

  return c.json({
    success: true,
    data: {
      ...gallery,
      images: images.results,
    },
  });
});

// GET /galleries/slug/:slug - Get gallery by slug
galleriesRoutes.get('/slug/:slug', async (c) => {
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

  await c.env.DB.prepare(
    'UPDATE galleries SET view_count = view_count + 1 WHERE id = ?'
  )
    .bind(gallery.id as string)
    .run();

  return c.json({
    success: true,
    data: {
      ...gallery,
      images: images.results,
    },
  });
});

// POST /galleries - Create new gallery
galleriesRoutes.post('/', authMiddleware, async (c) => {
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
galleriesRoutes.put('/:id', authMiddleware, async (c) => {
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
galleriesRoutes.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  const user = c.get('user');

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
        message: 'You can only delete your own galleries',
      },
      403
    );
  }

  await c.env.DB.prepare('DELETE FROM galleries WHERE id = ?').bind(id).run();

  return c.json({
    success: true,
    message: 'Gallery deleted successfully',
  });
});
