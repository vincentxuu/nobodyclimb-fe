'use client'

import { useState, useCallback, useRef } from 'react'
import { parseUTC, todayTaipei } from '@/lib/utils'
import { Link } from '@/i18n/navigation'
import {
  Loader2, ChevronLeft, ChevronRight, Download, Search, X,
  Zap, Brain, SlidersHorizontal,
} from 'lucide-react'
import { useAILogs, type AIQueryLog } from '@/lib/api/admin-ai'

// =============================================
// Badge 元件
// =============================================

const QUERY_TYPE_MAP: Record<string, { label: string; cls: string; icon?: React.ReactNode }> = {
  simple: { label: '簡單', cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  complex: { label: '複雜', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  'general-knowledge': { label: '通識', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  guardrails_blocked: { label: '攔截', cls: 'bg-red-50 text-red-700 border-red-200' },
  pipeline_timeout: { label: '超時', cls: 'bg-red-50 text-red-600 border-red-200' },
  circuit_breaker_rejected: { label: '熔斷', cls: 'bg-red-50 text-red-700 border-red-200' },
}

function QueryTypeBadge({ type }: { type: AIQueryLog['query_type'] }) {
  if (!type) return null
  const cfg = QUERY_TYPE_MAP[type] ?? { label: type, cls: 'bg-wb-10 text-wb-60 border-wb-20' }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cfg.cls}`}>
      {type === 'guardrails_blocked' && '🚫 '}
      {type === 'pipeline_timeout' && '⏱ '}
      {type === 'circuit_breaker_rejected' && '⚡ '}
      {cfg.label}
    </span>
  )
}

function GroundednessBar({ score }: { score: number | null }) {
  if (score == null) return <span className="text-wb-30 text-xs">—</span>
  const pct = Math.round(score * 100)
  const color = score >= 0.7 ? 'bg-emerald-500' : score >= 0.5 ? 'bg-amber-400' : 'bg-red-400'
  const textColor = score >= 0.7 ? 'text-emerald-600' : score >= 0.5 ? 'text-amber-600' : 'text-red-500'
  return (
    <div className="flex items-center gap-1.5 min-w-[60px]">
      <div className="h-1.5 w-10 rounded-full bg-wb-15 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[11px] font-medium tabular-nums ${textColor}`}>{pct}%</span>
    </div>
  )
}

function AutoScoreDots({ score }: { score: number | null }) {
  if (score == null) return <span className="text-wb-30 text-xs">—</span>
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4].map((v) => (
        <div
          key={v}
          className={`h-2 w-2 rounded-full ${v <= score ? (score >= 3 ? 'bg-emerald-500' : score >= 2 ? 'bg-amber-400' : 'bg-red-400') : 'bg-wb-15'}`}
        />
      ))}
      <span className="ml-1 text-[10px] text-wb-50 tabular-nums">{score}/4</span>
    </div>
  )
}

function TagChips({ log }: { log: AIQueryLog }) {
  return (
    <div className="flex flex-wrap gap-1">
      {!!log.cache_hit && (
        <span className="inline-flex items-center gap-0.5 rounded-full border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-600">
          <Zap className="h-2.5 w-2.5" />快取
        </span>
      )}
      {!!log.hyde_triggered && (
        <span className="inline-flex items-center gap-0.5 rounded-full border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-600">
          <Brain className="h-2.5 w-2.5" />HyDE
        </span>
      )}
      {!!log.is_high_consumption && (
        <span className="inline-flex items-center gap-0.5 rounded-full border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-600">
          高耗
        </span>
      )}
    </div>
  )
}

// =============================================
// 時間格式化
// =============================================

function formatTime(iso: string) {
  const d = parseUTC(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return '剛剛'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分前`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小時前`
  if (diff < 7 * 86400_000) return `${Math.floor(diff / 86400_000)} 天前`
  return d.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', timeZone: 'Asia/Taipei' })
}

function formatLatency(ms: number | null, cacheHit: number | null) {
  if (cacheHit) return { text: '快取', cls: 'text-sky-500' }
  if (ms == null) return { text: '—', cls: 'text-wb-30' }
  if (ms < 2000) return { text: `${ms}ms`, cls: 'text-emerald-600' }
  if (ms < 5000) return { text: `${(ms / 1000).toFixed(1)}s`, cls: 'text-amber-600' }
  return { text: `${(ms / 1000).toFixed(1)}s`, cls: 'text-red-500' }
}

// =============================================
// 桌面表格列
// =============================================

function TableRow({ log }: { log: AIQueryLog }) {
  const latency = formatLatency(log.latency_ms, log.cache_hit)
  return (
    <tr className="group hover:bg-wb-05 transition-colors">
      {/* 查詢內容 */}
      <td className="px-4 py-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-wb-90 max-w-xs">{log.query}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <QueryTypeBadge type={log.query_type} />
              <TagChips log={log} />
            </div>
          </div>
        </div>
      </td>
      {/* 使用者 */}
      <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
        {log.user_id ? (
          <span className="text-sm text-wb-80">{log.display_name || log.username}</span>
        ) : (
          <span className="text-xs text-wb-30">匿名</span>
        )}
      </td>
      {/* Groundedness */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <GroundednessBar score={log.groundedness_score} />
      </td>
      {/* Auto Score */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <AutoScoreDots score={log.auto_score} />
      </td>
      {/* 回饋 */}
      <td className="px-4 py-3 hidden xl:table-cell">
        {log.feedback_score != null ? (
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((v) => (
              <div key={v} className={`h-2 w-2 rounded-full ${v <= log.feedback_score! ? 'bg-emerald-500' : 'bg-wb-15'}`} />
            ))}
          </div>
        ) : (
          <span className="text-wb-30 text-xs">—</span>
        )}
      </td>
      {/* 延遲 */}
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className={`text-xs font-mono tabular-nums ${latency.cls}`}>{latency.text}</span>
      </td>
      {/* 時間 */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-xs text-wb-40">{formatTime(log.created_at)}</span>
      </td>
      {/* 詳情 */}
      <td className="px-4 py-3 text-right">
        <Link
          href={`/admin/ai/logs/${log.id}`}
          className="text-xs text-wb-40 hover:text-wb-100 transition-colors opacity-0 group-hover:opacity-100"
        >
          詳情 →
        </Link>
      </td>
    </tr>
  )
}

// =============================================
// 手機卡片
// =============================================

function MobileCard({ log }: { log: AIQueryLog }) {
  const latency = formatLatency(log.latency_ms, log.cache_hit)
  return (
    <Link href={`/admin/ai/logs/${log.id}`} className="block">
      <div className="border-b border-wb-10 px-4 py-3.5 hover:bg-wb-05 transition-colors active:bg-wb-10">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-wb-90 line-clamp-2 leading-snug">{log.query}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <QueryTypeBadge type={log.query_type} />
              <TagChips log={log} />
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] text-wb-40">{formatTime(log.created_at)}</p>
            <p className={`mt-0.5 text-[11px] font-mono ${latency.cls}`}>{latency.text}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <GroundednessBar score={log.groundedness_score} />
          <AutoScoreDots score={log.auto_score} />
          {log.user_id && (
            <span className="text-[11px] text-wb-40 truncate">{log.display_name || log.username}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

// =============================================
// 篩選器
// =============================================

const inputCls = 'w-full rounded-lg border border-wb-20 bg-white px-3 py-2 text-sm text-wb-100 outline-none focus:border-wb-60 transition-colors placeholder:text-wb-30'
const selectCls = 'w-full rounded-lg border border-wb-20 bg-white px-3 py-2 text-sm text-wb-100 outline-none focus:border-wb-60 transition-colors'

type Filters = {
  search: string
  from: string
  to: string
  queryType: string
  feedbackMin: string
  feedbackMax: string
}

function FilterPanel({
  filters,
  onChange,
  onClear,
}: {
  filters: Filters
  onChange: (_key: keyof Filters, _value: string) => void
  onClear: () => void
}) {
  const hasFilter = Object.values(filters).some(Boolean)

  return (
    <div className="rounded-xl border border-wb-20 bg-white p-4 space-y-3">
      {/* 搜尋列 */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-wb-30" />
        <input
          type="text"
          placeholder="搜尋查詢內容…"
          value={filters.search}
          onChange={(e) => onChange('search', e.target.value)}
          className={`${inputCls} pl-8`}
        />
        {filters.search && (
          <button onClick={() => onChange('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-3.5 w-3.5 text-wb-30 hover:text-wb-80 transition-colors" />
          </button>
        )}
      </div>

      {/* 其他篩選 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-wb-40">開始日期</label>
          <input type="date" value={filters.from} onChange={(e) => onChange('from', e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-wb-40">結束日期</label>
          <input type="date" value={filters.to} onChange={(e) => onChange('to', e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-wb-40">查詢類型</label>
          <select value={filters.queryType} onChange={(e) => onChange('queryType', e.target.value)} className={selectCls}>
            <option value="">全部類型</option>
            <option value="simple">簡單</option>
            <option value="complex">複雜</option>
            <option value="general-knowledge">通識</option>
            <option value="guardrails_blocked">🚫 攔截</option>
            <option value="pipeline_timeout">⏱ 超時</option>
            <option value="circuit_breaker_rejected">⚡ 熔斷</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-wb-40">回饋最低</label>
          <select value={filters.feedbackMin} onChange={(e) => onChange('feedbackMin', e.target.value)} className={selectCls}>
            <option value="">不限</option>
            {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v} 星</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-wb-40">回饋最高</label>
          <select value={filters.feedbackMax} onChange={(e) => onChange('feedbackMax', e.target.value)} className={selectCls}>
            <option value="">不限</option>
            {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v} 星</option>)}
          </select>
        </div>
      </div>

      {hasFilter && (
        <div className="flex justify-end">
          <button onClick={onClear} className="flex items-center gap-1 text-xs text-wb-40 hover:text-wb-80 transition-colors">
            <X className="h-3 w-3" />清除全部篩選
          </button>
        </div>
      )}
    </div>
  )
}

// =============================================
// 分頁
// =============================================

function Pagination({ page, total, limit, onChange }: { page: number; total: number; limit: number; onChange: (_p: number) => void }) {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null

  // 最多顯示 5 個頁碼按鈕
  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs text-wb-40">共 {total} 筆 · 第 {page} / {totalPages} 頁</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-wb-20 bg-white text-wb-60 hover:bg-wb-10 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-xs text-wb-30">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p as number)}
                className={`h-8 min-w-[32px] rounded-lg border px-2 text-xs transition-colors ${
                  p === page
                    ? 'border-wb-80 bg-wb-100 font-medium text-white'
                    : 'border-wb-20 bg-white text-wb-60 hover:bg-wb-10'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-wb-20 bg-white text-wb-60 hover:bg-wb-10 disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// =============================================
// 主頁面
// =============================================

const LIMIT = 25

export default function AdminAILogsPage() {
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    search: '', from: '', to: '', queryType: '', feedbackMin: '', feedbackMax: '',
  })

  // debounce search
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const handleFilterChange = useCallback((key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
    if (key === 'search') {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
      searchTimerRef.current = setTimeout(() => setDebouncedSearch(value), 400)
    }
  }, [])

  const handleClear = useCallback(() => {
    setFilters({ search: '', from: '', to: '', queryType: '', feedbackMin: '', feedbackMax: '' })
    setDebouncedSearch('')
    setPage(1)
  }, [])

  const { data, isLoading } = useAILogs({
    page,
    limit: LIMIT,
    from: filters.from || undefined,
    to: filters.to || undefined,
    feedback_min: filters.feedbackMin ? parseInt(filters.feedbackMin) : undefined,
    feedback_max: filters.feedbackMax ? parseInt(filters.feedbackMax) : undefined,
    query_type: filters.queryType || undefined,
    search: debouncedSearch || undefined,
  })

  const handleExport = () => {
    if (!data?.logs.length) return
    const header = 'ID,使用者,查詢,類型,快取,延遲(ms),Groundedness,Auto評分,回饋,建立時間\n'
    const rows = data.logs
      .map((l) =>
        `"${l.id}","${l.display_name || l.username || '匿名'}","${l.query.replace(/"/g, '""')}","${l.query_type ?? ''}",${l.cache_hit ? '是' : '否'},${l.latency_ms ?? ''},${l.groundedness_score ?? ''},${l.auto_score ?? ''},${l.feedback_score ?? ''},"${l.created_at}"`
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-logs-${todayTaipei()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasFilter = Object.values(filters).some(Boolean) || debouncedSearch
  const activeFilterCount = [filters.from, filters.to, filters.queryType, filters.feedbackMin, filters.feedbackMax, debouncedSearch].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* 頁首 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-wb-100">查詢日誌</h1>
          <p className="mt-0.5 text-sm text-wb-50">
            {isLoading ? '載入中…' : `共 ${data?.total ?? 0} 筆記錄`}
            {hasFilter && !isLoading && data && (
              <span className="ml-1 text-wb-40">（已篩選）</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 篩選切換按鈕（mobile） */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-wb-20 bg-white px-3 py-1.5 text-sm text-wb-70 hover:bg-wb-10 transition-colors sm:hidden"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-wb-100 text-[10px] text-white">{activeFilterCount}</span>
            )}
          </button>
          <button
            onClick={handleExport}
            disabled={!data?.logs.length}
            className="flex items-center gap-1.5 rounded-lg border border-wb-20 bg-white px-3 py-1.5 text-sm text-wb-70 hover:bg-wb-10 disabled:opacity-40 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">匯出 CSV</span>
          </button>
        </div>
      </div>

      {/* 篩選器 */}
      <div className={showFilters ? 'block' : 'hidden sm:block'}>
        <FilterPanel filters={filters} onChange={handleFilterChange} onClear={handleClear} />
      </div>

      {/* 內容區 */}
      <div className="rounded-xl border border-wb-20 bg-white overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-wb-40" />
          </div>
        ) : !data?.logs.length ? (
          <div className="py-16 text-center">
            <p className="text-sm text-wb-50">沒有符合條件的日誌</p>
            {hasFilter && (
              <button onClick={handleClear} className="mt-2 text-xs text-wb-40 underline underline-offset-2 hover:text-wb-80 transition-colors">
                清除篩選條件
              </button>
            )}
          </div>
        ) : (
          <>
            {/* 桌面表格 */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-wb-15">
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-wb-40 uppercase tracking-wide">查詢內容</th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-wb-40 uppercase tracking-wide hidden md:table-cell">使用者</th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-wb-40 uppercase tracking-wide hidden lg:table-cell">Groundedness</th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-wb-40 uppercase tracking-wide hidden lg:table-cell">Judge</th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-wb-40 uppercase tracking-wide hidden xl:table-cell">回饋</th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-wb-40 uppercase tracking-wide hidden sm:table-cell">延遲</th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-wb-40 uppercase tracking-wide">時間</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-wb-08">
                  {data.logs.map((log) => (
                    <TableRow key={log.id} log={log} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* 手機卡片 */}
            <div className="sm:hidden divide-y divide-wb-08">
              {data.logs.map((log) => (
                <MobileCard key={log.id} log={log} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 分頁 */}
      {data && data.total > LIMIT && (
        <Pagination page={page} total={data.total} limit={LIMIT} onChange={setPage} />
      )}
    </div>
  )
}
