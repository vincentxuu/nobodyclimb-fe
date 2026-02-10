import { Hono } from 'hono';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';
import { Env, Area, Sector } from '../types';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { generateId, generateSlug } from '../utils/id';

export const adminSectorsRoutes = new Hono<{ Bindings: Env }>();

// Apply admin middleware to all routes
adminSectorsRoutes.use('*', authMiddleware, adminMiddleware);

// ============================================
// Area (區域) Management
// ============================================

const createAreaSchema = z.object({
  name: z.string().min(1),
  name_en: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  description_en: z.string().optional(),
  image: z.string().optional(),
  sort_order: z.number().optional(),
});

const updateAreaSchema = z.object({
  name: z.string().optional(),
  name_en: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  description_en: z.string().optional(),
  image: z.string().optional(),
  bolt_count: z.number().optional(),
  route_count: z.number().optional(),
  sort_order: z.number().optional(),
});

// GET /admin/crags/:cragId/areas - List areas for a crag
adminSectorsRoutes.get(
  '/:cragId/areas',
  describeRoute({
    tags: ['Admin - Areas'],
    summary: '取得岩場區域列表',
    description: '取得指定岩場的所有區域（如龍洞的校門口、鐘塔、音樂廳等）',
    responses: {
      200: { description: '成功取得區域列表' },
    },
  }),
  async (c) => {
    const cragId = c.req.param('cragId');

    const areas = await c.env.DB.prepare(
      `SELECT * FROM areas WHERE crag_id = ? ORDER BY sort_order ASC, name ASC`
    )
      .bind(cragId)
      .all<Area>();

    return c.json({
      success: true,
      data: areas.results,
    });
  }
);

// POST /admin/crags/:cragId/areas - Create a new area
adminSectorsRoutes.post(
  '/:cragId/areas',
  describeRoute({
    tags: ['Admin - Areas'],
    summary: '新增岩場區域',
    description: '在指定岩場下新增一個區域',
    responses: {
      201: { description: '成功建立區域' },
    },
  }),
  validator('json', createAreaSchema),
  async (c) => {
    const cragId = c.req.param('cragId');
    const body = c.req.valid('json');

    // 驗證岩場存在
    const cragExists = await c.env.DB.prepare('SELECT id FROM crags WHERE id = ?')
      .bind(cragId)
      .first();

    if (!cragExists) {
      return c.json({ success: false, error: 'Not Found', message: 'Crag not found' }, 404);
    }

    const id = generateId();
    const slug = body.slug || generateSlug(body.name);

    await c.env.DB.prepare(
      `INSERT INTO areas (id, crag_id, name, name_en, slug, description, description_en, image, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        cragId,
        body.name,
        body.name_en || null,
        slug,
        body.description || null,
        body.description_en || null,
        body.image || null,
        body.sort_order || 0
      )
      .run();

    const area = await c.env.DB.prepare('SELECT * FROM areas WHERE id = ?')
      .bind(id)
      .first<Area>();

    return c.json({ success: true, data: area }, 201);
  }
);

// PUT /admin/crags/:cragId/areas/:areaId - Update an area
adminSectorsRoutes.put(
  '/:cragId/areas/:areaId',
  describeRoute({
    tags: ['Admin - Areas'],
    summary: '更新岩場區域',
    responses: {
      200: { description: '成功更新區域' },
      404: { description: '找不到區域' },
    },
  }),
  validator('json', updateAreaSchema),
  async (c) => {
    const areaId = c.req.param('areaId');
    const body = c.req.valid('json');

    const existing = await c.env.DB.prepare('SELECT id FROM areas WHERE id = ?')
      .bind(areaId)
      .first();

    if (!existing) {
      return c.json({ success: false, error: 'Not Found', message: 'Area not found' }, 404);
    }

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    const fields = ['name', 'name_en', 'slug', 'description', 'description_en', 'image', 'bolt_count', 'route_count', 'sort_order'];

    for (const field of fields) {
      if (body[field as keyof typeof body] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field as keyof typeof body] as string | number | null);
      }
    }

    if (updates.length === 0) {
      return c.json({ success: false, error: 'Bad Request', message: 'No fields to update' }, 400);
    }

    updates.push("updated_at = datetime('now')");
    values.push(areaId);

    await c.env.DB.prepare(
      `UPDATE areas SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();

    const area = await c.env.DB.prepare('SELECT * FROM areas WHERE id = ?')
      .bind(areaId)
      .first<Area>();

    return c.json({ success: true, data: area });
  }
);

// DELETE /admin/crags/:cragId/areas/:areaId - Delete an area
adminSectorsRoutes.delete(
  '/:cragId/areas/:areaId',
  describeRoute({
    tags: ['Admin - Areas'],
    summary: '刪除岩場區域',
    description: '刪除區域及其下所有岩壁分區。該區域下的路線會保留但 area_id 和 sector_id 會被清空。',
    responses: {
      200: { description: '成功刪除區域' },
      404: { description: '找不到區域' },
    },
  }),
  async (c) => {
    const areaId = c.req.param('areaId');

    const existing = await c.env.DB.prepare('SELECT id FROM areas WHERE id = ?')
      .bind(areaId)
      .first();

    if (!existing) {
      return c.json({ success: false, error: 'Not Found', message: 'Area not found' }, 404);
    }

    // 使用 batch 確保原子性：清除路線歸屬、刪除岩壁、刪除區域
    await c.env.DB.batch([
      c.env.DB.prepare('UPDATE routes SET area_id = NULL, sector_id = NULL WHERE area_id = ?')
        .bind(areaId),
      c.env.DB.prepare('DELETE FROM sectors WHERE area_id = ?')
        .bind(areaId),
      c.env.DB.prepare('DELETE FROM areas WHERE id = ?')
        .bind(areaId),
    ]);

    return c.json({ success: true, message: 'Area deleted successfully' });
  }
);

// PUT /admin/crags/:cragId/areas/reorder - Reorder areas
adminSectorsRoutes.put(
  '/:cragId/areas/reorder',
  describeRoute({
    tags: ['Admin - Areas'],
    summary: '重新排序區域',
    responses: {
      200: { description: '成功重新排序' },
    },
  }),
  validator('json', z.object({
    order: z.array(z.object({
      id: z.string(),
      sort_order: z.number(),
    })),
  })),
  async (c) => {
    const body = c.req.valid('json');

    const stmts = body.order.map((item) =>
      c.env.DB.prepare('UPDATE areas SET sort_order = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .bind(item.sort_order, item.id)
    );

    await c.env.DB.batch(stmts);

    return c.json({ success: true, message: 'Areas reordered successfully' });
  }
);

// ============================================
// Sector (岩壁) Management
// ============================================

const createSectorSchema = z.object({
  name: z.string().min(1),
  name_en: z.string().optional(),
  sort_order: z.number().optional(),
});

const updateSectorSchema = z.object({
  name: z.string().optional(),
  name_en: z.string().optional(),
  sort_order: z.number().optional(),
});

// GET /admin/crags/:cragId/areas/:areaId/sectors - List sectors for an area
adminSectorsRoutes.get(
  '/:cragId/areas/:areaId/sectors',
  describeRoute({
    tags: ['Admin - Sectors'],
    summary: '取得區域岩壁列表',
    description: '取得指定區域的所有岩壁分區（如校門口的人面岩、門簷等）',
    responses: {
      200: { description: '成功取得岩壁列表' },
    },
  }),
  async (c) => {
    const areaId = c.req.param('areaId');

    const sectors = await c.env.DB.prepare(
      `SELECT * FROM sectors WHERE area_id = ? ORDER BY sort_order ASC, name ASC`
    )
      .bind(areaId)
      .all<Sector>();

    return c.json({
      success: true,
      data: sectors.results,
    });
  }
);

// POST /admin/crags/:cragId/areas/:areaId/sectors - Create a new sector
adminSectorsRoutes.post(
  '/:cragId/areas/:areaId/sectors',
  describeRoute({
    tags: ['Admin - Sectors'],
    summary: '新增岩壁分區',
    description: '在指定區域下新增一個岩壁分區',
    responses: {
      201: { description: '成功建立岩壁分區' },
    },
  }),
  validator('json', createSectorSchema),
  async (c) => {
    const areaId = c.req.param('areaId');
    const body = c.req.valid('json');

    // 驗證區域存在
    const areaExists = await c.env.DB.prepare('SELECT id FROM areas WHERE id = ?')
      .bind(areaId)
      .first();

    if (!areaExists) {
      return c.json({ success: false, error: 'Not Found', message: 'Area not found' }, 404);
    }

    const id = generateId();

    await c.env.DB.prepare(
      `INSERT INTO sectors (id, area_id, name, name_en, sort_order)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        areaId,
        body.name,
        body.name_en || null,
        body.sort_order || 0
      )
      .run();

    const sector = await c.env.DB.prepare('SELECT * FROM sectors WHERE id = ?')
      .bind(id)
      .first<Sector>();

    return c.json({ success: true, data: sector }, 201);
  }
);

// PUT /admin/crags/:cragId/areas/:areaId/sectors/:sectorId - Update a sector
adminSectorsRoutes.put(
  '/:cragId/areas/:areaId/sectors/:sectorId',
  describeRoute({
    tags: ['Admin - Sectors'],
    summary: '更新岩壁分區',
    responses: {
      200: { description: '成功更新岩壁分區' },
      404: { description: '找不到岩壁分區' },
    },
  }),
  validator('json', updateSectorSchema),
  async (c) => {
    const sectorId = c.req.param('sectorId');
    const body = c.req.valid('json');

    const existing = await c.env.DB.prepare('SELECT id FROM sectors WHERE id = ?')
      .bind(sectorId)
      .first();

    if (!existing) {
      return c.json({ success: false, error: 'Not Found', message: 'Sector not found' }, 404);
    }

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    const fields = ['name', 'name_en', 'sort_order'];

    for (const field of fields) {
      if (body[field as keyof typeof body] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field as keyof typeof body] as string | number | null);
      }
    }

    if (updates.length === 0) {
      return c.json({ success: false, error: 'Bad Request', message: 'No fields to update' }, 400);
    }

    updates.push("updated_at = datetime('now')");
    values.push(sectorId);

    await c.env.DB.prepare(
      `UPDATE sectors SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();

    const sector = await c.env.DB.prepare('SELECT * FROM sectors WHERE id = ?')
      .bind(sectorId)
      .first<Sector>();

    return c.json({ success: true, data: sector });
  }
);

// DELETE /admin/crags/:cragId/areas/:areaId/sectors/:sectorId - Delete a sector
adminSectorsRoutes.delete(
  '/:cragId/areas/:areaId/sectors/:sectorId',
  describeRoute({
    tags: ['Admin - Sectors'],
    summary: '刪除岩壁分區',
    description: '刪除岩壁分區。該分區下的路線會保留但 sector_id 會被清空。',
    responses: {
      200: { description: '成功刪除岩壁分區' },
      404: { description: '找不到岩壁分區' },
    },
  }),
  async (c) => {
    const sectorId = c.req.param('sectorId');

    const existing = await c.env.DB.prepare('SELECT id FROM sectors WHERE id = ?')
      .bind(sectorId)
      .first();

    if (!existing) {
      return c.json({ success: false, error: 'Not Found', message: 'Sector not found' }, 404);
    }

    // 使用 batch 確保原子性：清除路線歸屬、刪除岩壁
    await c.env.DB.batch([
      c.env.DB.prepare('UPDATE routes SET sector_id = NULL WHERE sector_id = ?')
        .bind(sectorId),
      c.env.DB.prepare('DELETE FROM sectors WHERE id = ?')
        .bind(sectorId),
    ]);

    return c.json({ success: true, message: 'Sector deleted successfully' });
  }
);

// POST /admin/crags/:cragId/areas/:areaId/update-counts - Recalculate area counts
adminSectorsRoutes.post(
  '/:cragId/areas/:areaId/update-counts',
  describeRoute({
    tags: ['Admin - Areas'],
    summary: '更新區域統計',
    responses: {
      200: { description: '成功更新統計' },
    },
  }),
  async (c) => {
    const areaId = c.req.param('areaId');

    const counts = await c.env.DB.prepare(
      `SELECT COUNT(*) as route_count, COALESCE(SUM(bolt_count), 0) as bolt_count
       FROM routes WHERE area_id = ?`
    )
      .bind(areaId)
      .first<{ route_count: number; bolt_count: number }>();

    await c.env.DB.prepare(
      `UPDATE areas SET route_count = ?, bolt_count = ?, updated_at = datetime('now') WHERE id = ?`
    )
      .bind(counts?.route_count || 0, counts?.bolt_count || 0, areaId)
      .run();

    return c.json({
      success: true,
      data: { route_count: counts?.route_count || 0, bolt_count: counts?.bolt_count || 0 },
    });
  }
);
