import type { Env } from '../../types'
import type { LangfuseParent } from '../../utils/langfuse'
import type { QueryService } from '../query'
import type { AgentCache } from './cache'

// ---------------------------------------------------------------------------
// Model Configuration
// ---------------------------------------------------------------------------

export type ProviderName = 'workers-ai' | 'anthropic' | 'openai' | 'google' | 'github'

export interface ModelConfig {
  provider: ProviderName
  model: string
  temperature?: number
  maxTokens?: number
  /** 失敗時的備援配置（可鏈式） */
  fallback?: ModelConfig
}

/** 7 LLM 觸點，每個可獨立配置 provider + model */
export interface ModelMap {
  orchestrator: ModelConfig
  hyde: ModelConfig
  multiQuery: ModelConfig
  textToSql: ModelConfig
  rerank: ModelConfig
  judge: ModelConfig
  embedding: ModelConfig
}

// ---------------------------------------------------------------------------
// Token Tracking
// ---------------------------------------------------------------------------

export interface ModelTokenUsage {
  provider: ProviderName
  model: string
  inputTokens: number
  outputTokens: number
  calls: number
}

export interface TurnRecord {
  turn: number
  orchestratorUsage: { inputTokens: number; outputTokens: number }
  toolCalls: Array<{
    name: string
    latencyMs: number
    internalLLMTokens?: number
  }>
}

export interface TokenTracker {
  /** 記錄某 provider+model 的 token 用量 */
  record(provider: ProviderName, model: string, input: number, output: number): void
  /** 開始新的 turn 記錄 */
  startTurn(turn: number): void
  /** 記錄本 turn 的 orchestrator usage */
  recordOrchestratorUsage(input: number, output: number): void
  /** 記錄本 turn 的 tool call */
  recordToolCall(name: string, latencyMs: number, internalLLMTokens?: number): void
  /** 取得累計 input tokens */
  getTotalInputTokens(): number
  /** 取得累計 output tokens */
  getTotalOutputTokens(): number
  /** 取得累計總 tokens */
  getTotalTokens(): number
  /** 取得 per-model 統計 */
  getPerModelStats(): ModelTokenUsage[]
  /** 取得 per-turn 記錄 */
  getTurnRecords(): TurnRecord[]
}

// ---------------------------------------------------------------------------
// Tool System
// ---------------------------------------------------------------------------

export interface ToolResult {
  content: string
  metadata?: Record<string, unknown>
}

export interface ToolContext {
  env: Env
  userId: string | null
  locale: string
  models: ModelMap
  queryService: QueryService
  langfuseTrace?: LangfuseParent | null
  tracker: TokenTracker
  cache: AgentCache
  /** 當前已註冊的 tool 名稱列表（供 prompt() 跨 tool 組合提示） */
  availableTools: string[]
}

// ---------------------------------------------------------------------------
// Model Helpers
// ---------------------------------------------------------------------------

const SMALL_MODEL_KEYWORDS = ['8b', '7b', '3b', '1b', 'scout', 'mini', 'flash', 'haiku', 'nano']

/** 判斷 ModelConfig 是否為小模型（基於 model 名稱關鍵字） */
export function isSmallModel(config: ModelConfig): boolean {
  const name = config.model.toLowerCase()
  return SMALL_MODEL_KEYWORDS.some((kw) => name.includes(kw))
}

export interface Tool {
  name: string
  tags: string[]
  alwaysLoad: boolean
  concurrencySafe: boolean
  maxResultChars: number
  /** Cache TTL（秒），0 表示不快取 */
  cacheTTL: number
  parameters: Record<string, unknown>
  prompt(ctx: ToolContext): string
  execute(input: unknown, ctx: ToolContext): Promise<unknown>
  formatResult(raw: unknown): ToolResult
}

// ---------------------------------------------------------------------------
// Provider Tool-Use Response (unified format)
// ---------------------------------------------------------------------------

export interface ToolCall {
  id: string
  name: string
  input: unknown
}

export interface ToolUseResponse {
  content?: string
  toolCalls: ToolCall[]
  stopReason: 'tool_use' | 'end_turn'
  usage: { input: number; output: number }
}

export interface ChatWithToolsOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  system?: string
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export interface ProgressEvent {
  type: 'progress'
  tool: string
  status: 'executing' | 'done'
}

export interface ReactAgentOptions {
  query: string
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  systemPrompt: string
  maxTurns: number
  tokenBudget: number
  stream?: boolean
  onToken?: (token: string) => Promise<void>
  onProgress?: (event: ProgressEvent) => Promise<void>
}

export interface ReactAgentResult {
  answer: string
  sources: Array<{ title: string; url: string; excerpt?: string }>
  totalTokens: number
  turnCount: number
  toolCallCount: number
  perModelStats: ModelTokenUsage[]
  costUSD?: number
  costTWD?: number
}
