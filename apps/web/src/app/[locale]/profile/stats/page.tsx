'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Award, BarChart3, TrendingUp, Trophy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React from 'react'
import { BadgeShowcase, StatsOverview } from '@/components/biography/stats'
import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'
import ProfilePageTitle from '@/components/profile/ProfilePageTitle'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { biographyService } from '@/lib/api/services'
import { useBiographyBadges, useBiographyStats } from '@/lib/hooks/useBiographyStats'

export default function StatsPage() {
  const t = useTranslations('ProfilePage')
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
            icon={<BarChart3 className="h-12 w-12 text-subtle" />}
            title={t('noBiographyTitle')}
            description={t('noBiographyForStatsDesc')}
            action={<Button onClick={() => router.push('/profile')}>{t('createBiography')}</Button>}
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
        <ProfilePageTitle title={t('statsTitle')} subtitle={t('statsSubtitle')} />

        {/* 摘要卡片 */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard
            icon={<TrendingUp className="h-5 w-5 text-brand-dark" />}
            label={t('statTotalViews')}
            value={stats?.total_views ?? 0}
            color="bg-brand-light"
          />
          <SummaryCard
            icon={<Award className="h-5 w-5 text-brand-dark" />}
            label={t('statTotalLikes')}
            value={stats?.total_likes ?? 0}
            color="bg-brand-light"
          />
          <SummaryCard
            icon={<Trophy className="h-5 w-5 text-brand-dark" />}
            label={t('statUnlockedBadges')}
            value={`${unlockedBadges}/${totalBadges}`}
            color="bg-brand-accent/20"
          />
          <SummaryCard
            icon={<BarChart3 className="h-5 w-5 text-brand-dark" />}
            label={t('statGoalsCompleted')}
            value={stats?.bucket_list?.completed ?? 0}
            color="bg-brand-light"
          />
        </div>

        {/* 詳細統計 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-white p-6"
        >
          <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-text-main">
            <BarChart3 className="h-5 w-5 text-brand-dark" />
            {t('detailedStats')}
          </h2>
          {statsLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : stats ? (
            <StatsOverview stats={stats} />
          ) : (
            <EmptyState
              icon={<BarChart3 className="h-12 w-12 text-subtle" />}
              title={t('errorLoadStats')}
              description={t('retryLater')}
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
          <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-text-main">
            <Award className="h-5 w-5 text-brand-dark" />
            {t('badgeCollection')}
          </h2>
          {badgesLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : badgesData?.progress ? (
            <BadgeShowcase badgeProgress={badgesData.progress} />
          ) : (
            <EmptyState
              icon={<Award className="h-12 w-12 text-subtle" />}
              title={t('errorLoadBadges')}
              description={t('retryLater')}
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
        <span className="text-sm text-strong">{label}</span>
      </div>
      <p className="text-2xl font-bold text-text-main">{value}</p>
    </div>
  )
}
