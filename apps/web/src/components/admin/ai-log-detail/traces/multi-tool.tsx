'use client'

import { StageDesc, StageSection, IOFlow, TraceBadge, KVRow } from '../shared'
import type { PipelineTrace } from '../types'

export function MultiToolTrace({ trace }: { trace: PipelineTrace }) {
  const mt = trace.multi_tool
  if (!mt) return <p className="text-[11px] text-wb-40">無詳細資料</p>

  if (mt.fallback) {
    return (
      <div>
        <StageDesc>多工具組合查詢：將多個工具的結果整合為統一回答。執行失敗時降級為 BM25 搜尋。</StageDesc>
        <IOFlow>
          <StageSection type="decision">
            <div className="flex items-center gap-2">
              <TraceBadge text="執行失敗" color="amber" />
              <span className="text-wb-60">已降級為 BM25 搜尋</span>
            </div>
            {mt.error && <p className="text-[10px] text-wb-40 mt-1 font-mono">{mt.error}</p>}
          </StageSection>
          <StageSection type="output">
            <KVRow label="耗時" value={`${mt.total_duration_ms ?? 0} ms`} />
          </StageSection>
        </IOFlow>
      </div>
    )
  }

  return (
    <div>
      <StageDesc>多工具組合查詢：復用 Plan-and-Execute 基礎設施，將多個工具的搜尋結果整合為統一回答。</StageDesc>
      <IOFlow>
        <StageSection type="input">
          <KVRow label="執行模式" value={mt.execution_mode === 'parallel' ? '並行' : '循序'} />
          <KVRow label="步驟數" value={`${mt.steps?.length ?? 0} 步`} />
        </StageSection>
        <StageSection type="decision">
          {mt.steps && mt.steps.length > 0 ? (
            <ol className="space-y-1.5">
              {mt.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="shrink-0 text-wb-40 tabular-nums text-[10px] mt-0.5">#{s.stepId}</span>
                  <TraceBadge text={s.tool} color="blue" />
                  <span className="text-wb-60 italic text-[11px] line-clamp-1 flex-1">{s.query}</span>
                  <span className="shrink-0 text-[10px] text-wb-40 tabular-nums">{s.result_count} 筆 / {s.duration_ms} ms</span>
                  {s.error && <TraceBadge text="錯誤" color="amber" />}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-wb-40">無步驟資料</p>
          )}
        </StageSection>
        <StageSection type="output">
          <div className="flex gap-4">
            <div>
              <p className="text-wb-40">來源數</p>
              <p className="text-base font-bold text-wb-90 tabular-nums">{mt.sources_count ?? 0} 筆</p>
            </div>
            <div>
              <p className="text-wb-40">總耗時</p>
              <p className="text-base font-bold text-wb-90 tabular-nums">{mt.total_duration_ms ?? 0} ms</p>
            </div>
          </div>
        </StageSection>
      </IOFlow>
    </div>
  )
}
