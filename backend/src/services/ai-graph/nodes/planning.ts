import { PLANNING_PROMPT } from '../../../utils/ai-prompts'
import { endSpan, startSpan } from '../../../utils/langfuse'
import type { MultiToolStep } from '../../pipeline/types'
import type { ExecutionPlan, PlanStep } from '../../query/types'
import { GraphState } from '../state'

/**
 * PlanStep を MultiToolStep に互換させた拡張型
 * dispatchPlanSteps では as PlanStepExtended[] でキャストして id / filters を取り出す
 */
export type PlanStepExtended = MultiToolStep & {
  id: number
  filters: Record<string, unknown>
  depends_on: number[]
}

/** Plan-and-Execute：將複雜查詢分解為子任務計畫 */
export async function planningNode(state: GraphState): Promise<Partial<GraphState>> {
  const span = startSpan(state.langfuseTrace ?? null, 'planning', {
    query: state.request.query,
  })
  try {
    const {
      request,
      pipelineConfig: cfg,
      preloadedCrags,
      preloadedAreas,
      prompts,
      llmProvider,
    } = state
    const query = request.query

    if (!llmProvider) {
      endSpan(span, { level: 'ERROR', metadata: { error: 'llmProvider not injected' } })
      return {
        multiToolPlan: { steps: [], execution_mode: 'parallel' },
        trace: { plan_execute: { planning_failed: true, reason: 'no_llm_provider' } },
      }
    }

    const cragNames = (preloadedCrags ?? []).map((c) => c.name)
    const areaNames = (preloadedAreas ?? []).map((a) => a.name)

    const template = prompts['PLANNING_PROMPT'] ?? PLANNING_PROMPT
    const prompt = template
      .replace('{query}', query)
      .replace('{crags}', cragNames.join('、'))
      .replace('{areas}', areaNames.join('、'))
      .replace('{max_steps}', String(cfg.plan_execute_max_steps))

    let rawText = ''
    try {
      const planPromise = llmProvider.chat([{ role: 'user', content: prompt }], {
        model: cfg.llm_model,
        gatewayOptions: state.gatewayOptions,
      })

      const result = await Promise.race([
        planPromise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('planning_timeout')), cfg.planning_timeout_ms)
        ),
      ])
      rawText = result.content?.trim() ?? ''
    } catch {
      endSpan(span, { level: 'ERROR', metadata: { error: 'planning_timeout' } })
      return {
        multiToolPlan: { steps: [], execution_mode: 'parallel' },
        trace: { plan_execute: { planning_failed: true, reason: 'timeout' } },
      }
    }

    // 解析 JSON（移除 markdown code block）
    let execPlan: ExecutionPlan | null = null
    try {
      const jsonText = rawText
        .replace(/^```(?:json)?\n?/, '')
        .replace(/\n?```$/, '')
        .trim()
      const parsed = JSON.parse(jsonText) as ExecutionPlan

      if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
        endSpan(span, { output: { stepCount: 0, reason: 'empty_steps' } })
        return {
          multiToolPlan: { steps: [], execution_mode: 'parallel' },
          trace: { plan_execute: { planning_failed: true, reason: 'empty_steps' } },
        }
      }

      const validTools = ['search_routes', 'search_crags', 'sql_query'] as const
      const MAX_QUERY_LENGTH = 500
      const validSteps: PlanStep[] = parsed.steps
        .filter((s) => {
          if (!s.id || typeof s.id !== 'number') return false
          if (!s.query || typeof s.query !== 'string') return false
          if (!validTools.includes(s.tool as (typeof validTools)[number])) return false
          if (!Array.isArray(s.depends_on)) return false
          if (s.depends_on.includes(s.id)) return false
          return true
        })
        .slice(0, cfg.plan_execute_max_steps)
        .map((s) => ({
          ...s,
          tool: s.tool as PlanStep['tool'],
          query: s.query.slice(0, MAX_QUERY_LENGTH),
          depends_on: (s.depends_on as number[]).filter(
            (id) => typeof id === 'number' && id !== s.id
          ),
          filters: Object.fromEntries(
            Object.entries(s.filters ?? {}).filter(
              ([, v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
            )
          ),
        }))

      if (validSteps.length === 0) {
        endSpan(span, { output: { stepCount: 0, reason: 'empty_steps_after_validation' } })
        return {
          multiToolPlan: { steps: [], execution_mode: 'parallel' },
          trace: { plan_execute: { planning_failed: true, reason: 'empty_steps' } },
        }
      }

      const executionMode = (['parallel', 'sequential', 'mixed'] as string[]).includes(
        parsed.execution_mode
      )
        ? (parsed.execution_mode as 'parallel' | 'sequential')
        : 'parallel'

      execPlan = { steps: validSteps, execution_mode: executionMode }
    } catch {
      endSpan(span, { level: 'ERROR', metadata: { error: 'json_parse_error' } })
      return {
        multiToolPlan: { steps: [], execution_mode: 'parallel' },
        trace: { plan_execute: { planning_failed: true, reason: 'json_parse_error' } },
      }
    }

    // 將 PlanStep 對應為 PlanStepExtended（兼容 MultiToolStep 同時保留 id/filters）
    const extendedSteps: PlanStepExtended[] = execPlan.steps.map((s) => ({
      // MultiToolStep 必填欄位
      tool: s.tool,
      purpose: s.query,
      query: s.query,
      params: s.filters,
      // 額外欄位供 dispatchPlanSteps 使用
      id: s.id,
      filters: s.filters ?? {},
      depends_on: s.depends_on,
    }))

    endSpan(span, { output: { stepCount: execPlan.steps.length } })
    return {
      multiToolPlan: {
        steps: extendedSteps,
        execution_mode: execPlan.execution_mode === 'sequential' ? 'sequential' : 'parallel',
      },
      trace: {
        plan_execute: {
          plan: execPlan,
          step_count: execPlan.steps.length,
        },
      },
    }
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } })
    throw err
  }
}
