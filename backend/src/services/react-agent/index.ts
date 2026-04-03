import { getMemoriesSummary } from '../../repositories/memory'
import type { Env } from '../../types'
import { SYSTEM_PROMPT } from '../../utils/ai-prompts'
import type { LangfuseParent } from '../../utils/langfuse'
import { createProvider } from '../ai-graph/providers'
import type { ProviderName as LegacyProviderName } from '../ai-graph/providers/types'
import { extractMemoriesFromQuery } from '../memory-extractor'
import {
  buildAscentContext,
  buildPersonalizedSystemPrompt,
  estimateAbilityLevel,
  getRecentAscents,
} from '../personalization'
import type { QueryService } from '../query'
import { KVAgentCache } from './cache'
import { classifyQuery, GREETING_RESPONSE, SYSTEM_RESPONSE } from './classifier'
import { runReactLoop } from './engine'
import { runAsyncJudge, runOutputGuards } from './guards'
import { createToolRegistry } from './tools'
import { DefaultTokenTracker } from './tracker'
import type { ModelConfig, ModelMap, ProviderName, ReactAgentResult, ToolContext } from './types'

// ---------------------------------------------------------------------------
// Default Model Map
// ---------------------------------------------------------------------------

const DEFAULT_MODEL_MAP: ModelMap = {
  orchestrator: {
    provider: 'workers-ai',
    model: '@cf/meta/llama-4-scout-17b-16e-instruct',
    temperature: 0.3,
    maxTokens: 1024,
    fallback: {
      provider: 'workers-ai',
      model: '@cf/meta/llama-3.1-8b-instruct',
      temperature: 0.3,
      maxTokens: 1024,
    },
  },
  hyde: { provider: 'workers-ai', model: '@cf/meta/llama-3.1-8b-instruct' },
  multiQuery: { provider: 'workers-ai', model: '@cf/meta/llama-3.1-8b-instruct' },
  textToSql: { provider: 'workers-ai', model: '@cf/meta/llama-3.1-8b-instruct' },
  rerank: { provider: 'workers-ai', model: '@cf/baai/bge-reranker-v2-m3' },
  judge: { provider: 'workers-ai', model: '@cf/meta/llama-3.1-8b-instruct' },
  embedding: { provider: 'workers-ai', model: '@cf/baai/bge-m3' },
}

type PartialModelConfig = Partial<ModelConfig> & {
  fallback?: PartialModelConfig
}

function normalizeModelConfig(
  value: PartialModelConfig | undefined,
  fallback: ModelConfig
): ModelConfig {
  return {
    provider: value?.provider ?? fallback.provider,
    model: value?.model ?? fallback.model,
    temperature: value?.temperature ?? fallback.temperature,
    maxTokens: value?.maxTokens ?? fallback.maxTokens,
    fallback: value?.fallback
      ? normalizeModelConfig(value.fallback, fallback.fallback ?? fallback)
      : fallback.fallback,
  }
}

// ---------------------------------------------------------------------------
// Load Model Map from DB
// ---------------------------------------------------------------------------

export async function loadModelMap(db: D1Database): Promise<ModelMap> {
  const row = await db
    .prepare("SELECT value FROM ai_config WHERE key = 'react_models'")
    .first<{ value: string }>()

  if (!row?.value) return DEFAULT_MODEL_MAP

  try {
    const parsed = JSON.parse(row.value) as Partial<Record<keyof ModelMap, PartialModelConfig>>
    return {
      orchestrator: normalizeModelConfig(parsed.orchestrator, DEFAULT_MODEL_MAP.orchestrator),
      hyde: normalizeModelConfig(parsed.hyde, DEFAULT_MODEL_MAP.hyde),
      multiQuery: normalizeModelConfig(parsed.multiQuery, DEFAULT_MODEL_MAP.multiQuery),
      textToSql: normalizeModelConfig(parsed.textToSql, DEFAULT_MODEL_MAP.textToSql),
      rerank: normalizeModelConfig(parsed.rerank, DEFAULT_MODEL_MAP.rerank),
      judge: normalizeModelConfig(parsed.judge, DEFAULT_MODEL_MAP.judge),
      embedding: normalizeModelConfig(parsed.embedding, DEFAULT_MODEL_MAP.embedding),
    }
  } catch {
    return DEFAULT_MODEL_MAP
  }
}

// ---------------------------------------------------------------------------
// Load React Agent Config
// ---------------------------------------------------------------------------

interface ReactConfig {
  maxTurns: number
  tokenBudget: number
  usdToTwd: number
}

async function loadReactConfig(db: D1Database): Promise<ReactConfig> {
  const rows = await db
    .prepare(
      "SELECT key, value FROM ai_config WHERE key IN ('react_max_turns', 'react_token_budget', 'react_usd_to_twd')"
    )
    .all<{ key: string; value: string }>()
  const cfg: Record<string, string> = Object.fromEntries(
    (rows.results ?? []).map((r) => [r.key, r.value])
  )
  return {
    maxTurns: parseInt(cfg['react_max_turns'] ?? '3', 10) || 3,
    tokenBudget: parseInt(cfg['react_token_budget'] ?? '8000', 10) || 8000,
    usdToTwd: parseFloat(cfg['react_usd_to_twd'] ?? '32.0') || 32.0,
  }
}

// ---------------------------------------------------------------------------
// Create Provider for ModelConfig
// ---------------------------------------------------------------------------

function createProviderForConfig(provider: ProviderName, env: Env) {
  // 將 react-agent 的 ProviderName 對應到 factory 接受的名稱
  const factoryName = provider === 'workers-ai' ? 'cloudflare' : provider
  return createProvider(factoryName as LegacyProviderName, env)
}

// ---------------------------------------------------------------------------
// runReactAgent — 主入口
// ---------------------------------------------------------------------------

export interface RunReactAgentParams {
  query: string
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  userId: string | null
  env: Env
  queryService: QueryService
  langfuseTrace?: LangfuseParent | null
  waitUntilCtx?: { waitUntil(promise: Promise<unknown>): void }
  stream?: boolean
  onToken?: (token: string) => Promise<void>
  onProgress?: (event: {
    type: 'progress'
    tool: string
    status: 'executing' | 'done'
  }) => Promise<void>
}

export async function runReactAgent(params: RunReactAgentParams): Promise<ReactAgentResult> {
  const { query, chatHistory, userId, env, queryService, langfuseTrace, waitUntilCtx } = params

  // 0. 查詢分類快速路徑（0 LLM call）
  const category = classifyQuery(query)
  if (category === 'greeting') {
    return {
      answer: GREETING_RESPONSE,
      sources: [],
      totalTokens: 0,
      turnCount: 0,
      toolCallCount: 0,
      perModelStats: [],
    }
  }
  if (category === 'system') {
    return {
      answer: SYSTEM_RESPONSE,
      sources: [],
      totalTokens: 0,
      turnCount: 0,
      toolCallCount: 0,
      perModelStats: [],
    }
  }

  // 0.5 通用知識 → 用 hyde 觸點（小模型）直接回答
  if (category === 'general_knowledge') {
    const models = await loadModelMap(env.DB)
    const hydeProvider = createProviderForConfig(models.hyde.provider, env)
    try {
      const response = await hydeProvider.chat(
        [
          { role: 'system', content: '你是攀岩知識專家，用繁體中文簡潔回答攀岩相關問題。' },
          { role: 'user', content: query },
        ],
        { model: models.hyde.model, maxTokens: 512, temperature: 0.3 }
      )
      // 通用知識也過 output guards
      const guardResult = runOutputGuards(response.content)
      const answer = guardResult.cleanedAnswer ?? response.content
      const tracker = new DefaultTokenTracker()
      tracker.record(
        models.hyde.provider,
        models.hyde.model,
        response.usage?.prompt_tokens ?? 0,
        response.usage?.completion_tokens ?? 0
      )
      return {
        answer,
        sources: [],
        totalTokens: tracker.getTotalTokens(),
        turnCount: 0,
        toolCallCount: 0,
        perModelStats: tracker.getPerModelStats(),
      }
    } catch (err) {
      console.warn(
        '[react-agent] general_knowledge hyde failed, falling through to ReAct loop:',
        err
      )
    }
  }

  // 1. Load config + personalization（並行）
  const personalizationPromise = userId
    ? Promise.all([getMemoriesSummary(userId, env.DB), getRecentAscents(userId, env.DB)])
    : Promise.resolve([null, []] as [string | null, Awaited<ReturnType<typeof getRecentAscents>>])

  const [models, reactCfg, [memorySummary, ascents]] = await Promise.all([
    loadModelMap(env.DB),
    loadReactConfig(env.DB),
    personalizationPromise,
  ])

  // 2. Build personalized system prompt
  const ascentContext = buildAscentContext(ascents)
  const abilityLevel = estimateAbilityLevel(ascents)
  const systemPrompt = buildPersonalizedSystemPrompt(
    memorySummary,
    ascentContext,
    abilityLevel,
    SYSTEM_PROMPT
  )

  // 3. Create provider for orchestrator
  const orchestratorProvider = createProviderForConfig(models.orchestrator.provider, env)

  // 4. Create tracker + registry + context
  const tracker = new DefaultTokenTracker(reactCfg.usdToTwd)
  const registry = createToolRegistry()
  const cache = new KVAgentCache(env.CACHE)
  const toolCtx: ToolContext = {
    env,
    userId,
    locale: 'zh-TW',
    models,
    queryService,
    langfuseTrace,
    tracker,
    cache,
    availableTools: registry.getToolNames(),
  }

  // 5. Run ReAct loop
  const result = await runReactLoop(
    {
      provider: orchestratorProvider,
      registry,
      ctx: toolCtx,
      langfuseParent: langfuseTrace,
      createProvider: (providerName: string) =>
        createProviderForConfig(providerName as ProviderName, env),
    },
    {
      query,
      chatHistory,
      systemPrompt,
      maxTurns: reactCfg.maxTurns,
      tokenBudget: reactCfg.tokenBudget,
      onProgress: params.onProgress,
    }
  )

  // 6. Output guards（同步）
  const guardResult = runOutputGuards(result.answer)
  const finalAnswer = guardResult.cleanedAnswer ?? result.answer

  // 7. Async judge + memory extraction（非同步，不擋回應）
  if (waitUntilCtx) {
    waitUntilCtx.waitUntil(runAsyncJudge(env, query, '', finalAnswer, models, langfuseTrace))
    if (userId) {
      waitUntilCtx.waitUntil(extractMemoriesFromQuery(query, userId, env.DB, env.AI))
    }
  }

  const costSummary = tracker.getCostSummary()
  return {
    answer: finalAnswer,
    sources: [],
    totalTokens: tracker.getTotalTokens(),
    turnCount: result.turnCount,
    toolCallCount: result.toolCallCount,
    perModelStats: tracker.getPerModelStats(),
    costUSD: costSummary.totalCostUSD,
    costTWD: costSummary.totalCostTWD,
  }
}
