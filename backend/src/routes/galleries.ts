import { Hono } from 'hono';
import { Env, Gallery } from '../types';
import { parsePagination, generateId, generateSlug } from '../utils/id';
import { authMiddleware } from '../middleware/auth';
import { trackAndUpdateViewCount } from '../utils/viewTracker';

export const galleriesRoutes = new Hono<{ Bindings: Env }>();

// GET /galleries/photos - Get all photos with uploader info (for gallery page)
galleriesRoutes.get('/photos', async (c) => {
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );

  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM gallery_images'
  ).first<{ count: number }>();
  const total = countResult?.count || 0;

  const photos = await c.env.DB.prepare(
    `SELECT
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
     ORDER BY gi.created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(limit, offset)
    .all();

  return c.json({
    success: true,
    data: photos.results,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// POST /galleries/photos - Upload a single photo
galleriesRoutes.post('/photos', authMiddleware, async (c) => {
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
  const photo = await c.env.DB.prepare(
    `SELECT
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
     WHERE gi.id = ?`
  )
    .bind(photoId)
    .first();

  return c.json(
    {
      success: true,
      data: photo,
    },
    201
  );
});

// GET /galleries/photos/me - Get current user's photos
galleriesRoutes.get('/photos/me', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );

  // Count user's photos
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count
     FROM gallery_images gi
     JOIN galleries g ON gi.gallery_id = g.id
     WHERE g.author_id = ?`
  )
    .bind(userId)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  // Get user's photos
  const photos = await c.env.DB.prepare(
    `SELECT
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
     WHERE g.author_id = ?
     ORDER BY gi.created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(userId, limit, offset)
    .all();

  return c.json({
    success: true,
    data: photos.results,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// PUT /galleries/photos/:id - Update a photo's metadata
galleriesRoutes.put('/photos/:id', authMiddleware, async (c) => {
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
  const updatedPhoto = await c.env.DB.prepare(
    `SELECT
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
     WHERE gi.id = ?`
  )
    .bind(photoId)
    .first();

  return c.json({
    success: true,
    data: updatedPhoto,
  });
});

// DELETE /galleries/photos/:id - Delete a photo
galleriesRoutes.delete('/photos/:id', authMiddleware, async (c) => {
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

// POST /galleries/upload - Upload image to R2 storage
galleriesRoutes.post('/upload', authMiddleware, async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('image') as File | null;

  if (!file) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'No image file provided',
      },
      400
    );
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
      },
      400
    );
  }

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `gallery/${generateId()}.${ext}`;

  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  await c.env.STORAGE.put(filename, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000, immutable',
    },
  });

  // Construct URL using environment variable
  const url = `${c.env.R2_PUBLIC_URL}/${filename}`;

  return c.json({
    success: true,
    data: { url },
  });
});

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
