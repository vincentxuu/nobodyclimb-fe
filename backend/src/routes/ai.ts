import { Hono } from 'hono';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';
import { Env } from '../types';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { optionalAuthMiddleware } from '../middleware/auth';
import { QueryService } from '../services/query';
import { IndexingService } from '../services/indexing';
import { EmbeddingService } from '../services/embedding';
import { getUserRank, initUserRank, resetDailyUsage } from '../services/rank';

const RANK_DISPLAY: Record<string, string> = { foothill: '麓', wall: '壁', ridge: '稜', summit: '巔' };

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
    description: '使用自然語言詢問攀岩相關問題，系統根據平台資料生成回答（需登入，受段位配額限制）',
    responses: {
      200: { description: '問答成功，回傳 AI 回答與來源及剩餘配額' },
      400: { description: '請求格式錯誤' },
      401: { description: '未登入' },
      429: { description: '今日配額已用盡' },
      500: { description: 'AI 服務錯誤' },
    },
  }),
  authMiddleware,
  validator('json', askSchema),
  async (c) => {
    const body = c.req.valid('json');
    const userId = c.get('userId') as string;
    const db = c.env.DB;
    const today = new Date().toISOString().slice(0, 10);

    // 初始化段位記錄（首次使用）
    await initUserRank(userId, db);

    // 取得段位記錄，並執行 lazy reset（若 last_reset_date 非今日）
    let rank = await getUserRank(userId, db);
    if (rank && rank.last_reset_date !== today) {
      await resetDailyUsage(db);
      rank = await getUserRank(userId, db);
    }

    // 原子扣除配額
    const result = await db
      .prepare('UPDATE user_ranks SET daily_ai_used = daily_ai_used + 1, updated_at = datetime(\'now\') WHERE user_id = ? AND daily_ai_used < daily_ai_limit')
      .bind(userId)
      .run();

    if (result.meta.changes === 0) {
      const resets_at = new Date();
      resets_at.setUTCHours(16, 0, 0, 0);
      if (resets_at <= new Date()) resets_at.setDate(resets_at.getDate() + 1);
      return c.json({
        success: false,
        error: 'quota_exceeded',
        message: '今日 AI 使用次數已用完，明日台灣時間 00:00 重置。充實攀岩日誌可提升段位獲得更多次數。',
        data: {
          tier: rank?.rank_id ?? 'foothill',
          tier_display: RANK_DISPLAY[rank?.rank_id ?? 'foothill'],
          daily_limit: rank?.daily_ai_limit ?? 2,
          daily_used: rank?.daily_ai_used ?? 0,
          resets_at: resets_at.toISOString(),
        },
      }, 429);
    }

    try {
      const queryService = new QueryService(c.env);
      const aiResult = await queryService.ask(body, userId);

      // 取得最新配額狀態
      const updatedRank = await getUserRank(userId, db);
      const quota = updatedRank ? {
        tier: updatedRank.rank_id,
        tier_display: RANK_DISPLAY[updatedRank.rank_id] ?? updatedRank.rank_id,
        daily_limit: updatedRank.daily_ai_limit,
        daily_used: updatedRank.daily_ai_used,
        remaining: Math.max(0, updatedRank.daily_ai_limit - updatedRank.daily_ai_used),
      } : null;

      return c.json({ success: true, data: { ...aiResult, quota } });
    } catch (error) {
      // AI 呼叫失敗時退回配額
      await db
        .prepare('UPDATE user_ranks SET daily_ai_used = MAX(0, daily_ai_used - 1) WHERE user_id = ?')
        .bind(userId)
        .run();
      console.error('AI ask error:', error);
      return c.json(
        { success: false, error: 'AIError', message: '抱歉，AI 服務暫時無法使用，請稍後再試。' },
        500
      );
    }
  }
);

// =============================================
// GET /quota/me - 查詢當前用戶配額
// =============================================

aiRoutes.get(
  '/quota/me',
  describeRoute({
    tags: ['AI'],
    summary: '查詢我的 AI 配額',
    description: '取得當前用戶的段位、積分與今日 AI 使用配額狀態',
    responses: {
      200: { description: '配額資訊' },
      401: { description: '未登入' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId') as string;
    const db = c.env.DB;
    const today = new Date().toISOString().slice(0, 10);

    await initUserRank(userId, db);
    let rank = await getUserRank(userId, db);

    if (rank && rank.last_reset_date !== today) {
      await resetDailyUsage(db);
      rank = await getUserRank(userId, db);
    }

    if (!rank) return c.json({ success: false, error: 'NotFound' }, 404);

    const resets_at = new Date();
    resets_at.setUTCHours(16, 0, 0, 0);
    if (resets_at <= new Date()) resets_at.setDate(resets_at.getDate() + 1);

    return c.json({
      success: true,
      data: {
        tier: rank.rank_id,
        tier_display: RANK_DISPLAY[rank.rank_id] ?? rank.rank_id,
        daily_limit: rank.daily_ai_limit,
        daily_used: rank.daily_ai_used,
        remaining: Math.max(0, rank.daily_ai_limit - rank.daily_ai_used),
        score: rank.score,
        resets_at: resets_at.toISOString(),
      },
    });
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
// Chat Session API
// =============================================

const createMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
  suggested_questions: z.array(z.string()).optional(),
  query_id: z.string().optional(),
});

// POST /sessions - 建立新 session
aiRoutes.post(
  '/sessions',
  describeRoute({
    tags: ['AI'],
    summary: '建立對話 session',
    description: '為已登入用戶建立新的聊天 session',
    responses: {
      200: { description: '建立成功' },
      401: { description: '需要登入' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId');
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    await c.env.DB.prepare(
      `INSERT INTO chat_sessions (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
    ).bind(id, userId, '新對話', now, now).run();

    return c.json({ success: true, data: { id, title: '新對話', created_at: now } });
  }
);

// GET /sessions - 取得我的 session 列表
aiRoutes.get(
  '/sessions',
  describeRoute({
    tags: ['AI'],
    summary: '取得聊天記錄列表',
    description: '回傳已登入用戶最近 20 個對話 session',
    responses: {
      200: { description: '查詢成功' },
      401: { description: '需要登入' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId');
    const { results } = await c.env.DB.prepare(
      `SELECT id, title, created_at, updated_at FROM chat_sessions
       WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20`
    ).bind(userId).all();

    return c.json({ success: true, data: results });
  }
);

// GET /sessions/:id/messages - 取得指定 session 的訊息
aiRoutes.get(
  '/sessions/:id/messages',
  describeRoute({
    tags: ['AI'],
    summary: '取得 session 訊息',
    responses: {
      200: { description: '查詢成功' },
      401: { description: '需要登入' },
      404: { description: 'Session 不存在或無權限' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId');
    const sessionId = c.req.param('id');

    // 驗證 session 歸屬
    const session = await c.env.DB.prepare(
      `SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?`
    ).bind(sessionId, userId).first();

    if (!session) {
      return c.json({ success: false, error: 'NotFound', message: 'Session 不存在' }, 404);
    }

    const { results } = await c.env.DB.prepare(
      `SELECT id, role, content, suggested_questions, query_id, created_at
       FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC`
    ).bind(sessionId).all();

    return c.json({ success: true, data: results });
  }
);

// DELETE /sessions/:id - 刪除 session
aiRoutes.delete(
  '/sessions/:id',
  describeRoute({
    tags: ['AI'],
    summary: '刪除對話 session',
    responses: {
      200: { description: '刪除成功' },
      401: { description: '需要登入' },
      404: { description: 'Session 不存在或無權限' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId');
    const sessionId = c.req.param('id');

    const result = await c.env.DB.prepare(
      `DELETE FROM chat_sessions WHERE id = ? AND user_id = ?`
    ).bind(sessionId, userId).run();

    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'NotFound', message: 'Session 不存在' }, 404);
    }

    return c.json({ success: true, message: 'Session 已刪除' });
  }
);

// POST /sessions/:id/messages - 儲存訊息
aiRoutes.post(
  '/sessions/:id/messages',
  describeRoute({
    tags: ['AI'],
    summary: '儲存訊息',
    responses: {
      200: { description: '儲存成功' },
      401: { description: '需要登入' },
      404: { description: 'Session 不存在或無權限' },
    },
  }),
  authMiddleware,
  validator('json', createMessageSchema),
  async (c) => {
    const userId = c.get('userId');
    const sessionId = c.req.param('id');
    const { role, content, suggested_questions, query_id } = c.req.valid('json');

    // 驗證 session 歸屬
    const session = await c.env.DB.prepare(
      `SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?`
    ).bind(sessionId, userId).first();

    if (!session) {
      return c.json({ success: false, error: 'NotFound', message: 'Session 不存在' }, 404);
    }

    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    await c.env.DB.prepare(
      `INSERT INTO chat_messages (id, session_id, role, content, suggested_questions, query_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, sessionId, role, content,
      suggested_questions ? JSON.stringify(suggested_questions) : null,
      query_id ?? null,
      now
    ).run();

    // 更新 session 的 updated_at 與 title（第一則 user 訊息作為標題）
    if (role === 'user') {
      const title = content.slice(0, 50);
      await c.env.DB.prepare(
        `UPDATE chat_sessions SET updated_at = ?, title = CASE WHEN title = '新對話' THEN ? ELSE title END WHERE id = ?`
      ).bind(now, title, sessionId).run();
    } else {
      await c.env.DB.prepare(
        `UPDATE chat_sessions SET updated_at = ? WHERE id = ?`
      ).bind(now, sessionId).run();
    }

    return c.json({ success: true, data: { id } });
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
