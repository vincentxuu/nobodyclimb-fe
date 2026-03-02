'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  adminAnalyticsService,
  FollowAnalytics,
  ActivityAnalytics,
  ContentAnalytics,
} from '@/lib/api/services'
import {
  RefreshCw,
  AlertCircle,
  Users,
  UserPlus,
  Heart,
  Mountain,
  TrendingUp,
  Eye,
  FileText,
  Activity,
  Target,
  MessageSquare,
  ArrowUpRight,
  Download,
} from 'lucide-react'

type TabType = 'follows' | 'activity' | 'content'

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState<TabType>('follows')
  const [followData, setFollowData] = useState<FollowAnalytics | null>(null)
  const [activityData, setActivityData] = useState<ActivityAnalytics | null>(null)
  const [contentData, setContentData] = useState<ContentAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (tab: TabType, forceRefresh = false) => {
    setLoading(true)
    setError(null)
    try {
      switch (tab) {
        case 'follows':
          if (forceRefresh || !followData) {
            const response = await adminAnalyticsService.getFollowAnalytics()
            if (response.success && response.data) {
              setFollowData(response.data)
            }
          }
          break
        case 'activity':
          if (forceRefresh || !activityData) {
            const response = await adminAnalyticsService.getActivityAnalytics()
            if (response.success && response.data) {
              setActivityData(response.data)
            }
          }
          break
        case 'content':
          if (forceRefresh || !contentData) {
            const response = await adminAnalyticsService.getContentAnalytics()
            if (response.success && response.data) {
              setContentData(response.data)
            }
          }
          break
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗')
    } finally {
      setLoading(false)
    }
  }, [followData, activityData, contentData])

  const refreshData = async () => {
    setFollowData(null)
    setActivityData(null)
    setContentData(null)
    await loadData(activeTab, true)
  }

  useEffect(() => {
    loadData(activeTab)
  }, [activeTab, loadData])

  const tabs = [
    { id: 'follows' as TabType, label: '追蹤分析', icon: Users },
    { id: 'activity' as TabType, label: '活躍度分析', icon: Activity },
    { id: 'content' as TabType, label: '內容分析', icon: FileText },
  ]

  // 導出 CSV 功能
  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (!data || data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header]
          const strValue = value === null || value === undefined ? '' : String(value)
          return strValue.includes(',') || strValue.includes('"')
            ? `"${strValue.replace(/"/g, '""')}"`
            : strValue
        }).join(',')
      ),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleExport = () => {
    switch (activeTab) {
      case 'follows':
        if (followData) {
          // 導出追蹤趨勢
          exportToCSV(
            followData.dailyTrend.map((d) => ({ 日期: d.date, 追蹤數: d.count })),
            '追蹤趨勢'
          )
        }
        break
      case 'activity':
        if (activityData) {
          // 導出活躍用戶趨勢
          const combinedData = activityData.dailyActiveUsers.map((d, i) => ({
            日期: d.date,
            活躍用戶: d.count,
            新用戶: activityData.dailyNewUsers[i]?.count || 0,
          }))
          exportToCSV(combinedData, '用戶活躍度')
        }
        break
      case 'content':
        if (contentData) {
          // 導出內容趨勢
          const combinedData = contentData.dailyPosts.map((d, i) => ({
            日期: d.date,
            文章數: d.count,
            人物誌數: contentData.dailyBiographies[i]?.count || 0,
          }))
          exportToCSV(combinedData, '內容趨勢')
        }
        break
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="h-12 w-12 text-brand-red-100 mb-4" />
        <h3 className="text-lg font-medium text-wb-100 mb-2">無法載入資料</h3>
        <p className="text-wb-70 mb-4">{error}</p>
        <button
          onClick={refreshData}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          重試
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-wb-100">數據分析</h1>
          <p className="text-wb-70 mt-1">追蹤、活躍度與內容趨勢分析</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            導出 CSV
          </button>
          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm text-wb-70 hover:text-wb-100 hover:bg-wb-10 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            重新整理
          </button>
        </div>
      </div>

      {/* Tab 切換 */}
      <div className="border-b border-wb-20">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-wb-70 hover:text-wb-100 hover:border-wb-30'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab 內容 */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-wb-60" />
        </div>
      ) : (
        <>
          {activeTab === 'follows' && followData && (
            <FollowAnalyticsPanel data={followData} />
          )}
          {activeTab === 'activity' && activityData && (
            <ActivityAnalyticsPanel data={activityData} />
          )}
          {activeTab === 'content' && contentData && (
            <ContentAnalyticsPanel data={contentData} />
          )}
        </>
      )}
    </div>
  )
}

// 追蹤分析面板
function FollowAnalyticsPanel({ data }: { data: FollowAnalytics }) {
  const { summary, dailyTrend, topFollowed, topFollowers } = data

  return (
    <div className="space-y-6">
      {/* 統計摘要 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="總追蹤關係"
          value={summary.totalFollows}
          icon={Users}
          color="bg-brand-yellow-200"
        />
        <StatCard
          title="不重複追蹤者"
          value={summary.uniqueFollowers}
          icon={UserPlus}
          color="bg-wb-90"
        />
        <StatCard
          title="互相追蹤"
          value={summary.mutualFollows}
          icon={Heart}
          color="bg-brand-red-100"
        />
        <StatCard
          title="本月新增"
          value={summary.followsMonth}
          icon={TrendingUp}
          color="bg-brand-yellow-100"
          subtitle={`本週 ${summary.followsWeek} | 今日 ${summary.followsToday}`}
        />
      </div>

      {/* 趨勢圖表 */}
      <div className="bg-white rounded-lg shadow-sm border border-wb-20 p-6">
        <h3 className="font-semibold text-wb-100 mb-4">追蹤趨勢（過去 30 天）</h3>
        <SimpleTrendChart data={dailyTrend} color="#FA9F17" />
      </div>

      {/* 排行榜 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 被追蹤排行 */}
        <div className="bg-white rounded-lg shadow-sm border border-wb-20 p-6">
          <h3 className="font-semibold text-wb-100 mb-4">最多追蹤者</h3>
          <div className="space-y-3">
            {topFollowed.length === 0 ? (
              <p className="text-wb-70 text-sm">暫無資料</p>
            ) : (
              topFollowed.map((user, index) => (
                <div key={user.id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                    index < 3 ? 'bg-brand-yellow-100 text-brand-dark' : 'bg-wb-10 text-wb-70'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-wb-20 flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="h-4 w-4 text-wb-60" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-wb-100 truncate">
                      {user.display_name || user.username}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-brand-yellow-200">
                    {user.follower_count.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 活躍追蹤者排行 */}
        <div className="bg-white rounded-lg shadow-sm border border-wb-20 p-6">
          <h3 className="font-semibold text-wb-100 mb-4">最活躍追蹤者</h3>
          <div className="space-y-3">
            {topFollowers.length === 0 ? (
              <p className="text-wb-70 text-sm">暫無資料</p>
            ) : (
              topFollowers.map((user, index) => (
                <div key={user.id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                    index < 3 ? 'bg-brand-yellow-200/20 text-brand-yellow-200' : 'bg-wb-10 text-wb-70'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-wb-20 flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="h-4 w-4 text-wb-60" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-wb-100 truncate">
                      {user.display_name || user.username}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-wb-90">
                    追蹤 {user.following_count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 活躍度分析面板
function ActivityAnalyticsPanel({ data }: { data: ActivityAnalytics }) {
  const { summary, dailyActiveUsers, dailyNewUsers, activityBreakdown } = data

  return (
    <div className="space-y-6">
      {/* DAU/WAU/MAU */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="日活躍用戶 (DAU)"
          value={summary.dau}
          icon={Users}
          color="bg-brand-yellow-200"
        />
        <StatCard
          title="週活躍用戶 (WAU)"
          value={summary.wau}
          icon={Activity}
          color="bg-wb-90"
        />
        <StatCard
          title="月活躍用戶 (MAU)"
          value={summary.mau}
          icon={TrendingUp}
          color="bg-brand-yellow-100"
        />
        <StatCard
          title="用戶留存率"
          value={`${summary.retentionRate}%`}
          icon={Target}
          color="bg-brand-yellow-200"
        />
      </div>

      {/* 新用戶統計 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="總用戶數"
          value={summary.totalUsers}
          icon={Users}
          color="bg-wb-70"
        />
        <StatCard
          title="活躍帳號"
          value={summary.activeUsers}
          icon={Activity}
          color="bg-wb-90"
        />
        <StatCard
          title="本月新用戶"
          value={summary.newUsersMonth}
          icon={UserPlus}
          color="bg-brand-yellow-200"
        />
        <StatCard
          title="本週新用戶"
          value={summary.newUsersWeek}
          icon={UserPlus}
          color="bg-brand-yellow-100"
          subtitle={`今日 ${summary.newUsersToday}`}
        />
      </div>

      {/* 活躍用戶趨勢 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-wb-20 p-6">
          <h3 className="font-semibold text-wb-100 mb-4">每日活躍用戶趨勢</h3>
          <SimpleTrendChart data={dailyActiveUsers} color="#FA9F17" />
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-wb-20 p-6">
          <h3 className="font-semibold text-wb-100 mb-4">每日新用戶趨勢</h3>
          <SimpleTrendChart data={dailyNewUsers} color="#FFE70C" />
        </div>
      </div>

      {/* 用戶活動分佈 */}
      <div className="bg-white rounded-lg shadow-sm border border-wb-20 p-6">
        <h3 className="font-semibold text-wb-100 mb-4">過去 7 天用戶活動分佈</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <ActivityBreakdownCard
            icon={FileText}
            label="文章發布"
            value={activityBreakdown.postsWeek}
            color="text-brand-yellow-200 bg-brand-yellow-100/10"
          />
          <ActivityBreakdownCard
            icon={Target}
            label="目標設定"
            value={activityBreakdown.goalsWeek}
            color="text-wb-90 bg-wb-90/10"
          />
          <ActivityBreakdownCard
            icon={Mountain}
            label="按讚"
            value={activityBreakdown.likesWeek}
            color="text-brand-red-100 bg-brand-red-100/10"
          />
          <ActivityBreakdownCard
            icon={MessageSquare}
            label="留言"
            value={activityBreakdown.commentsWeek}
            color="text-brand-yellow-200 bg-brand-yellow-200/10"
          />
          <ActivityBreakdownCard
            icon={Users}
            label="追蹤"
            value={activityBreakdown.followsWeek}
            color="text-wb-70 bg-wb-70/10"
          />
        </div>
      </div>
    </div>
  )
}

// 內容分析面板
function ContentAnalyticsPanel({ data }: { data: ContentAnalytics }) {
  const { summary, dailyPosts, dailyBiographies, topBiographies, topPosts, categoryDistribution } = data

  return (
    <div className="space-y-6">
      {/* 內容統計摘要 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="已發布文章"
          value={summary.publishedPosts}
          icon={FileText}
          color="bg-brand-yellow-200"
          subtitle={`草稿 ${summary.draftPosts} | 本週 ${summary.postsWeek}`}
        />
        <StatCard
          title="公開人物誌"
          value={summary.publicBiographies}
          icon={Users}
          color="bg-wb-90"
          subtitle={`總計 ${summary.totalBiographies}`}
        />
        <StatCard
          title="總瀏覽數"
          value={summary.totalViews?.toLocaleString() || '0'}
          icon={Eye}
          color="bg-brand-yellow-100"
        />
        <StatCard
          title="總按讚數"
          value={summary.totalLikes?.toLocaleString() || '0'}
          icon={Mountain}
          color="bg-brand-red-100"
        />
      </div>

      {/* 內容趨勢 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-wb-20 p-6">
          <h3 className="font-semibold text-wb-100 mb-4">每日文章發布趨勢</h3>
          <SimpleTrendChart data={dailyPosts} color="#FA9F17" />
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-wb-20 p-6">
          <h3 className="font-semibold text-wb-100 mb-4">每日人物誌建立趨勢</h3>
          <SimpleTrendChart data={dailyBiographies} color="#FFE70C" />
        </div>
      </div>

      {/* 分類分佈 */}
      {categoryDistribution.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-wb-20 p-6">
          <h3 className="font-semibold text-wb-100 mb-4">文章分類分佈</h3>
          <div className="flex flex-wrap gap-3">
            {categoryDistribution.map((cat) => (
              <div
                key={cat.category || 'uncategorized'}
                className="px-4 py-2 bg-wb-10 rounded-lg"
              >
                <span className="text-sm text-wb-70">{cat.category || '未分類'}</span>
                <span className="ml-2 text-sm font-semibold text-wb-100">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 排行榜 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 熱門人物誌 */}
        <div className="bg-white rounded-lg shadow-sm border border-wb-20 p-6">
          <h3 className="font-semibold text-wb-100 mb-4">熱門人物誌</h3>
          <div className="space-y-3">
            {topBiographies.length === 0 ? (
              <p className="text-wb-70 text-sm">暫無資料</p>
            ) : (
              topBiographies.slice(0, 5).map((bio, index) => (
                <Link
                  key={bio.id}
                  href={`/biography/${bio.username}`}
                  className="flex items-center gap-3 hover:bg-wb-10 p-2 -mx-2 rounded-lg transition-colors"
                >
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                    index < 3 ? 'bg-brand-yellow-100 text-brand-dark' : 'bg-wb-10 text-wb-70'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-wb-20 flex items-center justify-center overflow-hidden">
                    {bio.avatar ? (
                      <img src={bio.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="h-4 w-4 text-wb-60" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-wb-100 truncate">
                      {bio.display_name || bio.username}
                    </p>
                    <p className="text-xs text-wb-70">
                      {(bio.total_views || 0).toLocaleString()} 瀏覽 · {bio.follower_count || 0} 追蹤
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-wb-60" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* 熱門文章 */}
        <div className="bg-white rounded-lg shadow-sm border border-wb-20 p-6">
          <h3 className="font-semibold text-wb-100 mb-4">熱門文章</h3>
          <div className="space-y-3">
            {topPosts.length === 0 ? (
              <p className="text-wb-70 text-sm">暫無資料</p>
            ) : (
              topPosts.slice(0, 5).map((post, index) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="flex items-center gap-3 hover:bg-wb-10 p-2 -mx-2 rounded-lg transition-colors"
                >
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                    index < 3 ? 'bg-brand-yellow-100 text-brand-dark' : 'bg-wb-10 text-wb-70'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-wb-100 truncate">{post.title}</p>
                    <p className="text-xs text-wb-70">
                      {post.author_name} · {(post.views || 0).toLocaleString()} 瀏覽
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-wb-60" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 統計卡片組件
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string
  value: number | string
  icon: React.ElementType
  color: string
  subtitle?: string
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-wb-20 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-wb-70 mb-1">{title}</p>
          <p className="text-2xl font-bold text-wb-100">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && <p className="text-xs text-wb-60 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 ${color} rounded-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  )
}

// 活動分佈卡片
function ActivityBreakdownCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
}) {
  return (
    <div className="text-center p-4 bg-wb-10 rounded-lg">
      <div className={`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-wb-100">{value.toLocaleString()}</p>
      <p className="text-xs text-wb-70">{label}</p>
    </div>
  )
}

// 簡易趨勢圖表
function SimpleTrendChart({
  data,
  color,
}: {
  data: Array<{ date: string; count: number }>
  color: string
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-wb-60 text-sm">
        暫無資料
      </div>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const avg = Math.round(total / data.length)

  return (
    <div>
      <div className="flex items-end gap-1 h-40">
        {data.map((item) => {
          const height = (item.count / maxCount) * 100
          return (
            <div
              key={item.date}
              className="flex-1 group relative"
            >
              <div
                className="w-full rounded-t transition-all hover:opacity-80"
                style={{
                  height: `${Math.max(height, 2)}%`,
                  backgroundColor: color,
                }}
              />
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                <div className="bg-wb-100 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  {item.date}: {item.count}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs text-wb-60">
        <span>{data[0]?.date}</span>
        <span>總計 {total.toLocaleString()} | 平均 {avg}/日</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  )
}
