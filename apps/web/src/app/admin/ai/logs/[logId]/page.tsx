'use client'

import { ArrowLeft, Clock, Loader2, ThumbsUp, User } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'
import { CostAnalysisCard } from '@/components/admin/ai-log-detail/cost-analysis'
import { DecisionNarrative } from '@/components/admin/ai-log-detail/decision-narrative'
import { LatencyBreakdown } from '@/components/admin/ai-log-detail/latency-breakdown'

import { PipelineTimeline } from '@/components/admin/ai-log-detail/pipeline-timeline'
import { QualitySection } from '@/components/admin/ai-log-detail/quality-section'
import { MarkdownContent } from '@/components/ai/ChatMessage'
import { useAILogDetail } from '@/lib/api/admin-ai'
import { formatTaipei } from '@/lib/utils'

export default function AdminAILogDetailPage({ params }: { params: Promise<{ logId: string }> }) {
  const { logId } = use(params)
  const { data: log, isLoading, error } = useAILogDetail(logId)

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-wb-50" />
      </div>
    )
  }

  if (error || !log) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        找不到此日誌記錄
      </div>
    )
  }

  const isCacheHit = log.pipeline?.cache?.hit
  const sources = Array.isArray(log.sources) ? log.sources : []

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 麵包屑 */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/ai/logs"
          className="flex items-center gap-1 text-sm text-wb-70 hover:text-wb-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回日誌
        </Link>
        <span className="text-wb-30">/</span>
        <span className="text-sm text-wb-100 font-medium">日誌詳情</span>
        {isCacheHit && (
          <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-600">
            快取命中
          </span>
        )}
      </div>

      {/* 頂部統計 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-wb-20 bg-white p-4 flex items-center gap-3">
          <User className="h-5 w-5 text-wb-50" />
          <div className="min-w-0">
            <p className="text-xs text-wb-50">使用者</p>
            {log.user?.id ? (
              <p
                className="font-medium text-wb-100 truncate"
                title={log.user.username ?? undefined}
              >
                {log.user.display_name || log.user.username}
              </p>
            ) : (
              <p className="text-sm text-wb-40">匿名</p>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-wb-20 bg-white p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-wb-50" />
          <div>
            <p className="text-xs text-wb-50">總延遲</p>
            <p className="font-semibold text-wb-100">
              {log.latency?.total_ms != null ? `${log.latency.total_ms} ms` : '—'}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-wb-20 bg-white p-4 flex items-center gap-3">
          <ThumbsUp className="h-5 w-5 text-wb-50" />
          <div>
            <p className="text-xs text-wb-50">時間</p>
            <p className="text-sm font-medium text-wb-100">{formatTaipei(log.created_at)}</p>
          </div>
        </div>
      </div>

      {/* 費用分析 */}
      {log.pipeline_trace?.token_breakdown && (
        <CostAnalysisCard pipelineTrace={log.pipeline_trace} />
      )}

      {/* 決策敘事摘要 */}
      {log.pipeline && (
        <DecisionNarrative
          pipeline={log.pipeline}
          pipelineTrace={log.pipeline_trace}
          latency={log.latency}
        />
      )}

      {/* 查詢內容 */}
      <div className="rounded-xl border border-wb-20 bg-white p-5">
        <h2 className="mb-2 text-sm font-semibold text-wb-100">使用者查詢</h2>
        <p className="text-sm text-wb-80 leading-relaxed">{log.query}</p>
      </div>

      {/* Pipeline 流程 */}
      {log.pipeline && (
        <PipelineTimeline
          pipeline={log.pipeline}
          pipelineTrace={log.pipeline_trace}
          query={log.query}
          response={log.response}
          sources={sources}
        />
      )}

      {/* 延遲分解 */}
      {!isCacheHit && log.latency && <LatencyBreakdown latency={log.latency} />}

      {/* 品質評估 */}
      {log.quality && <QualitySection quality={log.quality} />}

      {/* AI 回應 */}
      {log.response && (
        <div className="rounded-xl border border-wb-20 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold text-wb-100">AI 回答</h2>
          <div className="text-sm text-wb-80 leading-relaxed">
            <MarkdownContent text={log.response} />
          </div>
        </div>
      )}

      {/* 來源 */}
      {sources.length > 0 && (
        <div className="rounded-xl border border-wb-20 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-wb-100">參考來源（{sources.length}）</h2>
          <div className="divide-y divide-wb-10">
            {sources.map((s, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="shrink-0 rounded-md border border-wb-20 px-1.5 py-0.5 text-[10px] text-wb-60">
                  {s.type}
                </span>
                <span className="flex-1 text-wb-80">{s.title}</span>
                {s.score != null && (
                  <span className="text-xs text-wb-50">{(s.score * 100).toFixed(1)}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-wb-40">ID: {log.id}</p>
    </div>
  )
}
