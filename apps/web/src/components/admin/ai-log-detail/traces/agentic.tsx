'use client'

import { StageDesc, StageSection, IOFlow, TraceBadge, KVRow } from '../shared'
import type { PipelineTrace } from '../types'

export function AgenticTrace({ trace }: { trace: PipelineTrace }) {
  const a = trace.agentic
  if (!a) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>

  const stepColors: Record<string, 'emerald' | 'violet' | 'amber' | 'blue' | 'default'> = {
    ANSWER: 'emerald',
    RETRIEVE: 'violet',
    BROADEN: 'amber',
    SWITCH_TOOL: 'blue',
    DECOMPOSE: 'default',
    VERIFY: 'amber',
  }

  const terminationLabels: Record<string, string> = {
    enough_docs: '文件已足夠',
    max_steps: '達到最大步數上限',
    no_improvement: '搜尋結果無改善',
  }

  return (
    <div>
      <StageDesc>多步驟 Agentic RAG 模式。LLM 自主規劃多輪搜尋：每步驟由 LLM 決策下一動作（RETRIEVE 繼續搜尋 / BROADEN 放寬條件 / SWITCH_TOOL 切換工具 / DECOMPOSE 拆分子查詢 / VERIFY 交叉驗證 / ANSWER 已足夠回答），動態調整查詢直到累積足夠高品質文件或達到最大步數上限。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <div className="space-y-1">
          <KVRow label="觸發條件" value="query_type = complex 且 agentic_mode = true" />
          <KVRow label="最大步數" value={`max_steps（每步 LLM 決策是否繼續搜尋）`} />
          <KVRow label="策略" value={<TraceBadge text="Agentic Multi-Step RAG" color="violet" />} />
          <KVRow label="搜尋路徑總數" value={`${a.total_paths} 路`} />
        </div>
      </StageSection>
      <StageSection type="decision">
        {a.steps.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-wb-40">LLM 決策步驟：</p>
            <ol className="space-y-1.5">
              {a.steps.map((s, i) => (
                <li key={i} className="space-y-0.5">
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 text-wb-40 tabular-nums text-[10px] mt-0.5">步驟 {s.step}</span>
                    <TraceBadge text={s.type} color={stepColors[s.type] ?? 'default'} />
                    {s.refinedQuery && (
                      <span className="text-wb-60 italic text-[11px] line-clamp-1">{s.refinedQuery}</span>
                    )}
                    {s.type === 'SWITCH_TOOL' && s.targetTool && (
                      <span className="text-wb-60 text-[11px]">→ <TraceBadge text={s.targetTool} color="blue" /></span>
                    )}
                    {s.type === 'VERIFY' && s.verifyQuery && (
                      <span className="text-wb-60 italic text-[11px] line-clamp-1">{s.verifyQuery}</span>
                    )}
                    {s.docs_retrieved != null && (
                      <span className="ml-auto shrink-0 text-[10px] text-wb-40 tabular-nums">{s.docs_retrieved} 筆</span>
                    )}
                  </div>
                  {s.type === 'SWITCH_TOOL' && s.reason && (
                    <p className="ml-12 text-[10px] text-wb-40">{s.reason}</p>
                  )}
                  {s.type === 'DECOMPOSE' && s.subQueries && (
                    <div className="ml-12 space-y-0.5">
                      {s.subQueries.map((sq, j) => (
                        <p key={j} className="text-[10px] text-wb-50 font-mono">• {sq}</p>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <p className="text-wb-40">LLM 首輪即決定回答（ANSWER），無額外搜尋步驟</p>
        )}
      </StageSection>
      <StageSection type="output">
        <div className="space-y-2">
          <div className="flex gap-4">
            <div>
              <p className="text-wb-40">最終文件數</p>
              <p className="text-base font-bold text-wb-90 tabular-nums">{a.final_doc_count} 筆</p>
            </div>
            <div>
              <p className="text-wb-40">搜尋總路徑</p>
              <p className="text-base font-bold text-wb-90 tabular-nums">{a.total_paths}</p>
            </div>
          </div>
          {a.termination_reason && (
            <div className="flex items-center gap-2">
              <span className="text-wb-40 text-[10px]">終止原因：</span>
              <TraceBadge
                text={terminationLabels[a.termination_reason] ?? a.termination_reason}
                color={a.termination_reason === 'enough_docs' ? 'emerald' : a.termination_reason === 'no_improvement' ? 'amber' : 'default'}
              />
            </div>
          )}
        </div>
      </StageSection>
    </IOFlow>
    </div>
  )
}
