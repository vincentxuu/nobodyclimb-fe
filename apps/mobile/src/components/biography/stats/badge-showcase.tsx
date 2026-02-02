/**
 * 徽章展示組件
 *
 * 對應 apps/web/src/components/biography/stats/badge-showcase.tsx
 */
import React, { useState } from 'react'
import { View, StyleSheet, Pressable, ScrollView, type ViewStyle } from 'react-native'
import { WB_COLORS, SEMANTIC_COLORS, BRAND_YELLOW } from '@nobodyclimb/constants'
import { Text } from '../../ui/Text'
import { BadgeGrid } from './badge-card'
import { BadgeIcon } from './badge-icon'
import {
  BADGES,
  BADGE_CATEGORIES,
  BADGE_COLORS,
  getBadgesByCategory,
  type BadgeCategory,
} from '../../../lib/constants/badges'
import type { BadgeProgress } from '@nobodyclimb/types'

// ============================================
// BadgeShowcase 組件
// ============================================

export interface BadgeShowcaseProps {
  /** 徽章進度資料 */
  badgeProgress: BadgeProgress[]
  /** 自定義樣式 */
  style?: ViewStyle
}

export function BadgeShowcase({ badgeProgress, style }: BadgeShowcaseProps) {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all')

  // 將進度數據轉換為 Map 以便查找
  const progressMap = new Map(badgeProgress.map((p) => [p.badge_id, p]))

  // 計算解鎖統計
  const unlockedCount = badgeProgress.filter((p) => p.unlocked).length
  const totalCount = Object.keys(BADGES).length

  // 獲取顯示的徽章
  const displayBadges =
    selectedCategory === 'all'
      ? Object.values(BADGES)
      : getBadgesByCategory(selectedCategory)

  // 按解鎖狀態排序（已解鎖在前）
  const sortedBadges = [...displayBadges].sort((a, b) => {
    const aUnlocked = progressMap.get(a.id)?.unlocked ?? false
    const bUnlocked = progressMap.get(b.id)?.unlocked ?? false
    if (aUnlocked === bUnlocked) return 0
    return aUnlocked ? -1 : 1
  })

  const categories: Array<{ key: BadgeCategory | 'all'; label: string }> = [
    { key: 'all', label: '全部' },
    ...Object.entries(BADGE_CATEGORIES).map(([key, label]) => ({
      key: key as BadgeCategory,
      label,
    })),
  ]

  return (
    <View style={[styles.container, style]}>
      {/* 頭部統計 */}
      <View style={styles.header}>
        <View>
          <Text variant="h3">徽章收藏</Text>
          <Text variant="caption" color="muted">
            已解鎖 {unlockedCount}/{totalCount} 個徽章
          </Text>
        </View>

        {/* 已解鎖徽章預覽 */}
        <View style={styles.previewContainer}>
          {badgeProgress
            .filter((p) => p.unlocked)
            .slice(0, 5)
            .map((p) => (
              <BadgeIcon key={p.badge_id} badge={p.badge_id} size="sm" showTooltip />
            ))}
          {unlockedCount > 5 && (
            <View style={styles.moreCount}>
              <Text variant="caption" color="muted">
                +{unlockedCount - 5}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 分類篩選 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {categories.map((category) => (
          <Pressable
            key={category.key}
            onPress={() => setSelectedCategory(category.key)}
            style={[
              styles.filterButton,
              selectedCategory === category.key && styles.filterButtonActive,
            ]}
          >
            <Text
              variant="caption"
              style={{
                color:
                  selectedCategory === category.key
                    ? WB_COLORS[0]
                    : SEMANTIC_COLORS.textSubtle,
                fontWeight: selectedCategory === category.key ? '600' : '400',
              }}
            >
              {category.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* 徽章網格 */}
      <BadgeGrid
        badges={sortedBadges.map((badge) => ({
          badgeId: badge.id,
          progress: progressMap.get(badge.id),
        }))}
        columns={2}
        style={styles.grid}
      />

      {/* 下一個可解鎖提示 */}
      {unlockedCount < totalCount && (
        <View style={styles.nextUnlock}>
          <Text variant="bodyBold" style={styles.nextUnlockTitle}>
            即將解鎖
          </Text>
          <View style={styles.nextUnlockList}>
            {badgeProgress
              .filter((p) => !p.unlocked && p.progress >= 50)
              .sort((a, b) => b.progress - a.progress)
              .slice(0, 3)
              .map((p) => {
                const badge = BADGES[p.badge_id]
                if (!badge) return null
                return (
                  <View key={p.badge_id} style={styles.nextUnlockItem}>
                    <BadgeIcon badge={p.badge_id} size="sm" unlocked={false} />
                    <View style={styles.nextUnlockInfo}>
                      <Text variant="body">{badge.name}</Text>
                      <Text variant="caption" color="muted">
                        {p.current_value}/{p.target_value} ({p.progress}%)
                      </Text>
                    </View>
                  </View>
                )
              })}
          </View>
        </View>
      )}
    </View>
  )
}

// ============================================
// CompactBadgeDisplay 組件
// ============================================

export interface CompactBadgeDisplayProps {
  /** 徽章進度資料 */
  badgeProgress: BadgeProgress[]
  /** 最大顯示數量 */
  maxDisplay?: number
  /** 自定義樣式 */
  style?: ViewStyle
}

export function CompactBadgeDisplay({
  badgeProgress,
  maxDisplay = 6,
  style,
}: CompactBadgeDisplayProps) {
  const unlockedBadges = badgeProgress.filter((p) => p.unlocked)
  const displayBadges = unlockedBadges.slice(0, maxDisplay)
  const remainingCount = Math.max(0, unlockedBadges.length - maxDisplay)

  if (unlockedBadges.length === 0) {
    return (
      <View style={style}>
        <Text variant="caption" color="muted">
          尚未解鎖任何徽章
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.compactContainer, style]}>
      {displayBadges.map((p) => (
        <BadgeIcon key={p.badge_id} badge={p.badge_id} size="sm" showTooltip />
      ))}
      {remainingCount > 0 && (
        <Text variant="caption" color="muted">
          +{remainingCount}
        </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  previewContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  moreCount: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: WB_COLORS[10],
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScroll: {
    marginHorizontal: -16,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: WB_COLORS[10],
  },
  filterButtonActive: {
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  grid: {
    marginTop: 8,
  },
  nextUnlock: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: `${BRAND_YELLOW[100]}1A`, // 10% opacity
    borderWidth: 1,
    borderColor: BRAND_YELLOW[100],
  },
  nextUnlockTitle: {
    marginBottom: 12,
  },
  nextUnlockList: {
    gap: 16,
  },
  nextUnlockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nextUnlockInfo: {
    flex: 1,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
})
