import { Hono } from 'hono';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';
import { Env } from '../types';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { optionalAuthMiddleware } from '../middleware/auth';
import { QueryService } from '../services/query';
import { IndexingService } from '../services/indexing';
import { EmbeddingService } from '../services/embedding';

export const aiRoutes = new Hono<{ Bindings: Env }>();

// =============================================
// Request Schemas
// =============================================

const askSchema = z.object({
  query: z.string().min(2, '問題至少需要 2 個字元').max(500, '問題不能超過 500 個字元'),
  limit: z.number().int().min(1).max(20).optional().default(5),
  include_sources: z.boolean().optional().default(true),
});

const searchSchema = z.object({
  q: z.string().min(2, '搜尋關鍵字至少需要 2 個字元'),
  type: z.enum(['route', 'crag', 'video']).optional(),
  limit: z.string().optional(),
  region: z.string().optional(),
  grade_min: z.string().optional(),
  grade_max: z.string().optional(),
  route_type: z.string().optional(),
  crag_id: z.string().optional(),
});

const feedbackSchema = z.object({
  query_id: z.string().min(1, 'query_id 為必填'),
  score: z.number().int().min(1).max(5, '評分需在 1-5 之間'),
  text: z.string().max(500).optional(),
});

const indexSchema = z.object({
  type: z.enum(['route', 'crag', 'all']).default('all'),
  reindex: z.boolean().optional().default(false),
  offset: z.number().int().min(0).optional().default(0),
  limit: z.number().int().min(10).max(150).optional().default(100),
});

// =============================================
// POST /ask - RAG 問答
// =============================================

aiRoutes.post(
  '/ask',
  describeRoute({
    tags: ['AI'],
    summary: 'RAG 問答',
    description: '使用自然語言詢問攀岩相關問題，系統根據平台資料生成回答',
    responses: {
      200: { description: '問答成功，回傳 AI 回答與來源' },
      400: { description: '請求格式錯誤' },
      500: { description: 'AI 服務錯誤' },
    },
  }),
  optionalAuthMiddleware,
  validator('json', askSchema),
  async (c) => {
    const body = c.req.valid('json');
    const userId = c.get('userId');

    try {
      const queryService = new QueryService(c.env);
      const result = await queryService.ask(body, userId);
      return c.json({ success: true, data: result });
    } catch (error) {
      console.error('AI ask error:', error);
      return c.json(
        { success: false, error: 'AIError', message: '抱歉，AI 服務暫時無法使用，請稍後再試。' },
        500
      );
    }
  }
);

// =============================================
// GET /search - 語義搜尋
// =============================================

aiRoutes.get(
  '/search',
  describeRoute({
    tags: ['AI'],
    summary: '語義搜尋',
    description: '使用向量相似度搜尋路線、岩場、影片，不呼叫 LLM',
    responses: {
      200: { description: '搜尋成功' },
      400: { description: '請求格式錯誤' },
    },
  }),
  validator('query', searchSchema),
  async (c) => {
    const { q, type, limit: limitStr, region, grade_min, grade_max, route_type, crag_id } =
      c.req.valid('query');

    const limit = limitStr ? Math.min(parseInt(limitStr, 10) || 10, 50) : 10;

    try {
      const queryService = new QueryService(c.env);
      const result = await queryService.search({
        query: q,
        type,
        limit,
        filters: {
          region,
          grade_min: grade_min ? parseInt(grade_min, 10) : undefined,
          grade_max: grade_max ? parseInt(grade_max, 10) : undefined,
          route_type,
          crag_id,
        },
      });
      return c.json({ success: true, data: result });
    } catch (error) {
      console.error('AI search error:', error);
      return c.json(
        { success: false, error: 'AIError', message: '搜尋服務暫時無法使用，請稍後再試。' },
        500
      );
    }
  }
);

// =============================================
// POST /feedback - 使用者回饋
// =============================================

aiRoutes.post(
  '/feedback',
  describeRoute({
    tags: ['AI'],
    summary: '提交回饋',
    description: '對 AI 回答評分（1-5 分）',
    responses: {
      200: { description: '回饋提交成功' },
      400: { description: '請求格式錯誤或 query_id 不存在' },
    },
  }),
  validator('json', feedbackSchema),
  async (c) => {
    const { query_id, score, text } = c.req.valid('json');

    try {
      const result = await c.env.DB.prepare(
        `UPDATE ai_query_logs
         SET feedback_score = ?, feedback_text = ?
         WHERE id = ?`
      )
        .bind(score, text ?? null, query_id)
        .run();

      if (result.meta.changes === 0) {
        return c.json({ success: false, error: 'NotFound', message: '找不到指定的查詢記錄' }, 400);
      }

      return c.json({ success: true, message: '感謝您的回饋！' });
    } catch (error) {
      console.error('AI feedback error:', error);
      return c.json(
        { success: false, error: 'DatabaseError', message: '回饋提交失敗，請稍後再試。' },
        500
      );
    }
  }
);

// =============================================
// POST /index - 管理員索引（需 Admin 權限）
// =============================================

aiRoutes.post(
  '/index',
  describeRoute({
    tags: ['AI'],
    summary: '觸發資料索引',
    description: '管理員觸發路線/岩場資料重建索引',
    responses: {
      200: { description: '索引成功' },
      403: { description: '需要管理員權限' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  validator('json', indexSchema),
  async (c) => {
    const { type, offset, limit } = c.req.valid('json');

    try {
      const indexingService = new IndexingService(c.env);
      const result = await indexingService.reindexAll(type, offset, limit);
      return c.json({
        success: true,
        message: `索引完成：成功 ${result.indexed} 筆，失敗 ${result.failed} 筆`,
        data: result,
      });
    } catch (error) {
      console.error('AI index error:', error);
      return c.json(
        { success: false, error: 'IndexError', message: '索引操作失敗，請稍後再試。' },
        500
      );
    }
  }
);

// =============================================
// GET /health - 健康檢查
// =============================================

aiRoutes.get(
  '/health',
  describeRoute({
    tags: ['AI'],
    summary: 'AI 服務健康檢查',
    description: '驗證 Workers AI 與 Vectorize 服務可用性',
    responses: {
      200: { description: '服務健康' },
      500: { description: '服務異常' },
    },
  }),
  async (c) => {
    try {
      const embeddingService = new EmbeddingService(c.env);
      await embeddingService.embed('健康檢查');
      return c.json({ success: true, status: 'healthy', ai: true });
    } catch (error) {
      console.error('AI health check failed:', error);
      return c.json(
        {
          success: false,
          status: 'unhealthy',
          ai: false,
          error: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  }
);
