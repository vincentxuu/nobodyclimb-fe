import { Hono } from 'hono';
import { Env } from '../types';
import { generateId } from '../utils/id';
import { authMiddleware } from '../middleware/auth';

export const climbingLocationsRoutes = new Hono<{ Bindings: Env }>();

// ═══════════════════════════════════════════════════════════
// 攀岩足跡 API (正規化表格)
// ═══════════════════════════════════════════════════════════

interface ClimbingLocation {
  id: string;
  biography_id: string;
  location: string;
  country: string;
  visit_year: string | null;
  notes: string | null;
  photos: string | null;
  is_public: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// GET /climbing-locations - Get current user's climbing locations
climbingLocationsRoutes.get('/', authMiddleware, async (c) => {
  const userId = c.get('userId');

  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json({
      success: true,
      data: [],
    });
  }

  const locations = await c.env.DB.prepare(
    `SELECT * FROM climbing_locations
     WHERE biography_id = ?
     ORDER BY sort_order ASC, created_at DESC`
  )
    .bind(biography.id)
    .all<ClimbingLocation>();

  // Parse photos JSON
  const parsedLocations = (locations.results || []).map((loc) => ({
    ...loc,
    photos: loc.photos ? JSON.parse(loc.photos) : null,
    is_public: Boolean(loc.is_public),
  }));

  return c.json({
    success: true,
    data: parsedLocations,
  });
});

// GET /climbing-locations/biography/:id - Get a biography's public climbing locations
climbingLocationsRoutes.get('/biography/:id', async (c) => {
  const biographyId = c.req.param('id');

  const locations = await c.env.DB.prepare(
    `SELECT * FROM climbing_locations
     WHERE biography_id = ? AND is_public = 1
     ORDER BY sort_order ASC, created_at DESC`
  )
    .bind(biographyId)
    .all<ClimbingLocation>();

  const parsedLocations = (locations.results || []).map((loc) => ({
    ...loc,
    photos: loc.photos ? JSON.parse(loc.photos) : null,
    is_public: true,
  }));

  return c.json({
    success: true,
    data: parsedLocations,
  });
});

// POST /climbing-locations - Add a new climbing location
climbingLocationsRoutes.post('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{
    location: string;
    country: string;
    visit_year?: string;
    notes?: string;
    photos?: string[];
    is_public?: boolean;
  }>();

  if (!body.location || !body.country) {
    return c.json({
      success: false,
      error: 'Bad Request',
      message: 'Location and country are required',
    }, 400);
  }

  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json({
      success: false,
      error: 'Not Found',
      message: 'Biography not found. Create one first.',
    }, 404);
  }

  // Get max sort_order
  const maxOrder = await c.env.DB.prepare(
    'SELECT MAX(sort_order) as max_order FROM climbing_locations WHERE biography_id = ?'
  )
    .bind(biography.id)
    .first<{ max_order: number | null }>();

  const id = generateId();
  const sortOrder = (maxOrder?.max_order ?? -1) + 1;

  await c.env.DB.prepare(
    `INSERT INTO climbing_locations
     (id, biography_id, location, country, visit_year, notes, photos, is_public, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      biography.id,
      body.location,
      body.country,
      body.visit_year || null,
      body.notes || null,
      body.photos ? JSON.stringify(body.photos) : null,
      body.is_public !== false ? 1 : 0,
      sortOrder
    )
    .run();

  const location = await c.env.DB.prepare(
    'SELECT * FROM climbing_locations WHERE id = ?'
  )
    .bind(id)
    .first<ClimbingLocation>();

  return c.json({
    success: true,
    data: {
      ...location,
      photos: location?.photos ? JSON.parse(location.photos) : null,
      is_public: Boolean(location?.is_public),
    },
  }, 201);
});

// PUT /climbing-locations/:id - Update a climbing location
climbingLocationsRoutes.put('/:id', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const locationId = c.req.param('id');
  const body = await c.req.json<{
    location?: string;
    country?: string;
    visit_year?: string | null;
    notes?: string | null;
    photos?: string[] | null;
    is_public?: boolean;
    sort_order?: number;
  }>();

  // Verify ownership
  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json({
      success: false,
      error: 'Not Found',
      message: 'Biography not found',
    }, 404);
  }

  const existing = await c.env.DB.prepare(
    'SELECT id FROM climbing_locations WHERE id = ? AND biography_id = ?'
  )
    .bind(locationId, biography.id)
    .first<{ id: string }>();

  if (!existing) {
    return c.json({
      success: false,
      error: 'Not Found',
      message: 'Climbing location not found',
    }, 404);
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (body.location !== undefined) {
    updates.push('location = ?');
    values.push(body.location);
  }
  if (body.country !== undefined) {
    updates.push('country = ?');
    values.push(body.country);
  }
  if (body.visit_year !== undefined) {
    updates.push('visit_year = ?');
    values.push(body.visit_year);
  }
  if (body.notes !== undefined) {
    updates.push('notes = ?');
    values.push(body.notes);
  }
  if (body.photos !== undefined) {
    updates.push('photos = ?');
    values.push(body.photos ? JSON.stringify(body.photos) : null);
  }
  if (body.is_public !== undefined) {
    updates.push('is_public = ?');
    values.push(body.is_public ? 1 : 0);
  }
  if (body.sort_order !== undefined) {
    updates.push('sort_order = ?');
    values.push(body.sort_order);
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(locationId);

    await c.env.DB.prepare(
      `UPDATE climbing_locations SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();
  }

  const location = await c.env.DB.prepare(
    'SELECT * FROM climbing_locations WHERE id = ?'
  )
    .bind(locationId)
    .first<ClimbingLocation>();

  return c.json({
    success: true,
    data: {
      ...location,
      photos: location?.photos ? JSON.parse(location.photos) : null,
      is_public: Boolean(location?.is_public),
    },
  });
});

// DELETE /climbing-locations/:id - Delete a climbing location
climbingLocationsRoutes.delete('/:id', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const locationId = c.req.param('id');

  // Verify ownership
  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json({
      success: false,
      error: 'Not Found',
      message: 'Biography not found',
    }, 404);
  }

  const existing = await c.env.DB.prepare(
    'SELECT id FROM climbing_locations WHERE id = ? AND biography_id = ?'
  )
    .bind(locationId, biography.id)
    .first<{ id: string }>();

  if (!existing) {
    return c.json({
      success: false,
      error: 'Not Found',
      message: 'Climbing location not found',
    }, 404);
  }

  await c.env.DB.prepare('DELETE FROM climbing_locations WHERE id = ?')
    .bind(locationId)
    .run();

  return c.json({
    success: true,
    message: 'Climbing location deleted',
  });
});

// PUT /climbing-locations/reorder - Reorder climbing locations
climbingLocationsRoutes.put('/reorder', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{
    order: string[]; // Array of location IDs in desired order
  }>();

  if (!body.order || !Array.isArray(body.order)) {
    return c.json({
      success: false,
      error: 'Bad Request',
      message: 'Order array is required',
    }, 400);
  }

  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json({
      success: false,
      error: 'Not Found',
      message: 'Biography not found',
    }, 404);
  }

  // Update sort_order for each location
  for (let i = 0; i < body.order.length; i++) {
    await c.env.DB.prepare(
      'UPDATE climbing_locations SET sort_order = ? WHERE id = ? AND biography_id = ?'
    )
      .bind(i, body.order[i], biography.id)
      .run();
  }

  return c.json({
    success: true,
    message: 'Order updated',
  });
});

// POST /climbing-locations/migrate - Migrate JSON data to table (one-time use)
climbingLocationsRoutes.post('/migrate', authMiddleware, async (c) => {
  const userId = c.get('userId');

  const biography = await c.env.DB.prepare(
    'SELECT id, climbing_locations FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string; climbing_locations: string | null }>();

  if (!biography) {
    return c.json({
      success: false,
      error: 'Not Found',
      message: 'Biography not found',
    }, 404);
  }

  if (!biography.climbing_locations) {
    return c.json({
      success: true,
      message: 'No data to migrate',
      data: { migrated: 0 },
    });
  }

  // Check if already migrated
  const existingCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM climbing_locations WHERE biography_id = ?'
  )
    .bind(biography.id)
    .first<{ count: number }>();

  if ((existingCount?.count || 0) > 0) {
    return c.json({
      success: true,
      message: 'Already migrated',
      data: { migrated: 0 },
    });
  }

  try {
    const jsonLocations = JSON.parse(biography.climbing_locations) as Array<{
      location: string;
      country: string;
      visit_year?: string;
      notes?: string;
      photos?: string[];
      is_public?: boolean;
    }>;

    if (!Array.isArray(jsonLocations)) {
      return c.json({
        success: false,
        error: 'Bad Data',
        message: 'Invalid JSON format',
      }, 400);
    }

    let migrated = 0;
    for (let i = 0; i < jsonLocations.length; i++) {
      const loc = jsonLocations[i];
      const id = generateId();

      await c.env.DB.prepare(
        `INSERT INTO climbing_locations
         (id, biography_id, location, country, visit_year, notes, photos, is_public, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          id,
          biography.id,
          loc.location,
          loc.country,
          loc.visit_year || null,
          loc.notes || null,
          loc.photos ? JSON.stringify(loc.photos) : null,
          loc.is_public !== false ? 1 : 0,
          i
        )
        .run();
      migrated++;
    }

    return c.json({
      success: true,
      message: 'Migration completed',
      data: { migrated },
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Migration Failed',
      message: 'Failed to parse JSON data',
    }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
// 探索 API - 使用正規化表格
// ═══════════════════════════════════════════════════════════

// GET /climbing-locations/explore - Get all public locations with visitor stats
climbingLocationsRoutes.get('/explore', async (c) => {
  const country = c.req.query('country');
  const limit = parseInt(c.req.query('limit') || '20', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  let whereClause = 'cl.is_public = 1';
  const params: (string | number)[] = [];

  if (country) {
    whereClause += ' AND cl.country = ?';
    params.push(country);
  }

  // Get locations with visitor counts
  const locations = await c.env.DB.prepare(
    `SELECT
      cl.location,
      cl.country,
      COUNT(DISTINCT cl.biography_id) as visitor_count
     FROM climbing_locations cl
     JOIN biographies b ON b.id = cl.biography_id AND b.visibility = 'public'
     WHERE ${whereClause}
     GROUP BY cl.location, cl.country
     ORDER BY visitor_count DESC
     LIMIT ? OFFSET ?`
  )
    .bind(...params, limit, offset)
    .all();

  // Get total count
  const totalResult = await c.env.DB.prepare(
    `SELECT COUNT(DISTINCT cl.location || '|' || cl.country) as count
     FROM climbing_locations cl
     JOIN biographies b ON b.id = cl.biography_id AND b.visibility = 'public'
     WHERE ${whereClause}`
  )
    .bind(...params)
    .first<{ count: number }>();

  return c.json({
    success: true,
    data: locations.results,
    pagination: {
      total: totalResult?.count || 0,
      limit,
      offset,
    },
  });
});

// GET /climbing-locations/explore/:location - Get location details with visitors
climbingLocationsRoutes.get('/explore/:location', async (c) => {
  const locationName = decodeURIComponent(c.req.param('location'));

  const visitors = await c.env.DB.prepare(
    `SELECT
      cl.biography_id,
      b.name as biography_name,
      b.slug as biography_slug,
      b.avatar_url,
      cl.country,
      cl.visit_year,
      cl.notes
     FROM climbing_locations cl
     JOIN biographies b ON b.id = cl.biography_id AND b.visibility = 'public'
     WHERE cl.location = ? AND cl.is_public = 1
     ORDER BY cl.visit_year DESC`
  )
    .bind(locationName)
    .all();

  if (!visitors.results || visitors.results.length === 0) {
    return c.json({
      success: false,
      error: 'Not Found',
      message: 'Location not found or no visitors',
    }, 404);
  }

  const firstResult = visitors.results[0] as { country?: string };

  return c.json({
    success: true,
    data: {
      location: locationName,
      country: firstResult.country,
      visitor_count: visitors.results.length,
      visitors: visitors.results,
    },
  });
});

// GET /climbing-locations/explore/countries - Get countries with location counts
climbingLocationsRoutes.get('/explore/countries', async (c) => {
  const countries = await c.env.DB.prepare(
    `SELECT
      cl.country,
      COUNT(DISTINCT cl.location) as location_count,
      COUNT(DISTINCT cl.biography_id) as visitor_count
     FROM climbing_locations cl
     JOIN biographies b ON b.id = cl.biography_id AND b.visibility = 'public'
     WHERE cl.is_public = 1
     GROUP BY cl.country
     ORDER BY visitor_count DESC`
  ).all();

  return c.json({
    success: true,
    data: countries.results,
  });
});
