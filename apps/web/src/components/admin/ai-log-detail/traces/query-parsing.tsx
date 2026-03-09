'use client'

import { StageDesc, StageSection, IOFlow, TraceBadge, KVRow } from '../shared'
import type { PipelineTrace } from '../types'

export function QueryParsingTrace({
  trace,
  query,
}: {
  trace: PipelineTrace
  query: string
}) {
  const qp = trace.query_parsing
  const f = trace.filter

  const toolColors: Record<string, 'blue' | 'violet' | 'emerald' | 'amber' | 'default'> = {
    search_routes: 'blue',
    search_crags: 'violet',
    general_knowledge: 'emerald',
    search_sql: 'amber',
    hybrid: 'default',
    multi_tool: 'default',
  }
  const queryTypeColors: Record<string, 'blue' | 'violet' | 'emerald' | 'amber' | 'default'> = {
    simple: 'blue',
    complex: 'violet',
    'general-knowledge': 'emerald',
    sql: 'amber',
    'multi-tool': 'default',
  }
  const alternatives = qp?.alternatives ?? ['search_routes', 'search_crags', 'general_knowledge']
  const ts = trace.tool_selection

  return (
    <div>
      <StageDesc>使用 LLM 分析查詢意圖，決定呼叫哪個搜尋工具（路線搜尋 / 岩場搜尋 / 通識問答），同時抽取結構化過濾條件（地區、難度、路線類型等）。是後續 Metadata Filter 建構與搜尋策略（HyDE、Multi-Query、Agentic）選擇的依據。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <KVRow label="觸發條件" value="所有非快取查詢必經；輸出 tool / query_type / params 決定後續 Pipeline 路徑" />
        <p className="italic text-wb-60 line-clamp-2 mt-1">{query}</p>
      </StageSection>
      <StageSection type="decision">
        {qp ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-wb-40">工具選擇：</span>
              <div className="flex flex-wrap gap-1">
                {alternatives.map((alt) => (
                  <TraceBadge
                    key={alt}
                    text={alt === qp.tool ? `✓ ${alt}` : alt}
                    color={alt === qp.tool ? toolColors[alt] ?? 'blue' : 'default'}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-wb-40">查詢類型：</span>
              <TraceBadge
                text={qp.query_type}
                color={queryTypeColors[qp.query_type] ?? 'default'}
              />
            </div>
            {ts && (
              <div className="flex items-center gap-2">
                <span className="text-wb-40">信心分數：</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-20 rounded-full bg-wb-10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${ts.confidence >= 0.8 ? 'bg-emerald-500' : ts.confidence >= 0.5 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${(ts.confidence * 100).toFixed(0)}%` }}
                    />
                  </div>
                  <span className="text-[11px] tabular-nums font-medium">{(ts.confidence * 100).toFixed(0)}%</span>
                </div>
                {ts.alternative && (
                  <span className="text-[10px] text-wb-40">備選：<TraceBadge text={ts.alternative} color="default" /></span>
                )}
              </div>
            )}
            {qp.retrieval_method && qp.retrieval_method !== 'hybrid' && (
              <div className="flex items-center gap-2">
                <span className="text-wb-40">檢索方法：</span>
                <TraceBadge
                  text={qp.retrieval_method === 'bm25' ? 'BM25（精確匹配）' : qp.retrieval_method === 'vector' ? 'Vector（語意搜尋）' : qp.retrieval_method}
                  color={qp.retrieval_method === 'bm25' ? 'amber' : 'blue'}
                />
              </div>
            )}
            {Object.keys(qp.params).length > 0 && (
              <div>
                <p className="text-wb-40 mb-1">LLM 抽取 Params：</p>
                <div className="space-y-0.5">
                  {Object.entries(qp.params).map(([k, v]) => (
                    <KVRow key={k} label={k} value={JSON.stringify(v)} />
                  ))}
                </div>
              </div>
            )}
            {ts?.fallback?.triggered && (
              <div className="flex items-center gap-2 mt-1 rounded border border-amber-200 bg-amber-50/60 px-2 py-1">
                <TraceBadge text="Fallback 觸發" color="amber" />
                <span className="text-[10px] text-wb-60">{ts.fallback.from_tool} → {ts.fallback.to_tool}（{ts.fallback.reason}）</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-wb-40">無詳細 trace 資料（舊記錄）</p>
        )}
      </StageSection>
      <StageSection type="output">
        {f ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-wb-40">Filter 來源：</span>
              <TraceBadge
                text={f.source}
                color={f.source === 'llm_parsed' ? 'emerald' : f.source === 'sim_route' ? 'blue' : 'amber'}
              />
            </div>
            {f?.history_supplemented && (
              <div className="flex items-center gap-2 mt-1">
                <TraceBadge text="從對話歷史補充位置" color="amber" />
                <span className="text-wb-50">query 含指代詞，位置從近期對話記錄中提取</span>
              </div>
            )}
            <pre className="font-mono text-wb-70 bg-wb-5 rounded px-2 py-1.5 overflow-auto max-h-24 text-[10px]">
              {JSON.stringify(f.applied, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-wb-40">無 Filter 套用（general-knowledge 或無結構化參數）</p>
        )}
      </StageSection>
    </IOFlow>
    </div>
  )
}
