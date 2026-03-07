'use client'

import { useState } from 'react'
import { formatTaipei } from '@/lib/utils'
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { useAIKnowledge } from '@/lib/api/admin-ai'
import apiClient from '@/lib/api/client'
import { useQueryClient } from '@tanstack/react-query'

type IndexType = 'route' | 'crag' | 'all'

const BATCH_SIZE = 10
const INDEXING_TIMEOUT = 180000

interface IndexApiResponse {
  success: boolean
  message: string
  data: {
    indexed: number
    failed: number
    hasMore: boolean
    nextOffset: number
  }
}

export default function AdminAIKnowledgePage() {
  const { data, isLoading, refetch } = useAIKnowledge()
  const queryClient = useQueryClient()
  const [confirm, setConfirm] = useState<IndexType | null>(null)
  const [indexing, setIndexing] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [indexResult, setIndexResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleReindex = async (type: IndexType) => {
    setIndexing(true)
    setIndexResult(null)
    setConfirm(null)
    setProgress(null)

    let totalIndexed = 0
    let totalFailed = 0

    try {
        // 岩場數量少，一次完成
      if (type === 'crag' || type === 'all') {
        const res = await apiClient.post<IndexApiResponse>(
          '/ai/index',
          { type: 'crag', offset: 0, limit: BATCH_SIZE },
          { timeout: INDEXING_TIMEOUT }
        )
        totalIndexed += res.data.data.indexed
        totalFailed += res.data.data.failed
        refetch()
      }

      // 路線數量多，分批執行
      if (type === 'route' || type === 'all') {
        let offset = 0
        let hasMore = true
        const estimated = data?.sources.find((s) => s.type === 'route')?.total ?? 946
        setProgress({ done: 0, total: estimated })

        while (hasMore) {
          const res = await apiClient.post<IndexApiResponse>(
            '/ai/index',
            { type: 'route', offset, limit: BATCH_SIZE },
            { timeout: INDEXING_TIMEOUT }
          )
          const batch = res.data.data
          totalIndexed += batch.indexed
          totalFailed += batch.failed
          hasMore = batch.hasMore
          offset = batch.nextOffset
          setProgress({ done: Math.min(offset, estimated), total: estimated })
          refetch()
        }
        setProgress(null)
      }

      setIndexResult({
        success: true,
        message: `索引完成：成功 ${totalIndexed} 筆，失敗 ${totalFailed} 筆`,
      })
      queryClient.invalidateQueries({ queryKey: ['admin-ai-knowledge'] })
    } catch {
      setIndexResult({ success: false, message: '索引操作失敗，請稍後再試。' })
    } finally {
      setIndexing(false)
      setProgress(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-wb-100">知識庫管理</h1>
        <p className="mt-1 text-sm text-wb-60">查看索引狀態，並手動觸發重新建立向量索引</p>
      </div>

      {/* 索引結果提示 */}
      {indexResult && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            indexResult.success
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {indexResult.success ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {indexResult.message}
        </div>
      )}

      {/* 分批進度條 */}
      {indexing && progress && (
        <div className="rounded-xl border border-wb-20 bg-white px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-wb-100">路線索引中...</span>
            <span className="text-sm text-wb-50">
              {progress.done} / {progress.total}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-wb-10 overflow-hidden">
            <div
              className="h-full rounded-full bg-wb-100 transition-all duration-300"
              style={{
                width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="mt-1.5 text-xs text-wb-50">每批 {BATCH_SIZE} 筆，請勿關閉頁面</p>
        </div>
      )}

      {/* 資料來源表格 */}
      <div className="rounded-xl border border-wb-20 bg-white overflow-hidden">
        <div className="border-b border-wb-20 px-5 py-4">
          <h2 className="text-sm font-semibold text-wb-100">資料來源狀態</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-wb-50" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-wb-05">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-wb-70">類型</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-wb-70">資料總數</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-wb-70">已索引</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-wb-70">覆蓋率</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-wb-70">最後更新</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-wb-70">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wb-10">
              {data?.sources.map((source) => {
                const ratio = source.total > 0 ? source.indexed / source.total : 0
                const isComplete = ratio >= 0.99
                return (
                  <tr key={source.type}>
                    <td className="px-5 py-4 font-medium text-wb-100">{source.label}</td>
                    <td className="px-5 py-4 text-wb-70">{source.total.toLocaleString()}</td>
                    <td className="px-5 py-4 text-wb-70">{source.indexed.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 rounded-full bg-wb-20 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isComplete ? 'bg-emerald-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${Math.min(100, ratio * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-wb-70">{(ratio * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-wb-50 text-xs">
                      {source.last_indexed_at
                        ? formatTaipei(source.last_indexed_at)
                        : '從未索引'}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setConfirm(source.type)}
                        disabled={indexing}
                        className="flex items-center gap-1 rounded-lg border border-wb-20 px-3 py-1.5 text-xs text-wb-70 hover:bg-wb-10 disabled:opacity-40 transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" />
                        重新索引
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 全部重新索引 */}
      <div className="flex justify-end">
        <button
          onClick={() => setConfirm('all')}
          disabled={indexing}
          className="flex items-center gap-2 rounded-xl border border-wb-20 bg-white px-4 py-2 text-sm text-wb-100 hover:bg-wb-10 disabled:opacity-40 transition-colors"
        >
          {indexing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          全部重新索引
        </button>
      </div>

      {/* 確認對話框 */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0" />
              <h3 className="font-semibold text-wb-100">確認重新索引</h3>
            </div>
            <p className="text-sm text-wb-70 mb-6">
              即將重新建立「
              {confirm === 'all' ? '所有資料' : confirm === 'route' ? '攀岩路線' : '岩場'}
              」的向量索引。路線資料將分批處理（每批 {BATCH_SIZE} 筆），請勿關閉頁面。確定要繼續嗎？
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="rounded-lg border border-wb-20 px-4 py-2 text-sm text-wb-70 hover:bg-wb-10 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleReindex(confirm)}
                className="rounded-lg bg-wb-100 px-4 py-2 text-sm text-white hover:bg-wb-90 transition-colors"
              >
                確認重新索引
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
