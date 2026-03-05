'use client'

import { use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  Clock,
  MessageSquare,
  ThumbsUp,
  User,
  CheckCircle2,
  AlertCircle,
  Zap,
  Database,
  Search,
  Cpu,
  RefreshCw,
  Shield,
  Brain,
  FileText,
  Archive,
} from 'lucide-react'
import { useAILogDetail, type AILogDetail } from '@/lib/api/admin-ai'

// =============================================
// Sub-components
// =============================================

function StatusBadge({ status }: { status: 'ran' | 'skipped' | 'hit' | 'triggered' | 'not-triggered' }) {
  const map = {
    ran: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    skipped: 'bg-wb-10 text-wb-40 border-wb-20',
    hit: 'bg-sky-50 text-sky-600 border-sky-200',
    triggered: 'bg-violet-50 text-violet-600 border-violet-200',
    'not-triggered': 'bg-wb-10 text-wb-50 border-wb-20',
  }
  const label = {
    ran: '已執行',
    skipped: '已跳過',
    hit: '命中',
    triggered: '已觸發',
    'not-triggered': '未觸發',
  }
  return (
    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${map[status]}`}>
      {label[status]}
    </span>
  )
}

function StageIcon({ name, skipped }: { name: string; skipped: boolean }) {
  const cls = `h-4 w-4 ${skipped ? 'text-wb-30' : 'text-wb-70'}`
  const icons: Record<string, React.ReactNode> = {
    guardrails_input: <Shield className={cls} />,
    cache: <Zap className={cls} />,
    quota_check: <Database className={cls} />,
    query_parsing: <MessageSquare className={cls} />,
    hyde: <Brain className={cls} />,
    embedding: <Cpu className={cls} />,
    retrieval: <Search className={cls} />,
    generation: <FileText className={cls} />,
    self_reflection: <RefreshCw className={cls} />,
    judge: <CheckCircle2 className={cls} />,
    guardrails_output: <Shield className={cls} />,
    memory_extraction: <Archive className={cls} />,
  }
  return <>{icons[name] ?? <AlertCircle className={cls} />}</>
}

const STAGE_LABELS: Record<string, string> = {
  guardrails_input: '輸入護欄',
  cache: '快取查詢',
  quota_check: '配額檢查',
  query_parsing: '查詢解析',
  hyde: 'HyDE 假設文件',
  embedding: '向量嵌入',
  retrieval: '向量檢索',
  generation: 'LLM 生成',
  self_reflection: 'Judge 驅動重生成',
  judge: '品質評判',
  guardrails_output: '輸出護欄',
  memory_extraction: '記憶萃取',
}

type PipelineKey = keyof AILogDetail['pipeline']

function PipelineTimeline({ pipeline }: { pipeline: AILogDetail['pipeline'] }) {
  const stages: PipelineKey[] = [
    'guardrails_input',
    'cache',
    'quota_check',
    'query_parsing',
    'hyde',
    'embedding',
    'retrieval',
    'generation',
    'self_reflection',
    'judge',
    'guardrails_output',
    'memory_extraction',
  ]

  return (
    <div className="rounded-xl border border-wb-20 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-wb-100">RAG Pipeline 流程</h2>
      <div className="space-y-0">
        {stages.map((key, idx) => {
          const stage = pipeline[key] as unknown as Record<string, unknown>
          const skipped = Boolean(stage.skipped)
          const isLast = idx === stages.length - 1

          // Determine status badge
          let status: 'ran' | 'skipped' | 'hit' | 'triggered' | 'not-triggered' = 'ran'
          if (skipped) status = 'skipped'
          else if (key === 'cache' && 'hit' in stage) status = stage.hit ? 'hit' : 'ran'
          else if ((key === 'hyde' || key === 'self_reflection') && 'triggered' in stage)
            status = stage.triggered ? 'triggered' : 'not-triggered'

          // Build metrics pills
          const metrics: { label: string; value: string; highlight?: boolean }[] = []

          if (!skipped) {
            if (key === 'query_parsing' && stage.query_type) {
              const qmap: Record<string, string> = { simple: '簡單', complex: '複雜', 'general-knowledge': '通識' }
              metrics.push({ label: '類型', value: qmap[stage.query_type as string] ?? String(stage.query_type) })
            }
            if ((key === 'embedding' || key === 'retrieval' || key === 'generation') && stage.duration_ms != null) {
              metrics.push({ label: '耗時', value: `${stage.duration_ms} ms` })
            }
            if (key === 'retrieval') {
              if (stage.top_score != null) metrics.push({ label: '最高分', value: `${((stage.top_score as number) * 100).toFixed(1)}%` })
              if (stage.doc_count != null) metrics.push({ label: '文件', value: `${stage.doc_count} 筆` })
            }
            if (key === 'generation') {
              if (stage.model) metrics.push({ label: '模型', value: String(stage.model).split('/').pop() ?? '' })
              if (stage.token_count != null) metrics.push({ label: 'Tokens', value: String(stage.token_count) })
              if (stage.is_high_consumption) metrics.push({ label: '高消耗', value: '!', highlight: true })
            }
            if (key === 'judge') {
              if (stage.groundedness_score != null)
                metrics.push({ label: 'Groundedness', value: `${((stage.groundedness_score as number) * 100).toFixed(0)}%` })
              if (stage.auto_score != null)
                metrics.push({ label: 'Auto', value: `${stage.auto_score} / 4` })
            }
          }

          return (
            <div key={key} className="flex gap-3">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 mt-2 ${
                  skipped
                    ? 'border-wb-15 bg-wb-5'
                    : key === 'cache' && stage.hit
                      ? 'border-sky-300 bg-sky-50'
                      : 'border-wb-30 bg-white'
                }`}>
                  <StageIcon name={key} skipped={skipped} />
                </div>
                {!isLast && (
                  <div className={`w-px flex-1 my-1 ${skipped ? 'bg-wb-10' : 'bg-wb-20'}`} style={{ minHeight: 16 }} />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 pb-4 pt-1.5 ${isLast ? '' : ''}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm font-medium ${skipped ? 'text-wb-40' : 'text-wb-90'}`}>
                    {STAGE_LABELS[key] ?? key}
                  </span>
                  <StatusBadge status={status} />
                  {metrics.map((m) => (
                    <span
                      key={m.label}
                      className={`rounded border px-1.5 py-0.5 text-[11px] tabular-nums ${
                        m.highlight
                          ? 'border-red-200 bg-red-50 text-red-600'
                          : 'border-wb-15 bg-wb-5 text-wb-60'
                      }`}
                    >
                      {m.label}: {m.value}
                    </span>
                  ))}
                </div>
                {!!stage.service && (
                  <p className={`mt-0.5 text-[11px] font-mono ${skipped ? 'text-wb-30' : 'text-wb-50'}`}>
                    {stage.service as string}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LatencyBreakdown({ latency }: { latency: AILogDetail['latency'] }) {
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

function QualitySection({ quality }: { quality: AILogDetail['quality'] }) {
  const { groundedness_score, auto_score, feedback_score, feedback_text, flags } = quality

  return (
    <div className="rounded-xl border border-wb-20 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-wb-100">品質評估</h2>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-[11px] text-wb-50 mb-1">Groundedness</p>
          {groundedness_score != null ? (
            <p className={`text-lg font-bold tabular-nums ${groundedness_score >= 0.7 ? 'text-emerald-600' : groundedness_score >= 0.5 ? 'text-yellow-600' : 'text-red-500'}`}>
              {(groundedness_score * 100).toFixed(0)}%
            </p>
          ) : (
            <p className="text-wb-40 text-lg">—</p>
          )}
        </div>
        <div className="text-center border-x border-wb-10">
          <p className="text-[11px] text-wb-50 mb-1">Auto 評分</p>
          {auto_score != null ? (
            <p className={`text-lg font-bold tabular-nums ${auto_score >= 3 ? 'text-emerald-600' : auto_score >= 2 ? 'text-yellow-600' : 'text-red-500'}`}>
              {auto_score} / 4
            </p>
          ) : (
            <p className="text-wb-40 text-lg">—</p>
          )}
        </div>
        <div className="text-center">
          <p className="text-[11px] text-wb-50 mb-1">使用者回饋</p>
          {feedback_score != null ? (
            <p className={`text-lg font-bold tabular-nums ${feedback_score >= 4 ? 'text-emerald-600' : feedback_score >= 3 ? 'text-yellow-600' : 'text-red-500'}`}>
              {feedback_score} / 5
            </p>
          ) : (
            <p className="text-wb-40 text-lg">—</p>
          )}
        </div>
      </div>

      {feedback_text && (
        <div className="mb-3 rounded-lg bg-wb-5 px-4 py-3">
          <p className="text-xs text-wb-50 mb-1">回饋文字</p>
          <p className="text-sm text-wb-80">{feedback_text}</p>
        </div>
      )}

      {(flags?.length ?? 0) > 0 && (
        <div className="space-y-1.5">
          {flags.map((f, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <div>
                <span className="text-xs font-medium text-amber-700">{f.type}</span>
                <p className="text-xs text-amber-600">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {(flags?.length ?? 0) === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-xs text-emerald-700">無品質告警</span>
        </div>
      )}
    </div>
  )
}

// =============================================
// Main Page
// =============================================

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
              <p className="font-medium text-wb-100 truncate" title={log.user.username ?? undefined}>
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
            <p className="text-sm font-medium text-wb-100">{new Date(log.created_at).toLocaleString('zh-TW')}</p>
          </div>
        </div>
      </div>

      {/* 查詢內容 */}
      <div className="rounded-xl border border-wb-20 bg-white p-5">
        <h2 className="mb-2 text-sm font-semibold text-wb-100">使用者查詢</h2>
        <p className="text-sm text-wb-80 leading-relaxed">{log.query}</p>
      </div>

      {/* Pipeline 流程 */}
      {log.pipeline && <PipelineTimeline pipeline={log.pipeline} />}

      {/* 延遲分解 */}
      {!isCacheHit && log.latency && <LatencyBreakdown latency={log.latency} />}

      {/* 品質評估 */}
      {log.quality && <QualitySection quality={log.quality} />}

      {/* AI 回應 */}
      {log.response && (
        <div className="rounded-xl border border-wb-20 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold text-wb-100">AI 回答</h2>
          <p className="text-sm text-wb-80 leading-relaxed whitespace-pre-wrap">{log.response}</p>
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
