import { PipelineStep, PipelineContext, SearchResult, AgenticStepTrace, StageTokenUsage } from '../types';

export const hybridSearchStep: PipelineStep = {
  id: 'hybrid-search',
  name: 'Vector + BM25 混合搜尋',
  description: '並行 Vectorize + BM25 搜尋，RRF 合併，含 Agentic 模式分支',
  phase: 'retrieval',
  defaultEnabled: true,
  defaultOrder: 7,
  requires: ['queryVector'],
  provides: ['candidateMatches', 'documents', 'retrievalScore'],
  skipWhen: [{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed'] }],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const { env, request, pipelineConfig, trace, queryService } = ctx;
    const { query } = request;
    const vectorFilter = ctx.vectorFilter ?? {};
    const queryVector = ctx.queryVector!;
    const hydeVector = ctx.hydeVector ?? null;
    const expandedVectors = ctx.expandedVectors ?? [];

    const qs = queryService;

    const cragFilter = vectorFilter['crag_id'] as { $in?: string[] } | undefined;
    const isMultiCrag = Array.isArray(cragFilter?.$in) && cragFilter.$in.length > 1;
    const MERGE_TOP_K = isMultiCrag ? Math.max(20, pipelineConfig.merge_top_k * 2) : pipelineConfig.merge_top_k;
    const hasFilter = Object.keys(vectorFilter).some((k) => ['grade_numeric', 'crag_id', 'area_id', 'region', 'route_type'].includes(k));
    const minScore = hasFilter ? pipelineConfig.min_rrf_score_filtered : pipelineConfig.min_rrf_score;

    let candidateMatches: SearchResult[];
    let retrievalScore = 0;

    if (pipelineConfig.rag_strategy === 'agentic' && ctx.queryType === 'complex') {
      // Agentic Multi-Step RAG
      const agenticSteps: AgenticStepTrace[] = [];
      const agenticDecisionUsages: Array<StageTokenUsage & { step: number }> = [];
      const { candidates: agenticCandidates, terminationReason: agenticTermReason } = await qs.agenticRetrieve(
        query, vectorFilter, pipelineConfig, agenticSteps, ctx.prompts['AGENTIC_DECISION_PROMPT'], agenticDecisionUsages
      );
      candidateMatches = agenticCandidates;
      if (agenticDecisionUsages.length > 0) {
        ctx.tokenBreakdown.agentic_decisions = agenticDecisionUsages;
      }
      retrievalScore = candidateMatches.length > 0 ? Math.max(...candidateMatches.map((m) => m.score)) : 0;
      trace.agentic = {
        steps: agenticSteps,
        total_paths: agenticSteps.length + 1,
        final_doc_count: candidateMatches.length,
        termination_reason: agenticTermReason,
      };
    } else {
      // Baseline：Vector + BM25 + RRF
      const hydeFilter: Record<string, unknown> =
        vectorFilter['crag_id'] || vectorFilter['area_id']
          ? { ...vectorFilter }
          : vectorFilter['type'] ? { type: vectorFilter['type'] } : {};

      const expandedFilter = vectorFilter['type'] ? { type: vectorFilter['type'] } : undefined;

      const allSearchPromises: Promise<{ matches: SearchResult[] } | SearchResult[]>[] = [
        env.VECTOR_INDEX.query(queryVector, {
          topK: MERGE_TOP_K,
          returnMetadata: 'all',
          filter: Object.keys(vectorFilter).length > 0 ? vectorFilter : undefined,
        }),
        hydeVector
          ? env.VECTOR_INDEX.query(hydeVector, {
              topK: MERGE_TOP_K,
              returnMetadata: 'all',
              filter: Object.keys(hydeFilter).length > 0 ? hydeFilter : undefined,
            })
          : Promise.resolve({ matches: [] as SearchResult[] }),
        qs.searchBM25(query, pipelineConfig.bm25_top_k),
        ...expandedVectors.map((vec) =>
          env.VECTOR_INDEX.query(vec, {
            topK: MERGE_TOP_K,
            returnMetadata: 'all',
            filter: expandedFilter,
          })
        ),
      ];

      const allResults = await Promise.all(allSearchPromises);
      const queryVecResult = allResults[0] as { matches: SearchResult[] };
      const hydeVecResult = allResults[1] as { matches: SearchResult[] };
      const bm25Matches = allResults[2] as SearchResult[];
      const expandedVecResults = (allResults.slice(3) as { matches: SearchResult[] }[])
        .map((r) => r.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata })));

      let queryMatches: SearchResult[] = queryVecResult.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata }));
      let rawHydeMatches: SearchResult[] = hydeVector
        ? hydeVecResult.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata }))
        : [];

      // 相似路線 fallback
      if (ctx.isSimRouteSearch && queryMatches.length === 0 && vectorFilter['crag_id']) {
        const relaxedFilter: Record<string, unknown> = { type: { $eq: 'route' } };
        if (vectorFilter['grade_numeric']) relaxedFilter['grade_numeric'] = vectorFilter['grade_numeric'];

        const [fbQueryResult, fbHydeResult] = await Promise.all([
          env.VECTOR_INDEX.query(queryVector, { topK: MERGE_TOP_K, returnMetadata: 'all', filter: relaxedFilter }),
          hydeVector
            ? env.VECTOR_INDEX.query(hydeVector, { topK: MERGE_TOP_K, returnMetadata: 'all', filter: relaxedFilter })
            : Promise.resolve({ matches: [] as SearchResult[] }),
        ]);
        queryMatches = fbQueryResult.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata }));
        rawHydeMatches = fbHydeResult.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata }));
      }

      const hasLocationFilter = !!(vectorFilter['crag_id'] || vectorFilter['area_id'] || vectorFilter['region']);
      const hydeMatches = (hasLocationFilter && queryMatches.length === 0) ? [] : rawHydeMatches;

      const mergedMatches = qs.mergeResults([queryMatches, hydeMatches, bm25Matches, ...expandedVecResults], MERGE_TOP_K);
      candidateMatches = mergedMatches.filter((m) => m.score >= minScore);
      retrievalScore = mergedMatches.length > 0 ? Math.max(...mergedMatches.map((m) => m.score)) : 0;

      // Retrieval trace
      const tracePaths = ['query_vec'];
      if (hydeVector) tracePaths.push('hyde_vec');
      tracePaths.push('bm25');
      expandedVectors.forEach((_, i) => tracePaths.push(`expanded_${i}`));

      type PathDoc = { id: string; score: number; name?: string };
      const toPathDocs = (results: SearchResult[], limit = 20): PathDoc[] =>
        results.slice(0, limit).map((m) => ({
          id: m.id,
          score: Math.round(m.score * 1000) / 1000,
          name: (m.metadata?.name as string | undefined) ?? (m.metadata?.crag_name as string | undefined),
        }));
      const pathCounts: Record<string, number> = { query_vec: queryMatches.length };
      const pathResults: Record<string, PathDoc[]> = { query_vec: toPathDocs(queryMatches) };
      if (hydeVector) {
        pathCounts['hyde_vec'] = hydeMatches.length;
        pathResults['hyde_vec'] = toPathDocs(hydeMatches);
      }
      pathCounts['bm25'] = bm25Matches.length;
      pathResults['bm25'] = toPathDocs(bm25Matches);
      expandedVectors.forEach((_, i) => {
        const results = expandedVecResults[i] ?? [];
        pathCounts[`expanded_${i}`] = results.length;
        pathResults[`expanded_${i}`] = toPathDocs(results);
      });

      const bm25FtsQuery = query.replace(/["\x00-\x1f()*^[\]]/g, ' ').trim() || null;
      trace.retrieval = {
        paths: tracePaths,
        path_counts: pathCounts,
        path_results: pathResults,
        bm25_fts_query: bm25FtsQuery,
        candidates_before_filter: mergedMatches.length,
        candidates_after_filter: candidateMatches.length,
        crag_fallback: false,
        crag_fallback_stage: null as 'grade' | null,
        reranker_used: false,
        rrf: {
          paths_count: tracePaths.length,
          merged_count: mergedMatches.length,
          min_score_threshold: minScore,
          after_threshold_count: candidateMatches.length,
        },
        crag_fallback_detail: null as null | { trigger_reason: string; retries: { removed_filter: string; candidates_after: number }[] },
      };

      // CRAG fallback
      if (candidateMatches.length === 0 && vectorFilter['grade_numeric']) {
        const relaxedFilter = { ...vectorFilter };
        delete relaxedFilter['grade_numeric'];
        const retryResult = await env.VECTOR_INDEX.query(queryVector, {
          topK: MERGE_TOP_K,
          returnMetadata: 'all',
          filter: Object.keys(relaxedFilter).length > 0 ? relaxedFilter : undefined,
        });
        const retryMatches = retryResult.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata }));
        const retryMerged = qs.mergeResults([retryMatches, bm25Matches], MERGE_TOP_K);
        candidateMatches = retryMerged.filter((m) => m.score >= minScore);
        if (candidateMatches.length > 0) {
          (trace.retrieval as Record<string, unknown>).crag_fallback = true;
          (trace.retrieval as Record<string, unknown>).crag_fallback_stage = 'grade';
          (trace.retrieval as Record<string, unknown>).crag_fallback_detail = {
            trigger_reason: 'no_results_with_grade_filter',
            retries: [{ removed_filter: 'grade_numeric', candidates_after: candidateMatches.length }],
          };
        }
      }
    }

    // 取得完整文件
    const documents = await qs.getDocuments(candidateMatches.map((m) => m.id));

    // 排除來源路線
    if (ctx.excludeRouteId) {
      for (const [embeddingId, doc] of documents) {
        if (doc.source_id === ctx.excludeRouteId) {
          documents.delete(embeddingId);
        }
      }
    }

    ctx.candidateMatches = candidateMatches;
    ctx.documents = documents;
    ctx.retrievalScore = retrievalScore;

    return ctx;
  },
};
