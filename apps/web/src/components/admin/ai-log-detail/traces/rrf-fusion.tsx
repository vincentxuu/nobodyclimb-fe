'use client'

import { useState } from 'react'
import { ChevronUp } from 'lucide-react'
import { StageDesc, StageSection, IOFlow, TraceBadge, KVRow } from '../shared'
import type { PipelineTrace } from '../types'

export function RRFFusionTrace({ trace }: { trace: PipelineTrace | null }) {
  const r = trace?.retrieval
  const [expandedInputPath, setExpandedInputPath] = useState<string | null>(null)
  const [showMerged, setShowMerged] = useState(false)
  const [showOutput, setShowOutput] = useState(false)

  if (!r) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>

  const pathLabelMap: Record<string, string> = {
    query_vec: 'Query 向量',
    hyde_vec: 'HyDE 向量',
    bm25: 'BM25 全文',
  }
  const pathLabel = (p: string) => pathLabelMap[p] ?? p
  const pathColor = (p: string): 'blue' | 'violet' | 'emerald' | 'amber' | 'default' =>
    p === 'query_vec' ? 'blue' : p === 'hyde_vec' ? 'violet' : p === 'bm25' ? 'emerald' : 'amber'

  const pathEntries = r.path_counts ? Object.entries(r.path_counts) : []
  const pathResults = r.path_results ?? {}

  const rrfResults = (() => {
    const k = 60
    const docMap = new Map<string, { id: string; name?: string; rrfScore: number; paths: string[]; pathRanks: Record<string, number> }>()
    for (const [path, docs] of Object.entries(pathResults)) {
      docs.forEach((doc, rank) => {
        const contrib = 1 / (k + rank + 1)
        const existing = docMap.get(doc.id)
        if (existing) {
          existing.rrfScore += contrib
          existing.paths.push(path)
          existing.pathRanks[path] = rank + 1
        } else {
          docMap.set(doc.id, { id: doc.id, name: doc.name, rrfScore: contrib, paths: [path], pathRanks: { [path]: rank + 1 } })
        }
      })
    }
    const sorted = Array.from(docMap.values()).sort((a, b) => b.rrfScore - a.rrfScore)
    return r.rrf ? sorted.slice(0, r.rrf.merged_count) : sorted
  })()

  const threshold = r.rrf?.min_score_threshold ?? 0
  const filtered = r.rrf ? rrfResults.slice(0, r.rrf.after_threshold_count) : rrfResults

  if (!r.rrf) return (
    <div>
      <StageDesc>將多路搜尋結果以 Reciprocal Rank Fusion 演算法融合：各文件的最終 RRF 分數為其在各路徑中倒排名的加總，跨路徑去重後依分數門檻過濾低質候選，產出一份統一有序清單。</StageDesc>
      <IOFlow>
        <StageSection type="input">
          <KVRow label="觸發條件" value="retrieval 執行後必然觸發（multi-path 搜尋完成即合併）" />
          <KVRow label="各路徑候選" value={`${r.candidates_before_filter} 筆（多路徑原始結果）`} />
        </StageSection>
        <StageSection type="decision">
          <p className="text-wb-50">無詳細 RRF 資料（舊記錄）</p>
        </StageSection>
        <StageSection type="output">
          <p className="text-wb-40">無詳細 RRF 資料（舊記錄）</p>
        </StageSection>
      </IOFlow>
    </div>
  )

  return (
    <div>
      <StageDesc>將多路搜尋結果以 Reciprocal Rank Fusion 演算法融合：各文件的最終 RRF 分數為其在各路徑中倒排名的加總（score = Σ 1/(k+rank)，k=60），跨路徑去重後依分數門檻過濾低質候選，產出一份統一有序清單。</StageDesc>
      <IOFlow>
        <StageSection type="input">
          <div className="space-y-1.5">
            <KVRow label="觸發條件" value="retrieval 執行後必然觸發（multi-path 搜尋完成即合併）" />
            <KVRow label="輸入路徑" value={`${r.rrf.paths_count} 條獨立搜尋結果集`} />
            {pathEntries.length > 0 && (
              <div className="space-y-1">
                <p className="text-wb-30 text-[10px]">各路徑候選（點擊展開文件清單）：</p>
                {pathEntries.map(([path, count]) => {
                  const docs = pathResults[path] ?? []
                  const isExpanded = expandedInputPath === path
                  const hasData = docs.length > 0
                  return (
                    <div key={path} className="rounded border border-wb-10 overflow-hidden">
                      <button
                        onClick={() => hasData ? setExpandedInputPath(isExpanded ? null : path) : undefined}
                        className={`flex items-center gap-2 w-full px-2 py-1.5 bg-wb-3 text-left ${hasData ? 'cursor-pointer hover:bg-wb-5' : 'cursor-default'}`}
                      >
                        <TraceBadge text={pathLabel(path)} color={pathColor(path)} />
                        <span className={`text-[11px] font-semibold tabular-nums ${count > 0 ? 'text-wb-70' : 'text-wb-30'}`}>{count} 筆</span>
                        {hasData && <ChevronUp className={`h-3 w-3 text-wb-30 ml-auto shrink-0 transition-transform ${isExpanded ? '' : 'rotate-180'}`} />}
                      </button>
                      {isExpanded && docs.length > 0 && (
                        <div className="border-t border-wb-10 px-2 py-1.5 space-y-0.5">
                          {docs.map((doc, i) => (
                            <div key={doc.id} className="flex items-center gap-1.5 text-[10px]">
                              <span className="shrink-0 text-wb-30 tabular-nums w-5">{i + 1}.</span>
                              <span className="flex-1 text-wb-70 truncate">{doc.name ?? doc.id}</span>
                              <span className={`shrink-0 font-mono tabular-nums ${doc.score >= 0.5 ? 'text-emerald-600' : doc.score >= 0.2 ? 'text-amber-600' : 'text-wb-40'}`}>
                                {doc.score.toFixed(3)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </StageSection>

        <StageSection type="decision">
          <div className="space-y-1.5">
            <KVRow label="演算法" value={<span>RRF score = <span className="font-mono">Σ 1/(60 + rank)</span>（各路徑倒排名加總）</span>} />
            <KVRow label="跨路徑去重" value={`合併為 ${r.rrf.merged_count} 筆唯一文件`} />
            <KVRow label="分數門檻" value={
              <span>
                <span className="font-mono text-violet-600">{r.rrf.min_score_threshold.toFixed(4)}</span>
                <span className="ml-1.5 text-wb-30 text-[10px]">RRF 分低於此值的文件被過濾</span>
              </span>
            } />
            <KVRow label="過濾結果" value={
              <span>
                <span className="text-wb-50">{r.rrf.merged_count} 筆</span>
                <span className="mx-1 text-wb-30">→</span>
                <span className="text-emerald-600 font-semibold">{r.rrf.after_threshold_count} 筆</span>
                <span className="ml-1 text-wb-30 text-[10px]">通過門檻</span>
              </span>
            } />
            {rrfResults.length > 0 && (
              <div>
                <button
                  onClick={() => setShowMerged(v => !v)}
                  className="flex items-center gap-1 text-[10px] text-violet-600 hover:text-violet-700 mt-0.5"
                >
                  <ChevronUp className={`h-3 w-3 transition-transform ${showMerged ? '' : 'rotate-180'}`} />
                  {showMerged ? '收起' : `展開合併後 ${rrfResults.length} 筆文件（含 RRF 分 + 來源路徑）`}
                </button>
                {showMerged && (
                  <div className="mt-1.5 space-y-0.5">
                    <div className="grid grid-cols-[20px_1fr_56px_auto] gap-x-2 text-[9px] text-wb-30 px-1 pb-0.5 border-b border-wb-8">
                      <span>#</span><span>文件名稱</span><span className="text-right">RRF分</span><span>路徑</span>
                    </div>
                    {rrfResults.map((doc, i) => {
                      const passed = doc.rrfScore >= threshold
                      return (
                        <div key={doc.id} className={`grid grid-cols-[20px_1fr_56px_auto] gap-x-2 items-center text-[10px] px-1 py-0.5 rounded ${passed ? '' : 'opacity-40'}`}>
                          <span className="text-wb-30 tabular-nums">{i + 1}.</span>
                          <span className={`truncate ${passed ? 'text-wb-70' : 'text-wb-40 line-through'}`}>{doc.name ?? doc.id}</span>
                          <span className={`text-right font-mono tabular-nums ${passed ? 'text-violet-600' : 'text-wb-30'}`}>{doc.rrfScore.toFixed(4)}</span>
                          <div className="flex gap-0.5 flex-wrap">
                            {doc.paths.map(p => (
                              <TraceBadge key={p} text={p === 'query_vec' ? 'Q' : p === 'hyde_vec' ? 'H' : p === 'bm25' ? 'B' : p.replace('expanded_', 'E')} color={pathColor(p)} />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </StageSection>

        <StageSection type="output">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-emerald-600 font-bold text-base tabular-nums">{r.rrf.after_threshold_count} 筆</span>
              <span className="text-wb-40">融合後有效候選，進入 CRAG 充足性判斷</span>
            </div>
            <p className="text-wb-30 text-[10px]">已按 RRF 分數降序排列，相同文件出現在越多路徑且排名越前則分數越高</p>
            {filtered.length > 0 && (
              <div>
                <button
                  onClick={() => setShowOutput(v => !v)}
                  className="flex items-center gap-1 text-[10px] text-emerald-600 hover:text-emerald-700 mt-0.5"
                >
                  <ChevronUp className={`h-3 w-3 transition-transform ${showOutput ? '' : 'rotate-180'}`} />
                  {showOutput ? '收起' : `展開最終 ${filtered.length} 筆排序清單`}
                </button>
                {showOutput && (
                  <div className="mt-1.5 space-y-0.5">
                    <div className="grid grid-cols-[20px_1fr_56px_auto] gap-x-2 text-[9px] text-wb-30 px-1 pb-0.5 border-b border-wb-8">
                      <span>#</span><span>文件名稱</span><span className="text-right">RRF分</span><span>出現路徑</span>
                    </div>
                    {filtered.map((doc, i) => (
                      <div key={doc.id} className="grid grid-cols-[20px_1fr_56px_auto] gap-x-2 items-center text-[10px] px-1 py-0.5 rounded hover:bg-wb-3">
                        <span className="text-wb-40 tabular-nums">{i + 1}.</span>
                        <span className="text-wb-80 truncate">{doc.name ?? doc.id}</span>
                        <span className="text-right font-mono tabular-nums text-emerald-600">{doc.rrfScore.toFixed(4)}</span>
                        <div className="flex gap-0.5 flex-wrap">
                          {doc.paths.map(p => (
                            <TraceBadge key={p} text={p === 'query_vec' ? 'Q' : p === 'hyde_vec' ? 'H' : p === 'bm25' ? 'B' : p.replace('expanded_', 'E')} color={pathColor(p)} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </StageSection>
      </IOFlow>
    </div>
  )
}
