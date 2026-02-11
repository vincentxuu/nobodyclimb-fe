'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminBroadcastService, adminUserService, BroadcastRecord } from '@/lib/api/services'
import {
  Megaphone,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Users,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export default function AdminBroadcast() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [targetRole, setTargetRole] = useState<'all' | 'user' | 'moderator' | 'admin'>('all')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    data?: { totalUsers: number; successCount: number; failedCount: number }
  } | null>(null)

  const [broadcasts, setBroadcasts] = useState<BroadcastRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [userStats, setUserStats] = useState<{ total: number; active: number } | null>(null)

  const loadBroadcasts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminBroadcastService.getBroadcasts(page, 10)
      if (response.success) {
        setBroadcasts(response.data || [])
        setTotalPages(response.pagination.total_pages)
      }
    } catch (err) {
      console.error('Failed to load broadcasts:', err)
    } finally {
      setLoading(false)
    }
  }, [page])

  const loadUserStats = async () => {
    try {
      const response = await adminUserService.getStats()
      if (response.success && response.data) {
        setUserStats({ total: response.data.total, active: response.data.active })
      }
    } catch (err) {
      console.error('Failed to load user stats:', err)
    }
  }

  useEffect(() => {
    loadBroadcasts()
    loadUserStats()
  }, [loadBroadcasts])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      setResult({ success: false, message: '請填寫標題和內容' })
      return
    }

    setSending(true)
    setResult(null)

    try {
      const response = await adminBroadcastService.sendBroadcast({
        title: title.trim(),
        message: message.trim(),
        targetRole,
      })

      if (response.success) {
        setResult({
          success: true,
          message: response.message || '廣播已發送',
          data: response.data,
        })
        setTitle('')
        setMessage('')
        loadBroadcasts()
      } else {
        setResult({ success: false, message: response.message || '發送失敗' })
      }
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : '發送失敗' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-wb-100">廣播通知</h1>
          <p className="text-wb-70 mt-1">發送系統公告給所有用戶</p>
        </div>
        {userStats && (
          <div className="text-sm text-wb-70">
            目前活躍用戶：<span className="font-medium text-wb-100">{userStats.active}</span> / {userStats.total}
          </div>
        )}
      </div>

      {/* 發送表單 */}
      <div className="bg-white rounded-lg shadow-sm border border-wb-20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-wb-100">發送新公告</h2>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-wb-100 mb-1">
              標題
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="輸入公告標題..."
              className="w-full px-4 py-2 bg-white border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow-100/50 focus:border-brand-yellow-100 text-wb-100 placeholder:text-wb-50"
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-wb-100 mb-1">
              內容
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="輸入公告內容..."
              rows={4}
              className="w-full px-4 py-2 bg-white border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow-100/50 focus:border-brand-yellow-100 text-wb-100 placeholder:text-wb-50 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-wb-50 mt-1">{message.length} / 500</p>
          </div>

          <div>
            <label htmlFor="targetRole" className="block text-sm font-medium text-wb-100 mb-1">
              發送對象
            </label>
            <select
              id="targetRole"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as typeof targetRole)}
              className="w-full px-4 py-2 bg-white border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow-100/50 focus:border-brand-yellow-100 text-wb-100"
            >
              <option value="all">所有用戶</option>
              <option value="user">僅一般用戶</option>
              <option value="moderator">僅版主</option>
              <option value="admin">僅管理員</option>
            </select>
          </div>

          {result && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg ${
                result.success ? 'bg-wb-90/10 text-wb-90' : 'bg-brand-red-100/10 text-brand-red-100'
              }`}
            >
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-wb-90 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-brand-red-100 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium">{result.message}</p>
                {result.data && (
                  <p className="text-sm mt-1">
                    已發送給 {result.data.successCount} 位用戶
                    {result.data.failedCount > 0 && `，${result.data.failedCount} 位發送失敗`}
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={sending || !title.trim() || !message.trim()}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                發送中...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                發送廣播
              </>
            )}
          </button>
        </form>
      </div>

      {/* 歷史記錄 */}
      <div className="bg-white rounded-lg shadow-sm border border-wb-20 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-wb-20">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-wb-50" />
            <h2 className="font-semibold text-wb-100">發送歷史</h2>
          </div>
          <button
            onClick={() => loadBroadcasts()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-wb-70 hover:text-wb-100 hover:bg-wb-10 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            重新整理
          </button>
        </div>

        {loading && broadcasts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-wb-50" />
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="text-center py-12 text-wb-70">尚無廣播記錄</div>
        ) : (
          <div className="divide-y divide-wb-10">
            {broadcasts.map((broadcast) => (
              <div key={broadcast.id} className="p-6 hover:bg-wb-10/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-wb-100 truncate">{broadcast.title}</h3>
                    <p className="text-sm text-wb-70 mt-1 line-clamp-2">{broadcast.message}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-wb-50">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {broadcast.recipient_count} 位接收者
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {broadcast.read_count} 已讀 (
                        {broadcast.recipient_count > 0
                          ? Math.round((broadcast.read_count / broadcast.recipient_count) * 100)
                          : 0}
                        %)
                      </span>
                      <span>發送者：{broadcast.actor_name || '系統'}</span>
                    </div>
                  </div>
                  <div className="text-xs text-wb-50 whitespace-nowrap">
                    {new Date(broadcast.created_at).toLocaleString('zh-TW')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分頁 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-wb-20">
            <p className="text-sm text-wb-70">第 {page} / {totalPages} 頁</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 hover:bg-wb-10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 hover:bg-wb-10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
