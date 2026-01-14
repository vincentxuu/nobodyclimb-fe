'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Users, ArrowLeft } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { PageHeader } from '@/components/ui/page-header'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'
import { CommunityDashboard } from '@/components/biography/stats'
import { useCommunityStats, useLeaderboard } from '@/lib/hooks/useBiographyStats'

export default function CommunityStatsPage() {
  // 獲取社群統計數據
  const { data: stats, isLoading: statsLoading, error: statsError } = useCommunityStats()

  // 獲取排行榜數據
  const { data: goalsLeaderboard, isLoading: goalsLoading } = useLeaderboard('goals_completed', 10)
  const { data: followersLeaderboard, isLoading: followersLoading } = useLeaderboard('followers', 10)
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
      <PageHeader
        title="社群統計"
        subtitle="查看 NobodyClimb 社群的整體統計數據與排行榜"
      />

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '人物誌', href: '/biography' },
              { label: '社群統計' },
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
              <span>返回人物誌</span>
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
            <h3 className="mt-4 text-lg font-medium text-gray-900">無法載入社群統計</h3>
            <p className="mt-2 text-sm text-gray-500">請稍後再試</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              重新載入
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
            className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-gray-900">探索攀岩故事</h3>
            <p className="mt-2 text-sm text-gray-500">
              發現社群中精彩的攀岩目標與故事
            </p>
          </Link>
          <Link
            href="/biography"
            className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-gray-900">瀏覽人物誌</h3>
            <p className="mt-2 text-sm text-gray-500">
              認識更多攀岩小人物的故事
            </p>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
