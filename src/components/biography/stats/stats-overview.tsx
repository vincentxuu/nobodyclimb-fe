'use client'

import { cn } from '@/lib/utils'
import { CircularProgress, ProgressBar, StatCard } from './progress-chart'
import { STORY_FIELD_COUNTS, type BiographyStats } from '@/lib/types'
import { Eye, Heart, Users, Target, BookOpen, MapPin } from 'lucide-react'

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
          icon={<Eye className="w-5 h-5 text-blue-500" />}
          color="bg-blue-100"
        />
        <StatCard
          value={stats.total_likes}
          label="收到的讚"
          icon={<Heart className="w-5 h-5 text-pink-500" />}
          color="bg-pink-100"
        />
        <StatCard
          value={stats.follower_count}
          label="追蹤者"
          icon={<Users className="w-5 h-5 text-purple-500" />}
          color="bg-purple-100"
        />
        <StatCard
          value={stats.bucket_list.completed}
          label="完成目標"
          icon={<Target className="w-5 h-5 text-green-500" />}
          color="bg-green-100"
        />
        <StatCard
          value={stats.stories.total}
          label="已分享故事"
          icon={<BookOpen className="w-5 h-5 text-orange-500" />}
          color="bg-orange-100"
        />
        <StatCard
          value={stats.locations_count}
          label="攀岩足跡"
          icon={<MapPin className="w-5 h-5 text-teal-500" />}
          color="bg-teal-100"
        />
      </div>

      {/* 進度圖表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 故事完成度 */}
        <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">故事完成度</h3>
          <div className="flex items-center gap-8">
            <CircularProgress
              value={storyCompletionRate}
              size="lg"
              color="stroke-orange-500"
            />
            <div className="flex-1 space-y-3">
              <ProgressBar
                value={stats.stories.core_completed}
                max={STORY_FIELD_COUNTS.CORE}
                label="核心故事"
                showLabel
                color="bg-orange-500"
              />
              <ProgressBar
                value={stats.stories.advanced_completed}
                max={STORY_FIELD_COUNTS.ADVANCED}
                label="進階故事"
                showLabel
                color="bg-orange-300"
              />
            </div>
          </div>
        </div>

        {/* 目標達成率 */}
        <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">目標達成率</h3>
          <div className="flex items-center gap-8">
            <CircularProgress
              value={goalCompletionRate}
              size="lg"
              color="stroke-green-500"
            />
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-600">已完成</span>
                <span className="text-lg font-semibold text-green-600">
                  {stats.bucket_list.completed}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm text-gray-600">進行中</span>
                <span className="text-lg font-semibold text-yellow-600">
                  {stats.bucket_list.active}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">總計</span>
                <span className="text-lg font-semibold text-gray-600">
                  {stats.bucket_list.total}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 社群互動 */}
      <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">社群互動</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{stats.follower_count}</p>
            <p className="text-sm text-gray-500">追蹤者</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.following_count}</p>
            <p className="text-sm text-gray-500">追蹤中</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-pink-600">{stats.total_likes}</p>
            <p className="text-sm text-gray-500">收到的讚</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-600">{stats.total_views}</p>
            <p className="text-sm text-gray-500">瀏覽次數</p>
          </div>
        </div>
      </div>
    </div>
  )
}
