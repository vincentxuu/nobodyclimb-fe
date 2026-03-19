import { GraphState } from '../state';
import { startSpan, endSpan } from '../langfuse';
import { SearchResult } from '../../pipeline/types';
import { AgenticStepTrace, StageTokenUsage } from '../../pipeline/types';

export async function hybridSearchNode(state: GraphState): Promise<Partial<GraphState>> {
  const span = startSpan(state.langfuseTrace ?? null, 'hybrid-search', {
    queryType: state.queryType,
  });
  try {
    const { env, request, pipelineConfig, trace, queryService } = state;
    const { query } = request;
    const vectorFilter = state.vectorFilter ?? {};

    // Embedding 降級：僅使用 BM25 搜尋（向量不可用）
    if (state.embeddingFailed) {
      const qs = queryService;
      const hasFilter = Object.keys(vectorFilter).some((k) => ['grade_numeric', 'crag_id', 'area_id', 'region', 'route_type'].includes(k));
      const minScore = hasFilter ? pipelineConfig.min_rrf_score_filtered : pipelineConfig.min_rrf_score;
      const bm25Matches = await qs.searchBM25(query, pipelineConfig.bm25_top_k);
      const candidateMatches = bm25Matches.filter((m) => m.score >= minScore);
      const retrievalScore = bm25Matches.length > 0 ? Math.max(...bm25Matches.map((m) => m.score)) : 0;

      const documents = await qs.getDocuments(candidateMatches.map((m) => m.id));
      if (state.excludeRouteId) {
        for (const [embeddingId, doc] of documents) {
          if (doc.source_id === state.excludeRouteId) documents.delete(embeddingId);
        }
      }

      endSpan(span, { output: { docCount: candidateMatches.length } });
      return {
        candidateMatches,
        documents,
        retrievalScore,
        trace: {
          retrieval: {
            paths: ['bm25_only'],
            degraded: true,
            degraded_reason: 'embedding_timeout',
            bm25_count: bm25Matches.length,
            candidates_after_filter: candidateMatches.length,
          },
        },
      };
    }

    // Multi-Tool 分支：直接復用 executePlan + synthesize
    if (state.queryType === 'multi-tool' && state.multiToolPlan) {
      const qs = queryService;
      const multiToolStart = Date.now();
      const plan = state.multiToolPlan;

      // 將 MultiToolPlan 轉換為 ExecutionPlan 格式
      const execPlan = {
        steps: plan.steps.map((s, i) => ({
          id: i + 1,
          query: s.query || query,
          tool: s.tool,
          filters: s.params || {},
          depends_on: plan.execution_mode === 'sequential' && i > 0 ? [i] : [],
        })),
        execution_mode: plan.execution_mode,
      };

      try {
        const { results: stepResults } = await qs.executePlan(execPlan, pipelineConfig, state.gatewayOptions);
        const { context: synthesizedContext, sources, usage: synthUsage } = await qs.synthesize(
          query, stepResults, pipelineConfig,
          state.prompts['SYNTHESIS_PROMPT'], state.gatewayOptions,
        );

        const tokenBreakdown = synthUsage
          ? { ...state.tokenBreakdown, synthesis: { ...synthUsage, model: pipelineConfig.llm_model } }
          : state.tokenBreakdown;

        const retrievalScore = sources.length > 0 ? Math.max(...sources.map((s) => s.score ?? 0)) : 0;

        endSpan(span, { output: { docCount: sources.length } });
        return {
          context: synthesizedContext,
          sources,
          skipPostRetrieval: true,
          candidateMatches: [],
          documents: new Map(),
          retrievalScore,
          tokenBreakdown,
          trace: {
            multi_tool: {
              steps: stepResults.map((r) => ({
                stepId: r.stepId, query: r.query, tool: r.tool,
                result_count: r.candidates.length + (r.sqlContext ? 1 : 0),
                duration_ms: r.durationMs, error: r.error,
              })),
              execution_mode: plan.execution_mode,
              total_duration_ms: Date.now() - multiToolStart,
              sources_count: sources.length,
            },
            generation: {
              context_doc_count: sources.length,
              personalized: !!state.userId,
              regen_triggered: false,
              ability_level: state.abilityLevel,
              strategy: 'multi-tool',
            },
          },
        };
      } catch (err) {
        // multi-tool 執行失敗 → BM25 降級
        const bm25Matches = await qs.searchBM25(query, pipelineConfig.bm25_top_k);
        const documents = await qs.getDocuments(bm25Matches.map((m) => m.id));
        const retrievalScore = bm25Matches.length > 0 ? Math.max(...bm25Matches.map((m) => m.score)) : 0;

        endSpan(span, { output: { docCount: bm25Matches.length } });
        return {
          candidateMatches: bm25Matches,
          documents,
          retrievalScore,
          degradedStages: ['multi-tool-fallback'],
          trace: {
            multi_tool: {
              fallback: true,
              error: err instanceof Error ? err.message : String(err),
              total_duration_ms: Date.now() - multiToolStart,
            },
          },
        };
      }
    }

    const queryVector = state.queryVector!;
    const hydeVector = state.hydeVector ?? null;
    const expandedVectors = state.expandedVectors ?? [];

    const qs = queryService;

    const cragFilter = vectorFilter['crag_id'] as { $in?: string[] } | undefined;
    const isMultiCrag = Array.isArray(cragFilter?.$in) && cragFilter.$in.length > 1;
    const MERGE_TOP_K = isMultiCrag ? Math.max(20, pipelineConfig.merge_top_k * 2) : pipelineConfig.merge_top_k;
    const hasFilter = Object.keys(vectorFilter).some((k) => ['grade_numeric', 'crag_id', 'area_id', 'region', 'route_type'].includes(k));
    const minScore = hasFilter ? pipelineConfig.min_rrf_score_filtered : pipelineConfig.min_rrf_score;

    let candidateMatches: SearchResult[];
    let retrievalScore = 0;

    // 決定有效策略
    const effectiveStrategy = pipelineConfig.rag_strategy === 'auto'
      ? (state.strategyHint ?? 'baseline')
      : pipelineConfig.rag_strategy;

    // Plan-and-Execute 分支（重置 skipPostRetrieval 防止 loopBack 殘留）
    let planExecuteFallbackToAgentic = false;
    const updates: Partial<GraphState> = { skipPostRetrieval: false };

    if (effectiveStrategy === 'plan-execute' && state.queryType === 'complex') {
      const planExecuteStart = Date.now();
      const cragNames = (state.preloadedCrags ?? []).map((c) => c.name);
      const areaNames = (state.preloadedAreas ?? []).map((a) => a.name);

      const { plan, failureReason, usage: planUsage } = await qs.planQuery(
        query, pipelineConfig, cragNames, areaNames,
        state.prompts['PLANNING_PROMPT'], state.gatewayOptions,
      );
      const planningDurationMs = Date.now() - planExecuteStart;

      const tokenBreakdown = planUsage
        ? { ...state.tokenBreakdown, planning: { ...planUsage, model: pipelineConfig.llm_model } }
        : state.tokenBreakdown;
      if (planUsage) updates.tokenBreakdown = tokenBreakdown;

      if (!plan) {
        // Planning 失敗 → fallback 到 agentic
        updates.trace = {
          plan_execute: {
            strategy: 'plan-execute',
            planning_duration_ms: planningDurationMs,
            plan_fallback: { reason: failureReason ?? 'planning_failed', target: 'agentic' },
            total_duration_ms: Date.now() - planExecuteStart,
          },
        };
        planExecuteFallbackToAgentic = true;
      } else if (
        pipelineConfig.rag_strategy === 'auto' &&
        plan.steps.length < pipelineConfig.plan_execute_min_entities
      ) {
        // auto 模式：子任務太少 → 降級為 agentic
        updates.trace = {
          plan_execute: {
            strategy: 'plan-execute',
            planning_duration_ms: planningDurationMs,
            plan,
            plan_fallback: { reason: 'too_few_steps', step_count: plan.steps.length, min_required: pipelineConfig.plan_execute_min_entities, target: 'agentic' },
            total_duration_ms: Date.now() - planExecuteStart,
          },
        };
        planExecuteFallbackToAgentic = true;
      } else {
        // 正常執行計畫
        try {
          const executionStart = Date.now();
          const { results: stepResults, adaptiveReplan, adaptiveReplanInfo } = await qs.executePlan(
            plan, pipelineConfig, state.gatewayOptions,
          );
          const executionDurationMs = Date.now() - executionStart;

          const synthesisStart = Date.now();
          const { context: synthesizedContext, sources, usage: synthUsage } = await qs.synthesize(
            query, stepResults, pipelineConfig,
            state.prompts['SYNTHESIS_PROMPT'], state.gatewayOptions,
          );
          const synthesisDurationMs = Date.now() - synthesisStart;

          const finalTokenBreakdown = synthUsage
            ? { ...(updates.tokenBreakdown ?? state.tokenBreakdown), synthesis: { ...synthUsage, model: pipelineConfig.llm_model } }
            : (updates.tokenBreakdown ?? state.tokenBreakdown);

          const retriScore = sources.length > 0 ? Math.max(...sources.map((s) => s.score ?? 0)) : 0;

          endSpan(span, { output: { docCount: sources.length } });
          return {
            ...updates,
            tokenBreakdown: finalTokenBreakdown,
            context: synthesizedContext,
            sources,
            skipPostRetrieval: true,
            candidateMatches: [],
            documents: new Map(),
            retrievalScore: retriScore,
            trace: {
              plan_execute: {
                strategy: 'plan-execute',
                planning_duration_ms: planningDurationMs,
                plan,
                steps: stepResults.map((r) => ({
                  stepId: r.stepId, query: r.query, tool: r.tool,
                  result_count: r.candidates.length + (r.sqlContext ? 1 : 0),
                  duration_ms: r.durationMs, error: r.error,
                })),
                execution_duration_ms: executionDurationMs,
                synthesis_duration_ms: synthesisDurationMs,
                total_duration_ms: Date.now() - planExecuteStart,
                sources_count: sources.length,
                adaptive_replan: adaptiveReplan,
                ...(adaptiveReplanInfo ? { adaptive_replan_info: adaptiveReplanInfo } : {}),
              },
              generation: {
                context_doc_count: sources.length,
                personalized: !!state.userId,
                regen_triggered: false,
                ability_level: state.abilityLevel,
                strategy: 'plan-execute',
              },
            },
          };
        } catch (err) {
          // executePlan 或 synthesize 拋出異常 → fallback 到 agentic
          updates.trace = {
            plan_execute: {
              strategy: 'plan-execute',
              planning_duration_ms: planningDurationMs,
              plan,
              plan_fallback: {
                reason: 'execution_error',
                error: err instanceof Error ? err.message : String(err),
                target: 'agentic',
              },
              total_duration_ms: Date.now() - planExecuteStart,
            },
          };
          planExecuteFallbackToAgentic = true;
        }
      }
    }

    if ((effectiveStrategy === 'agentic' || planExecuteFallbackToAgentic) && state.queryType === 'complex') {
      // Agentic Multi-Step RAG（也作為 Plan-and-Execute fallback）
      const agenticSteps: AgenticStepTrace[] = [];
      const agenticDecisionUsages: Array<StageTokenUsage & { step: number }> = [];
      const { candidates: agenticCandidates, terminationReason: agenticTermReason } = await qs.agenticRetrieve(
        query, vectorFilter, pipelineConfig, agenticSteps, state.prompts['AGENTIC_DECISION_PROMPT'], agenticDecisionUsages
      );
      candidateMatches = agenticCandidates;
      if (agenticDecisionUsages.length > 0) {
        updates.tokenBreakdown = { ...state.tokenBreakdown, agentic_decisions: agenticDecisionUsages };
      }
      retrievalScore = candidateMatches.length > 0 ? Math.max(...candidateMatches.map((m) => m.score)) : 0;
      updates.trace = {
        ...(updates.trace ?? {}),
        agentic: {
          steps: agenticSteps,
          total_paths: agenticSteps.length + 1,
          final_doc_count: candidateMatches.length,
          termination_reason: agenticTermReason,
        },
      };
    } else {
      // Baseline：Vector + BM25 + RRF
      const hydeFilter: Record<string, unknown> =
        vectorFilter['crag_id'] || vectorFilter['area_id']
          ? { ...vectorFilter }
          : vectorFilter['type'] ? { type: vectorFilter['type'] } : {};

      const expandedFilter = vectorFilter['type'] ? { type: vectorFilter['type'] } : undefined;

      const retrievalMethod = state.retrievalMethod ?? 'hybrid';

      // 根據 retrievalMethod 選擇性執行搜尋路徑
      const skipVector = retrievalMethod === 'bm25';
      const skipBM25 = retrievalMethod === 'vector';

      const allSearchPromises: Promise<{ matches: SearchResult[] } | SearchResult[]>[] = [
        !skipVector
          ? env.VECTOR_INDEX.query(queryVector, {
              topK: MERGE_TOP_K,
              returnMetadata: 'all',
              filter: Object.keys(vectorFilter).length > 0 ? vectorFilter : undefined,
            })
          : Promise.resolve({ matches: [] as SearchResult[] }),
        !skipVector && hydeVector
          ? env.VECTOR_INDEX.query(hydeVector, {
              topK: MERGE_TOP_K,
              returnMetadata: 'all',
              filter: Object.keys(hydeFilter).length > 0 ? hydeFilter : undefined,
            })
          : Promise.resolve({ matches: [] as SearchResult[] }),
        !skipBM25
          ? qs.searchBM25(query, pipelineConfig.bm25_top_k)
          : Promise.resolve([] as SearchResult[]),
        ...(!skipVector
          ? expandedVectors.map((vec) =>
              env.VECTOR_INDEX.query(vec, {
                topK: MERGE_TOP_K,
                returnMetadata: 'all',
                filter: expandedFilter,
              })
            )
          : []),
      ];

      const allResults = await Promise.all(allSearchPromises);
      const queryVecResult = allResults[0] as { matches: SearchResult[] };
      const hydeVecResult = allResults[1] as { matches: SearchResult[] };
      const bm25Matches = allResults[2] as SearchResult[];
      const expandedVecResults = (!skipVector
        ? (allResults.slice(3) as { matches: SearchResult[] }[])
            .map((r) => r.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata })))
        : []);

      let queryMatches: SearchResult[] = queryVecResult.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata }));
      let rawHydeMatches: SearchResult[] = hydeVector && !skipVector
        ? hydeVecResult.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata }))
        : [];

      // 相似路線 fallback
      if (state.isSimRouteSearch && queryMatches.length === 0 && vectorFilter['crag_id']) {
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
      const retrievalTrace = {
        retrieval_method: retrievalMethod,
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
          retrievalTrace.crag_fallback = true;
          retrievalTrace.crag_fallback_stage = 'grade';
          retrievalTrace.crag_fallback_detail = {
            trigger_reason: 'no_results_with_grade_filter',
            retries: [{ removed_filter: 'grade_numeric', candidates_after: candidateMatches.length }],
          };
        }
      }

      updates.trace = { ...(updates.trace ?? {}), retrieval: retrievalTrace };
    }

    // 取得完整文件
    const documents = await qs.getDocuments(candidateMatches.map((m) => m.id));

    // 排除來源路線
    if (state.excludeRouteId) {
      for (const [embeddingId, doc] of documents) {
        if (doc.source_id === state.excludeRouteId) {
          documents.delete(embeddingId);
        }
      }
    }

    // Tool Fallback：中等信心 + 空結果 → 切換到備選工具並重新執行
    const toolFallbackUpdates: Partial<GraphState> = {};
    if (state.fallbackEnabled && candidateMatches.length === 0 && state.alternativeTool) {
      const fromTool = state.parsedQuery?.tool;
      const toTool = state.alternativeTool;

      const updatedParsedQuery = state.parsedQuery
        ? { ...state.parsedQuery, tool: toTool as typeof state.parsedQuery.tool }
        : state.parsedQuery;

      let queryType = state.queryType;
      let effectiveLlmModel = state.effectiveLlmModel;
      if (toTool === 'general_knowledge') {
        queryType = 'general-knowledge';
        effectiveLlmModel = state.pipelineConfig.lightweight_model;
      } else if (toTool === 'search_sql') {
        queryType = 'sql';
        effectiveLlmModel = state.pipelineConfig.lightweight_model;
      } else if (toTool === 'hybrid') {
        queryType = 'hybrid';
      } else {
        queryType = state.parsedQuery?.query_type ?? 'complex';
      }

      const existingToolSelection = (trace.tool_selection ?? {}) as Record<string, unknown>;
      toolFallbackUpdates.parsedQuery = updatedParsedQuery;
      toolFallbackUpdates.queryType = queryType;
      toolFallbackUpdates.effectiveLlmModel = effectiveLlmModel;
      toolFallbackUpdates.fallbackEnabled = false;
      toolFallbackUpdates.vectorFilter = {};
      toolFallbackUpdates.loopBack = { targetPhase: 'pre-retrieval', reason: 'tool_fallback' };
      toolFallbackUpdates.trace = {
        tool_selection: {
          ...existingToolSelection,
          fallback: {
            triggered: true,
            from_tool: fromTool,
            to_tool: toTool,
            reason: 'empty_results',
          },
        },
      };
    }

    endSpan(span, { output: { docCount: candidateMatches.length } });
    return {
      ...updates,
      ...toolFallbackUpdates,
      candidateMatches,
      documents,
      retrievalScore,
    };
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } });
    throw err;
  }
}
