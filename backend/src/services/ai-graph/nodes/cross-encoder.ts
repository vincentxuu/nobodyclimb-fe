import { endSpan, startSpan } from '../../../utils/langfuse'
import { GraphState } from '../state'

export async function crossEncoderNode(state: GraphState): Promise<Partial<GraphState>> {
  const span = startSpan(state.langfuseTrace ?? null, 'cross-encoder', {
    candidateCount: (state.candidateMatches ?? []).length,
  })
  try {
    // Plan-and-Execute 已完成 synthesis，跳過 post-retrieval
    if (state.skipPostRetrieval) {
      endSpan(span, { output: { skipped: true } })
      return {
        scoredCandidates: state.candidateMatches ?? [],
        trace: {
          retrieval: { reranker: { skipped_reason: 'skipPostRetrieval' } },
        },
      }
    }

    const { env, request, trace } = state
    const candidateMatches = state.candidateMatches ?? []
    const documents = state.documents ?? new Map()

    // 業務邏輯跳過：候選數 ≤ 1
    const rerankCandidates = candidateMatches.filter((m) => documents.has(m.id))
    if (rerankCandidates.length <= 1) {
      endSpan(span, { output: { skipped: true, reason: 'too_few_candidates' } })
      return {
        scoredCandidates: candidateMatches,
        trace: {
          retrieval: { reranker: { skipped_reason: 'too_few_candidates' } },
        },
      }
    }

    try {
      const contexts = rerankCandidates.map((m) => ({ text: documents.get(m.id)!.text }))
      const rerankerResult = (await (env.AI.run as Function)('@cf/baai/bge-reranker-base', {
        query: request.query,
        contexts,
      })) as { response: { id: number; score: number }[] }

      if (rerankerResult?.response?.length > 0) {
        const scoreByIdx = new Map(rerankerResult.response.map((r) => [r.id, r.score]))
        const scored = rerankCandidates.map((m, idx) => ({
          ...m,
          score: scoreByIdx.get(idx) ?? m.score,
        }))

        // 閾值過濾：移除低相關性文件，保留 min_keep 安全網
        const threshold = state.pipelineConfig.reranker_relevance_threshold
        const minKeep = state.pipelineConfig.reranker_min_keep
        const sorted = [...scored].sort((a, b) => b.score - a.score)
        const filtered = sorted.filter((m) => m.score >= threshold)
        const beforeCount = sorted.length
        const scoredCandidates = filtered.length >= minKeep ? filtered : sorted.slice(0, minKeep)
        const filteredCount = beforeCount - scoredCandidates.length

        const rerankerTrace = {
          reranker_used: true,
          reranker: {
            input_count: rerankCandidates.length,
            filtered_count: filteredCount,
            threshold_used: threshold,
            top_scores: scoredCandidates.map((m) => {
              const doc = documents.get(m.id)
              return {
                title: doc ? state.queryService.extractTitle(doc) : m.id,
                score: Math.round(m.score * 1000) / 1000,
              }
            }),
          },
        }

        endSpan(span, { output: { scoredCount: scoredCandidates.length } })
        return {
          scoredCandidates,
          trace: { retrieval: rerankerTrace },
        }
      } else {
        endSpan(span, { output: { scoredCount: candidateMatches.length } })
        return { scoredCandidates: candidateMatches }
      }
    } catch {
      endSpan(span, { output: { scoredCount: candidateMatches.length } })
      return { scoredCandidates: candidateMatches }
    }
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } })
    throw err
  }
}
