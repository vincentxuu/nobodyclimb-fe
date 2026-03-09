import { PipelineStep, PipelineContext } from '../types';

export const multiQueryStep: PipelineStep = {
  id: 'multi-query',
  name: 'Multi-Query Expansion',
  description: '將查詢改寫為多個不同角度的子查詢',
  phase: 'pre-retrieval',
  defaultEnabled: true,
  defaultOrder: 4,
  requires: ['queryType'],
  provides: ['expandedQueries'],
  skipWhen: [{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed', 'multi-tool'] }],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    // 業務邏輯跳過：non-complex 或 agentic 模式
    if (ctx.queryType !== 'complex' || ctx.pipelineConfig.rag_strategy === 'agentic') {
      return ctx;
    }

    const { request, pipelineConfig, prompts, gatewayOptions, tokenBreakdown, trace } = ctx;
    const llmModel = pipelineConfig.llm_model;

    const multiQueryResult = await ctx.queryService.generateMultipleQueries(request.query, pipelineConfig.multi_query_count, llmModel, gatewayOptions, prompts['MULTI_QUERY_EXPANSION_PROMPT']);

    ctx.expandedQueries = multiQueryResult.queries;
    if (multiQueryResult.usage) {
      tokenBreakdown.multi_query = { ...multiQueryResult.usage, model: llmModel };
    }
    if (ctx.expandedQueries.length > 0) trace.multi_query = { queries: ctx.expandedQueries };

    return ctx;
  },
};
