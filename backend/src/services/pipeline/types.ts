import { Env, AIAskRequest, AIAskResponse, AISource, AIDocument, ParsedQuery, AIChatMessage } from '../../types';
import { CircuitBreaker } from '../../utils/circuit-breaker';

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
  planning?: StageTokenUsage;
  synthesis?: StageTokenUsage;
  adaptive_replan?: StageTokenUsage;
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
  list_response_limit: number;
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
  agentic_min_quality_score: number;
  // Plan-and-Execute
  plan_execute_max_steps: number;
  plan_execute_min_entities: number;
  planning_timeout_ms: number;
  synthesis_timeout_ms: number;
  plan_step_timeout_ms: number;
  adaptive_plan_enabled: boolean;
  // Looping
  max_pipeline_loops: number;
  // Reranker 閾值過濾
  reranker_relevance_threshold: number;
  reranker_min_keep: number;
  // Tool Selection 信心
  tool_confidence_threshold: number;
  // Pipeline 超時
  pipeline_timeout_ms: number;
  embedding_timeout_ms: number;
  search_timeout_ms: number;
  generation_timeout_ms: number;
  hyde_timeout_ms: number;
  multi_query_timeout_ms: number;
  // Circuit Breaker
  circuit_breaker_threshold: number;
  circuit_breaker_reset_ms: number;
}

// 檢索方法
export type RetrievalMethod = 'vector' | 'bm25' | 'hybrid';

// Multi-Tool 組合
export interface MultiToolStep {
  tool: string;
  purpose: string;
  query: string;
  params?: Record<string, unknown>;
}
export interface MultiToolPlan {
  steps: MultiToolStep[];
  execution_mode: 'parallel' | 'sequential';
}

// Agentic 型別
export type AgenticActionType = 'ANSWER' | 'RETRIEVE' | 'BROADEN' | 'SWITCH_TOOL' | 'DECOMPOSE' | 'VERIFY';
export interface AgenticAction { type: AgenticActionType; refinedQuery?: string; targetTool?: string; reason?: string; subQueries?: string[]; verifyQuery?: string; retrievalMethod?: RetrievalMethod; }
export interface AgenticStepTrace { step: number; type: AgenticActionType; refinedQuery?: string; targetTool?: string; reason?: string; subQueries?: string[]; verifyQuery?: string; }

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
  ): Promise<{ candidates: SearchResult[]; terminationReason: string; initialSearch: { initial_results_count: number; min_docs_to_answer: number; min_quality_score: number; min_rrf_score: number; quality_check?: { unique_count: number; avg_score: number; passed: boolean } } }>;
  // Plan-and-Execute
  planQuery(
    query: string, cfg: PipelineConfig, crags: string[], areas: string[],
    promptTemplate?: string, gatewayOptions?: { gateway: { id: string } },
  ): Promise<{ plan: { steps: Array<{ id: number; query: string; tool: string; filters: Record<string, unknown>; depends_on: number[] }>; execution_mode: string } | null; failureReason?: 'timeout' | 'json_parse_error' | 'empty_steps'; usage?: TokenUsageInfo }>;
  executePlan(
    plan: { steps: Array<{ id: number; query: string; tool: string; filters: Record<string, unknown>; depends_on: number[] }>; execution_mode: string },
    cfg: PipelineConfig, gatewayOptions?: { gateway: { id: string } },
  ): Promise<{ results: Array<{ stepId: number; query: string; tool: string; candidates: SearchResult[]; documents: Map<string, { title: string; excerpt: string; url?: string }>; sqlContext?: string; durationMs: number; error?: string }>; adaptiveReplan: boolean; adaptiveReplanInfo?: { trigger_step_id: number; reason: string; new_steps: Array<{ id: number; query: string; tool: string; filters: Record<string, unknown>; depends_on: number[] }> } }>;
  synthesize(
    query: string,
    stepResults: Array<{ stepId: number; query: string; tool: string; candidates: SearchResult[]; documents: Map<string, { title: string; excerpt: string; url?: string }>; sqlContext?: string; durationMs: number; error?: string }>,
    cfg: PipelineConfig, promptTemplate?: string, gatewayOptions?: { gateway: { id: string } },
  ): Promise<{ context: string; sources: AISource[]; usage?: TokenUsageInfo }>;
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
  ): Promise<{ groundedness: number | null; quality: number | null; constraint_ok: boolean; rawResponse: string | null; contextChars: number; contextTruncated: boolean; usage?: TokenUsageInfo }>;
  // 日誌
  logQuery(params: {
    userId: string | null; query: string; response: string; sources: AISource[];
    latencyMs: number; tokenCount: number | null; groundednessScore?: number | null;
    autoScore?: number | null; embeddingMs?: number | null; retrievalMs?: number | null;
    generationMs?: number | null; queryType?: string | null; modelUsed?: string | null;
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
  queryType?: 'simple' | 'complex' | 'general-knowledge' | 'sql' | 'hybrid' | 'clarification-needed' | 'multi-tool';
  effectiveLlmModel?: string;
  parsedQuery?: ParsedQuery | null;
  toolConfidence: number;             // 工具選擇信心分數（預設 1.0）
  fallbackEnabled: boolean;           // 是否啟用空結果 fallback（預設 false）
  alternativeTool?: string;           // 備選工具名稱（confidence < 0.8 時由 LLM 提供）
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
  climbed_route_ids?: string[] | null;

  // Looping 控制
  loopCount: number;
  loopBack?: {
    targetPhase: PipelinePhase;
    reason: string;
  };

  // Branching 控制
  branchResults?: Map<string, Partial<PipelineContext>>;

  // Per-phase latency（engine 匯聚後設定）
  phaseLatency?: {
    embeddingMs: number | null;
    retrievalMs: number | null;
    generationMs: number | null;
  };

  // 檢索方法
  retrievalMethod: RetrievalMethod;

  // Multi-Tool
  multiToolPlan?: MultiToolPlan;

  // Plan-and-Execute
  strategyHint?: string;
  skipPostRetrieval?: boolean;

  // 輔助資料
  videoCountMap?: Map<string, number>;
  latestVideoMap?: Map<string, string>;
  llmMessages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  selfReflectionTriggered?: number;
  cannotAnswer?: boolean;

  // 超時與降級
  abortSignal?: AbortSignal;           // Pipeline 取消信號（超時/客戶端斷線時 abort）
  embeddingFailed?: boolean;           // Embedding 超時/失敗，hybrid-search 僅走 BM25
  degradedStages?: string[];           // 降級的 step 名稱列表
  circuitBreaker?: CircuitBreaker;     // Circuit Breaker 實例（供 step 記錄成功/失敗）
}
