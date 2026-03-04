import { Hono } from 'hono';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';
import { Env } from '../types';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { EmbeddingService } from '../services/embedding';
import { getUserRankDetail, updateUserRank, recalculateAllRanks } from '../services/rank';

export const adminAiRoutes = new Hono<{ Bindings: Env }>();

// 所有路由需要管理員權限
adminAiRoutes.use('*', authMiddleware, adminMiddleware);

// =============================================
// GET /dashboard - KPI 數據
// =============================================

adminAiRoutes.get(
  '/dashboard',
  describeRoute({
    tags: ['Admin AI'],
    summary: 'AI 儀表板 KPI',
    description: '取得查詢數量、延遲、成功率及每週趨勢',
    responses: { 200: { description: 'KPI 資料' } },
  }),
  async (c) => {
    try {
      // 總查詢數
      const totalRow = await c.env.DB.prepare(
        `SELECT COUNT(*) as count FROM ai_query_logs`
      ).first<{ count: number }>();

      // 今日查詢數
      const todayRow = await c.env.DB.prepare(
        `SELECT COUNT(*) as count FROM ai_query_logs
         WHERE created_at >= datetime('now', '-1 day')`
      ).first<{ count: number }>();

      // 平均延遲
      const latencyRow = await c.env.DB.prepare(
        `SELECT AVG(latency_ms) as avg_latency FROM ai_query_logs
         WHERE created_at >= datetime('now', '-7 days') AND latency_ms IS NOT NULL`
      ).first<{ avg_latency: number | null }>();

      // 過去 7 天每日查詢量
      const weeklyRows = await c.env.DB.prepare(
        `SELECT date(created_at) as day, COUNT(*) as count
         FROM ai_query_logs
         WHERE created_at >= datetime('now', '-7 days')
         GROUP BY date(created_at)
         ORDER BY day ASC`
      ).all<{ day: string; count: number }>();

      // 熱門查詢（過去 7 天，前 10）
      const topQueriesRows = await c.env.DB.prepare(
        `SELECT query, COUNT(*) as count
         FROM ai_query_logs
         WHERE created_at >= datetime('now', '-7 days')
         GROUP BY query
         ORDER BY count DESC
         LIMIT 10`
      ).all<{ query: string; count: number }>();

      // 正向回饋率（score >= 4）
      const feedbackRow = await c.env.DB.prepare(
        `SELECT
           COUNT(CASE WHEN feedback_score >= 4 THEN 1 END) as positive,
           COUNT(feedback_score) as total
         FROM ai_query_logs`
      ).first<{ positive: number; total: number }>();

      // Token 用量
      const tokenRow = await c.env.DB.prepare(
        `SELECT
           SUM(token_count) as total_tokens,
           SUM(CASE WHEN created_at >= datetime('now', '-1 day') THEN token_count ELSE 0 END) as tokens_today
         FROM ai_query_logs WHERE token_count IS NOT NULL`
      ).first<{ total_tokens: number | null; tokens_today: number | null }>();

      // 過去 7 天每日 token 用量
      const weeklyTokenRows = await c.env.DB.prepare(
        `SELECT date(created_at) as day, SUM(token_count) as tokens
         FROM ai_query_logs
         WHERE created_at >= datetime('now', '-7 days') AND token_count IS NOT NULL
         GROUP BY date(created_at)
         ORDER BY day ASC`
      ).all<{ day: string; tokens: number }>();

      // 健康狀態
      let healthStatus = 'unknown';
      try {
        const embeddingService = new EmbeddingService(c.env);
        await embeddingService.embed('health check');
        healthStatus = 'healthy';
      } catch {
        healthStatus = 'unhealthy';
      }

      const successRate =
        feedbackRow && feedbackRow.total > 0
          ? feedbackRow.positive / feedbackRow.total
          : null;

      return c.json({
        success: true,
        data: {
          total_queries: totalRow?.count ?? 0,
          queries_today: todayRow?.count ?? 0,
          avg_latency_ms: latencyRow?.avg_latency ? Math.round(latencyRow.avg_latency) : null,
          success_rate: successRate,
          total_tokens: tokenRow?.total_tokens ?? 0,
          tokens_today: tokenRow?.tokens_today ?? 0,
          queries_weekly: weeklyRows.results,
          tokens_weekly: weeklyTokenRows.results,
          top_queries: topQueriesRows.results,
          health: { status: healthStatus },
        },
      });
    } catch (error) {
      console.error('Admin AI dashboard error:', error);
      return c.json({ success: false, error: 'DatabaseError', message: '取得 KPI 資料失敗' }, 500);
    }
  }
);

// =============================================
// GET /logs - 查詢日誌列表（分頁 + 篩選）
// =============================================

const logsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  feedback_min: z.string().optional(),
  feedback_max: z.string().optional(),
});

adminAiRoutes.get(
  '/logs',
  describeRoute({
    tags: ['Admin AI'],
    summary: '查詢日誌列表',
    responses: { 200: { description: '分頁日誌資料' } },
  }),
  validator('query', logsQuerySchema),
  async (c) => {
    const { page: pageStr, limit: limitStr, from, to, feedback_min, feedback_max } =
      c.req.valid('query');
    const page = Math.max(1, parseInt(pageStr ?? '1', 10));
    const limit = Math.min(100, parseInt(limitStr ?? '20', 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const bindings: (string | number)[] = [];

    if (from) { conditions.push('created_at >= ?'); bindings.push(from); }
    if (to) { conditions.push('created_at <= ?'); bindings.push(to); }
    if (feedback_min) { conditions.push('feedback_score >= ?'); bindings.push(parseInt(feedback_min, 10)); }
    if (feedback_max) { conditions.push('feedback_score <= ?'); bindings.push(parseInt(feedback_max, 10)); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
      const countRow = await c.env.DB.prepare(
        `SELECT COUNT(*) as count FROM ai_query_logs ${where}`
      ).bind(...bindings).first<{ count: number }>();

      const rows = await c.env.DB.prepare(
        `SELECT l.id, l.query, l.latency_ms, l.feedback_score, l.created_at,
                l.user_id, u.username, u.display_name
         FROM ai_query_logs l
         LEFT JOIN users u ON l.user_id = u.id
         ${where}
         ORDER BY l.created_at DESC
         LIMIT ? OFFSET ?`
      ).bind(...bindings, limit, offset).all();

      return c.json({
        success: true,
        data: {
          logs: rows.results,
          total: countRow?.count ?? 0,
          page,
          limit,
        },
      });
    } catch (error) {
      console.error('Admin AI logs error:', error);
      return c.json({ success: false, error: 'DatabaseError', message: '取得日誌失敗' }, 500);
    }
  }
);

// =============================================
// GET /logs/:id - 單一日誌詳情
// =============================================

adminAiRoutes.get(
  '/logs/:id',
  describeRoute({
    tags: ['Admin AI'],
    summary: '日誌詳情',
    responses: { 200: { description: '日誌詳細資料' }, 404: { description: '找不到日誌' } },
  }),
  async (c) => {
    const id = c.req.param('id');
    try {
      const log = await c.env.DB.prepare(
        `SELECT l.*, u.username, u.display_name
         FROM ai_query_logs l
         LEFT JOIN users u ON l.user_id = u.id
         WHERE l.id = ?`
      ).bind(id).first();

      if (!log) {
        return c.json({ success: false, error: 'NotFound', message: '找不到日誌' }, 404);
      }
      return c.json({ success: true, data: log });
    } catch (error) {
      console.error('Admin AI log detail error:', error);
      return c.json({ success: false, error: 'DatabaseError', message: '取得日誌失敗' }, 500);
    }
  }
);

// =============================================
// GET /knowledge - 資料來源索引狀態
// =============================================

adminAiRoutes.get(
  '/knowledge',
  describeRoute({
    tags: ['Admin AI'],
    summary: '知識庫索引狀態',
    responses: { 200: { description: '各資料來源索引狀態' } },
  }),
  async (c) => {
    try {
      const routeTotal = await c.env.DB.prepare(
        `SELECT COUNT(*) as count FROM routes`
      ).first<{ count: number }>();

      const routeIndexed = await c.env.DB.prepare(
        `SELECT COUNT(*) as count FROM ai_documents WHERE type = 'route'`
      ).first<{ count: number }>();

      const routeLastIndexed = await c.env.DB.prepare(
        `SELECT MAX(created_at) as last FROM ai_documents WHERE type = 'route'`
      ).first<{ last: string | null }>();

      const cragTotal = await c.env.DB.prepare(
        `SELECT COUNT(*) as count FROM crags`
      ).first<{ count: number }>();

      const cragIndexed = await c.env.DB.prepare(
        `SELECT COUNT(*) as count FROM ai_documents WHERE type = 'crag'`
      ).first<{ count: number }>();

      const cragLastIndexed = await c.env.DB.prepare(
        `SELECT MAX(created_at) as last FROM ai_documents WHERE type = 'crag'`
      ).first<{ last: string | null }>();

      return c.json({
        success: true,
        data: {
          sources: [
            {
              type: 'route',
              label: '攀岩路線',
              total: routeTotal?.count ?? 0,
              indexed: routeIndexed?.count ?? 0,
              last_indexed_at: routeLastIndexed?.last ?? null,
            },
            {
              type: 'crag',
              label: '岩場',
              total: cragTotal?.count ?? 0,
              indexed: cragIndexed?.count ?? 0,
              last_indexed_at: cragLastIndexed?.last ?? null,
            },
          ],
        },
      });
    } catch (error) {
      console.error('Admin AI knowledge error:', error);
      return c.json({ success: false, error: 'DatabaseError', message: '取得知識庫狀態失敗' }, 500);
    }
  }
);

// =============================================
// GET /prompts - Prompt 列表
// =============================================

adminAiRoutes.get(
  '/prompts',
  describeRoute({
    tags: ['Admin AI'],
    summary: 'Prompt 列表',
    responses: { 200: { description: 'Prompt 清單' } },
  }),
  async (c) => {
    try {
      const rows = await c.env.DB.prepare(
        `SELECT id, name, version, status, created_at, updated_at FROM ai_prompts ORDER BY name, version DESC`
      ).all();
      return c.json({ success: true, data: rows.results });
    } catch (error) {
      console.error('Admin AI prompts error:', error);
      return c.json({ success: false, error: 'DatabaseError', message: '取得 Prompt 失敗' }, 500);
    }
  }
);

// =============================================
// POST /prompts - 建立 Prompt
// =============================================

const createPromptSchema = z.object({
  name: z.string().min(1),
  content: z.string().min(1),
  variables: z.array(z.string()).optional().default([]),
  status: z.enum(['draft', 'active', 'archived']).optional().default('draft'),
});

adminAiRoutes.post(
  '/prompts',
  describeRoute({
    tags: ['Admin AI'],
    summary: '建立 Prompt',
    responses: { 201: { description: '建立成功' } },
  }),
  validator('json', createPromptSchema),
  async (c) => {
    const { name, content, variables, status } = c.req.valid('json');
    try {
      // 取得同名最新版本
      const latest = await c.env.DB.prepare(
        `SELECT MAX(version) as max_version FROM ai_prompts WHERE name = ?`
      ).bind(name).first<{ max_version: number | null }>();
      const version = (latest?.max_version ?? 0) + 1;

      const id = crypto.randomUUID();
      await c.env.DB.prepare(
        `INSERT INTO ai_prompts (id, name, version, content, variables, status) VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(id, name, version, content, JSON.stringify(variables), status).run();

      return c.json({ success: true, data: { id, name, version, status } }, 201);
    } catch (error) {
      console.error('Admin AI create prompt error:', error);
      return c.json({ success: false, error: 'DatabaseError', message: '建立 Prompt 失敗' }, 500);
    }
  }
);

// =============================================
// GET /prompts/:id - 取得單一 Prompt
// =============================================

adminAiRoutes.get(
  '/prompts/:id',
  describeRoute({
    tags: ['Admin AI'],
    summary: '取得 Prompt 詳情',
    responses: { 200: { description: 'Prompt 詳細資料' }, 404: { description: '找不到' } },
  }),
  async (c) => {
    const id = c.req.param('id');
    try {
      const prompt = await c.env.DB.prepare(
        `SELECT * FROM ai_prompts WHERE id = ?`
      ).bind(id).first();
      if (!prompt) return c.json({ success: false, error: 'NotFound', message: '找不到 Prompt' }, 404);
      return c.json({ success: true, data: prompt });
    } catch (error) {
      console.error('Admin AI get prompt error:', error);
      return c.json({ success: false, error: 'DatabaseError', message: '取得 Prompt 失敗' }, 500);
    }
  }
);

// =============================================
// PUT /prompts/:id - 更新 Prompt
// =============================================

const updatePromptSchema = z.object({
  content: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
});

adminAiRoutes.put(
  '/prompts/:id',
  describeRoute({
    tags: ['Admin AI'],
    summary: '更新 Prompt',
    responses: { 200: { description: '更新成功' }, 404: { description: '找不到' } },
  }),
  validator('json', updatePromptSchema),
  async (c) => {
    const id = c.req.param('id');
    const updates = c.req.valid('json');
    try {
      const fields: string[] = [];
      const vals: unknown[] = [];
      if (updates.content !== undefined) { fields.push('content = ?'); vals.push(updates.content); }
      if (updates.variables !== undefined) { fields.push('variables = ?'); vals.push(JSON.stringify(updates.variables)); }
      if (updates.status !== undefined) { fields.push('status = ?'); vals.push(updates.status); }

      if (fields.length === 0) {
        return c.json({ success: false, error: 'ValidationError', message: '沒有提供要更新的欄位' }, 400);
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      const result = await c.env.DB.prepare(
        `UPDATE ai_prompts SET ${fields.join(', ')} WHERE id = ?`
      ).bind(...vals, id).run();

      if (result.meta.changes === 0) {
        return c.json({ success: false, error: 'NotFound', message: '找不到 Prompt' }, 404);
      }
      return c.json({ success: true, message: '更新成功' });
    } catch (error) {
      console.error('Admin AI update prompt error:', error);
      return c.json({ success: false, error: 'DatabaseError', message: '更新 Prompt 失敗' }, 500);
    }
  }
);

// =============================================
// DELETE /prompts/:id - 刪除 Prompt
// =============================================

adminAiRoutes.delete(
  '/prompts/:id',
  describeRoute({
    tags: ['Admin AI'],
    summary: '刪除 Prompt',
    responses: { 200: { description: '刪除成功' }, 404: { description: '找不到' } },
  }),
  async (c) => {
    const id = c.req.param('id');
    try {
      const result = await c.env.DB.prepare(
        `DELETE FROM ai_prompts WHERE id = ?`
      ).bind(id).run();
      if (result.meta.changes === 0) {
        return c.json({ success: false, error: 'NotFound', message: '找不到 Prompt' }, 404);
      }
      return c.json({ success: true, message: '刪除成功' });
    } catch (error) {
      console.error('Admin AI delete prompt error:', error);
      return c.json({ success: false, error: 'DatabaseError', message: '刪除 Prompt 失敗' }, 500);
    }
  }
);

// =============================================
// GET /config - 取得設定
// =============================================

adminAiRoutes.get(
  '/config',
  describeRoute({
    tags: ['Admin AI'],
    summary: '取得 AI 設定',
    responses: { 200: { description: '所有設定鍵值' } },
  }),
  async (c) => {
    try {
      const rows = await c.env.DB.prepare(
        `SELECT key, value FROM ai_config ORDER BY key`
      ).all<{ key: string; value: string }>();

      // 轉為物件格式
      const config: Record<string, string> = {};
      for (const row of rows.results) {
        config[row.key] = row.value;
      }
      return c.json({ success: true, data: config });
    } catch (error) {
      console.error('Admin AI get config error:', error);
      return c.json({ success: false, error: 'DatabaseError', message: '取得設定失敗' }, 500);
    }
  }
);

// =============================================
// PUT /config - 更新設定（鍵值合併）
// =============================================

const updateConfigSchema = z.record(z.string(), z.string());

adminAiRoutes.put(
  '/config',
  describeRoute({
    tags: ['Admin AI'],
    summary: '更新 AI 設定',
    responses: { 200: { description: '更新成功' } },
  }),
  validator('json', updateConfigSchema),
  async (c) => {
    const updates = c.req.valid('json');
    try {
      const stmts = Object.entries(updates).map(([key, value]) =>
        c.env.DB.prepare(
          `INSERT INTO ai_config (key, value) VALUES (?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
        ).bind(key, value)
      );
      if (stmts.length > 0) await c.env.DB.batch(stmts);
      return c.json({ success: true, message: '設定已更新' });
    } catch (error) {
      console.error('Admin AI update config error:', error);
      return c.json({ success: false, error: 'DatabaseError', message: '更新設定失敗' }, 500);
    }
  }
);

// =============================================
// GET /users/:userId/rank - 查詢用戶等級詳情
// =============================================

adminAiRoutes.get(
  '/users/:userId/rank',
  describeRoute({
    tags: ['Admin AI'],
    summary: '查詢用戶等級詳情',
    description: '取得指定用戶的等級、積分與各模組積分明細',
    responses: {
      200: { description: '等級詳情' },
      404: { description: '用戶無等級記錄' },
    },
  }),
  async (c) => {
    const userId = c.req.param('userId');
    try {
      const detail = await getUserRankDetail(userId, c.env.DB);
      if (!detail) return c.json({ success: false, error: 'NotFound', message: '該用戶尚無等級記錄' }, 404);
      return c.json({ success: true, data: detail });
    } catch (error) {
      console.error('Admin get user rank error:', error);
      return c.json({ success: false, error: 'DatabaseError' }, 500);
    }
  }
);

// =============================================
// PUT /users/:userId/rank-override - 手動覆寫等級
// =============================================

const rankOverrideSchema = z.object({
  rank: z.enum(['foothill', 'wall', 'ridge', 'summit']).nullable(),
});

const RANK_LIMITS: Record<string, number> = { foothill: 2, wall: 6, ridge: 12, summit: 24 };

adminAiRoutes.put(
  '/users/:userId/rank-override',
  describeRoute({
    tags: ['Admin AI'],
    summary: '手動覆寫用戶等級',
    description: '管理員手動指定等級，設為 null 則恢復自動計算',
    responses: {
      200: { description: '覆寫成功' },
      400: { description: '無效等級' },
    },
  }),
  validator('json', rankOverrideSchema),
  async (c) => {
    const userId = c.req.param('userId');
    const { rank } = c.req.valid('json');
    try {
      if (rank === null) {
        await c.env.DB
          .prepare(`UPDATE user_ranks SET rank_override_id = NULL, updated_at = datetime('now') WHERE user_id = ?`)
          .bind(userId)
          .run();
        await updateUserRank(userId, c.env.DB);
      } else {
        const limit = RANK_LIMITS[rank];
        await c.env.DB
          .prepare(`UPDATE user_ranks SET rank_override_id = ?, rank_id = ?, daily_ai_limit = ?, updated_at = datetime('now') WHERE user_id = ?`)
          .bind(rank, rank, limit, userId)
          .run();
      }
      return c.json({ success: true, message: rank ? `已覆寫等級為「${rank}」` : '已清除覆寫，恢復自動計算' });
    } catch (error) {
      console.error('Admin rank override error:', error);
      return c.json({ success: false, error: 'DatabaseError' }, 500);
    }
  }
);

// =============================================
// POST /recalculate-ranks - 手動觸發積分重算
// =============================================

const recalculateSchema = z.object({
  user_id: z.string().min(1),
});

adminAiRoutes.post(
  '/recalculate-ranks',
  describeRoute({
    tags: ['Admin AI'],
    summary: '手動觸發等級積分重算',
    description: '傳入 user_id 重算單一用戶，傳入 "all" 重算所有用戶',
    responses: { 200: { description: '重算結果' } },
  }),
  validator('json', recalculateSchema),
  async (c) => {
    const { user_id } = c.req.valid('json');
    try {
      if (user_id === 'all') {
        c.executionCtx.waitUntil(recalculateAllRanks(c.env.DB));
        return c.json({ success: true, message: '已排程重算所有用戶等級' });
      }
      const updated = await updateUserRank(user_id, c.env.DB);
      return c.json({ success: true, data: updated });
    } catch (error) {
      console.error('Admin recalculate ranks error:', error);
      return c.json({ success: false, error: 'DatabaseError' }, 500);
    }
  }
);

// =============================================
// GET /quality-stats - 品質 KPI 統計（過去 7 天）
// =============================================

adminAiRoutes.get(
  '/quality-stats',
  describeRoute({
    tags: ['Admin AI'],
    summary: 'AI 品質統計',
    description: '取得過去 7 天每日平均 groundedness、auto_score、feedback_score 及整體彙總',
    responses: { 200: { description: '品質統計資料' } },
  }),
  async (c) => {
    try {
      const dailyRows = await c.env.DB.prepare(
        `SELECT
           date(created_at) as date,
           AVG(groundedness_score) as avg_groundedness,
           AVG(auto_score) as avg_auto_score,
           AVG(feedback_score) as avg_feedback
         FROM ai_query_logs
         WHERE created_at >= datetime('now', '-7 days')
         GROUP BY date(created_at)
         ORDER BY date ASC`
      ).all<{ date: string; avg_groundedness: number | null; avg_auto_score: number | null; avg_feedback: number | null }>();

      const overallRow = await c.env.DB.prepare(
        `SELECT
           AVG(groundedness_score) as avg_groundedness,
           AVG(auto_score) as avg_auto_score,
           AVG(feedback_score) as avg_feedback
         FROM ai_query_logs
         WHERE created_at >= datetime('now', '-7 days')`
      ).first<{ avg_groundedness: number | null; avg_auto_score: number | null; avg_feedback: number | null }>();

      return c.json({
        success: true,
        data: {
          daily: dailyRows.results,
          overall: overallRow ?? { avg_groundedness: null, avg_auto_score: null, avg_feedback: null },
        },
      });
    } catch (error) {
      console.error('Admin quality-stats error:', error);
      return c.json({ success: false, error: 'DatabaseError', message: '取得品質統計失敗' }, 500);
    }
  }
);

// =============================================
// GET /latency-stats - RAG 分段延遲分析（過去 24 小時）
// =============================================

adminAiRoutes.get(
  '/latency-stats',
  describeRoute({
    tags: ['Admin AI'],
    summary: 'RAG 延遲分析',
    description: '取得過去 24 小時 RAG 各階段 P50/P95 延遲（僅含非快取查詢）',
    responses: { 200: { description: '延遲統計資料' } },
  }),
  async (c) => {
    try {
      const countRow = await c.env.DB.prepare(
        `SELECT COUNT(*) as cnt FROM ai_query_logs
         WHERE created_at >= datetime('now', '-1 day') AND embedding_ms IS NOT NULL`
      ).first<{ cnt: number }>();

      const sampleCount = countRow?.cnt ?? 0;

      const getPercentile = async (col: string, pct: number): Promise<number | null> => {
        if (sampleCount === 0) return null;
        const offset = Math.max(0, Math.floor(sampleCount * pct) - 1);
        const row = await c.env.DB.prepare(
          `SELECT ${col} as val FROM ai_query_logs
           WHERE created_at >= datetime('now', '-1 day') AND ${col} IS NOT NULL
           ORDER BY ${col} ASC
           LIMIT 1 OFFSET ?`
        ).bind(offset).first<{ val: number | null }>();
        return row?.val ?? null;
      };

      const [
        embeddingP50, embeddingP95,
        retrievalP50, retrievalP95,
        generationP50, generationP95,
      ] = await Promise.all([
        getPercentile('embedding_ms', 0.5),
        getPercentile('embedding_ms', 0.95),
        getPercentile('retrieval_ms', 0.5),
        getPercentile('retrieval_ms', 0.95),
        getPercentile('generation_ms', 0.5),
        getPercentile('generation_ms', 0.95),
      ]);

      return c.json({
        success: true,
        data: {
          embedding_p50: embeddingP50,
          embedding_p95: embeddingP95,
          retrieval_p50: retrievalP50,
          retrieval_p95: retrievalP95,
          generation_p50: generationP50,
          generation_p95: generationP95,
          sample_count: sampleCount,
        },
      });
    } catch (error) {
      console.error('Admin latency-stats error:', error);
      return c.json({ success: false, error: 'DatabaseError', message: '取得延遲統計失敗' }, 500);
    }
  }
);

// =============================================
// GET /flagged - 待審核標記列表
// =============================================

const flaggedQuerySchema = z.object({
  reason: z.enum(['low_groundedness', 'low_feedback', 'score_discrepancy']).optional(),
});

adminAiRoutes.get(
  '/flagged',
  describeRoute({
    tags: ['Admin AI'],
    summary: '待審核標記列表',
    description: '取得 is_reviewed = false 的標記記錄，支援依 flag_reason 篩選',
    responses: { 200: { description: '標記列表' } },
  }),
  validator('query', flaggedQuerySchema),
  async (c) => {
    const { reason } = c.req.valid('query');
    try {
      const whereClause = reason
        ? `WHERE f.is_reviewed = 0 AND f.flag_reason = ?`
        : `WHERE f.is_reviewed = 0`;

      const stmt = reason
        ? c.env.DB.prepare(
            `SELECT f.id, f.query_log_id, f.flag_reason, f.created_at,
                    l.query, l.groundedness_score, l.auto_score, l.feedback_score
             FROM ai_flagged_responses f
             JOIN ai_query_logs l ON f.query_log_id = l.id
             ${whereClause}
             ORDER BY f.created_at DESC
             LIMIT 50`
          ).bind(reason)
        : c.env.DB.prepare(
            `SELECT f.id, f.query_log_id, f.flag_reason, f.created_at,
                    l.query, l.groundedness_score, l.auto_score, l.feedback_score
             FROM ai_flagged_responses f
             JOIN ai_query_logs l ON f.query_log_id = l.id
             ${whereClause}
             ORDER BY f.created_at DESC
             LIMIT 50`
          );

      const rows = await stmt.all<{
        id: string;
        query_log_id: string;
        flag_reason: string;
        created_at: string;
        query: string;
        groundedness_score: number | null;
        auto_score: number | null;
        feedback_score: number | null;
      }>();

      return c.json({ success: true, data: rows.results, total: rows.results.length });
    } catch (error) {
      console.error('Admin flagged list error:', error);
      return c.json({ success: false, error: 'DatabaseError', message: '取得標記列表失敗' }, 500);
    }
  }
);

// =============================================
// PATCH /flagged/:id - 標記為已審核
// =============================================

adminAiRoutes.patch(
  '/flagged/:id',
  describeRoute({
    tags: ['Admin AI'],
    summary: '標記為已審核',
    description: '將指定標記記錄的 is_reviewed 設為 true',
    responses: {
      200: { description: '標記成功' },
      404: { description: '找不到指定標記' },
    },
  }),
  async (c) => {
    const { id } = c.req.param();
    try {
      const result = await c.env.DB.prepare(
        `UPDATE ai_flagged_responses SET is_reviewed = 1 WHERE id = ?`
      )
        .bind(id)
        .run();

      if (result.meta.changes === 0) {
        return c.json({ success: false, error: 'NotFound', message: '找不到指定的標記記錄' }, 404);
      }

      return c.json({ success: true, message: '已標記為審核完成' });
    } catch (error) {
      console.error('Admin flagged patch error:', error);
      return c.json({ success: false, error: 'DatabaseError', message: '更新標記失敗' }, 500);
    }
  }
);
