'use client'

import { BookOpen, Eye, MapPin, Mountain, Target, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type BiographyStats, STORY_FIELD_COUNTS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CircularProgress, ProgressBar, StatCard } from './progress-chart'

interface StatsOverviewProps {
  stats: BiographyStats
  className?: string
}

export function StatsOverview({ stats, className }: StatsOverviewProps) {
  const t = useTranslations('BiographyPage')
  // 計算故事完成度 - 使用共用常數
  const storyCompletionRate =
    ((stats.stories.core_completed + stats.stories.advanced_completed) / STORY_FIELD_COUNTS.TOTAL) *
    100

  // 計算目標完成率
  const goalCompletionRate =
    stats.bucket_list.total > 0 ? (stats.bucket_list.completed / stats.bucket_list.total) * 100 : 0

  return (
    <div className={cn('space-y-6', className)}>
      {/* 主要統計數據 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          value={stats.total_views}
          label={t('totalViews')}
          icon={<Eye className="w-5 h-5 text-brand-dark" />}
          color="bg-brand-light"
        />
        <StatCard
          value={stats.total_likes}
          label={t('totalLikes')}
          icon={<Mountain className="w-5 h-5 text-brand-dark" />}
          color="bg-brand-accent/20"
        />
        <StatCard
          value={stats.follower_count}
          label={t('followers')}
          icon={<Users className="w-5 h-5 text-brand-dark" />}
          color="bg-brand-light"
        />
        <StatCard
          value={stats.bucket_list.completed}
          label={t('completedGoals')}
          icon={<Target className="w-5 h-5 text-brand-dark" />}
          color="bg-brand-accent/20"
        />
        <StatCard
          value={stats.stories.total}
          label={t('storiesSharedStat')}
          icon={<BookOpen className="w-5 h-5 text-brand-dark" />}
          color="bg-brand-light"
        />
        <StatCard
          value={stats.locations_count}
          label={t('climbingFootprint')}
          icon={<MapPin className="w-5 h-5 text-brand-dark" />}
          color="bg-brand-accent/20"
        />
      </div>

      {/* 進度圖表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 故事完成度 */}
        <div className="p-6 bg-white rounded-lg border border-subtle/50 shadow-sm">
          <h3 className="text-lg font-semibold text-text-main mb-4">{t('storyCompletion')}</h3>
          <div className="flex items-center gap-8">
            <CircularProgress value={storyCompletionRate} size="lg" color="stroke-brand-accent" />
            <div className="flex-1 space-y-3">
              <ProgressBar
                value={stats.stories.core_completed}
                max={STORY_FIELD_COUNTS.CORE}
                label={t('coreStories')}
                showLabel
                color="bg-brand-accent"
              />
              <ProgressBar
                value={stats.stories.advanced_completed}
                max={STORY_FIELD_COUNTS.ADVANCED}
                label={t('advancedStories')}
                showLabel
                color="bg-brand-accent/60"
              />
            </div>
          </div>
        </div>

        {/* 目標達成率 */}
        <div className="p-6 bg-white rounded-lg border border-subtle/50 shadow-sm">
          <h3 className="text-lg font-semibold text-text-main mb-4">{t('goalAchievementRate')}</h3>
          <div className="flex items-center gap-8">
            <CircularProgress value={goalCompletionRate} size="lg" color="stroke-brand-dark" />
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-center p-3 bg-brand-accent/20 rounded-lg">
                <span className="text-sm text-strong">{t('completed')}</span>
                <span className="text-lg font-semibold text-brand-dark">
                  {stats.bucket_list.completed}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-brand-light rounded-lg">
                <span className="text-sm text-strong">{t('inProgress')}</span>
                <span className="text-lg font-semibold text-brand-dark">
                  {stats.bucket_list.active}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-page-bg rounded-lg">
                <span className="text-sm text-strong">{t('total')}</span>
                <span className="text-lg font-semibold text-brand-dark">
                  {stats.bucket_list.total}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 社群互動 */}
      <div className="p-6 bg-white rounded-lg border border-subtle/50 shadow-sm">
        <h3 className="text-lg font-semibold text-text-main mb-4">{t('communityInteraction')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-brand-accent/20 rounded-lg">
            <p className="text-2xl font-bold text-brand-dark">{stats.follower_count}</p>
            <p className="text-sm text-text-subtle">{t('followers')}</p>
          </div>
          <div className="text-center p-4 bg-brand-light rounded-lg">
            <p className="text-2xl font-bold text-brand-dark">{stats.following_count}</p>
            <p className="text-sm text-text-subtle">{t('following')}</p>
          </div>
          <div className="text-center p-4 bg-brand-accent/20 rounded-lg">
            <p className="text-2xl font-bold text-brand-dark">{stats.total_likes}</p>
            <p className="text-sm text-text-subtle">{t('totalLikes')}</p>
          </div>
          <div className="text-center p-4 bg-brand-light rounded-lg">
            <p className="text-2xl font-bold text-brand-dark">{stats.total_views}</p>
            <p className="text-sm text-text-subtle">{t('totalViews')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
