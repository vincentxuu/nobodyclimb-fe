'use client'

import { StageDesc, StageSection, IOFlow, TraceBadge, KVRow } from '../shared'
import type { PipelineTrace } from '../types'

export function PlanAndExecuteTrace({ trace }: { trace: PipelineTrace }) {
  const pe = trace.plan_execute
  if (!pe) return <p className="text-[11px] text-wb-40">無詳細資料</p>

  const hasFallback = !!pe.plan_fallback

  if (hasFallback) {
    const fb = pe.plan_fallback!
    const reasonLabels: Record<string, string> = {
      timeout: 'Planning 超時',
      json_parse_error: 'JSON 解析失敗',
      empty_steps: '無有效子任務',
      too_few_steps: '子任務數不足',
      planning_failed: '規劃失敗',
      execution_error: '執行錯誤',
    }
    return (
      <div>
        <StageDesc>Plan-and-Execute：LLM 規劃子任務 → 獨立搜尋 → 合成統一 context。本次規劃失敗，已降級至 Agentic 模式。</StageDesc>
        <IOFlow>
          <StageSection type="input">
            <KVRow label="策略" value={<TraceBadge text={pe.strategy} color="violet" />} />
            <KVRow label="規劃耗時" value={`${pe.planning_duration_ms} ms`} />
          </StageSection>
          <StageSection type="decision">
            <div className="flex items-center gap-2 flex-wrap">
              <TraceBadge text="Fallback" color="amber" />
              <span className="text-wb-60">{reasonLabels[fb.reason] ?? fb.reason}</span>
              <span className="text-wb-40">→</span>
              <TraceBadge text={fb.target} color="blue" />
            </div>
            {fb.step_count != null && (
              <p className="text-[10px] text-wb-40 mt-1">
                子任務數 {fb.step_count}，最低要求 {fb.min_required}
              </p>
            )}
            {fb.error && <p className="text-[10px] text-wb-40 mt-1 font-mono">{fb.error}</p>}
          </StageSection>
          <StageSection type="output">
            <KVRow label="總耗時" value={`${pe.total_duration_ms} ms`} />
          </StageSection>
        </IOFlow>
      </div>
    )
  }

  // 正常執行
  return (
    <div>
      <StageDesc>Plan-and-Execute：LLM 將查詢拆解為多個子任務計畫 → 各子任務獨立搜尋（embedding + BM25 + RRF）→ LLM 合成為結構化 context。適合涉及多個岩場或路線的比較型查詢。</StageDesc>
      <IOFlow>
        <StageSection type="input">
          <div className="space-y-1">
            <KVRow label="策略" value={<TraceBadge text={pe.strategy} color="violet" />} />
            <KVRow label="規劃耗時" value={`${pe.planning_duration_ms} ms`} />
            {pe.plan && (
              <>
                <KVRow label="執行模式" value={pe.plan.execution_mode === 'parallel' ? '並行' : pe.plan.execution_mode === 'sequential' ? '循序' : pe.plan.execution_mode} />
                <KVRow label="計畫子任務" value={`${pe.plan.steps.length} 步`} />
              </>
            )}
          </div>
        </StageSection>
        <StageSection type="decision">
          {pe.steps && pe.steps.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-wb-40">子任務執行結果：</p>
              <ol className="space-y-1.5">
                {pe.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="shrink-0 text-wb-40 tabular-nums text-[10px] mt-0.5">#{s.stepId}</span>
                    <TraceBadge text={s.tool} color="blue" />
                    <span className="text-wb-60 italic text-[11px] line-clamp-1 flex-1">{s.query}</span>
                    <span className="shrink-0 text-[10px] text-wb-40 tabular-nums">{s.result_count} 筆 / {s.duration_ms} ms</span>
                    {s.error && <TraceBadge text="錯誤" color="red" />}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="text-wb-40">無步驟執行資料</p>
          )}
          {pe.adaptive_replan && pe.adaptive_replan_info && (
            <div className="mt-2 rounded border border-amber-200 bg-amber-50/50 px-2.5 py-2 space-y-1">
              <div className="flex items-center gap-2">
                <TraceBadge text="Adaptive Replan" color="amber" />
                <span className="text-[10px] text-wb-50">觸發步驟 #{pe.adaptive_replan_info.trigger_step_id}（{pe.adaptive_replan_info.reason}）</span>
              </div>
              {pe.adaptive_replan_info.new_steps.map((ns, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                  <span className="text-wb-40">替代：</span>
                  <TraceBadge text={ns.tool} color="blue" />
                  <span className="text-wb-60 italic">{ns.query}</span>
                </div>
              ))}
            </div>
          )}
        </StageSection>
        <StageSection type="output">
          <div className="space-y-2">
            <div className="flex gap-4">
              <div>
                <p className="text-wb-40">來源數</p>
                <p className="text-base font-bold text-wb-90 tabular-nums">{pe.sources_count ?? 0} 筆</p>
              </div>
              {pe.execution_duration_ms != null && (
                <div>
                  <p className="text-wb-40">執行耗時</p>
                  <p className="text-base font-bold text-wb-90 tabular-nums">{pe.execution_duration_ms} ms</p>
                </div>
              )}
              {pe.synthesis_duration_ms != null && (
                <div>
                  <p className="text-wb-40">合成耗時</p>
                  <p className="text-base font-bold text-wb-90 tabular-nums">{pe.synthesis_duration_ms} ms</p>
                </div>
              )}
              <div>
                <p className="text-wb-40">總耗時</p>
                <p className="text-base font-bold text-wb-90 tabular-nums">{pe.total_duration_ms} ms</p>
              </div>
            </div>
          </div>
        </StageSection>
      </IOFlow>
    </div>
  )
}
