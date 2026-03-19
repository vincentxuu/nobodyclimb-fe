import { GraphState } from '../state';
import { startSpan, endSpan } from '../langfuse';

export async function embeddingNode(state: GraphState): Promise<Partial<GraphState>> {
  const span = startSpan(state.langfuseTrace ?? null, 'embedding', {
    query: state.request.query,
  });
  try {
    // bm25 模式：跳過 embedding，節省延遲
    if (state.retrievalMethod === 'bm25') {
      endSpan(span, { output: { skipped: true, reason: 'bm25_only' } });
      return {
        queryVector: undefined,
        hydeVector: null,
        expandedVectors: [],
        trace: { embedding: { skipped: true, reason: 'bm25_only' } },
      };
    }

    const { request, earlyQueryVector, hydeDoc, expandedQueries, embeddingProvider } = state;
    const { query } = request;

    if (!embeddingProvider) {
      throw new Error('embeddingProvider is not set in GraphState');
    }

    const embedStart = Date.now();

    let queryVector: number[];
    let hydeVector: number[] | null;

    if (earlyQueryVector) {
      queryVector = earlyQueryVector;
      if (hydeDoc) {
        hydeVector = await embeddingProvider.embed(hydeDoc);
      } else {
        hydeVector = null;
      }
    } else {
      const embedTasks: Promise<number[]>[] = [embeddingProvider.embed(query)];
      if (hydeDoc) {
        embedTasks.push(embeddingProvider.embed(hydeDoc));
      }
      const embedResults = await Promise.all(embedTasks);
      queryVector = embedResults[0];
      hydeVector = hydeDoc ? embedResults[1] : null;
    }

    // 擴展查詢向量
    let expandedVectors: number[][] = [];
    if (expandedQueries && expandedQueries.length > 0) {
      expandedVectors = await embeddingProvider.embedBatch(expandedQueries);
      expandedVectors = expandedVectors.filter((v) => v.length > 0);
    }

    // Circuit Breaker：embedding 成功（Workers AI 正常回應）
    if (state.circuitBreaker) {
      state.circuitBreaker.recordSuccess().catch(() => {});
    }

    const embeddingMs = Date.now() - embedStart;

    endSpan(span, {
      output: {
        early_vector_reused: !!earlyQueryVector,
        hyde_embedded: !!hydeVector,
        expanded_count: expandedVectors.length,
        duration_ms: embeddingMs,
      },
    });

    return {
      queryVector,
      hydeVector,
      expandedVectors,
      trace: {
        embedding: {
          early_vector_reused: !!earlyQueryVector,
          hyde_embedded: !!hydeVector,
          expanded_count: expandedVectors.length,
          duration_ms: embeddingMs,
        },
      },
    };
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } });
    throw err;
  }
}
