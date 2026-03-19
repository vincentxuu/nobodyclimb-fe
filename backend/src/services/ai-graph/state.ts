import { Annotation } from '@langchain/langgraph';
import { PipelineContext } from '../pipeline/types';
import { LangfuseTraceClient } from 'langfuse';

/**
 * LangGraph Graph State
 *
 * 直接繼承 PipelineContext 的所有欄位，以 Annotation.Root 描述。
 * 每個 node 回傳 Partial<GraphState>，LangGraph 以 last-write-wins
 * 策略合併（預設 reducer），符合原本 pipeline 行為。
 */
export const GraphStateAnnotation = Annotation.Root({
  // ---------- 直接對應 PipelineContext 的所有欄位 ----------
  // 使用 Annotation<T>() 讓 LangGraph 知道型別，不指定 reducer 表示 last-write-wins
  env: Annotation<PipelineContext['env']>(),
  request: Annotation<PipelineContext['request']>(),
  userId: Annotation<string | undefined>(),
  pipelineConfig: Annotation<PipelineContext['pipelineConfig']>(),
  prompts: Annotation<Record<string, string>>(),
  gatewayOptions: Annotation<PipelineContext['gatewayOptions']>(),
  trace: Annotation<Record<string, unknown>>({
    reducer: (a, b) => ({ ...a, ...b }), // trace 欄位做 merge
  }),
  tokenBreakdown: Annotation<PipelineContext['tokenBreakdown']>({
    reducer: (a, b) => ({ ...a, ...b }),
  }),
  queryService: Annotation<PipelineContext['queryService']>(),
  startTime: Annotation<number>(),

  // 快取
  cacheKey: Annotation<string>(),
  cacheTtl: Annotation<number>(),
  recentHistory: Annotation<PipelineContext['recentHistory']>(),
  isAnonymousNoHistory: Annotation<boolean>(),
  earlyQueryVector: Annotation<number[] | null>(),

  // Pre-retrieval
  queryType: Annotation<PipelineContext['queryType']>(),
  effectiveLlmModel: Annotation<string | undefined>(),
  parsedQuery: Annotation<PipelineContext['parsedQuery']>(),
  toolConfidence: Annotation<number>(),
  fallbackEnabled: Annotation<boolean>(),
  alternativeTool: Annotation<string | undefined>(),
  hydeDoc: Annotation<string | undefined>(),
  expandedQueries: Annotation<string[] | undefined>(),
  vectorFilter: Annotation<Record<string, unknown> | undefined>(),
  queryVector: Annotation<number[] | undefined>(),
  hydeVector: Annotation<number[] | null | undefined>(),
  expandedVectors: Annotation<number[][] | undefined>(),

  // Text-to-SQL
  sqlTemplate: Annotation<string | undefined>(),
  sqlParams: Annotation<Record<string, unknown> | undefined>(),
  clarificationType: Annotation<'intent' | 'missing-crag' | undefined>(),
  sqlCandidates: Annotation<Array<Record<string, unknown>> | undefined>(),
  sqlContext: Annotation<string | undefined>(),

  // Similar route
  isSimRouteSearch: Annotation<boolean | undefined>(),
  excludeRouteId: Annotation<string | null | undefined>(),
  referenceRouteInfo: Annotation<string | null | undefined>(),

  // 預載資料
  preloadedCrags: Annotation<PipelineContext['preloadedCrags']>(),
  preloadedAreas: Annotation<PipelineContext['preloadedAreas']>(),

  // Retrieval
  candidateMatches: Annotation<PipelineContext['candidateMatches']>(),
  // NOTE: branchResults 和 documents 使用 Map 型別（繼承自 PipelineContext）。
  // 若未來啟用 LangGraph checkpointing，需改為 Record/Array 以支援 JSON 序列化。
  documents: Annotation<PipelineContext['documents']>(),
  retrievalScore: Annotation<number | undefined>(),

  // Post-retrieval
  scoredCandidates: Annotation<PipelineContext['scoredCandidates']>(),
  rerankedMatches: Annotation<PipelineContext['rerankedMatches']>(),
  sources: Annotation<PipelineContext['sources']>(),
  context: Annotation<string | undefined>(),

  // Generation
  rawAnswer: Annotation<string | undefined>(),
  answer: Annotation<string | undefined>(),
  suggestedQuestions: Annotation<string[] | undefined>(),
  parsedAnswer: Annotation<string | undefined>(),

  // Evaluation
  groundedness: Annotation<number | null | undefined>(),
  quality: Annotation<number | null | undefined>(),

  // 流程控制
  earlyReturn: Annotation<PipelineContext['earlyReturn']>(),
  finalResponse: Annotation<PipelineContext['finalResponse']>(),
  streamingMode: Annotation<boolean | undefined>(),
  onToken: Annotation<((token: string) => Promise<void>) | undefined>(),
  waitUntilCtx: Annotation<PipelineContext['waitUntilCtx']>(),

  // 個人化
  memorySummary: Annotation<string | null | undefined>(),
  ascentContext: Annotation<string | null | undefined>(),
  abilityLevel: Annotation<number | null | undefined>(),

  // Looping
  loopCount: Annotation<number>(),
  loopBack: Annotation<PipelineContext['loopBack']>(),

  // Agentic
  /** agentic decision node が設定：'RETRIEVE' | 'ANSWER'。routing 用 typed field 而非從 trace 讀取 */
  agenticAction: Annotation<'RETRIEVE' | 'ANSWER' | undefined>(),

  // Branching
  // NOTE: branchResults 和 documents 使用 Map 型別（繼承自 PipelineContext）。
  // 若未來啟用 LangGraph checkpointing，需改為 Record/Array 以支援 JSON 序列化。
  branchResults: Annotation<PipelineContext['branchResults']>(),

  // Latency
  phaseLatency: Annotation<PipelineContext['phaseLatency']>(),

  // 其他
  retrievalMethod: Annotation<PipelineContext['retrievalMethod']>(),
  multiToolPlan: Annotation<PipelineContext['multiToolPlan']>(),
  strategyHint: Annotation<string | undefined>(),
  skipPostRetrieval: Annotation<boolean | undefined>(),
  // NOTE: 使用 Record 而非 Map，因為 LangGraph 在 checkpointing 時需要 JSON 序列化
  videoCountMap: Annotation<Record<string, number> | undefined>(),
  latestVideoMap: Annotation<Record<string, string> | undefined>(),
  llmMessages: Annotation<PipelineContext['llmMessages']>(),
  selfReflectionTriggered: Annotation<number | undefined>(),
  cannotAnswer: Annotation<boolean | undefined>(),
  abortSignal: Annotation<AbortSignal | undefined>(),
  embeddingFailed: Annotation<boolean | undefined>(),
  // NOTE: 使用 array concat 而非 last-write-wins：同一個 graph step 中多個 node 可能
  // 各自降級，所有降級記錄都必須保留。使用覆寫會導致早期 node 的降級信號靜默遺失。
  degradedStages: Annotation<string[] | undefined>({
    reducer: (a, b) => [...(a ?? []), ...(b ?? [])],
  }),
  circuitBreaker: Annotation<PipelineContext['circuitBreaker']>(),

  // ---------- LangGraph 新增欄位 ----------
  /** Langfuse trace 實例，由 GraphService 注入，nodes 用來建立 span */
  langfuseTrace: Annotation<LangfuseTraceClient | null | undefined>(),
});

export type GraphState = typeof GraphStateAnnotation.State;
