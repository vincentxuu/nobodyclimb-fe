import { PipelineStep, PipelineContext } from '../types';

export const crossEncoderStep: PipelineStep = {
  id: 'cross-encoder',
  name: 'Cross-encoder Reranking',
  description: '使用 bge-reranker-base 對候選文件重新評分',
  phase: 'post-retrieval',
  defaultEnabled: true,
  defaultOrder: 8,
  requires: ['candidateMatches', 'documents'],
  provides: ['scoredCandidates'],
  skipWhen: [{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed', 'multi-tool'] }],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    // Plan-and-Execute 已完成 synthesis，跳過 post-retrieval
    if (ctx.skipPostRetrieval) {
      ctx.scoredCandidates = ctx.candidateMatches ?? [];
      if (ctx.trace.retrieval) {
        (ctx.trace.retrieval as Record<string, unknown>).reranker = { skipped_reason: 'skipPostRetrieval' };
      }
      return ctx;
    }

    const { env, request, trace } = ctx;
    const candidateMatches = ctx.candidateMatches ?? [];
    const documents = ctx.documents ?? new Map();

    // 業務邏輯跳過：候選數 ≤ 1
    const rerankCandidates = candidateMatches.filter((m) => documents.has(m.id));
    if (rerankCandidates.length <= 1) {
      ctx.scoredCandidates = candidateMatches;
      if (trace.retrieval) {
        (trace.retrieval as Record<string, unknown>).reranker = {
          skipped_reason: 'too_few_candidates',
        };
      }
      return ctx;
    }

    try {
      const contexts = rerankCandidates.map((m) => ({ text: documents.get(m.id)!.text }));
      const rerankerResult = await (env.AI.run as Function)(
        '@cf/baai/bge-reranker-base',
        { query: request.query, contexts }
      ) as { response: { id: number; score: number }[] };

      if (rerankerResult?.response?.length > 0) {
        const scoreByIdx = new Map(rerankerResult.response.map((r) => [r.id, r.score]));
        const scored = rerankCandidates.map((m, idx) => ({
          ...m,
          score: scoreByIdx.get(idx) ?? m.score,
        }));

        // 閾值過濾：移除低相關性文件，保留 min_keep 安全網
        const threshold = ctx.pipelineConfig.reranker_relevance_threshold;
        const minKeep = ctx.pipelineConfig.reranker_min_keep;
        const sorted = [...scored].sort((a, b) => b.score - a.score);
        const filtered = sorted.filter((m) => m.score >= threshold);
        const beforeCount = sorted.length;
        ctx.scoredCandidates = filtered.length >= minKeep
          ? filtered
          : sorted.slice(0, minKeep);
        const filteredCount = beforeCount - ctx.scoredCandidates.length;

        if (trace.retrieval) {
          (trace.retrieval as Record<string, unknown>).reranker_used = true;
          (trace.retrieval as Record<string, unknown>).reranker = {
            input_count: rerankCandidates.length,
            filtered_count: filteredCount,
            threshold_used: threshold,
            top_scores: ctx.scoredCandidates.map((m) => {
              const doc = documents.get(m.id);
              return {
                title: doc ? ctx.queryService.extractTitle(doc) : m.id,
                score: Math.round(m.score * 1000) / 1000,
              };
            }),
          };
        }
      } else {
        ctx.scoredCandidates = candidateMatches;
      }
    } catch {
      ctx.scoredCandidates = candidateMatches;
    }

    return ctx;
  },
};
