'use client'

import { BarChart3, Bell, CheckCircle, Loader2, TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { notificationService } from '@/lib/api/services'

interface NotificationStatsData {
  overview: {
    total: number
    unread: number
    read: number
    readRate: number
  }
  byType: Array<{ type: string; count: number }>
  dailyTrend: Array<{ date: string; count: number }>
}

const typeLabelsKeys: Record<string, string> = {
  goal_liked: 'notifStatGoalLiked',
  goal_commented: 'notifStatGoalCommented',
  goal_referenced: 'notifStatGoalReferenced',
  post_liked: 'notifStatPostLiked',
  post_commented: 'notifStatPostCommented',
  biography_commented: 'notifStatBiographyCommented',
  new_follower: 'notifStatNewFollower',
  story_featured: 'notifStatStoryFeatured',
  goal_completed: 'notifStatGoalCompleted',
}

const typeColors: Record<string, string> = {
  goal_liked: 'bg-red-500',
  goal_commented: 'bg-blue-500',
  goal_referenced: 'bg-amber-500',
  post_liked: 'bg-pink-500',
  post_commented: 'bg-cyan-500',
  biography_commented: 'bg-indigo-500',
  new_follower: 'bg-green-500',
  story_featured: 'bg-purple-500',
  goal_completed: 'bg-emerald-500',
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtext?: string
  color?: string
}

function StatCard({ icon, label, value, subtext, color = 'bg-gray-100' }: StatCardProps) {
  return (
    <div className={`${color} rounded-lg p-4`}>
      <div className="flex items-center gap-2 text-gray-600 mb-1">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </div>
  )
}

export default function NotificationStats() {
  const t = useTranslations('ProfilePage')
  const [stats, setStats] = useState<NotificationStatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await notificationService.getStats()
        if (response.success && response.data) {
          setStats(response.data)
        }
      } catch (error) {
        console.error('Failed to load notification stats:', error)
        toast({
          title: t('toastLoadFailed'),
          description: t('toastLoadNotifStatsFailedDesc'),
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [toast])

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#6D6C6C]" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500 py-8">
        <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>{t('errorLoadStats')}</p>
      </div>
    )
  }

  const maxTypeCount = Math.max(...stats.byType.map((t) => t.count), 1)

  return (
    <div className="space-y-6">
      {/* 總覽卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Bell className="h-4 w-4" />}
          label={t('notifStatTotal')}
          value={stats.overview.total}
          color="bg-blue-50"
        />
        <StatCard
          icon={<Bell className="h-4 w-4" />}
          label={t('notifStatUnread')}
          value={stats.overview.unread}
          color="bg-amber-50"
        />
        <StatCard
          icon={<CheckCircle className="h-4 w-4" />}
          label={t('notifStatRead')}
          value={stats.overview.read}
          color="bg-green-50"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label={t('notifStatReadRate')}
          value={`${stats.overview.readRate}%`}
          color="bg-purple-50"
        />
      </div>

      {/* 按類型統計 */}
      {stats.byType.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('notifStatByType')}</h4>
          <div className="space-y-2">
            {stats.byType.map((item) => (
              <div key={item.type} className="flex items-center gap-3">
                <div className="w-24 text-sm text-gray-600 truncate">
                  {typeLabelsKeys[item.type]
                    ? t(typeLabelsKeys[item.type] as Parameters<typeof t>[0])
                    : item.type}
                </div>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${typeColors[item.type] || 'bg-gray-400'} rounded-full transition-all duration-300`}
                    style={{ width: `${(item.count / maxTypeCount) * 100}%` }}
                  />
                </div>
                <div className="w-12 text-sm text-gray-700 text-right font-medium">
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7 天趨勢 */}
      {stats.dailyTrend.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('notifStatLast7Days')}</h4>
          <div className="flex items-end gap-1 h-24">
            {stats.dailyTrend.map((day) => {
              const maxDayCount = Math.max(...stats.dailyTrend.map((d) => d.count), 1)
              const height = (day.count / maxDayCount) * 100
              const dateObj = new Date(day.date)
              const dayLabel = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs text-gray-500">{day.count}</div>
                  <div
                    className="w-full bg-blue-400 rounded-t transition-all duration-300 min-h-[4px]"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                  <div className="text-xs text-gray-400">{dayLabel}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {stats.overview.total === 0 && (
        <div className="text-center text-gray-500 py-4">
          <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>{t('notifStatNoNotifications')}</p>
        </div>
      )}
    </div>
  )
}
