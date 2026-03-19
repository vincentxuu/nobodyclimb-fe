import { GraphState } from '../state';
import { startSpan, endSpan } from '../langfuse';

export async function mmrNode(state: GraphState): Promise<Partial<GraphState>> {
  const span = startSpan(state.langfuseTrace ?? null, 'mmr', {
    candidateCount: (state.scoredCandidates ?? []).length,
  });
  try {
    // Plan-and-Execute 已完成 synthesis，跳過 post-retrieval
    if (state.skipPostRetrieval) {
      endSpan(span, { output: { skipped: true } });
      return {
        rerankedMatches: (state.scoredCandidates ?? []).map((m) => ({ ...m, finalScore: m.score })),
        trace: { mmr_selection: { skipped_reason: 'skipPostRetrieval' } },
      };
    }

    const { pipelineConfig } = state;
    const scoredCandidates = state.scoredCandidates ?? [];
    const documents = state.documents ?? new Map();
    const effectiveLimit = pipelineConfig.max_results;

    const mmrSelected = state.queryService.applyMMR(scoredCandidates, documents, pipelineConfig.mmr_lambda, effectiveLimit);

    endSpan(span, { output: { selectedCount: mmrSelected.length } });
    return {
      rerankedMatches: mmrSelected.map((m) => ({ ...m, finalScore: m.score })),
      trace: {
        mmr_selection: {
          lambda: pipelineConfig.mmr_lambda,
          input_count: scoredCandidates.length,
          selected_count: mmrSelected.length,
          popularity_weight: pipelineConfig.popularity_weight,
        },
      },
    };
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } });
    throw err;
  }
}
