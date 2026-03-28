import { GraphState } from '../state';
import { startSpan, endSpan } from '../../../utils/langfuse';

export async function hydeNode(state: GraphState): Promise<Partial<GraphState>> {
  // 業務邏輯跳過：simple query 或 agentic 模式或已有 hydeDoc（similar route 已生成）
  if (
    state.queryType === 'simple' ||
    state.pipelineConfig.rag_strategy === 'agentic' ||
    (state.hydeDoc && state.hydeDoc !== '')
  ) {
    return {};
  }

  // skipWhen：queryType in ['general-knowledge', 'sql', 'hybrid', 'clarification-needed', 'multi-tool']
  if (
    state.queryType === 'general-knowledge' ||
    state.queryType === 'sql' ||
    state.queryType === 'hybrid' ||
    state.queryType === 'clarification-needed' ||
    state.queryType === 'multi-tool'
  ) {
    return {};
  }

  const span = startSpan(state.langfuseTrace ?? null, 'hyde', {
    query: state.request.query,
  });

  try {
    const { request, pipelineConfig, prompts, gatewayOptions, queryService } = state;
    const llmModel = pipelineConfig.llm_model;

    const hydeResult = await queryService.generateHyDE(
      request.query,
      llmModel,
      gatewayOptions,
      prompts['HYDE_PROMPT'],
    );

    const hydeDoc = hydeResult.doc;
    const tokenBreakdown = hydeResult.usage
      ? { hyde: { ...hydeResult.usage, model: llmModel, estimated: false } }
      : {};

    const traceUpdate = hydeDoc
      ? { hyde: { document: hydeDoc.slice(0, 300) } }
      : {};

    endSpan(span, { output: { hydeDoc: hydeDoc?.slice(0, 300) } });

    return {
      hydeDoc,
      ...(Object.keys(tokenBreakdown).length > 0 ? { tokenBreakdown: tokenBreakdown as GraphState['tokenBreakdown'] } : {}),
      ...(Object.keys(traceUpdate).length > 0 ? { trace: traceUpdate } : {}),
    };
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } });
    throw err;
  }
}
