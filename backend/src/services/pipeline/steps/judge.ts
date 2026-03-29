import { checkOutput } from '../../../utils/guardrails'
import { PipelineContext, PipelineStep } from '../types'

export const judgeStep: PipelineStep = {
  id: 'judge',
  name: 'Judge 品質評估',
  description: '評估回答的 groundedness 和 quality，注入免責聲明',
  phase: 'evaluation',
  defaultEnabled: true,
  defaultOrder: 12,
  requires: ['answer'],
  provides: ['groundedness', 'quality'],
  skipWhen: [
    {
      field: 'queryType',
      operator: 'in',
      value: ['general-knowledge', 'sql', 'clarification-needed'],
    },
  ],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const { pipelineConfig, prompts, trace, queryService } = ctx

    // 串流模式：token 已推送，Judge 由 engine post-pipeline 異步處理
    if (ctx.streamingMode) {
      return ctx
    }

    // 生成失敗或超時回覆不進行品質評估，避免誤判 groundedness = 1.0
    const ERROR_ANSWERS = new Set([
      '抱歉，AI 回答生成超時，請稍後再試。',
      '抱歉，AI 服務暫時發生問題，請稍後再試。',
      '抱歉，無法生成回答，請稍後再試。',
      '抱歉，目前無法生成回答，請換個方式提問或稍後再試。',
    ])
    if (ctx.degradedStages?.includes('llm-generation') || ERROR_ANSWERS.has(ctx.answer ?? '')) {
      trace.judge_detail = { skipped: true, reason: 'generation_failed_or_timeout' }
      return ctx
    }

    const context = ctx.context ?? ''
    const parsedAnswer = ctx.parsedAnswer ?? ''

    const judgeResult = await queryService.runJudge(ctx.request.query, context, parsedAnswer, {
      model: pipelineConfig.lightweight_model,
      timeoutMs: pipelineConfig.judge_timeout_ms,
      contextTruncate: pipelineConfig.judge_context_truncate,
      promptTemplate: prompts['JUDGE_PROMPT'],
    })

    // constraint_ok = false 時強制 quality = 1
    const constraintOk = judgeResult.constraint_ok
    ctx.groundedness = judgeResult.groundedness
    ctx.quality = !constraintOk && judgeResult.quality !== null ? 1 : judgeResult.quality

    if (judgeResult.usage) {
      ctx.tokenBreakdown.judge = { ...judgeResult.usage, model: pipelineConfig.lightweight_model }
    }

    trace.judge_detail = {
      criteria: ['groundedness', 'quality', 'constraint_ok'],
      raw_scores: {
        groundedness: ctx.groundedness,
        quality: ctx.quality,
        constraint_ok: constraintOk,
      },
      constraint_ok: constraintOk,
      raw_llm_response: judgeResult.rawResponse,
      context_chars: judgeResult.contextChars,
      context_truncated: judgeResult.contextTruncated,
      response_chars: parsedAnswer.length,
    }

    // 免責聲明注入（groundedness 分數）
    if (ctx.groundedness !== null && !ctx.cannotAnswer) {
      if (ctx.groundedness < pipelineConfig.groundedness_disclaimer_low) {
        ctx.answer = `❓ 以下資訊基於現有資料推斷，建議實地確認\n\n${ctx.answer}`
      } else if (ctx.groundedness < pipelineConfig.groundedness_disclaimer_mid) {
        ctx.answer = `⚠️ 部分資訊來自推斷，建議實地確認\n\n${ctx.answer}`
      }
    }

    // 輸出層防護
    const { output: filteredAnswer, trace: outputTrace } = checkOutput(
      ctx.answer ?? '',
      pipelineConfig.max_output_length,
      pipelineConfig.system_prompt_leakage_patterns
    )
    ctx.answer = filteredAnswer
    trace.guardrails_output = outputTrace

    return ctx
  },
}
