import { endSpan, startSpan } from '../../../utils/langfuse'
import { GraphState } from '../state'

export async function semanticCacheNode(state: GraphState): Promise<Partial<GraphState>> {
  const span = startSpan(state.langfuseTrace ?? null, 'semantic-cache', {
    query: state.request.query,
  })
  try {
    const { pipelineConfig, earlyQueryVector, queryService, isAnonymousNoHistory } = state

    if (!pipelineConfig.semantic_cache_enabled || !earlyQueryVector || !isAnonymousNoHistory) {
      endSpan(span, { output: { skipped: true } })
      return {}
    }

    const semanticCached = await queryService.checkSemanticCache(
      earlyQueryVector,
      pipelineConfig.semantic_cache_threshold
    )

    if (semanticCached) {
      // 記錄快取命中日誌
      queryService
        .logQuery({
          userId: null,
          query: state.request.query,
          response: '',
          sources: [],
          latencyMs: Date.now() - state.startTime,
          tokenCount: 0,
          cacheHit: true,
          pipelineTrace: JSON.stringify({ cache: { type: 'semantic' } }),
        })
        .catch(() => {})

      endSpan(span, { output: { cache_hit: true } })
      return { earlyReturn: semanticCached }
    }

    endSpan(span, { output: { cache_hit: false } })
    return {}
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } })
    throw err
  }
}
