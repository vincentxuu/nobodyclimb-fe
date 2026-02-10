import { Hono } from 'hono';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';
import { Bindings } from '../types';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

export const adminQuestionsRoutes = new Hono<{ Bindings: Bindings }>();

// All routes require admin authentication
adminQuestionsRoutes.use('*', authMiddleware, adminMiddleware);

// ═══════════════════════════════════════════
// 故事分類管理
// ═══════════════════════════════════════════

// Validation schemas
const createCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().optional(),
  description: z.string().optional(),
  display_order: z.number().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  display_order: z.number().optional(),
  is_active: z.number().min(0).max(1).optional(),
});

const createOneLinerSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  format_hint: z.string().optional(),
  placeholder: z.string().optional(),
  category: z.string().optional(),
  display_order: z.number().optional(),
  is_core: z.boolean().optional(),
});

const updateOneLinerSchema = z.object({
  question: z.string().optional(),
  format_hint: z.string().optional(),
  placeholder: z.string().optional(),
  category: z.string().optional(),
  display_order: z.number().optional(),
  is_active: z.number().min(0).max(1).optional(),
  is_core: z.number().min(0).max(1).optional(),
});

const createStoryQuestionSchema = z.object({
  id: z.string().min(1),
  category_id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  placeholder: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  display_order: z.number().optional(),
});

const updateStoryQuestionSchema = z.object({
  category_id: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  placeholder: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  display_order: z.number().optional(),
  is_active: z.number().min(0).max(1).optional(),
});

const reorderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    display_order: z.number(),
  })),
});

// GET /admin/questions/categories - 取得所有分類
adminQuestionsRoutes.get(
  '/categories',
  describeRoute({
    tags: ['Admin'],
    summary: '取得所有故事分類',
    description: '取得所有故事分類列表，按顯示順序排序',
    responses: {
      200: { description: '成功取得分類列表' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  async (c) => {
  const categories = await c.env.DB.prepare(`
    SELECT * FROM story_categories
    ORDER BY display_order ASC
  `).all();

  return c.json({ success: true, data: categories.results });
});

// POST /admin/questions/categories - 新增分類
adminQuestionsRoutes.post(
  '/categories',
  describeRoute({
    tags: ['Admin'],
    summary: '新增故事分類',
    description: '新增一個新的故事分類',
    responses: {
      200: { description: '分類已成功新增' },
      400: { description: 'ID 和名稱為必填' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  validator('json', createCategorySchema),
  async (c) => {
  const { id, name, icon, description, display_order } = c.req.valid('json');

  const now = new Date().toISOString();

  await c.env.DB.prepare(`
    INSERT INTO story_categories (id, name, icon, description, display_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, name, icon || null, description || null, display_order || 0, now, now).run();

  return c.json({ success: true, message: '分類已新增' });
});

// PUT /admin/questions/categories/:id - 更新分類
adminQuestionsRoutes.put(
  '/categories/:id',
  describeRoute({
    tags: ['Admin'],
    summary: '更新故事分類',
    description: '更新指定 ID 的故事分類',
    responses: {
      200: { description: '分類已成功更新' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  validator('json', updateCategorySchema),
  async (c) => {
  const id = c.req.param('id');
  const { name, icon, description, display_order, is_active } = c.req.valid('json');

  const now = new Date().toISOString();

  await c.env.DB.prepare(`
    UPDATE story_categories
    SET name = COALESCE(?, name),
        icon = COALESCE(?, icon),
        description = COALESCE(?, description),
        display_order = COALESCE(?, display_order),
        is_active = COALESCE(?, is_active),
        updated_at = ?
    WHERE id = ?
  `).bind(name, icon, description, display_order, is_active, now, id).run();

  return c.json({ success: true, message: '分類已更新' });
});

// DELETE /admin/questions/categories/:id - 刪除分類
adminQuestionsRoutes.delete(
  '/categories/:id',
  describeRoute({
    tags: ['Admin'],
    summary: '刪除故事分類',
    description: '刪除指定 ID 的故事分類，若分類下還有問題則無法刪除',
    responses: {
      200: { description: '分類已成功刪除' },
      400: { description: '此分類下還有問題，無法刪除' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  async (c) => {
  const id = c.req.param('id');

  // Check if category has questions
  const questions = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM story_questions WHERE category_id = ?
  `).bind(id).first();

  if (questions && (questions as { count: number }).count > 0) {
    return c.json({
      success: false,
      error: '此分類下還有問題，請先刪除或移動問題'
    }, 400);
  }

  await c.env.DB.prepare('DELETE FROM story_categories WHERE id = ?').bind(id).run();

  return c.json({ success: true, message: '分類已刪除' });
});

// ═══════════════════════════════════════════
// 一句話問題管理
// ═══════════════════════════════════════════

// GET /admin/questions/one-liners - 取得所有一句話問題
adminQuestionsRoutes.get(
  '/one-liners',
  describeRoute({
    tags: ['Admin'],
    summary: '取得所有一句話問題',
    description: '取得所有一句話問題列表，可選擇是否包含停用的問題',
    responses: {
      200: { description: '成功取得一句話問題列表' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  async (c) => {
  const includeInactive = c.req.query('include_inactive') === 'true';

  let query = 'SELECT * FROM one_liner_questions';
  if (!includeInactive) {
    query += ' WHERE is_active = 1';
  }
  query += ' ORDER BY display_order ASC';

  const questions = await c.env.DB.prepare(query).all();

  return c.json({ success: true, data: questions.results });
});

// POST /admin/questions/one-liners - 新增一句話問題
adminQuestionsRoutes.post(
  '/one-liners',
  describeRoute({
    tags: ['Admin'],
    summary: '新增一句話問題',
    description: '新增一個新的一句話問題',
    responses: {
      200: { description: '問題已成功新增' },
      400: { description: 'ID 和問題內容為必填' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  validator('json', createOneLinerSchema),
  async (c) => {
  const userId = c.get('userId');
  const { id, question, format_hint, placeholder, category, display_order, is_core } = c.req.valid('json');

  const now = new Date().toISOString();

  await c.env.DB.prepare(`
    INSERT INTO one_liner_questions
    (id, question, format_hint, placeholder, category, display_order, is_core, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, question, format_hint || null, placeholder || null, category || null,
    display_order || 0, is_core ? 1 : 0, userId, now, now
  ).run();

  return c.json({ success: true, message: '問題已新增' });
});

// PUT /admin/questions/one-liners/:id - 更新一句話問題
adminQuestionsRoutes.put(
  '/one-liners/:id',
  describeRoute({
    tags: ['Admin'],
    summary: '更新一句話問題',
    description: '更新指定 ID 的一句話問題',
    responses: {
      200: { description: '問題已成功更新' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  validator('json', updateOneLinerSchema),
  async (c) => {
  const id = c.req.param('id');
  const { question, format_hint, placeholder, category, display_order, is_active, is_core } = c.req.valid('json');

  const now = new Date().toISOString();

  await c.env.DB.prepare(`
    UPDATE one_liner_questions
    SET question = COALESCE(?, question),
        format_hint = COALESCE(?, format_hint),
        placeholder = COALESCE(?, placeholder),
        category = COALESCE(?, category),
        display_order = COALESCE(?, display_order),
        is_active = COALESCE(?, is_active),
        is_core = COALESCE(?, is_core),
        updated_at = ?
    WHERE id = ?
  `).bind(question, format_hint, placeholder, category, display_order, is_active, is_core, now, id).run();

  return c.json({ success: true, message: '問題已更新' });
});

// DELETE /admin/questions/one-liners/:id - 刪除一句話問題
adminQuestionsRoutes.delete(
  '/one-liners/:id',
  describeRoute({
    tags: ['Admin'],
    summary: '刪除一句話問題',
    description: '刪除指定 ID 的一句話問題，核心問題無法刪除',
    responses: {
      200: { description: '問題已成功刪除' },
      400: { description: '核心問題無法刪除' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  async (c) => {
  const id = c.req.param('id');

  // Check if it's a core question
  const question = await c.env.DB.prepare(`
    SELECT is_core FROM one_liner_questions WHERE id = ?
  `).bind(id).first();

  if (question && (question as { is_core: number }).is_core === 1) {
    return c.json({
      success: false,
      error: '核心問題無法刪除，請先取消核心標記'
    }, 400);
  }

  await c.env.DB.prepare('DELETE FROM one_liner_questions WHERE id = ?').bind(id).run();

  return c.json({ success: true, message: '問題已刪除' });
});

// ═══════════════════════════════════════════
// 小故事問題管理
// ═══════════════════════════════════════════

// GET /admin/questions/stories - 取得所有小故事問題
adminQuestionsRoutes.get(
  '/stories',
  describeRoute({
    tags: ['Admin'],
    summary: '取得所有小故事問題',
    description: '取得所有小故事問題列表，可依分類篩選及是否包含停用的問題',
    responses: {
      200: { description: '成功取得小故事問題列表' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  async (c) => {
  const includeInactive = c.req.query('include_inactive') === 'true';
  const categoryId = c.req.query('category_id');

  let query = `
    SELECT sq.*, sc.name as category_name
    FROM story_questions sq
    LEFT JOIN story_categories sc ON sq.category_id = sc.id
  `;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (!includeInactive) {
    conditions.push('sq.is_active = 1');
  }
  if (categoryId) {
    conditions.push('sq.category_id = ?');
    params.push(categoryId);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY sq.category_id, sq.display_order ASC';

  const stmt = c.env.DB.prepare(query);
  const questions = params.length > 0
    ? await stmt.bind(...params).all()
    : await stmt.all();

  return c.json({ success: true, data: questions.results });
});

// POST /admin/questions/stories - 新增小故事問題
adminQuestionsRoutes.post(
  '/stories',
  describeRoute({
    tags: ['Admin'],
    summary: '新增小故事問題',
    description: '新增一個新的小故事問題',
    responses: {
      200: { description: '問題已成功新增' },
      400: { description: 'ID、分類和標題為必填' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  validator('json', createStoryQuestionSchema),
  async (c) => {
  const userId = c.get('userId');
  const { id, category_id, title, subtitle, placeholder, difficulty, display_order } = c.req.valid('json');

  const now = new Date().toISOString();

  await c.env.DB.prepare(`
    INSERT INTO story_questions
    (id, category_id, title, subtitle, placeholder, difficulty, display_order, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, category_id, title, subtitle || null, placeholder || null,
    difficulty || 'easy', display_order || 0, userId, now, now
  ).run();

  return c.json({ success: true, message: '問題已新增' });
});

// PUT /admin/questions/stories/:id - 更新小故事問題
adminQuestionsRoutes.put(
  '/stories/:id',
  describeRoute({
    tags: ['Admin'],
    summary: '更新小故事問題',
    description: '更新指定 ID 的小故事問題',
    responses: {
      200: { description: '問題已成功更新' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  validator('json', updateStoryQuestionSchema),
  async (c) => {
  const id = c.req.param('id');
  const { category_id, title, subtitle, placeholder, difficulty, display_order, is_active } = c.req.valid('json');

  const now = new Date().toISOString();

  await c.env.DB.prepare(`
    UPDATE story_questions
    SET category_id = COALESCE(?, category_id),
        title = COALESCE(?, title),
        subtitle = COALESCE(?, subtitle),
        placeholder = COALESCE(?, placeholder),
        difficulty = COALESCE(?, difficulty),
        display_order = COALESCE(?, display_order),
        is_active = COALESCE(?, is_active),
        updated_at = ?
    WHERE id = ?
  `).bind(category_id, title, subtitle, placeholder, difficulty, display_order, is_active, now, id).run();

  return c.json({ success: true, message: '問題已更新' });
});

// DELETE /admin/questions/stories/:id - 刪除小故事問題
adminQuestionsRoutes.delete(
  '/stories/:id',
  describeRoute({
    tags: ['Admin'],
    summary: '刪除小故事問題',
    description: '刪除指定 ID 的小故事問題',
    responses: {
      200: { description: '問題已成功刪除' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  async (c) => {
  const id = c.req.param('id');

  await c.env.DB.prepare('DELETE FROM story_questions WHERE id = ?').bind(id).run();

  return c.json({ success: true, message: '問題已刪除' });
});

// ═══════════════════════════════════════════
// 批次排序
// ═══════════════════════════════════════════

// PUT /admin/questions/one-liners/reorder - 批次更新一句話問題順序
adminQuestionsRoutes.put(
  '/one-liners/reorder',
  describeRoute({
    tags: ['Admin'],
    summary: '批次更新一句話問題順序',
    description: '批次更新多個一句話問題的顯示順序',
    responses: {
      200: { description: '順序已成功更新' },
      400: { description: 'items 必須是陣列' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  validator('json', reorderSchema),
  async (c) => {
  const { items } = c.req.valid('json'); // [{ id: 'xxx', display_order: 1 }, ...]

  const now = new Date().toISOString();

  for (const item of items) {
    await c.env.DB.prepare(`
      UPDATE one_liner_questions SET display_order = ?, updated_at = ? WHERE id = ?
    `).bind(item.display_order, now, item.id).run();
  }

  return c.json({ success: true, message: '順序已更新' });
});

// PUT /admin/questions/stories/reorder - 批次更新小故事問題順序
adminQuestionsRoutes.put(
  '/stories/reorder',
  describeRoute({
    tags: ['Admin'],
    summary: '批次更新小故事問題順序',
    description: '批次更新多個小故事問題的顯示順序',
    responses: {
      200: { description: '順序已成功更新' },
      400: { description: 'items 必須是陣列' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  validator('json', reorderSchema),
  async (c) => {
  const { items } = c.req.valid('json');

  const now = new Date().toISOString();

  for (const item of items) {
    await c.env.DB.prepare(`
      UPDATE story_questions SET display_order = ?, updated_at = ? WHERE id = ?
    `).bind(item.display_order, now, item.id).run();
  }

  return c.json({ success: true, message: '順序已更新' });
});

// ═══════════════════════════════════════════
// 統計
// ═══════════════════════════════════════════

// GET /admin/questions/stats - 問題統計
adminQuestionsRoutes.get(
  '/stats',
  describeRoute({
    tags: ['Admin'],
    summary: '取得問題統計資料',
    description: '取得一句話問題、小故事問題及分類的統計資料',
    responses: {
      200: { description: '成功取得統計資料' },
      401: { description: '未授權' },
      403: { description: '權限不足（需要管理員權限）' },
    },
  }),
  async (c) => {
  const [oneLinerStats, storyStats, categoryStats] = await Promise.all([
    c.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_core = 1 THEN 1 ELSE 0 END) as core
      FROM one_liner_questions
    `).first(),
    c.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
      FROM story_questions
    `).first(),
    c.env.DB.prepare(`
      SELECT
        sc.id, sc.name,
        COUNT(sq.id) as question_count
      FROM story_categories sc
      LEFT JOIN story_questions sq ON sc.id = sq.category_id AND sq.is_active = 1
      WHERE sc.is_active = 1
      GROUP BY sc.id
      ORDER BY sc.display_order
    `).all()
  ]);

  return c.json({
    success: true,
    data: {
      one_liners: oneLinerStats,
      stories: storyStats,
      categories: categoryStats.results
    }
  });
});
