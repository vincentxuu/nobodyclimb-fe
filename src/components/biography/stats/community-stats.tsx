'use client'

import { cn } from '@/lib/utils'
import { StatCard, BarChart } from './progress-chart'
import type { CommunityStats, LeaderboardItem } from '@/lib/types'
import { Users, Target, BookOpen, Activity, Trophy, TrendingUp } from 'lucide-react'
import Image from 'next/image'

interface CommunityStatsOverviewProps {
  stats: CommunityStats
  className?: string
}

export function CommunityStatsOverview({ stats, className }: CommunityStatsOverviewProps) {
  const goalCompletionRate =
    stats.total_goals > 0
      ? Math.round((stats.completed_goals / stats.total_goals) * 100)
      : 0

  return (
    <div className={cn('space-y-6', className)}>
      {/* 主要統計數據 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          value={stats.total_biographies}
          label="人物誌總數"
          icon={<Users className="w-5 h-5 text-blue-500" />}
          color="bg-blue-100"
        />
        <StatCard
          value={stats.total_goals}
          label="目標總數"
          icon={<Target className="w-5 h-5 text-green-500" />}
          color="bg-green-100"
        />
        <StatCard
          value={stats.completed_goals}
          label="完成目標"
          icon={<Trophy className="w-5 h-5 text-yellow-500" />}
          color="bg-yellow-100"
        />
        <StatCard
          value={stats.total_stories}
          label="故事分享"
          icon={<BookOpen className="w-5 h-5 text-orange-500" />}
          color="bg-orange-100"
        />
        <StatCard
          value={stats.active_users_this_week}
          label="本週活躍"
          icon={<Activity className="w-5 h-5 text-purple-500" />}
          color="bg-purple-100"
        />
      </div>

      {/* 目標完成率與熱門分類 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 目標完成率 */}
        <div className="p-6 bg-white rounded-lg border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            社群目標完成率
          </h3>
          <div className="flex items-center justify-center py-8">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  strokeWidth="12"
                  className="stroke-gray-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  strokeWidth="12"
                  strokeLinecap="round"
                  className="stroke-green-500 transition-all duration-500"
                  strokeDasharray={`${goalCompletionRate * 3.52} 352`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{goalCompletionRate}%</span>
                <span className="text-sm text-gray-500">完成率</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl font-bold text-green-600">{stats.completed_goals}</p>
              <p className="text-xs text-gray-500">已完成</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-600">
                {stats.total_goals - stats.completed_goals}
              </p>
              <p className="text-xs text-gray-500">進行中</p>
            </div>
          </div>
        </div>

        {/* 熱門分類 */}
        <div className="p-6 bg-white rounded-lg border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">熱門目標分類</h3>
          {stats.trending_categories.length > 0 ? (
            <BarChart
              data={stats.trending_categories.map((cat, index) => ({
                label: cat.category,
                value: cat.count,
                color: [
                  'bg-blue-500',
                  'bg-green-500',
                  'bg-yellow-500',
                  'bg-purple-500',
                  'bg-pink-500',
                ][index % 5],
              }))}
              showValues
            />
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400">
              尚無分類數據
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface LeaderboardProps {
  title: string
  items: LeaderboardItem[]
  valueLabel?: string
  className?: string
}

export function Leaderboard({ title, items, valueLabel = '分數', className }: LeaderboardProps) {
  if (items.length === 0) {
    return (
      <div className={cn('p-6 bg-white rounded-lg border border-gray-100 shadow-sm', className)}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-40 text-gray-400">尚無排行數據</div>
      </div>
    )
  }

  return (
    <div className={cn('p-6 bg-white rounded-lg border border-gray-100 shadow-sm', className)}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.biography_id}
            className={cn(
              'flex items-center gap-4 p-3 rounded-lg transition-colors',
              index === 0 && 'bg-yellow-50',
              index === 1 && 'bg-gray-100',
              index === 2 && 'bg-orange-50',
              index > 2 && 'hover:bg-gray-50'
            )}
          >
            {/* 排名 */}
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                index === 0 && 'bg-yellow-500 text-white',
                index === 1 && 'bg-gray-400 text-white',
                index === 2 && 'bg-orange-400 text-white',
                index > 2 && 'bg-gray-200 text-gray-600'
              )}
            >
              {item.rank}
            </div>

            {/* 頭像 */}
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
              {item.avatar_url ? (
                <Image
                  src={item.avatar_url}
                  alt={item.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  {item.name.charAt(0)}
                </div>
              )}
            </div>

            {/* 名稱 */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{item.name}</p>
            </div>

            {/* 數值 */}
            <div className="text-right">
              <p className="font-semibold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-500">{valueLabel}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface CommunityDashboardProps {
  stats: CommunityStats
  leaderboards?: {
    goalsCompleted?: LeaderboardItem[]
    followers?: LeaderboardItem[]
    likesReceived?: LeaderboardItem[]
  }
  className?: string
}

export function CommunityDashboard({
  stats,
  leaderboards,
  className,
}: CommunityDashboardProps) {
  return (
    <div className={cn('space-y-8', className)}>
      {/* 社群概況 */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">社群概況</h2>
        <CommunityStatsOverview stats={stats} />
      </section>

      {/* 排行榜 */}
      {leaderboards && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">排行榜</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {leaderboards.goalsCompleted && (
              <Leaderboard
                title="目標達成王"
                items={leaderboards.goalsCompleted}
                valueLabel="完成"
              />
            )}
            {leaderboards.followers && (
              <Leaderboard
                title="人氣王"
                items={leaderboards.followers}
                valueLabel="追蹤者"
              />
            )}
            {leaderboards.likesReceived && (
              <Leaderboard
                title="最受喜愛"
                items={leaderboards.likesReceived}
                valueLabel="讚"
              />
            )}
          </div>
        </section>
      )}
    </div>
  )
}
