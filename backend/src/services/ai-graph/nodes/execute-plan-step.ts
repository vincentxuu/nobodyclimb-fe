import { GraphState } from '../state';
import { startSpan, endSpan } from '../../../utils/langfuse';
import { hybridSearchNode } from './hybrid-search';
import { crossEncoderNode } from './cross-encoder';
import type { PlanStepExtended } from './planning';

export async function executePlanStepNode(state: GraphState): Promise<Partial<GraphState>> {
  const currentStep = (state as GraphState & { currentPlanStep?: PlanStepExtended }).currentPlanStep;
  const span = startSpan(state.langfuseTrace ?? null, 'execute-plan-step', {
    stepId: currentStep?.id,
    query: currentStep?.query,
    tool: currentStep?.tool,
  });
  try {
    // 將 currentPlanStep 的 query / filter 覆蓋到 state，令 hybridSearchNode 使用子任務查詢
    const stepState: GraphState = currentStep
      ? {
          ...state,
          request: { ...state.request, query: currentStep.query },
          vectorFilter: (currentStep.filters ?? {}) as Record<string, unknown>,
        }
      : state;

    // 執行 hybrid search（vector + BM25 + RRF）
    const afterSearch = await hybridSearchNode(stepState);
    const mergedAfterSearch = { ...stepState, ...afterSearch } as GraphState;

    // Cross-encoder reranking
    const afterRerank = await crossEncoderNode(mergedAfterSearch);

    const docCount =
      (afterRerank.scoredCandidates?.length ?? 0) ||
      (afterRerank.candidateMatches?.length ?? 0);

    // 將本步驟結果寫入 branchResults（以 stepId 為 key）
    const stepKey = currentStep ? `plan_step_${currentStep.id}` : 'plan_step_0';
    const branchResults = new Map(state.branchResults ?? []);
    branchResults.set(stepKey, {
      candidateMatches: afterRerank.candidateMatches ?? mergedAfterSearch.candidateMatches,
      documents: afterRerank.documents ?? mergedAfterSearch.documents,
      scoredCandidates: afterRerank.scoredCandidates,
      sources: afterRerank.sources,
      context: afterRerank.context,
    });

    endSpan(span, { output: { docCount, stepKey } });
    return {
      ...afterRerank,
      branchResults,
    };
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } });
    throw err;
  }
}
