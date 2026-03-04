'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { useAILogs } from '@/lib/api/admin-ai'

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-wb-40">—</span>
  const styles: Record<number, string> = {
    1: 'bg-red-50 text-red-600 border-red-200',
    2: 'bg-orange-50 text-orange-600 border-orange-200',
    3: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    4: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    5: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
  return (
    <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${styles[score] ?? 'border-wb-20 text-wb-60'}`}>
      {score} / 5
    </span>
  )
}

function QueryTypeBadge({ type }: { type: 'simple' | 'complex' | 'general-knowledge' | null }) {
  if (!type) return <span className="text-wb-40">—</span>
  const map: Record<string, { label: string; cls: string }> = {
    simple: { label: '簡單', cls: 'bg-blue-50 text-blue-600 border-blue-200' },
    complex: { label: '複雜', cls: 'bg-purple-50 text-purple-600 border-purple-200' },
    'general-knowledge': { label: '通識', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  }
  const { label, cls } = map[type] ?? { label: type, cls: 'border-wb-20 text-wb-60' }
  return <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
}

const inputCls = 'rounded-lg border border-wb-20 bg-white px-3 py-1.5 text-sm text-wb-100 outline-none focus:border-wb-50 focus:ring-1 focus:ring-wb-50 transition-colors'

export default function AdminAILogsPage() {
  const [page, setPage] = useState(1)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [feedbackMin, setFeedbackMin] = useState('')
  const [feedbackMax, setFeedbackMax] = useState('')

  const { data, isLoading } = useAILogs({
    page,
    limit: 20,
    from: from || undefined,
    to: to || undefined,
    feedback_min: feedbackMin ? parseInt(feedbackMin) : undefined,
    feedback_max: feedbackMax ? parseInt(feedbackMax) : undefined,
  })

  const totalPages = data ? Math.ceil(data.total / 20) : 1

  const handleExport = () => {
    if (!data?.logs.length) return
    const header = 'ID,使用者,查詢,延遲(ms),回饋,建立時間\n'
    const rows = data.logs
      .map((l) => `"${l.id}","${l.display_name || l.username || '匿名'}","${l.query.replace(/"/g, '""')}",${l.latency_ms ?? ''},${l.feedback_score ?? ''},"${l.created_at}"`)
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-logs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      {/* 頁首 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-wb-100">查詢日誌</h1>
          <p className="mt-1 text-sm text-wb-60">共 {data?.total ?? 0} 筆記錄</p>
        </div>
        <button
          onClick={handleExport}
          disabled={!data?.logs.length}
          className="flex items-center gap-1.5 rounded-lg border border-wb-20 bg-white px-3 py-1.5 text-sm text-wb-70 hover:bg-wb-10 disabled:opacity-40 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          匯出 CSV
        </button>
      </div>

      {/* 篩選器 */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-wb-20 bg-white px-5 py-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-wb-50">開始日期</label>
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1) }}
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-wb-50">結束日期</label>
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1) }}
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-wb-50">回饋最小分</label>
          <select
            value={feedbackMin}
            onChange={(e) => { setFeedbackMin(e.target.value); setPage(1) }}
            className={inputCls}
          >
            <option value="">不限</option>
            {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-wb-50">回饋最大分</label>
          <select
            value={feedbackMax}
            onChange={(e) => { setFeedbackMax(e.target.value); setPage(1) }}
            className={inputCls}
          >
            <option value="">不限</option>
            {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        {(from || to || feedbackMin || feedbackMax) && (
          <button
            onClick={() => { setFrom(''); setTo(''); setFeedbackMin(''); setFeedbackMax(''); setPage(1) }}
            className="text-xs text-wb-50 hover:text-wb-100 underline underline-offset-2 transition-colors"
          >
            清除篩選
          </button>
        )}
      </div>

      {/* 表格 */}
      <div className="rounded-xl border border-wb-20 bg-white overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-wb-40" />
          </div>
        ) : !data?.logs.length ? (
          <p className="py-16 text-center text-sm text-wb-50">沒有符合條件的日誌</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-wb-20">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-wb-50">查詢內容</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-wb-50">類型</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-wb-50">使用者</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-wb-50">延遲</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-wb-50">回饋</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-wb-50">時間</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-wb-10">
              {data.logs.map((log) => (
                <tr key={log.id} className="hover:bg-wb-5 transition-colors">
                  <td className="max-w-xs px-5 py-3.5 truncate text-wb-90">{log.query}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <QueryTypeBadge type={log.query_type} />
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {log.user_id ? (
                      <span className="text-sm text-wb-80">{log.display_name || log.username}</span>
                    ) : (
                      <span className="text-xs text-wb-40">匿名</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-wb-60 tabular-nums">
                    {log.latency_ms != null ? `${log.latency_ms} ms` : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <ScoreBadge score={log.feedback_score} />
                  </td>
                  <td className="px-5 py-3.5 text-wb-50 whitespace-nowrap tabular-nums">
                    {new Date(log.created_at).toLocaleString('zh-TW')}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/admin/ai/logs/${log.id}`}
                      className="text-xs text-wb-50 hover:text-wb-100 transition-colors"
                    >
                      詳情 →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 分頁 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-wb-50">第 {page} / {totalPages} 頁</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border border-wb-20 bg-white px-3 py-1.5 text-wb-70 hover:bg-wb-10 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />上頁
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-wb-20 bg-white px-3 py-1.5 text-wb-70 hover:bg-wb-10 disabled:opacity-40 transition-colors"
            >
              下頁<ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
