import { GraphState } from '../state';
import { startSpan, endSpan } from '../../../utils/langfuse';
import { SearchResult } from '../../pipeline/types';

/**
 * Agentic Retrieve Node
 *
 * 執行單步 agentic 搜尋，基於 agenticDecision 設定的 loopBack.reason（refinedQuery）
 * 搜尋新文件並合併到 candidateMatches。
 *
 * 使用 queryService.searchBM25 + env.VECTOR_INDEX + embeddingProvider 執行 hybrid 搜尋，
 * 再以 RRF 合併所有路徑的結果。
 */
export async function agenticRetrieveNode(state: GraphState): Promise<Partial<GraphState>> {
  const span = startSpan(state.langfuseTrace ?? null, 'agentic-retrieve', {
    loopCount: state.loopCount,
    currentDocCount: state.candidateMatches?.length ?? 0,
  });

  try {
    const { pipelineConfig, request, queryService, env, embeddingProvider } = state;
    const existingMatches = state.candidateMatches ?? [];

    // 取得本步搜尋的 query：優先使用 loopBack.reason（由 agenticDecision 設定的 refinedQuery）
    const searchQuery = state.loopBack?.reason ?? request.query;
    const vectorFilter = state.vectorFilter ?? {};

    const cragFilter = vectorFilter['crag_id'] as { $in?: string[] } | undefined;
    const isMultiCrag = Array.isArray(cragFilter?.$in) && cragFilter.$in.length > 1;
    const MERGE_TOP_K = isMultiCrag
      ? Math.max(20, pipelineConfig.merge_top_k * 2)
      : pipelineConfig.merge_top_k;

    const newMatches: SearchResult[] = [];

    // 向量搜尋（若有 embeddingProvider）
    if (embeddingProvider) {
      try {
        const queryVector = await embeddingProvider.embed(searchQuery);
        const vecResult = await env.VECTOR_INDEX.query(queryVector, {
          topK: MERGE_TOP_K,
          returnMetadata: 'all',
          filter: Object.keys(vectorFilter).length > 0 ? vectorFilter : undefined,
        });
        const vecMatches: SearchResult[] = vecResult.matches.map(
          (m: { id: string; score: number; metadata?: Record<string, unknown> }) => ({
            id: m.id,
            score: m.score,
            metadata: m.metadata,
          }),
        );
        newMatches.push(...vecMatches);
      } catch {
        // embedding 失敗：靜默降級，繼續 BM25
      }
    }

    // BM25 搜尋
    const bm25Matches = await queryService.searchBM25(searchQuery, pipelineConfig.bm25_top_k);
    newMatches.push(...bm25Matches);

    // RRF 合併：新結果 + 既有結果一起合併，去重並重新排序
    const allPaths: SearchResult[][] = [newMatches, existingMatches];
    const AGENTIC_MERGE_K = MERGE_TOP_K * 3;
    const merged = queryService.mergeResults(allPaths, AGENTIC_MERGE_K);

    const retrievalScore = merged.length > 0 ? Math.max(...merged.map((m) => m.score)) : 0;

    endSpan(span, {
      output: {
        newDocCount: newMatches.length,
        mergedDocCount: merged.length,
        searchQuery,
      },
    });

    return {
      candidateMatches: merged,
      retrievalScore,
      loopBack: undefined, // 清除 loopBack，避免殘留
      trace: {
        agentic_retrieve: {
          step: (state.loopCount ?? 1) - 1,
          search_query: searchQuery,
          new_doc_count: newMatches.length,
          merged_doc_count: merged.length,
        },
      },
    };
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } });
    throw err;
  }
}
