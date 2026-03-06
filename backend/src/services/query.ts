import { Env, AIAskRequest, AIAskResponse, AISearchRequest, AISource, AIDocument, AIDocumentMetadata, ParsedQuery, AIChatMessage } from '../types';
import { EmbeddingService } from './embedding';
import { SYSTEM_PROMPT, QUERY_TEMPLATE, TOOL_SELECTION_PROMPT, HYDE_PROMPT, GENERAL_KNOWLEDGE_SYSTEM_PROMPT, JUDGE_PROMPT, SELF_REFLECTION_PROMPT, MULTI_QUERY_EXPANSION_PROMPT, AGENTIC_DECISION_PROMPT } from '../utils/ai-prompts';
import { checkOutput, DEFAULT_SYSTEM_PROMPT_LEAKAGE_PATTERNS } from '../utils/guardrails';
import { getMemoriesSummary } from '../repositories/memory';
import { getRecentAscents, buildAscentContext, estimateAbilityLevel, buildPersonalizedSystemPrompt } from './personalization';
import { extractMemoriesFromQuery } from './memory-extractor';

const CACHE_TTL = 3600; // 1 小時

// 解析 LLM 回應中的建議問題，回傳純回答與建議陣列
function parseSuggestedQuestions(raw: string): { answer: string; suggested_questions: string[] } {
  const SEP = '---SUGGESTIONS---';
  const idx = raw.indexOf(SEP);
  if (idx !== -1) {
    const rawAnswer = raw.slice(0, idx).trim();
    const suggestionsBlock = raw.slice(idx + SEP.length).trim();
    const suggested_questions = suggestionsBlock
      .split('\n')
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((line) => line.length > 0 && (line.endsWith('？') || line.endsWith('?')))
      .slice(0, 3);

    // 清理 answer 末尾模型多輸出的問句行（Gemma 3 有時在分隔符前就先列出問題）
    const answerLines = rawAnswer.split('\n');
    let cutIndex = answerLines.length;
    for (let i = answerLines.length - 1; i >= 0; i--) {
      const trimmed = answerLines[i].trim();
      if (trimmed === '') continue;
      const cleaned = trimmed.replace(/^\d+\.\s*/, '').trim();
      if (cleaned.endsWith('？') || cleaned.endsWith('?')) {
        cutIndex = i;
      } else {
        break;
      }
    }
    const answer = answerLines.slice(0, cutIndex).join('\n').trim();

    return { answer, suggested_questions };
  }

  // Fallback：模型未輸出分隔符時，偵測末尾連續問句行
  const lines = raw.trim().split('\n');
  const questions: string[] = [];
  let cutIndex = lines.length;

  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed === '') continue;
    const cleaned = trimmed.replace(/^\d+\.\s*/, '').trim();
    if (cleaned.endsWith('？') || cleaned.endsWith('?')) {
      questions.unshift(cleaned);
      cutIndex = i;
    } else {
      break;
    }
  }

  if (questions.length >= 2) {
    const answerLines = lines.slice(0, cutIndex);
    while (answerLines.length > 0 && answerLines[answerLines.length - 1].trim() === '') {
      answerLines.pop();
    }
    return { answer: answerLines.join('\n').trim(), suggested_questions: questions.slice(0, 3) };
  }

  return { answer: raw.trim(), suggested_questions: [] };
}
const DEFAULT_TOP_K = 5;
const MIN_VECTOR_SCORE = 0.5;         // 純語義搜尋（search()）的預設門檻，可透過 ai_config 覆蓋
const DEFAULT_LLM_MODEL = '@cf/google/gemma-3-12b-it';
const DEFAULT_LIGHTWEIGHT_MODEL = '@cf/meta/llama-3.1-8b-instruct';

// 從 ai_config 批次讀取所有 pipeline 設定（一次 DB 查詢，無 hardcode）
interface PipelineConfig {
  // 模型
  llm_model: string;
  simple_model: string;
  lightweight_model: string;
  // 搜尋與檢索
  max_results: number;
  merge_top_k: number;
  min_rrf_score: number;
  min_rrf_score_filtered: number;
  min_vector_score: number;
  // 排名與多樣性
  mmr_lambda: number;
  reranker_weight: number;
  popularity_weight: number;
  // Token 限制
  max_tokens_generation: number;
  max_tokens_gk: number;
  high_consumption_threshold: number;
  // 品質閾值
  groundedness_disclaimer_low: number;
  groundedness_disclaimer_mid: number;
  groundedness_flag_threshold: number;
  // Judge 設定
  judge_timeout_ms: number;
  judge_context_truncate: number;
  // 多輪對話中 assistant 歷史訊息的截斷長度（與 judge_context_truncate 是不同關注點）
  assistant_history_truncate: number;
  // Judge 驅動重生成：quality 等於或低於此值時重試（取代同模型 YES/NO 自評；1–4 量表）
  judge_regen_quality_max: number;
  // Self-reflection（最小觸發長度，控制重生成前的回答長度門檻）
  self_reflection_min_length: number;
  // 對話與快取
  chat_history_depth: number;
  cache_ttl: number;
  // 語義快取
  semantic_cache_enabled: boolean;
  semantic_cache_threshold: number;
  // BM25 混合搜尋
  bm25_top_k: number;
  // Multi-Query Expansion
  multi_query_count: number;
  // 防護設定
  max_output_length: number;
  system_prompt_leakage_patterns: string[];
  // Agentic 模式
  rag_strategy: string;               // 'baseline' | 'agentic'
  agentic_max_steps: number;          // 1–5
  agentic_min_docs_to_answer: number; // 1–10
}

function num(v: string | undefined, fallback: number, min?: number, max?: number): number {
  const parsed = v !== undefined && v !== '' ? parseFloat(v) : NaN;
  const result = Number.isNaN(parsed) ? fallback : parsed;
  if (min !== undefined && result < min) return min;
  if (max !== undefined && result > max) return max;
  return result;
}

async function loadPipelineConfig(db: D1Database): Promise<PipelineConfig> {
  const rows = await db.prepare(`SELECT key, value FROM ai_config`).all<{ key: string; value: string }>();
  const cfg: Record<string, string> = Object.fromEntries(rows.results.map((r) => [r.key, r.value]));
  return {
    // 模型
    llm_model:                    cfg['llm_model']                    ?? DEFAULT_LLM_MODEL,
    simple_model:                 cfg['simple_model']                 ?? DEFAULT_LIGHTWEIGHT_MODEL,
    lightweight_model:            cfg['lightweight_model']            ?? DEFAULT_LIGHTWEIGHT_MODEL,
    // 搜尋與檢索
    max_results:                  num(cfg['max_results'],                  5,    1,    20),
    merge_top_k:                  num(cfg['merge_top_k'],                  10,   5,    50),
    min_rrf_score:                num(cfg['min_rrf_score'],                0.005, 0,   1),
    min_rrf_score_filtered:       num(cfg['min_rrf_score_filtered'],       0.002, 0,   1),
    min_vector_score:             num(cfg['min_vector_score'],             0.5,   0,   1),
    // 排名與多樣性（reranker_weight + popularity_weight 自動歸一化，避免 admin 設定不當時分數異常）
    mmr_lambda:                   num(cfg['mmr_lambda'],                   0.6,  0,    1),
    ...(() => {
      const rw = num(cfg['reranker_weight'],   0.7, 0, 1);
      const pw = num(cfg['popularity_weight'], 0.3, 0, 1);
      const total = rw + pw;
      return total > 0
        ? { reranker_weight: rw / total, popularity_weight: pw / total }
        : { reranker_weight: 0.7, popularity_weight: 0.3 };
    })(),
    // Token 限制
    max_tokens_generation:        num(cfg['max_tokens_generation'],        800,  200,  2000),
    max_tokens_gk:                num(cfg['max_tokens_gk'],                600,  200,  2000),
    high_consumption_threshold:   num(cfg['high_consumption_threshold'],   1000, 100,  10000),
    // 品質閾值
    groundedness_disclaimer_low:  num(cfg['groundedness_disclaimer_low'],  0.6,  0,    1),
    groundedness_disclaimer_mid:  num(cfg['groundedness_disclaimer_mid'],  0.8,  0,    1),
    groundedness_flag_threshold:  num(cfg['groundedness_flag_threshold'],  0.5,  0,    1),
    // Judge
    judge_timeout_ms:             num(cfg['judge_timeout_ms'],             8000, 1000, 30000),
    judge_context_truncate:       num(cfg['judge_context_truncate'],       2000, 200,  5000),
    assistant_history_truncate:   num(cfg['assistant_history_truncate'],   500,  100,  2000),
    judge_regen_quality_max:      num(cfg['judge_regen_quality_max'],      2,    1,    3),
    // Self-reflection
    self_reflection_min_length:   num(cfg['self_reflection_min_length'],   50,   10,   500),
    // 對話與快取
    chat_history_depth:           num(cfg['chat_history_depth'],           6,    2,    20),
    cache_ttl:                    num(cfg['cache_ttl'],                    3600, 60,   86400),
    // 語義快取
    semantic_cache_enabled:       cfg['semantic_cache_enabled'] === '1',
    semantic_cache_threshold:     num(cfg['semantic_cache_threshold'],     0.95, 0.8,  1),
    // BM25 混合搜尋
    bm25_top_k:                   num(cfg['bm25_top_k'],                   10,   5,    50),
    // Multi-Query Expansion
    multi_query_count:            num(cfg['multi_query_count'],            3,    1,    5),
    // 防護設定
    max_output_length:            num(cfg['max_output_length'],            3000, 500,  10000),
    system_prompt_leakage_patterns: (() => {
      try {
        if (cfg['system_prompt_leakage_patterns']) {
          const parsed = JSON.parse(cfg['system_prompt_leakage_patterns']);
          if (Array.isArray(parsed)) return parsed as string[];
        }
      } catch { /* fallback */ }
      return DEFAULT_SYSTEM_PROMPT_LEAKAGE_PATTERNS;
    })(),
    // Agentic 模式
    rag_strategy:               cfg['rag_strategy']               ?? 'baseline',
    agentic_max_steps:          num(cfg['agentic_max_steps'],          3, 1, 5),
    agentic_min_docs_to_answer: num(cfg['agentic_min_docs_to_answer'], 3, 1, 10),
  };
}

interface LLMResponse {
  response: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

interface SearchResult {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

// Agentic Multi-Step RAG 型別
type AgenticActionType = 'ANSWER' | 'RETRIEVE' | 'BROADEN';
interface AgenticAction { type: AgenticActionType; refinedQuery?: string; }
interface AgenticStepTrace { step: number; type: AgenticActionType; refinedQuery?: string; }

export class QueryService {
  private embeddingService: EmbeddingService;

  constructor(private env: Env) {
    this.embeddingService = new EmbeddingService(env);
  }

  // 從 query 中偵測岩場區域/岩場/地區，接受預載資料避免重複查詢 DB
  // 優先序：area > crag（多個） > region
  private extractLocationFilter(
    query: string,
    crags: Array<{ id: string; name: string; region: string | null }>,
    areas: Array<{ id: string; name: string }>,
  ): { cragIds?: string[]; areaId?: string; region?: string } {
    // 1. 優先比對區域名稱（最精確，如「校門口」「鐘塔」）
    for (const area of areas) {
      if (query.includes(area.name)) {
        return { areaId: area.id };
      }
    }

    // 2. 比對岩場名稱（如「龍洞」「墾丁」），支援多岩場
    const matchedCragIds = crags.filter((c) => query.includes(c.name)).map((c) => c.id);
    if (matchedCragIds.length > 0) {
      return { cragIds: matchedCragIds };
    }

    // 3. 比對地區名稱（如「花蓮」「北部」）
    const regions = [...new Set(crags.map((c) => c.region).filter(Boolean))] as string[];
    for (const region of regions) {
      if (query.includes(region)) {
        return { region };
      }
    }

    return {};
  }

  // 從 query 文字中偵測 YDS 難度，回傳 Vectorize grade_numeric 範圍
  // 支援完整格式（5.12a）與縮寫格式（12a、12）
  extractGradeFilter(query: string): { $gte: number; $lte: number } | null {
    // 先比對完整 5.XX 格式，再比對縮寫 10-15 格式（如「12a」「11b」）
    const fullMatches = [...query.matchAll(/5\.(\d+)([a-d])?/gi)];
    const shortMatches = [...query.matchAll(/\b(1[0-5])([a-d])?\b/gi)].filter(
      (m) => !query.slice(Math.max(0, m.index! - 2), m.index!).includes('5.')
    );
    const allMatches = fullMatches.length > 0 ? fullMatches : shortMatches;
    if (allMatches.length === 0) return null;

    const numerics = allMatches.map((m) => {
      const base = parseInt(m[1], 10) * 10;
      const suffix = m[2] ? 'abcd'.indexOf(m[2].toLowerCase()) : 0;
      return base + suffix;
    });

    const min = Math.min(...numerics);
    const maxMatch = allMatches.reduce((prev, curr) => {
      const prevNum = parseInt(prev[1], 10) * 10 + (prev[2] ? 'abcd'.indexOf(prev[2].toLowerCase()) : 0);
      const currNum = parseInt(curr[1], 10) * 10 + (curr[2] ? 'abcd'.indexOf(curr[2].toLowerCase()) : 0);
      return currNum > prevNum ? curr : prev;
    });
    // 若最大值的 grade 沒有 a-d 後綴，擴展到 +3（含 a/b/c/d 子等級）
    const maxBase = parseInt(maxMatch[1], 10) * 10 + (maxMatch[2] ? 'abcd'.indexOf(maxMatch[2].toLowerCase()) : 0);
    const max = maxMatch[2] ? maxBase : maxBase + 3;

    return { $gte: min, $lte: max };
  }

  // 完整 RAG 流程（增強版）：
  // Stage 1（並行）：LLM A（Tool Calling）+ LLM B（HyDE）
  // Stage 2：決定 Vectorize filter（grade / crag / region）
  // Stage 3（並行）：embed(query) + embed(hydeDoc)
  // Stage 4（並行）：兩路 Vectorize 搜尋 → RRF 合併 → D1 fetch
  // Stage 5：Cross-encoder reranking（bge-reranker-base）
  // Stage 6：MMR 多樣性選取（λ=0.6）
  // Stage 7：熱門度加權排序 → LLM C 生成回答
  // Task 5.1: 加入 ctx 供 waitUntil 使用
  async ask(request: AIAskRequest, userId?: string, ctx?: { waitUntil(promise: Promise<unknown>): void }, onToken?: (token: string) => Promise<void>, extraTrace?: Record<string, unknown>): Promise<AIAskResponse> {
    const streamingMode = !!onToken;
    const { query, limit = DEFAULT_TOP_K, include_sources = true, chat_history, no_cache = false } = request;
    // extraTrace 包含 guardrails_input 和 quota_check（由 ai.ts 路由傳入）
    const trace: Record<string, unknown> = extraTrace ? { ...extraTrace } : {};

    // 有 chat_history 時帶入最近 6 則供 cache key hash 使用（LLM 實際使用量由 chat_history_depth 設定）
    const recentHistory: AIChatMessage[] = chat_history ? chat_history.slice(-6) : [];
    const historyHash = recentHistory.length > 0 ? `:h${this.hashQuery(recentHistory.map(m => m.content).join('|'))}` : '';

    // Task 5.3: 個人化 context（已登入用戶）
    let memorySummary: string | null = null;
    let ascentContext: string | null = null;
    let abilityLevel: number | null = null;
    if (userId) {
      const [memories, ascents] = await Promise.all([
        getMemoriesSummary(userId, this.env.DB),
        getRecentAscents(userId, this.env.DB),
      ]);
      memorySummary = memories;
      ascentContext = buildAscentContext(ascents);
      abilityLevel = estimateAbilityLevel(ascents);
    }

    // Task 5.2: 個人化快取鍵
    const personalizedContext = [memorySummary, ascentContext].filter(Boolean).join('|');
    const personalizedHash = personalizedContext ? `:p${this.hashQuery(personalizedContext)}` : '';
    const userPrefix = userId ? `${userId}:` : '';
    const cacheKey = `ai:ask:${userPrefix}${this.hashQuery(query)}${historyHash}${personalizedHash}`;
    const startTime = Date.now();
    if (!no_cache) {
      const cached = await this.env.CACHE.get(cacheKey);
      if (cached) {
        // 記錄快取命中日誌（非同步，不阻塞回應）
        this.logQuery({
          userId: userId ?? null,
          query,
          response: '',
          sources: [],
          latencyMs: Date.now() - startTime,
          tokenCount: 0,
          cacheHit: true,
        }).catch(() => {});
        return JSON.parse(cached) as AIAskResponse;
      }
    }

    // 匿名且無對話歷史的查詢才啟用語義快取（有 userId/history 時快取 key 含個人化 hash，不適合跨用戶命中）
    const isAnonymousNoHistory = !userId && recentHistory.length === 0 && !no_cache;

    // 批次讀取 pipeline 設定 + 提前 embed query（並行以降低延遲）
    // 僅匿名+無歷史查詢需要 earlyQueryVector（語義快取檢查 + Stage 3 提前完成）
    const [pipelineCfg, earlyQueryVector] = await Promise.all([
      loadPipelineConfig(this.env.DB),
      isAnonymousNoHistory
        ? this.embeddingService.embed(query)
        : Promise.resolve(null as number[] | null),
    ]);
    const llmModel = pipelineCfg.llm_model;
    const effectiveLimit = pipelineCfg.max_results; // admin 設定覆蓋 request limit
    const cacheTtl = pipelineCfg.cache_ttl;

    const gatewayOptions = this.env.AI_GATEWAY_SLUG
      ? { gateway: { id: this.env.AI_GATEWAY_SLUG } }
      : undefined;

    // 語義快取檢查（僅匿名且無對話歷史，避免個人化回答污染通用快取）
    if (pipelineCfg.semantic_cache_enabled && earlyQueryVector) {
      const semanticCached = await this.checkSemanticCache(earlyQueryVector, pipelineCfg.semantic_cache_threshold);
      if (semanticCached) {
        this.logQuery({
          userId: null, query, response: '', sources: [],
          latencyMs: Date.now() - startTime, tokenCount: 0, cacheHit: true,
        }).catch(() => {});
        return semanticCached;
      }
    }

    // Adaptive RAG：依查詢複雜度決定 pipeline 路徑與使用模型
    let queryType: 'simple' | 'complex' | 'general-knowledge' = 'complex';
    let effectiveLlmModel = llmModel; // 預設使用設定模型（complex），simple 時覆蓋為輕量模型

    // 優先路徑：相似路線推薦（「爬完X，推薦下一條」）
    // 需要從 DB 查出該路線的難度和岩場，不依賴 LLM A
    let vectorFilter: Record<string, unknown> = {};
    let hydeDoc = '';
    let expandedQueries: string[] = [];
    let excludeRouteId: string | null = null; // 排除來源路線本身
    let referenceRouteInfo: string | null = null; // 來源路線資訊，注入 context 讓 LLM 有正確難度
    let isSimRouteSearch = false; // 是否走「相似路線」流程，供後段 fallback 判斷
    // 預載岩場/區域資料（Stage 1a 填入），供 extractLocationFilter 共用，避免同一請求多次查 DB
    let preloadedCrags: Array<{ id: string; name: string; region: string | null }> = [];
    let preloadedAreas: Array<{ id: string; name: string }> = [];

    if (this.hasSimilarRouteIntent(query)) {
      isSimRouteSearch = true;
      // 並行：DB 查路線資訊 + HyDE 生成
      const [routeRef, hydeDocResult] = await Promise.all([
        this.extractRouteReference(query),
        this.generateHyDE(query, llmModel, gatewayOptions),
      ]);
      hydeDoc = hydeDocResult;

      if (routeRef) {
        // 優先同岩場 + 相近難度（±3 步，範圍更合理）
        // 不限制 route_type：向量搜尋本身已語意匹配，額外限制反而過嚴
        if (routeRef.cragId) vectorFilter['crag_id'] = { $eq: routeRef.cragId };
        if (routeRef.gradeNumeric > 0) {
          vectorFilter['grade_numeric'] = this.similarGradeRange(routeRef.gradeNumeric, 3);
        }
        vectorFilter['type'] = { $eq: 'route' };
        excludeRouteId = routeRef.routeId; // 記錄來源路線，後續排除
        // 記錄來源路線資訊，避免 LLM 猜錯難度
        const typeLabel = routeRef.routeType ? `，類型：${routeRef.routeType}` : '';
        referenceRouteInfo = `使用者剛爬完的路線：${routeRef.name}（難度：${routeRef.grade ?? '未知'}${typeLabel}）`;
      }
    } else {
      // Stage 1a：預載岩場/區域資料，供 LLM A prompt 注入 + extractLocationFilter 共用（避免重複查詢）
      const [cragsResult, areasResult] = await Promise.all([
        this.env.DB.prepare('SELECT id, name, region FROM crags WHERE name IS NOT NULL').all<{ id: string; name: string; region: string | null }>(),
        this.env.DB.prepare('SELECT id, name FROM areas WHERE name IS NOT NULL').all<{ id: string; name: string }>(),
      ]);
      preloadedCrags = cragsResult.results;
      preloadedAreas = areasResult.results;
      const cragNames = preloadedCrags.map((c) => c.name);
      const areaNames = preloadedAreas.map((a) => a.name);
      const regionNames = [...new Set(preloadedCrags.map((c) => c.region).filter(Boolean))] as string[];

      // Stage 1b：先執行 Tool Calling，再依 queryType 決定是否執行 HyDE（簡單查詢跳過）
      const parsedQuery = await this.parseQueryWithLLM(query, llmModel, cragNames, areaNames, regionNames, gatewayOptions);

      // 記錄 query_parsing trace
      if (parsedQuery) {
        trace.query_parsing = {
          tool: parsedQuery.tool,
          query_type: parsedQuery.query_type ?? 'complex',
          alternatives: ['search_routes', 'search_crags', 'general_knowledge'],
          params: (parsedQuery.params ?? {}) as Record<string, unknown>,
        };
      }

      // 決定 queryType：tool=general_knowledge 優先，否則從 parsedQuery.query_type 取得
      if (parsedQuery?.tool === 'general_knowledge') {
        queryType = 'general-knowledge';
        effectiveLlmModel = pipelineCfg.lightweight_model;
      } else {
        queryType = parsedQuery?.query_type ?? 'complex';
        effectiveLlmModel = queryType === 'simple' ? pipelineCfg.simple_model : llmModel;
      }

      // general_knowledge：直接跳過向量搜尋，用 LLM 通識能力回答
      if (parsedQuery?.tool === 'general_knowledge') {
        const gkPersonalized = buildPersonalizedSystemPrompt(memorySummary, ascentContext, abilityLevel, GENERAL_KNOWLEDGE_SYSTEM_PROMPT);
        const llmResult = (await this.env.AI.run(
          effectiveLlmModel,
          { messages: [{ role: 'system', content: gkPersonalized }, { role: 'user', content: query }], max_tokens: pipelineCfg.max_tokens_gk },
          gatewayOptions
        )) as LLMResponse;
        const rawAnswer = llmResult.response || '抱歉，無法生成回答，請稍後再試。';
        const { answer: rawGkAnswer, suggested_questions } = parseSuggestedQuestions(rawAnswer);
        const { output: gkFiltered, trace: gkOutputTrace } = checkOutput(rawGkAnswer, pipelineCfg.max_output_length, pipelineCfg.system_prompt_leakage_patterns);
        const answer = gkFiltered || '抱歉，無法生成回答，請稍後再試。';
        trace.guardrails_output = gkOutputTrace;
        const latencyMs = Date.now() - startTime;
        const estimatedTokens = Math.ceil((GENERAL_KNOWLEDGE_SYSTEM_PROMPT.length + query.length + answer.length) / 2);
        const gkTokenCount = llmResult.usage?.total_tokens ?? estimatedTokens;
        if (userId && ctx) {
          trace.memory_extraction = { triggered: true, async: true };
        } else {
          trace.memory_extraction = { triggered: false, async: false, reason: userId ? 'no_ctx' : 'anonymous' };
        }
        const queryId = await this.logQuery({ userId: userId ?? null, query, response: answer, sources: [], latencyMs, tokenCount: gkTokenCount, queryType: 'general-knowledge', modelUsed: effectiveLlmModel, retrievalScore: 0, selfReflectionTriggered: 0, isHighConsumption: gkTokenCount > pipelineCfg.high_consumption_threshold, hydeTriggered: false, pipelineTrace: Object.keys(trace).length > 0 ? JSON.stringify(trace) : undefined });
        const response: AIAskResponse = { answer, sources: [], query_id: queryId, suggested_questions };
        await this.env.CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: cacheTtl });
        if (userId && ctx) {
          const gkGatewayOpts = this.env.AI_GATEWAY_SLUG ? { gateway: { id: this.env.AI_GATEWAY_SLUG } } : undefined;
          ctx.waitUntil(extractMemoriesFromQuery(query, userId, this.env.DB, this.env.AI, gkGatewayOpts));
        }
        return response;
      }

      // Stage 1c：complex 查詢執行 HyDE + Multi-Query Expansion；simple 查詢跳過
      // agentic 模式不使用這兩個結果（agenticRetrieve 自行管理搜尋），跳過以節省 LLM 呼叫
      if (queryType === 'complex' && pipelineCfg.rag_strategy !== 'agentic') {
        [hydeDoc, expandedQueries] = await Promise.all([
          this.generateHyDE(query, llmModel, gatewayOptions),
          this.generateMultipleQueries(query, pipelineCfg.multi_query_count, llmModel, gatewayOptions),
        ]);
        if (hydeDoc) trace.hyde = { document: hydeDoc.slice(0, 300) };
        if (expandedQueries.length > 0) trace.multi_query = { queries: expandedQueries };
      }

      // Stage 2：決定過濾條件
      if (parsedQuery) {
        vectorFilter = await this.buildFiltersFromParsed(parsedQuery);
        // 補充保底：若 LLM 未抽取 grade，用 regex 補回（避免 Gemma 漏填難度）
        if (!vectorFilter['grade_numeric']) {
          const gradeFilter = this.extractGradeFilter(query);
          if (gradeFilter) vectorFilter['grade_numeric'] = gradeFilter;
        }
        // 補充保底：多岩場偵測（Tool Calling 只能抽一個岩場，若 regex 找到更多則升級為 $in）
        // 無論 Tool Calling 是否已設 crag_id，都重新偵測，以處理多岩場查詢
        const { cragIds, areaId, region } = this.extractLocationFilter(query, preloadedCrags, preloadedAreas);
        if (areaId && !vectorFilter['area_id']) {
          vectorFilter['area_id'] = { $eq: areaId };
        } else if (cragIds && cragIds.length > 1) {
          // 多岩場：直接覆蓋 Tool Calling 的單一 crag_id
          vectorFilter['crag_id'] = { $in: cragIds };
        } else if (cragIds && cragIds.length === 1 && !vectorFilter['crag_id']) {
          vectorFilter['crag_id'] = { $eq: cragIds[0] };
        } else if (region && !vectorFilter['crag_id'] && !vectorFilter['area_id'] && !vectorFilter['region']) {
          vectorFilter['region'] = { $eq: region };
        }
      } else {
        // Fallback：使用現有 regex 方法
        const gradeFilter = this.extractGradeFilter(query);
        const { cragIds, areaId, region } = this.extractLocationFilter(query, preloadedCrags, preloadedAreas);
        const typeFilter = this.extractTypeFilter(query);

        if (gradeFilter) vectorFilter['grade_numeric'] = gradeFilter;
        if (areaId) {
          vectorFilter['area_id'] = { $eq: areaId };
          vectorFilter['type'] = { $eq: 'route' };
        } else if (cragIds && cragIds.length > 0) {
          vectorFilter['crag_id'] = cragIds.length === 1 ? { $eq: cragIds[0] } : { $in: cragIds };
          if (typeFilter) vectorFilter['type'] = { $eq: typeFilter };
        } else if (region) {
          vectorFilter['region'] = { $eq: region };
          if (typeFilter) vectorFilter['type'] = { $eq: typeFilter };
        } else if (typeFilter) {
          vectorFilter['type'] = { $eq: typeFilter };
        }
      }
    }

    // 記錄 filter trace（isSimRouteSearch 路徑下 parsedQuery 為 null）
    trace.filter = {
      applied: vectorFilter,
      source: isSimRouteSearch ? 'sim_route' : (trace.query_parsing ? 'llm_parsed' : 'regex_fallback'),
    };

    // Context 補充：若 query 含指代詞（「附近」「還有」等）且 filter 無明確位置，
    // 從對話歷史的 user + assistant 訊息中補充 crag/region 來源
    const hasExplicitLocationFilter = !!(vectorFilter['crag_id'] || vectorFilter['area_id'] || vectorFilter['region']);
    if (!hasExplicitLocationFilter && recentHistory.length > 0 && this.isContextDependentQuery(query)) {
      const historyText = recentHistory.map((m) => m.content).join(' ');
      const historyLocation = this.extractLocationFilter(historyText, preloadedCrags, preloadedAreas);
      if (historyLocation.areaId) {
        vectorFilter['area_id'] = { $eq: historyLocation.areaId };
        vectorFilter['type'] = { $eq: 'route' };
      } else if (historyLocation.cragIds && historyLocation.cragIds.length > 0) {
        vectorFilter['crag_id'] = historyLocation.cragIds.length === 1
          ? { $eq: historyLocation.cragIds[0] }
          : { $in: historyLocation.cragIds };
        if (!vectorFilter['type']) vectorFilter['type'] = { $eq: 'route' };
      } else if (historyLocation.region) {
        vectorFilter['region'] = { $eq: historyLocation.region };
      } else {
        // 找不到岩場/地區名稱時，嘗試從歷史對話中的路線名稱反查所屬岩場
        const routeRef = await this.extractRouteReference(historyText);
        if (routeRef?.cragId) {
          vectorFilter['crag_id'] = { $eq: routeRef.cragId };
          if (!vectorFilter['type']) vectorFilter['type'] = { $eq: 'route' };
        }
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Stage 3–5：搜尋策略分支
    //   agentic + complex → agenticRetrieve()
    //   其他             → 現有 Stage 3–5（HyDE + Multi-Query + CRAG）
    // ──────────────────────────────────────────────────────────────────────────
    const retrievalStart = Date.now();
    let embeddingMs = 0;
    let retrievalScore = 0;
    let candidateMatches: SearchResult[];

    if (pipelineCfg.rag_strategy === 'agentic' && queryType === 'complex') {
      // E 方案：Agentic Multi-Step RAG
      const agenticSteps: AgenticStepTrace[] = [];
      candidateMatches = await this.agenticRetrieve(query, vectorFilter, pipelineCfg, agenticSteps);
      retrievalScore = candidateMatches.length > 0 ? Math.max(...candidateMatches.map((m) => m.score)) : 0;
      trace.agentic = {
        steps: agenticSteps,
        total_paths: agenticSteps.length + 1,
        final_doc_count: candidateMatches.length,
      };
    } else {
      // Baseline：Stage 3–5（現有程式碼不動）
      // Stage 3：embed(query) + embed(hydeDoc)
      // 匿名+無歷史查詢：queryVector 已提前計算（與 loadPipelineConfig 並行），直接復用，僅需 embed HyDE
      // 其他查詢：兩者並行計算
      const embedStart = Date.now();
      let queryVector: number[];
      let hydeVector: number[] | null = null;
      if (earlyQueryVector) {
        queryVector = earlyQueryVector;
        if (hydeDoc) {
          hydeVector = await this.embeddingService.embed(hydeDoc);
        }
      } else {
        const embedTasks: Promise<number[]>[] = [this.embeddingService.embed(query)];
        if (hydeDoc) {
          embedTasks.push(this.embeddingService.embed(hydeDoc));
        }
        const embedResults = await Promise.all(embedTasks);
        queryVector = embedResults[0];
        hydeVector = hydeDoc ? embedResults[1] : null;
      }
      // 擴展查詢向量（complex 才有，失敗靜默降級）
      let expandedVectors: number[][] = [];
      if (expandedQueries.length > 0) {
        expandedVectors = await this.embeddingService.embedBatch(expandedQueries);
        expandedVectors = expandedVectors.filter((v) => v.length > 0);
      }
      embeddingMs = Date.now() - embedStart;
      trace.embedding = {
        early_vector_reused: !!earlyQueryVector,
        hyde_embedded: !!hydeVector,
        expanded_count: expandedVectors.length,
      };

      // Stage 4（並行）：兩路 Vectorize 搜尋 + BM25
      // 多岩場（$in）時加大 topK，確保每個岩場都有足夠結果
      const cragFilter = vectorFilter['crag_id'] as { $in?: string[] } | undefined;
      const isMultiCrag = Array.isArray(cragFilter?.$in) && cragFilter.$in.length > 1;
      const MERGE_TOP_K = isMultiCrag ? Math.max(20, pipelineCfg.merge_top_k * 2) : pipelineCfg.merge_top_k;

      // HyDE filter 策略：
      // - 有 crag_id（相似路線意圖）→ 套用全部 filter（確保同岩場同難度）
      // - 其他情況 → 只套 type filter（讓語義搜尋有彈性）
      const hydeFilter: Record<string, unknown> =
        vectorFilter['crag_id'] || vectorFilter['area_id']
          ? { ...vectorFilter }                           // 相似路線：完整 filter
          : vectorFilter['type'] ? { type: vectorFilter['type'] } : {}; // 一般：只限 type

      // 擴展查詢只套 type filter（讓語義搜尋有彈性，不限岩場/難度）
      const expandedFilter = vectorFilter['type'] ? { type: vectorFilter['type'] } : undefined;

      const allSearchPromises: Promise<{ matches: SearchResult[] } | SearchResult[]>[] = [
        this.env.VECTOR_INDEX.query(queryVector, {
          topK: MERGE_TOP_K,
          returnMetadata: 'all',
          filter: Object.keys(vectorFilter).length > 0 ? vectorFilter : undefined,
        }),
        hydeVector
          ? this.env.VECTOR_INDEX.query(hydeVector, {
              topK: MERGE_TOP_K,
              returnMetadata: 'all',
              filter: Object.keys(hydeFilter).length > 0 ? hydeFilter : undefined,
            })
          : Promise.resolve({ matches: [] as SearchResult[] }),
        this.searchBM25(query, pipelineCfg.bm25_top_k),
        ...expandedVectors.map((vec) =>
          this.env.VECTOR_INDEX.query(vec, {
            topK: MERGE_TOP_K,
            returnMetadata: 'all',
            filter: expandedFilter,
          })
        ),
      ];

      const allResults = await Promise.all(allSearchPromises);
      const queryVecResult    = allResults[0] as { matches: SearchResult[] };
      const hydeVecResult     = allResults[1] as { matches: SearchResult[] };
      const bm25Matches       = allResults[2] as SearchResult[];
      const expandedVecResults = (allResults.slice(3) as { matches: SearchResult[] }[])
        .map((r) => r.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata })));

      let queryMatches: SearchResult[] = queryVecResult.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata }));
      let rawHydeMatches: SearchResult[] = hydeVector
        ? hydeVecResult.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata }))
        : [];

      // 相似路線 fallback：若同岩場搜尋無結果，放寬為全站相近難度搜尋
      // 讓使用者不被限制在同一岩場（例如難度太高岩場路線稀少的情況）
      if (isSimRouteSearch && queryMatches.length === 0 && vectorFilter['crag_id']) {
        const relaxedFilter: Record<string, unknown> = { type: { $eq: 'route' } };
        if (vectorFilter['grade_numeric']) relaxedFilter['grade_numeric'] = vectorFilter['grade_numeric'];

        const [fbQueryResult, fbHydeResult] = await Promise.all([
          this.env.VECTOR_INDEX.query(queryVector, { topK: MERGE_TOP_K, returnMetadata: 'all', filter: relaxedFilter }),
          hydeVector
            ? this.env.VECTOR_INDEX.query(hydeVector, { topK: MERGE_TOP_K, returnMetadata: 'all', filter: relaxedFilter })
            : Promise.resolve({ matches: [] as SearchResult[] }),
        ]);
        queryMatches = fbQueryResult.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata }));
        rawHydeMatches = fbHydeResult.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata }));
      }

      // 有 location 過濾（crag/area/region）但 primary 搜尋無結果時，
      // 不合併 HyDE 結果，避免引入不相關岩場/地區
      const hasLocationFilter = !!(vectorFilter['crag_id'] || vectorFilter['area_id'] || vectorFilter['region']);
      const hydeMatches = (hasLocationFilter && queryMatches.length === 0) ? [] : rawHydeMatches;

      // Stage 5：合併結果、過濾低分、取 D1 完整文件
      // 注意：先保留全部候選（最多 MERGE_TOP_K），熱門度重排後再截斷至 limit
      const mergedMatches = this.mergeResults([queryMatches, hydeMatches, bm25Matches, ...expandedVecResults], MERGE_TOP_K);
      const hasFilter = Object.keys(vectorFilter).some((k) => ['grade_numeric', 'crag_id', 'area_id', 'region', 'route_type'].includes(k));
      const minScore = hasFilter ? pipelineCfg.min_rrf_score_filtered : pipelineCfg.min_rrf_score;
      candidateMatches = mergedMatches.filter((m) => m.score >= minScore);

      // 記錄 retrieval score（RRF 過濾前最高分，供 CRAG 觸發後追蹤）
      retrievalScore = mergedMatches.length > 0 ? Math.max(...mergedMatches.map((m) => m.score)) : 0;

      // 記錄 retrieval trace（CRAG 觸發後再更新 crag_fallback）
      const tracePaths = ['query_vec'];
      if (hydeVector) tracePaths.push('hyde_vec');
      tracePaths.push('bm25');
      expandedVectors.forEach((_, i) => tracePaths.push(`expanded_${i}`));
      trace.retrieval = {
        paths: tracePaths,
        candidates_before_filter: mergedMatches.length,
        candidates_after_filter: candidateMatches.length,
        crag_fallback: false,
      };

      // CRAG（Corrective RAG）：若 RRF 過濾後無存活文件且有 grade_numeric 過濾，
      // 移除 grade filter 放寬搜尋範圍重試一次（location filter 保留）
      if (candidateMatches.length === 0 && vectorFilter['grade_numeric']) {
        const relaxedFilter = { ...vectorFilter };
        delete relaxedFilter['grade_numeric'];
        const retryResult = await this.env.VECTOR_INDEX.query(queryVector, {
          topK: MERGE_TOP_K,
          returnMetadata: 'all',
          filter: Object.keys(relaxedFilter).length > 0 ? relaxedFilter : undefined,
        });
        const retryMatches = retryResult.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata }));
        const retryMerged = this.mergeResults([retryMatches, bm25Matches], MERGE_TOP_K);
        candidateMatches = retryMerged.filter((m) => m.score >= minScore);
        if (candidateMatches.length > 0) {
          (trace.retrieval as Record<string, unknown>).crag_fallback = true;
        }
      }

      // CRAG 二階段：若移除 grade 後仍無結果且有 route_type 過濾，再一併移除 route_type
      if (candidateMatches.length === 0 && vectorFilter['route_type']) {
        const moreRelaxedFilter = { ...vectorFilter };
        delete moreRelaxedFilter['grade_numeric'];
        delete moreRelaxedFilter['route_type'];
        const retryResult2 = await this.env.VECTOR_INDEX.query(queryVector, {
          topK: MERGE_TOP_K,
          returnMetadata: 'all',
          filter: Object.keys(moreRelaxedFilter).length > 0 ? moreRelaxedFilter : undefined,
        });
        const retryMatches2 = retryResult2.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata }));
        const retryMerged2 = this.mergeResults([retryMatches2, bm25Matches], MERGE_TOP_K);
        candidateMatches = retryMerged2.filter((m) => m.score >= minScore);
        if (candidateMatches.length > 0) {
          (trace.retrieval as Record<string, unknown>).crag_fallback = true;
        }
      }
    } // end else (baseline)

    const documents = await this.getDocuments(candidateMatches.map((m) => m.id));

    // 排除來源路線本身（相似路線推薦不應推薦使用者剛爬完的那條）
    if (excludeRouteId) {
      for (const [embeddingId, doc] of documents) {
        if (doc.source_id === excludeRouteId) {
          documents.delete(embeddingId);
        }
      }
    }

    // Cross-encoder Reranking：用 bge-reranker-base 對候選文件重新評分
    // 候選數 > 1 時才值得呼叫（單一結果無需重排）
    let scoredCandidates = candidateMatches;
    const rerankCandidates = candidateMatches.filter((m) => documents.has(m.id));
    if (rerankCandidates.length > 1) {
      try {
        const contexts = rerankCandidates.map((m) => ({ text: documents.get(m.id)!.text }));
        const rerankerResult = await (this.env.AI.run as Function)(
          '@cf/baai/bge-reranker-base',
          { query, contexts }
        ) as { response: { id: number; score: number }[] };

        if (rerankerResult?.response?.length > 0) {
          const scoreByIdx = new Map(rerankerResult.response.map((r) => [r.id, r.score]));
          scoredCandidates = rerankCandidates.map((m, idx) => ({
            ...m,
            score: scoreByIdx.get(idx) ?? m.score,
          }));
        }
      } catch {
        // reranker 失敗時保留原始 vector score，不影響正常流程
      }
    }

    // MMR：從 cross-encoder 重排後的候選中，選出相關且多樣的 top-N
    // 避免回傳一堆難度/岩場完全相同的路線，提升結果多樣性
    // effectiveLimit 來自 ai_config.max_results，覆蓋 request limit 以讓 admin 設定生效
    const mmrSelected = this.applyMMR(scoredCandidates, documents, pipelineCfg.mmr_lambda, effectiveLimit);

    // 熱門度排序：依影片數為路線評分加權（combined = reranker*0.7 + popularity*0.3）
    // 在 MMR 選出的候選中加權，決定最終顯示順序
    const routeSourceIds = [...documents.values()]
      .filter((d) => d.type === 'route')
      .map((d) => d.source_id);

    const videoCountMap = new Map<string, number>();
    const latestVideoMap = new Map<string, string>(); // route_id → YouTube URL
    if (routeSourceIds.length > 0) {
      const placeholders = routeSourceIds.map(() => '?').join(', ');
      const [vcResult, latestVideoResult] = await Promise.all([
        this.env.DB.prepare(
          `SELECT route_id, COUNT(*) as cnt FROM route_videos WHERE route_id IN (${placeholders}) GROUP BY route_id`
        ).bind(...routeSourceIds).all<{ route_id: string; cnt: number }>(),
        this.env.DB.prepare(
          `SELECT rv.route_id, v.youtube_id
           FROM route_videos rv
           JOIN videos v ON rv.video_id = v.id
           WHERE rv.route_id IN (${placeholders}) AND v.youtube_id IS NOT NULL
           ORDER BY rv.route_id, COALESCE(v.published_at, rv.created_at) DESC`
        ).bind(...routeSourceIds).all<{ route_id: string; youtube_id: string }>(),
      ]);
      for (const row of vcResult.results) {
        videoCountMap.set(row.route_id, row.cnt);
      }
      // 每個路線只取最新一筆（已按 route_id, 日期 DESC 排序，取第一筆）
      const seenRoutes = new Set<string>();
      for (const row of latestVideoResult.results) {
        if (!seenRoutes.has(row.route_id)) {
          latestVideoMap.set(row.route_id, `https://youtube.com/watch?v=${row.youtube_id}`);
          seenRoutes.add(row.route_id);
        }
      }
    }

    const maxVideoCount = videoCountMap.size > 0 ? Math.max(...videoCountMap.values()) : 1;
    const safeMax = Math.max(maxVideoCount, 1);

    const rerankedMatches = mmrSelected
      .map((match) => {
        const doc = documents.get(match.id);
        if (!doc || doc.type !== 'route') return { ...match, finalScore: match.score };
        const videoCount = videoCountMap.get(doc.source_id) ?? 0;
        const normalizedPop = videoCount / safeMax;
        return { ...match, finalScore: match.score * pipelineCfg.reranker_weight + normalizedPop * pipelineCfg.popularity_weight };
      })
      .sort((a, b) => b.finalScore - a.finalScore);
    // MMR 已限制至 limit，不需再 slice

    // 組合 sources（依熱門度重排後的順序）
    const sources: AISource[] = rerankedMatches
      .map((match) => {
        const doc = documents.get(match.id);
        if (!doc) return null;
        return {
          id: doc.source_id,
          type: doc.type,
          title: this.extractTitle(doc),
          excerpt: this.buildExcerpt(doc),
          url: this.buildUrl(doc),
          score: match.finalScore,
          latestVideoUrl: doc.type === 'route' ? latestVideoMap.get(doc.source_id) : undefined,
        } as AISource;
      })
      .filter((s): s is AISource => s !== null);

    const retrievalMs = Date.now() - retrievalStart;

    // Stage 6：LLM C 生成回答（依熱門度重排，context 順序影響 LLM 生成品質）
    const orderedDocs = rerankedMatches
      .map((m) => documents.get(m.id))
      .filter((d): d is AIDocument => d !== undefined);

    const docsText = orderedDocs.length > 0
      ? orderedDocs.map((d) => {
          if (d.type === 'route') {
            const videoCount = videoCountMap.get(d.source_id) ?? 0;
            const latestVideoUrl = latestVideoMap.get(d.source_id);
            let text = d.text;
            // 加入路線 URL，供 LLM 在回答中產生連結
            const meta = d.metadata ? (JSON.parse(d.metadata) as AIDocumentMetadata) : {} as AIDocumentMetadata;
            if (meta.crag_id) {
              text += `\n路線連結：/crag/${meta.crag_id}/route/${d.source_id}`;
            }
            if (videoCount > 0) {
              text += `\n影片數量：${videoCount}`;
            }
            return text;
          }
          return d.text;
        }).join('\n\n---\n\n')
      : '目前沒有找到相關資料。';

    // 若是相似路線推薦，在 context 開頭加入來源路線資訊，避免 LLM 猜測難度
    const context = referenceRouteInfo
      ? `${referenceRouteInfo}\n\n以下是相近難度的推薦路線：\n\n${docsText}`
      : docsText;

    const prompt = QUERY_TEMPLATE
      .replace('{context}', context)
      .replace('{query}', query);

    // 將對話歷史（最多 chat_history_depth 則）加入 LLM messages，讓 LLM 有記憶脈絡
    // assistant 歷史訊息只取純文字（截斷 assistant_history_truncate 字），避免超過 context window
    const historyLLMMessages = recentHistory.slice(-pipelineCfg.chat_history_depth).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.role === 'assistant' ? m.content.slice(0, pipelineCfg.assistant_history_truncate) : m.content,
    }));

    // 記錄 generation trace（regen_triggered 由重生成流程更新）
    trace.generation = {
      context_doc_count: orderedDocs.length,
      personalized: !!userId,
      regen_triggered: false,
    };

    const generationStart = Date.now();
    // Task 5.4: 使用個人化 system prompt
    const personalizedSystemPrompt = buildPersonalizedSystemPrompt(memorySummary, ascentContext, abilityLevel);
    const llmMessages = [
      { role: 'system' as const, content: personalizedSystemPrompt },
      ...historyLLMMessages,
      { role: 'user' as const, content: prompt },
    ];
    let rawLLMAnswer: string;
    let llmUsage: LLMResponse['usage'] | undefined;
    if (streamingMode) {
      // 真串流：Stage 1-6 完成後立即開始推送 token，大幅降低 TTFT
      rawLLMAnswer = await this.streamLLMGeneration(effectiveLlmModel, llmMessages, pipelineCfg.max_tokens_generation, gatewayOptions, onToken!);
    } else {
      const llmResult = (await (this.env.AI.run as Function)(
        effectiveLlmModel,
        { messages: llmMessages, max_tokens: pipelineCfg.max_tokens_generation },
        gatewayOptions
      )) as LLMResponse;
      rawLLMAnswer = llmResult.response || '抱歉，無法生成回答，請稍後再試。';
      llmUsage = llmResult.usage;
    }

    let { answer: parsedAnswer, suggested_questions } = parseSuggestedQuestions(rawLLMAnswer);
    // 防護：parseSuggestedQuestions 可能因 LLM 回傳空字串或全為問句而產生空 answer
    if (!parsedAnswer) {
      parsedAnswer = '抱歉，目前無法生成回答，請換個方式提問或稍後再試。';
    }
    const generationMs = Date.now() - generationStart;
    const latencyMs = Date.now() - startTime;

    let selfReflectionTriggered = 0;
    const cannotAnswer =
      parsedAnswer.includes('超出我的知識範圍') ||
      parsedAnswer.includes('找不到相關資訊') ||
      parsedAnswer.includes('找不到符合條件') ||
      parsedAnswer.includes('找不到相關路線') ||
      parsedAnswer.includes('無法提供任何推薦或建議');

    const finalSources = cannotAnswer ? [] : sources;

    // 後處理：將路線名稱注入 markdown 連結（不依賴 LLM 是否遵守格式指令）
    let answer = !cannotAnswer && finalSources.length > 0
      ? this.injectRouteLinks(parsedAnswer, finalSources)
      : parsedAnswer;

    // Judge 評估：非串流同步執行，結果同時用於：
    //   1. Judge 驅動重生成（取代同模型 YES/NO 自評，消除盲點問題）
    //   2. 免責聲明注入（groundedness）
    //   3. 查詢日誌記錄
    // 串流模式：token 已推送無法替換，Judge 改為 waitUntil 異步執行（僅記錄日誌）
    let groundedness: number | null = null;
    let quality: number | null = null;
    if (!streamingMode) {
      // 傳 parsedAnswer（未注入連結）給 Judge，避免 markdown URL 干擾 groundedness 評估
      ({ groundedness, quality } = await this.runJudge(query, context, parsedAnswer, { model: pipelineCfg.lightweight_model, timeoutMs: pipelineCfg.judge_timeout_ms, contextTruncate: pipelineCfg.judge_context_truncate }));

      // Judge 驅動重生成：quality 低於門檻時用外部 critic 的分數觸發重試（最多 1 次）
      // 條件：非 cannotAnswer、回答夠長（避免短回答無意義評估）、queryType 為 complex
      // Strategy E：重生成後再跑一次 Judge，比較 groundedness 取較高者，避免退化替換
      if (
        quality !== null &&
        quality <= pipelineCfg.judge_regen_quality_max &&
        queryType === 'complex' &&
        !cannotAnswer &&
        parsedAnswer.length >= pipelineCfg.self_reflection_min_length
      ) {
        try {
          selfReflectionTriggered = 1;
          (trace.generation as Record<string, unknown>).regen_triggered = true;
          const retryResult = (await (this.env.AI.run as Function)(
            effectiveLlmModel,
            { messages: llmMessages, max_tokens: pipelineCfg.max_tokens_generation },
            gatewayOptions
          )) as LLMResponse;
          const retryParsed = parseSuggestedQuestions(retryResult.response ?? rawLLMAnswer);
          const regenAnswer = !cannotAnswer && finalSources.length > 0
            ? this.injectRouteLinks(retryParsed.answer, finalSources)
            : retryParsed.answer;

          // 對重生成答案執行 Judge（傳 parsedAnswer，未注入連結），比較 groundedness 取較高者
          const regenJudge = await this.runJudge(query, context, retryParsed.answer, {
            model: pipelineCfg.lightweight_model,
            timeoutMs: pipelineCfg.judge_timeout_ms,
            contextTruncate: pipelineCfg.judge_context_truncate,
          });
          trace.self_reflection = {
            original_quality: quality,
            original_groundedness: groundedness,
            regen_quality: regenJudge.quality,
            regen_groundedness: regenJudge.groundedness,
            regen_accepted: (regenJudge.groundedness ?? 0) > (groundedness ?? 0),
          };

          if ((regenJudge.groundedness ?? 0) > (groundedness ?? 0)) {
            // 重生成品質更好，採用新答案並更新 Judge 分數
            parsedAnswer = retryParsed.answer;
            suggested_questions = retryParsed.suggested_questions;
            answer = regenAnswer;
            groundedness = regenJudge.groundedness;
            quality = regenJudge.quality;
          }
          // 否則靜默保留原始回答（原 groundedness/quality 分數不變）
        } catch {
          // 重生成或 Judge 失敗時靜默保留原始回答
        }
      }

      // 依 groundedness 分數注入免責聲明（閾值由 ai_config 設定；使用初次 Judge 分數，保守策略）
      if (groundedness !== null && !cannotAnswer) {
        if (groundedness < pipelineCfg.groundedness_disclaimer_low) {
          answer = `❓ 以下資訊基於現有資料推斷，建議實地確認\n\n${answer}`;
        } else if (groundedness < pipelineCfg.groundedness_disclaimer_mid) {
          answer = `⚠️ 部分資訊來自推斷，建議實地確認\n\n${answer}`;
        }
      }
    }

    // 輸出層防護：過濾 system prompt leakage、PII，截斷過長回應
    const { output: filteredAnswer, trace: outputTrace } = checkOutput(answer, pipelineCfg.max_output_length, pipelineCfg.system_prompt_leakage_patterns);
    answer = filteredAnswer;
    trace.guardrails_output = outputTrace;

    // Workers AI binding 不回傳 usage，用字元長度估算 token 數
    // 中英混合約每 2 字元 = 1 token；串流模式無 usage 物件，一律用估算值
    const estimatedTokens = Math.ceil(
      (SYSTEM_PROMPT.length + prompt.length + answer.length) / 2
    );
    const tokenCount = llmUsage?.total_tokens ?? estimatedTokens;

    // 記錄查詢日誌（含品質指標與分段延遲）
    const queryId = await this.logQuery({
      userId: userId ?? null,
      query,
      response: answer,
      sources: include_sources ? finalSources : [],
      latencyMs,
      tokenCount,
      groundednessScore: groundedness,
      autoScore: quality,
      embeddingMs,
      retrievalMs,
      generationMs,
      queryType,
      modelUsed: effectiveLlmModel,
      retrievalScore,
      selfReflectionTriggered,
      isHighConsumption: tokenCount > pipelineCfg.high_consumption_threshold,
      hydeTriggered: hydeDoc !== '',
      pipelineTrace: Object.keys(trace).length > 0 ? JSON.stringify(trace) : undefined,
    });

    // 非串流：低 groundedness 同步標記
    if (!streamingMode && groundedness !== null && groundedness < pipelineCfg.groundedness_flag_threshold) {
      await this.flagResponse(queryId, 'low_groundedness');
    }

    const response: AIAskResponse = {
      answer,
      sources: include_sources ? finalSources : [],
      query_id: queryId,
      suggested_questions,
    };

    // 快取結果
    await this.env.CACHE.put(cacheKey, JSON.stringify(response), {
      expirationTtl: cacheTtl,
    });

    if (ctx) {
      // 語義快取寫入（匿名+無歷史，異步不阻塞）
      // vector ID 用 sc: 前綴區分路線/岩場向量；metadata 記錄 KV cache key 供命中時直接取值
      if (pipelineCfg.semantic_cache_enabled && earlyQueryVector) {
        ctx.waitUntil(this.storeSemanticCache(`sc:${this.hashQuery(query)}`, earlyQueryVector, cacheKey));
      }
      // 串流模式：Judge 異步執行，不阻塞 done 事件；完成後更新日誌分數並標記
      if (streamingMode) {
        ctx.waitUntil((async () => {
          // 傳 parsedAnswer（未注入連結）給 Judge，避免 markdown URL 干擾 groundedness 評估
          const { groundedness: gs, quality: ql } = await this.runJudge(
            query, context, parsedAnswer,
            { model: pipelineCfg.lightweight_model, timeoutMs: pipelineCfg.judge_timeout_ms, contextTruncate: pipelineCfg.judge_context_truncate }
          );
          if (gs !== null || ql !== null) {
            await this.env.DB.prepare(
              `UPDATE ai_query_logs SET groundedness_score = ?, auto_score = ? WHERE id = ?`
            ).bind(gs, ql, queryId).run().catch(() => {});
          }
          if (gs !== null && gs < pipelineCfg.groundedness_flag_threshold) {
            await this.flagResponse(queryId, 'low_groundedness');
          }
        })());
      }

      // Task 5.5: 非同步記憶提取（只對已登入用戶，只傳 query）
      if (userId) {
        trace.memory_extraction = { triggered: true, async: true };
        const gatewayOpts = this.env.AI_GATEWAY_SLUG
          ? { gateway: { id: this.env.AI_GATEWAY_SLUG } }
          : undefined;
        ctx.waitUntil(
          extractMemoriesFromQuery(query, userId, this.env.DB, this.env.AI, gatewayOpts)
        );
      } else {
        trace.memory_extraction = { triggered: false, async: false, reason: 'anonymous' };
      }
    }

    return response;
  }

  // SSE 串流問答：真串流實作，LLM C 開始生成即推送 token，大幅降低 TTFT
  // route handler 負責在此方法回傳後送出 done 事件（含 quota_remaining）
  async askStream(
    request: AIAskRequest,
    userId: string | undefined,
    write: (data: string) => Promise<void>,
    ctx?: { waitUntil(promise: Promise<unknown>): void },
    extraTrace?: Record<string, unknown>,
  ): Promise<AIAskResponse> {
    const onToken = async (token: string) => {
      await write(JSON.stringify({ type: 'token', token }));
    };
    try {
      return await this.ask(request, userId, ctx, onToken, extraTrace);
    } catch (error) {
      await write(JSON.stringify({ type: 'error', message: '抱歉，AI 服務暫時無法使用，請稍後再試。' }));
      throw error;
    }
  }

  // 純語義搜尋（不呼叫 LLM）
  async search(request: AISearchRequest): Promise<{ results: AISource[]; count: number }> {
    const { query, limit = DEFAULT_TOP_K } = request;

    const [queryVector, cfg] = await Promise.all([
      this.embeddingService.embed(query),
      loadPipelineConfig(this.env.DB),
    ]);
    const filter = this.buildFilter(request);

    const searchResults = await this.env.VECTOR_INDEX.query(queryVector, {
      topK: Math.min(limit, 50),
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      returnMetadata: 'all',
    });

    const relevantMatches = searchResults.matches.filter((m) => m.score >= cfg.min_vector_score);
    const documents = await this.getDocuments(relevantMatches.map((m) => m.id));

    const results: AISource[] = relevantMatches
      .map((match) => {
        const doc = documents.get(match.id);
        if (!doc) return null;
        return {
          id: doc.source_id,
          type: doc.type,
          title: this.extractTitle(doc),
          excerpt: this.buildExcerpt(doc),
          url: this.buildUrl(doc),
          score: match.score,
        } as AISource;
      })
      .filter((s): s is AISource => s !== null);

    return { results, count: results.length };
  }

  // 建立 Vectorize metadata 過濾條件
  buildFilter(request: AISearchRequest): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (request.type) {
      filter['type'] = { $eq: request.type };
    }
    if (request.filters?.crag_id) {
      filter['crag_id'] = { $eq: request.filters.crag_id };
    }
    if (request.filters?.route_type) {
      filter['route_type'] = { $eq: request.filters.route_type };
    }
    if (request.filters?.grade_min !== undefined || request.filters?.grade_max !== undefined) {
      const gradeFilter: Record<string, number> = {};
      if (request.filters?.grade_min !== undefined) {
        gradeFilter['$gte'] = request.filters.grade_min;
      }
      if (request.filters?.grade_max !== undefined) {
        gradeFilter['$lte'] = request.filters.grade_max;
      }
      filter['grade_numeric'] = gradeFilter;
    }

    return filter;
  }

  // YDS 等級轉數值（5.12a → 120，與 IndexingService 一致）
  private gradeToNumeric(grade: string | null): number {
    if (!grade) return 0;
    const match = grade.match(/5\.(\d+)([a-d])?/);
    if (!match) return 0;
    const base = parseInt(match[1], 10) * 10;
    const suffix = match[2] ? 'abcd'.indexOf(match[2]) : 0;
    return base + suffix;
  }

  // grade_numeric ↔ 連續 position 互轉（消除大等級間的跳躍 gap）
  // 5.10d(103)=43, 5.11a(110)=44，在 position 上相鄰
  private gradeToPosition(numeric: number): number {
    return Math.floor(numeric / 10) * 4 + (numeric % 10);
  }

  private positionToGrade(position: number): number {
    const major = Math.floor(position / 4);
    const sub = position % 4;
    return major * 10 + sub;
  }

  // 取得「差不多難度」的 grade_numeric 範圍（連續序列中 ±steps）
  private similarGradeRange(gradeNumeric: number, steps = 2): { $gte: number; $lte: number } {
    const pos = this.gradeToPosition(gradeNumeric);
    return {
      $gte: this.positionToGrade(Math.max(0, pos - steps)),
      $lte: this.positionToGrade(pos + steps),
    };
  }

  // 偵測 query 是否有「推薦相似/類似路線」意圖
  private hasSimilarRouteIntent(query: string): boolean {
    return ['差不多', '類似', '相似', '爬完', '爬過', '爬了', 'rp', 'RP', 'redpoint', 'red point'].some((k) => query.includes(k));
  }

  // 偵測 query 是否含有指代前文的 context-dependent 詞（需從對話歷史補充位置）
  private isContextDependentQuery(query: string): boolean {
    return ['附近', '那裡', '那邊', '這裡', '這邊', '這個岩場', '該岩場', '同岩場', '繼續', '再推薦', '還有', '還有哪些', '更多'].some((k) => query.includes(k));
  }

  // 若 query 提到已知路線名稱，回傳該路線的難度數值、所屬岩場、路線 ID、名稱、難度字串（用於相似路線過濾及 LLM 參考）
  // 按名稱長度由長到短比對，優先匹配更精確的路線名
  // 支援縮寫：若完整名稱比對失敗，嘗試路線名後綴部分匹配（如「天藍」→「天天天藍」）
  async extractRouteReference(query: string): Promise<{
    gradeNumeric: number;
    cragId: string | null;
    routeId: string;
    name: string;
    grade: string | null;
    routeType: string | null;
  } | null> {
    const routes = await this.env.DB.prepare(
      'SELECT id, name, grade, crag_id, route_type FROM routes WHERE name IS NOT NULL ORDER BY LENGTH(name) DESC'
    ).all<{ id: string; name: string; grade: string | null; crag_id: string | null; route_type: string | null }>();

    const toMatch = (route: { id: string; name: string; grade: string | null; crag_id: string | null; route_type: string | null }) => ({
      gradeNumeric: this.gradeToNumeric(route.grade),
      cragId: route.crag_id,
      routeId: route.id,
      name: route.name,
      grade: route.grade,
      routeType: route.route_type,
    });

    // 第一輪：完整路線名稱精確比對
    for (const route of routes.results) {
      if (route.name.length >= 2 && query.includes(route.name)) {
        return toMatch(route);
      }
    }

    // 第二輪：後綴縮寫比對（如使用者說「天藍」，路線名為「天天天藍」）
    // 只對 3 字以上的路線名嘗試，最短取 name 長度一半的後綴，避免誤配
    for (const route of routes.results) {
      if (route.name.length < 3) continue;
      const minLen = Math.ceil(route.name.length / 2);
      for (let len = route.name.length - 1; len >= minLen; len--) {
        const suffix = route.name.slice(-len);
        if (query.includes(suffix)) {
          return toMatch(route);
        }
      }
    }

    return null;
  }

  // 從 query 文字偵測使用者意圖，回傳適合的文件類型過濾（'crag' | 'route' | null）
  // 原則：若明確詢問岩場資訊（無路線意圖） → 'crag'；明確詢問路線 → 'route'；混合/不明 → null
  extractTypeFilter(query: string): 'crag' | 'route' | null {
    const cragKeywords = ['岩場', '攀岩場', '岩區', '岩壁', '介紹', '哪些岩場', '台灣岩場'];
    const routeKeywords = ['路線', '幾條', '多少條', '5.', 'V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', '難度', '幾級', '幾b', '幾c'];

    const hasCragIntent = cragKeywords.some((k) => query.includes(k));
    const hasRouteIntent = routeKeywords.some((k) => query.includes(k));

    if (hasCragIntent && !hasRouteIntent) return 'crag';
    if (hasRouteIntent && !hasCragIntent) return 'route';
    return null;
  }

  // 從 D1 批次取得文件
  async getDocuments(ids: string[]): Promise<Map<string, AIDocument>> {
    const result = new Map<string, AIDocument>();
    if (ids.length === 0) return result;

    const placeholders = ids.map(() => '?').join(', ');
    const docs = await this.env.DB.prepare(
      `SELECT * FROM ai_documents WHERE embedding_id IN (${placeholders})`
    )
      .bind(...ids)
      .all<AIDocument>();

    for (const doc of docs.results) {
      result.set(doc.embedding_id ?? doc.id, doc);
    }
    return result;
  }

  // 從文件中提取標題；無中文名稱時 fallback 到 name_en
  extractTitle(doc: AIDocument): string {
    const firstLine = doc.text.split('\n')[0];
    const name = firstLine.replace(/^路線名稱：|^岩場名稱：/, '').trim();
    if (name) return name;
    // 路線名稱空白時，嘗試從 metadata 取 name / name_en，否則用 source_id
    if (doc.metadata) {
      try {
        const meta = JSON.parse(doc.metadata) as AIDocumentMetadata;
        if (meta.name) return meta.name;
        if (meta.name_en) return meta.name_en;
      } catch { /* ignore */ }
    }
    return doc.source_id;
  }

  // 路線類型英文 → 中文顯示名稱
  private routeTypeLabel(type: string): string {
    const map: Record<string, string> = {
      sport: '運攀',
      trad: '傳攀',
      boulder: '抱石',
      mixed: '混合',
    };
    return map[type.toLowerCase()] ?? type;
  }

  // 從文件欄位建立清晰的來源摘要
  // 路線：「岩場 · 難度 · 類型」；其他：原始文字截斷
  buildExcerpt(doc: AIDocument): string {
    if (doc.type === 'route') {
      const fieldMap: Record<string, string> = {};
      for (const line of doc.text.split('\n')) {
        const match = line.match(/^([^：\n]+)：(.+)$/);
        if (match) fieldMap[match[1].trim()] = match[2].trim();
      }
      const parts: string[] = [];
      if (fieldMap['所屬岩場']) parts.push(fieldMap['所屬岩場']);
      if (fieldMap['難度等級']) parts.push(fieldMap['難度等級']);
      if (fieldMap['攀登類型']) parts.push(this.routeTypeLabel(fieldMap['攀登類型']));
      if (fieldMap['岩場區域']) parts.push(fieldMap['岩場區域']);
      if (parts.length > 0) return parts.join(' · ');
    }
    return doc.text.slice(0, 120).replace(/\n/g, ' ');
  }

  // 依文件類型建立 URL
  buildUrl(doc: AIDocument): string | undefined {
    if (doc.type === 'route') {
      const meta = doc.metadata ? (JSON.parse(doc.metadata) as AIDocumentMetadata) : {};
      if (meta.crag_id) {
        return `/crag/${meta.crag_id}/route/${doc.source_id}`;
      }
      return undefined;
    }
    if (doc.type === 'crag') {
      return `/crag/${doc.source_id}`;
    }
    if (doc.type === 'video') {
      const meta = doc.metadata ? (JSON.parse(doc.metadata) as AIDocumentMetadata) : {};
      if (meta.youtube_id) {
        return `https://youtube.com/watch?v=${meta.youtube_id}`;
      }
    }
    return undefined;
  }

  // LLM 回答後處理：將已知路線名稱替換為 markdown 連結，並於第一次出現時附上影片連結
  // 依名稱長度由長到短排序，避免短名稱提前匹配到長名稱的一部分
  private injectRouteLinks(text: string, sources: AISource[]): string {
    let result = text;
    const routeSources = sources
      .filter((s) => s.type === 'route' && s.url && s.title)
      .sort((a, b) => b.title.length - a.title.length);

    for (const source of routeSources) {
      const name = source.title;
      const url = source.url!;
      // 1. **name** → [**name**](routeUrl)，第一次出現附上影片連結，之後只替換連結
      const videoSuffix = source.latestVideoUrl ? ` [觀看影片](${source.latestVideoUrl})` : '';
      let firstReplace = true;
      result = result.replace(
        new RegExp(`\\*\\*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*\\*`, 'g'),
        () => {
          const replacement = firstReplace
            ? `[**${name}**](${url})${videoSuffix}`
            : `[**${name}**](${url})`;
          firstReplace = false;
          return replacement;
        }
      );

      // 2. 純文字 name → [name](url)（排除已在連結內的）
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(
        new RegExp(`(?<!\\[\\*\\*|\\[)${escaped}(?!\\*\\*\\]|\\])`, 'g'),
        `[${name}](${url})`
      );
    }
    return result;
  }

  // 解析 judge LLM 回傳的 JSON，容錯處理格式錯誤
  // Fallback：llama 等模型可能忽略 JSON-only 指令，改用自然語言回答，嘗試從中萃取數值
  parseJudgeResponse(raw: string): { groundedness: number | null; quality: number | null } {
    // 0. 模型直接輸出模板占位符（如 <float 0.0-1.0>）視為無效，回傳 null
    if (raw.includes('<float') || raw.includes('<int')) {
      return { groundedness: null, quality: null };
    }

    // 1. 嘗試 JSON 解析
    try {
      const jsonMatch = raw.match(/\{[^}]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const groundedness = typeof parsed.groundedness === 'number' && parsed.groundedness >= 0 && parsed.groundedness <= 1
          ? parsed.groundedness : null;
        const quality = typeof parsed.quality === 'number' && Number.isInteger(parsed.quality) && parsed.quality >= 1 && parsed.quality <= 4
          ? parsed.quality : null;
        if (groundedness !== null || quality !== null) return { groundedness, quality };
      }
    } catch { /* fall through to natural language parsing */ }

    // 2. Fallback：自然語言萃取（如 "groundedness：0.8" 或 "quality: 3"）
    let groundedness: number | null = null;
    let quality: number | null = null;
    const gMatch = raw.match(/groundedness[^0-9]*([0-9]+(?:\.[0-9]+)?)/i);
    if (gMatch) {
      const g = parseFloat(gMatch[1]);
      // 確保萃取到的是合理範圍的浮點數（非模板殘留如 "0.0-1.0" 中的 0）
      if (g >= 0 && g <= 1) groundedness = g;
    }
    const qMatch = raw.match(/quality[^1-4]*([1-4])(?![0-9])/i);
    if (qMatch) {
      quality = parseInt(qMatch[1], 10);
    }
    return { groundedness, quality };
  }

  // 語義快取查詢：用 queryVector 在 VECTOR_INDEX 比對近似問題，命中時回傳快取回應
  private async checkSemanticCache(
    queryVector: number[],
    threshold: number,
  ): Promise<AIAskResponse | null> {
    try {
      const result = await this.env.VECTOR_INDEX.query(queryVector, {
        topK: 1,
        returnMetadata: 'all',
        filter: { type: { $eq: 'query_cache' } },
      });
      const top = result.matches[0];
      if (!top || top.score < threshold) return null;
      const cacheKey = top.metadata?.cache_key as string | undefined;
      if (!cacheKey) return null;
      const cached = await this.env.CACHE.get(cacheKey);
      if (!cached) return null;
      return JSON.parse(cached) as AIAskResponse;
    } catch {
      return null;
    }
  }

  // 語義快取寫入：將 queryVector 寫入 VECTOR_INDEX，metadata 記錄對應的 KV cache key
  private async storeSemanticCache(
    vectorId: string,
    queryVector: number[],
    cacheKey: string,
  ): Promise<void> {
    try {
      await this.env.VECTOR_INDEX.upsert([{
        id: vectorId,
        values: queryVector,
        metadata: { type: 'query_cache', cache_key: cacheKey },
      }]);
    } catch {
      // 靜默忽略，不影響主流程
    }
  }

  // LLM 串流生成：邊生成邊透過 onToken 回調推送，回傳完整原始文字
  // 偵測 ---SUGGESTIONS--- 標記，標記之前的內容推送給 onToken，之後收集但不推送
  private async streamLLMGeneration(
    model: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    maxTokens: number,
    gatewayOptions: unknown,
    onToken: (token: string) => Promise<void>,
  ): Promise<string> {
    const stream = (await (this.env.AI.run as Function)(
      model,
      { messages, max_tokens: maxTokens, stream: true },
      gatewayOptions,
    )) as ReadableStream<Uint8Array>;

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let sseBuffer = '';    // SSE line accumulation
    let slideBuffer = '';  // sliding window for ---SUGGESTIONS--- detection
    let suggestionsStarted = false;
    const MARKER = '---SUGGESTIONS---';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const parsed = JSON.parse(payload) as { response?: string };
            if (!parsed.response) continue;

            fullText += parsed.response;
            if (suggestionsStarted) continue; // 建議列表區段：收集但不推送

            slideBuffer += parsed.response;
            const markerIdx = slideBuffer.indexOf(MARKER);
            if (markerIdx !== -1) {
              // 找到標記：推送標記前的文字，停止串流
              const beforeMarker = slideBuffer.slice(0, markerIdx);
              if (beforeMarker) await onToken(beforeMarker);
              suggestionsStarted = true;
            } else {
              // 滑動視窗：保留最後 (MARKER.length-1) 個字元以防標記跨 chunk
              const safeLen = slideBuffer.length - (MARKER.length - 1);
              if (safeLen > 0) {
                await onToken(slideBuffer.slice(0, safeLen));
                slideBuffer = slideBuffer.slice(safeLen);
              }
            }
          } catch { /* 忽略格式錯誤的 SSE 行 */ }
        }
      }
      // 沖出剩餘 buffer（整個回答都沒有建議標記的情況）
      if (!suggestionsStarted && slideBuffer) await onToken(slideBuffer);
    } finally {
      reader.releaseLock();
    }

    return fullText;
  }

  // 呼叫 judge LLM，timeout 與 context 截斷長度由 config 控制
  async runJudge(
    query: string,
    context: string,
    response: string,
    opts: { model?: string; timeoutMs?: number; contextTruncate?: number } = {},
  ): Promise<{ groundedness: number | null; quality: number | null }> {
    const { model: judgeModel, timeoutMs = 8000, contextTruncate = 800 } = opts;
    const truncatedContext = context.slice(0, contextTruncate);
    const judgePrompt = JUDGE_PROMPT
      .replace('{context}', truncatedContext)
      .replace('{query}', query)
      .replace('{response}', response);
    const model = judgeModel ?? DEFAULT_LIGHTWEIGHT_MODEL;

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('judge timeout')), timeoutMs)
      );
      const judgePromise = (this.env.AI.run as Function)(
        model,
        {
          messages: [
            { role: 'system', content: '只回傳 JSON，不含任何說明文字。格式：{"groundedness": <float 0.0-1.0>, "quality": <int 1-4>}' },
            { role: 'user', content: judgePrompt },
          ],
          max_tokens: 60,
        }
      ) as Promise<LLMResponse>;

      const judgeResult = await Promise.race([judgePromise, timeoutPromise]);
      return this.parseJudgeResponse(judgeResult.response ?? '');
    } catch (err) {
      console.error('[judge] error:', err instanceof Error ? err.message : String(err));
      return { groundedness: null, quality: null };
    }
  }

  // 將低品質回應寫入審核佇列
  async flagResponse(queryLogId: string, reason: 'low_groundedness' | 'low_feedback' | 'score_discrepancy'): Promise<void> {
    try {
      await this.env.DB.prepare(`
        INSERT OR IGNORE INTO ai_flagged_responses (id, query_log_id, flag_reason)
        VALUES (?, ?, ?)
      `)
        .bind(crypto.randomUUID(), queryLogId, reason)
        .run();
    } catch (error) {
      console.error('Failed to flag response:', error);
    }
  }

  // 記錄查詢日誌，回傳 query_id
  async logQuery(params: {
    userId: string | null;
    query: string;
    response: string;
    sources: AISource[];
    latencyMs: number;
    tokenCount: number | null;
    groundednessScore?: number | null;
    autoScore?: number | null;
    embeddingMs?: number | null;
    retrievalMs?: number | null;
    generationMs?: number | null;
    queryType?: string | null;
    modelUsed?: string | null;
    retrievalScore?: number | null;
    selfReflectionTriggered?: number | null;
    isHighConsumption?: boolean;
    cacheHit?: boolean;
    hydeTriggered?: boolean;
    pipelineTrace?: string;
  }): Promise<string> {
    const id = crypto.randomUUID();
    try {
      await this.env.DB.prepare(`
        INSERT INTO ai_query_logs (id, user_id, query, response, sources, latency_ms, token_count, groundedness_score, auto_score, embedding_ms, retrieval_ms, generation_ms, query_type, model_used, retrieval_score, self_reflection_triggered, is_high_consumption, cache_hit, hyde_triggered, pipeline_trace)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          id,
          params.userId,
          params.query,
          params.response,
          JSON.stringify(params.sources),
          params.latencyMs,
          params.tokenCount,
          params.groundednessScore ?? null,
          params.autoScore ?? null,
          params.embeddingMs ?? null,
          params.retrievalMs ?? null,
          params.generationMs ?? null,
          params.queryType ?? null,
          params.modelUsed ?? null,
          params.retrievalScore ?? null,
          params.selfReflectionTriggered ?? 0,
          params.isHighConsumption ? 1 : 0,
          params.cacheHit ? 1 : 0,
          params.hydeTriggered ? 1 : 0,
          params.pipelineTrace ?? null
        )
        .run();
    } catch (error) {
      console.error('Failed to log AI query:', error);
    }
    return id;
  }

  // 生成查詢快取鍵（簡單雜湊）
  hashQuery(query: string): string {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 轉為 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // LLM A：解析查詢意圖，選擇搜尋工具與參數
  // 失敗時回傳 null，由呼叫方 fallback 到 regex 方法
  private async parseQueryWithLLM(
    query: string,
    llmModel: string,
    crags: string[],
    areas: string[],
    regions: string[],
    gatewayOptions?: { gateway: { id: string } }
  ): Promise<ParsedQuery | null> {
    try {
      const prompt = TOOL_SELECTION_PROMPT
        .replace('{crags}', crags.join('、') || '無')
        .replace('{areas}', areas.join('、') || '無')
        .replace('{regions}', regions.join('、') || '無')
        .replace('{query}', query);

      const result = (await this.env.AI.run(
        llmModel,
        { messages: [{ role: 'user', content: prompt }] },
        gatewayOptions
      )) as LLMResponse;

      const text = result.response?.trim() ?? '';
      // 移除可能包裹的 markdown code fence
      const jsonText = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      const parsed = JSON.parse(jsonText) as ParsedQuery;

      if (!parsed.tool || !['search_routes', 'search_crags', 'general_knowledge'].includes(parsed.tool)) {
        return null;
      }
      // 確保 query_type 為有效值，否則 fallback 為 'complex'
      if (!parsed.query_type || !['simple', 'complex', 'general-knowledge'].includes(parsed.query_type)) {
        parsed.query_type = 'complex';
      }
      return parsed;
    } catch {
      return null;
    }
  }

  // LLM B：HyDE - 生成假設性理想答案文件以提升語義搜尋效果
  // 失敗時回傳空字串，由呼叫方跳過 HyDE 搜尋
  private async generateHyDE(
    query: string,
    llmModel: string,
    gatewayOptions?: { gateway: { id: string } }
  ): Promise<string> {
    try {
      const prompt = HYDE_PROMPT.replace('{query}', query);

      const result = (await this.env.AI.run(
        llmModel,
        { messages: [{ role: 'user', content: prompt }] },
        gatewayOptions
      )) as LLMResponse;

      return result.response?.trim() ?? '';
    } catch {
      return '';
    }
  }

  // Multi-Query Expansion：將查詢改寫為 N 個不同角度的子查詢，失敗靜默降級
  private async generateMultipleQueries(
    query: string,
    count: number,
    model: string,
    gatewayOptions?: { gateway: { id: string } }
  ): Promise<string[]> {
    const prompt = MULTI_QUERY_EXPANSION_PROMPT
      .replace(/\{count\}/g, String(count))
      .replace('{query}', query);
    try {
      const result = await (this.env.AI.run as Function)(
        model,
        { messages: [{ role: 'user', content: prompt }], max_tokens: 200 },
        gatewayOptions
      );
      const text = (result as { response?: string }).response?.trim() ?? '';
      return text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .slice(0, count);
    } catch {
      return [];
    }
  }

  // 將 ParsedQuery.params 轉換成 Vectorize metadata filter
  // 需要 DB 查詢將名稱解析為 ID
  private async buildFiltersFromParsed(
    parsed: ParsedQuery
  ): Promise<Record<string, unknown>> {
    const filter: Record<string, unknown> = {};
    const { params, tool } = parsed;

    // 根據工具類型設定 type 過濾
    if (tool === 'search_routes') {
      filter['type'] = { $eq: 'route' };
    } else if (tool === 'search_crags') {
      filter['type'] = { $eq: 'crag' };
    }

    // 解析 area_name → area_id
    if (params.area_name) {
      const area = await this.env.DB.prepare(
        'SELECT id FROM areas WHERE name = ? LIMIT 1'
      ).bind(params.area_name).first<{ id: string }>();
      if (area) {
        filter['area_id'] = { $eq: area.id };
      }
    }

    // 解析 crag_name → crag_id（area_id 優先，有 area_id 就不需要 crag_id）
    if (params.crag_name && !filter['area_id']) {
      const crag = await this.env.DB.prepare(
        'SELECT id FROM crags WHERE name = ? LIMIT 1'
      ).bind(params.crag_name).first<{ id: string }>();
      if (crag) {
        filter['crag_id'] = { $eq: crag.id };
      }
    }

    // 解析地區
    if (params.region && !filter['area_id'] && !filter['crag_id']) {
      filter['region'] = { $eq: params.region };
    }

    // 注意：route_type 不加入 Vectorize metadata filter
    // 原因：與 crag_id + grade_numeric 同時使用時過於嚴格，
    // 且許多路線的 route_type 在 DB 中為 null，導致合法路線被過濾掉。
    // 改由語義向量搜尋 + reranker 處理類型相關性，LLM 根據 context 進行最終篩選。

    // 解析 grade（支援 "5.11b" 或 "5.10-5.12" 格式）
    if (params.grade) {
      const rangeMatch = params.grade.match(/5\.(\d+)([a-d])?[-~]5\.(\d+)([a-d])?/i);
      if (rangeMatch) {
        const minNumeric = parseInt(rangeMatch[1], 10) * 10 + (rangeMatch[2] ? 'abcd'.indexOf(rangeMatch[2].toLowerCase()) : 0);
        const maxNumeric = parseInt(rangeMatch[3], 10) * 10 + (rangeMatch[4] ? 'abcd'.indexOf(rangeMatch[4].toLowerCase()) : 3);
        filter['grade_numeric'] = { $gte: minNumeric, $lte: maxNumeric };
      } else {
        const gradeFilter = this.extractGradeFilter(params.grade);
        if (gradeFilter) {
          filter['grade_numeric'] = gradeFilter;
        }
      }
    }

    return filter;
  }

  // 合併兩個 Vectorize 搜尋結果：Reciprocal Rank Fusion（RRF）
  // score = Σ 1/(k + rank_i)，k=60 為標準值，出現在兩路的結果自動加分
  // 清理查詢字串，移除 FTS5 語法特殊字符，避免 MATCH 語法錯誤
  private buildFTSQuery(query: string): string {
    return query.replace(/["\x00-\x1f()*^[\]]/g, ' ').trim();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Agentic Multi-Step RAG：主控方法，管理多輪搜尋迴圈
  // ──────────────────────────────────────────────────────────────────────────
  private async agenticRetrieve(
    query: string,
    vectorFilter: Record<string, unknown>,
    cfg: PipelineConfig,
    steps: AgenticStepTrace[],
  ): Promise<SearchResult[]> {
    const cragFilter = vectorFilter['crag_id'] as { $in?: string[] } | undefined;
    const isMultiCrag = Array.isArray(cragFilter?.$in) && cragFilter.$in.length > 1;
    const MERGE_TOP_K = isMultiCrag ? Math.max(20, cfg.merge_top_k * 2) : cfg.merge_top_k;
    const hasFilter = Object.keys(vectorFilter).some((k) => ['grade_numeric', 'crag_id', 'area_id', 'region', 'route_type'].includes(k));
    const minScore = hasFilter ? cfg.min_rrf_score_filtered : cfg.min_rrf_score;

    const allPaths: SearchResult[][] = [];

    // Step 0：初始搜尋（必定執行）
    const initialResults = await this.runAgenticSearch(query, vectorFilter, MERGE_TOP_K, cfg.bm25_top_k);
    allPaths.push(initialResults);

    // topK 上限固定為 3 倍，避免線性膨脹在極端情況下觸發 D1 參數限制
    const AGENTIC_MAX_MERGE_K = MERGE_TOP_K * 3;

    for (let step = 0; step < cfg.agentic_max_steps; step++) {
      const merged = this.mergeResults(allPaths, AGENTIC_MAX_MERGE_K);
      const uniqueCount = merged.length;

      if (uniqueCount >= cfg.agentic_min_docs_to_answer) break;

      const action = await this.decideNextAction(
        query, merged, step, cfg.agentic_max_steps, cfg.agentic_min_docs_to_answer, cfg.lightweight_model
      );

      if (action.type === 'ANSWER') {
        steps.push({ step, type: action.type });
        break;
      }

      if (action.type === 'RETRIEVE') {
        // refinedQuery 缺失時等同 ANSWER，避免空輪次浪費 LLM 呼叫
        if (!action.refinedQuery) {
          steps.push({ step, type: 'ANSWER' });
          break;
        }
        steps.push({ step, type: action.type, refinedQuery: action.refinedQuery });
        allPaths.push(await this.runAgenticSearch(action.refinedQuery, vectorFilter, MERGE_TOP_K, cfg.bm25_top_k));
      } else if (action.type === 'BROADEN') {
        // 保留 location filter（crag/area/region），只放寬 grade 和 route_type
        // 與 baseline CRAG 策略一致：不移除使用者指定的位置條件
        const broadenFilter: Record<string, unknown> = {};
        if (vectorFilter['crag_id']) broadenFilter['crag_id'] = vectorFilter['crag_id'];
        if (vectorFilter['area_id']) broadenFilter['area_id'] = vectorFilter['area_id'];
        if (vectorFilter['region']) broadenFilter['region'] = vectorFilter['region'];
        steps.push({ step, type: action.type });
        allPaths.push(await this.runAgenticSearch(query, broadenFilter, MERGE_TOP_K, cfg.bm25_top_k));
      }
    }

    const finalMerged = this.mergeResults(allPaths, AGENTIC_MAX_MERGE_K);
    return finalMerged.filter((m) => m.score >= minScore);
  }

  // 每輪 Agentic 搜尋：embedding + BM25 並行，RRF 合併
  private async runAgenticSearch(
    query: string,
    filter: Record<string, unknown>,
    topK: number,
    bm25TopK: number,
  ): Promise<SearchResult[]> {
    const queryVector = await this.embeddingService.embed(query);
    const [vecResult, bm25Matches] = await Promise.all([
      this.env.VECTOR_INDEX.query(queryVector, {
        topK,
        returnMetadata: 'all',
        filter: Object.keys(filter).length > 0 ? filter : undefined,
      }),
      this.searchBM25(query, bm25TopK),
    ]);
    const vecMatches: SearchResult[] = vecResult.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata }));
    return this.mergeResults([vecMatches, bm25Matches], topK);
  }

  // Agentic 決策：讓 LLM 評估目前文件是否足夠，決定下一步行動
  // 失敗時靜默降級：回傳 ANSWER（用已有結果直接回答）
  private async decideNextAction(
    query: string,
    currentDocs: SearchResult[],
    step: number,
    maxSteps: number,
    minDocs: number,
    model: string,
  ): Promise<AgenticAction> {
    try {
      const evidenceSummary = this.buildEvidenceSummary(currentDocs);
      // {query} 最後替換，避免查詢內容中的佔位符字串誤觸後續替換
      const prompt = AGENTIC_DECISION_PROMPT
        .replace('{count}', String(currentDocs.length))
        .replace('{evidence_summary}', evidenceSummary)
        .replace('{min_docs}', String(minDocs))
        .replace('{remaining_steps}', String(maxSteps - step - 1))
        .replace('{query}', query);

      const gatewayOptions = this.env.AI_GATEWAY_SLUG
        ? { gateway: { id: this.env.AI_GATEWAY_SLUG } }
        : undefined;
      const result = (await this.env.AI.run(
        model,
        { messages: [{ role: 'user', content: prompt }], max_tokens: 100 },
        gatewayOptions,
      )) as LLMResponse;

      const raw = result.response ?? '';
      const jsonMatch = raw.match(/\{[^}]+\}/);
      if (!jsonMatch) return { type: 'ANSWER' };

      const parsed = JSON.parse(jsonMatch[0]) as AgenticAction;
      if (!['ANSWER', 'RETRIEVE', 'BROADEN'].includes(parsed.type)) return { type: 'ANSWER' };

      // refinedQuery 型別與長度驗證，防止異常值傳入 embedding service
      if (parsed.type === 'RETRIEVE') {
        if (typeof parsed.refinedQuery !== 'string' || parsed.refinedQuery.trim().length === 0) {
          return { type: 'ANSWER' };
        }
        parsed.refinedQuery = parsed.refinedQuery.slice(0, 500);
      }

      return parsed;
    } catch {
      // LLM 失敗或 JSON 解析失敗 → 提前結束 loop，用已有結果
      return { type: 'ANSWER' };
    }
  }

  // 建立 evidence summary 供 decideNextAction prompt 使用
  private buildEvidenceSummary(docs: SearchResult[]): string {
    if (docs.length === 0) return '（尚無資料）';
    return docs.slice(0, 8).map((doc) => {
      const meta = doc.metadata as Record<string, unknown> | undefined;
      if (!meta) return `文件：${doc.id}`;
      const docType = meta['type'] as string | undefined;
      if (docType === 'route') {
        return `路線：${meta['name'] ?? doc.id}｜${meta['crag_name'] ?? ''}｜${meta['grade'] ?? ''}`;
      } else if (docType === 'crag') {
        return `岩場：${meta['name'] ?? doc.id}｜${meta['region'] ?? ''}`;
      }
      return `文件：${meta['name'] ?? doc.id}`;
    }).join('\n');
  }

  // BM25 全文搜尋：利用 D1 FTS5 索引做關鍵字匹配
  // bm25() 回傳負值（越負越相關），取負數轉為正分供 RRF 使用
  // 失敗時靜默降級（回傳空陣列），不影響向量搜尋路徑
  private async searchBM25(query: string, topK: number): Promise<SearchResult[]> {
    const ftsQuery = this.buildFTSQuery(query);
    if (!ftsQuery) return [];
    try {
      const rows = await this.env.DB.prepare(`
        SELECT doc_id, bm25(ai_documents_fts) AS bm25_score
        FROM ai_documents_fts
        WHERE ai_documents_fts MATCH ?
        ORDER BY bm25(ai_documents_fts)
        LIMIT ?
      `).bind(ftsQuery, topK).all<{ doc_id: string; bm25_score: number }>();
      return rows.results.map((row) => ({
        id: row.doc_id,
        score: -row.bm25_score,
      }));
    } catch {
      return [];
    }
  }

  // N 路 RRF 合併：支援任意數量的搜尋結果列表（向量路 + BM25 路等）
  private mergeResults(results: SearchResult[][], limit = 10): SearchResult[] {
    const K = 60;
    const rrfScores = new Map<string, number>();
    const metaMap = new Map<string, SearchResult>();

    for (const resultList of results) {
      for (const [rank, item] of resultList.entries()) {
        rrfScores.set(item.id, (rrfScores.get(item.id) ?? 0) + 1 / (K + rank + 1));
        if (!metaMap.has(item.id)) metaMap.set(item.id, item);
      }
    }

    return Array.from(rrfScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id, score]) => ({ ...metaMap.get(id)!, score }));
  }

  // MMR（Maximal Marginal Relevance）：兼顧相關性與多樣性
  // score = λ × relevance - (1-λ) × max_sim_to_selected
  // lambda=0.6 表示 60% 重視相關性、40% 重視多樣性
  private applyMMR(
    candidates: SearchResult[],
    documents: Map<string, AIDocument>,
    lambda: number,
    k: number
  ): SearchResult[] {
    if (candidates.length <= 1) return candidates;

    const selected: SearchResult[] = [];
    const remaining = [...candidates];

    while (selected.length < k && remaining.length > 0) {
      let bestIdx = 0;
      let bestScore = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        const relevance = candidate.score;

        // 已選集合中，與本候選最相似的相似度
        let maxSim = 0;
        for (const sel of selected) {
          const sim = this.documentSimilarity(
            documents.get(candidate.id),
            documents.get(sel.id)
          );
          if (sim > maxSim) maxSim = sim;
        }

        const mmrScore = lambda * relevance - (1 - lambda) * maxSim;
        if (mmrScore > bestScore) {
          bestScore = mmrScore;
          bestIdx = i;
        }
      }

      selected.push(remaining[bestIdx]);
      remaining.splice(bestIdx, 1);
    }

    return selected;
  }

  // 文件相似度（metadata-based approximation）
  // 同岩場 + 相近難度 → 高相似；不同岩場 → 低相似
  private documentSimilarity(docA: AIDocument | undefined, docB: AIDocument | undefined): number {
    if (!docA || !docB) return 0;
    if (docA.source_id === docB.source_id) return 1;

    try {
      const metaA = docA.metadata ? JSON.parse(docA.metadata) as AIDocumentMetadata : null;
      const metaB = docB.metadata ? JSON.parse(docB.metadata) as AIDocumentMetadata : null;
      if (!metaA || !metaB) return 0;

      let sim = 0;
      // 同岩場 → +0.6
      if (metaA.crag_id && metaA.crag_id === metaB.crag_id) sim += 0.6;
      // 相近難度（grade_numeric 差距 ≤ 5，如 5.10a~5.10c）→ 最多 +0.4
      if (metaA.grade_numeric && metaB.grade_numeric) {
        const diff = Math.abs(metaA.grade_numeric - metaB.grade_numeric);
        if (diff <= 5) sim += 0.4 * (1 - diff / 5);
      }
      // 同攀登類型 → +0.1
      if (metaA.route_type && metaA.route_type === metaB.route_type) sim += 0.1;

      return Math.min(sim, 1);
    } catch {
      return 0;
    }
  }
}
