'use client'

import type { AILogDetail } from '@/lib/api/admin-ai'
import { ensureArray } from './types'

export function DecisionNarrative({
  pipeline,
  pipelineTrace,
  latency,
}: {
  pipeline: AILogDetail['pipeline']
  pipelineTrace: AILogDetail['pipeline_trace']
  latency: AILogDetail['latency']
}) {
  const pt = pipelineTrace
  const isCacheHit = pipeline?.cache?.hit
  const cacheType = pt?.cache?.type

  const parts: string[] = []

  if (isCacheHit) {
    if (cacheType === 'semantic') {
      parts.push('語義快取命中 → 直接回傳')
    } else {
      parts.push('KV 快取命中 → 直接回傳')
    }
    if (latency.total_ms != null) parts.push(`${latency.total_ms} ms`)
    return (
      <div className="rounded-xl border border-sky-200 bg-sky-50/60 px-4 py-3">
        <p className="text-[11px] font-medium text-sky-700 font-mono">{parts.join(' → ')}</p>
      </div>
    )
  }

  const queryType = pipeline?.query_parsing?.query_type
  const queryTypeMap: Record<string, string> = {
    simple: '簡單查詢',
    complex: '複雜查詢',
    'general-knowledge': '通識查詢',
  }

  if (queryType === 'general-knowledge') {
    parts.push(queryTypeMap[queryType])
    parts.push('跳過向量搜尋')
    parts.push('LLM 直接生成')
    if (latency.total_ms != null) parts.push(`${latency.total_ms} ms`)
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
        <p className="text-[11px] font-medium text-emerald-700 font-mono">{parts.join(' → ')}</p>
      </div>
    )
  }

  if (queryType) parts.push(queryTypeMap[queryType] ?? queryType)

  const filterMatchedTexts = pt?.filter?.matched_texts
  if (filterMatchedTexts && Object.keys(filterMatchedTexts).length > 0) {
    const keywords = Object.values(filterMatchedTexts).slice(0, 2).join('/')
    parts.push(`filter:${keywords}`)
  }

  const retrieval = pt?.retrieval
  const retrievalPaths = ensureArray<string>(retrieval?.paths)
  if (retrievalPaths.length > 0) {
    parts.push(`${retrievalPaths.length}路搜尋`)
  }

  if (retrieval?.rrf) {
    parts.push(`${retrieval.rrf.merged_count}→${retrieval.rrf.after_threshold_count}筆`)
  }

  if (retrieval?.crag_fallback) {
    const retries = retrieval.crag_fallback_detail?.retries?.length ?? 0
    parts.push(`CRAG放寬${retries > 0 ? `×${retries}` : ''}`)
  }

  if (retrieval?.reranker?.top_scores) {
    parts.push('cross-encoder重排')
  }

  const mmr = pt?.mmr_selection
  if (mmr) {
    parts.push(`MMR(${mmr.selected_count}筆)`)
  }

  const judgeQuality = pipeline?.judge?.auto_score
  const judgeGroundedness = pipeline?.judge?.groundedness_score
  if (judgeQuality != null) parts.push(`Quality ${judgeQuality}/4`)

  const sr = pipeline?.self_reflection
  if (sr?.triggered) {
    const acceptReason = pt?.self_reflection?.acceptance_reason
    parts.push(acceptReason === 'regen_accepted' ? '觸發regen(採用)' : '觸發regen(保留原始)')
  }

  if (judgeGroundedness != null) {
    parts.push(`groundedness ${(judgeGroundedness * 100).toFixed(0)}%`)
  }

  if (latency.total_ms != null) parts.push(`${latency.total_ms} ms`)

  if (parts.length === 0) return null

  return (
    <div className="rounded-xl border border-wb-20 bg-wb-3 px-4 py-3">
      <p className="text-[10px] text-wb-40 mb-1 uppercase tracking-wide font-semibold">決策摘要</p>
      <p className="text-[11px] font-medium text-wb-70 font-mono leading-relaxed">
        {parts.join(' → ')}
      </p>
    </div>
  )
}
