import { GraphState } from '../state';
import { startSpan, endSpan } from '../../../utils/langfuse';

export async function multiQueryNode(state: GraphState): Promise<Partial<GraphState>> {
  // 業務邏輯跳過：non-complex 或 agentic 模式
  if (state.queryType !== 'complex' || state.pipelineConfig.rag_strategy === 'agentic') {
    return {};
  }

  const span = startSpan(state.langfuseTrace ?? null, 'multi-query', {
    query: state.request.query,
  });

  try {
    const { request, pipelineConfig, prompts, gatewayOptions, queryService } = state;
    const llmModel = pipelineConfig.llm_model;

    const multiQueryResult = await queryService.generateMultipleQueries(
      request.query,
      pipelineConfig.multi_query_count,
      llmModel,
      gatewayOptions,
      prompts['MULTI_QUERY_EXPANSION_PROMPT'],
    );

    const expandedQueries = multiQueryResult.queries;
    const tokenBreakdown = multiQueryResult.usage
      ? { multi_query: { ...multiQueryResult.usage, model: llmModel, estimated: false } }
      : {};

    const traceUpdate =
      expandedQueries.length > 0 ? { multi_query: { queries: expandedQueries } } : {};

    endSpan(span, {
      output: { queryCount: expandedQueries.length, queries: expandedQueries },
    });

    return {
      expandedQueries,
      ...(Object.keys(tokenBreakdown).length > 0 ? { tokenBreakdown: tokenBreakdown as GraphState['tokenBreakdown'] } : {}),
      ...(Object.keys(traceUpdate).length > 0 ? { trace: traceUpdate } : {}),
    };
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } });
    throw err;
  }
}
