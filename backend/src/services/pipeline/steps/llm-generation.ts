import { PipelineStep, PipelineContext, LLMResponse } from '../types';
import { checkOutput } from '../../../utils/guardrails';
import { buildPersonalizedSystemPrompt } from '../../personalization';
import { extractMemoriesFromQuery } from '../../memory-extractor';
import { parseSuggestedQuestions } from '../utils';

export const llmGenerationStep: PipelineStep = {
  id: 'llm-generation',
  name: 'LLM 回答生成',
  description: '使用 RAG context 生成回答，含 GK 通識路徑和串流模式',
  phase: 'generation',
  defaultEnabled: true,
  defaultOrder: 11,
  requires: [],
  provides: ['answer', 'rawAnswer', 'suggestedQuestions', 'parsedAnswer'],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const { env, request, pipelineConfig, prompts, gatewayOptions, tokenBreakdown, trace, queryService } = ctx;
    const { query } = request;

    const effectiveLlmModel = ctx.effectiveLlmModel ?? pipelineConfig.llm_model;

    // GK 通識路徑
    if (ctx.queryType === 'general-knowledge') {
      const gkPersonalized = buildPersonalizedSystemPrompt(ctx.memorySummary ?? null, ctx.ascentContext ?? null, ctx.abilityLevel ?? null, prompts['GENERAL_KNOWLEDGE_SYSTEM_PROMPT']);
      const llmResult = (await env.AI.run(
        effectiveLlmModel,
        { messages: [{ role: 'system', content: gkPersonalized }, { role: 'user', content: query }], max_tokens: pipelineConfig.max_tokens_gk },
        gatewayOptions
      )) as LLMResponse;
      const rawAnswer = llmResult.response || '抱歉，無法生成回答，請稍後再試。';
      const { answer: rawGkAnswer, suggested_questions } = parseSuggestedQuestions(rawAnswer);
      const { output: gkFiltered, trace: gkOutputTrace } = checkOutput(rawGkAnswer, pipelineConfig.max_output_length, pipelineConfig.system_prompt_leakage_patterns);
      const answer = gkFiltered || '抱歉，無法生成回答，請稍後再試。';
      trace.guardrails_output = gkOutputTrace;

      if (llmResult.usage) {
        tokenBreakdown.main_generation = { ...llmResult.usage, model: effectiveLlmModel, estimated: false };
      } else {
        const estP = Math.ceil((gkPersonalized.length + query.length) / 2);
        const estC = Math.ceil(answer.length / 2);
        tokenBreakdown.main_generation = { prompt_tokens: estP, completion_tokens: estC, total_tokens: estP + estC, model: effectiveLlmModel, estimated: true };
      }
      if (Object.keys(tokenBreakdown).length > 0) trace.token_breakdown = tokenBreakdown;

      const totalTokens = Object.values(tokenBreakdown).reduce((sum, v) => {
        if (v && typeof v === 'object' && 'total_tokens' in v) return sum + ((v as { total_tokens: number }).total_tokens ?? 0);
        return sum;
      }, 0);

      if (ctx.userId && ctx.waitUntilCtx) {
        trace.memory_extraction = { triggered: true, async: true };
      } else {
        trace.memory_extraction = { triggered: false, async: false, reason: ctx.userId ? 'no_ctx' : 'anonymous' };
      }

      const queryId = await queryService.logQuery({
        userId: ctx.userId ?? null, query, response: answer, sources: [],
        latencyMs: Date.now() - ctx.startTime, tokenCount: totalTokens > 0 ? totalTokens : (llmResult.usage?.total_tokens ?? Math.ceil((gkPersonalized.length + query.length + answer.length) / 2)),
        queryType: 'general-knowledge', modelUsed: effectiveLlmModel, retrievalScore: 0, selfReflectionTriggered: 0,
        isHighConsumption: (totalTokens || 0) > pipelineConfig.high_consumption_threshold, hydeTriggered: false,
        pipelineTrace: Object.keys(trace).length > 0 ? JSON.stringify(trace) : undefined,
      });

      const response = { answer, sources: [] as import('../../../types').AISource[], query_id: queryId, suggested_questions };
      await env.CACHE.put(ctx.cacheKey, JSON.stringify(response), { expirationTtl: ctx.cacheTtl });

      if (ctx.userId && ctx.waitUntilCtx) {
        const gkGatewayOpts = env.AI_GATEWAY_SLUG ? { gateway: { id: env.AI_GATEWAY_SLUG } } : undefined;
        ctx.waitUntilCtx.waitUntil(extractMemoriesFromQuery(query, ctx.userId, env.DB, env.AI, gkGatewayOpts));
      }

      ctx.earlyReturn = response;
      return ctx;
    }

    // RAG 路徑（含 hybrid 分支）
    const context = ctx.queryType === 'hybrid' && ctx.sqlContext ? ctx.sqlContext : ctx.context ?? '目前沒有找到相關資料。';
    const prompt = prompts['QUERY_TEMPLATE']
      .replace('{context}', context)
      .replace('{query}', query);

    const recentHistory = ctx.recentHistory;
    const historyLLMMessages = recentHistory.slice(-pipelineConfig.chat_history_depth).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.role === 'assistant' ? m.content.slice(0, pipelineConfig.assistant_history_truncate) : m.content,
    }));

    const personalizedSystemPrompt = buildPersonalizedSystemPrompt(ctx.memorySummary ?? null, ctx.ascentContext ?? null, ctx.abilityLevel ?? null, prompts['SYSTEM_PROMPT']);
    const llmMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system' as const, content: personalizedSystemPrompt },
      ...historyLLMMessages,
      { role: 'user' as const, content: prompt },
    ];
    ctx.llmMessages = llmMessages;

    let rawLLMAnswer: string;
    let llmUsage: LLMResponse['usage'] | undefined;

    if (ctx.streamingMode && ctx.onToken) {
      rawLLMAnswer = await queryService.streamLLMGeneration(effectiveLlmModel, llmMessages, pipelineConfig.max_tokens_generation, gatewayOptions, ctx.onToken);
      if (!rawLLMAnswer) rawLLMAnswer = '抱歉，無法生成回答，請稍後再試。';
    } else {
      const llmResult = (await (env.AI.run as Function)(
        effectiveLlmModel,
        { messages: llmMessages, max_tokens: pipelineConfig.max_tokens_generation },
        gatewayOptions
      )) as LLMResponse;
      rawLLMAnswer = llmResult.response || '抱歉，無法生成回答，請稍後再試。';
      llmUsage = llmResult.usage;
    }

    if (llmUsage) {
      tokenBreakdown.main_generation = { ...llmUsage, model: effectiveLlmModel, estimated: false };
    } else {
      const msgLen = llmMessages.reduce((sum, m) => sum + m.content.length, 0);
      const estP = Math.ceil(msgLen / 2);
      const estC = Math.ceil(rawLLMAnswer.length / 2);
      tokenBreakdown.main_generation = { prompt_tokens: estP, completion_tokens: estC, total_tokens: estP + estC, model: effectiveLlmModel, estimated: true };
    }

    ctx.rawAnswer = rawLLMAnswer;
    let { answer: parsedAnswer, suggested_questions } = parseSuggestedQuestions(rawLLMAnswer);

    if (trace.generation && suggested_questions.length > 0) {
      (trace.generation as Record<string, unknown>).suggested_questions = suggested_questions;
    }
    if (!parsedAnswer) {
      parsedAnswer = '抱歉，目前無法生成回答，請換個方式提問或稍後再試。';
    }

    ctx.parsedAnswer = parsedAnswer;
    ctx.suggestedQuestions = suggested_questions;

    const cannotAnswer =
      parsedAnswer.includes('超出我的知識範圍') ||
      parsedAnswer.includes('找不到相關資訊') ||
      parsedAnswer.includes('找不到符合條件') ||
      parsedAnswer.includes('找不到相關路線') ||
      parsedAnswer.includes('無法提供任何推薦或建議');

    ctx.cannotAnswer = cannotAnswer;
    const finalSources = cannotAnswer ? [] : (ctx.sources ?? []);
    ctx.sources = finalSources;

    // 注入路線連結
    const answer = !cannotAnswer && finalSources.length > 0
      ? queryService.injectRouteLinks(parsedAnswer, finalSources)
      : parsedAnswer;

    ctx.answer = answer;

    return ctx;
  },
};
