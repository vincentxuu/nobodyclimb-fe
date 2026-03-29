import { Langfuse, LangfuseSpanClient, LangfuseTraceClient } from 'langfuse'
import type { Env } from '../types'

/** Parent type: trace or span — both support .generation() and .span() */
export type LangfuseParent = LangfuseTraceClient | LangfuseSpanClient

/**
 * 每次請求建立一個新的 Langfuse client 實例（request-scoped）
 * env 不含 keys 時回傳 null（靜默降級）
 */
export function createLangfuseClient(env: Env): Langfuse | null {
  if (!env.LANGFUSE_PUBLIC_KEY || !env.LANGFUSE_SECRET_KEY) return null
  return new Langfuse({
    publicKey: env.LANGFUSE_PUBLIC_KEY,
    secretKey: env.LANGFUSE_SECRET_KEY,
    baseUrl: env.LANGFUSE_BASEURL ?? 'https://cloud.langfuse.com',
    flushAt: 10,
    flushInterval: 5000,
  })
}

/** 建立一個新 trace，代表一次完整的 AI 問答請求 */
export function createTrace(
  langfuse: Langfuse | null,
  opts: {
    name: string
    userId?: string
    sessionId?: string
    input: unknown
    metadata?: Record<string, unknown>
  }
): LangfuseTraceClient | null {
  if (!langfuse) return null
  return langfuse.trace({
    name: opts.name,
    userId: opts.userId,
    sessionId: opts.sessionId,
    input: opts.input,
    metadata: opts.metadata,
  })
}

/** 在 parent（trace 或 span）下建立一個子 span */
export function startSpan(
  parent: LangfuseParent | null,
  name: string,
  input?: unknown
): LangfuseSpanClient | null {
  if (!parent) return null
  return parent.span({ name, input })
}

/** 結束一個 span */
export function endSpan(
  span: LangfuseSpanClient | null,
  opts: {
    output?: unknown
    metadata?: Record<string, unknown>
    level?: 'DEFAULT' | 'DEBUG' | 'WARNING' | 'ERROR'
  } = {}
): void {
  if (!span) return
  span.end({
    output: opts.output,
    metadata: opts.metadata,
    level: opts.level,
  })
}

/**
 * 記錄一次 LLM 呼叫（model、prompt、completion、token usage）
 * parent 可以是 trace 或 span，generation 會掛在 parent 下（形成巢狀層級）
 */
export function logGeneration(
  parent: LangfuseParent | null,
  opts: {
    name: string
    model: string
    input: unknown
    output?: string
    usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number }
    metadata?: Record<string, unknown>
    startTime?: Date
    endTime?: Date
    level?: 'DEFAULT' | 'DEBUG' | 'WARNING' | 'ERROR'
  }
): void {
  if (!parent) return
  parent.generation({
    name: opts.name,
    model: opts.model,
    input: opts.input,
    output: opts.output,
    usage: opts.usage,
    metadata: opts.metadata,
    startTime: opts.startTime,
    endTime: opts.endTime,
    level: opts.level,
  })
}

/** 強制 flush，在 Cloudflare Workers waitUntil 中呼叫 */
export async function flushLangfuse(langfuse: Langfuse | null): Promise<void> {
  if (!langfuse) return
  await langfuse.flushAsync()
}

// Re-export types for consumers
export type { LangfuseSpanClient, LangfuseTraceClient }
