import { SEMANTIC_COLORS, WB_COLORS } from '@nobodyclimb/constants'
import { BarChart3, Bell, CheckCircle, Inbox, TrendingUp } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native'
import { apiClient } from '@/lib/api'
import { Icon } from '../ui/Icon'
import { Text } from '../ui/Text'

interface NotificationStatsData {
  overview: {
    total: number
    unread: number
    read: number
    readRate: number
  }
  byType: Array<{ type: string; count: number }>
  dailyTrend: Array<{ date: string; count: number }>
}

const TYPE_LABELS: Record<string, string> = {
  goal_liked: '目標按讚',
  goal_commented: '目標留言',
  goal_referenced: '目標引用',
  post_liked: '文章按讚',
  post_commented: '文章留言',
  biography_commented: '人物誌留言',
  new_follower: '新追蹤者',
  story_featured: '故事精選',
  goal_completed: '目標完成',
}

export default function NotificationStats() {
  const [stats, setStats] = useState<NotificationStatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await apiClient.get('/notifications/stats')
        const data = response.data?.data ?? response.data
        if (data) {
          setStats(data)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : '請稍後再試'
        Alert.alert('通知統計載入失敗', message)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="small" color={SEMANTIC_COLORS.textMain} />
      </View>
    )
  }

  if (!stats) {
    return (
      <View style={styles.emptyContainer}>
        <Icon icon={BarChart3} size="md" color={SEMANTIC_COLORS.textMuted} />
        <Text variant="caption" style={{ color: SEMANTIC_COLORS.textMuted }}>
          無法載入通知統計
        </Text>
      </View>
    )
  }

  const maxTypeCount = Math.max(...stats.byType.map((item) => item.count), 1)
  const maxDailyCount = Math.max(...stats.dailyTrend.map((day) => day.count), 1)

  return (
    <View style={styles.container}>
      <View style={styles.summaryGrid}>
        <View style={styles.statItem}>
          <View style={[styles.iconWrapper, styles.totalIcon]}>
            <Icon icon={Inbox} size="sm" color={WB_COLORS[0]} />
          </View>
          <View style={styles.statInfo}>
            <Text variant="h3" style={{ color: SEMANTIC_COLORS.textMain }}>
              {stats.overview.total}
            </Text>
            <Text variant="caption" style={{ color: SEMANTIC_COLORS.textMuted }}>
              總通知數
            </Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.iconWrapper, styles.unreadIcon]}>
            <Icon icon={Bell} size="sm" color={WB_COLORS[0]} />
          </View>
          <View style={styles.statInfo}>
            <Text variant="h3" style={{ color: SEMANTIC_COLORS.textMain }}>
              {stats.overview.unread}
            </Text>
            <Text variant="caption" style={{ color: SEMANTIC_COLORS.textMuted }}>
              未讀通知
            </Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.iconWrapper, styles.readIcon]}>
            <Icon icon={CheckCircle} size="sm" color={WB_COLORS[0]} />
          </View>
          <View style={styles.statInfo}>
            <Text variant="h3" style={{ color: SEMANTIC_COLORS.textMain }}>
              {stats.overview.read}
            </Text>
            <Text variant="caption" style={{ color: SEMANTIC_COLORS.textMuted }}>
              已讀通知
            </Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.iconWrapper, styles.rateIcon]}>
            <Icon icon={TrendingUp} size="sm" color={WB_COLORS[0]} />
          </View>
          <View style={styles.statInfo}>
            <Text variant="h3" style={{ color: SEMANTIC_COLORS.textMain }}>
              {stats.overview.readRate}%
            </Text>
            <Text variant="caption" style={{ color: SEMANTIC_COLORS.textMuted }}>
              已讀率
            </Text>
          </View>
        </View>
      </View>

      {stats.byType.length > 0 && (
        <View style={styles.section}>
          <Text variant="bodyBold" style={{ color: SEMANTIC_COLORS.textMain }}>
            類型分布
          </Text>
          {stats.byType.map((item) => (
            <View key={item.type} style={styles.typeRow}>
              <Text variant="caption" style={styles.typeLabel}>
                {TYPE_LABELS[item.type] ?? item.type}
              </Text>
              <View style={styles.typeBarTrack}>
                <View
                  style={[
                    styles.typeBarFill,
                    { width: `${Math.max((item.count / maxTypeCount) * 100, 4)}%` },
                  ]}
                />
              </View>
              <Text variant="caption" style={styles.typeCount}>
                {item.count}
              </Text>
            </View>
          ))}
        </View>
      )}

      {stats.dailyTrend.length > 0 && (
        <View style={styles.section}>
          <Text variant="bodyBold" style={{ color: SEMANTIC_COLORS.textMain }}>
            最近 7 天
          </Text>
          <View style={styles.trendChart}>
            {stats.dailyTrend.map((day) => {
              const date = new Date(day.date)
              const label = Number.isNaN(date.getTime())
                ? day.date
                : `${date.getMonth() + 1}/${date.getDate()}`
              const height = Math.max((day.count / maxDailyCount) * 72, 4)

              return (
                <View key={day.date} style={styles.trendDay}>
                  <Text variant="caption" style={styles.trendCount}>
                    {day.count}
                  </Text>
                  <View style={styles.trendBarTrack}>
                    <View style={[styles.trendBarFill, { height }]} />
                  </View>
                  <Text variant="caption" style={styles.trendLabel}>
                    {label}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>
      )}

      {stats.overview.total === 0 && (
        <View style={styles.emptyInline}>
          <Text variant="caption" style={{ color: SEMANTIC_COLORS.textMuted }}>
            目前沒有通知紀錄
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: WB_COLORS[0],
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  emptyContainer: {
    backgroundColor: WB_COLORS[0],
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: WB_COLORS[10],
    borderRadius: 10,
    padding: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadIcon: {
    backgroundColor: SEMANTIC_COLORS.error, // red-500
  },
  totalIcon: {
    backgroundColor: SEMANTIC_COLORS.info, // blue-500
  },
  readIcon: {
    backgroundColor: SEMANTIC_COLORS.success,
  },
  rateIcon: {
    backgroundColor: SEMANTIC_COLORS.warning,
  },
  statInfo: {
    gap: 2,
    flex: 1,
  },
  section: {
    gap: 10,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeLabel: {
    width: 72,
    color: SEMANTIC_COLORS.textMuted,
  },
  typeBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: WB_COLORS[20],
    overflow: 'hidden',
  },
  typeBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: SEMANTIC_COLORS.info,
  },
  typeCount: {
    width: 32,
    textAlign: 'right',
    color: SEMANTIC_COLORS.textMain,
  },
  trendChart: {
    height: 112,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  trendDay: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  trendCount: {
    color: SEMANTIC_COLORS.textMuted,
  },
  trendBarTrack: {
    height: 72,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: WB_COLORS[10],
    overflow: 'hidden',
  },
  trendBarFill: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: SEMANTIC_COLORS.info,
  },
  trendLabel: {
    color: SEMANTIC_COLORS.textMuted,
  },
  emptyInline: {
    alignItems: 'center',
  },
})
