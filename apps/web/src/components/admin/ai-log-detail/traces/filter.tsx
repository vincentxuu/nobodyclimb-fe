'use client'

import { StageDesc, StageSection, IOFlow, TraceBadge, KVRow } from '../shared'
import type { PipelineTrace } from '../types'

export function FilterTrace({ trace }: { trace: PipelineTrace | null; pipelineStage: Record<string, unknown> | null }) {
  const f = trace?.filter
  const qp = trace?.query_parsing

  if (!f) return (
    <div>
      <StageDesc>將 query_parsing 抽取的結構化 params 轉換為 Vectorize 向量資料庫的 Metadata Filter，在向量搜尋時限縮候選範圍。支援 LLM 解析（llm_parsed）、Regex 降級（regex_fallback）、相似路線（sim_route）與對話歷史補充（history_supplemented）等來源。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <p className="text-wb-40">來自 query_parsing 抽取的 params</p>
      </StageSection>
      <StageSection type="decision">
        <p className="text-wb-40">無詳細資料（舊記錄或快取命中）</p>
      </StageSection>
      <StageSection type="output">
        <p className="text-wb-40">無套用 Filter（general-knowledge 或無結構化參數）</p>
      </StageSection>
    </IOFlow>
    </div>
  )

  const sourceColors: Record<string, 'emerald' | 'blue' | 'amber' | 'violet'> = {
    llm_parsed: 'emerald',
    regex_fallback: 'amber',
    sim_route: 'blue',
    history_supplemented: 'violet',
  }
  const params = qp?.params ?? {}
  const matchedTexts = f.matched_texts ?? {}
  const resolvedIds = f.resolved_ids ?? {}

  return (
    <div>
      <StageDesc>將 query_parsing 抽取的結構化 params 轉換為 Vectorize 向量資料庫的 Metadata Filter，在向量搜尋時限縮候選範圍。支援 LLM 解析（llm_parsed）、Regex 降級（regex_fallback）、相似路線（sim_route）與對話歷史補充（history_supplemented）等來源。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <div className="space-y-1">
          <KVRow label="觸發條件" value="tool = search_routes / search_crags 且 query_parsing 抽取到結構化 params；通識問答跳過" />
          <p className="text-wb-40 text-[10px] mt-0.5">LLM 抽取 Params（來自 query_parsing）：</p>
          {Object.keys(params).length > 0 ? (
            Object.entries(params).map(([k, v]) => (
              <KVRow key={k} label={k} value={JSON.stringify(v)} />
            ))
          ) : (
            <p className="text-wb-40">無結構化 params</p>
          )}
        </div>
      </StageSection>
      <StageSection type="decision">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-wb-40">Filter 來源：</span>
            <TraceBadge text={f.source} color={sourceColors[f.source] ?? 'default'} />
            {f.source === 'regex_fallback' && <span className="text-wb-50">LLM 解析失敗，降級為 Regex</span>}
          </div>
          {f.history_supplemented && (
            <div className="flex items-center gap-2">
              <TraceBadge text="對話歷史補充位置" color="violet" />
              <span className="text-wb-50">query 含指代詞，從近期對話補充 crag/region</span>
            </div>
          )}
          {Object.keys(matchedTexts).length > 0 && (
            <div>
              <p className="text-wb-40 mb-1">觸發各欄位的原始文字：</p>
              <div className="space-y-0.5">
                {Object.entries(matchedTexts).map(([field, text]) => (
                  <div key={field} className="flex items-start gap-2">
                    <TraceBadge text={field} color="blue" />
                    <span className="text-wb-70 italic">&ldquo;{text}&rdquo;</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Object.keys(resolvedIds).length > 0 && (
            <div>
              <p className="text-wb-40 mb-1">DB 解析出的 ID：</p>
              <div className="space-y-0.5">
                {Object.entries(resolvedIds).map(([key, val]) => (
                  <KVRow key={key} label={key} value={Array.isArray(val) ? val.join(', ') : String(val ?? '—')} />
                ))}
              </div>
            </div>
          )}
        </div>
      </StageSection>
      <StageSection type="output">
        <div className="space-y-1">
          <p className="text-wb-40 text-[10px]">最終 Vectorize metadata filter：</p>
          <pre className="font-mono text-wb-70 bg-wb-5 rounded px-2 py-1.5 overflow-auto max-h-32 text-[10px]">
            {JSON.stringify(f.applied, null, 2)}
          </pre>
        </div>
      </StageSection>
    </IOFlow>
    </div>
  )
}
