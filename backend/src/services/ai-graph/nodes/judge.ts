import { GraphState } from '../state';
import { startSpan, endSpan } from '../langfuse';
import { checkOutput } from '../../../utils/guardrails';

export async function judgeNode(state: GraphState): Promise<Partial<GraphState>> {
  const { pipelineConfig, prompts, trace, queryService } = state;

  const span = startSpan(state.langfuseTrace ?? null, 'judge', {
    queryType: state.queryType,
    streamingMode: state.streamingMode,
  });

  try {
    // 串流模式：token 已推送，Judge 由 engine post-pipeline 異步處理
    if (state.streamingMode) {
      endSpan(span, { output: { skipped: true, reason: 'streaming_mode' } });
      return {};
    }

    // 生成失敗或超時回覆不進行品質評估，避免誤判 groundedness = 1.0
    const ERROR_ANSWERS = new Set([
      '抱歉，AI 回答生成超時，請稍後再試。',
      '抱歉，AI 服務暫時發生問題，請稍後再試。',
      '抱歉，無法生成回答，請稍後再試。',
      '抱歉，目前無法生成回答，請換個方式提問或稍後再試。',
    ]);
    if (state.degradedStages?.includes('llm-generation') || ERROR_ANSWERS.has(state.answer ?? '')) {
      endSpan(span, { output: { skipped: true, reason: 'generation_failed_or_timeout' } });
      return {
        trace: { judge_detail: { skipped: true, reason: 'generation_failed_or_timeout' } },
      };
    }

    const context = state.context ?? '';
    const parsedAnswer = state.parsedAnswer ?? '';

    const judgeResult = await queryService.runJudge(
      state.request.query,
      context,
      parsedAnswer,
      {
        model: pipelineConfig.lightweight_model,
        timeoutMs: pipelineConfig.judge_timeout_ms,
        contextTruncate: pipelineConfig.judge_context_truncate,
        promptTemplate: prompts['JUDGE_PROMPT'],
      }
    );

    // constraint_ok = false 時強制 quality = 1
    const constraintOk = judgeResult.constraint_ok;
    const groundedness = judgeResult.groundedness;
    const quality = (!constraintOk && judgeResult.quality !== null) ? 1 : judgeResult.quality;

    const newTokenBreakdown = { ...state.tokenBreakdown };
    if (judgeResult.usage) {
      newTokenBreakdown.judge = { ...judgeResult.usage, model: pipelineConfig.lightweight_model };
    }

    const judgeDetail = {
      criteria: ['groundedness', 'quality', 'constraint_ok'],
      raw_scores: { groundedness, quality, constraint_ok: constraintOk },
      constraint_ok: constraintOk,
      raw_llm_response: judgeResult.rawResponse,
      context_chars: judgeResult.contextChars,
      context_truncated: judgeResult.contextTruncated,
      response_chars: parsedAnswer.length,
    };

    // 免責聲明注入（groundedness 分數）
    let answer = state.answer ?? '';
    if (groundedness !== null && !state.cannotAnswer) {
      if (groundedness < pipelineConfig.groundedness_disclaimer_low) {
        answer = `❓ 以下資訊基於現有資料推斷，建議實地確認\n\n${answer}`;
      } else if (groundedness < pipelineConfig.groundedness_disclaimer_mid) {
        answer = `⚠️ 部分資訊來自推斷，建議實地確認\n\n${answer}`;
      }
    }

    // 輸出層防護
    const { output: filteredAnswer, trace: outputTrace } = checkOutput(
      answer,
      pipelineConfig.max_output_length,
      pipelineConfig.system_prompt_leakage_patterns
    );

    endSpan(span, {
      output: {
        groundedness,
        quality,
        constraint_ok: constraintOk,
      },
    });

    return {
      groundedness,
      quality,
      answer: filteredAnswer,
      tokenBreakdown: newTokenBreakdown,
      trace: { judge_detail: judgeDetail, guardrails_output: outputTrace },
    };
  } catch (err) {
    // Judge タイムアウト時：降級處理，記錄 degradedStages
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } });
    return {
      degradedStages: ['judge'],
      trace: { judge_detail: { skipped: true, reason: 'timeout_or_error', error: String(err) } },
    };
  }
}
