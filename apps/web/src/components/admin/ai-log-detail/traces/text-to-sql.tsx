'use client'

import { StageSection, StageDesc, IOFlow, TraceBadge } from '../shared'
import type { PipelineTrace } from '../types'

const ROUTE_TYPE_LABELS: Record<string, string> = {
  sport: '運攀',
  trad: '傳攀',
  boulder: '抱石',
  mixed: '混合攀登',
}

export function TextToSqlTrace({ trace }: { trace: PipelineTrace }) {
  const info = trace.text_to_sql
  if (!info) {
    return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
  }

  const candidates = info.candidates ?? []

  return (
    <div>
      <StageDesc>
        Text-to-SQL 先轉成 SQL 候選，再將預選路線組成 context 供 Hybrid/SQL 查詢生成回答。
      </StageDesc>
      <IOFlow>
        <StageSection type="input">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-wb-40">
              <span>路徑</span>
              {info.path ? (
                <TraceBadge text={info.path === 'hybrid' ? 'Hybrid 候選' : info.path} color="violet" />
              ) : (
                <span className="text-wb-50">—</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-wb-40">
              <span>候選數</span>
              <span className="text-wb-80 font-mono">{info.candidate_count ?? 0} 筆</span>
            </div>
            {info.context_preview && (
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-wb-50">Context 摘要</p>
                <pre className="rounded-lg border border-wb-10 bg-wb-05 p-2 text-[10px] text-wb-50 whitespace-pre-wrap break-words">
                  {info.context_preview}
                </pre>
              </div>
            )}
          </div>
        </StageSection>
        {candidates.length > 0 && (
          <StageSection type="output">
            <div className="space-y-3">
              {candidates.map((candidate, idx) => (
                <div key={`${candidate.name ?? 'route'}-${idx}`} className="rounded-xl border border-wb-10 bg-wb-05 p-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium text-wb-100">{candidate.name ?? '未命名路線'}</p>
                    <span className="text-[11px] text-wb-50">
                      {candidate.grade ?? '？'}
                      {candidate.route_type ? ` ・ ${ROUTE_TYPE_LABELS[candidate.route_type] ?? candidate.route_type}` : ''}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-wb-50">
                    {candidate.crag_name && <span>岩場：{candidate.crag_name}</span>}
                    {candidate.bolt_count != null && <span>bolt：{candidate.bolt_count}</span>}
                    {candidate.height != null && <span>高度：{candidate.height}m</span>}
                  </div>
                  {candidate.description && (
                    <p className="mt-2 text-[11px] text-wb-60 whitespace-pre-wrap">{candidate.description}</p>
                  )}
                </div>
              ))}
            </div>
          </StageSection>
        )}
      </IOFlow>
    </div>
  )
}
