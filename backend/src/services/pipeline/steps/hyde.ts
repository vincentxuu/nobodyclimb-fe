import { PipelineStep, PipelineContext } from '../types';

export const hydeStep: PipelineStep = {
  id: 'hyde',
  name: 'HyDE 假設文件生成',
  description: '生成假設性理想答案文件以提升語義搜尋效果',
  phase: 'pre-retrieval',
  defaultEnabled: true,
  defaultOrder: 3,
  requires: ['queryType'],
  provides: ['hydeDoc'],
  skipWhen: [{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed', 'multi-tool'] }],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    // 業務邏輯跳過：simple query 或 agentic 模式或已有 hydeDoc（similar route 已生成）
    if (ctx.queryType === 'simple' || ctx.pipelineConfig.rag_strategy === 'agentic' || (ctx.hydeDoc && ctx.hydeDoc !== '')) {
      return ctx;
    }

    const { request, pipelineConfig, prompts, gatewayOptions, tokenBreakdown, trace } = ctx;
    const llmModel = pipelineConfig.llm_model;

    const hydeResult = await ctx.queryService.generateHyDE(request.query, llmModel, gatewayOptions, prompts['HYDE_PROMPT']);

    ctx.hydeDoc = hydeResult.doc;
    if (hydeResult.usage) {
      tokenBreakdown.hyde = { ...hydeResult.usage, model: llmModel };
    }
    if (ctx.hydeDoc) trace.hyde = { document: ctx.hydeDoc.slice(0, 300) };

    return ctx;
  },
};
