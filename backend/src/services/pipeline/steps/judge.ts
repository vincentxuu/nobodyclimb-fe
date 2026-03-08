import { PipelineStep, PipelineContext } from '../types';
import { checkOutput } from '../../../utils/guardrails';

export const judgeStep: PipelineStep = {
  id: 'judge',
  name: 'Judge 品質評估',
  description: '評估回答的 groundedness 和 quality，注入免責聲明',
  phase: 'evaluation',
  defaultEnabled: true,
  defaultOrder: 12,
  requires: ['answer', 'context'],
  provides: ['groundedness', 'quality'],
  skipWhen: [{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'clarification-needed'] }],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const { pipelineConfig, prompts, trace, queryService } = ctx;

    // 串流模式：token 已推送，Judge 由 engine post-pipeline 異步處理
    if (ctx.streamingMode) {
      return ctx;
    }

    const context = ctx.context ?? '';
    const parsedAnswer = ctx.parsedAnswer ?? '';

    const judgeResult = await queryService.runJudge(
      ctx.request.query, context, parsedAnswer,
      {
        model: pipelineConfig.lightweight_model,
        timeoutMs: pipelineConfig.judge_timeout_ms,
        contextTruncate: pipelineConfig.judge_context_truncate,
        promptTemplate: prompts['JUDGE_PROMPT'],
      }
    );

    ctx.groundedness = judgeResult.groundedness;
    ctx.quality = judgeResult.quality;

    if (judgeResult.usage) {
      ctx.tokenBreakdown.judge = { ...judgeResult.usage, model: pipelineConfig.lightweight_model };
    }

    trace.judge_detail = {
      criteria: ['groundedness', 'quality'],
      raw_scores: { groundedness: ctx.groundedness, quality: ctx.quality },
      raw_llm_response: judgeResult.rawResponse,
      context_chars: judgeResult.contextChars,
      context_truncated: judgeResult.contextTruncated,
      response_chars: parsedAnswer.length,
    };

    // 免責聲明注入（groundedness 分數）
    if (ctx.groundedness !== null && !ctx.cannotAnswer) {
      if (ctx.groundedness < pipelineConfig.groundedness_disclaimer_low) {
        ctx.answer = `❓ 以下資訊基於現有資料推斷，建議實地確認\n\n${ctx.answer}`;
      } else if (ctx.groundedness < pipelineConfig.groundedness_disclaimer_mid) {
        ctx.answer = `⚠️ 部分資訊來自推斷，建議實地確認\n\n${ctx.answer}`;
      }
    }

    // 輸出層防護
    const { output: filteredAnswer, trace: outputTrace } = checkOutput(
      ctx.answer ?? '', pipelineConfig.max_output_length, pipelineConfig.system_prompt_leakage_patterns
    );
    ctx.answer = filteredAnswer;
    trace.guardrails_output = outputTrace;

    return ctx;
  },
};
