import { PipelineContext } from "../pipeline/types";
import { GraphState } from "./state";
import {
  createLangfuseClient,
  createTrace,
  flushLangfuse,
} from "../../utils/langfuse";
import { baselineGraph } from "./graphs/baseline";
import { agenticGraph } from "./graphs/agentic";
import { planExecuteGraph } from "./graphs/plan-execute";
import { createProviders, type ProviderName } from "./providers";
import type { AIAskResponse } from "../../types";

// 各 graph 的 invoke 介面相同（均接受 GraphState），使用 union 以避免型別不相容
type AnyGraph = {
  invoke(
    state: GraphState,
    config?: { recursionLimit?: number },
  ): Promise<GraphState>;
};

/**
 * Token breakdown 彙總：加總所有階段的 total_tokens
 */
function sumTokenBreakdown(tb: Record<string, unknown>): number {
  let total = 0;
  for (const v of Object.values(tb)) {
    if (Array.isArray(v)) {
      for (const item of v)
        total += (item as { total_tokens?: number }).total_tokens ?? 0;
    } else if (v && typeof v === "object") {
      total += (v as { total_tokens?: number }).total_tokens ?? 0;
    }
  }
  return total;
}

/**
 * Post-graph 後處理：等同舊引擎的 postPipelineProcessing。
 * 僅在非 earlyReturn 路徑執行（GK / text-to-sql 已在各自 node 處理完畢）。
 */
async function postGraphProcessing(
  state: GraphState,
): Promise<AIAskResponse> {
  const { queryService, pipelineConfig } = state;

  // ---- Token breakdown 彙總 ----
  if (Object.keys(state.tokenBreakdown).length > 0) {
    state.trace.token_breakdown = state.tokenBreakdown;
  }
  const totalStageTokens = sumTokenBreakdown(
    state.tokenBreakdown as Record<string, unknown>,
  );
  const estimatedTokens = Math.ceil(
    ((state.prompts["SYSTEM_PROMPT"]?.length ?? 0) +
      state.request.query.length +
      (state.answer?.length ?? 0)) /
      2,
  );
  const mainGenUsage = state.tokenBreakdown.main_generation;
  const tokenCount =
    totalStageTokens > 0
      ? totalStageTokens
      : (mainGenUsage?.total_tokens ?? estimatedTokens);

  // ---- logQuery ----
  const queryId = await queryService.logQuery({
    userId: state.userId ?? null,
    query: state.request.query,
    response: state.answer ?? "",
    sources:
      state.request.include_sources !== false ? (state.sources ?? []) : [],
    latencyMs: Date.now() - state.startTime,
    tokenCount,
    groundednessScore: state.groundedness ?? null,
    autoScore: state.quality ?? null,
    embeddingMs: null,
    retrievalMs: null,
    generationMs: null,
    queryType: state.queryType,
    modelUsed: state.effectiveLlmModel,
    retrievalScore: state.retrievalScore ?? 0,
    selfReflectionTriggered: state.selfReflectionTriggered ?? 0,
    isHighConsumption: tokenCount > pipelineConfig.high_consumption_threshold,
    hydeTriggered: (state.hydeDoc ?? "") !== "",
    pipelineTrace:
      Object.keys(state.trace).length > 0
        ? JSON.stringify(state.trace)
        : undefined,
  });

  // ---- KV 快取寫入（錯誤回答不快取）----
  const finalAnswer = state.answer ?? "";
  const isErrorAnswer =
    finalAnswer === "抱歉，無法生成回答，請稍後再試。" ||
    finalAnswer === "抱歉，目前無法生成回答，請換個方式提問或稍後再試。" ||
    finalAnswer === "抱歉，AI 回答生成超時，請稍後再試。" ||
    finalAnswer === "抱歉，AI 服務暫時發生問題，請稍後再試。";

  const response: AIAskResponse = {
    answer: finalAnswer,
    sources:
      state.request.include_sources !== false ? (state.sources ?? []) : [],
    query_id: queryId,
    suggested_questions: state.suggestedQuestions ?? [],
    ...(state.degradedStages && state.degradedStages.length > 0
      ? {
          degraded: true,
          degraded_stages: state.degradedStages,
        }
      : {}),
  };

  if (!isErrorAnswer) {
    await state.env.CACHE.put(state.cacheKey, JSON.stringify(response), {
      expirationTtl: state.cacheTtl,
    });
  }

  // ---- 低 groundedness flagging（非串流）----
  if (
    !state.streamingMode &&
    state.groundedness !== null &&
    state.groundedness !== undefined &&
    state.groundedness < pipelineConfig.groundedness_flag_threshold
  ) {
    await queryService.flagResponse(queryId, "low_groundedness");
  }

  // ---- waitUntil 非同步後處理 ----
  if (state.waitUntilCtx) {
    // 語義快取寫入
    if (pipelineConfig.semantic_cache_enabled && state.earlyQueryVector) {
      state.waitUntilCtx.waitUntil(
        queryService.storeSemanticCache(
          `sc:${queryService.hashQuery(state.request.query)}`,
          state.earlyQueryVector,
          state.cacheKey,
        ),
      );
    }

    // 串流模式異步 Judge
    if (state.streamingMode) {
      state.waitUntilCtx.waitUntil(
        (async () => {
          const {
            groundedness: gs,
            quality: qlRaw,
            constraint_ok,
          } = await queryService.runJudge(
            state.request.query,
            state.context ?? "",
            state.parsedAnswer ?? "",
            {
              model: pipelineConfig.lightweight_model,
              timeoutMs: pipelineConfig.judge_timeout_ms,
              contextTruncate: pipelineConfig.judge_context_truncate,
              promptTemplate: state.prompts["JUDGE_PROMPT"],
            },
          );
          const ql = !constraint_ok && qlRaw !== null ? 1 : qlRaw;
          if (gs !== null || ql !== null) {
            await state.env.DB.prepare(
              `UPDATE ai_query_logs SET groundedness_score = ?, auto_score = ? WHERE id = ?`,
            )
              .bind(gs, ql, queryId)
              .run()
              .catch(() => {});
          }
          if (
            gs !== null &&
            gs < pipelineConfig.groundedness_flag_threshold
          ) {
            await queryService.flagResponse(queryId, "low_groundedness");
          }
        })(),
      );
    }

    // Memory extraction（memoryExtractorNode 已處理，此處不重複觸發）
    // memoryExtractorNode 是 graph 的最後一個 node，已在 graph 執行中處理
  }

  return response;
}

/**
 * 執行 LangGraph AI pipeline。
 * 接受與原本 pipeline engine 相同的 PipelineContext，回傳執行後的 state（含 finalResponse）。
 */
export async function runAIGraph(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  const langfuse = createLangfuseClient(ctx.env);
  const trace = createTrace(langfuse, {
    name: "ai-pipeline",
    userId: ctx.userId,
    // AIAskRequest 無 sessionId 欄位，略過
    input: { query: ctx.request.query },
    metadata: { strategy: ctx.pipelineConfig.rag_strategy },
  });

  // 初始化 AI providers（LLM + Embedding）
  const llmProviderName = (ctx.env.LLM_PROVIDER ??
    "cloudflare") as ProviderName;
  const embeddingProviderName = (ctx.env.EMBEDDING_PROVIDER ??
    llmProviderName) as ProviderName;
  const { llm, embedding } = createProviders(
    { llmProvider: llmProviderName, embeddingProvider: embeddingProviderName },
    ctx.env,
  );

  const initialState: GraphState = {
    ...ctx,
    // userId 在 PipelineContext 為 optional，GraphState 要求明確設定（含 undefined）
    userId: ctx.userId,
    langfuseTrace: trace,
    // LangGraph 新增欄位預設值（節點執行時可覆寫）
    agenticAction: undefined,
    llmProvider: llm,
    embeddingProvider: embedding,
    // state.ts 中 videoCountMap/latestVideoMap 為 Record，但 PipelineContext 為 Map
    // 轉換以符合 GraphState 型別
    videoCountMap: ctx.videoCountMap
      ? Object.fromEntries(ctx.videoCountMap)
      : undefined,
    latestVideoMap: ctx.latestVideoMap
      ? Object.fromEntries(ctx.latestVideoMap)
      : undefined,
    climbed_route_ids: ctx.climbed_route_ids ?? null,
  } as unknown as GraphState;

  // 根據策略選擇 graph
  const strategy = ctx.pipelineConfig.rag_strategy ?? "baseline";
  let graph: AnyGraph;
  if (strategy === "agentic") {
    graph = agenticGraph as unknown as AnyGraph;
  } else if (strategy === "plan-execute") {
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

  // Post-graph 後處理：僅在非 earlyReturn 路徑執行
  if (!finalState.earlyReturn) {
    const response = await postGraphProcessing(finalState);
    finalState.finalResponse = response as GraphState["finalResponse"];
  }

  // 回傳符合 PipelineContext 型別的結果
  return finalState as unknown as PipelineContext;
}
