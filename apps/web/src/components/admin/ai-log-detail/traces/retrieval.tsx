'use client'

import { ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { IOFlow, StageDesc, StageSection, TraceBadge } from '../shared'
import { ensureArray, type PipelineTrace } from '../types'

export function OutputPathList({
  r,
  totalRaw,
  pathColor,
}: {
  r: NonNullable<PipelineTrace['retrieval']>
  totalRaw: number
  pathColor: (_p: string) => 'blue' | 'violet' | 'emerald' | 'default'
}) {
  const [expandedPath, setExpandedPath] = useState<string | null>(null)
  const pathLabel = (p: string) =>
    p === 'query_vec' ? 'Query Vec' : p === 'hyde_vec' ? 'HyDE Vec' : p === 'bm25' ? 'BM25' : p
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-2">
        <span className="text-wb-80 font-bold text-base tabular-nums">{totalRaw} 筆</span>
        <span className="text-wb-40">各路徑原始候選合計（含重複），送入 RRF 合併去重</span>
      </div>
      {r.path_counts && (
        <div className="space-y-1">
          {Object.entries(r.path_counts).map(([path, count]) => {
            const docs = ensureArray<{ id: string; score: number; name?: string }>(
              r.path_results?.[path]
            )
            const isExpanded = expandedPath === path
            const hasData = docs.length > 0
            return (
              <div key={path} className="rounded border border-wb-10 overflow-hidden">
                <button
                  onClick={() => (hasData ? setExpandedPath(isExpanded ? null : path) : undefined)}
                  className={`flex items-center gap-2 w-full px-2 py-1.5 bg-wb-3 text-left ${hasData ? 'cursor-pointer hover:bg-wb-5' : 'cursor-default'}`}
                >
                  <TraceBadge text={pathLabel(path)} color={pathColor(path)} />
                  <span
                    className={`text-[11px] font-semibold tabular-nums ${count > 0 ? 'text-wb-70' : 'text-wb-30'}`}
                  >
                    {count} 筆
                  </span>
                  {count !== docs.length && docs.length > 0 && (
                    <span className="text-[10px] text-wb-30">（顯示前 {docs.length} 筆）</span>
                  )}
                  {hasData && (
                    <ChevronUp
                      className={`h-3 w-3 text-wb-30 ml-auto shrink-0 transition-transform ${isExpanded ? '' : 'rotate-180'}`}
                    />
                  )}
                </button>
                {isExpanded && docs.length > 0 && (
                  <div className="border-t border-wb-10 px-2 py-1.5 space-y-0.5">
                    <p className="text-[9px] text-wb-25 mb-1">
                      {path === 'bm25' ? 'BM25 相關分' : '向量餘弦相似度（0–1）'}
                    </p>
                    {docs.map((doc, i) => (
                      <div key={doc.id} className="flex items-center gap-1.5 text-[10px]">
                        <span className="shrink-0 text-wb-30 tabular-nums w-5">{i + 1}.</span>
                        <span className="flex-1 text-wb-70 truncate">{doc.name ?? doc.id}</span>
                        <span
                          className={`shrink-0 font-mono tabular-nums ${doc.score >= 0.5 ? 'text-emerald-600' : doc.score >= 0.2 ? 'text-amber-600' : 'text-wb-40'}`}
                        >
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
  )
}

export function RetrievalTrace({
  trace,
  pipelineStage: _pipelineStage,
  query,
}: {
  trace: PipelineTrace
  pipelineStage: Record<string, unknown> | null
  query: string
}) {
  const r = trace.retrieval
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const togglePath = (p: string) =>
    setExpandedPaths((prev) => {
      const s = new Set(prev)
      s.has(p) ? s.delete(p) : s.add(p)
      return s
    })
  const pathColor = (p: string) =>
    p === 'query_vec' ? 'blue' : p === 'hyde_vec' ? 'violet' : p === 'bm25' ? 'emerald' : 'default'

  if (!r) {
    const altPath = trace.agentic
      ? 'Agentic Multi-Step'
      : trace.plan_execute
        ? 'Plan-and-Execute'
        : trace.multi_tool
          ? 'Multi-Tool'
          : null
    if (altPath) {
      return (
        <p className="text-[11px] text-wb-40">此查詢走 {altPath} 路徑，詳細資料請查看對應階段</p>
      )
    }
    return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
  }

  const totalRaw = r.path_counts
    ? Object.values(r.path_counts).reduce((a, b) => a + b, 0)
    : r.candidates_before_filter

  const appliedFilter = trace.filter?.applied
  const filterKeys = appliedFilter ? Object.keys(appliedFilter) : []

  const hydeDoc = trace.hyde?.document
  const expandedQueries = Array.isArray(trace.multi_query?.queries) ? trace.multi_query.queries : []
  const retrievalPaths = Array.isArray(r.paths) ? r.paths : []

  const pathMeta: Record<string, { label: string; trigger: string; dotColor: string }> = {
    query_vec: {
      label: 'Query Vec（原始查詢向量）',
      trigger: '所有非快取查詢必經（原始查詢 embedding）',
      dotColor: 'bg-blue-400',
    },
    hyde_vec: {
      label: 'HyDE Vec（假設文件向量）',
      trigger: 'HyDE 啟用且 query_type = complex',
      dotColor: 'bg-violet-400',
    },
    bm25: {
      label: 'BM25（全文關鍵字搜尋）',
      trigger: 'BM25 配置啟用時，與向量搜尋並行執行',
      dotColor: 'bg-emerald-400',
    },
  }

  return (
    <div>
      <StageDesc>
        同時對向量資料庫發出多條獨立搜尋請求，各路徑使用不同策略：查詢向量（餘弦相似度）、HyDE
        假設文件向量（語意擴展）、BM25 全文關鍵字搜尋。各路徑獨立執行後回傳候選文件，供後續 RRF
        合併。
      </StageDesc>
      <IOFlow>
        <StageSection type="input">
          <div className="space-y-2">
            {r.retrieval_method && r.retrieval_method !== 'hybrid' && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-wb-40">檢索模式：</span>
                <TraceBadge
                  text={
                    r.retrieval_method === 'bm25'
                      ? 'BM25 Only（跳過向量搜尋）'
                      : r.retrieval_method === 'vector'
                        ? 'Vector Only（跳過 BM25）'
                        : r.retrieval_method
                  }
                  color={r.retrieval_method === 'bm25' ? 'amber' : 'blue'}
                />
              </div>
            )}
            {retrievalPaths.length > 0 ? (
              retrievalPaths.map((p) => {
                const meta = pathMeta[p]
                const isMQ = !meta
                const mqIndex = isMQ ? parseInt(p.replace(/^(expanded_|mq_)/, ''), 10) : -1
                const mqQuery =
                  !isNaN(mqIndex) && mqIndex >= 0 ? expandedQueries[mqIndex] : undefined
                const dotColor = isMQ ? 'bg-amber-400' : meta.dotColor
                const label = isMQ ? `Multi-Query 擴展 #${mqIndex + 1}` : meta.label
                const trigger = isMQ ? 'Multi-Query 啟用，由 LLM 改寫原始查詢而來' : meta.trigger

                let inputText: string | null = null
                if (p === 'query_vec') inputText = query || null
                else if (p === 'hyde_vec') inputText = hydeDoc ?? null
                else if (p === 'bm25') inputText = r.bm25_fts_query ?? null
                else if (isMQ) inputText = mqQuery ?? null

                const borderColor =
                  p === 'bm25'
                    ? 'border-emerald-100'
                    : p === 'hyde_vec'
                      ? 'border-violet-100'
                      : isMQ
                        ? 'border-amber-100'
                        : 'border-blue-100'
                const textCls =
                  p === 'hyde_vec'
                    ? `ml-3 text-[10px] text-wb-70 font-mono border-l-2 pl-2 max-h-40 overflow-auto whitespace-pre-wrap ${borderColor}`
                    : `ml-3 text-[10px] text-wb-70 font-mono border-l-2 pl-2 whitespace-pre-wrap break-all ${borderColor}`

                return (
                  <div key={p} className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
                      <span className="font-medium">{label}</span>
                    </div>
                    <p className="ml-3 text-[10px] text-wb-40 border-l-2 border-wb-8 pl-2">
                      {trigger}
                    </p>
                    {inputText ? (
                      <p className={textCls}>{inputText}</p>
                    ) : (
                      <p className="ml-3 text-[10px] text-wb-30 border-l-2 border-wb-8 pl-2 italic">
                        {p === 'bm25'
                          ? 'BM25 查詢未記錄'
                          : p === 'hyde_vec'
                            ? '假設文件未記錄（舊記錄）'
                            : isMQ
                              ? '擴展查詢未記錄（舊記錄）'
                              : '查詢文字未記錄'}
                      </p>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="text-[11px] text-wb-40">無路徑資料（舊記錄或 trace 不完整）</p>
            )}
            <div className="pt-1 border-t border-wb-8 space-y-0.5">
              <p className="text-wb-30 text-[10px]">Metadata Filter：</p>
              {filterKeys.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {filterKeys.map((k) => (
                    <span
                      key={k}
                      className="rounded border border-wb-10 bg-wb-3 px-1.5 py-0.5 text-[10px] text-wb-60 font-mono"
                    >
                      {k}: {JSON.stringify((appliedFilter as Record<string, unknown>)[k])}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-wb-50 text-[10px]">無（搜尋全庫）</p>
              )}
            </div>
          </div>
        </StageSection>
        <StageSection type="decision">
          <div className="space-y-1">
            <p className="text-wb-30 text-[10px] mb-1">各路徑執行結果（點擊展開文件清單）</p>
            {retrievalPaths.length > 0 ? (
              retrievalPaths.map((p) => {
                const docs = r.path_results?.[p]
                const count = r.path_counts?.[p]
                const expanded = expandedPaths.has(p)
                const hasData = (count ?? 0) > 0
                const isMQPath = p !== 'query_vec' && p !== 'hyde_vec' && p !== 'bm25'
                const mqIdx = isMQPath ? parseInt(p.replace(/^(expanded_|mq_)/, ''), 10) : -1
                const pathInputText =
                  p === 'query_vec'
                    ? query
                    : p === 'hyde_vec'
                      ? (hydeDoc ?? null)
                      : p === 'bm25'
                        ? (r.bm25_fts_query ?? null)
                        : !isNaN(mqIdx) && mqIdx >= 0
                          ? (expandedQueries[mqIdx] ?? null)
                          : null
                return (
                  <div key={p} className="rounded border border-wb-10 overflow-hidden">
                    <button
                      onClick={() => (hasData ? togglePath(p) : undefined)}
                      className={`flex items-start gap-2 w-full px-2 py-1.5 bg-wb-3 text-left ${hasData ? 'cursor-pointer hover:bg-wb-5' : 'cursor-default'}`}
                    >
                      <TraceBadge text={p} color={pathColor(p)} />
                      <span
                        className={`text-[11px] tabular-nums font-semibold shrink-0 ${hasData ? 'text-wb-70' : 'text-wb-30'}`}
                      >
                        {count ?? 0} 筆
                      </span>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-[10px] text-wb-30">
                          {p === 'query_vec'
                            ? '查詢向量搜尋（餘弦相似度）'
                            : p === 'hyde_vec'
                              ? 'HyDE 假設文件向量搜尋（餘弦相似度）'
                              : p === 'bm25'
                                ? 'BM25 全文關鍵字搜尋'
                                : 'Multi-Query 擴展查詢向量搜尋'}
                        </p>
                        {pathInputText && (
                          <p className="text-[10px] text-wb-60 font-mono break-all whitespace-pre-wrap line-clamp-2">
                            {pathInputText}
                          </p>
                        )}
                      </div>
                      {hasData && (
                        <ChevronUp
                          className={`h-3 w-3 text-wb-30 shrink-0 mt-0.5 transition-transform ${expanded ? '' : 'rotate-180'}`}
                        />
                      )}
                    </button>
                    {!hasData && (
                      <div className="px-2 py-1 border-t border-wb-10">
                        {p === 'bm25' ? (
                          <p className="text-[10px] text-amber-600">
                            關鍵字搜尋無匹配（需完整詞彙命中，中文常見）
                          </p>
                        ) : (
                          <p className="text-[10px] text-wb-30">
                            向量搜尋無結果（分數未達門檻或無相關文件）
                          </p>
                        )}
                      </div>
                    )}
                    {expanded && docs && docs.length > 0 && (
                      <div className="border-t border-wb-10 px-2 py-1.5">
                        <p className="text-[9px] text-wb-25 mb-1">
                          {p === 'bm25'
                            ? 'BM25 相關分（越高越匹配關鍵字）'
                            : '向量餘弦相似度（0–1，越高越相關）'}
                        </p>
                        <div className="space-y-0.5">
                          {docs.map((doc, i) => (
                            <div key={doc.id} className="flex items-center gap-1.5 text-[10px]">
                              <span className="shrink-0 text-wb-30 tabular-nums w-4">{i + 1}.</span>
                              <span className="flex-1 text-wb-70 truncate">
                                {doc.name ?? doc.id}
                              </span>
                              <span
                                className={`shrink-0 font-mono tabular-nums ${doc.score >= 0.5 ? 'text-emerald-600' : doc.score >= 0.2 ? 'text-amber-600' : 'text-wb-40'}`}
                              >
                                {doc.score.toFixed(3)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="text-[11px] text-wb-40">無路徑資料（舊記錄或 trace 不完整）</p>
            )}
          </div>
        </StageSection>
        <StageSection type="output">
          <OutputPathList r={r} totalRaw={totalRaw} pathColor={pathColor} />
        </StageSection>
      </IOFlow>
    </div>
  )
}
