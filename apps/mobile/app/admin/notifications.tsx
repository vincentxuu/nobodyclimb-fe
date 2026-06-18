import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bell,
  Clock,
  RefreshCw,
  TrendingUp,
  User,
  Users,
} from 'lucide-react-native'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, EmptyState, Text } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAdminNotificationStats } from '@/lib/hooks/useAdminDashboard'
import { useAuthStore } from '@/store/authStore'

const typeLabels: Record<string, string> = {
  goal_liked: '目標按讚',
  goal_commented: '目標留言',
  goal_referenced: '目標參考',
  post_liked: '文章按讚',
  post_commented: '文章留言',
  biography_commented: '人物誌留言',
  new_follower: '新追蹤者',
  story_featured: '故事精選',
  goal_completed: '目標完成',
}

interface MetricCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
}

function MetricCard({ label, value, icon }: MetricCardProps) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>{icon}</View>
      <View>
        <Text variant="caption" color="textSubtle">
          {label}
        </Text>
        <Text variant="h3" fontWeight="700">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Text>
      </View>
    </View>
  )
}

export default function AdminNotificationsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)
  const { data: stats, isLoading, error } = useAdminNotificationStats()

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'

  const readRate = useMemo(() => {
    if (!stats || stats.overview.total === 0) return 0
    return Math.round(((stats.overview.total - stats.overview.unread) / stats.overview.total) * 100)
  }, [stats])

  const peakHour = useMemo(() => {
    if (!stats?.hourlyTrend.length) return null
    return stats.hourlyTrend.reduce((max, item) => (item.count > max.count ? item : max), {
      hour: '',
      count: 0,
    })
  }, [stats])

  const maxTypeCount = useMemo(
    () => Math.max(...(stats?.byType.map((item) => item.count) ?? [1]), 1),
    [stats]
  )
  const maxHourlyCount = useMemo(
    () => Math.max(...(stats?.hourlyTrend.map((item) => item.count) ?? [1]), 1),
    [stats]
  )

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['admin-notification-stats'] })
    setRefreshing(false)
  }, [queryClient])

  if (!isAuthenticated || !isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navbar}>
          <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onPress={() => router.back()}>
            返回
          </Button>
        </View>
        <EmptyState
          icon={Bell}
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
          <Bell size={18} color={SEMANTIC_COLORS.textMain} />
          <Text variant="h4" fontWeight="600">
            通知監控
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
            通知系統監控
          </Text>
          <Text variant="body" color="textSubtle">
            過去 24 小時的通知發送、已讀狀態、類型分佈與主要接收者。
          </Text>
        </View>

        {isLoading ? (
          <LoadingSpinner size="large" style={styles.loading} />
        ) : error || !stats ? (
          <EmptyState
            icon={Activity}
            title="無法載入通知資料"
            description="請稍後重試，或確認帳號權限是否仍有效。"
            actionLabel="重新載入"
            onAction={handleRefresh}
            style={styles.stateCard}
          />
        ) : (
          <>
            <View style={styles.metricGrid}>
              <MetricCard
                label="發送總數"
                value={stats.overview.total}
                icon={<Bell size={20} color={SEMANTIC_COLORS.textMain} />}
              />
              <MetricCard
                label="未讀通知"
                value={stats.overview.unread}
                icon={<Activity size={20} color={SEMANTIC_COLORS.textMain} />}
              />
              <MetricCard
                label="有通知用戶"
                value={stats.overview.usersWithNotifications}
                icon={<Users size={20} color={SEMANTIC_COLORS.textMain} />}
              />
              <MetricCard
                label="已讀率"
                value={`${readRate}%`}
                icon={<TrendingUp size={20} color={SEMANTIC_COLORS.textMain} />}
              />
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <BarChart3 size={18} color={SEMANTIC_COLORS.textSubtle} />
                <Text variant="bodyBold">按類型統計</Text>
              </View>
              {stats.byType.length > 0 ? (
                <View style={styles.barList}>
                  {stats.byType.map((item) => (
                    <View key={item.type} style={styles.barItem}>
                      <View style={styles.barLabelRow}>
                        <Text variant="caption" color="textSubtle">
                          {typeLabels[item.type] || item.type}
                        </Text>
                        <Text variant="caption" fontWeight="600">
                          {item.count}
                        </Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${Math.max(4, (item.count / maxTypeCount) * 100)}%` },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text variant="body" color="textSubtle" align="center" style={styles.emptyText}>
                  過去 24 小時沒有通知
                </Text>
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeaderBetween}>
                <View style={styles.cardHeader}>
                  <Clock size={18} color={SEMANTIC_COLORS.textSubtle} />
                  <Text variant="bodyBold">24 小時趨勢</Text>
                </View>
                {peakHour?.hour ? (
                  <Text variant="caption" color="textMuted">
                    尖峰 {formatHour(peakHour.hour)} ({peakHour.count})
                  </Text>
                ) : null}
              </View>
              {stats.hourlyTrend.length > 0 ? (
                <View style={styles.hourChart}>
                  {stats.hourlyTrend.map((item, index) => (
                    <View key={`${item.hour}-${index}`} style={styles.hourColumn}>
                      <View style={styles.hourBarContainer}>
                        <View
                          style={[
                            styles.hourBar,
                            {
                              height: `${Math.max(3, (item.count / maxHourlyCount) * 100)}%`,
                            },
                          ]}
                        />
                      </View>
                      {index % 4 === 0 && (
                        <Text variant="caption" color="textMuted" style={styles.hourLabel}>
                          {formatHour(item.hour)}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <Text variant="body" color="textSubtle" align="center" style={styles.emptyText}>
                  過去 24 小時沒有通知
                </Text>
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <User size={18} color={SEMANTIC_COLORS.textSubtle} />
                <Text variant="bodyBold">通知最多的用戶</Text>
              </View>
              {stats.topRecipients.length > 0 ? (
                <View style={styles.recipientList}>
                  {stats.topRecipients.map((recipient, index) => (
                    <View key={recipient.user_id} style={styles.recipientItem}>
                      <View style={[styles.rankBadge, rankStyle(index)]}>
                        <Text variant="caption" fontWeight="700" style={styles.rankText}>
                          {index + 1}
                        </Text>
                      </View>
                      <View style={styles.recipientInfo}>
                        <Text variant="bodyBold" numberOfLines={1}>
                          {recipient.display_name || recipient.username}
                        </Text>
                        {recipient.display_name && (
                          <Text variant="caption" color="textMuted" numberOfLines={1}>
                            @{recipient.username}
                          </Text>
                        )}
                      </View>
                      <Text variant="bodyBold">{recipient.notification_count}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text variant="body" color="textSubtle" align="center" style={styles.emptyText}>
                  過去 24 小時沒有用戶收到通知
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function formatHour(value: string) {
  return value.split(' ')[1]?.replace(':00', '') || value
}

function rankStyle(index: number) {
  if (index === 0) return { backgroundColor: '#EAB308' }
  if (index === 1) return { backgroundColor: WB_COLORS[50] }
  if (index === 2) return { backgroundColor: '#F97316' }
  return { backgroundColor: WB_COLORS[20] }
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
  loading: {
    paddingVertical: 80,
  },
  fullState: {
    flex: 1,
  },
  stateCard: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  metricCard: {
    width: '47%',
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WB_COLORS[10],
  },
  card: {
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  cardHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  barList: {
    gap: SPACING.md,
  },
  barItem: {
    gap: 6,
  },
  barLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barTrack: {
    height: 8,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: WB_COLORS[10],
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  hourChart: {
    height: 180,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  hourColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
  },
  hourBarContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  hourBar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  hourLabel: {
    minHeight: 18,
    marginTop: 4,
    fontSize: 9,
  },
  recipientList: {
    gap: SPACING.sm,
  },
  recipientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: WB_COLORS[10],
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: WB_COLORS[0],
  },
  recipientInfo: {
    flex: 1,
  },
  emptyText: {
    paddingVertical: SPACING.xl,
  },
})
