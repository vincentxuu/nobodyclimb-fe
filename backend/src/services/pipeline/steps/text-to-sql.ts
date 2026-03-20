import { PipelineStep, PipelineContext, LLMResponse } from '../types';
import { TextToSqlService, SqlExecutionError } from '../../text-to-sql';
import { SQL_RESULT_ASSEMBLY_PROMPT } from '../../../utils/ai-prompts';

export const textToSqlStep: PipelineStep = {
  id: 'text-to-sql',
  name: 'Text-to-SQL 直查',
  description: '對計算/統計/篩選問題執行 SQL 模板查詢，或撈取 Hybrid 候選集',
  phase: 'pre-retrieval',
  defaultEnabled: true,
  defaultOrder: 2,
  requires: ['queryType', 'parsedQuery'],
  provides: ['earlyReturn', 'sqlCandidates', 'sqlContext'],
  skipWhen: [{ field: 'queryType', operator: 'in', value: ['simple', 'complex', 'general-knowledge', 'multi-tool'] }],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const { env, request, pipelineConfig, gatewayOptions, trace, queryService } = ctx;
    const { query } = request;

    const sqlService = new TextToSqlService(env.DB);

    // 個人完攀模板：未登入時直接回傳
    if (ctx.sqlTemplate && TextToSqlService.isPersonalTemplate(ctx.sqlTemplate) && !ctx.userId) {
      return await loginRequiredResponse(ctx);
    }

    // === SQL 路徑 ===
    if (ctx.queryType === 'sql') {
      return await handleSqlPath(ctx, sqlService);
    }

    // === Hybrid 路徑 ===
    if (ctx.queryType === 'hybrid') {
      return await handleHybridPath(ctx, sqlService);
    }

    // === Clarification-needed 路徑 ===
    if (ctx.queryType === 'clarification-needed') {
      return await handleClarificationPath(ctx);
    }

    return ctx;
  },
};

// SQL 路徑：執行 SQL 模板，組裝自然語言回答
async function handleSqlPath(ctx: PipelineContext, sqlService: TextToSqlService): Promise<PipelineContext> {
  const { env, request, pipelineConfig, gatewayOptions, trace, queryService } = ctx;
  const { query } = request;
  const template = ctx.sqlTemplate;

  if (!template || !TextToSqlService.isSupported(template)) {
    return fallbackToRag(ctx, 'no_template');
  }

  try {
    const params = { ...(ctx.sqlParams || {}) } as Record<string, unknown>;

    // 個人完攀模板注入 user_id
    if (TextToSqlService.isPersonalTemplate(template)) {
      params.user_id = ctx.userId;
    }

    // 需要岩場 ID 的模板：解析 crag_name → crag_id
    if (params.crag_name && !params.crag_id) {
      const crags = ctx.preloadedCrags ?? [];
      const areas = ctx.preloadedAreas ?? [];
      const locationFilter = queryService.extractLocationFilter(query, crags, areas);
      if (locationFilter?.cragIds?.length) {
        params.crag_id = locationFilter.cragIds[0];
      } else {
        // 嘗試用預載的 crags 匹配
        const crag = crags.find(
          (c) => c.name === params.crag_name || c.name.includes(params.crag_name as string),
        );
        if (crag) params.crag_id = crag.id;
      }
    }

    // 需要路線名稱驗證的模板
    if (TextToSqlService.requiresRouteValidation(template) && params.route_name) {
      const cragId = params.crag_id as string | undefined;
      const route = await sqlService.validateRouteName(params.route_name as string, cragId);
      if (!route) {
        return fallbackToRag(ctx, 'route_not_found');
      }
      params.route_id = route.id;
    }

    // 清單模板：限制回傳筆數（避免一次輸出過長）
    const isListTemplate = ['LIST_ROUTES_BY_CRITERIA', 'LIST_ROUTES_AT_GRADE', 'ROUTES_WITH_VIDEOS'].includes(template);
    if (isListTemplate && params.limit == null) {
      params.limit = pipelineConfig.list_response_limit;
    }

    // 執行 SQL 模板
    const result = await sqlService.execute(template, params);

    if (result.rows.length === 0) {
      // 個人模板空結果：直接回傳友善訊息，不 fallback 到 RAG（避免幻覺）
      if (TextToSqlService.isPersonalTemplate(template)) {
        return await emptyPersonalResponse(ctx, template);
      }
      return fallbackToRag(ctx, 'empty_result');
    }

    // 用輕量 LLM 組裝自然語言回答
    // 清單模板：去除 description 避免 payload 過大，並動態調整 max_tokens
    const assemblyRows = isListTemplate
      ? result.rows.map(({ description, ...rest }) => rest)
      : result.rows;
    const assemblyMaxTokens = Math.min(200 + result.rows.length * 30, 2000);

    const assemblyPrompt = SQL_RESULT_ASSEMBLY_PROMPT
      .replace('{query}', query)
      .replace('{count}', String(result.rows.length))
      .replace('{results}', JSON.stringify(assemblyRows, null, 2));

    const llmResult = (await env.AI.run(
      pipelineConfig.lightweight_model,
      { messages: [{ role: 'user', content: assemblyPrompt }], max_tokens: assemblyMaxTokens },
      gatewayOptions,
    )) as LLMResponse;

    const answer = llmResult.response || formatFallback(query, result.rows, template);

    // 追蹤 token 使用
    if (llmResult.usage) {
      ctx.tokenBreakdown.text_to_sql = { ...llmResult.usage, model: pipelineConfig.lightweight_model, estimated: false };
    } else {
      const estP = Math.ceil(assemblyPrompt.length / 2);
      const estC = Math.ceil(answer.length / 2);
      ctx.tokenBreakdown.text_to_sql = { prompt_tokens: estP, completion_tokens: estC, total_tokens: estP + estC, model: pipelineConfig.lightweight_model, estimated: true };
    }

    trace.text_to_sql = {
      template,
      row_count: result.rows.length,
      path: 'sql',
    };

    // 將 tokenBreakdown 寫入 trace（earlyReturn 不經過 engine 的 postPipelineProcessing）
    if (Object.keys(ctx.tokenBreakdown).length > 0) {
      trace.token_breakdown = ctx.tokenBreakdown;
    }

    // logQuery（使用所有 stage 的 token 總和）
    const totalTokens = Object.values(ctx.tokenBreakdown).reduce((sum, v) => {
      if (v && typeof v === 'object' && 'total_tokens' in v) return sum + ((v as { total_tokens: number }).total_tokens ?? 0);
      return sum;
    }, 0);
    const queryId = await queryService.logQuery({
      userId: ctx.userId ?? null, query, response: answer,
      sources: [], latencyMs: Date.now() - ctx.startTime, tokenCount: totalTokens > 0 ? totalTokens : (llmResult.usage?.total_tokens ?? null),
      queryType: 'sql', modelUsed: pipelineConfig.lightweight_model,
      retrievalScore: 0, selfReflectionTriggered: 0,
      pipelineTrace: Object.keys(trace).length > 0 ? JSON.stringify(trace) : undefined,
    });

    // KV 快取
    const response = {
      answer,
      sources: [] as import('../../../types').AISource[],
      query_id: queryId,
      suggested_questions: [] as string[],
      query_route: 'sql' as const,
    };
    // 個人模板不快取（資料因使用者不同）
    if (!TextToSqlService.isPersonalTemplate(template)) {
      await env.CACHE.put(ctx.cacheKey, JSON.stringify(response), { expirationTtl: ctx.cacheTtl });
    }

    ctx.earlyReturn = response;
    return ctx;
  } catch (err) {
    if (err instanceof Error && err.message === 'LOGIN_REQUIRED') {
      return await loginRequiredResponse(ctx);
    }
    ctx.trace.sql_error = err instanceof Error ? err.message : String(err);
    return fallbackToRag(ctx, err instanceof SqlExecutionError ? 'sql_error' : 'unknown_error');
  }
}

// Hybrid 路徑：撈取候選集（不支援 MY_* 個人模板）
async function handleHybridPath(ctx: PipelineContext, sqlService: TextToSqlService): Promise<PipelineContext> {
  if (ctx.sqlTemplate && TextToSqlService.isPersonalTemplate(ctx.sqlTemplate)) {
    return fallbackToRag(ctx, 'personal_template_not_supported_in_hybrid');
  }

  const { trace, queryService } = ctx;
  const params = { ...(ctx.sqlParams || {}) } as Record<string, unknown>;

  try {
    // 解析 crag_name → crag_id
    if (params.crag_name && !params.crag_id) {
      const crags = ctx.preloadedCrags ?? [];
      const areas = ctx.preloadedAreas ?? [];
      const locationFilter = queryService.extractLocationFilter(ctx.request.query, crags, areas);
      if (locationFilter?.cragIds?.length) {
        params.crag_id = locationFilter.cragIds[0];
      } else {
        const crag = crags.find(
          (c) => c.name === params.crag_name || c.name.includes(params.crag_name as string),
        );
        if (crag) params.crag_id = crag.id;
      }
    }

    const excludedIds = (ctx.climbed_route_ids && ctx.climbed_route_ids.length > 0)
      ? ctx.climbed_route_ids
      : undefined;
    const candidates = await sqlService.queryCandidates(params, excludedIds);

    if (candidates.length === 0) {
      return fallbackToRag(ctx, 'empty_candidates');
    }

    // 格式化為 context 文字
    const sqlContext = candidates.map((r) => {
      const routeType = r.route_type === 'sport' ? '運攀' : r.route_type === 'trad' ? '傳攀' : r.route_type === 'boulder' ? '抱石' : r.route_type === 'mixed' ? '混合攀登' : (r.route_type ?? '');
      const parts = [`路線名稱：${r.name}`, `難度：${r.grade ?? '未知'}`];
      if (routeType) parts.push(`類型：${routeType}`);
      if (r.crag_name) parts.push(`岩場：${r.crag_name}`);
      if (r.bolt_count) parts.push(`bolt 數：${r.bolt_count}`);
      if (r.height) parts.push(`高度：${r.height}m`);
      if (r.description) parts.push(`描述：${(r.description as string).slice(0, 100)}`);
      return parts.join('，');
    }).join('\n');

    ctx.sqlCandidates = candidates;
    ctx.sqlContext = sqlContext;

    const candidateDetails = candidates.map((r) => ({
      name: r.name,
      grade: r.grade ?? null,
      route_type: r.route_type ?? null,
      crag_name: r.crag_name ?? null,
      bolt_count: typeof r.bolt_count === 'number' ? r.bolt_count : null,
      height: typeof r.height === 'number' ? r.height : null,
      description: typeof r.description === 'string' && r.description.trim().length > 0
        ? r.description.trim().slice(0, 200)
        : null,
    }));
    const contextPreview = sqlContext.length > 1200 ? `${sqlContext.slice(0, 1200)}…` : sqlContext;

    trace.text_to_sql = {
      path: 'hybrid',
      candidate_count: candidates.length,
      context_preview: contextPreview,
      candidates: candidateDetails,
    };

    return ctx;
  } catch (err) {
    ctx.trace.hybrid_error = err instanceof Error ? err.message : String(err);
    return fallbackToRag(ctx, 'hybrid_error');
  }
}

// Clarification 路徑：組裝回問
async function handleClarificationPath(ctx: PipelineContext): Promise<PipelineContext> {
  const { request, trace, queryService } = ctx;
  const { query } = request;

  let answer: string;
  let options: string[];

  if (ctx.clarificationType === 'intent') {
    answer = '你是想要：\nA. 列出符合條件的路線清單\n還是\nB. 根據你的程度個人化推薦？';
    options = ['A. 查詢清單', 'B. 個人化推薦'];
  } else {
    // missing-crag
    answer = '請問是哪個岩場的路線？';
    options = [];
  }

  trace.text_to_sql = {
    path: 'clarification',
    clarification_type: ctx.clarificationType,
  };

  const queryId = await queryService.logQuery({
    userId: ctx.userId ?? null, query, response: answer,
    sources: [], latencyMs: Date.now() - ctx.startTime, tokenCount: 0,
    queryType: 'clarification-needed', modelUsed: ctx.effectiveLlmModel,
    pipelineTrace: Object.keys(trace).length > 0 ? JSON.stringify(trace) : undefined,
  });

  // 澄清回應依賴問題脈絡，刻意不寫入 KV 快取
  ctx.earlyReturn = {
    answer,
    sources: [],
    query_id: queryId,
    suggested_questions: [],
    clarification_needed: true,
    clarification_options: options,
    query_route: 'clarification',
  };

  return ctx;
}

// 未登入回應
async function loginRequiredResponse(ctx: PipelineContext): Promise<PipelineContext> {
  const { request, trace, queryService } = ctx;
  const queryId = await queryService.logQuery({
    userId: null, query: request.query, response: '請先登入才能查詢個人完攀紀錄。',
    sources: [], latencyMs: Date.now() - ctx.startTime, tokenCount: 0,
    queryType: 'sql', modelUsed: ctx.effectiveLlmModel,
    pipelineTrace: Object.keys(trace).length > 0 ? JSON.stringify(trace) : undefined,
  });
  ctx.earlyReturn = {
    answer: '請先登入才能查詢個人完攀紀錄。',
    sources: [],
    query_id: queryId,
    suggested_questions: [],
    query_route: 'sql',
  };
  return ctx;
}

// 個人模板空結果：直接回傳友善訊息，不走 RAG
async function emptyPersonalResponse(ctx: PipelineContext, template: string): Promise<PipelineContext> {
  const { request, trace, queryService } = ctx;

  const messageMap: Record<string, string> = {
    MY_ASCENT_LIST: '你目前還沒有完攀紀錄喔！去紀錄你的第一條路線吧 🧗',
    MY_ASCENT_COUNT: '你目前還沒有完攀紀錄。',
    MY_ASCENT_BY_TYPE: '你目前還沒有完攀紀錄。',
    MY_ASCENT_AT_CRAG: '你在這個岩場還沒有完攀紀錄。',
    MY_ASCENT_BY_DATE: '你目前還沒有完攀紀錄。',
    MY_HIGHEST_GRADE: '你目前還沒有完攀紀錄，無法查詢最高難度。',
    MY_RATED_ROUTES: '你目前還沒有評分過任何路線。',
  };
  const answer = messageMap[template] ?? '你目前還沒有相關紀錄。';

  trace.text_to_sql = { template, row_count: 0, path: 'sql', empty_personal: true };

  const queryId = await queryService.logQuery({
    userId: ctx.userId ?? null, query: request.query, response: answer,
    sources: [], latencyMs: Date.now() - ctx.startTime, tokenCount: 0,
    queryType: 'sql', modelUsed: ctx.effectiveLlmModel,
    pipelineTrace: Object.keys(trace).length > 0 ? JSON.stringify(trace) : undefined,
  });

  ctx.earlyReturn = {
    answer,
    sources: [],
    query_id: queryId,
    suggested_questions: [],
    query_route: 'sql' as const,
  };
  return ctx;
}

// 程式化格式化 fallback（LLM 組裝失敗時使用）
const ROUTE_TYPE_ZH: Record<string, string> = { sport: '運攀', trad: '傳攀', boulder: '抱石', mixed: '混合攀登' };
function formatFallback(query: string, rows: Record<string, unknown>[], template: string): string {
  if (rows.length === 0) return '找不到符合條件的資料。';

  // 計數模板
  if (template === 'COUNT_ROUTES_AT_CRAG') {
    const count = (rows[0] as { count?: number })?.count ?? rows.length;
    return `共有 ${count} 條路線。`;
  }

  // 清單模板：格式化為 markdown 列表
  const lines = rows.map((r) => {
    const name = r.name as string;
    const grade = r.grade as string | null;
    const type = ROUTE_TYPE_ZH[(r.route_type as string) ?? ''] ?? '';
    const parts = [name];
    if (grade) parts.push(`(${grade})`);
    if (type) parts.push(`(${type})`);
    return `- ${parts.join(' ')}`;
  });

  return `共有 ${rows.length} 條路線：\n\n${lines.join('\n')}`;
}

// Fallback：回復為 complex，讓 pipeline 繼續走 RAG
function fallbackToRag(ctx: PipelineContext, reason: string): PipelineContext {
  ctx.queryType = 'complex';
  ctx.trace.sql_fallback = true;
  ctx.trace.sql_fallback_reason = reason;
  return ctx;
}
