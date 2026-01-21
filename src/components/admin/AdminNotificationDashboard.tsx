'use client'

import { useState, useEffect } from 'react'
import { notificationService } from '@/lib/api/services'
import {
  Bell,
  Users,
  TrendingUp,
  Clock,
  RefreshCw,
  AlertCircle,
  BarChart3,
  User,
} from 'lucide-react'

interface AdminStats {
  period: string
  overview: {
    total: number
    unread: number
    usersWithNotifications: number
  }
  byType: Array<{ type: string; count: number }>
  hourlyTrend: Array<{ hour: string; count: number }>
  topRecipients: Array<{
    user_id: string
    username: string
    display_name: string | null
    notification_count: number
  }>
}

const typeLabels: Record<string, string> = {
  goal_liked: '目標按讚',
  goal_commented: '目標留言',
  goal_referenced: '目標參考',
  post_liked: '文章按讚',
  post_commented: '文章留言',
  biography_commented: '人物誌留言',
  new_follower: '新追蹤者',
  story_featured: '故事精選',
  goal_completed: '目標完成',
}

export default function AdminNotificationDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await notificationService.getAdminStats()
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入失敗'
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        setError('需要管理員權限才能查看此頁面')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">無法載入資料</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={loadStats}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          重試
        </button>
      </div>
    )
  }

  if (!stats) return null

  // 找出最高峰時段
  const peakHour = stats.hourlyTrend.reduce(
    (max, item) => (item.count > max.count ? item : max),
    { hour: '', count: 0 }
  )

  // 計算已讀率
  const readRate =
    stats.overview.total > 0
      ? Math.round(((stats.overview.total - stats.overview.unread) / stats.overview.total) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">通知系統監控</h1>
          <p className="text-gray-500 mt-1">過去 24 小時的通知系統統計</p>
        </div>
        <button
          onClick={loadStats}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          重新整理
        </button>
      </div>

      {/* 總覽統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-wb-20 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-yellow-100/10 rounded-lg">
              <Bell className="h-6 w-6 text-brand-yellow-200" />
            </div>
            <div>
              <p className="text-sm text-wb-70">發送總數</p>
              <p className="text-2xl font-bold text-wb-100">{stats.overview.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-wb-20 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-red-100/10 rounded-lg">
              <AlertCircle className="h-6 w-6 text-brand-red-100" />
            </div>
            <div>
              <p className="text-sm text-wb-70">未讀通知</p>
              <p className="text-2xl font-bold text-wb-100">{stats.overview.unread}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-wb-20 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-wb-90/5 rounded-lg">
              <Users className="h-6 w-6 text-wb-90" />
            </div>
            <div>
              <p className="text-sm text-wb-70">有通知的用戶</p>
              <p className="text-2xl font-bold text-wb-100">
                {stats.overview.usersWithNotifications}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-wb-20 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-yellow-100/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-brand-yellow-200" />
            </div>
            <div>
              <p className="text-sm text-wb-70">已讀率</p>
              <p className="text-2xl font-bold text-wb-100">{readRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* 詳細統計區塊 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 按類型統計 */}
        <div className="bg-white rounded-xl shadow-sm border border-wb-20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-wb-60" />
            <h3 className="font-semibold text-wb-100">按類型統計</h3>
          </div>
          {stats.byType.length > 0 ? (
            <div className="space-y-3">
              {stats.byType.map((item) => {
                const maxCount = Math.max(...stats.byType.map((t) => t.count))
                const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                return (
                  <div key={item.type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-wb-70">{typeLabels[item.type] || item.type}</span>
                      <span className="font-medium text-wb-100">{item.count}</span>
                    </div>
                    <div className="h-2 bg-wb-10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-yellow-200 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-wb-70 text-center py-8">過去 24 小時沒有通知</p>
          )}
        </div>

        {/* 每小時趨勢 */}
        <div className="bg-white rounded-xl shadow-sm border border-wb-20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-wb-60" />
              <h3 className="font-semibold text-wb-100">24 小時趨勢</h3>
            </div>
            {peakHour.hour && (
              <span className="text-xs text-wb-70">
                尖峰時段: {peakHour.hour.split(' ')[1] || peakHour.hour} ({peakHour.count})
              </span>
            )}
          </div>
          {stats.hourlyTrend.length > 0 ? (
            <div className="h-48 flex items-end gap-1">
              {stats.hourlyTrend.map((item, index) => {
                const maxCount = Math.max(...stats.hourlyTrend.map((t) => t.count))
                const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                const hourLabel = item.hour.split(' ')[1]?.replace(':00', '') || item.hour
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center group"
                    title={`${item.hour}: ${item.count} 則通知`}
                  >
                    <div
                      className="w-full bg-gradient-to-t from-brand-yellow-200 to-brand-yellow-100 rounded-t transition-all duration-300 hover:from-brand-yellow-200 hover:to-brand-yellow-200"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    {index % 4 === 0 && (
                      <span className="text-xs text-wb-60 mt-1">{hourLabel}</span>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-wb-70 text-center py-8">過去 24 小時沒有通知</p>
          )}
        </div>
      </div>

      {/* 通知最多的用戶 */}
      <div className="bg-white rounded-xl shadow-sm border border-wb-20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-wb-60" />
          <h3 className="font-semibold text-wb-100">通知最多的用戶 (前 10 名)</h3>
        </div>
        {stats.topRecipients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-wb-70 border-b border-wb-20">
                  <th className="pb-3 font-medium">排名</th>
                  <th className="pb-3 font-medium">用戶</th>
                  <th className="pb-3 font-medium text-right">通知數量</th>
                </tr>
              </thead>
              <tbody>
                {stats.topRecipients.map((user, index) => (
                  <tr key={user.user_id} className="border-b border-wb-10 last:border-0">
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          index === 0
                            ? 'bg-brand-yellow-100 text-brand-dark'
                            : index === 1
                              ? 'bg-wb-20 text-wb-90'
                              : index === 2
                                ? 'bg-brand-yellow-200/20 text-brand-yellow-200'
                                : 'bg-wb-10 text-wb-70'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3">
                      <div>
                        <p className="font-medium text-wb-100">
                          {user.display_name || user.username}
                        </p>
                        {user.display_name && (
                          <p className="text-xs text-wb-70">@{user.username}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className="font-semibold text-wb-100">{user.notification_count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-wb-70 text-center py-8">過去 24 小時沒有用戶收到通知</p>
        )}
      </div>
    </div>
  )
}
