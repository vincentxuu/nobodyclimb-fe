import { PipelineContext, PipelineStep } from '../types'

export const semanticCacheStep: PipelineStep = {
  id: 'semantic-cache',
  name: '語義快取檢查',
  description: '比對向量空間近似問題，命中時直接回傳快取回應',
  phase: 'pre-retrieval',
  defaultEnabled: true,
  defaultOrder: 0,
  requires: [],
  provides: ['earlyReturn'],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const { pipelineConfig, earlyQueryVector, queryService, isAnonymousNoHistory } = ctx

    if (!pipelineConfig.semantic_cache_enabled || !earlyQueryVector || !isAnonymousNoHistory) {
      return ctx
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
          query: ctx.request.query,
          response: '',
          sources: [],
          latencyMs: Date.now() - ctx.startTime,
          tokenCount: 0,
          cacheHit: true,
          pipelineTrace: JSON.stringify({ cache: { type: 'semantic' } }),
        })
        .catch(() => {})

      ctx.earlyReturn = semanticCached
    }

    return ctx
  },
}
