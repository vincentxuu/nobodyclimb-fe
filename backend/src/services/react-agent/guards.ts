import type { Env } from '../../types'
import { checkInput, checkOutput } from '../../utils/guardrails'
import type { LangfuseParent } from '../../utils/langfuse'
import { endSpan, startSpan } from '../../utils/langfuse'
import { runJudge } from '../query/llm'
import type { ModelMap } from './types'

// ---------------------------------------------------------------------------
// Input Guardrail（pre-loop，規則式，不用 LLM）
// ---------------------------------------------------------------------------

export async function runInputGuard(query: string, db: D1Database) {
  return checkInput(query, db)
}

// ---------------------------------------------------------------------------
// Output Guards（post-loop，同步規則式檢查）
// ---------------------------------------------------------------------------

export interface OutputGuardResult {
  passed: boolean
  qualityFlag?: 'too_short' | 'prompt_leak'
  cleanedAnswer?: string
}

export function runOutputGuards(answer: string): OutputGuardResult {
  // 1. 回答太短
  if (answer.length < 50) {
    return { passed: false, qualityFlag: 'too_short' }
  }

  // 2. System prompt 洩漏偵測（複用 checkOutput）
  const outputCheck = checkOutput(answer)
  if (outputCheck.trace.system_prompt_leaked) {
    return {
      passed: true,
      qualityFlag: 'prompt_leak',
      cleanedAnswer: outputCheck.output,
    }
  }

  return { passed: true }
}

// ---------------------------------------------------------------------------
// Async LLM Judge（post-response，非同步，不擋回應）
// ---------------------------------------------------------------------------

export async function runAsyncJudge(
  env: Env,
  query: string,
  context: string,
  answer: string,
  models: ModelMap,
  langfuseParent?: LangfuseParent | null
): Promise<{
  groundedness: number | null
  quality: number | null
}> {
  const judgeSpan = startSpan(langfuseParent ?? null, 'judge')
  try {
    const result = await runJudge(
      env,
      query,
      context,
      answer,
      {
        model: models.judge.model,
        timeoutMs: 10000,
      },
      judgeSpan
    )
    endSpan(judgeSpan, {
      output: { groundedness: result.groundedness, quality: result.quality },
      metadata: { provider: models.judge.provider, model: models.judge.model },
    })
    return {
      groundedness: result.groundedness,
      quality: result.quality,
    }
  } catch (err) {
    endSpan(judgeSpan, { output: { error: String(err) }, level: 'WARNING' })
    return { groundedness: null, quality: null }
  }
}
