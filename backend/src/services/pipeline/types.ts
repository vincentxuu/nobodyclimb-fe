import { Env, AIAskRequest, AIAskResponse, AISource, AIDocument, ParsedQuery, AIChatMessage } from '../../types';

// Pipeline Phase 順序固定
export type PipelinePhase = 'pre-retrieval' | 'retrieval' | 'post-retrieval' | 'generation' | 'evaluation';

export const PHASE_ORDER: PipelinePhase[] = ['pre-retrieval', 'retrieval', 'post-retrieval', 'generation', 'evaluation'];

// Step 識別碼
export type StepId =
  | 'semantic-cache'
  | 'tool-selection'
  | 'text-to-sql'
  | 'hyde'
  | 'multi-query'
  | 'filter-build'
  | 'embedding'
  | 'hybrid-search'
  | 'cross-encoder'
  | 'mmr'
  | 'popularity-rerank'
  | 'llm-generation'
  | 'judge'
  | 'self-reflection';

// Conditional Routing：skipWhen 條件
export interface SkipCondition {
  field: keyof PipelineContext;
  operator: 'eq' | 'neq' | 'in';
  value: unknown;
}

// Pipeline Step 統一介面
export interface PipelineStep {
  id: StepId;
  name: string;
  description: string;
  phase: PipelinePhase;
  defaultEnabled: boolean;
  defaultOrder: number;
  requires: Array<keyof PipelineContext>;
  provides: Array<keyof PipelineContext>;
  skipWhen?: SkipCondition[];
  execute(ctx: PipelineContext): Promise<PipelineContext>;
}

// Step metadata（不含 execute，用於 registry 和 API 回傳）
export interface PipelineStepMeta {
  id: StepId;
  name: string;
  description: string;
  phase: PipelinePhase;
  defaultEnabled: boolean;
  defaultOrder: number;
  requires: Array<keyof PipelineContext>;
  provides: Array<keyof PipelineContext>;
  skipWhen?: SkipCondition[];
}

// Branching + Fusion
export interface BranchConfig {
  id: string;
  branches: StepId[][];
  fusionStep: StepId;
}

// Step 設定（存於 ai_config）
export interface PipelineStepConfig {
  id: StepId;
  enabled: boolean;
  order: number;
}

// 搜尋結果型別
export interface SearchResult {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

// LLM 回應
export interface LLMResponse {
  response: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

// Stage token 追蹤
export interface StageTokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  model: string;
  estimated: boolean;
}

export interface PipelineTokenBreakdown {
  tool_selection?: StageTokenUsage;
  text_to_sql?: StageTokenUsage;
  hyde?: StageTokenUsage;
  multi_query?: StageTokenUsage;
  agentic_decisions?: Array<StageTokenUsage & { step: number }>;
  main_generation?: StageTokenUsage;
  self_reflection_regen?: StageTokenUsage;
  judge?: StageTokenUsage;
  judge_2nd?: StageTokenUsage;
}

// Pipeline 設定（從 ai_config 讀取）
export interface PipelineConfig {
  llm_model: string;
  simple_model: string;
  lightweight_model: string;
  max_results: number;
  merge_top_k: number;
  min_rrf_score: number;
  min_rrf_score_filtered: number;
  min_vector_score: number;
  mmr_lambda: number;
  reranker_weight: number;
  popularity_weight: number;
  max_tokens_generation: number;
  max_tokens_gk: number;
  high_consumption_threshold: number;
  groundedness_disclaimer_low: number;
  groundedness_disclaimer_mid: number;
  groundedness_flag_threshold: number;
  judge_timeout_ms: number;
  judge_context_truncate: number;
  assistant_history_truncate: number;
  judge_regen_quality_max: number;
  self_reflection_min_length: number;
  chat_history_depth: number;
  cache_ttl: number;
  semantic_cache_enabled: boolean;
  semantic_cache_threshold: number;
  bm25_top_k: number;
  multi_query_count: number;
  max_output_length: number;
  system_prompt_leakage_patterns: string[];
  rag_strategy: string;
  agentic_max_steps: number;
  agentic_min_docs_to_answer: number;
  // Looping
  max_pipeline_loops: number;
}

// Agentic 型別
export type AgenticActionType = 'ANSWER' | 'RETRIEVE' | 'BROADEN';
export interface AgenticAction { type: AgenticActionType; refinedQuery?: string; }
export interface AgenticStepTrace { step: number; type: AgenticActionType; refinedQuery?: string; }

// Token 使用量（方法回傳用，不含 model）
export interface TokenUsageInfo {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated: boolean;
}

// Pipeline steps 可存取的 QueryService 方法子集
export interface QueryServiceStepMethods {
  // 快取
  checkSemanticCache(queryVector: number[], threshold: number): Promise<AIAskResponse | null>;
  storeSemanticCache(vectorId: string, queryVector: number[], cacheKey: string): Promise<void>;
  hashQuery(query: string): string;
  // Query 處理
  parseQueryWithLLM(
    query: string, llmModel: string, crags: string[], areas: string[], regions: string[],
    gatewayOptions?: { gateway: { id: string } }, promptTemplate?: string,
  ): Promise<{ result: ParsedQuery | null; usage?: TokenUsageInfo }>;
  generateHyDE(
    query: string, llmModel: string, gatewayOptions?: { gateway: { id: string } }, promptTemplate?: string,
  ): Promise<{ doc: string; usage?: TokenUsageInfo }>;
  generateMultipleQueries(
    query: string, count: number, model: string, gatewayOptions?: { gateway: { id: string } }, promptTemplate?: string,
  ): Promise<{ queries: string[]; usage?: TokenUsageInfo }>;
  // 過濾
  buildFiltersFromParsed(parsed: ParsedQuery): Promise<Record<string, unknown>>;
  extractLocationFilter(
    query: string, crags: Array<{ id: string; name: string; region: string | null }>, areas: Array<{ id: string; name: string }>,
  ): { cragIds?: string[]; areaId?: string; region?: string };
  extractGradeFilter(query: string): { $gte: number; $lte: number } | null;
  extractTypeFilter(query: string): 'crag' | 'route' | null;
  isContextDependentQuery(query: string): boolean;
  hasSimilarRouteIntent(query: string): boolean;
  similarGradeRange(gradeNumeric: number, steps?: number): { $gte: number; $lte: number };
  extractRouteReference(query: string): Promise<{
    gradeNumeric: number; cragId: string | null; routeId: string;
    name: string; grade: string | null; routeType: string | null;
  } | null>;
  // 搜尋
  mergeResults(results: SearchResult[][], limit?: number): SearchResult[];
  searchBM25(query: string, topK: number): Promise<SearchResult[]>;
  agenticRetrieve(
    query: string, vectorFilter: Record<string, unknown>, cfg: PipelineConfig,
    steps: AgenticStepTrace[], agenticPromptTemplate?: string,
    decisionUsages?: Array<StageTokenUsage & { step: number }>,
  ): Promise<{ candidates: SearchResult[]; terminationReason: string }>;
  getDocuments(ids: string[]): Promise<Map<string, AIDocument>>;
  // Ranking
  applyMMR(candidates: SearchResult[], documents: Map<string, AIDocument>, lambda: number, k: number): SearchResult[];
  // 文件處理
  extractTitle(doc: AIDocument): string;
  buildExcerpt(doc: AIDocument): string;
  buildUrl(doc: AIDocument): string | undefined;
  // 生成
  streamLLMGeneration(
    model: string, messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    maxTokens: number, gatewayOptions: unknown, onToken: (token: string) => Promise<void>,
  ): Promise<string>;
  injectRouteLinks(text: string, sources: AISource[]): string;
  // 評估
  runJudge(
    query: string, context: string, response: string,
    opts?: { model?: string; timeoutMs?: number; contextTruncate?: number; promptTemplate?: string },
  ): Promise<{ groundedness: number | null; quality: number | null; rawResponse: string | null; contextChars: number; contextTruncated: boolean; usage?: TokenUsageInfo }>;
  // 日誌
  logQuery(params: {
    userId: string | null; query: string; response: string; sources: AISource[];
    latencyMs: number; tokenCount: number | null; groundednessScore?: number | null;
    autoScore?: number | null; queryType?: string | null; modelUsed?: string | null;
    retrievalScore?: number | null; selfReflectionTriggered?: number | null;
    isHighConsumption?: boolean; cacheHit?: boolean; hydeTriggered?: boolean; pipelineTrace?: string;
  }): Promise<string>;
  flagResponse(queryLogId: string, reason: 'low_groundedness' | 'low_feedback' | 'score_discrepancy'): Promise<void>;
}

// Pipeline Context：各 step 共用的上下文物件
export interface PipelineContext {
  // 輸入
  env: Env;
  request: AIAskRequest;
  userId?: string;
  pipelineConfig: PipelineConfig;
  prompts: Record<string, string>;
  gatewayOptions?: { gateway: { id: string } };
  trace: Record<string, unknown>;
  tokenBreakdown: PipelineTokenBreakdown;
  queryService: QueryServiceStepMethods;
  startTime: number;

  // 快取相關
  cacheKey: string;
  cacheTtl: number;
  recentHistory: AIChatMessage[];
  isAnonymousNoHistory: boolean;
  earlyQueryVector: number[] | null;

  // Pre-retrieval 階段產出
  queryType?: 'simple' | 'complex' | 'general-knowledge' | 'sql' | 'hybrid' | 'clarification-needed';
  effectiveLlmModel?: string;
  parsedQuery?: ParsedQuery | null;
  hydeDoc?: string;
  expandedQueries?: string[];
  vectorFilter?: Record<string, unknown>;
  queryVector?: number[];
  hydeVector?: number[] | null;
  expandedVectors?: number[][];

  // Text-to-SQL 相關（tool-selection step 產出）
  sqlTemplate?: string;
  sqlParams?: Record<string, unknown>;
  clarificationType?: 'intent' | 'missing-crag';

  // Text-to-SQL step 產出（hybrid 用）
  sqlCandidates?: Array<Record<string, unknown>>;
  sqlContext?: string;

  // Similar route 特殊路徑
  isSimRouteSearch?: boolean;
  excludeRouteId?: string | null;
  referenceRouteInfo?: string | null;

  // 預載資料
  preloadedCrags?: Array<{ id: string; name: string; region: string | null }>;
  preloadedAreas?: Array<{ id: string; name: string }>;

  // Retrieval 階段產出
  candidateMatches?: SearchResult[];
  documents?: Map<string, AIDocument>;
  retrievalScore?: number;

  // Post-retrieval 階段產出
  scoredCandidates?: SearchResult[];
  rerankedMatches?: Array<SearchResult & { finalScore: number }>;
  sources?: AISource[];
  context?: string;

  // Generation 階段產出
  rawAnswer?: string;
  answer?: string;
  suggestedQuestions?: string[];
  parsedAnswer?: string;

  // Evaluation 階段產出
  groundedness?: number | null;
  quality?: number | null;

  // 流程控制
  earlyReturn?: AIAskResponse;    // step 內提前中斷回傳（semantic-cache、text-to-sql、GK 路徑等）
  finalResponse?: AIAskResponse;  // pipeline 正常結束後由 engine 組裝的最終回應
  streamingMode?: boolean;
  onToken?: (token: string) => Promise<void>;
  waitUntilCtx?: { waitUntil(promise: Promise<unknown>): void };

  // 個人化
  memorySummary?: string | null;
  ascentContext?: string | null;
  abilityLevel?: number | null;

  // Looping 控制
  loopCount: number;
  loopBack?: {
    targetPhase: PipelinePhase;
    reason: string;
  };

  // Branching 控制
  branchResults?: Map<string, Partial<PipelineContext>>;

  // 輔助資料
  videoCountMap?: Map<string, number>;
  latestVideoMap?: Map<string, string>;
  llmMessages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  selfReflectionTriggered?: number;
  cannotAnswer?: boolean;
}
