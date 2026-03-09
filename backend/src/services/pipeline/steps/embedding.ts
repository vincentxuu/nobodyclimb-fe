import { PipelineStep, PipelineContext } from '../types';
import { EmbeddingService } from '../../embedding';

export const embeddingStep: PipelineStep = {
  id: 'embedding',
  name: 'Query + HyDE Embedding',
  description: '並行計算 query、HyDE 及擴展查詢的向量嵌入',
  phase: 'retrieval',
  defaultEnabled: true,
  defaultOrder: 6,
  requires: [],
  provides: ['queryVector', 'hydeVector', 'expandedVectors'],
  skipWhen: [{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed', 'multi-tool'] }],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    // bm25 模式：跳過 embedding，節省延遲
    if (ctx.retrievalMethod === 'bm25') {
      ctx.queryVector = undefined;
      ctx.hydeVector = null;
      ctx.expandedVectors = [];
      ctx.trace.embedding = { skipped: true, reason: 'bm25_only' };
      return ctx;
    }

    const embeddingService = new EmbeddingService(ctx.env);
    const { request, earlyQueryVector, hydeDoc, expandedQueries, trace } = ctx;
    const { query } = request;

    const embedStart = Date.now();

    if (earlyQueryVector) {
      ctx.queryVector = earlyQueryVector;
      if (hydeDoc) {
        ctx.hydeVector = await embeddingService.embed(hydeDoc);
      } else {
        ctx.hydeVector = null;
      }
    } else {
      const embedTasks: Promise<number[]>[] = [embeddingService.embed(query)];
      if (hydeDoc) {
        embedTasks.push(embeddingService.embed(hydeDoc));
      }
      const embedResults = await Promise.all(embedTasks);
      ctx.queryVector = embedResults[0];
      ctx.hydeVector = hydeDoc ? embedResults[1] : null;
    }

    // 擴展查詢向量
    let expandedVectors: number[][] = [];
    if (expandedQueries && expandedQueries.length > 0) {
      expandedVectors = await embeddingService.embedBatch(expandedQueries);
      expandedVectors = expandedVectors.filter((v) => v.length > 0);
    }
    ctx.expandedVectors = expandedVectors;

    // Circuit Breaker：embedding 成功（Workers AI 正常回應）
    if (ctx.circuitBreaker) {
      ctx.circuitBreaker.recordSuccess().catch(() => {});
    }

    const embeddingMs = Date.now() - embedStart;
    trace.embedding = {
      early_vector_reused: !!earlyQueryVector,
      hyde_embedded: !!ctx.hydeVector,
      expanded_count: expandedVectors.length,
      duration_ms: embeddingMs,
    };

    return ctx;
  },
};
