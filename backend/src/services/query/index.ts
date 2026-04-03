import { getMemoriesSummary } from '../../repositories/memory'
import {
  AIAskRequest,
  AIAskResponse,
  AIChatMessage,
  AIDocument,
  AISearchRequest,
  AISource,
  Env,
  ParsedQuery,
} from '../../types'
import {
  AGENTIC_DECISION_PROMPT,
  GENERAL_KNOWLEDGE_SYSTEM_PROMPT,
  HYDE_PROMPT,
  JUDGE_PROMPT,
  MULTI_QUERY_EXPANSION_PROMPT,
  PLANNING_PROMPT,
  QUERY_TEMPLATE,
  SYNTHESIS_PROMPT,
  SYSTEM_PROMPT,
  TOOL_SELECTION_PROMPT,
} from '../../utils/ai-prompts'
import { CircuitBreaker } from '../../utils/circuit-breaker'
import type { LangfuseParent } from '../../utils/langfuse'
import { createLangfuseClient, createTrace, flushLangfuse } from '../../utils/langfuse'
import { TimeoutError, withTimeout } from '../../utils/timeout'
import { runAIGraph } from '../ai-graph'
import { EmbeddingService } from '../embedding'
import { buildAscentContext, estimateAbilityLevel, getRecentAscents } from '../personalization'
import { createPipelineContext } from '../pipeline/context'
import { PipelineEngine } from '../pipeline/engine'
import type { AgenticStepTrace, PipelineConfig, StageTokenUsage } from '../pipeline/types'
import {
  checkSemanticCache,
  flagResponse,
  hashQuery,
  logQuery,
  storeSemanticCache,
} from './cache-log'
import { DEFAULT_TOP_K, loadPipelineConfig, loadPrompts, resolvePrompt } from './config'
import { buildExcerpt, buildUrl, extractTitle, getDocuments, injectRouteLinks } from './documents'
import { buildFilter, buildFiltersFromParsed } from './filters'
import {
  generateHyDE,
  generateMultipleQueries,
  parseQueryWithLLM,
  runJudge,
  streamLLMGeneration,
} from './llm'
import {
  extractGradeFilter,
  extractLocationFilter,
  extractRouteReference,
  extractRouteReferences,
  extractTypeFilter,
  hasSimilarRouteIntent,
  isContextDependentQuery,
  similarGradeRange,
} from './nlp'
import { executePlan, planQuery, synthesize } from './plan-execute'
import { agenticRetrieve, applyMMR, mergeResults, searchBM25 } from './retrieval'
// Sub-module imports
import type { SearchResult } from './types'

export class QueryService {
  private embeddingService: EmbeddingService

  private _pipelineCtx: {
    currentLfSpan?: import('../../utils/langfuse').LangfuseSpanClient | null
    langfuseTrace?: import('../../utils/langfuse').LangfuseTraceClient | null
  } | null = null

  setPipelineCtx(pipelineCtx: {
    currentLfSpan?: import('../../utils/langfuse').LangfuseSpanClient | null
    langfuseTrace?: import('../../utils/langfuse').LangfuseTraceClient | null
  }): void {
    this._pipelineCtx = pipelineCtx
  }

  private get langfuseParent(): LangfuseParent | null {
    return this._pipelineCtx?.currentLfSpan ?? this._pipelineCtx?.langfuseTrace ?? null
  }

  constructor(private env: Env) {
    this.embeddingService = new EmbeddingService(env)
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Pipeline-based RAG 流程
  // ──────────────────────────────────────────────────────────────────────────
  async ask(
    request: AIAskRequest,
    userId?: string,
    ctx?: { waitUntil(promise: Promise<unknown>): void },
    onToken?: (token: string) => Promise<void>,
    extraTrace?: Record<string, unknown>
  ): Promise<AIAskResponse> {
    const streamingMode = !!onToken
    const { query, chat_history, no_cache = false } = request

    // 對話歷史
    const recentHistory: AIChatMessage[] = chat_history ? chat_history.slice(-6) : []
    const historyHash =
      recentHistory.length > 0
        ? `:h${this.hashQuery(recentHistory.map((m) => m.content).join('|'))}`
        : ''

    // 個人化 context
    let memorySummary: string | null = null
    let ascentContext: string | null = null
    let abilityLevel: number | null = null
    if (userId) {
      const [memories, ascents] = await Promise.all([
        getMemoriesSummary(userId, this.env.DB),
        getRecentAscents(userId, this.env.DB),
      ])
      memorySummary = memories
      ascentContext = buildAscentContext(ascents)
      abilityLevel = estimateAbilityLevel(ascents)
    }

    // 快取鍵
    const personalizedContext = [memorySummary, ascentContext].filter(Boolean).join('|')
    const personalizedHash = personalizedContext ? `:p${this.hashQuery(personalizedContext)}` : ''
    const userPrefix = userId ? `${userId}:` : ''
    const cacheKey = `ai:ask:${userPrefix}${this.hashQuery(query)}${historyHash}${personalizedHash}`
    const startTime = Date.now()

    // KV 快取前置檢查
    if (!no_cache) {
      const cached = await this.env.CACHE.get(cacheKey)
      if (cached) {
        this.logQuery({
          userId: userId ?? null,
          query,
          response: '',
          sources: [],
          latencyMs: Date.now() - startTime,
          tokenCount: 0,
          cacheHit: true,
          pipelineTrace: JSON.stringify({ cache: { type: 'kv' } }),
        }).catch(() => {})
        return JSON.parse(cached) as AIAskResponse
      }
    }

    const isAnonymousNoHistory = !userId && recentHistory.length === 0 && !no_cache

    // 批次讀取 pipeline 設定 + 提前 embed query + prompts
    const [pipelineCfg, earlyQueryVector, dbPrompts] = await Promise.all([
      loadPipelineConfig(this.env.DB),
      isAnonymousNoHistory
        ? this.embeddingService.embed(query)
        : Promise.resolve(null as number[] | null),
      loadPrompts(this.env.DB),
    ])

    const p = {
      SYSTEM_PROMPT: resolvePrompt(dbPrompts['system_prompt'], SYSTEM_PROMPT, []),
      TOOL_SELECTION_PROMPT: resolvePrompt(
        dbPrompts['tool_selection_prompt'],
        TOOL_SELECTION_PROMPT,
        ['query', 'crags', 'areas', 'regions']
      ),
      GENERAL_KNOWLEDGE_SYSTEM_PROMPT: resolvePrompt(
        dbPrompts['general_knowledge_system_prompt'],
        GENERAL_KNOWLEDGE_SYSTEM_PROMPT,
        []
      ),
      HYDE_PROMPT: resolvePrompt(dbPrompts['hyde_prompt'], HYDE_PROMPT, ['query']),
      JUDGE_PROMPT: resolvePrompt(dbPrompts['judge_prompt'], JUDGE_PROMPT, [
        'context',
        'query',
        'response',
      ]),
      MULTI_QUERY_EXPANSION_PROMPT: resolvePrompt(
        dbPrompts['multi_query_expansion_prompt'],
        MULTI_QUERY_EXPANSION_PROMPT,
        ['query', 'count']
      ),
      AGENTIC_DECISION_PROMPT: resolvePrompt(
        dbPrompts['agentic_decision_prompt'],
        AGENTIC_DECISION_PROMPT,
        ['query', 'count', 'evidence_summary', 'min_docs', 'remaining_steps']
      ),
      PLANNING_PROMPT: resolvePrompt(dbPrompts['planning_prompt'], PLANNING_PROMPT, [
        'query',
        'crags',
        'areas',
        'max_steps',
      ]),
      SYNTHESIS_PROMPT: resolvePrompt(dbPrompts['synthesis_prompt'], SYNTHESIS_PROMPT, [
        'query',
        'step_results',
      ]),
      QUERY_TEMPLATE: resolvePrompt(dbPrompts['query_template'], QUERY_TEMPLATE, [
        'context',
        'query',
      ]),
    }
    const gatewayOptions = this.env.AI_GATEWAY_SLUG
      ? { gateway: { id: this.env.AI_GATEWAY_SLUG } }
      : undefined

    // Circuit Breaker 檢查
    const circuitBreaker = new CircuitBreaker(this.env.CACHE, {
      threshold: pipelineCfg.circuit_breaker_threshold,
      resetMs: pipelineCfg.circuit_breaker_reset_ms,
    })
    const cbCheck = await circuitBreaker.checkState()
    if (cbCheck.action === 'reject') {
      const cbError = new Error('AI 服務暫時不可用，請稍後再試')
      ;(cbError as any).code = 'CIRCUIT_BREAKER_OPEN'
      ;(cbError as any).circuitBreaker = { state: 'open', action: 'rejected' }
      throw cbError
    }

    if (extraTrace) {
      extraTrace.circuit_breaker = {
        state: cbCheck.state.state,
        action: cbCheck.action,
        failure_count: cbCheck.state.failureCount,
      }
    }

    // Langfuse observability
    const langfuseClient = createLangfuseClient(this.env)
    const langfuseTrace = createTrace(langfuseClient, {
      name: 'ai-ask',
      userId,
      input: { query, chat_history_length: recentHistory.length },
      metadata: {
        streaming: streamingMode,
        cache_key: cacheKey,
      },
    })

    const controller = new AbortController()

    const pipelineCtx = createPipelineContext({
      env: this.env,
      queryService: this,
      request,
      userId,
      pipelineConfig: pipelineCfg,
      prompts: p,
      gatewayOptions,
      cacheKey,
      recentHistory,
      isAnonymousNoHistory,
      earlyQueryVector,
      memorySummary,
      ascentContext,
      abilityLevel,
      streamingMode,
      onToken,
      waitUntilCtx: ctx,
      extraTrace,
      abortSignal: controller.signal,
      circuitBreaker,
      langfuseTrace,
    })

    this.setPipelineCtx(pipelineCtx)

    try {
      // React Agent 策略
      if (pipelineCfg.rag_strategy === 'react') {
        const { runReactAgent } = await import('../react-agent')
        const reactResult = await withTimeout(
          runReactAgent({
            query: request.query,
            chatHistory: recentHistory.map((h) => ({
              role: h.role as 'user' | 'assistant',
              content: h.content,
            })),
            userId: userId ?? null,
            env: this.env,
            queryService: this,
            langfuseTrace,
            waitUntilCtx: ctx,
            stream: streamingMode,
            onToken,
          }),
          pipelineCfg.pipeline_timeout_ms,
          'pipeline'
        )
        // 寫入 query log
        const reactSources: AISource[] = reactResult.sources.map((s, i) => ({
          id: `react-${i}`,
          type: 'route' as const,
          title: s.title,
          url: s.url,
          excerpt: s.excerpt ?? '',
          score: 0,
        }))

        const queryId = await this.logQuery({
          userId: userId ?? null,
          query,
          response: reactResult.answer,
          sources: reactSources,
          latencyMs: Date.now() - startTime,
          tokenCount: reactResult.totalTokens,
          modelUsed: 'react-agent',
          pipelineTrace: JSON.stringify({
            strategy: 'react',
            turn_count: reactResult.turnCount,
            tool_call_count: reactResult.toolCallCount,
            per_model_stats: reactResult.perModelStats,
          }),
        })

        // KV cache 寫入
        const response: AIAskResponse = {
          answer: reactResult.answer,
          sources: reactSources,
          query_id: queryId,
          suggested_questions: [],
        }

        if (!request.no_cache && ctx) {
          ctx.waitUntil(
            this.env.CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: 3600 })
          )
        }

        return response
      }

      if (pipelineCfg.use_langgraph_engine === true) {
        // 新引擎：LangGraph pipeline
        const result = await withTimeout(
          runAIGraph(pipelineCtx),
          pipelineCfg.pipeline_timeout_ms,
          'pipeline'
        )
        return result.earlyReturn ?? result.finalResponse!
      } else {
        // 原有引擎（feature flag 預設 false）
        const engine = new PipelineEngine(this.env)
        const result = await withTimeout(
          engine.run(pipelineCtx),
          pipelineCfg.pipeline_timeout_ms,
          'pipeline'
        )
        return result.earlyReturn ?? result.finalResponse!
      }
    } catch (err) {
      controller.abort()
      throw err
    } finally {
      // Langfuse flush：不阻塞回應，在 waitUntil 中執行
      if (langfuseClient && ctx) {
        ctx.waitUntil(flushLangfuse(langfuseClient))
      }
    }
  }

  // SSE 串流問答
  async askStream(
    request: AIAskRequest,
    userId: string | undefined,
    write: (data: string) => Promise<void>,
    ctx?: { waitUntil(promise: Promise<unknown>): void },
    extraTrace?: Record<string, unknown>
  ): Promise<AIAskResponse> {
    const onToken = async (token: string) => {
      await write(JSON.stringify({ type: 'token', token }))
    }
    try {
      return await this.ask(request, userId, ctx, onToken, extraTrace)
    } catch (error) {
      const message =
        error instanceof TimeoutError
          ? '查詢處理超時，請稍後再試'
          : (error as any)?.code === 'CIRCUIT_BREAKER_OPEN'
            ? 'AI 服務暫時不可用，請稍後再試'
            : '抱歉，AI 服務暫時無法使用，請稍後再試。'
      await write(JSON.stringify({ type: 'error', message }))
      throw error
    }
  }

  // 純語義搜尋（不呼叫 LLM）
  async search(request: AISearchRequest): Promise<{ results: AISource[]; count: number }> {
    const { query, limit = DEFAULT_TOP_K } = request

    const [queryVector, cfg] = await Promise.all([
      this.embeddingService.embed(query),
      loadPipelineConfig(this.env.DB),
    ])
    const filter = this.buildFilter(request)

    const searchResults = await this.env.VECTOR_INDEX.query(queryVector, {
      topK: Math.min(limit, 50),
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      returnMetadata: 'all',
    })

    const relevantMatches = searchResults.matches.filter((m) => m.score >= cfg.min_vector_score)
    const documents = await this.getDocuments(relevantMatches.map((m) => m.id))

    const results: AISource[] = relevantMatches
      .map((match) => {
        const doc = documents.get(match.id)
        if (!doc) return null
        return {
          id: doc.source_id,
          type: doc.type,
          title: this.extractTitle(doc),
          excerpt: this.buildExcerpt(doc),
          url: this.buildUrl(doc),
          score: match.score,
        } as AISource
      })
      .filter((s): s is AISource => s !== null)

    return { results, count: results.length }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // QueryServiceStepMethods 委派
  // ──────────────────────────────────────────────────────────────────────────

  // 快取
  checkSemanticCache(queryVector: number[], threshold: number) {
    return checkSemanticCache(this.env, queryVector, threshold)
  }
  storeSemanticCache(vectorId: string, queryVector: number[], cacheKey: string) {
    return storeSemanticCache(this.env, vectorId, queryVector, cacheKey)
  }
  hashQuery(query: string) {
    return hashQuery(query)
  }

  // Query 處理
  parseQueryWithLLM(
    query: string,
    llmModel: string,
    crags: string[],
    areas: string[],
    regions: string[],
    gatewayOptions?: { gateway: { id: string } },
    promptTemplate?: string
  ) {
    return parseQueryWithLLM(
      this.env,
      query,
      llmModel,
      crags,
      areas,
      regions,
      gatewayOptions,
      promptTemplate,
      this.langfuseParent
    )
  }
  generateHyDE(
    query: string,
    llmModel: string,
    gatewayOptions?: { gateway: { id: string } },
    promptTemplate?: string
  ) {
    return generateHyDE(
      this.env,
      query,
      llmModel,
      gatewayOptions,
      promptTemplate,
      this.langfuseParent
    )
  }
  generateMultipleQueries(
    query: string,
    count: number,
    model: string,
    gatewayOptions?: { gateway: { id: string } },
    promptTemplate?: string
  ) {
    return generateMultipleQueries(
      this.env,
      query,
      count,
      model,
      gatewayOptions,
      promptTemplate,
      this.langfuseParent
    )
  }

  // 過濾
  buildFiltersFromParsed(parsed: ParsedQuery) {
    return buildFiltersFromParsed(this.env.DB, parsed)
  }
  extractLocationFilter(
    query: string,
    crags: Array<{ id: string; name: string; region: string | null }>,
    areas: Array<{ id: string; name: string }>
  ) {
    return extractLocationFilter(query, crags, areas)
  }
  extractGradeFilter(query: string) {
    return extractGradeFilter(query)
  }
  extractTypeFilter(query: string) {
    return extractTypeFilter(query)
  }
  isContextDependentQuery(query: string) {
    return isContextDependentQuery(query)
  }
  hasSimilarRouteIntent(query: string) {
    return hasSimilarRouteIntent(query)
  }
  similarGradeRange(gradeNumeric: number, steps?: number) {
    return similarGradeRange(gradeNumeric, steps)
  }
  extractRouteReference(query: string) {
    return extractRouteReference(this.env.DB, query)
  }
  extractRouteReferences(query: string) {
    return extractRouteReferences(this.env.DB, query)
  }

  // 搜尋
  mergeResults(results: SearchResult[][], limit?: number) {
    return mergeResults(results, limit)
  }
  searchBM25(query: string, topK: number) {
    return searchBM25(this.env.DB, query, topK)
  }
  agenticRetrieve(
    query: string,
    vectorFilter: Record<string, unknown>,
    cfg: PipelineConfig,
    steps: AgenticStepTrace[],
    agenticPromptTemplate?: string,
    decisionUsages?: Array<StageTokenUsage & { step: number }>
  ) {
    return agenticRetrieve(
      { env: this.env, embeddingService: this.embeddingService },
      query,
      vectorFilter,
      cfg,
      steps,
      agenticPromptTemplate,
      decisionUsages,
      this.langfuseParent
    )
  }

  // Plan-and-Execute
  planQuery(
    query: string,
    cfg: PipelineConfig,
    crags: string[],
    areas: string[],
    promptTemplate?: string,
    gatewayOptions?: { gateway: { id: string } }
  ) {
    return planQuery(
      this.env,
      query,
      cfg,
      crags,
      areas,
      promptTemplate,
      gatewayOptions,
      this.langfuseParent
    )
  }
  executePlan(
    plan: {
      steps: Array<{
        id: number
        query: string
        tool: string
        filters: Record<string, unknown>
        depends_on: number[]
      }>
      execution_mode: string
    },
    cfg: PipelineConfig,
    gatewayOptions?: { gateway: { id: string } }
  ) {
    return executePlan(
      { env: this.env, embeddingService: this.embeddingService },
      plan as any,
      cfg,
      gatewayOptions
    )
  }
  synthesize(
    query: string,
    stepResults: Array<{
      stepId: number
      query: string
      tool: string
      candidates: SearchResult[]
      documents: Map<string, { title: string; excerpt: string; url?: string }>
      sqlContext?: string
      durationMs: number
      error?: string
    }>,
    cfg: PipelineConfig,
    promptTemplate?: string,
    gatewayOptions?: { gateway: { id: string } }
  ) {
    return synthesize(
      this.env,
      query,
      stepResults,
      cfg,
      promptTemplate,
      gatewayOptions,
      this.langfuseParent
    )
  }
  getDocuments(ids: string[]) {
    return getDocuments(this.env.DB, ids)
  }

  // Ranking
  applyMMR(
    candidates: SearchResult[],
    documents: Map<string, AIDocument>,
    lambda: number,
    k: number
  ) {
    return applyMMR(candidates, documents, lambda, k)
  }

  // 文件處理
  extractTitle(doc: AIDocument) {
    return extractTitle(doc)
  }
  buildExcerpt(doc: AIDocument) {
    return buildExcerpt(doc)
  }
  buildUrl(doc: AIDocument) {
    return buildUrl(doc)
  }

  // 生成
  streamLLMGeneration(
    model: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    maxTokens: number,
    gatewayOptions: unknown,
    onToken: (token: string) => Promise<void>
  ) {
    return streamLLMGeneration(
      this.env,
      model,
      messages,
      maxTokens,
      gatewayOptions,
      onToken,
      this.langfuseParent
    )
  }
  injectRouteLinks(text: string, sources: AISource[]) {
    return injectRouteLinks(text, sources)
  }

  // 評估
  runJudge(
    query: string,
    context: string,
    response: string,
    opts?: {
      model?: string
      timeoutMs?: number
      contextTruncate?: number
      promptTemplate?: string
    }
  ) {
    return runJudge(this.env, query, context, response, opts, this.langfuseParent)
  }

  // 日誌
  logQuery(params: {
    userId: string | null
    query: string
    response: string
    sources: AISource[]
    latencyMs: number
    tokenCount: number | null
    groundednessScore?: number | null
    autoScore?: number | null
    embeddingMs?: number | null
    retrievalMs?: number | null
    generationMs?: number | null
    queryType?: string | null
    modelUsed?: string | null
    retrievalScore?: number | null
    selfReflectionTriggered?: number | null
    isHighConsumption?: boolean
    cacheHit?: boolean
    hydeTriggered?: boolean
    pipelineTrace?: string
  }) {
    return logQuery(this.env.DB, params)
  }
  flagResponse(
    queryLogId: string,
    reason: 'low_groundedness' | 'low_feedback' | 'score_discrepancy'
  ) {
    return flagResponse(this.env.DB, queryLogId, reason)
  }

  // search() 內部使用的 buildFilter
  buildFilter(request: AISearchRequest) {
    return buildFilter(request)
  }
}
