/**
 * 統計概覽組件
 *
 * 對應 apps/web/src/components/biography/stats/stats-overview.tsx
 */
import React from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import { Eye, Mountain, Users, Target, BookOpen, MapPin } from 'lucide-react-native'
import { SEMANTIC_COLORS, WB_COLORS, BRAND_YELLOW } from '@nobodyclimb/constants'
import { STORY_FIELD_COUNTS, type BiographyStats } from '@nobodyclimb/types'
import { Text } from '../../ui/Text'
import { CircularProgress, ProgressBar, StatCard } from './progress-chart'

// ============================================
// StatsOverview 組件
// ============================================

export interface StatsOverviewProps {
  /** 統計資料 */
  stats: BiographyStats
  /** 自定義樣式 */
  style?: ViewStyle
}

export function StatsOverview({ stats, style }: StatsOverviewProps) {
  // 計算故事完成度 - 使用共用常數
  const storyCompletionRate =
    ((stats.stories.core_completed + stats.stories.advanced_completed) / STORY_FIELD_COUNTS.TOTAL) *
    100

  // 計算目標完成率
  const goalCompletionRate =
    stats.bucket_list.total > 0
      ? (stats.bucket_list.completed / stats.bucket_list.total) * 100
      : 0

  return (
    <View style={[styles.container, style]}>
      {/* 主要統計數據 */}
      <View style={styles.statsGrid}>
        <StatCard
          value={stats.total_views}
          label="瀏覽次數"
          icon={<Eye size={20} color={SEMANTIC_COLORS.textMain} />}
          color={WB_COLORS[10]}
          style={styles.statCardItem}
        />
        <StatCard
          value={stats.total_likes}
          label="收到的讚"
          icon={<Mountain size={20} color={SEMANTIC_COLORS.textMain} />}
          color={`${BRAND_YELLOW[100]}33`}
          style={styles.statCardItem}
        />
        <StatCard
          value={stats.follower_count}
          label="追蹤者"
          icon={<Users size={20} color={SEMANTIC_COLORS.textMain} />}
          color={WB_COLORS[10]}
          style={styles.statCardItem}
        />
        <StatCard
          value={stats.bucket_list.completed}
          label="完成目標"
          icon={<Target size={20} color={SEMANTIC_COLORS.textMain} />}
          color={`${BRAND_YELLOW[100]}33`}
          style={styles.statCardItem}
        />
        <StatCard
          value={stats.stories.total}
          label="已分享故事"
          icon={<BookOpen size={20} color={SEMANTIC_COLORS.textMain} />}
          color={WB_COLORS[10]}
          style={styles.statCardItem}
        />
        <StatCard
          value={stats.locations_count}
          label="攀岩足跡"
          icon={<MapPin size={20} color={SEMANTIC_COLORS.textMain} />}
          color={`${BRAND_YELLOW[100]}33`}
          style={styles.statCardItem}
        />
      </View>

      {/* 進度圖表 */}
      <View style={styles.progressSection}>
        {/* 故事完成度 */}
        <View style={styles.progressCard}>
          <Text variant="bodyBold" style={styles.progressTitle}>
            故事完成度
          </Text>
          <View style={styles.progressContent}>
            <CircularProgress
              value={storyCompletionRate}
              size="lg"
              color={BRAND_YELLOW[100]}
            />
            <View style={styles.progressBars}>
              <ProgressBar
                value={stats.stories.core_completed}
                max={STORY_FIELD_COUNTS.CORE}
                label="核心故事"
                showLabel
                color={BRAND_YELLOW[100]}
              />
              <ProgressBar
                value={stats.stories.advanced_completed}
                max={STORY_FIELD_COUNTS.ADVANCED}
                label="進階故事"
                showLabel
                color={`${BRAND_YELLOW[100]}99`}
              />
            </View>
          </View>
        </View>

        {/* 目標達成率 */}
        <View style={styles.progressCard}>
          <Text variant="bodyBold" style={styles.progressTitle}>
            目標達成率
          </Text>
          <View style={styles.progressContent}>
            <CircularProgress
              value={goalCompletionRate}
              size="lg"
              color={SEMANTIC_COLORS.textMain}
            />
            <View style={styles.goalStats}>
              <View style={[styles.goalStatItem, { backgroundColor: `${BRAND_YELLOW[100]}33` }]}>
                <Text variant="caption" color="subtle">
                  已完成
                </Text>
                <Text variant="h3">{stats.bucket_list.completed}</Text>
              </View>
              <View style={[styles.goalStatItem, { backgroundColor: WB_COLORS[10] }]}>
                <Text variant="caption" color="subtle">
                  進行中
                </Text>
                <Text variant="h3">{stats.bucket_list.active}</Text>
              </View>
              <View style={[styles.goalStatItem, { backgroundColor: WB_COLORS[10] }]}>
                <Text variant="caption" color="subtle">
                  總計
                </Text>
                <Text variant="h3">{stats.bucket_list.total}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 社群互動 */}
      <View style={styles.socialCard}>
        <Text variant="bodyBold" style={styles.progressTitle}>
          社群互動
        </Text>
        <View style={styles.socialGrid}>
          <View style={[styles.socialItem, { backgroundColor: `${BRAND_YELLOW[100]}33` }]}>
            <Text variant="h2">{stats.follower_count}</Text>
            <Text variant="caption" color="muted">
              追蹤者
            </Text>
          </View>
          <View style={[styles.socialItem, { backgroundColor: WB_COLORS[10] }]}>
            <Text variant="h2">{stats.following_count}</Text>
            <Text variant="caption" color="muted">
              追蹤中
            </Text>
          </View>
          <View style={[styles.socialItem, { backgroundColor: `${BRAND_YELLOW[100]}33` }]}>
            <Text variant="h2">{stats.total_likes}</Text>
            <Text variant="caption" color="muted">
              收到的讚
            </Text>
          </View>
          <View style={[styles.socialItem, { backgroundColor: WB_COLORS[10] }]}>
            <Text variant="h2">{stats.total_views}</Text>
            <Text variant="caption" color="muted">
              瀏覽次數
            </Text>
          </View>
        </View>
      </View>
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
  progressSection: {
    gap: 16,
  },
  progressCard: {
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
  progressTitle: {
    marginBottom: 16,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  progressBars: {
    flex: 1,
    gap: 12,
  },
  goalStats: {
    flex: 1,
    gap: 12,
  },
  goalStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  socialCard: {
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
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialItem: {
    width: '47%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
})
