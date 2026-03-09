'use client'

import { useState } from 'react'
import { ChevronUp } from 'lucide-react'
import { StageDesc, StageSection, IOFlow, TraceBadge, KVRow } from '../shared'
import type { PipelineTrace } from '../types'

export function RerankerTrace({ trace, query }: { trace: PipelineTrace | null; query: string }) {
  const r = trace?.retrieval
  const [showInput, setShowInput] = useState(false)
  if (!r) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>

  const skipped = r.reranker_used === false || !!r.reranker?.skipped_reason
  const inputCount = r.reranker?.input_count ?? (r.rrf?.after_threshold_count ?? r.candidates_before_filter)

  const rrfFilteredDocs = (() => {
    if (!r.path_results || !r.rrf) return []
    const k = 60
    const docMap = new Map<string, { id: string; name?: string; rrfScore: number }>()
    for (const [, docs] of Object.entries(r.path_results)) {
      docs.forEach((doc, rank) => {
        const contrib = 1 / (k + rank + 1)
        const ex = docMap.get(doc.id)
        if (ex) ex.rrfScore += contrib
        else docMap.set(doc.id, { id: doc.id, name: doc.name, rrfScore: contrib })
      })
    }
    const threshold = r.rrf.min_score_threshold
    return Array.from(docMap.values())
      .filter(d => d.rrfScore >= threshold)
      .sort((a, b) => b.rrfScore - a.rrfScore)
  })()

  return (
    <div>
      <StageDesc>使用 Cross-encoder 模型（BAAI/bge-reranker-base）對每份候選文件與查詢進行聯合編碼評分。相比 Bi-encoder 的獨立嵌入，Cross-encoder 直接對「查詢 + 文件」整體建模，能更精準捕捉語意相關性，產出 0–1 的信心度分數並重新排序。</StageDesc>
      <IOFlow>
        <StageSection type="input">
          <div className="space-y-1.5">
            <KVRow label="觸發條件" value="候選文件數 ≥ min_rerank_count（候選過少時跳過以節省時間）" />
            <div className="space-y-0.5">
              <p className="text-wb-40 text-[10px]">評分用查詢：</p>
              <p className="font-mono text-[11px] text-wb-70 bg-wb-5 rounded px-2 py-1.5 break-all line-clamp-2">{query}</p>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-wb-50">候選文件（RRF 後）：</span>
                <span className="font-semibold text-wb-80 tabular-nums">{inputCount} 筆</span>
                {rrfFilteredDocs.length > 0 && (
                  <button onClick={() => setShowInput(v => !v)} className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700">
                    <ChevronUp className={`h-3 w-3 transition-transform ${showInput ? '' : 'rotate-180'}`} />
                    {showInput ? '收起' : '展開清單'}
                  </button>
                )}
              </div>
              {showInput && rrfFilteredDocs.length > 0 && (
                <div className="space-y-0.5 mt-0.5">
                  {rrfFilteredDocs.map((doc, i) => (
                    <div key={doc.id} className="flex items-center gap-1.5 text-[10px] px-1">
                      <span className="text-wb-30 tabular-nums w-5 shrink-0">{i + 1}.</span>
                      <span className="flex-1 text-wb-70 truncate">{doc.name ?? doc.id}</span>
                      <span className="font-mono tabular-nums text-wb-40">{doc.rrfScore.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <KVRow label="評分模型" value="BAAI/bge-reranker-base（Cross-encoder）" />
            <KVRow label="分數範圍" value="0–1（≥ 0.5 高相關 ／ 0.2–0.5 部分相關 ／ < 0.2 低相關）" />
          </div>
        </StageSection>
        <StageSection type="decision">
          {skipped ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <TraceBadge text="跳過 Reranking" color="default" />
              </div>
              <KVRow label="原因" value={r.reranker?.skipped_reason ?? '候選數過少，不值得執行 Cross-encoder'} />
              <p className="text-wb-30 text-[10px]">候選將以 RRF 原始分數排序直接進入 MMR</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-wb-50">對每份文件與查詢的組合執行 Cross-encoder 推論，計算交叉注意力（cross-attention）語意相關分數</p>
              <p className="text-wb-30 text-[10px]">每次推論獨立輸入整段文件，比 Bi-encoder 計算量大但精準度更高</p>
            </div>
          )}
        </StageSection>
        <StageSection type="output">
          {skipped ? (
            <div className="flex items-baseline gap-2">
              <span className="text-wb-60 font-bold text-base tabular-nums">{inputCount} 筆</span>
              <span className="text-wb-40">維持 RRF 原排序，直接進入 MMR + 熱門度加權</span>
            </div>
          ) : r.reranker?.top_scores ? (
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-violet-600 font-bold text-base tabular-nums">{r.reranker.top_scores.length} 筆</span>
                <span className="text-wb-40">重排後 Top 結果，進入 MMR + 熱門度加權</span>
              </div>
              <div className="space-y-0.5">
                <div className="grid text-[10px] text-wb-30 mb-0.5 px-1" style={{ gridTemplateColumns: '1.2rem 1fr 3.5rem' }}>
                  <span>#</span><span>文件</span><span className="text-right">信心度↑</span>
                </div>
                {r.reranker.top_scores.map((doc, i) => (
                  <div key={i} className="grid items-center gap-x-1.5 rounded px-1 py-0.5 hover:bg-wb-5 text-[11px]" style={{ gridTemplateColumns: '1.2rem 1fr 3.5rem' }}>
                    <span className="shrink-0 text-wb-30 tabular-nums">{i + 1}</span>
                    <span className="text-wb-70 truncate">{doc.title}</span>
                    <span className={`text-right tabular-nums font-mono font-semibold ${doc.score >= 0.5 ? 'text-emerald-600' : doc.score >= 0.2 ? 'text-amber-600' : 'text-wb-50'}`}>
                      {doc.score.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <TraceBadge text="已重排" color="violet" />
              <span className="text-wb-40">進入 MMR + 熱門度加權</span>
            </div>
          )}
        </StageSection>
      </IOFlow>
    </div>
  )
}
