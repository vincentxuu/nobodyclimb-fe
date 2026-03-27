import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';
import { Env } from '../types';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { QueryService } from '../services/query';
import { TimeoutError } from '../utils/timeout';
import { checkAiRateLimit } from '../middleware/rateLimit';
import { IndexingService } from '../services/indexing';
import { EmbeddingService } from '../services/embedding';
import { getUserRank, initUserRank, resetDailyUsage, deductQuotaAndToken, getUserQuotaStatus, addTokenUsage } from '../services/rank';
import { checkInput, checkOutput, GuardrailError, type GuardrailsInputTrace } from '../utils/guardrails';
import { SYSTEM_PROMPT } from '../utils/ai-prompts';
import { RecommendationService } from '../services/recommendation';
import { getUserMemories, deleteMemory } from '../repositories/memory';

const RANK_DISPLAY: Record<string, string> = { foothill: '麓', wall: '壁', ridge: '稜', summit: '巔' };

export const aiRoutes = new Hono<{ Bindings: Env }>();

// =============================================
// Request Schemas
// =============================================

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const askSchema = z.object({
  query: z.string().min(2, '問題至少需要 2 個字元').max(500, '問題不能超過 500 個字元'),
  limit: z.number().int().min(1).max(20).optional().default(5),
  include_sources: z.boolean().optional().default(true),
  no_cache: z.boolean().optional().default(false),
  chat_history: z.array(chatMessageSchema).max(20).optional(),
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
    description: '使用自然語言詢問攀岩相關問題，系統根據平台資料生成回答（需登入，受等級配額限制）。加上 `?stream=true` 可啟用 SSE 串流回應（Content-Type: text/event-stream），逐詞推送 `{"type":"token","token":"..."}` 事件，結束時推送 `{"type":"done",...}` 事件。',
    responses: {
      200: { description: '問答成功，回傳 AI 回答與來源及剩餘配額（非串流）；或 SSE 串流（stream=true）' },
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
    const isAdmin = c.get('user')?.role === 'admin';
    const db = c.env.DB;

    // IP 速率限制（在配額扣除前，超限不扣配額）
    if (!isAdmin) {
      const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
      const rateCheck = await checkAiRateLimit(c.env.CACHE, ip, 20);
      if (!rateCheck.allowed) {
        c.header('Retry-After', String(rateCheck.retryAfter ?? 60));
        return c.json({
          success: false,
          error: 'rate_limited',
          message: `請求過於頻繁，請在 ${rateCheck.retryAfter} 秒後再試。`,
        }, 429);
      }
    }

    // Task 4.1: 輸入層防護（在配額扣除前執行，驗證失敗不扣配額）
    let guardrailsInputTrace: GuardrailsInputTrace | null = null;
    try {
      guardrailsInputTrace = await checkInput(body.query, db);
    } catch (err) {
      if (err instanceof GuardrailError) {
        // 記錄被攔截的請求（不計入配額，但需要知道攻擊來源）
        const guardErr = err as GuardrailError;
        const blockedTrace = JSON.stringify({
          guardrails_input: {
            passed: false,
            triggered_check: guardErr.reason,
            matched_pattern: guardErr.matchedPattern,
            query_length: body.query.length,
          },
        });
        c.executionCtx.waitUntil(
          db.prepare(
            `INSERT INTO ai_query_logs (id, user_id, query, response, sources, latency_ms, token_count, query_type, model_used, retrieval_score, self_reflection_triggered, is_high_consumption, cache_hit, hyde_triggered, pipeline_trace)
             VALUES (?, ?, ?, '', '[]', 0, 0, 'guardrails_blocked', '', 0, 0, 0, 0, 0, ?)`
          ).bind(crypto.randomUUID(), userId, body.query.slice(0, 500), blockedTrace).run().catch(() => {})
        );
        return c.json({ success: false, error: 'InvalidInput', message: guardErr.message }, 400);
      }
      throw err;
    }

    // Task 4.2: 預估 token 數（供原子扣除使用）
    // estimatedContextLength = 2000（保守估算：約 5 篇文件 × 400 字）
    const ESTIMATED_CONTEXT_LENGTH = 2000;
    const estimatedTokens = Math.ceil((SYSTEM_PROMPT.length + ESTIMATED_CONTEXT_LENGTH + body.query.length) / 2);

    // 組裝 extraTrace（guardrails_input 已通過，此處無論 admin 都記錄）
    const startTime = Date.now();
    const extraTrace: Record<string, unknown> = {
      guardrails_input: guardrailsInputTrace,
      startTime,
    };

    // 管理員不受配額限制
    if (!isAdmin) {
      const today = new Date().toISOString().slice(0, 10);

      // 初始化等級記錄（首次使用）
      await initUserRank(userId, db);

      // 取得等級記錄，並執行 lazy reset（若 last_reset_date 非今日）
      let rank = await getUserRank(userId, db);
      if (rank && rank.last_reset_date !== today) {
        await resetDailyUsage(db);
        rank = await getUserRank(userId, db);
      }

      // Task 4.2: 原子扣除次數與 token 配額（兩個條件同時成立才成功）
      const quotaChanges = await deductQuotaAndToken(userId, estimatedTokens, db);

      if (quotaChanges === 0) {
        // Task 4.3: 判斷是次數耗盡還是 token 耗盡
        const quotaStatus = await getUserQuotaStatus(userId, estimatedTokens, db);
        const resets_at = new Date();
        resets_at.setUTCHours(16, 0, 0, 0);
        if (resets_at <= new Date()) resets_at.setDate(resets_at.getDate() + 1);
        const baseData = {
          tier: rank?.rank_id ?? 'foothill',
          tier_display: RANK_DISPLAY[rank?.rank_id ?? 'foothill'],
          daily_limit: rank?.daily_ai_limit ?? 2,
          daily_used: rank?.daily_ai_used ?? 0,
          resets_at: resets_at.toISOString(),
        };
        if (quotaStatus.tokenExceeded) {
          return c.json({
            success: false,
            error: 'token_quota_exceeded',
            message: '今日 Token 配額已用盡，明日台灣時間 00:00 重置。充實攀岩日誌可提升等級獲得更多配額。',
            data: baseData,
          }, 429);
        }
        return c.json({
          success: false,
          error: 'quota_exceeded',
          message: '今日 AI 使用次數已用完，明日台灣時間 00:00 重置。充實攀岩日誌可提升等級獲得更多次數。',
          data: baseData,
        }, 429);
      }

      // 記錄配額資訊到 trace
      extraTrace.quota_check = {
        rank: rank?.rank_id ?? 'foothill',
        daily_ai_used: rank?.daily_ai_used ?? 0,
        daily_ai_limit: rank?.daily_ai_limit ?? 2,
        estimated_tokens: estimatedTokens,
        result: 'passed',
      };
    } else {
      extraTrace.quota_check = {
        rank: 'admin',
        daily_ai_used: 0,
        daily_ai_limit: -1,
        estimated_tokens: estimatedTokens,
        result: 'admin_bypass',
      };
    }

    const streamMode = c.req.query('stream') === 'true';

    // SSE 串流模式
    if (streamMode) {
      let streamCompleted = false;
      return streamSSE(c, async (stream) => {
        try {
          const queryService = new QueryService(c.env);
          const result = await queryService.askStream(body, userId, async (data) => {
            await stream.writeSSE({ data });
          }, c.executionCtx, extraTrace);

          // Task 4.4: 更新實際 token 消耗（修正預估與實際差額）
          if (!isAdmin) {
            const logRow = await db.prepare(`SELECT token_count FROM ai_query_logs WHERE id = ?`)
              .bind(result.query_id)
              .first<{ token_count: number | null }>();
            await addTokenUsage(userId, logRow?.token_count ?? estimatedTokens, estimatedTokens, db);
          }

          // 取得最新配額（供 done 事件）
          let quotaRemaining = -1;
          if (!isAdmin) {
            const updatedRank = await getUserRank(userId, db);
            if (updatedRank) {
              quotaRemaining = Math.max(0, updatedRank.daily_ai_limit - updatedRank.daily_ai_used);
            }
          }

          await stream.writeSSE({
            data: JSON.stringify({
              type: 'done',
              query_id: result.query_id,
              answer: result.answer,
              sources: result.sources,
              suggested_questions: result.suggested_questions,
              quota_remaining: quotaRemaining,
            }),
          });
          streamCompleted = true;
        } catch (error) {
          // Task 4.5: 串流失敗時退還次數與 token 預扣量
          if (!isAdmin && !streamCompleted) {
            await db
              .prepare(`UPDATE user_ranks SET daily_ai_used = MAX(0, daily_ai_used - 1), daily_token_used = MAX(0, daily_token_used - ?), updated_at = datetime('now') WHERE user_id = ?`)
              .bind(estimatedTokens, userId)
              .run();
          }
          console.error('AI ask stream error:', error);
          // askStream 已寫入 error 事件，此處確保串流結束
        }
      });
    }

    // 非串流模式
    try {
      const queryService = new QueryService(c.env);
      const aiResult = await queryService.ask(body, userId, c.executionCtx, undefined, extraTrace);

      // Task 4.4: 更新實際 token 消耗（修正預估與實際差額）
      if (!isAdmin) {
        const logRow = await db.prepare(`SELECT token_count FROM ai_query_logs WHERE id = ?`)
          .bind(aiResult.query_id)
          .first<{ token_count: number | null }>();
        await addTokenUsage(userId, logRow?.token_count ?? estimatedTokens, estimatedTokens, db);
      }

      // Task 4.6: 輸出層防護（路由層二次保護，query.ts 已做過一次）
      const { output: filteredAnswer } = checkOutput(aiResult.answer);

      // 管理員不回傳配額資訊；一般用戶取得最新狀態
      let quota = null;
      if (!isAdmin) {
        const updatedRank = await getUserRank(userId, db);
        quota = updatedRank ? {
          tier: updatedRank.rank_id,
          tier_display: RANK_DISPLAY[updatedRank.rank_id] ?? updatedRank.rank_id,
          daily_limit: updatedRank.daily_ai_limit,
          daily_used: updatedRank.daily_ai_used,
          remaining: Math.max(0, updatedRank.daily_ai_limit - updatedRank.daily_ai_used),
        } : null;
      }

      return c.json({ success: true, data: { ...aiResult, answer: filteredAnswer, quota } });
    } catch (error) {
      // 所有錯誤都退還配額（408 超時、503 熔斷、500 內部錯誤）
      if (!isAdmin) {
        await db
          .prepare(`UPDATE user_ranks SET daily_ai_used = MAX(0, daily_ai_used - 1), daily_token_used = MAX(0, daily_token_used - ?), updated_at = datetime('now') WHERE user_id = ?`)
          .bind(estimatedTokens, userId)
          .run();
      }
      console.error('AI ask error:', error);

      // 記錄超時/熔斷事件到 ai_query_logs（不計配額但需追蹤）
      const errorType = error instanceof TimeoutError ? 'pipeline_timeout'
        : (error as any)?.code === 'CIRCUIT_BREAKER_OPEN' ? 'circuit_breaker_rejected'
        : 'internal_error';
      const errorTrace: Record<string, unknown> = {
        error: errorType,
        error_message: error instanceof Error ? error.message : String(error),
        error_stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : undefined,
        ...(error instanceof TimeoutError ? { timeout_ms: error.timeoutMs } : {}),
        ...((error as any)?.circuitBreaker ?? {}),
        // 保留 guardrails_input trace
        ...(extraTrace?.guardrails_input ? { guardrails_input: extraTrace.guardrails_input } : {}),
      };
      c.executionCtx.waitUntil(
        db.prepare(
          `INSERT INTO ai_query_logs (id, user_id, query, response, sources, latency_ms, token_count, query_type, model_used, retrieval_score, self_reflection_triggered, is_high_consumption, cache_hit, hyde_triggered, pipeline_trace)
           VALUES (?, ?, ?, '', '[]', ?, 0, ?, '', 0, 0, 0, 0, 0, ?)`
        ).bind(
          crypto.randomUUID(), userId, body.query.slice(0, 500),
          Date.now() - (extraTrace?.startTime as number || Date.now()),
          errorType,
          JSON.stringify(errorTrace),
        ).run().catch(() => {})
      );

      // TimeoutError → 408
      if (error instanceof TimeoutError) {
        return c.json(
          { success: false, error: 'pipeline_timeout', message: '查詢處理超時，請稍後再試。' },
          408
        );
      }
      // Circuit Breaker → 503
      if ((error as any)?.code === 'CIRCUIT_BREAKER_OPEN') {
        return c.json(
          { success: false, error: 'service_unavailable', message: 'AI 服務暫時不可用，請稍後再試。' },
          503
        );
      }
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
    description: '取得當前用戶的等級、積分與今日 AI 使用配額狀態',
    responses: {
      200: { description: '配額資訊' },
      401: { description: '未登入' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId') as string;
    const isAdmin = c.get('user')?.role === 'admin';
    const db = c.env.DB;

    // 管理員不受配額限制，直接回傳無限制狀態
    if (isAdmin) {
      return c.json({
        success: true,
        data: {
          tier: 'admin',
          tier_display: '管理員',
          daily_limit: -1,
          daily_used: 0,
          remaining: -1,
          score: 0,
          resets_at: null,
          token_limit: -1,
          token_used: 0,
          token_remaining: -1,
        },
      });
    }

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
        token_limit: rank.daily_token_limit,
        token_used: rank.daily_token_used,
        token_remaining: Math.max(0, rank.daily_token_limit - rank.daily_token_used),
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

      // 低分 feedback 與評分差異自動標記
      const queryService = new QueryService(c.env);
      if (score <= 2) {
        await queryService.flagResponse(query_id, 'low_feedback');
      }

      // 評分差異：將 feedback_score (1-5) 正規化為 1-4，與 auto_score 比對
      const logRow = await c.env.DB.prepare(
        `SELECT auto_score FROM ai_query_logs WHERE id = ?`
      ).bind(query_id).first<{ auto_score: number | null }>();

      if (logRow?.auto_score !== null && logRow?.auto_score !== undefined) {
        const normalizedFeedback = score <= 2 ? 1 : score === 3 ? 2 : score === 4 ? 3 : 4;
        if (Math.abs(normalizedFeedback - logRow.auto_score) >= 2) {
          await queryService.flagResponse(query_id, 'score_discrepancy');
        }
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
      const result = await indexingService.reindexAll(type, offset, limit, c.executionCtx);
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
// POST /recommendations - 手動觸發 AI 路線推薦
// =============================================

aiRoutes.post(
  '/recommendations',
  describeRoute({
    tags: ['AI'],
    summary: '手動觸發 AI 路線推薦',
    description: '依用戶近期完攀紀錄生成個人化路線推薦，消耗一次 AI 配額',
    responses: {
      201: { description: '推薦生成成功' },
      401: { description: '未登入' },
      429: { description: '今日配額已用盡' },
      500: { description: 'AI 服務錯誤' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId') as string;
    const isAdmin = c.get('user')?.role === 'admin';
    const db = c.env.DB;

    if (!isAdmin) {
      const today = new Date().toISOString().slice(0, 10);
      await initUserRank(userId, db);

      let rank = await getUserRank(userId, db);
      if (rank && rank.last_reset_date !== today) {
        await resetDailyUsage(db);
        rank = await getUserRank(userId, db);
      }

      const result = await db
        .prepare('UPDATE user_ranks SET daily_ai_used = daily_ai_used + 1, updated_at = datetime(\'now\') WHERE user_id = ? AND daily_ai_used < daily_ai_limit')
        .bind(userId)
        .run();

      if (result.meta.changes === 0) {
        const resets_at = new Date();
        resets_at.setUTCHours(16, 0, 0, 0);
        if (resets_at <= new Date()) resets_at.setDate(resets_at.getDate() + 1);
        const rankInfo = await getUserRank(userId, db);
        return c.json({
          success: false,
          error: 'quota_exceeded',
          message: '今日 AI 使用次數已用完，明日台灣時間 00:00 重置。',
          data: {
            tier: rankInfo?.rank_id ?? 'foothill',
            tier_display: RANK_DISPLAY[rankInfo?.rank_id ?? 'foothill'],
            daily_limit: rankInfo?.daily_ai_limit ?? 2,
            daily_used: rankInfo?.daily_ai_used ?? 0,
            resets_at: resets_at.toISOString(),
          },
        }, 429);
      }
    }

    try {
      const recommendationService = new RecommendationService(c.env);
      await recommendationService.generate(userId, 'manual');

      // 取得剛插入的推薦
      const recommendation = await db
        .prepare(
          `SELECT * FROM user_recommendations
           WHERE user_id = ? AND triggered_by = 'manual' AND status = 'success'
           ORDER BY created_at DESC LIMIT 1`
        )
        .bind(userId)
        .first<{ id: string; triggered_by: string; status: string; recommendation: string; created_at: string }>();

      if (!recommendation) {
        throw new Error('Recommendation generation failed silently');
      }

      return c.json({
        success: true,
        data: {
          id: recommendation.id,
          triggered_by: recommendation.triggered_by,
          status: recommendation.status,
          recommendation: JSON.parse(recommendation.recommendation),
          created_at: recommendation.created_at,
        },
      }, 201);
    } catch (error) {
      if (!isAdmin) {
        await db
          .prepare('UPDATE user_ranks SET daily_ai_used = MAX(0, daily_ai_used - 1) WHERE user_id = ?')
          .bind(userId)
          .run();
      }
      console.error('AI recommendations error:', error);
      return c.json(
        { success: false, error: 'AIError', message: '推薦生成失敗，請稍後再試。' },
        500
      );
    }
  }
);

// =============================================
// GET /recommendations - 取得推薦歷史
// =============================================

aiRoutes.get(
  '/recommendations',
  describeRoute({
    tags: ['AI'],
    summary: '取得 AI 路線推薦歷史',
    description: '取得當前用戶的 AI 路線推薦歷史，按時間降序排列，支援分頁',
    responses: {
      200: { description: '推薦歷史列表' },
      401: { description: '未登入' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId') as string;
    const db = c.env.DB;

    const limitParam = parseInt(c.req.query('limit') ?? '10', 10);
    const offset = parseInt(c.req.query('offset') ?? '0', 10);
    const limit = Math.min(Math.max(1, limitParam), 50);

    const [rows, totalRow] = await Promise.all([
      db.prepare(
        `SELECT id, triggered_by, status, recommendation, created_at
         FROM user_recommendations
         WHERE user_id = ? AND status = 'success'
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
        .bind(userId, limit, offset)
        .all<{ id: string; triggered_by: string; status: string; recommendation: string; created_at: string }>(),
      db.prepare(
        `SELECT COUNT(*) as count FROM user_recommendations WHERE user_id = ? AND status = 'success'`
      )
        .bind(userId)
        .first<{ count: number }>(),
    ]);

    return c.json({
      success: true,
      data: (rows.results ?? []).map((r) => ({
        id: r.id,
        triggered_by: r.triggered_by,
        status: r.status,
        recommendation: JSON.parse(r.recommendation),
        created_at: r.created_at,
      })),
      total: totalRow?.count ?? 0,
    });
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

// =============================================
// Task 6.1: GET /memory - 取得用戶記憶清單
// =============================================

aiRoutes.get(
  '/memory',
  describeRoute({
    tags: ['AI'],
    summary: '取得用戶 AI 記憶',
    description: '取得目前已儲存的 AI 記憶清單，依更新時間倒序排列',
    responses: {
      200: { description: '成功' },
      401: { description: '未登入' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId') as string;
    const memories = await getUserMemories(userId, c.env.DB);
    return c.json({ success: true, data: memories });
  }
);

// =============================================
// Task 6.2: DELETE /memory/:id - 刪除記憶
// =============================================

aiRoutes.delete(
  '/memory/:id',
  describeRoute({
    tags: ['AI'],
    summary: '刪除 AI 記憶',
    description: '刪除指定的 AI 記憶，只能刪除屬於自己的記憶',
    responses: {
      204: { description: '刪除成功' },
      401: { description: '未登入' },
      404: { description: '記憶不存在或不屬於該用戶' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId') as string;
    const memoryId = c.req.param('id');
    const deleted = await deleteMemory(userId, memoryId, c.env.DB);
    if (!deleted) {
      return c.json({ success: false, error: 'NotFound', message: '記憶不存在或無權刪除' }, 404);
    }
    return new Response(null, { status: 204 });
  }
);
