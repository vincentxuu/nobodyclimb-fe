'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  type AILogDetail,
  type CostProvider,
  DEFAULT_COST_PROVIDERS,
  useAIConfig,
} from '@/lib/api/admin-ai'
import { calcCost } from './cost-analysis'
import { STAGE_LABELS, StageIcon, StatusBadge } from './shared'
import { StageTraceDetail } from './traces'
import { ensureArray, type PipelineKey } from './types'

export function PipelineTimeline({
  pipeline,
  pipelineTrace,
  query,
  response,
  sources,
}: {
  pipeline: AILogDetail['pipeline']
  pipelineTrace: AILogDetail['pipeline_trace']
  query: string
  response: string | null
  sources: Array<{ title?: string; type?: string; score?: number }>
}) {
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set())
  const [allExpanded, setAllExpanded] = useState(false)
  const degradedStages = ensureArray<string>(pipelineTrace?.degraded_stages)
  const pipelineExecution = ensureArray<{ step: string; timeout?: boolean }>(
    pipelineTrace?.pipeline_execution
  )
  const agenticDecisionUsages = ensureArray<{
    prompt_tokens: number
    completion_tokens: number
    estimated: boolean
  }>(pipelineTrace?.token_breakdown?.agentic_decisions)
  const multiQueryItems = ensureArray<string>(pipelineTrace?.multi_query?.queries)
  const cragFallbackRetries = ensureArray<{ removed_filter: string; candidates_after: number }>(
    pipelineTrace?.retrieval?.crag_fallback_detail?.retries
  )
  const { data: aiConfig } = useAIConfig()
  const primaryProvider = useMemo<CostProvider | null>(() => {
    try {
      const raw = aiConfig?.['cost_providers']
      if (raw) {
        const parsed = JSON.parse(raw) as CostProvider[]
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0]
      }
    } catch {
      /* fallback */
    }
    return DEFAULT_COST_PROVIDERS[0] ?? null
  }, [aiConfig])

  const toggleStage = (key: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    setAllExpanded(false)
  }

  const pipelineStages: PipelineKey[] = [
    'guardrails_input',
    'cache',
    'quota_check',
    'query_parsing',
    'text_to_sql',
    'hyde',
    'filter',
    'embedding',
    'retrieval',
    'generation',
    'self_reflection',
    'judge',
    'guardrails_output',
    'memory_extraction',
  ]

  type StageEntry = { key: string; isTraceOnly: boolean }
  const stages: StageEntry[] = []
  for (const key of pipelineStages) {
    stages.push({ key, isTraceOnly: false })
    if (key === 'hyde') {
      if (pipelineTrace?.plan_execute) {
        stages.push({ key: 'plan_execute', isTraceOnly: true })
      }
      if (pipelineTrace?.agentic) {
        stages.push({ key: 'agentic', isTraceOnly: true })
      }
      if (pipelineTrace?.multi_query) {
        stages.push({ key: 'multi_query', isTraceOnly: true })
      }
    }
    if (key === 'retrieval') {
      if (pipelineTrace?.multi_tool) {
        stages.push({ key: 'multi_tool', isTraceOnly: true })
      }
      if (!pipeline.retrieval.skipped && pipelineTrace?.retrieval) {
        stages.push({ key: 'rrf_fusion', isTraceOnly: true })
        stages.push({ key: 'crag_fallback', isTraceOnly: true })
        stages.push({ key: 'reranking', isTraceOnly: true })
      }
      if (pipelineTrace?.mmr_selection) {
        stages.push({ key: 'mmr_selection', isTraceOnly: true })
      }
      if (pipelineTrace?.popularity_rerank) {
        stages.push({ key: 'popularity_rerank', isTraceOnly: true })
      }
    }
  }

  const expandableKeys = useMemo(() => {
    return stages
      .filter(({ key, isTraceOnly }) => {
        if (isTraceOnly) return true
        const ps = pipeline[key as PipelineKey] as unknown as Record<string, unknown>
        return !ps?.skipped
      })
      .map(({ key }) => key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stages, pipeline])

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedStages(new Set())
    } else {
      setExpandedStages(new Set(expandableKeys))
    }
    setAllExpanded(!allExpanded)
  }

  return (
    <div className="rounded-xl border border-wb-20 bg-white p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-wb-100">RAG Pipeline 流程</h2>
          {pipelineTrace?.degraded && (
            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600">
              已降級
            </span>
          )}
        </div>
        <button
          onClick={toggleAll}
          className="rounded border border-wb-15 bg-wb-5 px-2 py-0.5 text-[11px] text-wb-60 hover:bg-wb-10 transition-colors"
        >
          {allExpanded ? '全部收合' : '全部展開'}
        </button>
      </div>
      <p className="mb-4 text-[11px] text-wb-40">點擊各階段展開 Input → Decision → Output 詳情</p>

      {pipelineTrace?.degraded && degradedStages.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3">
          <p className="text-xs font-medium text-amber-700">降級階段</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {degradedStages.map((stage) => (
              <span
                key={stage}
                className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700"
              >
                {STAGE_LABELS[stage] ?? stage}
              </span>
            ))}
          </div>
        </div>
      )}

      {pipelineTrace?.circuit_breaker && (
        <div className="mb-4 rounded-lg border border-wb-20 bg-wb-05 px-4 py-3 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-medium text-wb-70">Circuit Breaker:</span>
          <span
            className={`rounded border px-1.5 py-0.5 font-medium ${
              pipelineTrace.circuit_breaker.state === 'closed'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : pipelineTrace.circuit_breaker.state === 'half-open'
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {pipelineTrace.circuit_breaker.state === 'closed'
              ? 'Closed'
              : pipelineTrace.circuit_breaker.state === 'half-open'
                ? 'Half-Open'
                : 'Open'}
          </span>
          <span className="text-wb-50">
            Failures:{' '}
            <span className="font-mono text-wb-80">{pipelineTrace.circuit_breaker.failures}</span>
          </span>
          <span className="text-wb-50">
            Action:{' '}
            <span className="font-mono text-wb-80">{pipelineTrace.circuit_breaker.action}</span>
          </span>
        </div>
      )}

      <div className="space-y-0">
        {stages.map(({ key, isTraceOnly }, idx) => {
          const pipelineStage = isTraceOnly
            ? null
            : (pipeline[key as PipelineKey] as unknown as Record<string, unknown>)
          const skipped = isTraceOnly ? false : Boolean(pipelineStage?.skipped)
          const isLast = idx === stages.length - 1
          const isExpanded = expandedStages.has(key)
          const canExpand = !skipped

          const execStep = pipelineExecution.find((s) => s.step === key)
          const isTimeout = Boolean(execStep?.timeout)

          let status:
            | 'ran'
            | 'skipped'
            | 'hit'
            | 'triggered'
            | 'not-triggered'
            | 'timeout'
            | 'degraded' = 'ran'
          if (isTimeout) status = 'timeout'
          else if (skipped) status = 'skipped'
          else if (key === 'cache' && pipelineStage && 'hit' in pipelineStage)
            status = pipelineStage.hit ? 'hit' : 'ran'
          else if (
            (key === 'hyde' || key === 'self_reflection') &&
            pipelineStage &&
            'triggered' in pipelineStage
          )
            status = pipelineStage.triggered ? 'triggered' : 'not-triggered'
          else if (isTraceOnly && key === 'crag_fallback')
            status = pipelineTrace?.retrieval?.crag_fallback ? 'triggered' : 'not-triggered'
          else if (isTraceOnly && key === 'reranking')
            status = pipelineTrace?.retrieval?.reranker_used === false ? 'skipped' : 'ran'
          else if (isTraceOnly) status = 'ran'

          const metrics: {
            label: string
            value: string
            highlight?: boolean
            estimated?: boolean
          }[] = []
          if (isTimeout) metrics.push({ label: '降級', value: '超時降級', highlight: true })
          const tb = pipelineTrace?.token_breakdown

          if (!skipped && pipelineStage) {
            if (key === 'query_parsing' && pipelineStage.query_type) {
              const qmap: Record<string, string> = {
                simple: '簡單',
                complex: '複雜',
                'general-knowledge': '通識',
                sql: 'SQL',
                'multi-tool': '多工具',
              }
              metrics.push({
                label: '類型',
                value: qmap[pipelineStage.query_type as string] ?? String(pipelineStage.query_type),
              })
              const tsConf = pipelineTrace?.tool_selection?.confidence
              if (tsConf != null && tsConf < 1)
                metrics.push({ label: '信心', value: `${(tsConf * 100).toFixed(0)}%` })
              const rm = pipelineTrace?.query_parsing?.retrieval_method
              if (rm && rm !== 'hybrid')
                metrics.push({ label: '檢索', value: rm === 'bm25' ? 'BM25' : 'Vector' })
            }
            if (
              (key === 'embedding' || key === 'retrieval' || key === 'generation') &&
              pipelineStage.duration_ms != null
            ) {
              metrics.push({ label: '耗時', value: `${pipelineStage.duration_ms} ms` })
            }
            if (key === 'retrieval') {
              if (pipelineStage.top_score != null)
                metrics.push({
                  label: '最高分',
                  value: `${((pipelineStage.top_score as number) * 100).toFixed(1)}%`,
                })
              if (pipelineStage.doc_count != null)
                metrics.push({ label: '文件', value: `${pipelineStage.doc_count} 筆` })
            }
            if (key === 'text_to_sql') {
              if (pipelineStage.candidate_count != null)
                metrics.push({ label: '候選', value: `${pipelineStage.candidate_count} 筆` })
              if (pipelineStage.path)
                metrics.push({ label: '路徑', value: String(pipelineStage.path) })
            }
            if (key === 'generation') {
              if (pipelineStage.model)
                metrics.push({
                  label: '模型',
                  value: String(pipelineStage.model).split('/').pop() ?? '',
                })
              const mg = tb?.main_generation
              if (mg) {
                metrics.push({
                  label: 'in',
                  value: mg.prompt_tokens.toLocaleString(),
                  estimated: mg.estimated,
                })
                metrics.push({
                  label: 'out',
                  value: mg.completion_tokens.toLocaleString(),
                  estimated: mg.estimated,
                })
                if (primaryProvider) {
                  const usd = calcCost(mg.prompt_tokens, mg.completion_tokens, primaryProvider)
                  metrics.push({ label: '$', value: usd.toFixed(6), estimated: mg.estimated })
                  metrics.push({
                    label: 'NT$',
                    value: (usd * 32).toFixed(4),
                    estimated: mg.estimated,
                  })
                }
              } else if (pipelineStage.token_count != null) {
                metrics.push({ label: 'Tokens', value: String(pipelineStage.token_count) })
              }
              if (pipelineStage.is_high_consumption)
                metrics.push({ label: '高消耗', value: '!', highlight: true })
            }
            if (key === 'judge') {
              if (pipelineStage.groundedness_score != null)
                metrics.push({
                  label: 'Groundedness',
                  value: `${((pipelineStage.groundedness_score as number) * 100).toFixed(0)}%`,
                })
              if (pipelineStage.auto_score != null)
                metrics.push({ label: 'Auto', value: `${pipelineStage.auto_score} / 4` })
            }
          }

          if (tb) {
            const singleStageTokenMap: Partial<
              Record<
                string,
                | {
                    prompt_tokens: number
                    completion_tokens: number
                    total_tokens: number
                    estimated: boolean
                  }
                | undefined
              >
            > = {
              query_parsing: tb.tool_selection,
              hyde: tb.hyde,
              self_reflection: tb.self_reflection_regen,
              judge: tb.judge,
            }
            const stageUsage = singleStageTokenMap[key]
            if (stageUsage) {
              metrics.push({
                label: 'in',
                value: stageUsage.prompt_tokens.toLocaleString(),
                estimated: stageUsage.estimated,
              })
              metrics.push({
                label: 'out',
                value: stageUsage.completion_tokens.toLocaleString(),
                estimated: stageUsage.estimated,
              })
              if (primaryProvider) {
                const usd = calcCost(
                  stageUsage.prompt_tokens,
                  stageUsage.completion_tokens,
                  primaryProvider
                )
                metrics.push({ label: '$', value: usd.toFixed(6), estimated: stageUsage.estimated })
                metrics.push({
                  label: 'NT$',
                  value: (usd * 32).toFixed(4),
                  estimated: stageUsage.estimated,
                })
              }
            }
          }

          if (isTraceOnly && key === 'agentic' && pipelineTrace?.agentic) {
            const a = pipelineTrace.agentic as {
              steps: unknown[]
              final_doc_count: number
              total_paths: number
            }
            metrics.push({ label: '步驟', value: `${a.steps.length + 1}` })
            metrics.push({ label: '最終文件', value: `${a.final_doc_count} 筆` })
            if (agenticDecisionUsages.length > 0) {
              const totalIn = agenticDecisionUsages.reduce((s, d) => s + d.prompt_tokens, 0)
              const totalOut = agenticDecisionUsages.reduce((s, d) => s + d.completion_tokens, 0)
              const anyEst = agenticDecisionUsages.some((d) => d.estimated)
              metrics.push({ label: 'in', value: totalIn.toLocaleString(), estimated: anyEst })
              metrics.push({ label: 'out', value: totalOut.toLocaleString(), estimated: anyEst })
              if (primaryProvider) {
                const usd = calcCost(totalIn, totalOut, primaryProvider)
                metrics.push({ label: '$', value: usd.toFixed(6), estimated: anyEst })
                metrics.push({ label: 'NT$', value: (usd * 32).toFixed(4), estimated: anyEst })
              }
            }
          }
          if (isTraceOnly && key === 'multi_query' && pipelineTrace?.multi_query) {
            metrics.push({
              label: '子查詢',
              value: `${multiQueryItems.length} 條`,
            })
            if (tb?.multi_query) {
              const mq = tb.multi_query
              metrics.push({
                label: 'in',
                value: mq.prompt_tokens.toLocaleString(),
                estimated: mq.estimated,
              })
              metrics.push({
                label: 'out',
                value: mq.completion_tokens.toLocaleString(),
                estimated: mq.estimated,
              })
              if (primaryProvider) {
                const usd = calcCost(mq.prompt_tokens, mq.completion_tokens, primaryProvider)
                metrics.push({ label: '$', value: usd.toFixed(6), estimated: mq.estimated })
                metrics.push({
                  label: 'NT$',
                  value: (usd * 32).toFixed(4),
                  estimated: mq.estimated,
                })
              }
            }
          }
          if (isTraceOnly && key === 'rrf_fusion' && pipelineTrace?.retrieval?.rrf) {
            const rrf = pipelineTrace.retrieval.rrf
            metrics.push({ label: '路徑', value: `${rrf.paths_count} 條` })
            metrics.push({ label: '通過門檻', value: `${rrf.after_threshold_count} 筆` })
          }
          if (
            isTraceOnly &&
            key === 'crag_fallback' &&
            pipelineTrace?.retrieval?.crag_fallback_detail
          ) {
            metrics.push({
              label: '重試',
              value: `${cragFallbackRetries.length} 次`,
            })
          }
          if (isTraceOnly && key === 'reranking' && pipelineTrace?.retrieval?.reranker) {
            const re = pipelineTrace.retrieval.reranker
            if (re.input_count != null)
              metrics.push({ label: '輸入', value: `${re.input_count} 筆` })
            if (re.top_scores?.length)
              metrics.push({ label: '最高', value: re.top_scores[0].score.toFixed(3) })
          }
          if (isTraceOnly && key === 'mmr_selection' && pipelineTrace?.mmr_selection) {
            const mmr = pipelineTrace.mmr_selection
            metrics.push({ label: '輸入', value: `${mmr.input_count} 筆` })
            metrics.push({ label: '選出', value: `${mmr.selected_count} 筆` })
          }
          if (isTraceOnly && key === 'popularity_rerank' && pipelineTrace?.popularity_rerank) {
            const pr = pipelineTrace.popularity_rerank
            metrics.push({ label: '文件', value: `${pr.doc_count} 筆` })
          }
          if (isTraceOnly && key === 'plan_execute' && pipelineTrace?.plan_execute) {
            const pe = pipelineTrace.plan_execute
            if (pe.plan_fallback) {
              metrics.push({ label: '狀態', value: 'Fallback', highlight: true })
              metrics.push({ label: '目標', value: pe.plan_fallback.target })
            } else {
              metrics.push({ label: '步驟', value: `${pe.steps?.length ?? 0} 步` })
              if (pe.sources_count != null)
                metrics.push({ label: '來源', value: `${pe.sources_count} 筆` })
            }
            metrics.push({ label: '耗時', value: `${pe.total_duration_ms} ms` })
            if (tb?.planning) {
              metrics.push({
                label: 'plan in',
                value: tb.planning.prompt_tokens.toLocaleString(),
                estimated: tb.planning.estimated,
              })
              metrics.push({
                label: 'plan out',
                value: tb.planning.completion_tokens.toLocaleString(),
                estimated: tb.planning.estimated,
              })
              if (primaryProvider) {
                const usd = calcCost(
                  tb.planning.prompt_tokens,
                  tb.planning.completion_tokens,
                  primaryProvider
                )
                metrics.push({
                  label: '$',
                  value: usd.toFixed(6),
                  estimated: tb.planning.estimated,
                })
              }
            }
            if (tb?.synthesis) {
              metrics.push({
                label: 'synth in',
                value: tb.synthesis.prompt_tokens.toLocaleString(),
                estimated: tb.synthesis.estimated,
              })
              metrics.push({
                label: 'synth out',
                value: tb.synthesis.completion_tokens.toLocaleString(),
                estimated: tb.synthesis.estimated,
              })
            }
          }
          if (isTraceOnly && key === 'multi_tool' && pipelineTrace?.multi_tool) {
            const mt = pipelineTrace.multi_tool
            if (mt.fallback) {
              metrics.push({ label: '狀態', value: '降級', highlight: true })
            } else {
              metrics.push({ label: '步驟', value: `${mt.steps?.length ?? 0} 步` })
              if (mt.sources_count != null)
                metrics.push({ label: '來源', value: `${mt.sources_count} 筆` })
            }
            if (mt.total_duration_ms != null)
              metrics.push({ label: '耗時', value: `${mt.total_duration_ms} ms` })
          }

          return (
            <div key={`${key}-${idx}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 mt-2 ${
                    skipped
                      ? 'border-wb-15 bg-wb-5'
                      : key === 'cache' && pipelineStage?.hit
                        ? 'border-sky-300 bg-sky-50'
                        : 'border-wb-30 bg-white'
                  }`}
                >
                  <StageIcon name={key} skipped={skipped} />
                </div>
                {!isLast && (
                  <div
                    className={`w-px flex-1 my-1 ${skipped ? 'bg-wb-10' : 'bg-wb-20'}`}
                    style={{ minHeight: 16 }}
                  />
                )}
              </div>

              <div className="flex-1 pb-4 pt-1.5">
                <div
                  className={`flex flex-wrap items-center gap-2 ${canExpand ? 'cursor-pointer' : ''}`}
                  onClick={() => canExpand && toggleStage(key)}
                >
                  <span className={`text-sm font-medium ${skipped ? 'text-wb-40' : 'text-wb-90'}`}>
                    {STAGE_LABELS[key] ?? key}
                  </span>
                  <StatusBadge status={status} />
                  {metrics.map((m) => (
                    <span
                      key={m.label}
                      className={`rounded border px-1.5 py-0.5 text-[11px] tabular-nums ${
                        m.highlight
                          ? 'border-red-200 bg-red-50 text-red-600'
                          : m.estimated
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-wb-15 bg-wb-5 text-wb-60'
                      }`}
                    >
                      {m.label}: {m.estimated ? '~' : ''}
                      {m.value}
                    </span>
                  ))}
                  {canExpand && (
                    <span className="ml-auto text-wb-40">
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </span>
                  )}
                </div>
                {!isTraceOnly && !!pipelineStage?.service && (
                  <p
                    className={`mt-0.5 text-[11px] font-mono ${skipped ? 'text-wb-30' : 'text-wb-50'}`}
                  >
                    {pipelineStage.service as string}
                  </p>
                )}
                {canExpand && isExpanded && (
                  <div className="mt-2 rounded-lg border border-wb-10 bg-wb-3 px-3 py-3">
                    <StageTraceDetail
                      stageKey={key}
                      trace={pipelineTrace}
                      query={query}
                      pipelineStage={pipelineStage as Record<string, unknown> | null}
                      response={response}
                      sources={sources}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
