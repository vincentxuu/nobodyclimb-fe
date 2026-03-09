'use client'

import { useState, useMemo } from 'react'
import { useAIConfig, DEFAULT_COST_PROVIDERS, type AILogDetail, type CostProvider } from '@/lib/api/admin-ai'
import type { StageBreakdownItem, TokenBreakdown } from './types'

export function calcCost(inputTokens: number, outputTokens: number, provider: CostProvider): number {
  return (inputTokens * provider.input_per_1m + outputTokens * provider.output_per_1m) / 1_000_000
}

export function formatCost(cost: number): string {
  return `$${cost.toFixed(6)}`
}

export function CostAnalysisCard({ pipelineTrace }: { pipelineTrace: AILogDetail['pipeline_trace'] }) {
  const { data: aiConfig } = useAIConfig()
  const [hiddenProviders, setHiddenProviders] = useState<Set<string>>(new Set())

  const providers = useMemo<CostProvider[]>(() => {
    try {
      const raw = aiConfig?.['cost_providers']
      if (raw) {
        const parsed = JSON.parse(raw) as CostProvider[]
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch { /* fallback */ }
    return DEFAULT_COST_PROVIDERS
  }, [aiConfig])

  const tb = pipelineTrace?.token_breakdown
  if (!tb) return null

  const visibleProviders = providers.filter((p) => !hiddenProviders.has(p.id))

  const singleStages: Array<{ key: string; label: string; data: StageBreakdownItem }> = []
  const stageKeys: Array<[keyof TokenBreakdown, string]> = [
    ['tool_selection', 'Tool Selection（路由決策）'],
    ['text_to_sql', 'Text-to-SQL（SQL 組裝）'],
    ['hyde', 'HyDE（假設文件）'],
    ['multi_query', 'Multi-Query（查詢擴展）'],
    ['main_generation', 'Main Generation（主生成）'],
    ['self_reflection_regen', 'Self-Reflection Regen（重生成）'],
    ['judge', 'Judge（品質評估）'],
    ['judge_2nd', 'Judge 2nd（重生成評估）'],
  ]
  for (const [key, label] of stageKeys) {
    const data = tb[key] as StageBreakdownItem | undefined
    if (data) singleStages.push({ key, label, data })
  }

  const agenticDecisions = tb.agentic_decisions
  type AgenticDecisionItem = StageBreakdownItem & { step: number }

  const stageCosts = singleStages.map((s) =>
    visibleProviders.reduce((sum, p) => sum + calcCost(s.data.prompt_tokens, s.data.completion_tokens, p), 0)
  )
  const maxStageCost = Math.max(...stageCosts, 0)

  const totalInput = singleStages.reduce((s, r) => s + r.data.prompt_tokens, 0) +
    (agenticDecisions?.reduce((s, d) => s + d.prompt_tokens, 0) ?? 0)
  const totalOutput = singleStages.reduce((s, r) => s + r.data.completion_tokens, 0) +
    (agenticDecisions?.reduce((s, d) => s + d.completion_tokens, 0) ?? 0)

  const toggleProvider = (id: string) => {
    setHiddenProviders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="rounded-xl border border-wb-20 bg-white overflow-hidden">
      <div className="border-b border-wb-10 px-5 py-4">
        <h2 className="text-sm font-semibold text-wb-100">費用分析</h2>
        <p className="mt-0.5 text-xs text-wb-50">各 stage token 消耗與不同供應商費用估算（USD / NT$，匯率 32）</p>
      </div>

      <div className="flex flex-wrap gap-1.5 px-5 py-3 border-b border-wb-10 bg-wb-05">
        {providers.map((p) => (
          <button
            key={p.id}
            onClick={() => toggleProvider(p.id)}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
              hiddenProviders.has(p.id)
                ? 'border-wb-20 text-wb-40 bg-white'
                : 'border-blue-300 text-blue-700 bg-blue-50'
            }`}
          >
            {p.name}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-wb-40 self-center">點擊切換顯示</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-wb-10 bg-wb-05">
              <th className="px-4 py-2 text-left font-semibold text-wb-60 w-48">Stage</th>
              <th className="px-3 py-2 text-right font-semibold text-wb-60">Input</th>
              <th className="px-3 py-2 text-right font-semibold text-wb-60">Output</th>
              {visibleProviders.map((p) => (
                <th key={p.id} className="px-3 py-2 text-right font-semibold text-wb-60 whitespace-nowrap">{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-wb-10">
            {singleStages.map((s, i) => {
              const isMaxCost = stageCosts[i] === maxStageCost && maxStageCost > 0
              return (
                <tr key={s.key} className={isMaxCost ? 'bg-orange-50/60' : 'hover:bg-wb-05'}>
                  <td className="px-4 py-2 text-wb-70 font-medium">
                    {s.data.estimated && <span className="text-wb-40 mr-1">~</span>}
                    {s.label}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-wb-70">{s.data.prompt_tokens.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-mono text-wb-70">{s.data.completion_tokens.toLocaleString()}</td>
                  {visibleProviders.map((p) => {
                    const usd = calcCost(s.data.prompt_tokens, s.data.completion_tokens, p)
                    return (
                      <td key={p.id} className="px-3 py-2 text-right font-mono">
                        <div className="text-wb-80">{formatCost(usd)}</div>
                        <div className="text-[10px] text-wb-50">NT${(usd * 32).toFixed(4)}</div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}

            {agenticDecisions && agenticDecisions.length > 0 && agenticDecisions.map((d: AgenticDecisionItem) => (
              <tr key={`agentic-${d.step}`} className="hover:bg-wb-05">
                <td className="px-4 py-2 text-wb-50">
                  {d.estimated && <span className="text-wb-40 mr-1">~</span>}
                  Agentic Decision（step {d.step}）
                </td>
                <td className="px-3 py-2 text-right font-mono text-wb-60">{d.prompt_tokens.toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-mono text-wb-60">{d.completion_tokens.toLocaleString()}</td>
                {visibleProviders.map((p) => {
                  const usd = calcCost(d.prompt_tokens, d.completion_tokens, p)
                  return (
                    <td key={p.id} className="px-3 py-2 text-right font-mono">
                      <div className="text-wb-70">{formatCost(usd)}</div>
                      <div className="text-[10px] text-wb-50">NT${(usd * 32).toFixed(4)}</div>
                    </td>
                  )
                })}
              </tr>
            ))}

            <tr className="bg-wb-05 font-semibold border-t-2 border-wb-20">
              <td className="px-4 py-2.5 text-wb-80">合計</td>
              <td className="px-3 py-2.5 text-right font-mono text-wb-80">{totalInput.toLocaleString()}</td>
              <td className="px-3 py-2.5 text-right font-mono text-wb-80">{totalOutput.toLocaleString()}</td>
              {visibleProviders.map((p) => {
                const usd = calcCost(totalInput, totalOutput, p)
                return (
                  <td key={p.id} className="px-3 py-2.5 text-right font-mono">
                    <div className="text-wb-100">{formatCost(usd)}</div>
                    <div className="text-[10px] text-wb-60">NT${(usd * 32).toFixed(4)}</div>
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="px-5 py-2.5 bg-wb-05 border-t border-wb-10">
        <p className="text-[10px] text-wb-40">
          ~ 表示串流模式估算值（字元數 / 2）。供應商定價可在設定 → 費用模擬 Tab 調整。
        </p>
      </div>
    </div>
  )
}
