import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Download,
  Eye,
  FileText,
  Heart,
  MessageSquare,
  Mountain,
  RefreshCw,
  Target,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react-native'
import React, { useCallback, useMemo, useState } from 'react'
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, EmptyState, Text } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  type ActivityAnalytics,
  type ContentAnalytics,
  type FollowAnalytics,
  useActivityAnalytics,
  useContentAnalytics,
  useFollowAnalytics,
} from '@/lib/hooks/useAdminDashboard'
import { useAuthStore } from '@/store/authStore'

type TabType = 'follows' | 'activity' | 'content'

const tabs: Array<{ id: TabType; label: string }> = [
  { id: 'follows', label: '追蹤分析' },
  { id: 'activity', label: '活躍度' },
  { id: 'content', label: '內容分析' },
]

export default function AdminAnalyticsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabType>('follows')
  const [refreshing, setRefreshing] = useState(false)

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'
  const followQuery = useFollowAnalytics()
  const activityQuery = useActivityAnalytics()
  const contentQuery = useContentAnalytics()

  const activeState = useMemo(() => {
    if (activeTab === 'follows') return followQuery
    if (activeTab === 'activity') return activityQuery
    return contentQuery
  }, [activeTab, activityQuery, contentQuery, followQuery])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['admin-analytics'] })
    setRefreshing(false)
  }, [queryClient])

  const handleExport = useCallback(async () => {
    const exportData = getExportRows(
      activeTab,
      followQuery.data,
      activityQuery.data,
      contentQuery.data
    )
    if (exportData.rows.length === 0) {
      Alert.alert('無可匯出的資料', '目前分頁沒有可匯出的分析資料。')
      return
    }

    await Share.share({
      title: `${exportData.filename}.csv`,
      message: toCsv(exportData.rows),
    })
  }, [activeTab, activityQuery.data, contentQuery.data, followQuery.data])

  if (!isAuthenticated || !isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navbar}>
          <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onPress={() => router.back()}>
            返回
          </Button>
        </View>
        <EmptyState
          icon={BarChart3}
          title="需要管理員權限"
          description="請使用具備管理權限的帳號登入。"
          actionLabel="回到管理後台"
          onAction={() => router.replace('/admin' as never)}
          style={styles.fullState}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.navbar}>
        <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onPress={() => router.back()}>
          返回
        </Button>
        <View style={styles.navTitle}>
          <BarChart3 size={18} color={SEMANTIC_COLORS.textMain} />
          <Text variant="h4" fontWeight="600">
            數據分析
          </Text>
        </View>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={RefreshCw}
          onPress={handleRefresh}
          loading={refreshing}
          style={styles.refreshButton}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="h2" fontWeight="700">
            數據分析
          </Text>
          <Text variant="body" color="textSubtle">
            追蹤關係、用戶活躍度與內容成長趨勢。
          </Text>
          <View style={styles.headerActions}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={Download}
              onPress={handleExport}
              disabled={activeState.isLoading}
            >
              導出 CSV
            </Button>
          </View>
        </View>

        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text
                variant="caption"
                fontWeight="600"
                style={activeTab === tab.id ? styles.tabTextActive : styles.tabText}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeState.isLoading ? (
          <LoadingSpinner size="large" style={styles.loading} />
        ) : activeState.error ? (
          <EmptyState
            icon={Activity}
            title="無法載入分析資料"
            description="請稍後重試，或確認帳號權限是否仍有效。"
            actionLabel="重新載入"
            onAction={handleRefresh}
            style={styles.stateCard}
          />
        ) : (
          <>
            {activeTab === 'follows' && followQuery.data && (
              <FollowPanel data={followQuery.data as FollowAnalytics} />
            )}
            {activeTab === 'activity' && activityQuery.data && (
              <ActivityPanel data={activityQuery.data as ActivityAnalytics} />
            )}
            {activeTab === 'content' && contentQuery.data && (
              <ContentPanel data={contentQuery.data as ContentAnalytics} />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function FollowPanel({ data }: { data: FollowAnalytics }) {
  return (
    <View style={styles.panel}>
      <View style={styles.statsGrid}>
        <StatCard label="總追蹤關係" value={data.summary.totalFollows} icon={<Users />} />
        <StatCard label="追蹤者" value={data.summary.uniqueFollowers} icon={<UserPlus />} />
        <StatCard label="互相追蹤" value={data.summary.mutualFollows} icon={<Heart />} />
        <StatCard
          label="本月新增"
          value={data.summary.followsMonth}
          icon={<TrendingUp />}
          subtitle={`本週 ${data.summary.followsWeek} | 今日 ${data.summary.followsToday}`}
        />
      </View>
      <TrendCard title="追蹤趨勢（過去 30 天）" data={data.dailyTrend} />
      <RankCard
        title="最多追蹤者"
        items={data.topFollowed.map((item) => ({
          id: item.id,
          name: item.display_name || item.username,
          avatar: item.avatar,
          value: item.follower_count,
          suffix: '追蹤者',
        }))}
      />
      <RankCard
        title="最活躍追蹤者"
        items={data.topFollowers.map((item) => ({
          id: item.id,
          name: item.display_name || item.username,
          avatar: item.avatar,
          value: item.following_count,
          suffix: '追蹤中',
        }))}
      />
    </View>
  )
}

function getExportRows(
  activeTab: TabType,
  followData?: FollowAnalytics,
  activityData?: ActivityAnalytics,
  contentData?: ContentAnalytics
) {
  const date = new Date().toISOString().slice(0, 10)

  if (activeTab === 'follows' && followData) {
    return {
      filename: `追蹤趨勢_${date}`,
      rows: followData.dailyTrend.map((item) => ({
        日期: item.date,
        追蹤數: item.count,
      })),
    }
  }

  if (activeTab === 'activity' && activityData) {
    return {
      filename: `用戶活躍度_${date}`,
      rows: activityData.dailyActiveUsers.map((item, index) => ({
        日期: item.date,
        活躍用戶: item.count,
        新用戶: activityData.dailyNewUsers[index]?.count || 0,
      })),
    }
  }

  if (activeTab === 'content' && contentData) {
    return {
      filename: `內容趨勢_${date}`,
      rows: contentData.dailyPosts.map((item, index) => ({
        日期: item.date,
        文章數: item.count,
        人物誌數: contentData.dailyBiographies[index]?.count || 0,
      })),
    }
  }

  return { filename: `分析資料_${date}`, rows: [] as Array<Record<string, string | number>> }
}

function toCsv(rows: Array<Record<string, string | number>>) {
  const headers = Object.keys(rows[0] ?? {})
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          const text = value == null ? '' : String(value)
          return text.includes(',') || text.includes('"') || text.includes('\n')
            ? `"${text.replace(/"/g, '""')}"`
            : text
        })
        .join(',')
    ),
  ]
  return lines.join('\n')
}

function ActivityPanel({ data }: { data: ActivityAnalytics }) {
  return (
    <View style={styles.panel}>
      <View style={styles.statsGrid}>
        <StatCard label="DAU" value={data.summary.dau} icon={<Users />} />
        <StatCard label="WAU" value={data.summary.wau} icon={<Activity />} />
        <StatCard label="MAU" value={data.summary.mau} icon={<TrendingUp />} />
        <StatCard label="留存率" value={`${data.summary.retentionRate}%`} icon={<Target />} />
        <StatCard label="總用戶" value={data.summary.totalUsers} icon={<Users />} />
        <StatCard label="活躍帳號" value={data.summary.activeUsers} icon={<Activity />} />
        <StatCard
          label="本月新用戶"
          value={data.summary.newUsersMonth}
          icon={<UserPlus />}
          subtitle={`本週 ${data.summary.newUsersWeek} | 今日 ${data.summary.newUsersToday}`}
        />
      </View>
      <TrendCard title="每日活躍用戶趨勢" data={data.dailyActiveUsers} />
      <TrendCard title="每日新用戶趨勢" data={data.dailyNewUsers} />
      <View style={styles.card}>
        <Text variant="bodyBold" style={styles.cardTitle}>
          過去 7 天用戶活動分佈
        </Text>
        <View style={styles.breakdownGrid}>
          <BreakdownItem
            label="文章"
            value={data.activityBreakdown.postsWeek}
            icon={<FileText />}
          />
          <BreakdownItem label="目標" value={data.activityBreakdown.goalsWeek} icon={<Target />} />
          <BreakdownItem label="按讚" value={data.activityBreakdown.likesWeek} icon={<Heart />} />
          <BreakdownItem
            label="留言"
            value={data.activityBreakdown.commentsWeek}
            icon={<MessageSquare />}
          />
          <BreakdownItem label="追蹤" value={data.activityBreakdown.followsWeek} icon={<Users />} />
        </View>
      </View>
    </View>
  )
}

function ContentPanel({ data }: { data: ContentAnalytics }) {
  return (
    <View style={styles.panel}>
      <View style={styles.statsGrid}>
        <StatCard
          label="已發布文章"
          value={data.summary.publishedPosts}
          icon={<FileText />}
          subtitle={`草稿 ${data.summary.draftPosts} | 本週 ${data.summary.postsWeek}`}
        />
        <StatCard
          label="公開人物誌"
          value={data.summary.publicBiographies}
          icon={<Users />}
          subtitle={`總計 ${data.summary.totalBiographies}`}
        />
        <StatCard label="總瀏覽數" value={data.summary.totalViews} icon={<Eye />} />
        <StatCard label="總按讚數" value={data.summary.totalLikes} icon={<Mountain />} />
      </View>
      <TrendCard title="每日文章發布趨勢" data={data.dailyPosts} />
      <TrendCard title="每日人物誌建立趨勢" data={data.dailyBiographies} />
      {data.categoryDistribution.length > 0 && (
        <View style={styles.card}>
          <Text variant="bodyBold" style={styles.cardTitle}>
            文章分類分佈
          </Text>
          <View style={styles.categoryGrid}>
            {data.categoryDistribution.map((item) => (
              <View key={item.category || 'uncategorized'} style={styles.categoryPill}>
                <Text variant="caption" color="textSubtle">
                  {item.category || '未分類'}
                </Text>
                <Text variant="bodyBold">{item.count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      <RankCard
        title="熱門人物誌"
        items={data.topBiographies.slice(0, 5).map((item) => ({
          id: item.id,
          name: item.display_name || item.username,
          avatar: item.avatar,
          value: item.total_views || 0,
          suffix: '瀏覽',
          detail: `${item.follower_count || 0} 追蹤`,
        }))}
      />
      <RankCard
        title="熱門文章"
        items={data.topPosts.slice(0, 5).map((item) => ({
          id: item.id,
          name: item.title,
          value: item.views || 0,
          suffix: '瀏覽',
          detail: item.author_name,
        }))}
      />
    </View>
  )
}

function StatCard({
  label,
  value,
  icon,
  subtitle,
}: {
  label: string
  value: number | string
  icon: React.ReactElement<{ size?: number; color?: string }>
  subtitle?: string
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        {React.cloneElement(icon, { size: 20, color: SEMANTIC_COLORS.textMain })}
      </View>
      <View style={styles.statText}>
        <Text variant="caption" color="textSubtle">
          {label}
        </Text>
        <Text variant="h3" fontWeight="700">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Text>
        {subtitle && (
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  )
}

function TrendCard({
  title,
  data,
}: {
  title: string
  data: Array<{ date: string; count: number }>
}) {
  const max = Math.max(...data.map((item) => item.count), 1)
  const total = data.reduce((sum, item) => sum + item.count, 0)
  const avg = data.length > 0 ? Math.round(total / data.length) : 0

  return (
    <View style={styles.card}>
      <Text variant="bodyBold" style={styles.cardTitle}>
        {title}
      </Text>
      {data.length === 0 ? (
        <Text variant="body" color="textSubtle" align="center" style={styles.emptyText}>
          暫無資料
        </Text>
      ) : (
        <>
          <View style={styles.chart}>
            {data.map((item, index) => (
              <View key={`${item.date}-${index}`} style={styles.chartColumn}>
                <View
                  style={[styles.chartBar, { height: `${Math.max(3, (item.count / max) * 100)}%` }]}
                />
              </View>
            ))}
          </View>
          <View style={styles.chartSummary}>
            <Text variant="caption" color="textMuted">
              {data[0]?.date}
            </Text>
            <Text variant="caption" color="textSubtle">
              總計 {total.toLocaleString()} | 平均 {avg}/日
            </Text>
            <Text variant="caption" color="textMuted">
              {data[data.length - 1]?.date}
            </Text>
          </View>
        </>
      )}
    </View>
  )
}

function RankCard({
  title,
  items,
}: {
  title: string
  items: Array<{
    id: string
    name: string
    avatar?: string | null
    value: number
    suffix: string
    detail?: string
  }>
}) {
  return (
    <View style={styles.card}>
      <Text variant="bodyBold" style={styles.cardTitle}>
        {title}
      </Text>
      {items.length === 0 ? (
        <Text variant="body" color="textSubtle" align="center" style={styles.emptyText}>
          暫無資料
        </Text>
      ) : (
        <View style={styles.rankList}>
          {items.map((item, index) => (
            <View key={item.id} style={styles.rankItem}>
              <View style={[styles.rankBadge, index < 3 && styles.rankBadgeTop]}>
                <Text
                  variant="caption"
                  fontWeight="700"
                  style={index < 3 ? styles.rankTextTop : undefined}
                >
                  {index + 1}
                </Text>
              </View>
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Users size={16} color={SEMANTIC_COLORS.textMuted} />
                </View>
              )}
              <View style={styles.rankInfo}>
                <Text variant="bodyBold" numberOfLines={1}>
                  {item.name}
                </Text>
                {item.detail && (
                  <Text variant="caption" color="textMuted" numberOfLines={1}>
                    {item.detail}
                  </Text>
                )}
              </View>
              <Text variant="caption" color="textSubtle">
                {item.value.toLocaleString()} {item.suffix}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

function BreakdownItem({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: React.ReactElement<{ size?: number; color?: string }>
}) {
  return (
    <View style={styles.breakdownItem}>
      <View style={styles.breakdownIcon}>
        {React.cloneElement(icon, { size: 18, color: SEMANTIC_COLORS.textMain })}
      </View>
      <Text variant="h3" fontWeight="700">
        {value.toLocaleString()}
      </Text>
      <Text variant="caption" color="textSubtle">
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: WB_COLORS[20],
  },
  navTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    minWidth: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    gap: 6,
    marginBottom: SPACING.lg,
  },
  headerActions: {
    alignItems: 'flex-start',
    marginTop: SPACING.xs,
  },
  fullState: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: WB_COLORS[10],
  },
  tabButtonActive: {
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  tabText: {
    color: SEMANTIC_COLORS.textSubtle,
  },
  tabTextActive: {
    color: WB_COLORS[0],
  },
  loading: {
    paddingVertical: 80,
  },
  stateCard: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  panel: {
    gap: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statCard: {
    width: '47%',
    minHeight: 102,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WB_COLORS[10],
  },
  statText: {
    flex: 1,
  },
  card: {
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  cardTitle: {
    marginBottom: SPACING.md,
  },
  chart: {
    height: 160,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  chartColumn: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  chartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  rankList: {
    gap: SPACING.sm,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WB_COLORS[10],
  },
  rankBadgeTop: {
    backgroundColor: '#FACC15',
  },
  rankTextTop: {
    color: WB_COLORS[100],
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WB_COLORS[20],
  },
  rankInfo: {
    flex: 1,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  breakdownItem: {
    width: '47%',
    alignItems: 'center',
    gap: 4,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: WB_COLORS[10],
  },
  breakdownIcon: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WB_COLORS[0],
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryPill: {
    minWidth: 96,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: WB_COLORS[10],
  },
  emptyText: {
    paddingVertical: SPACING.xl,
  },
})
