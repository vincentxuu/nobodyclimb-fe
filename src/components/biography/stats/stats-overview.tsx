'use client'

import { cn } from '@/lib/utils'
import { CircularProgress, ProgressBar, StatCard } from './progress-chart'
import { STORY_FIELD_COUNTS, type BiographyStats } from '@/lib/types'
import { Eye, Mountain, Users, Target, BookOpen, MapPin } from 'lucide-react'

interface StatsOverviewProps {
  stats: BiographyStats
  className?: string
}

export function StatsOverview({ stats, className }: StatsOverviewProps) {
  // 計算故事完成度 - 使用共用常數
  const storyCompletionRate =
    ((stats.stories.core_completed + stats.stories.advanced_completed) / STORY_FIELD_COUNTS.TOTAL) *
    100

  // 計算目標完成率
  const goalCompletionRate =
    stats.bucket_list.total > 0
      ? (stats.bucket_list.completed / stats.bucket_list.total) * 100
      : 0

  return (
    <div className={cn('space-y-6', className)}>
      {/* 主要統計數據 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          value={stats.total_views}
          label="瀏覽次數"
          icon={<Eye className="w-5 h-5 text-brand-dark" />}
          color="bg-brand-light"
        />
        <StatCard
          value={stats.total_likes}
          label="收到的讚"
          icon={<Mountain className="w-5 h-5 text-brand-dark" />}
          color="bg-brand-accent/20"
        />
        <StatCard
          value={stats.follower_count}
          label="追蹤者"
          icon={<Users className="w-5 h-5 text-brand-dark" />}
          color="bg-brand-light"
        />
        <StatCard
          value={stats.bucket_list.completed}
          label="完成目標"
          icon={<Target className="w-5 h-5 text-brand-dark" />}
          color="bg-brand-accent/20"
        />
        <StatCard
          value={stats.stories.total}
          label="已分享故事"
          icon={<BookOpen className="w-5 h-5 text-brand-dark" />}
          color="bg-brand-light"
        />
        <StatCard
          value={stats.locations_count}
          label="攀岩足跡"
          icon={<MapPin className="w-5 h-5 text-brand-dark" />}
          color="bg-brand-accent/20"
        />
      </div>

      {/* 進度圖表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 故事完成度 */}
        <div className="p-6 bg-white rounded-xl border border-subtle/50 shadow-sm">
          <h3 className="text-lg font-semibold text-text-main mb-4">故事完成度</h3>
          <div className="flex items-center gap-8">
            <CircularProgress
              value={storyCompletionRate}
              size="lg"
              color="stroke-brand-accent"
            />
            <div className="flex-1 space-y-3">
              <ProgressBar
                value={stats.stories.core_completed}
                max={STORY_FIELD_COUNTS.CORE}
                label="核心故事"
                showLabel
                color="bg-brand-accent"
              />
              <ProgressBar
                value={stats.stories.advanced_completed}
                max={STORY_FIELD_COUNTS.ADVANCED}
                label="進階故事"
                showLabel
                color="bg-brand-accent/60"
              />
            </div>
          </div>
        </div>

        {/* 目標達成率 */}
        <div className="p-6 bg-white rounded-xl border border-subtle/50 shadow-sm">
          <h3 className="text-lg font-semibold text-text-main mb-4">目標達成率</h3>
          <div className="flex items-center gap-8">
            <CircularProgress
              value={goalCompletionRate}
              size="lg"
              color="stroke-brand-dark"
            />
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-center p-3 bg-brand-accent/20 rounded-lg">
                <span className="text-sm text-strong">已完成</span>
                <span className="text-lg font-semibold text-brand-dark">
                  {stats.bucket_list.completed}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-brand-light rounded-lg">
                <span className="text-sm text-strong">進行中</span>
                <span className="text-lg font-semibold text-brand-dark">
                  {stats.bucket_list.active}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-page-bg rounded-lg">
                <span className="text-sm text-strong">總計</span>
                <span className="text-lg font-semibold text-brand-dark">
                  {stats.bucket_list.total}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 社群互動 */}
      <div className="p-6 bg-white rounded-xl border border-subtle/50 shadow-sm">
        <h3 className="text-lg font-semibold text-text-main mb-4">社群互動</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-brand-accent/20 rounded-lg">
            <p className="text-2xl font-bold text-brand-dark">{stats.follower_count}</p>
            <p className="text-sm text-text-subtle">追蹤者</p>
          </div>
          <div className="text-center p-4 bg-brand-light rounded-lg">
            <p className="text-2xl font-bold text-brand-dark">{stats.following_count}</p>
            <p className="text-sm text-text-subtle">追蹤中</p>
          </div>
          <div className="text-center p-4 bg-brand-accent/20 rounded-lg">
            <p className="text-2xl font-bold text-brand-dark">{stats.total_likes}</p>
            <p className="text-sm text-text-subtle">收到的讚</p>
          </div>
          <div className="text-center p-4 bg-brand-light rounded-lg">
            <p className="text-2xl font-bold text-brand-dark">{stats.total_views}</p>
            <p className="text-sm text-text-subtle">瀏覽次數</p>
          </div>
        </div>
      </div>
    </div>
  )
}
