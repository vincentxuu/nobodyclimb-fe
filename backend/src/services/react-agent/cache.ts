/**
 * AgentCache — 底層 Cloudflare KV，支援 namespace + TTL
 *
 * 用於 react-agent 的 tool result cache 和 embedding cache，
 * 避免重複的工具呼叫和 embedding 計算。
 */

export interface AgentCache {
  get<T = unknown>(key: string): Promise<T | null>
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>
}

const NAMESPACE = 'react-agent'

export class KVAgentCache implements AgentCache {
  constructor(private readonly kv: KVNamespace) {}

  async get<T = unknown>(key: string): Promise<T | null> {
    const raw = await this.kv.get(`${NAMESPACE}:${key}`)
    if (raw === null) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.kv.put(`${NAMESPACE}:${key}`, JSON.stringify(value), {
      expirationTtl: ttlSeconds,
    })
  }
}

/** 簡單的 hash 函數，用於生成 cache key */
export function hashForCache(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return (hash >>> 0).toString(36)
}

// ---------------------------------------------------------------------------
// Embedding Cache — embed 前查 cache，避免重複計算
// ---------------------------------------------------------------------------

const EMBEDDING_CACHE_TTL = 86400 // 24 hours

/**
 * 帶 cache 的 embed 函數
 * key = embed:{hash(text + model)}
 */
export async function cachedEmbed(
  cache: AgentCache,
  embedFn: (text: string) => Promise<number[]>,
  text: string,
  model: string
): Promise<number[]> {
  const key = `embed:${hashForCache(text + model)}`
  const cached = await cache.get<number[]>(key)
  if (cached !== null) return cached

  const result = await embedFn(text)
  cache.set(key, result, EMBEDDING_CACHE_TTL).catch(() => {})
  return result
}
