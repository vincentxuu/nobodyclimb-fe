'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BarChart3, Award, Trophy, TrendingUp } from 'lucide-react'
import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { StatsOverview, BadgeShowcase } from '@/components/biography/stats'
import { useBiographyStats, useBiographyBadges } from '@/lib/hooks/useBiographyStats'
import { biographyService } from '@/lib/api/services'

export default function StatsPage() {
  const router = useRouter()
  // 獲取我的人物誌
  const { data: biographyData, isLoading: isBiographyLoading } = useQuery({
    queryKey: ['my-biography'],
    queryFn: () => biographyService.getMyBiography(),
  })

  const biography = biographyData?.data

  // 獲取統計數據
  const { data: stats, isLoading: statsLoading } = useBiographyStats(biography?.id)

  // 獲取徽章數據
  const { data: badgesData, isLoading: badgesLoading } = useBiographyBadges(biography?.id)

  // 載入中
  if (isBiographyLoading) {
    return (
      <ProfilePageLayout>
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </ProfilePageLayout>
    )
  }

  // 未建立人物誌
  if (!biography) {
    return (
      <ProfilePageLayout>
        <div className="rounded-lg bg-white p-8">
          <EmptyState
            icon={<BarChart3 className="h-12 w-12 text-gray-400" />}
            title="尚未建立人物誌"
            description="請先建立你的人物誌，才能查看統計數據"
            action={
              <Button onClick={() => router.push('/profile')}>
                建立人物誌
              </Button>
            }
          />
        </div>
      </ProfilePageLayout>
    )
  }

  // 計算解鎖徽章數量
  const unlockedBadges = badgesData?.progress?.filter((b) => b.unlocked).length ?? 0
  const totalBadges = badgesData?.progress?.length ?? 0

  return (
    <ProfilePageLayout>
      <div className="space-y-6">
        {/* 頁面標題 */}
        <div>
          <h1 className="text-2xl font-bold text-[#1B1A1A]">我的成就</h1>
          <p className="mt-1 text-sm text-gray-500">
            查看你的攀岩統計數據與徽章收藏
          </p>
        </div>

        {/* 摘要卡片 */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard
            icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
            label="總瀏覽數"
            value={stats?.total_views ?? 0}
            color="bg-blue-100"
          />
          <SummaryCard
            icon={<Award className="h-5 w-5 text-pink-500" />}
            label="收到的讚"
            value={stats?.total_likes ?? 0}
            color="bg-pink-100"
          />
          <SummaryCard
            icon={<Trophy className="h-5 w-5 text-yellow-500" />}
            label="已解鎖徽章"
            value={`${unlockedBadges}/${totalBadges}`}
            color="bg-yellow-100"
          />
          <SummaryCard
            icon={<BarChart3 className="h-5 w-5 text-green-500" />}
            label="完成目標"
            value={stats?.bucket_list?.completed ?? 0}
            color="bg-green-100"
          />
        </div>

        {/* 詳細統計 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-white p-6"
        >
          <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            詳細統計
          </h2>
          {statsLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : stats ? (
            <StatsOverview stats={stats} />
          ) : (
            <EmptyState
              icon={<BarChart3 className="h-12 w-12 text-gray-400" />}
              title="無法載入統計數據"
              description="請稍後再試"
            />
          )}
        </motion.div>

        {/* 徽章收藏 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg bg-white p-6"
        >
          <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Award className="h-5 w-5 text-yellow-600" />
            徽章收藏
          </h2>
          {badgesLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : badgesData?.progress ? (
            <BadgeShowcase badgeProgress={badgesData.progress} />
          ) : (
            <EmptyState
              icon={<Award className="h-12 w-12 text-gray-400" />}
              title="無法載入徽章數據"
              description="請稍後再試"
            />
          )}
        </motion.div>
      </div>
    </ProfilePageLayout>
  )
}

// 摘要卡片組件
function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  color: string
}) {
  return (
    <div className={`rounded-lg ${color} p-4`}>
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
