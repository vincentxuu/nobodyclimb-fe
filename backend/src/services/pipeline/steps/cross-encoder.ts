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
  skipWhen: [{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed'] }],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
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
        ctx.scoredCandidates = rerankCandidates.map((m, idx) => ({
          ...m,
          score: scoreByIdx.get(idx) ?? m.score,
        }));
        if (trace.retrieval) {
          (trace.retrieval as Record<string, unknown>).reranker_used = true;
          const sortedByReranker = [...ctx.scoredCandidates].sort((a, b) => b.score - a.score);
          (trace.retrieval as Record<string, unknown>).reranker = {
            input_count: rerankCandidates.length,
            top_scores: sortedByReranker.map((m) => ({
              title: ctx.queryService.extractTitle(documents.get(m.id)!),
              score: Math.round(m.score * 1000) / 1000,
            })),
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
