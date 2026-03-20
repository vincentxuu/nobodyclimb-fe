'use client'

import { Clock } from 'lucide-react'
import type { AILogDetail } from '@/lib/api/admin-ai'

export function LatencyBreakdown({ latency }: { latency: AILogDetail['latency'] }) {
  const { total_ms, embedding_ms, retrieval_ms, generation_ms } = latency
  if (total_ms == null) return null

  const other =
    total_ms - (embedding_ms ?? 0) - (retrieval_ms ?? 0) - (generation_ms ?? 0)

  const bars: { label: string; ms: number | null; color: string }[] = [
    { label: '嵌入', ms: embedding_ms, color: 'bg-blue-400' },
    { label: '檢索', ms: retrieval_ms, color: 'bg-purple-400' },
    { label: '生成', ms: generation_ms, color: 'bg-emerald-400' },
    { label: '其他', ms: other > 0 ? other : null, color: 'bg-wb-30' },
  ]

  return (
    <div className="rounded-xl border border-wb-20 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-wb-100">延遲分解</h2>
      <div className="mb-3 flex h-4 w-full overflow-hidden rounded-full bg-wb-10">
        {bars.map(({ label, ms, color }) =>
          ms && ms > 0 ? (
            <div
              key={label}
              className={`${color} transition-all`}
              style={{ width: `${(ms / total_ms) * 100}%` }}
              title={`${label}: ${ms} ms`}
            />
          ) : null
        )}
      </div>
      <div className="flex flex-wrap gap-4">
        {bars.map(({ label, ms, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-sm ${color}`} />
            <span className="text-xs text-wb-60">{label}</span>
            <span className="text-xs font-medium tabular-nums text-wb-80">{ms != null && ms > 0 ? `${ms} ms` : '—'}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-wb-50" />
          <span className="text-xs text-wb-60">總計</span>
          <span className="text-xs font-semibold tabular-nums text-wb-100">{total_ms} ms</span>
        </div>
      </div>
    </div>
  )
}
