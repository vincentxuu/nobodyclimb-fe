'use client'

import { StageDesc, StageSection, IOFlow, TraceBadge, KVRow } from '../shared'
import type { PipelineTrace } from '../types'

export function MMRSelectionTrace({ trace, sources }: { trace: PipelineTrace | null; sources: Array<{ title?: string; type?: string; score?: number }> }) {
  const m = trace?.mmr_selection
  if (!m) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>

  return (
    <div>
      <StageDesc>從 Reranking 後的候選中，以 Maximal Marginal Relevance（MMR）迭代選出兼顧相關性與多樣性的文件組合：每輪選取「與查詢最相關，同時與已選集合相似度最低」的文件。並對攀登紀錄數多的熱門路線施以熱門度加成，確保回答覆蓋受歡迎的路線。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <div className="space-y-1.5">
          <KVRow label="觸發條件" value="所有向量搜尋路徑必經；Reranking 後執行多樣性選取" />
          {trace?.retrieval?.reranker?.top_scores && trace.retrieval.reranker.top_scores.length > 0 ? (
            <div>
              <p className="text-wb-40 text-[10px] mb-1">輸入文件（Reranker 輸出，{m.input_count} 筆）：</p>
              <div className="space-y-0.5">
                {trace.retrieval.reranker.top_scores.map((doc, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] px-1">
                    <span className="text-wb-30 tabular-nums w-5 shrink-0">{i + 1}.</span>
                    <span className="flex-1 text-wb-70 truncate">{doc.title}</span>
                    <span className={`font-mono tabular-nums shrink-0 ${doc.score >= 0.5 ? 'text-emerald-600' : doc.score >= 0.2 ? 'text-amber-600' : 'text-wb-40'}`}>{doc.score.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <KVRow label="輸入候選" value={`${m.input_count} 筆（Cross-encoder Reranking 後）`} />
          )}
          <KVRow label="lambda (λ)" value={
            <span>
              <span className="font-mono text-violet-600">{m.lambda}</span>
              <span className="ml-1.5 text-wb-30 text-[10px]">λ=1.0 純相關性 ／ λ=0.0 純多樣性 ／ 中間值平衡兩者</span>
            </span>
          } />
          <KVRow label="熱門度加權" value={
            <span>
              <span className="font-mono text-amber-600">{m.popularity_weight}</span>
              <span className="ml-1.5 text-wb-30 text-[10px]">依攀登紀錄數正規化的熱門度分（0–1）的加成係數</span>
            </span>
          } />
        </div>
      </StageSection>
      <StageSection type="decision">
        <div className="space-y-1.5">
          <KVRow label="MMR 公式" value={
            <span className="font-mono text-[10px]">
              score(d) = λ × rel(d,q) − (1−λ) × max_sim(d, selected)
            </span>
          } />
          <KVRow label="熱門度補正" value={
            <span className="font-mono text-[10px]">
              final(d) = score(d) + popularity_weight × popularity(d)
            </span>
          } />
          <p className="text-wb-30 text-[10px]">每輪迭代選出 final score 最高的未選文件，直到達到目標數量</p>
        </div>
      </StageSection>
      <StageSection type="output">
        <div className="space-y-2">
          <div className="flex gap-4">
            <div>
              <p className="text-wb-40">輸入</p>
              <p className="text-base font-bold text-wb-90 tabular-nums">{m.input_count} 筆</p>
            </div>
            <div>
              <p className="text-wb-40">MMR 選出</p>
              <p className="text-base font-bold text-emerald-600 tabular-nums">{m.selected_count} 筆</p>
            </div>
          </div>
          {m.top_selected && m.top_selected.length > 0 && (
            <div>
              <p className="text-wb-40 mb-1.5">MMR 選取明細（{m.top_selected.length} 筆）：</p>
              <div className="grid text-[10px] text-wb-30 mb-1 px-2" style={{ gridTemplateColumns: '1.2rem 1fr 3rem 3rem 3rem' }}>
                <span>#</span><span>文件</span>
                <span className="text-right" title="MMR 相關性分（0–1，越高越符合查詢）">相關性↑</span>
                <span className="text-right" title="影片數正規化熱門度（0–1，攀登紀錄越多越高）">熱門度↑</span>
                <span className="text-right" title="λ×相關性 + (1-λ)×熱門度 的加權組合分">最終分↑</span>
              </div>
              <div className="space-y-0.5">
                {m.top_selected.map((doc, i) => (
                  <div key={i} className="grid items-center gap-x-1.5 rounded px-2 py-1 hover:bg-wb-5 text-[11px]" style={{ gridTemplateColumns: '1.2rem 1fr 3rem 3rem 3rem' }}>
                    <span className="text-wb-30 tabular-nums">{i + 1}</span>
                    <span className="text-wb-80 truncate">{doc.title}</span>
                    <span className="text-right font-mono text-blue-600 tabular-nums">{doc.relevance_score.toFixed(3)}</span>
                    <span className="text-right font-mono text-amber-600 tabular-nums">{doc.popularity_score.toFixed(3)}</span>
                    <span className="text-right font-mono text-emerald-600 tabular-nums font-semibold">{doc.final_score.toFixed(3)}</span>
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
                    <span className="shrink-0 rounded border border-wb-20 px-1 py-0.5 text-[10px] text-wb-60">{s.type}</span>
                    <span className="flex-1 text-wb-80 truncate">{s.title ?? '—'}</span>
                    {s.score != null && (
                      <span className={`tabular-nums shrink-0 text-[11px] ${s.score >= 0.7 ? 'text-emerald-600' : s.score >= 0.5 ? 'text-amber-600' : 'text-red-500'}`}>
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
