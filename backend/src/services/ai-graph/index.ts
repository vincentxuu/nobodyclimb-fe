import { PipelineContext } from '../pipeline/types';
import { GraphState } from './state';
import { createLangfuseClient, createTrace, flushLangfuse } from '../../utils/langfuse';
import { baselineGraph } from './graphs/baseline';
import { agenticGraph } from './graphs/agentic';
import { planExecuteGraph } from './graphs/plan-execute';

// 各 graph 的 invoke 介面相同（均接受 GraphState），使用 union 以避免型別不相容
type AnyGraph = { invoke(state: GraphState, config?: { recursionLimit?: number }): Promise<GraphState> };

/**
 * 執行 LangGraph AI pipeline。
 * 接受與原本 pipeline engine 相同的 PipelineContext，回傳執行後的 state（含 finalResponse）。
 */
export async function runAIGraph(ctx: PipelineContext): Promise<PipelineContext> {
  const langfuse = createLangfuseClient(ctx.env);
  const trace = createTrace(langfuse, {
    name: 'ai-pipeline',
    userId: ctx.userId,
    // AIAskRequest 無 sessionId 欄位，略過
    input: { query: ctx.request.query },
    metadata: { strategy: ctx.pipelineConfig.rag_strategy },
  });

  const initialState: GraphState = {
    ...ctx,
    // userId 在 PipelineContext 為 optional，GraphState 要求明確設定（含 undefined）
    userId: ctx.userId,
    langfuseTrace: trace,
    // LangGraph 新增欄位預設值（節點執行時可覆寫）
    agenticAction: undefined,
    llmProvider: undefined,
    embeddingProvider: undefined,
    // state.ts 中 videoCountMap/latestVideoMap 為 Record，但 PipelineContext 為 Map
    // 轉換以符合 GraphState 型別
    videoCountMap: ctx.videoCountMap
      ? Object.fromEntries(ctx.videoCountMap)
      : undefined,
    latestVideoMap: ctx.latestVideoMap
      ? Object.fromEntries(ctx.latestVideoMap)
      : undefined,
  } as unknown as GraphState;

  // 根據策略選擇 graph
  const strategy = ctx.pipelineConfig.rag_strategy ?? 'baseline';
  let graph: AnyGraph;
  if (strategy === 'agentic') {
    graph = agenticGraph as unknown as AnyGraph;
  } else if (strategy === 'plan-execute') {
    graph = planExecuteGraph as unknown as AnyGraph;
  } else {
    graph = baselineGraph as unknown as AnyGraph;
  }

  const finalState = await graph.invoke(initialState, {
    recursionLimit: 20, // 防止無限迴圈
  });

  // 必須先 update trace，再 flush——否則 flush 時 trace 尚未更新，output 會遺失
  if (trace) {
    trace.update({ output: finalState.answer });
  }

  // Flush Langfuse non-blocking（在 trace.update 之後）
  if (ctx.waitUntilCtx && langfuse) {
    ctx.waitUntilCtx.waitUntil(flushLangfuse(langfuse));
  }

  // 回傳符合 PipelineContext 型別的結果
  return finalState as unknown as PipelineContext;
}
