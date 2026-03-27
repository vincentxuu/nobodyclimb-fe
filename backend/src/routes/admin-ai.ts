import { Hono } from 'hono';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';
import { Env } from '../types';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { EmbeddingService } from '../services/embedding';
import { STEP_REGISTRY, getDefaultStepConfigs } from '../services/pipeline/registry';
import { PipelineEngine } from '../services/pipeline/engine';
import type { PipelineStepConfig, BranchConfig } from '../services/pipeline/types';
import { getUserRankDetail, updateUserRank, recalculateAllRanks } from '../services/rank';
import {
  DEFAULT_PROMPT_INJECTION_KEYWORDS,
  DEFAULT_JAILBREAK_PATTERNS,
  DEFAULT_SYSTEM_PROMPT_LEAKAGE_PATTERNS,
} from '../utils/guardrails';
import {
  SYSTEM_PROMPT,
  TOOL_SELECTION_PROMPT,
  GENERAL_KNOWLEDGE_SYSTEM_PROMPT,
  HYDE_PROMPT,
  JUDGE_PROMPT,
  CONTEXTUAL_CHUNK_PROMPT,
  MULTI_QUERY_EXPANSION_PROMPT,
  AGENTIC_DECISION_PROMPT,
  QUERY_TEMPLATE,
} from '../utils/ai-prompts';

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
// GET /stats - Token 用量聚合（費用估算用）
// =============================================

const statsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

adminAiRoutes.get(
  '/stats',
  describeRoute({
    tags: ['Admin AI'],
    summary: 'Token 用量聚合統計',
    description: '依時間區間統計查詢數、Token 總量、快取命中率與類型分布，供費用估算使用',
    responses: { 200: { description: '統計資料' } },
  }),
  validator('query', statsQuerySchema),
  async (c) => {
    const { from, to } = c.req.valid('query');

    const conditions: string[] = [];
    const bindings: string[] = [];

    if (from) { conditions.push('created_at >= ?'); bindings.push(from); }
    if (to)   { conditions.push('created_at <= ?'); bindings.push(to + 'T23:59:59'); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
      const [summary, byType] = await Promise.all([
        c.env.DB.prepare(
          `SELECT
             COUNT(*) as total_queries,
             COALESCE(SUM(token_count), 0) as total_tokens,
             SUM(CASE WHEN cache_hit = 1 THEN 1 ELSE 0 END) as cache_hits,
             CAST(COALESCE(AVG(CASE WHEN token_count IS NOT NULL THEN token_count END), 0) AS INTEGER) as avg_tokens,
             COALESCE(SUM(
               CAST(COALESCE(json_extract(pipeline_trace, '$.token_breakdown.main_generation.prompt_tokens'), 0) AS INTEGER)
               + CAST(COALESCE(json_extract(pipeline_trace, '$.token_breakdown.tool_selection.prompt_tokens'), 0) AS INTEGER)
               + CAST(COALESCE(json_extract(pipeline_trace, '$.token_breakdown.text_to_sql.prompt_tokens'), 0) AS INTEGER)
               + CAST(COALESCE(json_extract(pipeline_trace, '$.token_breakdown.hyde.prompt_tokens'), 0) AS INTEGER)
               + CAST(COALESCE(json_extract(pipeline_trace, '$.token_breakdown.multi_query.prompt_tokens'), 0) AS INTEGER)
               + CAST(COALESCE(json_extract(pipeline_trace, '$.token_breakdown.self_reflection_regen.prompt_tokens'), 0) AS INTEGER)
               + CAST(COALESCE(json_extract(pipeline_trace, '$.token_breakdown.judge.prompt_tokens'), 0) AS INTEGER)
               + CAST(COALESCE(json_extract(pipeline_trace, '$.token_breakdown.judge_2nd.prompt_tokens'), 0) AS INTEGER)
             ), 0) as total_prompt_tokens,
             COALESCE(SUM(
               CAST(COALESCE(json_extract(pipeline_trace, '$.token_breakdown.main_generation.completion_tokens'), 0) AS INTEGER)
               + CAST(COALESCE(json_extract(pipeline_trace, '$.token_breakdown.tool_selection.completion_tokens'), 0) AS INTEGER)
               + CAST(COALESCE(json_extract(pipeline_trace, '$.token_breakdown.text_to_sql.completion_tokens'), 0) AS INTEGER)
               + CAST(COALESCE(json_extract(pipeline_trace, '$.token_breakdown.hyde.completion_tokens'), 0) AS INTEGER)
               + CAST(COALESCE(json_extract(pipeline_trace, '$.token_breakdown.multi_query.completion_tokens'), 0) AS INTEGER)
               + CAST(COALESCE(json_extract(pipeline_trace, '$.token_breakdown.self_reflection_regen.completion_tokens'), 0) AS INTEGER)
               + CAST(COALESCE(json_extract(pipeline_trace, '$.token_breakdown.judge.completion_tokens'), 0) AS INTEGER)
               + CAST(COALESCE(json_extract(pipeline_trace, '$.token_breakdown.judge_2nd.completion_tokens'), 0) AS INTEGER)
             ), 0) as total_completion_tokens,
             COUNT(CASE WHEN pipeline_trace IS NOT NULL THEN 1 END) as trace_count
           FROM ai_query_logs ${where}`
        ).bind(...bindings).first<{
          total_queries: number;
          total_tokens: number;
          cache_hits: number;
          avg_tokens: number;
          total_prompt_tokens: number;
          total_completion_tokens: number;
          trace_count: number;
        }>(),
        c.env.DB.prepare(
          `SELECT query_type, COUNT(*) as count
           FROM ai_query_logs ${where}
           GROUP BY query_type`
        ).bind(...bindings).all<{ query_type: string | null; count: number }>(),
      ]);

      const byTypeMap: Record<string, number> = {};
      for (const row of byType.results) {
        byTypeMap[row.query_type ?? 'unknown'] = row.count;
      }

      return c.json({
        success: true,
        data: {
          total_queries: summary?.total_queries ?? 0,
          total_tokens: summary?.total_tokens ?? 0,
          cache_hits: summary?.cache_hits ?? 0,
          avg_tokens: summary?.avg_tokens ?? 0,
          total_prompt_tokens: summary?.total_prompt_tokens ?? 0,
          total_completion_tokens: summary?.total_completion_tokens ?? 0,
          trace_count: summary?.trace_count ?? 0,
          by_type: {
            simple: byTypeMap['simple'] ?? 0,
            complex: byTypeMap['complex'] ?? 0,
            general: byTypeMap['general-knowledge'] ?? 0,
            blocked: byTypeMap['guardrails_blocked'] ?? 0,
          },
        },
      });
    } catch (error) {
      console.error('Admin AI stats error:', error);
      return c.json({ success: false, error: 'DatabaseError', message: '取得統計資料失敗' }, 500);
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
  query_type: z.string().optional(),
  search: z.string().optional(),
  user_id: z.string().optional(),
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
    const { page: pageStr, limit: limitStr, from, to, feedback_min, feedback_max, query_type, search, user_id } =
      c.req.valid('query');
    const page = Math.max(1, parseInt(pageStr ?? '1', 10));
    const limit = Math.min(100, parseInt(limitStr ?? '20', 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const bindings: (string | number)[] = [];

    if (from) { conditions.push('l.created_at >= ?'); bindings.push(from); }
    if (to) { conditions.push('l.created_at <= ?'); bindings.push(to + 'T23:59:59'); }
    if (feedback_min) { conditions.push('l.feedback_score >= ?'); bindings.push(parseInt(feedback_min, 10)); }
    if (feedback_max) { conditions.push('l.feedback_score <= ?'); bindings.push(parseInt(feedback_max, 10)); }
    if (query_type) { conditions.push('l.query_type = ?'); bindings.push(query_type); }
    if (search) { conditions.push('l.query LIKE ?'); bindings.push(`%${search}%`); }
    if (user_id) { conditions.push('l.user_id = ?'); bindings.push(user_id); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
      const countRow = await c.env.DB.prepare(
        `SELECT COUNT(*) as count FROM ai_query_logs l ${where}`
      ).bind(...bindings).first<{ count: number }>();

      const rows = await c.env.DB.prepare(
        `SELECT l.id, l.query, l.latency_ms, l.feedback_score, l.created_at,
                l.user_id, u.username, u.display_name,
                l.query_type, l.model_used, l.retrieval_score, l.self_reflection_triggered,
                l.groundedness_score, l.auto_score,
                l.embedding_ms, l.retrieval_ms, l.generation_ms,
                l.token_count, l.is_high_consumption,
                l.cache_hit, l.hyde_triggered
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
    summary: '日誌詳情（含完整 RAG 流程）',
    responses: { 200: { description: '日誌詳細資料與各階段流程' }, 404: { description: '找不到日誌' } },
  }),
  async (c) => {
    const id = c.req.param('id');
    try {
      const [log, flagRows] = await Promise.all([
        c.env.DB.prepare(
          `SELECT l.*, u.username, u.display_name
           FROM ai_query_logs l
           LEFT JOIN users u ON l.user_id = u.id
           WHERE l.id = ?`
        ).bind(id).first<Record<string, unknown>>(),
        c.env.DB.prepare(
          `SELECT flag_reason, is_reviewed, created_at FROM ai_flagged_responses WHERE query_log_id = ?`
        ).bind(id).all<{ flag_reason: string; is_reviewed: number; created_at: string }>(),
      ]);

      if (!log) {
        return c.json({ success: false, error: 'NotFound', message: '找不到日誌' }, 404);
      }

      // 解析 sources JSON
      let sources: unknown[] = [];
      try { sources = JSON.parse((log.sources as string) ?? '[]'); } catch { /* ignore */ }

      // 解析 pipeline_trace JSON
      let pipelineTrace: unknown = null;
      try { pipelineTrace = JSON.parse((log.pipeline_trace as string) ?? 'null'); } catch { /* ignore */ }

      // 組合各階段流程資訊
      const isCacheHit = Boolean(log.cache_hit);
      const pt = pipelineTrace as Record<string, unknown> | null;
      const pipeline = {
        guardrails_input: {
          service: 'utils/guardrails.ts',
          description: '輸入層防護：偵測 prompt injection、jailbreak、封鎖詞',
          skipped: isCacheHit,
          ...((pt?.guardrails_input as Record<string, unknown> | undefined) ?? {}),
        },
        cache: {
          service: 'Cloudflare KV',
          description: '查詢快取（TTL 1 小時，含個人化 hash）',
          hit: isCacheHit,
        },
        quota_check: {
          service: 'services/rank.ts',
          description: '使用者等級配額驗證與原子扣除',
          skipped: isCacheHit,
          ...((pt?.quota_check as Record<string, unknown> | undefined) ?? {}),
        },
        query_parsing: {
          service: 'services/query.ts#parseQueryWithLLM',
          description: 'LLM A：Tool Calling 解析查詢意圖（search_routes / search_crags / general_knowledge）',
          query_type: (log.query_type as string) ?? null,
          skipped: isCacheHit,
        },
        text_to_sql: {
          service: 'services/pipeline/steps/text-to-sql.ts',
          description: 'Text-to-SQL：對 SQL / Hybrid / 澄清問題撈取候選集',
          path: (pt?.text_to_sql as Record<string, unknown> | undefined)?.path as string ?? null,
          candidate_count: typeof (pt?.text_to_sql as Record<string, unknown> | undefined)?.candidate_count === 'number'
            ? (pt?.text_to_sql as Record<string, unknown> | undefined)?.candidate_count
            : null,
          skipped: isCacheHit || !['sql', 'hybrid', 'clarification-needed'].includes((log.query_type as string) ?? ''),
          ...((pt?.text_to_sql as Record<string, unknown> | undefined) ?? {}),
        },
        hyde: {
          service: 'services/query.ts#generateHyDE',
          description: 'LLM B：HyDE 生成假設性文件以提升語義搜尋（僅 complex 查詢）',
          triggered: Boolean(log.hyde_triggered),
          skipped: isCacheHit || log.query_type === 'general-knowledge',
        },
        filter: {
          service: 'services/query.ts',
          description: '建構 Vectorize metadata filter（area_id / crag_id / grade / route_type）',
          skipped: isCacheHit || log.query_type === 'general-knowledge',
          ...((pt?.filter as Record<string, unknown> | undefined) ?? {}),
        },
        embedding: {
          service: 'services/embedding.ts (Workers AI bge-m3)',
          description: '將 query（和 hydeDoc）轉為向量',
          duration_ms: (log.embedding_ms as number) ?? null,
          skipped: isCacheHit || log.query_type === 'general-knowledge',
        },
        retrieval: {
          service: 'Vectorize + D1',
          description: '雙路向量搜尋 → RRF 合併 → Cross-encoder Reranking → MMR → 熱門度加權',
          duration_ms: (log.retrieval_ms as number) ?? null,
          top_score: (log.retrieval_score as number) ?? null,
          doc_count: sources.length,
          skipped: isCacheHit || log.query_type === 'general-knowledge',
        },
        generation: {
          service: 'Workers AI (LLM C)',
          description: '主要回答生成，加入對話歷史與個人化 system prompt',
          model: (log.model_used as string) ?? null,
          duration_ms: (log.generation_ms as number) ?? null,
          token_count: (log.token_count as number) ?? null,
          is_high_consumption: Boolean(log.is_high_consumption),
          skipped: isCacheHit,
        },
        self_reflection: {
          service: 'Workers AI (LLM C)',
          description: 'Self-reflection：僅 complex 查詢，品質不足時重新生成（最多 1 次）',
          triggered: Boolean(log.self_reflection_triggered),
          skipped: isCacheHit || log.query_type !== 'complex',
        },
        judge: {
          service: 'services/query.ts#runJudge (llama-3.1-8b)',
          description: 'LLM Judge：評估 groundedness（0-1）與品質分數（1-4）',
          groundedness_score: (log.groundedness_score as number) ?? null,
          auto_score: (log.auto_score as number) ?? null,
          skipped: isCacheHit || log.query_type === 'general-knowledge',
          ...((pt?.judge_detail as Record<string, unknown> | undefined) ?? {}),
        },
        guardrails_output: {
          service: 'utils/guardrails.ts',
          description: '輸出層防護：過濾 system prompt leakage、PII，截斷過長回應',
          skipped: isCacheHit,
          ...((pt?.guardrails_output as Record<string, unknown> | undefined) ?? {}),
        },
        memory_extraction: {
          service: 'services/memory-extractor.ts',
          description: '非同步記憶提取（僅已登入用戶，waitUntil）',
          skipped: isCacheHit || !log.user_id,
          ...((pt?.memory_extraction as Record<string, unknown> | undefined) ?? {}),
        },
      };

      const flags = flagRows.results ?? [];

      return c.json({
        success: true,
        data: {
          id: log.id,
          query: log.query,
          response: log.response,
          created_at: log.created_at,
          user: log.user_id ? {
            id: log.user_id,
            username: log.username,
            display_name: log.display_name,
          } : null,
          pipeline,
          pipeline_trace: pipelineTrace,
          quality: {
            groundedness_score: (log.groundedness_score as number) ?? null,
            auto_score: (log.auto_score as number) ?? null,
            feedback_score: (log.feedback_score as number) ?? null,
            feedback_text: (log.feedback_text as string) ?? null,
            flags: flags.map((f) => ({
              type: f.flag_reason,
              is_reviewed: Boolean(f.is_reviewed),
              created_at: f.created_at,
            })),
          },
          latency: {
            total_ms: (log.latency_ms as number) ?? null,
            embedding_ms: (log.embedding_ms as number) ?? null,
            retrieval_ms: (log.retrieval_ms as number) ?? null,
            generation_ms: (log.generation_ms as number) ?? null,
          },
          sources,
        },
      });
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
// GET /prompts/defaults - 預設 Prompt 模板
// =============================================

const PROMPT_DEFAULTS = [
  { name: 'system_prompt', label: '系統提示詞', content: SYSTEM_PROMPT, variables: [] as string[] },
  { name: 'tool_selection_prompt', label: 'Tool Calling 查詢解析', content: TOOL_SELECTION_PROMPT, variables: ['query', 'crags', 'areas', 'regions'] },
  { name: 'general_knowledge_system_prompt', label: '通識知識提示詞', content: GENERAL_KNOWLEDGE_SYSTEM_PROMPT, variables: [] as string[] },
  { name: 'hyde_prompt', label: 'HyDE 假設文件生成', content: HYDE_PROMPT, variables: ['query'] },
  { name: 'judge_prompt', label: 'Judge 品質評估', content: JUDGE_PROMPT, variables: ['context', 'query', 'response'] },
  { name: 'contextual_chunk_prompt', label: 'Contextual RAG 語意摘要', content: CONTEXTUAL_CHUNK_PROMPT, variables: ['type', 'content'] },
  { name: 'multi_query_expansion_prompt', label: 'Multi-Query 查詢擴展', content: MULTI_QUERY_EXPANSION_PROMPT, variables: ['query', 'count'] },
  { name: 'agentic_decision_prompt', label: 'Agentic 決策', content: AGENTIC_DECISION_PROMPT, variables: ['query', 'count', 'evidence_summary', 'min_docs', 'remaining_steps'] },
  { name: 'query_template', label: '查詢模板', content: QUERY_TEMPLATE, variables: ['context', 'query'] },
];

adminAiRoutes.get(
  '/prompts/defaults',
  describeRoute({
    tags: ['Admin AI'],
    summary: '預設 Prompt 模板',
    description: '回傳 10 個硬編碼預設 prompt 的 name、中文名稱、content、variables',
    responses: { 200: { description: '預設 Prompt 列表' } },
  }),
  async (c) => {
    return c.json({ success: true, data: PROMPT_DEFAULTS });
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
    description: '取得所有 prompt，支援 name 篩選回傳指定 prompt 的所有版本',
    responses: { 200: { description: 'Prompt 清單' } },
  }),
  async (c) => {
    const name = c.req.query('name');
    try {
      const rows = name
        ? await c.env.DB.prepare(
            `SELECT id, name, version, content, variables, status, created_at, updated_at
             FROM ai_prompts WHERE name = ? ORDER BY version DESC`
          ).bind(name).all()
        : await c.env.DB.prepare(
            `SELECT id, name, version, status, created_at, updated_at
             FROM ai_prompts ORDER BY name, version DESC`
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

      // 若新版本為 active，自動將同名舊 active 版本歸檔
      const effectiveStatus = status ?? 'active';
      if (effectiveStatus === 'active') {
        await c.env.DB.prepare(
          `UPDATE ai_prompts SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE name = ? AND status = 'active'`
        ).bind(name).run();
      }

      const id = crypto.randomUUID();
      await c.env.DB.prepare(
        `INSERT INTO ai_prompts (id, name, version, content, variables, status) VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(id, name, version, content, JSON.stringify(variables), effectiveStatus).run();

      return c.json({ success: true, data: { id, name, version, status: effectiveStatus } }, 201);
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

      // 轉為物件格式，防護清單若未設定則補回預設值供管理員檢視
      const config: Record<string, string> = {
        prompt_injection_keywords: JSON.stringify(DEFAULT_PROMPT_INJECTION_KEYWORDS),
        jailbreak_patterns: JSON.stringify(DEFAULT_JAILBREAK_PATTERNS),
        system_prompt_leakage_patterns: JSON.stringify(DEFAULT_SYSTEM_PROMPT_LEAKAGE_PATTERNS),
      };
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

// =============================================
// GET /pipeline-steps - Pipeline Step 設定查詢
// =============================================

adminAiRoutes.get(
  '/pipeline-steps',
  describeRoute({
    tags: ['Admin AI'],
    summary: 'Pipeline Step 設定',
    description: '取得所有 pipeline step 的設定與 metadata',
    responses: { 200: { description: 'Pipeline step 列表' } },
  }),
  async (c) => {
    try {
      // 從 ai_config 讀取已儲存的 step 設定
      const row = await c.env.DB.prepare(
        `SELECT value FROM ai_config WHERE key = 'pipeline_steps'`
      ).first<{ value: string }>();

      const savedConfigs: PipelineStepConfig[] = row ? JSON.parse(row.value) : [];
      const savedMap = new Map(savedConfigs.map((s) => [s.id, s]));

      // 合併 registry metadata 與已儲存設定
      const steps = STEP_REGISTRY.map((meta) => {
        const saved = savedMap.get(meta.id);
        return {
          id: meta.id,
          name: meta.name,
          description: meta.description,
          phase: meta.phase,
          enabled: saved?.enabled ?? meta.defaultEnabled,
          order: saved?.order ?? meta.defaultOrder,
          requires: meta.requires,
          provides: meta.provides,
          skipWhen: meta.skipWhen ?? [],
        };
      });

      return c.json({ success: true, data: steps });
    } catch (error) {
      console.error('Admin pipeline-steps GET error:', error);
      return c.json({ success: false, error: 'DatabaseError', message: '讀取 pipeline 設定失敗' }, 500);
    }
  }
);

// =============================================
// PUT /pipeline-steps - Pipeline Step 設定更新
// =============================================

const pipelineStepSchema = z.object({
  id: z.string(),
  enabled: z.boolean(),
  order: z.number().int().min(0).max(100),
});

adminAiRoutes.put(
  '/pipeline-steps',
  describeRoute({
    tags: ['Admin AI'],
    summary: '更新 Pipeline Step 設定',
    description: '更新 pipeline step 的啟用狀態與執行順序，含依賴驗證',
    responses: {
      200: { description: '更新成功' },
      400: { description: '驗證失敗（格式錯誤或依賴衝突）' },
    },
  }),
  validator('json', z.object({ steps: z.array(pipelineStepSchema) })),
  async (c) => {
    try {
      const { steps } = c.req.valid('json' as never) as { steps: Array<{ id: string; enabled: boolean; order: number }> };

      // 驗證所有 stepId 存在於 registry
      const validIds = new Set<string>(STEP_REGISTRY.map((s) => s.id));
      const invalidIds = steps.filter((s) => !validIds.has(s.id));
      if (invalidIds.length > 0) {
        return c.json({
          success: false,
          error: 'ValidationError',
          message: `無效的 step ID: ${invalidIds.map((s) => s.id).join(', ')}`,
        }, 400);
      }

      // 依賴驗證
      const validation = PipelineEngine.validateDependencies(steps as PipelineStepConfig[]);
      if (!validation.valid) {
        return c.json({
          success: false,
          error: 'DependencyConflict',
          message: '依賴衝突',
          conflicts: validation.errors,
        }, 400);
      }

      // 審計日誌
      const adminId = c.get('userId') as string | undefined;
      const changed = steps.map((s) => `${s.id}:${s.enabled ? 'on' : 'off'}:${s.order}`).join(', ');
      console.info(`[AUDIT] pipeline-steps updated by ${adminId ?? 'unknown'}: [${changed}]`);

      // 寫入 ai_config
      await c.env.DB.prepare(
        `INSERT OR REPLACE INTO ai_config (key, value) VALUES ('pipeline_steps', ?)`
      ).bind(JSON.stringify(steps)).run();

      return c.json({ success: true, message: 'Pipeline 設定已更新' });
    } catch (error) {
      console.error('Admin pipeline-steps PUT error:', error);
      return c.json({ success: false, error: 'DatabaseError', message: '更新 pipeline 設定失敗' }, 500);
    }
  }
);

// =============================================
// GET /pipeline-branches - Pipeline 分支配置查詢
// =============================================

adminAiRoutes.get(
  '/pipeline-branches',
  describeRoute({
    tags: ['Admin AI'],
    summary: 'Pipeline 分支配置',
    description: '取得 pipeline 分支（branching + fusion）配置',
    responses: { 200: { description: '分支配置列表' } },
  }),
  async (c) => {
    try {
      const row = await c.env.DB.prepare(
        `SELECT value FROM ai_config WHERE key = 'pipeline_branches'`
      ).first<{ value: string }>();

      const branches: BranchConfig[] = row ? JSON.parse(row.value) : [];
      return c.json({ success: true, data: branches });
    } catch (error) {
      console.error('Admin pipeline-branches GET error:', error);
      return c.json({ success: false, error: 'DatabaseError', message: '讀取分支配置失敗' }, 500);
    }
  }
);

// =============================================
// PUT /pipeline-branches - Pipeline 分支配置更新
// =============================================

const branchConfigSchema = z.object({
  id: z.string(),
  branches: z.array(z.array(z.string())),
  fusionStep: z.string(),
});

adminAiRoutes.put(
  '/pipeline-branches',
  describeRoute({
    tags: ['Admin AI'],
    summary: '更新 Pipeline 分支配置',
    description: '更新 pipeline 分支與融合設定',
    responses: {
      200: { description: '更新成功' },
      400: { description: '驗證失敗' },
    },
  }),
  validator('json', z.object({ branches: z.array(branchConfigSchema) })),
  async (c) => {
    try {
      const { branches } = c.req.valid('json' as never) as { branches: BranchConfig[] };

      // 驗證 stepId 存在
      const validIds = new Set(STEP_REGISTRY.map((s) => s.id));
      for (const branch of branches as BranchConfig[]) {
        for (const path of branch.branches) {
          for (const stepId of path) {
            if (!validIds.has(stepId as PipelineStepConfig['id'])) {
              return c.json({
                success: false,
                error: 'ValidationError',
                message: `分支中包含無效 step ID: ${stepId}`,
              }, 400);
            }
          }
        }
        if (!validIds.has(branch.fusionStep as PipelineStepConfig['id'])) {
          return c.json({
            success: false,
            error: 'ValidationError',
            message: `fusion step 無效: ${branch.fusionStep}`,
          }, 400);
        }
      }

      // 審計日誌
      const adminId = c.get('userId') as string | undefined;
      console.info(`[AUDIT] pipeline-branches updated by ${adminId ?? 'unknown'}: ${JSON.stringify(branches)}`);

      await c.env.DB.prepare(
        `INSERT OR REPLACE INTO ai_config (key, value) VALUES ('pipeline_branches', ?)`
      ).bind(JSON.stringify(branches)).run();

      return c.json({ success: true, message: '分支配置已更新' });
    } catch (error) {
      console.error('Admin pipeline-branches PUT error:', error);
      return c.json({ success: false, error: 'DatabaseError', message: '更新分支配置失敗' }, 500);
    }
  }
);

// =============================================
// GET /metrics - 長期趨勢聚合指標
// =============================================

const VALID_RANGES = ['7d', '30d', '90d'] as const;
type MetricsRange = (typeof VALID_RANGES)[number];

const RANGE_DAYS: Record<MetricsRange, number> = { '7d': 7, '30d': 30, '90d': 90 };

adminAiRoutes.get(
  '/metrics',
  describeRoute({
    tags: ['Admin AI'],
    summary: 'AI 趨勢指標',
    description: '取得指定時間範圍的每日聚合指標（延遲/品質/快取/查詢類型/異常偵測）',
    responses: { 200: { description: '趨勢指標資料' } },
  }),
  async (c) => {
    try {
      const rangeParam = (c.req.query('range') ?? '30d') as string;
      if (!VALID_RANGES.includes(rangeParam as MetricsRange)) {
        return c.json({
          success: false,
          error: 'InvalidParameter',
          message: `range 參數無效，合法值為: ${VALID_RANGES.join(', ')}`,
        }, 400);
      }
      const range = rangeParam as MetricsRange;
      const days = RANGE_DAYS[range];

      // --- 每日基本統計 + 品質 ---
      const dailyBasicRows = await c.env.DB.prepare(`
        SELECT
          date(created_at) as date,
          COUNT(*) as query_count,
          AVG(CASE WHEN embedding_ms IS NOT NULL THEN latency_ms END) as avg_latency_noncache,
          AVG(groundedness_score) as avg_groundedness,
          AVG(auto_score) as avg_auto_score,
          AVG(CASE WHEN feedback_score IS NOT NULL THEN feedback_score END) as avg_feedback_score,
          SUM(CASE WHEN cache_hit = 1 THEN 1 ELSE 0 END) as cache_hits,
          SUM(CASE WHEN cache_hit = 0 THEN 1 ELSE 0 END) as cache_misses
        FROM ai_query_logs
        WHERE created_at >= datetime('now', '-' || ? || ' days')
        GROUP BY date(created_at)
        ORDER BY date ASC
      `).bind(days).all<{
        date: string;
        query_count: number;
        avg_latency_noncache: number | null;
        avg_groundedness: number | null;
        avg_auto_score: number | null;
        avg_feedback_score: number | null;
        cache_hits: number;
        cache_misses: number;
      }>();

      // --- 每日快取類型區分 ---
      const cacheTypeRows = await c.env.DB.prepare(`
        SELECT
          date(created_at) as date,
          SUM(CASE WHEN cache_hit = 1 AND COALESCE(json_extract(pipeline_trace, '$.cache.type'), 'kv') = 'kv' THEN 1 ELSE 0 END) as kv_hits,
          SUM(CASE WHEN cache_hit = 1 AND json_extract(pipeline_trace, '$.cache.type') = 'semantic' THEN 1 ELSE 0 END) as semantic_hits
        FROM ai_query_logs
        WHERE created_at >= datetime('now', '-' || ? || ' days')
        GROUP BY date(created_at)
        ORDER BY date ASC
      `).bind(days).all<{ date: string; kv_hits: number; semantic_hits: number }>();

      const cacheTypeMap = new Map(cacheTypeRows.results.map((r) => [r.date, r]));

      // --- 每日查詢類型分佈 ---
      const queryTypeRows = await c.env.DB.prepare(`
        SELECT
          date(created_at) as date,
          query_type,
          COUNT(*) as count
        FROM ai_query_logs
        WHERE created_at >= datetime('now', '-' || ? || ' days')
        GROUP BY date(created_at), query_type
        ORDER BY date ASC
      `).bind(days).all<{ date: string; query_type: string | null; count: number }>();

      const queryTypeMap = new Map<string, Record<string, number>>();
      for (const row of queryTypeRows.results) {
        if (!queryTypeMap.has(row.date)) {
          queryTypeMap.set(row.date, { simple: 0, complex: 0, 'general-knowledge': 0, guardrails_blocked: 0 });
        }
        const dayTypes = queryTypeMap.get(row.date)!;
        const key = row.query_type ?? 'simple';
        dayTypes[key] = (dayTypes[key] ?? 0) + row.count;
      }

      // --- 每日延遲 percentile（per-phase） ---
      const latencyPercentileRows = await c.env.DB.prepare(`
        SELECT
          date(created_at) as date,
          embedding_ms,
          retrieval_ms,
          generation_ms,
          latency_ms
        FROM ai_query_logs
        WHERE created_at >= datetime('now', '-' || ? || ' days')
          AND embedding_ms IS NOT NULL
        ORDER BY date(created_at) ASC
      `).bind(days).all<{
        date: string;
        embedding_ms: number;
        retrieval_ms: number;
        generation_ms: number;
        latency_ms: number;
      }>();

      // 按日分群計算 percentile
      const latencyByDate = new Map<string, {
        embedding: number[];
        retrieval: number[];
        generation: number[];
        total: number[];
      }>();
      for (const row of latencyPercentileRows.results) {
        if (!latencyByDate.has(row.date)) {
          latencyByDate.set(row.date, { embedding: [], retrieval: [], generation: [], total: [] });
        }
        const d = latencyByDate.get(row.date)!;
        d.embedding.push(row.embedding_ms);
        d.retrieval.push(row.retrieval_ms);
        d.generation.push(row.generation_ms);
        d.total.push(row.latency_ms);
      }

      const percentile = (arr: number[], pct: number): number | null => {
        if (arr.length === 0) return null;
        const sorted = [...arr].sort((a, b) => a - b);
        const idx = Math.max(0, Math.ceil(sorted.length * pct) - 1);
        return sorted[idx];
      };

      // --- 組裝 daily 陣列 ---
      const daily = dailyBasicRows.results.map((row) => {
        const ct = cacheTypeMap.get(row.date);
        const qt = queryTypeMap.get(row.date) ?? { simple: 0, complex: 0, 'general-knowledge': 0, guardrails_blocked: 0 };
        const ld = latencyByDate.get(row.date);
        const total = row.query_count;
        const hitRate = total > 0 ? Math.round((row.cache_hits / total) * 100) / 100 : 0;

        return {
          date: row.date,
          query_count: row.query_count,
          latency: {
            embedding_p50: ld ? percentile(ld.embedding, 0.5) : null,
            embedding_p95: ld ? percentile(ld.embedding, 0.95) : null,
            retrieval_p50: ld ? percentile(ld.retrieval, 0.5) : null,
            retrieval_p95: ld ? percentile(ld.retrieval, 0.95) : null,
            generation_p50: ld ? percentile(ld.generation, 0.5) : null,
            generation_p95: ld ? percentile(ld.generation, 0.95) : null,
            total_p50: ld ? percentile(ld.total, 0.5) : null,
            total_p95: ld ? percentile(ld.total, 0.95) : null,
          },
          quality: {
            avg_groundedness: row.avg_groundedness != null ? Math.round(row.avg_groundedness * 100) / 100 : null,
            avg_auto_score: row.avg_auto_score != null ? Math.round(row.avg_auto_score * 10) / 10 : null,
            avg_feedback_score: row.avg_feedback_score != null ? Math.round(row.avg_feedback_score * 10) / 10 : null,
          },
          cache: {
            hit_rate: hitRate,
            kv_hits: ct?.kv_hits ?? 0,
            semantic_hits: ct?.semantic_hits ?? 0,
            misses: row.cache_misses,
          },
          query_types: qt,
          anomalies: [] as string[],
        };
      });

      // --- Z-Score 異常偵測 ---
      const ANOMALY_METRICS: Array<{
        key: string;
        extract: (d: (typeof daily)[number]) => number | null;
      }> = [
        { key: 'latency.total_p95', extract: (d) => d.latency.total_p95 },
        { key: 'latency.generation_p95', extract: (d) => d.latency.generation_p95 },
        { key: 'quality.avg_groundedness', extract: (d) => d.quality.avg_groundedness },
        { key: 'quality.avg_auto_score', extract: (d) => d.quality.avg_auto_score },
        { key: 'cache.hit_rate', extract: (d) => d.cache.hit_rate },
      ];

      for (let i = 0; i < daily.length; i++) {
        const day = daily[i];
        if (day.query_count < 5) continue; // 低流量不偵測

        for (const metric of ANOMALY_METRICS) {
          const currentVal = metric.extract(day);
          if (currentVal == null) continue;

          // 收集前 7 天有效值
          const window: number[] = [];
          for (let j = Math.max(0, i - 7); j < i; j++) {
            if (daily[j].query_count < 5) continue;
            const v = metric.extract(daily[j]);
            if (v != null) window.push(v);
          }
          if (window.length < 3) continue; // 歷史不足不偵測

          const mean = window.reduce((s, v) => s + v, 0) / window.length;
          const variance = window.reduce((s, v) => s + (v - mean) ** 2, 0) / window.length;
          const stddev = Math.sqrt(variance);
          if (stddev === 0) continue;

          const zScore = Math.abs(currentVal - mean) / stddev;
          if (zScore > 2) {
            day.anomalies.push(metric.key);
          }
        }
      }

      // --- Summary ---
      const summaryRow = await c.env.DB.prepare(`
        SELECT
          COUNT(*) as total_queries,
          AVG(latency_ms) as avg_latency_ms,
          AVG(groundedness_score) as avg_groundedness,
          CAST(SUM(CASE WHEN cache_hit = 1 THEN 1 ELSE 0 END) AS REAL) / NULLIF(COUNT(*), 0) as cache_hit_rate
        FROM ai_query_logs
        WHERE created_at >= datetime('now', '-' || ? || ' days')
      `).bind(days).first<{
        total_queries: number;
        avg_latency_ms: number | null;
        avg_groundedness: number | null;
        cache_hit_rate: number | null;
      }>();

      return c.json({
        success: true,
        data: {
          range,
          daily,
          summary: {
            total_queries: summaryRow?.total_queries ?? 0,
            avg_latency_ms: summaryRow?.avg_latency_ms != null ? Math.round(summaryRow.avg_latency_ms) : null,
            avg_groundedness: summaryRow?.avg_groundedness != null ? Math.round(summaryRow.avg_groundedness * 100) / 100 : null,
            cache_hit_rate: summaryRow?.cache_hit_rate != null ? Math.round(summaryRow.cache_hit_rate * 100) / 100 : null,
          },
        },
      });
    } catch (error) {
      console.error('Admin metrics error:', error);
      return c.json({ success: false, error: 'DatabaseError', message: '取得趨勢指標失敗' }, 500);
    }
  }
);
