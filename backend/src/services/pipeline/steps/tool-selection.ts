import { PipelineStep, PipelineContext } from '../types';
import toolRegistry from '../../tool-registry';

// 個人查詢安全網：當 LLM 未能將個人查詢分類為 search_sql 時，用 regex 偵測並修正
// .{0,6} 容許中間有修飾詞（已經、有沒有、曾經、總共、都）
const PERSONAL_QUERY_PATTERN = /我.{0,6}(爬過|完攀|攀了|爬了|評了)|我(有幾條|的路線|的紀錄|的完攀|最高|最難)/;

// SQL 計數/清單查詢安全網：當 LLM 未分類為 search_sql 時，用 regex + 岩場名稱偵測
const SQL_COUNT_PATTERN = /有幾條|幾條路線|多少條|共有幾/;
const SQL_LIST_PATTERN = /有哪些.*路線|列出.*路線|有什麼.*路線|路線有哪些|路線有什麼/;

function inferSqlQuery(query: string, cragNames: string[]): { template: string; params: Record<string, unknown> } | null {
  const isCount = SQL_COUNT_PATTERN.test(query);
  const isList = SQL_LIST_PATTERN.test(query);
  if (!isCount && !isList) return null;

  // 從長到短匹配岩場名稱（避免「龍洞」匹配到「龍」）
  const sorted = [...cragNames].sort((a, b) => b.length - a.length);
  const cragName = sorted.find((name) => query.includes(name));
  if (!cragName) return null;

  const params: Record<string, unknown> = { crag_name: cragName };

  // 提取難度
  const gradeMatch = query.match(/5\.\d+[a-d]?/);
  if (gradeMatch) params.grade = gradeMatch[0];

  // 提取路線類型
  if (/運攀|sport/i.test(query)) params.route_type = 'sport';
  else if (/傳攀|trad/i.test(query)) params.route_type = 'trad';
  else if (/抱石|boulder/i.test(query)) params.route_type = 'boulder';

  if (isCount) return { template: 'COUNT_ROUTES_AT_CRAG', params };

  // 「有哪些路線」無具體篩選條件時，用難度分佈摘要取代列出所有路線
  const hasFilter = params.grade || params.route_type;
  if (!hasFilter) return { template: 'GRADE_DISTRIBUTION', params };

  return { template: 'LIST_ROUTES_BY_CRITERIA', params };
}

function inferPersonalTemplate(query: string): string {
  if (/幾條|幾次|多少條/.test(query)) return 'MY_ASCENT_COUNT';
  if (/最高|最難/.test(query)) return 'MY_HIGHEST_GRADE';
  if (/評|星/.test(query)) return 'MY_RATED_ROUTES';
  if (/哪個岩場|在.+爬/.test(query)) return 'MY_ASCENT_AT_CRAG';
  return 'MY_ASCENT_LIST';
}

export const toolSelectionStep: PipelineStep = {
  id: 'tool-selection',
  name: 'Tool Calling (LLM A)',
  description: '解析查詢意圖、分類 queryType，提取搜尋參數',
  phase: 'pre-retrieval',
  defaultEnabled: true,
  defaultOrder: 1,
  requires: [],
  provides: ['queryType', 'parsedQuery', 'effectiveLlmModel', 'preloadedCrags', 'preloadedAreas', 'sqlTemplate', 'sqlParams', 'clarificationType', 'toolConfidence', 'fallbackEnabled', 'alternativeTool', 'retrievalMethod'],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const { env, request, pipelineConfig, prompts, gatewayOptions, tokenBreakdown, trace } = ctx;
    const { query } = request;
    const llmModel = pipelineConfig.llm_model;

    // 個人查詢安全網：避免「我爬過哪些路線」被 hasSimilarRouteIntent 誤判為相似路線搜尋
    // 但若含推薦/類似意圖（如「我完攀了X，推薦類似路線」、「有沒有類似的」），推薦意圖優先
    const hasSimRouteIntent = ctx.queryService.hasSimilarRouteIntent(query);
    const wantsRecommendation = /推薦|建議|類似|相似|差不多|suggest/i.test(query);
    const isPersonalQuery = PERSONAL_QUERY_PATTERN.test(query) && !wantsRecommendation;

    // 偵測相似路線意圖（純個人查詢略過，避免「我爬過哪些路線」誤判為相似路線搜尋）
    if (!isPersonalQuery && hasSimRouteIntent) {
      ctx.isSimRouteSearch = true;

      // 並行：DB 查路線資訊 + HyDE 生成
      const [routeRef, hydeDocResult] = await Promise.all([
        ctx.queryService.extractRouteReference(query),
        ctx.queryService.generateHyDE(query, llmModel, gatewayOptions, prompts['HYDE_PROMPT']),
      ]);

      ctx.hydeDoc = hydeDocResult.doc;
      if (hydeDocResult.usage) {
        tokenBreakdown.hyde = { ...hydeDocResult.usage, model: llmModel };
      }
      if (ctx.hydeDoc) trace.hyde = { document: ctx.hydeDoc.slice(0, 300) };

      if (routeRef) {
        ctx.vectorFilter = ctx.vectorFilter ?? {};
        if (routeRef.cragId) ctx.vectorFilter['crag_id'] = { $eq: routeRef.cragId };
        if (routeRef.gradeNumeric > 0) {
          ctx.vectorFilter['grade_numeric'] = ctx.queryService.similarGradeRange(routeRef.gradeNumeric, 3);
        }
        ctx.vectorFilter['type'] = { $eq: 'route' };
        ctx.excludeRouteId = routeRef.routeId;
        const typeLabel = routeRef.routeType ? `，類型：${routeRef.routeType}` : '';
        ctx.referenceRouteInfo = `使用者剛爬完的路線：${routeRef.name}（難度：${routeRef.grade ?? '未知'}${typeLabel}）`;
      }

      ctx.queryType = 'complex';
      ctx.effectiveLlmModel = llmModel;
      return ctx;
    }

    // Stage 1a：預載岩場/區域資料
    const [cragsResult, areasResult] = await Promise.all([
      env.DB.prepare('SELECT id, name, region FROM crags WHERE name IS NOT NULL').all<{ id: string; name: string; region: string | null }>(),
      env.DB.prepare('SELECT id, name FROM areas WHERE name IS NOT NULL').all<{ id: string; name: string }>(),
    ]);
    ctx.preloadedCrags = cragsResult.results;
    ctx.preloadedAreas = areasResult.results;
    const cragNames = ctx.preloadedCrags.map((c) => c.name);
    const areaNames = ctx.preloadedAreas.map((a) => a.name);
    const regionNames = [...new Set(ctx.preloadedCrags.map((c) => c.region).filter(Boolean))] as string[];

    // Stage 1b：Tool Calling（parseQueryWithLLM）
    // 動態注入工具描述到 prompt
    const toolSelectionPrompt = (prompts['TOOL_SELECTION_PROMPT'] || '').replace('{tools}', toolRegistry.generatePromptBlock());
    const { result: parsedQuery, usage: toolSelectionUsage } = await ctx.queryService.parseQueryWithLLM(query, llmModel, cragNames, areaNames, regionNames, gatewayOptions, toolSelectionPrompt);

    ctx.parsedQuery = parsedQuery;
    if (toolSelectionUsage) {
      tokenBreakdown.tool_selection = { ...toolSelectionUsage, model: llmModel };
    }

    // trace
    if (parsedQuery) {
      trace.query_parsing = {
        tool: parsedQuery.tool,
        query_type: parsedQuery.query_type ?? 'complex',
        confidence: parsedQuery.confidence ?? 1.0,
        params: (parsedQuery.params ?? {}) as Record<string, unknown>,
        fallback_used: false,
        confidence_fallback: false,
      };
      // tool_selection trace：記錄信心分數和備選工具
      trace.tool_selection = {
        selected_tool: parsedQuery.tool,
        confidence: parsedQuery.confidence ?? 1.0,
        ...(parsedQuery.alternative ? { alternative: parsedQuery.alternative } : {}),
        fallback: { triggered: false },
      };
    }

    // 決定 queryType
    if (parsedQuery?.tool === 'general_knowledge') {
      ctx.queryType = 'general-knowledge';
      ctx.effectiveLlmModel = pipelineConfig.lightweight_model;
    } else if (parsedQuery?.tool === 'search_sql') {
      ctx.queryType = parsedQuery.query_type ?? 'sql';
      ctx.sqlTemplate = parsedQuery.template;
      ctx.sqlParams = parsedQuery.params as Record<string, unknown>;
      ctx.clarificationType = parsedQuery.clarification_type;
      ctx.effectiveLlmModel = pipelineConfig.lightweight_model;
    } else if (parsedQuery?.tool === 'hybrid') {
      ctx.queryType = 'hybrid';
      ctx.sqlParams = parsedQuery.params as Record<string, unknown>;
      ctx.effectiveLlmModel = llmModel; // hybrid 需要高品質 LLM 生成推薦回答
    } else if (parsedQuery?.tool === 'multi_tool') {
      // 驗證 multi_tool.steps 結構
      const mt = parsedQuery.multi_tool;
      const validToolNames = toolRegistry.getValidToolNames().filter((t) => t !== 'multi_tool' && t !== 'general_knowledge');
      if (mt?.steps && Array.isArray(mt.steps) && mt.steps.length > 0) {
        const validSteps = mt.steps
          .slice(0, 3)
          .filter((s) => s.tool && validToolNames.includes(s.tool));
        if (validSteps.length > 0) {
          ctx.queryType = 'multi-tool';
          ctx.multiToolPlan = {
            steps: validSteps.map((s) => ({
              tool: s.tool,
              purpose: s.purpose || '',
              query: s.query || query,
              params: s.params,
            })),
            execution_mode: mt.execution_mode === 'sequential' ? 'sequential' : 'parallel',
          };
          ctx.effectiveLlmModel = llmModel;
        } else {
          // 無有效步驟 → fallback 為 complex
          ctx.queryType = 'complex';
          ctx.effectiveLlmModel = llmModel;
        }
      } else {
        // 無 steps → fallback 為 complex
        ctx.queryType = 'complex';
        ctx.effectiveLlmModel = llmModel;
      }
    } else {
      // 安全網 1：個人查詢偵測
      if (PERSONAL_QUERY_PATTERN.test(query)) {
        ctx.queryType = 'sql';
        ctx.sqlTemplate = inferPersonalTemplate(query);
        ctx.sqlParams = {};
        ctx.effectiveLlmModel = pipelineConfig.lightweight_model;
        trace.query_parsing = { ...(trace.query_parsing ?? {}), personal_query_fallback: true };
      }
      // 安全網 2：SQL 計數/清單查詢（需已知岩場名稱）
      else {
        const sqlOverride = inferSqlQuery(query, cragNames);
        if (sqlOverride) {
          ctx.queryType = 'sql';
          ctx.sqlTemplate = sqlOverride.template;
          ctx.sqlParams = sqlOverride.params;
          ctx.effectiveLlmModel = pipelineConfig.lightweight_model;
          trace.query_parsing = { ...(trace.query_parsing ?? {}), sql_query_fallback: true };
        } else {
          ctx.queryType = parsedQuery?.query_type ?? 'complex';
          ctx.effectiveLlmModel = ctx.queryType === 'simple' ? pipelineConfig.simple_model : llmModel;
        }
      }
    }

    // 設定信心分數到 PipelineContext
    const confidence = parsedQuery?.confidence ?? 1.0;
    ctx.toolConfidence = confidence;
    ctx.alternativeTool = parsedQuery?.alternative;

    // auto 模式下解析 strategy_hint（LLM JSON 額外欄位，不在 ParsedQuery 型別中）
    if (pipelineConfig.rag_strategy === 'auto' && parsedQuery) {
      const VALID_HINTS = ['baseline', 'agentic', 'plan-execute'] as const;
      const raw = parsedQuery as unknown as Record<string, unknown>;
      const rawHint = raw['strategy_hint'];
      if (typeof rawHint === 'string' && (VALID_HINTS as readonly string[]).includes(rawHint)) {
        ctx.strategyHint = rawHint;
      }
    }

    // 設定 retrievalMethod
    if (parsedQuery?.retrieval_method) {
      const VALID_METHODS = ['vector', 'bm25', 'hybrid'] as const;
      if ((VALID_METHODS as readonly string[]).includes(parsedQuery.retrieval_method)) {
        ctx.retrievalMethod = parsedQuery.retrieval_method;
      }
    }

    // Confidence 三層邏輯（僅在非 regex 安全網觸發時適用）
    // 硬閾值：tool_confidence_threshold（預設 0.7），低於此值 → general_knowledge
    // 軟閾值：固定 0.8，介於硬閾值和 0.8 之間 → 啟用空結果 fallback
    const traceObj = trace.query_parsing as Record<string, unknown> | undefined;
    const regexUsed = traceObj?.personal_query_fallback || traceObj?.sql_query_fallback;
    if (!regexUsed && ctx.queryType !== 'general-knowledge') {
      const hardThreshold = pipelineConfig.tool_confidence_threshold;
      if (confidence < hardThreshold) {
        // 低信心：覆寫為 general_knowledge
        const originalTool = parsedQuery?.tool;
        ctx.queryType = 'general-knowledge';
        ctx.effectiveLlmModel = pipelineConfig.lightweight_model;
        if (ctx.parsedQuery) ctx.parsedQuery.tool = 'general_knowledge';
        if (traceObj) {
          traceObj.confidence_fallback = true;
          traceObj.original_tool = originalTool;
        }
      } else if (confidence < 0.8) {
        // 中等信心：啟用空結果 fallback
        ctx.fallbackEnabled = true;
      }
      // >= 0.8：直接使用，不做任何調整
    }

    return ctx;
  },
};
