import { GraphState } from '../state';
import { startSpan, endSpan } from '../langfuse';
import { SYNTHESIS_PROMPT } from '../../../utils/ai-prompts';
import type { AISource } from '../../../types';
import type { StepExecutionResult } from '../../query/types';

/**
 * 將 branchResults Map 轉換為 StepExecutionResult 陣列，
 * 供 queryService.synthesize() 使用
 */
function branchResultsToStepResults(
  branchResults: Map<string, Partial<unknown>> | undefined,
  query: string,
): StepExecutionResult[] {
  if (!branchResults || branchResults.size === 0) return [];

  const results: StepExecutionResult[] = [];
  let idx = 1;
  for (const [key, branch] of branchResults.entries()) {
    const b = branch as Record<string, unknown>;
    // key format: "plan_step_N"
    const stepId = parseInt(key.replace('plan_step_', ''), 10) || idx;
    const candidates = (b['candidateMatches'] as StepExecutionResult['candidates']) ?? [];
    const documents = (b['documents'] as StepExecutionResult['documents']) ?? new Map();
    const context = typeof b['context'] === 'string' ? b['context'] : undefined;

    results.push({
      stepId,
      query,
      tool: 'search_routes', // 預設 tool；plan-execute 各步驟已執行完畢
      candidates,
      documents,
      sqlContext: context,
      durationMs: 0,
    });
    idx++;
  }
  return results;
}

/** Plan-and-Execute：將多源檢索結果合併為結構化 context */
export async function synthesisNode(state: GraphState): Promise<Partial<GraphState>> {
  const branchCount = state.branchResults?.size ?? 0;
  const span = startSpan(state.langfuseTrace ?? null, 'synthesis', {
    branchCount,
  });
  try {
    const { request, pipelineConfig: cfg, prompts, queryService } = state;
    const query = request.query;

    // 若無任何分支結果，回傳空 context
    if (branchCount === 0) {
      const fallbackContext = state.context ?? '';
      const sources: AISource[] = state.sources ?? [];
      endSpan(span, { output: { contextLength: fallbackContext.length, reason: 'no_branch_results' } });
      return { context: fallbackContext, sources };
    }

    // 將 branchResults 轉換為 StepExecutionResult 格式
    const stepResults = branchResultsToStepResults(
      state.branchResults as Map<string, Partial<unknown>> | undefined,
      query,
    );

    // 使用 queryService.synthesize() 合併多步結果
    try {
      const { context, sources, usage: synthUsage } = await queryService.synthesize(
        query,
        stepResults,
        cfg,
        prompts['SYNTHESIS_PROMPT'] ?? SYNTHESIS_PROMPT,
        state.gatewayOptions,
      );

      const tokenBreakdown = synthUsage
        ? { ...state.tokenBreakdown, synthesis: { ...synthUsage, model: cfg.llm_model } }
        : state.tokenBreakdown;

      endSpan(span, { output: { contextLength: context.length, sourceCount: sources.length } });
      return {
        context,
        sources,
        skipPostRetrieval: true,
        tokenBreakdown,
        trace: {
          synthesis: {
            branch_count: branchCount,
            step_count: stepResults.length,
            context_length: context.length,
            source_count: sources.length,
          },
        },
      };
    } catch (synthErr) {
      // synthesis 失敗 → 簡單拼接 fallback
      const parts: string[] = [];
      for (const r of stepResults) {
        if (r.sqlContext) {
          parts.push(r.sqlContext);
        } else {
          for (const c of r.candidates.slice(0, 10)) {
            const doc = r.documents.get(c.id);
            if (doc) parts.push(`【${doc.title}】${doc.excerpt}`);
          }
        }
      }
      const context = parts.join('\n\n') || '無相關資料';
      const sources: AISource[] = state.sources ?? [];

      endSpan(span, {
        output: { contextLength: context.length, reason: 'fallback' },
        metadata: { error: String(synthErr) },
      });
      return {
        context,
        sources,
        skipPostRetrieval: true,
        degradedStages: ['synthesis-fallback'],
      };
    }
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } });
    throw err;
  }
}
