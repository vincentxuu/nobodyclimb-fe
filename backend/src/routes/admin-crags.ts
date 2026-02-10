import { Hono } from 'hono';
import { D1Database } from '@cloudflare/workers-types';
import { Env, Crag, Route } from '../types';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { parsePagination, generateId } from '../utils/id';

// Helper function to update crag route and bolt counts
async function updateCragCounts(db: D1Database, cragId: string) {
  return db
    .prepare(
      `
    UPDATE crags
    SET route_count = (SELECT COUNT(*) FROM routes WHERE crag_id = ?),
        bolt_count = (SELECT COALESCE(SUM(bolt_count), 0) FROM routes WHERE crag_id = ?),
        updated_at = datetime('now')
    WHERE id = ?
  `
    )
    .bind(cragId, cragId, cragId)
    .run();
}

export const adminCragsRoutes = new Hono<{ Bindings: Env }>();

// All routes require admin authentication
adminCragsRoutes.use('*', authMiddleware, adminMiddleware);

// ============================================
// Static routes MUST come before dynamic routes
// ============================================

// GET /admin/crags - List all crags with admin info
adminCragsRoutes.get('/', async (c) => {
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );
  const search = c.req.query('search');
  const region = c.req.query('region');

  let whereClause = '1=1';
  const params: (string | number)[] = [];

  if (search) {
    whereClause += ' AND (name LIKE ? OR slug LIKE ? OR location LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (region) {
    whereClause += ' AND region = ?';
    params.push(region);
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
     ORDER BY updated_at DESC, name ASC
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

// GET /admin/crags/stats - Get crag statistics (MUST be before /:id)
adminCragsRoutes.get('/stats', async (c) => {
  const stats = await c.env.DB.prepare(`
    SELECT
      COUNT(*) as total_crags,
      SUM(route_count) as total_routes,
      SUM(bolt_count) as total_bolts,
      SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) as featured_count,
      COUNT(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 END) as new_this_month
    FROM crags
  `).first<{
    total_crags: number;
    total_routes: number;
    total_bolts: number;
    featured_count: number;
    new_this_month: number;
  }>();

  // Get region distribution
  const regionStats = await c.env.DB.prepare(`
    SELECT region, COUNT(*) as count
    FROM crags
    WHERE region IS NOT NULL
    GROUP BY region
    ORDER BY count DESC
  `).all<{ region: string; count: number }>();

  return c.json({
    success: true,
    data: {
      ...stats,
      regions: regionStats.results,
    },
  });
});

// POST /admin/crags/batch-import - Batch import crags (MUST be before /:id)
adminCragsRoutes.post('/batch-import', async (c) => {
  const body = await c.req.json<{
    crags: Array<Partial<Crag>>;
    skipExisting?: boolean;
  }>();

  if (!body.crags || !Array.isArray(body.crags)) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'crags array is required',
      },
      400
    );
  }

  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const cragData of body.crags) {
    try {
      if (!cragData.name || !cragData.slug) {
        results.errors.push(`Missing name or slug for crag`);
        continue;
      }

      // Check if exists
      if (body.skipExisting) {
        const existing = await c.env.DB.prepare(
          'SELECT id FROM crags WHERE slug = ?'
        )
          .bind(cragData.slug)
          .first();

        if (existing) {
          results.skipped++;
          continue;
        }
      }

      const id = cragData.id || generateId();

      await c.env.DB.prepare(`
        INSERT INTO crags (
          id, name, slug, description, location, region,
          latitude, longitude, altitude, rock_type, climbing_types,
          difficulty_range, route_count, bolt_count, cover_image, images,
          is_featured, access_info, parking_info, approach_time, best_seasons, restrictions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          description = excluded.description,
          location = excluded.location,
          region = excluded.region,
          latitude = excluded.latitude,
          longitude = excluded.longitude,
          altitude = excluded.altitude,
          rock_type = excluded.rock_type,
          climbing_types = excluded.climbing_types,
          difficulty_range = excluded.difficulty_range,
          route_count = excluded.route_count,
          bolt_count = excluded.bolt_count,
          cover_image = excluded.cover_image,
          images = excluded.images,
          is_featured = excluded.is_featured,
          access_info = excluded.access_info,
          parking_info = excluded.parking_info,
          approach_time = excluded.approach_time,
          best_seasons = excluded.best_seasons,
          restrictions = excluded.restrictions,
          updated_at = datetime('now')
      `)
        .bind(
          id,
          cragData.name,
          cragData.slug,
          cragData.description || null,
          cragData.location || null,
          cragData.region || null,
          cragData.latitude || null,
          cragData.longitude || null,
          cragData.altitude || null,
          cragData.rock_type || null,
          cragData.climbing_types
            ? JSON.stringify(cragData.climbing_types)
            : null,
          cragData.difficulty_range || null,
          cragData.route_count || 0,
          cragData.bolt_count || 0,
          cragData.cover_image || null,
          cragData.images ? JSON.stringify(cragData.images) : null,
          cragData.is_featured || 0,
          cragData.access_info || null,
          cragData.parking_info || null,
          cragData.approach_time || null,
          cragData.best_seasons ? JSON.stringify(cragData.best_seasons) : null,
          cragData.restrictions || null
        )
        .run();

      results.imported++;
    } catch (error) {
      results.errors.push(
        `Failed to import ${cragData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return c.json({
    success: results.errors.length === 0,
    data: results,
  });
});

// ============================================
// Dynamic crag routes (/:id)
// ============================================

// GET /admin/crags/:id - Get crag details with routes
adminCragsRoutes.get('/:id', async (c) => {
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

  // Get routes for this crag
  const routes = await c.env.DB.prepare(
    'SELECT * FROM routes WHERE crag_id = ? ORDER BY grade ASC'
  )
    .bind(id)
    .all<Route>();

  return c.json({
    success: true,
    data: {
      ...crag,
      climbing_types: crag.climbing_types ? JSON.parse(crag.climbing_types) : [],
      images: crag.images ? JSON.parse(crag.images) : [],
      best_seasons: crag.best_seasons ? JSON.parse(crag.best_seasons) : [],
      routes: routes.results,
    },
  });
});

// POST /admin/crags/:id/update-counts - Update route and bolt counts
adminCragsRoutes.post('/:id/update-counts', async (c) => {
  const id = c.req.param('id');

  // First verify crag exists
  const cragExists = await c.env.DB.prepare('SELECT id FROM crags WHERE id = ?')
    .bind(id)
    .first();

  if (!cragExists) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Crag not found',
      },
      404
    );
  }

  // Calculate counts from routes table
  const counts = await c.env.DB.prepare(`
    SELECT
      COUNT(*) as route_count,
      COALESCE(SUM(bolt_count), 0) as bolt_count
    FROM routes
    WHERE crag_id = ?
  `)
    .bind(id)
    .first<{ route_count: number; bolt_count: number }>();

  // Update crag
  await c.env.DB.prepare(`
    UPDATE crags
    SET route_count = ?, bolt_count = ?, updated_at = datetime('now')
    WHERE id = ?
  `)
    .bind(counts?.route_count || 0, counts?.bolt_count || 0, id)
    .run();

  return c.json({
    success: true,
    data: {
      route_count: counts?.route_count || 0,
      bolt_count: counts?.bolt_count || 0,
    },
  });
});

// ============================================
// Route Management - Static routes first
// ============================================

// POST /admin/crags/:cragId/routes/batch-import - Batch import routes (MUST be before /:cragId/routes)
adminCragsRoutes.post('/:cragId/routes/batch-import', async (c) => {
  const cragId = c.req.param('cragId');
  const body = await c.req.json<{
    routes: Array<Partial<Route>>;
    skipExisting?: boolean;
  }>();

  // Verify crag exists
  const crag = await c.env.DB.prepare('SELECT id FROM crags WHERE id = ?')
    .bind(cragId)
    .first();

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

  if (!body.routes || !Array.isArray(body.routes)) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'routes array is required',
      },
      400
    );
  }

  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const routeData of body.routes) {
    try {
      if (!routeData.name) {
        results.errors.push('Missing name for route');
        continue;
      }

      const id = routeData.id || generateId();

      await c.env.DB.prepare(`
        INSERT INTO routes (
          id, crag_id, name, grade, grade_system,
          height, bolt_count, route_type, description, first_ascent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          grade = excluded.grade,
          grade_system = excluded.grade_system,
          height = excluded.height,
          bolt_count = excluded.bolt_count,
          route_type = excluded.route_type,
          description = excluded.description,
          first_ascent = excluded.first_ascent
      `)
        .bind(
          id,
          cragId,
          routeData.name,
          routeData.grade || null,
          routeData.grade_system || 'yds',
          routeData.height || null,
          routeData.bolt_count || null,
          routeData.route_type || 'sport',
          routeData.description || null,
          routeData.first_ascent || null
        )
        .run();

      results.imported++;
    } catch (error) {
      results.errors.push(
        `Failed to import ${routeData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Update crag counts
  await updateCragCounts(c.env.DB, cragId);

  return c.json({
    success: results.errors.length === 0,
    data: results,
  });
});

// ============================================
// Dynamic route routes
// ============================================

// GET /admin/crags/:cragId/routes - List routes for a crag
adminCragsRoutes.get('/:cragId/routes', async (c) => {
  const cragId = c.req.param('cragId');
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );

  // Get total count
  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM routes WHERE crag_id = ?'
  )
    .bind(cragId)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  // Get paginated results
  const routes = await c.env.DB.prepare(
    `SELECT * FROM routes WHERE crag_id = ?
     ORDER BY grade ASC, name ASC
     LIMIT ? OFFSET ?`
  )
    .bind(cragId, limit, offset)
    .all<Route>();

  return c.json({
    success: true,
    data: routes.results,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// POST /admin/crags/:cragId/routes - Create route
adminCragsRoutes.post('/:cragId/routes', async (c) => {
  const cragId = c.req.param('cragId');
  const body = await c.req.json<Partial<Route>>();

  // Verify crag exists
  const crag = await c.env.DB.prepare('SELECT id FROM crags WHERE id = ?')
    .bind(cragId)
    .first();

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

  if (!body.name) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Route name is required',
      },
      400
    );
  }

  const id = body.id || generateId();

  await c.env.DB.prepare(`
    INSERT INTO routes (
      id, crag_id, name, grade, grade_system,
      height, bolt_count, route_type, description, first_ascent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      id,
      cragId,
      body.name,
      body.grade || null,
      body.grade_system || 'yds',
      body.height || null,
      body.bolt_count || null,
      body.route_type || 'sport',
      body.description || null,
      body.first_ascent || null
    )
    .run();

  // Update crag route count
  await updateCragCounts(c.env.DB, cragId);

  const route = await c.env.DB.prepare('SELECT * FROM routes WHERE id = ?')
    .bind(id)
    .first<Route>();

  return c.json(
    {
      success: true,
      data: route,
    },
    201
  );
});

// PUT /admin/crags/:cragId/routes/:routeId - Update route
adminCragsRoutes.put('/:cragId/routes/:routeId', async (c) => {
  const cragId = c.req.param('cragId');
  const routeId = c.req.param('routeId');
  const body = await c.req.json<Partial<Route>>();

  // Query existing route with bolt_count for incremental update
  const existing = await c.env.DB.prepare(
    'SELECT id, bolt_count FROM routes WHERE id = ? AND crag_id = ?'
  )
    .bind(routeId, cragId)
    .first<{ id: string; bolt_count: number | null }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Route not found',
      },
      404
    );
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  const fields = [
    'name',
    'grade',
    'grade_system',
    'height',
    'bolt_count',
    'route_type',
    'description',
    'first_ascent',
  ];

  for (const field of fields) {
    if (body[field as keyof Route] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field as keyof Route] as string | number | null);
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

  values.push(routeId);

  await c.env.DB.prepare(`UPDATE routes SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  // Use incremental bolt_count update if bolt_count was changed
  if (body.bolt_count !== undefined) {
    const oldBoltCount = existing.bolt_count || 0;
    const newBoltCount = body.bolt_count || 0;
    const diff = newBoltCount - oldBoltCount;

    if (diff !== 0) {
      await c.env.DB.prepare(
        `
        UPDATE crags
        SET bolt_count = bolt_count + ?,
            updated_at = datetime('now')
        WHERE id = ?
      `
      )
        .bind(diff, cragId)
        .run();
    }
  }

  const route = await c.env.DB.prepare('SELECT * FROM routes WHERE id = ?')
    .bind(routeId)
    .first<Route>();

  return c.json({
    success: true,
    data: route,
  });
});

// DELETE /admin/crags/:cragId/routes/:routeId - Delete route
adminCragsRoutes.delete('/:cragId/routes/:routeId', async (c) => {
  const cragId = c.req.param('cragId');
  const routeId = c.req.param('routeId');

  const existing = await c.env.DB.prepare(
    'SELECT id FROM routes WHERE id = ? AND crag_id = ?'
  )
    .bind(routeId, cragId)
    .first();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Route not found',
      },
      404
    );
  }

  await c.env.DB.prepare('DELETE FROM routes WHERE id = ?').bind(routeId).run();

  // Update crag counts
  await updateCragCounts(c.env.DB, cragId);

  return c.json({
    success: true,
    message: 'Route deleted successfully',
  });
});
