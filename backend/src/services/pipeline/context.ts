import { AIAskRequest, AIChatMessage, Env } from '../../types'
import { CircuitBreaker } from '../../utils/circuit-breaker'
import {
  PipelineConfig,
  PipelineContext,
  PipelineTokenBreakdown,
  QueryServiceStepMethods,
} from './types'

export function createPipelineContext(opts: {
  env: Env
  queryService: QueryServiceStepMethods
  request: AIAskRequest
  userId?: string
  pipelineConfig: PipelineConfig
  prompts: Record<string, string>
  gatewayOptions?: { gateway: { id: string } }
  cacheKey: string
  recentHistory: AIChatMessage[]
  isAnonymousNoHistory: boolean
  earlyQueryVector: number[] | null
  memorySummary: string | null
  ascentContext: string | null
  abilityLevel: number | null
  personalityType?: string | null
  streamingMode: boolean
  onToken?: (token: string) => Promise<void>
  waitUntilCtx?: { waitUntil(promise: Promise<unknown>): void }
  extraTrace?: Record<string, unknown>
  abortSignal?: AbortSignal
  circuitBreaker?: CircuitBreaker
  langfuseTrace?: import('../../utils/langfuse').LangfuseTraceClient | null
}): PipelineContext {
  return {
    env: opts.env,
    request: opts.request,
    userId: opts.userId,
    pipelineConfig: opts.pipelineConfig,
    prompts: opts.prompts,
    gatewayOptions: opts.gatewayOptions,
    trace: opts.extraTrace ? { ...opts.extraTrace } : {},
    tokenBreakdown: {} as PipelineTokenBreakdown,
    queryService: opts.queryService,
    startTime: Date.now(),

    cacheKey: opts.cacheKey,
    cacheTtl: opts.pipelineConfig.cache_ttl,
    recentHistory: opts.recentHistory,
    isAnonymousNoHistory: opts.isAnonymousNoHistory,
    earlyQueryVector: opts.earlyQueryVector,

    // 預設值
    vectorFilter: {},
    hydeDoc: '',
    expandedQueries: [],
    isSimRouteSearch: false,
    excludeRouteId: null,
    referenceRouteInfo: null,
    preloadedCrags: [],
    preloadedAreas: [],

    // 流程控制
    streamingMode: opts.streamingMode,
    onToken: opts.onToken,
    waitUntilCtx: opts.waitUntilCtx,

    // 個人化
    memorySummary: opts.memorySummary,
    ascentContext: opts.ascentContext,
    abilityLevel: opts.abilityLevel,
    climbed_route_ids: opts.request.climbed_route_ids ?? null,
    personalityType: opts.personalityType ?? null,

    // Tool Selection 信心
    toolConfidence: 1.0,
    fallbackEnabled: false,

    // 檢索方法
    retrievalMethod: 'hybrid',

    // Looping
    loopCount: 0,

    // 其他預設
    selfReflectionTriggered: 0,

    // 超時與降級
    abortSignal: opts.abortSignal,
    degradedStages: [],
    circuitBreaker: opts.circuitBreaker,

    // Langfuse 觀察性
    langfuseTrace: opts.langfuseTrace ?? null,
    currentLfSpan: null,
  }
}
