import { Hono } from 'hono';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';
import type { Env } from '../types';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { CrawlService } from '../services/crawl-service';
import { parsePagination } from '../utils/id';

export const crawlRoutes = new Hono<{ Bindings: Env }>();

// ============================================
// 爬取來源管理（需要管理員權限）
// ============================================

/**
 * GET /api/v1/crawl/sources
 * 列出所有爬取來源
 */
crawlRoutes.get(
  '/sources',
  describeRoute({
    tags: ['Crawl'],
    summary: '列出所有爬取來源',
    description: '取得所有已設定的網頁爬取來源。需要管理員權限。',
    responses: {
      200: { description: '成功取得爬取來源列表' },
      401: { description: '未授權' },
      403: { description: '需要管理員權限' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  async (c) => {
    const { page, limit } = parsePagination(
      c.req.query('page'),
      c.req.query('limit')
    );
    const status = c.req.query('status');
    const service = new CrawlService(c.env);

    const { sources, total } = await service.listSources(status, page, limit);

    return c.json({
      success: true,
      data: sources,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  }
);

/**
 * GET /api/v1/crawl/sources/:id
 * 取得單一爬取來源詳情
 */
crawlRoutes.get(
  '/sources/:id',
  describeRoute({
    tags: ['Crawl'],
    summary: '取得爬取來源詳情',
    description: '取得指定爬取來源的詳細資訊。需要管理員權限。',
    responses: {
      200: { description: '成功取得爬取來源' },
      404: { description: '爬取來源不存在' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  async (c) => {
    const id = c.req.param('id');
    const service = new CrawlService(c.env);
    const source = await service.getSource(id);

    if (!source) {
      return c.json(
        { success: false, error: 'Not Found', message: '爬取來源不存在' },
        404
      );
    }

    return c.json({ success: true, data: source });
  }
);

// 建立爬取來源的 schema
const createSourceSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  description: z.string().max(500).optional(),
  crawl_config: z
    .object({
      maxPages: z.number().min(1).max(100).optional(),
      maxDepth: z.number().min(1).max(5).optional(),
      format: z.enum(['markdown', 'html', 'json']).optional(),
      waitTime: z.number().min(1000).max(30000).optional(),
      urlFilter: z.string().optional(),
    })
    .optional(),
  schedule: z.string().max(50).optional(),
});

/**
 * POST /api/v1/crawl/sources
 * 建立新的爬取來源
 */
crawlRoutes.post(
  '/sources',
  describeRoute({
    tags: ['Crawl'],
    summary: '建立爬取來源',
    description:
      '建立新的網頁爬取來源。可設定爬取 URL、深度、頁數等參數。需要管理員權限。',
    responses: {
      201: { description: '爬取來源建立成功' },
      400: { description: '請求參數錯誤' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  validator('json', createSourceSchema),
  async (c) => {
    const body = c.req.valid('json') as z.infer<typeof createSourceSchema>;
    const userId = c.get('userId') as string;
    const service = new CrawlService(c.env);

    const source = await service.createSource({
      name: body.name,
      url: body.url,
      description: body.description,
      crawl_config: body.crawl_config,
      schedule: body.schedule,
      created_by: userId,
    });

    return c.json({ success: true, data: source }, 201);
  }
);

// 更新爬取來源的 schema
const updateSourceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  description: z.string().max(500).optional(),
  crawl_config: z
    .object({
      maxPages: z.number().min(1).max(100).optional(),
      maxDepth: z.number().min(1).max(5).optional(),
      format: z.enum(['markdown', 'html', 'json']).optional(),
      waitTime: z.number().min(1000).max(30000).optional(),
      urlFilter: z.string().optional(),
    })
    .optional(),
  schedule: z.string().max(50).optional(),
  status: z.enum(['active', 'paused']).optional(),
});

/**
 * PUT /api/v1/crawl/sources/:id
 * 更新爬取來源
 */
crawlRoutes.put(
  '/sources/:id',
  describeRoute({
    tags: ['Crawl'],
    summary: '更新爬取來源',
    description: '更新指定爬取來源的設定。需要管理員權限。',
    responses: {
      200: { description: '更新成功' },
      404: { description: '爬取來源不存在' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  validator('json', updateSourceSchema),
  async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json') as z.infer<typeof updateSourceSchema>;
    const service = new CrawlService(c.env);

    const existing = await service.getSource(id);
    if (!existing) {
      return c.json(
        { success: false, error: 'Not Found', message: '爬取來源不存在' },
        404
      );
    }

    const updated = await service.updateSource(id, body);
    return c.json({ success: true, data: updated });
  }
);

/**
 * DELETE /api/v1/crawl/sources/:id
 * 刪除爬取來源（級聯刪除所有爬取頁面）
 */
crawlRoutes.delete(
  '/sources/:id',
  describeRoute({
    tags: ['Crawl'],
    summary: '刪除爬取來源',
    description:
      '刪除指定爬取來源及其所有已爬取的頁面。此操作不可復原。需要管理員權限。',
    responses: {
      200: { description: '刪除成功' },
      404: { description: '爬取來源不存在' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  async (c) => {
    const id = c.req.param('id');
    const service = new CrawlService(c.env);

    const existing = await service.getSource(id);
    if (!existing) {
      return c.json(
        { success: false, error: 'Not Found', message: '爬取來源不存在' },
        404
      );
    }

    await service.deleteSource(id);
    return c.json({ success: true, message: '已刪除爬取來源' });
  }
);

// ============================================
// 執行爬取
// ============================================

/**
 * POST /api/v1/crawl/sources/:id/execute
 * 手動觸發爬取
 */
crawlRoutes.post(
  '/sources/:id/execute',
  describeRoute({
    tags: ['Crawl'],
    summary: '執行爬取',
    description:
      '手動觸發指定爬取來源的爬取作業。使用 Cloudflare Browser Rendering /crawl API。需要管理員權限。',
    responses: {
      200: { description: '爬取完成' },
      404: { description: '爬取來源不存在' },
      500: { description: '爬取失敗' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  async (c) => {
    const id = c.req.param('id');
    const service = new CrawlService(c.env);

    const existing = await service.getSource(id);
    if (!existing) {
      return c.json(
        { success: false, error: 'Not Found', message: '爬取來源不存在' },
        404
      );
    }

    try {
      const result = await service.executeCrawl(id);
      return c.json({ success: true, data: result });
    } catch (err) {
      return c.json(
        {
          success: false,
          error: 'Crawl Failed',
          message:
            err instanceof Error ? err.message : '爬取過程發生錯誤',
        },
        500
      );
    }
  }
);

// ============================================
// RAG 向量化
// ============================================

/**
 * POST /api/v1/crawl/sources/:id/vectorize
 * 將爬取內容向量化（寫入 Vectorize）
 */
crawlRoutes.post(
  '/sources/:id/vectorize',
  describeRoute({
    tags: ['Crawl'],
    summary: '向量化爬取內容',
    description:
      '將爬取來源的所有頁面內容向量化，寫入 Vectorize 索引，供 AI 語意搜尋使用。需要管理員權限。',
    responses: {
      200: { description: '向量化完成' },
      404: { description: '爬取來源不存在' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  async (c) => {
    const id = c.req.param('id');
    const service = new CrawlService(c.env);

    const existing = await service.getSource(id);
    if (!existing) {
      return c.json(
        { success: false, error: 'Not Found', message: '爬取來源不存在' },
        404
      );
    }

    try {
      const result = await service.vectorizePages(id);
      return c.json({ success: true, data: result });
    } catch (err) {
      return c.json(
        {
          success: false,
          error: 'Vectorize Failed',
          message:
            err instanceof Error ? err.message : '向量化過程發生錯誤',
        },
        500
      );
    }
  }
);

// ============================================
// 爬取頁面查詢
// ============================================

/**
 * GET /api/v1/crawl/sources/:id/pages
 * 列出指定來源的爬取頁面
 */
crawlRoutes.get(
  '/sources/:id/pages',
  describeRoute({
    tags: ['Crawl'],
    summary: '列出爬取頁面',
    description: '取得指定爬取來源的所有已爬取頁面。需要管理員權限。',
    responses: {
      200: { description: '成功取得頁面列表' },
      404: { description: '爬取來源不存在' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  async (c) => {
    const id = c.req.param('id');
    const { page, limit } = parsePagination(
      c.req.query('page'),
      c.req.query('limit')
    );
    const service = new CrawlService(c.env);

    const existing = await service.getSource(id);
    if (!existing) {
      return c.json(
        { success: false, error: 'Not Found', message: '爬取來源不存在' },
        404
      );
    }

    const { pages, total } = await service.getPages(id, page, limit);

    return c.json({
      success: true,
      data: pages,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  }
);

/**
 * GET /api/v1/crawl/pages/:id
 * 取得單一爬取頁面內容
 */
crawlRoutes.get(
  '/pages/:id',
  describeRoute({
    tags: ['Crawl'],
    summary: '取得爬取頁面內容',
    description: '取得指定爬取頁面的完整內容。需要管理員權限。',
    responses: {
      200: { description: '成功取得頁面' },
      404: { description: '頁面不存在' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  async (c) => {
    const id = c.req.param('id');
    const service = new CrawlService(c.env);
    const page = await service.getPage(id);

    if (!page) {
      return c.json(
        { success: false, error: 'Not Found', message: '頁面不存在' },
        404
      );
    }

    return c.json({ success: true, data: page });
  }
);

// ============================================
// 搜尋
// ============================================

const searchSchema = z.object({
  q: z.string().min(1).max(200),
  source_id: z.string().optional(),
  limit: z.string().optional(),
});

/**
 * GET /api/v1/crawl/search
 * 全文搜尋爬取頁面
 */
crawlRoutes.get(
  '/search',
  describeRoute({
    tags: ['Crawl'],
    summary: '搜尋爬取內容',
    description: '在爬取的頁面中進行全文搜尋。需要管理員權限。',
    responses: {
      200: { description: '搜尋結果' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  async (c) => {
    const q = c.req.query('q');
    if (!q) {
      return c.json(
        { success: false, error: 'Bad Request', message: '請提供搜尋關鍵字' },
        400
      );
    }

    const sourceId = c.req.query('source_id');
    const limit = parseInt(c.req.query('limit') || '20', 10);
    const service = new CrawlService(c.env);

    const pages = await service.searchPages(q, sourceId, limit);
    return c.json({ success: true, data: pages });
  }
);

/**
 * GET /api/v1/crawl/semantic-search
 * 語意搜尋爬取內容（RAG）
 */
crawlRoutes.get(
  '/semantic-search',
  describeRoute({
    tags: ['Crawl'],
    summary: '語意搜尋爬取內容',
    description:
      '使用 AI 向量搜尋在爬取的頁面中進行語意搜尋。需要已向量化的爬取內容。需要管理員權限。',
    responses: {
      200: { description: '語意搜尋結果' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  async (c) => {
    const q = c.req.query('q');
    if (!q) {
      return c.json(
        { success: false, error: 'Bad Request', message: '請提供搜尋內容' },
        400
      );
    }

    const sourceId = c.req.query('source_id');
    const topK = parseInt(c.req.query('top_k') || '5', 10);
    const service = new CrawlService(c.env);

    try {
      const results = await service.semanticSearch(q, topK, sourceId);
      return c.json({ success: true, data: results });
    } catch (err) {
      return c.json(
        {
          success: false,
          error: 'Search Failed',
          message:
            err instanceof Error ? err.message : '搜尋過程發生錯誤',
        },
        500
      );
    }
  }
);
