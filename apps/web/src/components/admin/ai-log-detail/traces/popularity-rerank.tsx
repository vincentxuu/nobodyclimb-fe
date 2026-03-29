'use client'

import { IOFlow, KVRow, StageDesc, StageSection } from '../shared'
import type { PipelineTrace } from '../types'

export function PopularityRerankTrace({
  trace,
  sources,
}: {
  trace: PipelineTrace | null
  sources: Array<{ title?: string; type?: string; score?: number }>
}) {
  const pr = trace?.popularity_rerank
  if (!pr) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>

  return (
    <div>
      <StageDesc>依路線影片數量對候選文件進行熱門度加權排序，確保回答覆蓋受歡迎的路線。</StageDesc>
      <IOFlow>
        <StageSection type="input">
          <div className="space-y-1.5">
            <KVRow
              label="熱門度加權"
              value={
                <span>
                  <span className="font-mono text-amber-600">{pr.popularity_weight}</span>
                  <span className="ml-1.5 text-wb-30 text-[10px]">
                    依影片數正規化熱門度（0–1）的加成係數
                  </span>
                </span>
              }
            />
            <KVRow label="文件數" value={`${pr.doc_count} 筆`} />
          </div>
        </StageSection>
        <StageSection type="decision">
          <KVRow
            label="加權公式"
            value={
              <span className="font-mono text-[10px]">
                final(d) = reranker_score × reranker_weight + popularity(d) × popularity_weight
              </span>
            }
          />
        </StageSection>
        <StageSection type="output">
          <div className="space-y-2">
            {pr.top_selected && pr.top_selected.length > 0 && (
              <div>
                <p className="text-wb-40 mb-1.5">排序結果（{pr.top_selected.length} 筆）：</p>
                <div
                  className="grid text-[10px] text-wb-30 mb-1 px-2"
                  style={{ gridTemplateColumns: '1.2rem 1fr 3rem 3rem 3rem' }}
                >
                  <span>#</span>
                  <span>文件</span>
                  <span className="text-right" title="Reranker 相關性分">
                    相關性↑
                  </span>
                  <span className="text-right" title="影片數正規化熱門度">
                    熱門度↑
                  </span>
                  <span className="text-right" title="加權後最終分">
                    最終分↑
                  </span>
                </div>
                <div className="space-y-0.5">
                  {pr.top_selected.map((doc, i) => (
                    <div
                      key={i}
                      className="grid items-center gap-x-1.5 rounded px-2 py-1 hover:bg-wb-5 text-[11px]"
                      style={{ gridTemplateColumns: '1.2rem 1fr 3rem 3rem 3rem' }}
                    >
                      <span className="text-wb-30 tabular-nums">{i + 1}</span>
                      <span className="text-wb-80 truncate">{doc.title}</span>
                      <span className="text-right font-mono text-blue-600 tabular-nums">
                        {doc.relevance_score.toFixed(3)}
                      </span>
                      <span className="text-right font-mono text-amber-600 tabular-nums">
                        {doc.popularity_score.toFixed(3)}
                      </span>
                      <span className="text-right font-mono text-emerald-600 tabular-nums font-semibold">
                        {doc.final_score.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {sources.length > 0 && (
              <div>
                <p className="text-wb-40 mb-1">送入 LLM 的文件（{sources.length} 筆）：</p>
                <div className="space-y-1">
                  {sources.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 rounded bg-wb-5 px-2 py-1">
                      <span className="shrink-0 rounded border border-wb-20 px-1 py-0.5 text-[10px] text-wb-60">
                        {s.type}
                      </span>
                      <span className="flex-1 text-wb-80 truncate">{s.title ?? '—'}</span>
                      {s.score != null && (
                        <span
                          className={`tabular-nums shrink-0 text-[11px] ${s.score >= 0.7 ? 'text-emerald-600' : s.score >= 0.5 ? 'text-amber-600' : 'text-red-500'}`}
                        >
                          {(s.score * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </StageSection>
      </IOFlow>
    </div>
  )
}
