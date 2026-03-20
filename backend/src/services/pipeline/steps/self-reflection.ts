import { PipelineStep, PipelineContext, LLMResponse } from '../types';
import { checkOutput } from '../../../utils/guardrails';
import { parseSuggestedQuestions } from '../utils';

export const selfReflectionStep: PipelineStep = {
  id: 'self-reflection',
  name: 'Self-Reflection 重生成',
  description: 'Judge 驅動的回答重生成，含 loopBack 機制',
  phase: 'evaluation',
  defaultEnabled: true,
  defaultOrder: 13,
  requires: ['quality', 'groundedness'],
  provides: [],
  skipWhen: [{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'clarification-needed'] }],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const { env, pipelineConfig, prompts, gatewayOptions, tokenBreakdown, trace, queryService } = ctx;
    const effectiveLlmModel = ctx.effectiveLlmModel ?? pipelineConfig.llm_model;

    // 串流模式不執行 self-reflection
    if (ctx.streamingMode) return ctx;

    const quality = ctx.quality;
    const groundedness = ctx.groundedness;
    const parsedAnswer = ctx.parsedAnswer ?? '';
    const context = ctx.context ?? '';
    const llmMessages = ctx.llmMessages;

    if (!llmMessages) return ctx;

    // loopBack 觸發：低 groundedness 且首次迭代
    if (groundedness != null && groundedness < 0.5 && ctx.loopCount === 0) {
      ctx.loopBack = { targetPhase: 'retrieval', reason: 'low-groundedness' };
      return ctx;
    }

    // Judge 驅動重生成
    const regenQualityTriggered = quality != null && quality <= pipelineConfig.judge_regen_quality_max;
    const shouldRegen = regenQualityTriggered && ctx.queryType === 'complex' && !ctx.cannotAnswer && parsedAnswer.length >= pipelineConfig.self_reflection_min_length;

    if (!shouldRegen) return ctx;

    const regenGroundednessTriggered = groundedness != null && groundedness < (pipelineConfig.groundedness_disclaimer_low ?? 0.6);
    const regenReason = regenGroundednessTriggered ? 'both' : 'quality_below_threshold';

    try {
      ctx.selfReflectionTriggered = 1;
      if (trace.generation) {
        (trace.generation as Record<string, unknown>).regen_triggered = true;
      }

      const retryResult = (await (env.AI.run as Function)(
        effectiveLlmModel,
        { messages: llmMessages, max_tokens: pipelineConfig.max_tokens_generation },
        gatewayOptions
      )) as LLMResponse;

      if (retryResult.usage) {
        tokenBreakdown.self_reflection_regen = { ...retryResult.usage, model: effectiveLlmModel, estimated: false };
      } else {
        const msgLen = llmMessages.reduce((sum, m) => sum + m.content.length, 0);
        const estP = Math.ceil(msgLen / 2);
        const estC = Math.ceil((retryResult.response ?? '').length / 2);
        tokenBreakdown.self_reflection_regen = { prompt_tokens: estP, completion_tokens: estC, total_tokens: estP + estC, model: effectiveLlmModel, estimated: true };
      }

      const retryParsed = parseSuggestedQuestions(retryResult.response ?? ctx.rawAnswer ?? '');
      const finalSources = ctx.sources ?? [];
      const regenAnswer = !ctx.cannotAnswer && finalSources.length > 0
        ? queryService.injectRouteLinks(retryParsed.answer, finalSources)
        : retryParsed.answer;

      // 第二次 Judge
      const regenJudge = await queryService.runJudge(
        ctx.request.query, context, retryParsed.answer,
        { model: pipelineConfig.lightweight_model, timeoutMs: pipelineConfig.judge_timeout_ms, contextTruncate: pipelineConfig.judge_context_truncate, promptTemplate: prompts['JUDGE_PROMPT'] }
      );
      if (regenJudge.usage) {
        tokenBreakdown.judge_2nd = { ...regenJudge.usage, model: pipelineConfig.lightweight_model };
      }

      const regenAccepted = (regenJudge.groundedness ?? 0) > (groundedness ?? 0);
      trace.self_reflection = {
        original_quality: quality,
        original_groundedness: groundedness,
        regen_quality: regenJudge.quality,
        regen_groundedness: regenJudge.groundedness,
        regen_accepted: regenAccepted,
        first_judge_quality: quality,
        first_judge_groundedness: groundedness,
        regen_reason: regenReason,
        second_judge_quality: regenJudge.quality,
        second_judge_groundedness: regenJudge.groundedness,
        acceptance_reason: regenAccepted ? 'regen_accepted' : 'original_kept',
      };

      if (regenAccepted) {
        ctx.parsedAnswer = retryParsed.answer;
        ctx.suggestedQuestions = retryParsed.suggested_questions;
        ctx.answer = regenAnswer;
        ctx.groundedness = regenJudge.groundedness;
        ctx.quality = regenJudge.quality;

        // 重新注入免責聲明
        if (ctx.groundedness !== null && !ctx.cannotAnswer) {
          if (ctx.groundedness < pipelineConfig.groundedness_disclaimer_low) {
            ctx.answer = `❓ 以下資訊基於現有資料推斷，建議實地確認\n\n${ctx.answer}`;
          } else if (ctx.groundedness < pipelineConfig.groundedness_disclaimer_mid) {
            ctx.answer = `⚠️ 部分資訊來自推斷，建議實地確認\n\n${ctx.answer}`;
          }
        }

        // 重新執行輸出防護
        const { output: filteredAnswer, trace: outputTrace } = checkOutput(
          ctx.answer ?? '', pipelineConfig.max_output_length, pipelineConfig.system_prompt_leakage_patterns
        );
        ctx.answer = filteredAnswer;
        trace.guardrails_output = outputTrace;
      }
    } catch {
      // 重生成失敗時靜默保留原始回答
    }

    return ctx;
  },
};
