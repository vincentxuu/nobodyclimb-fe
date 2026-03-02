/**
 * 社群統計組件
 *
 * 對應 apps/web/src/components/biography/stats/community-stats.tsx
 */
import React from 'react'
import { View, StyleSheet, Image, type ViewStyle } from 'react-native'
import {
  Users,
  Target,
  Trophy,
  BookOpen,
  Activity,
  TrendingUp,
  User,
} from 'lucide-react-native'
import { SEMANTIC_COLORS, WB_COLORS, BRAND_YELLOW } from '@nobodyclimb/constants'
import type { CommunityStats, LeaderboardItem } from '@nobodyclimb/types'
import { Text } from '../../ui/Text'
import { StatCard, BarChart, CircularProgress } from './progress-chart'

// ============================================
// CommunityStatsOverview 組件
// ============================================

export interface CommunityStatsOverviewProps {
  /** 社群統計資料 */
  stats: CommunityStats
  /** 自定義樣式 */
  style?: ViewStyle
}

export function CommunityStatsOverview({ stats, style }: CommunityStatsOverviewProps) {
  const goalCompletionRate =
    stats.total_goals > 0
      ? Math.round((stats.completed_goals / stats.total_goals) * 100)
      : 0

  return (
    <View style={[styles.container, style]}>
      {/* 主要統計數據 */}
      <View style={styles.statsGrid}>
        <StatCard
          value={stats.total_biographies}
          label="人物誌總數"
          icon={<Users size={20} color="#3b82f6" />}
          color="#dbeafe"
          style={styles.statCardItem}
        />
        <StatCard
          value={stats.total_goals}
          label="目標總數"
          icon={<Target size={20} color="#22c55e" />}
          color="#dcfce7"
          style={styles.statCardItem}
        />
        <StatCard
          value={stats.completed_goals}
          label="完成目標"
          icon={<Trophy size={20} color="#eab308" />}
          color="#fef9c3"
          style={styles.statCardItem}
        />
        <StatCard
          value={stats.total_stories}
          label="故事分享"
          icon={<BookOpen size={20} color="#f97316" />}
          color="#fed7aa"
          style={styles.statCardItem}
        />
        <StatCard
          value={stats.active_users_this_week}
          label="本週活躍"
          icon={<Activity size={20} color="#a855f7" />}
          color="#f3e8ff"
          style={{ ...styles.statCardItem, width: '100%' }}
        />
      </View>

      {/* 目標完成率與熱門分類 */}
      <View style={styles.chartsContainer}>
        {/* 目標完成率 */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <TrendingUp size={20} color="#22c55e" />
            <Text variant="bodyBold" style={styles.chartTitle}>
              社群目標完成率
            </Text>
          </View>
          <View style={styles.chartContent}>
            <CircularProgress
              value={goalCompletionRate}
              size="lg"
              color="#22c55e"
              bgColor="#e5e7eb"
            />
          </View>
          <View style={styles.completionStats}>
            <View style={[styles.completionItem, { backgroundColor: '#dcfce7' }]}>
              <Text variant="h3" style={{ color: '#16a34a' }}>
                {stats.completed_goals}
              </Text>
              <Text variant="caption" color="muted">
                已完成
              </Text>
            </View>
            <View style={[styles.completionItem, { backgroundColor: WB_COLORS[10] }]}>
              <Text variant="h3" color="subtle">
                {stats.total_goals - stats.completed_goals}
              </Text>
              <Text variant="caption" color="muted">
                進行中
              </Text>
            </View>
          </View>
        </View>

        {/* 熱門分類 */}
        <View style={styles.chartCard}>
          <Text variant="bodyBold" style={styles.chartTitle}>
            熱門目標分類
          </Text>
          {stats.trending_categories.length > 0 ? (
            <BarChart
              data={stats.trending_categories.map((cat, index) => ({
                label: cat.category,
                value: cat.count,
                color: ['#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899'][index % 5],
              }))}
              showValues
              style={styles.barChart}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Text variant="caption" color="muted">
                尚無分類數據
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

// ============================================
// Leaderboard 組件
// ============================================

export interface LeaderboardProps {
  /** 標題 */
  title: string
  /** 排行榜項目 */
  items: LeaderboardItem[]
  /** 數值標籤 */
  valueLabel?: string
  /** 自定義樣式 */
  style?: ViewStyle
}

export function Leaderboard({
  title,
  items,
  valueLabel = '分數',
  style,
}: LeaderboardProps) {
  if (items.length === 0) {
    return (
      <View style={[styles.leaderboardCard, style]}>
        <Text variant="bodyBold" style={styles.leaderboardTitle}>
          {title}
        </Text>
        <View style={styles.emptyLeaderboard}>
          <Text variant="caption" color="muted">
            尚無排行數據
          </Text>
        </View>
      </View>
    )
  }

  const getRankStyle = (index: number) => {
    if (index === 0) return { backgroundColor: '#fef9c3' }
    if (index === 1) return { backgroundColor: WB_COLORS[20] }
    if (index === 2) return { backgroundColor: '#fed7aa' }
    return {}
  }

  const getRankBadgeStyle = (index: number) => {
    if (index === 0) return { backgroundColor: '#eab308', color: WB_COLORS[0] }
    if (index === 1) return { backgroundColor: '#9ca3af', color: WB_COLORS[0] }
    if (index === 2) return { backgroundColor: '#f97316', color: WB_COLORS[0] }
    return { backgroundColor: WB_COLORS[20], color: SEMANTIC_COLORS.textSubtle }
  }

  return (
    <View style={[styles.leaderboardCard, style]}>
      <Text variant="bodyBold" style={styles.leaderboardTitle}>
        {title}
      </Text>
      <View style={styles.leaderboardList}>
        {items.map((item, index) => (
          <View key={item.biography_id} style={[styles.leaderboardItem, getRankStyle(index)]}>
            {/* 排名 */}
            <View style={[styles.rankBadge, { backgroundColor: getRankBadgeStyle(index).backgroundColor }]}>
              <Text
                variant="caption"
                style={{ color: getRankBadgeStyle(index).color, fontWeight: '700' }}
              >
                {item.rank}
              </Text>
            </View>

            {/* 頭像 */}
            <View style={styles.avatarContainer}>
              {item.avatar_url ? (
                <Image
                  source={{ uri: item.avatar_url }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <User size={16} color={SEMANTIC_COLORS.textMuted} />
                </View>
              )}
            </View>

            {/* 名稱 */}
            <View style={styles.nameContainer}>
              <Text variant="body" numberOfLines={1}>
                {item.name}
              </Text>
            </View>

            {/* 數值 */}
            <View style={styles.valueContainer}>
              <Text variant="bodyBold">{item.value}</Text>
              <Text variant="caption" color="muted">
                {valueLabel}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

// ============================================
// CommunityDashboard 組件
// ============================================

export interface CommunityDashboardProps {
  /** 社群統計 */
  stats: CommunityStats
  /** 排行榜資料 */
  leaderboards?: {
    goalsCompleted?: LeaderboardItem[]
    followers?: LeaderboardItem[]
    likesReceived?: LeaderboardItem[]
  }
  /** 自定義樣式 */
  style?: ViewStyle
}

export function CommunityDashboard({
  stats,
  leaderboards,
  style,
}: CommunityDashboardProps) {
  return (
    <View style={[styles.dashboardContainer, style]}>
      {/* 社群概況 */}
      <View style={styles.section}>
        <Text variant="h3" style={styles.sectionTitle}>
          社群概況
        </Text>
        <CommunityStatsOverview stats={stats} />
      </View>

      {/* 排行榜 */}
      {leaderboards && (
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            排行榜
          </Text>
          <View style={styles.leaderboardsContainer}>
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
          </View>
        </View>
      )}
    </View>
  )
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCardItem: {
    width: '47%',
  },
  chartsContainer: {
    gap: 16,
  },
  chartCard: {
    padding: 16,
    backgroundColor: WB_COLORS[0],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  chartTitle: {
    marginBottom: 16,
  },
  chartContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  completionStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  completionItem: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  barChart: {
    marginTop: 8,
  },
  emptyChart: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Leaderboard
  leaderboardCard: {
    padding: 16,
    backgroundColor: WB_COLORS[0],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  leaderboardTitle: {
    marginBottom: 16,
  },
  leaderboardList: {
    gap: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: WB_COLORS[20],
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameContainer: {
    flex: 1,
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  emptyLeaderboard: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Dashboard
  dashboardContainer: {
    gap: 32,
  },
  section: {},
  sectionTitle: {
    marginBottom: 16,
  },
  leaderboardsContainer: {
    gap: 16,
  },
})
