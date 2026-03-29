'use client'

import { CheckCircle2 } from 'lucide-react'
import { IOFlow, KVRow, StageDesc, StageSection, TraceBadge } from '../shared'
import type { PipelineTrace } from '../types'

export function CRAGFallbackTrace({ trace }: { trace: PipelineTrace | null }) {
  const r = trace?.retrieval
  if (!r) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>

  const postRrfCount = r.rrf?.after_threshold_count ?? r.candidates_before_filter
  const triggered = r.crag_fallback
  const hasDetail = !!r.crag_fallback_detail
  const finalCount = hasDetail
    ? (r.crag_fallback_detail!.retries.at(-1)?.candidates_after ?? postRrfCount)
    : postRrfCount

  return (
    <div>
      <StageDesc>
        判斷 RRF 後的有效候選是否足夠。若不足，逐步放寬 Metadata Filter
        條件並重新搜尋：先移除難度（grade）限制，再移除類型（type）限制，每次重試後重新計算候選數，直到足夠或放無可放為止。
      </StageDesc>
      <IOFlow>
        <StageSection type="input">
          <div className="space-y-1">
            <KVRow label="RRF 後候選" value={`${postRrfCount} 筆`} />
            <KVRow label="觸發條件" value="candidates_after_filter = 0（過濾後無候選）" />
            {r.crag_fallback_stage && (
              <KVRow
                label="已放寬至"
                value={
                  r.crag_fallback_stage === 'grade'
                    ? '移除 grade 難度過濾'
                    : '移除 grade + type 過濾'
                }
              />
            )}
          </div>
        </StageSection>
        <StageSection type="decision">
          <div className="space-y-1.5">
            {triggered ? (
              <>
                <div className="flex items-center gap-1.5">
                  <TraceBadge text="觸發回退" color="amber" />
                  {r.crag_fallback_detail?.trigger_reason && (
                    <span className="text-wb-50 text-[10px]">
                      {r.crag_fallback_detail.trigger_reason}
                    </span>
                  )}
                </div>
                {hasDetail && r.crag_fallback_detail!.retries.length > 0 ? (
                  <div className="space-y-1.5 pt-0.5">
                    <p className="text-wb-30 text-[10px]">放寬步驟：</p>
                    {r.crag_fallback_detail!.retries.map((retry, i) => (
                      <div
                        key={i}
                        className="rounded border border-amber-100 bg-amber-50/40 px-2 py-1.5 space-y-0.5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-wb-30 text-[10px] tabular-nums">Step {i + 1}</span>
                          <span className="text-wb-40 text-[10px]">移除</span>
                          <TraceBadge text={retry.removed_filter} color="red" />
                          <span className="text-wb-30 text-[10px]">過濾條件</span>
                        </div>
                        <div className="flex items-center gap-1.5 pl-1">
                          <span className="text-wb-40 text-[10px]">重搜結果：</span>
                          <span className="text-amber-700 font-semibold text-[11px]">
                            {retry.candidates_after} 筆
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : r.crag_fallback_stage ? (
                  <div className="space-y-1">
                    <TraceBadge
                      text={
                        r.crag_fallback_stage === 'grade'
                          ? '移除 grade 難度過濾後重搜'
                          : '移除 grade + type 後重搜'
                      }
                      color="amber"
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="text-wb-50">
                  candidates_after_filter &gt; 0，候選充足，跳過回退
                </span>
              </div>
            )}
          </div>
        </StageSection>
        <StageSection type="output">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span
                className={`font-bold text-base tabular-nums ${triggered ? 'text-amber-600' : 'text-emerald-600'}`}
              >
                {finalCount} 筆
              </span>
              <span className="text-wb-40">
                {triggered
                  ? '放寬過濾後的候選，進入 Cross-encoder Reranking'
                  : '原始有效候選，進入 Cross-encoder Reranking'}
              </span>
            </div>
            {triggered && (
              <p className="text-wb-30 text-[10px]">
                注意：放寬過濾可能引入相關性較低的文件，後續 Reranking 將依語意評分再次排序
              </p>
            )}
          </div>
        </StageSection>
      </IOFlow>
    </div>
  )
}
