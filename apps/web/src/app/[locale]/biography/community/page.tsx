'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { CommunityDashboard } from '@/components/biography/stats'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PageHeader } from '@/components/ui/page-header'
import { Link } from '@/i18n/navigation'
import { useCommunityStats, useLeaderboard } from '@/lib/hooks/useBiographyStats'

export default function CommunityStatsPage() {
  const t = useTranslations('BiographyPage')
  // 獲取社群統計數據
  const { data: stats, isLoading: statsLoading, error: statsError } = useCommunityStats()

  // 獲取排行榜數據
  const { data: goalsLeaderboard, isLoading: goalsLoading } = useLeaderboard('goals_completed', 10)
  const { data: followersLeaderboard, isLoading: followersLoading } = useLeaderboard(
    'followers',
    10
  )
  const { data: likesLeaderboard, isLoading: likesLoading } = useLeaderboard('likes_received', 10)

  const isLoading = statsLoading || goalsLoading || followersLoading || likesLoading

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-page-content-bg"
    >
      <PageHeader title={t('communityStatsTitle')} subtitle={t('communityStatsDesc')} />

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: t('homeLabel'), href: '/' },
              { label: t('biographyLabel'), href: '/biography' },
              { label: t('communityStatsTitle') },
            ]}
          />
        </div>

        {/* 返回按鈕 */}
        <div className="mb-6">
          <Link href="/biography">
            <Button
              variant="ghost"
              className="flex items-center gap-2 bg-white shadow-sm hover:bg-gray-100"
            >
              <ArrowLeft size={16} />
              <span>{t('backToBiography')}</span>
            </Button>
          </Link>
        </div>

        {/* 內容區 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : statsError ? (
          <div className="rounded-lg bg-white p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {t('loadCommunityStatsFailed')}
            </h3>
            <p className="mt-2 text-sm text-gray-500">{t('retryLater')}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              {t('reload')}
            </Button>
          </div>
        ) : stats ? (
          <CommunityDashboard
            stats={stats}
            leaderboards={{
              goalsCompleted: goalsLeaderboard,
              followers: followersLeaderboard,
              likesReceived: likesLeaderboard,
            }}
          />
        ) : null}

        {/* 導覽連結 */}
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/biography/explore"
            className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-gray-900">{t('exploreStories')}</h3>
            <p className="mt-2 text-sm text-gray-500">{t('exploreStoriesDesc')}</p>
          </Link>
          <Link
            href="/biography"
            className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-gray-900">{t('browseBiography')}</h3>
            <p className="mt-2 text-sm text-gray-500">{t('browseBiographyDesc')}</p>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
