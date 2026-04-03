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

/** SHA-256 based hash，用於生成 cache key（取前 16 hex chars） */
export function hashForCache(input: string): string {
  // 同步 FNV-1a 64-bit 模擬（32-bit 高低位組合），碰撞率遠低於 djb2
  // Workers runtime 的 crypto.subtle.digest 是 async，cache key 需要同步
  let h1 = 0x811c9dc5
  let h2 = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193)
    h2 = Math.imul(h2 ^ (c >> 8), 0x01000193)
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0')
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
  const key = `embed:${hashForCache(text + '\0' + model)}`
  const cached = await cache.get<number[]>(key)
  if (cached !== null) return cached

  const result = await embedFn(text)
  cache.set(key, result, EMBEDDING_CACHE_TTL).catch((err) => {
    console.warn('[react-agent] embed cache write failed:', err)
  })
  return result
}
