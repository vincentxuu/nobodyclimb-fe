import { GraphState } from '../state';
import { startSpan, endSpan } from '../langfuse';
import { parseSuggestedQuestions } from '../../pipeline/utils';
import { checkOutput } from '../../../utils/guardrails';

export async function selfReflectionNode(state: GraphState): Promise<Partial<GraphState>> {
  const { pipelineConfig, prompts, tokenBreakdown, queryService } = state;
  const effectiveLlmModel = state.effectiveLlmModel ?? pipelineConfig.llm_model;

  const span = startSpan(state.langfuseTrace ?? null, 'self-reflection', {
    quality: state.quality,
    groundedness: state.groundedness,
  });

  try {
    // 串流模式不執行 self-reflection
    if (state.streamingMode) {
      endSpan(span, { output: { skipped: true, reason: 'streaming_mode' } });
      return {};
    }

    const quality = state.quality;
    const groundedness = state.groundedness;
    const parsedAnswer = state.parsedAnswer ?? '';
    const context = state.context ?? '';
    const llmMessages = state.llmMessages;

    if (!llmMessages) {
      endSpan(span, { output: { skipped: true, reason: 'no_llm_messages' } });
      return {};
    }

    // loopBack 觸發：低 groundedness 且首次迭代
    if (groundedness != null && groundedness < 0.5 && state.loopCount === 0) {
      endSpan(span, { output: { loopBack: true, reason: 'low-groundedness' } });
      return {
        loopBack: { targetPhase: 'retrieval', reason: 'low-groundedness' },
      };
    }

    // Judge 驅動重生成
    const regenQualityTriggered = quality != null && quality <= pipelineConfig.judge_regen_quality_max;
    const shouldRegen = regenQualityTriggered && state.queryType === 'complex' && !state.cannotAnswer && parsedAnswer.length >= pipelineConfig.self_reflection_min_length;

    if (!shouldRegen) {
      endSpan(span, { output: { skipped: true, reason: 'regen_not_triggered' } });
      return {};
    }

    const regenGroundednessTriggered = groundedness != null && groundedness < (pipelineConfig.groundedness_disclaimer_low ?? 0.6);
    const regenReason = regenGroundednessTriggered ? 'both' : 'quality_below_threshold';

    try {
      const retryResult = await state.llmProvider!.chat(llmMessages, {
        model: effectiveLlmModel,
        maxTokens: pipelineConfig.max_tokens_generation,
        gatewayOptions: state.gatewayOptions,
      });

      const newTokenBreakdown = { ...tokenBreakdown };
      if (retryResult.usage) {
        newTokenBreakdown.self_reflection_regen = { ...retryResult.usage, model: effectiveLlmModel, estimated: false };
      } else {
        const msgLen = llmMessages.reduce((sum, m) => sum + m.content.length, 0);
        const estP = Math.ceil(msgLen / 2);
        const estC = Math.ceil(retryResult.content.length / 2);
        newTokenBreakdown.self_reflection_regen = { prompt_tokens: estP, completion_tokens: estC, total_tokens: estP + estC, model: effectiveLlmModel, estimated: true };
      }

      const retryParsed = parseSuggestedQuestions(retryResult.content || state.rawAnswer || '');
      const finalSources = state.sources ?? [];
      const regenAnswer = !state.cannotAnswer && finalSources.length > 0
        ? queryService.injectRouteLinks(retryParsed.answer, finalSources)
        : retryParsed.answer;

      // 第二次 Judge
      const regenJudge = await queryService.runJudge(
        state.request.query,
        context,
        retryParsed.answer,
        {
          model: pipelineConfig.lightweight_model,
          timeoutMs: pipelineConfig.judge_timeout_ms,
          contextTruncate: pipelineConfig.judge_context_truncate,
          promptTemplate: prompts['JUDGE_PROMPT'],
        }
      );
      if (regenJudge.usage) {
        newTokenBreakdown.judge_2nd = { ...regenJudge.usage, model: pipelineConfig.lightweight_model };
      }

      const regenAccepted = (regenJudge.groundedness ?? 0) > (groundedness ?? 0);

      const selfReflectionTrace = {
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
        let finalAnswer = regenAnswer;
        if (regenJudge.groundedness !== null && !state.cannotAnswer) {
          if (regenJudge.groundedness < pipelineConfig.groundedness_disclaimer_low) {
            finalAnswer = `❓ 以下資訊基於現有資料推斷，建議實地確認\n\n${finalAnswer}`;
          } else if (regenJudge.groundedness < pipelineConfig.groundedness_disclaimer_mid) {
            finalAnswer = `⚠️ 部分資訊來自推斷，建議實地確認\n\n${finalAnswer}`;
          }
        }

        // 重新執行輸出防護
        const { output: filteredAnswer, trace: outputTrace } = checkOutput(
          finalAnswer,
          pipelineConfig.max_output_length,
          pipelineConfig.system_prompt_leakage_patterns
        );

        endSpan(span, {
          output: {
            selfReflectionTriggered: true,
            regenAccepted: true,
            regenGroundedness: regenJudge.groundedness,
            regenQuality: regenJudge.quality,
          },
        });

        return {
          selfReflectionTriggered: 1,
          parsedAnswer: retryParsed.answer,
          suggestedQuestions: retryParsed.suggested_questions,
          answer: filteredAnswer,
          groundedness: regenJudge.groundedness,
          quality: regenJudge.quality,
          tokenBreakdown: newTokenBreakdown,
          trace: {
            self_reflection: selfReflectionTrace,
            guardrails_output: outputTrace,
            generation: { regen_triggered: true },
          },
        };
      }

      endSpan(span, {
        output: {
          selfReflectionTriggered: true,
          regenAccepted: false,
        },
      });

      return {
        selfReflectionTriggered: 1,
        tokenBreakdown: newTokenBreakdown,
        trace: {
          self_reflection: selfReflectionTrace,
          generation: { regen_triggered: true },
        },
      };
    } catch {
      // 重生成失敗時靜默保留原始回答
      endSpan(span, { output: { skipped: true, reason: 'regen_failed_silently' } });
      return {};
    }
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } });
    throw err;
  }
}
