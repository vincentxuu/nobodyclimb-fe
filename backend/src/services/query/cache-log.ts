import type { AIAskResponse, AISource, Env } from '../../types'

// 語義快取查詢：用 queryVector 在 VECTOR_INDEX 比對近似問題，命中時回傳快取回應
export async function checkSemanticCache(
  env: Env,
  queryVector: number[],
  threshold: number
): Promise<AIAskResponse | null> {
  try {
    const result = await env.VECTOR_INDEX.query(queryVector, {
      topK: 1,
      returnMetadata: 'all',
      filter: { type: { $eq: 'query_cache' } },
    })
    const top = result.matches[0]
    if (!top || top.score < threshold) return null
    const cacheKey = top.metadata?.cache_key as string | undefined
    if (!cacheKey) return null
    const cached = await env.CACHE.get(cacheKey)
    if (!cached) return null
    return JSON.parse(cached) as AIAskResponse
  } catch {
    return null
  }
}

// 語義快取寫入：將 queryVector 寫入 VECTOR_INDEX，metadata 記錄對應的 KV cache key
export async function storeSemanticCache(
  env: Env,
  vectorId: string,
  queryVector: number[],
  cacheKey: string
): Promise<void> {
  try {
    await env.VECTOR_INDEX.upsert([
      {
        id: vectorId,
        values: queryVector,
        metadata: { type: 'query_cache', cache_key: cacheKey },
      },
    ])
  } catch {
    // 靜默忽略，不影響主流程
  }
}

// 生成查詢快取鍵（簡單雜湊）
export function hashQuery(query: string): string {
  let hash = 0
  for (let i = 0; i < query.length; i++) {
    const char = query.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // 轉為 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

// 記錄查詢日誌，回傳 query_id
export async function logQuery(
  db: D1Database,
  params: {
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
  }
): Promise<string> {
  const id = crypto.randomUUID()
  try {
    await db
      .prepare(`
      INSERT INTO ai_query_logs (id, user_id, query, response, sources, latency_ms, token_count, groundedness_score, auto_score, embedding_ms, retrieval_ms, generation_ms, query_type, model_used, retrieval_score, self_reflection_triggered, is_high_consumption, cache_hit, hyde_triggered, pipeline_trace)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        id,
        params.userId,
        params.query,
        params.response,
        JSON.stringify(params.sources),
        params.latencyMs,
        params.tokenCount,
        params.groundednessScore ?? null,
        params.autoScore ?? null,
        params.embeddingMs ?? null,
        params.retrievalMs ?? null,
        params.generationMs ?? null,
        params.queryType ?? null,
        params.modelUsed ?? null,
        params.retrievalScore ?? null,
        params.selfReflectionTriggered ?? 0,
        params.isHighConsumption ? 1 : 0,
        params.cacheHit ? 1 : 0,
        params.hydeTriggered ? 1 : 0,
        params.pipelineTrace ?? null
      )
      .run()
  } catch (error) {
    console.error('Failed to log AI query:', error)
  }
  return id
}

// 將低品質回應寫入審核佇列
export async function flagResponse(
  db: D1Database,
  queryLogId: string,
  reason: 'low_groundedness' | 'low_feedback' | 'score_discrepancy'
): Promise<void> {
  try {
    await db
      .prepare(`
      INSERT OR IGNORE INTO ai_flagged_responses (id, query_log_id, flag_reason)
      VALUES (?, ?, ?)
    `)
      .bind(crypto.randomUUID(), queryLogId, reason)
      .run()
  } catch (error) {
    console.error('Failed to flag response:', error)
  }
}
