import { PipelineContext, PipelineStep } from '../types'

export const mmrStep: PipelineStep = {
  id: 'mmr',
  name: 'MMR 多樣性選取',
  description: '從重排候選中兼顧相關性與多樣性選取 top-N',
  phase: 'post-retrieval',
  defaultEnabled: true,
  defaultOrder: 9,
  requires: ['candidateMatches', 'documents'],
  provides: ['rerankedMatches'],
  skipWhen: [
    {
      field: 'queryType',
      operator: 'in',
      value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed', 'multi-tool'],
    },
  ],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    // Plan-and-Execute 已完成 synthesis，跳過 post-retrieval
    if (ctx.skipPostRetrieval) {
      ctx.rerankedMatches = (ctx.scoredCandidates ?? []).map((m) => ({ ...m, finalScore: m.score }))
      ctx.trace.mmr_selection = { skipped_reason: 'skipPostRetrieval' }
      return ctx
    }

    const { pipelineConfig, trace } = ctx
    const scoredCandidates = ctx.scoredCandidates ?? ctx.candidateMatches ?? []
    const documents = ctx.documents ?? new Map()
    const effectiveLimit = pipelineConfig.max_results

    const mmrSelected = ctx.queryService.applyMMR(
      scoredCandidates,
      documents,
      pipelineConfig.mmr_lambda,
      effectiveLimit
    )

    trace.mmr_selection = {
      lambda: pipelineConfig.mmr_lambda,
      input_count: scoredCandidates.length,
      selected_count: mmrSelected.length,
      popularity_weight: pipelineConfig.popularity_weight,
    }

    // rerankedMatches 暫存為 MMR 選出的候選（popularity-rerank 會加權排序）
    ctx.rerankedMatches = mmrSelected.map((m) => ({ ...m, finalScore: m.score }))

    return ctx
  },
}
