/**
 * 徽章卡片組件
 *
 * 對應 apps/web/src/components/biography/stats/badge-card.tsx
 */
import React from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import { Check } from 'lucide-react-native'
import { WB_COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'
import { Text } from '../../ui/Text'
import { ProgressBar } from '../../ui/ProgressBar'
import {
  type BadgeDefinition,
  getBadgeById,
  BADGE_COLORS,
} from '../../../lib/constants/badges'
import type { BadgeProgress } from '@nobodyclimb/types'

// ============================================
// BadgeCard 組件
// ============================================

export interface BadgeCardProps {
  /** 徽章 (可以是 BadgeDefinition 或 badge ID 字串) */
  badge: BadgeDefinition | string
  /** 進度資料 */
  progress?: BadgeProgress
  /** 自定義樣式 */
  style?: ViewStyle
}

export function BadgeCard({ badge, progress, style }: BadgeCardProps) {
  const badgeData = typeof badge === 'string' ? getBadgeById(badge) : badge

  if (!badgeData) {
    return null
  }

  const Icon = badgeData.icon
  const isUnlocked = progress?.unlocked ?? false
  const progressPercent = progress?.progress ?? 0
  const colors = isUnlocked ? BADGE_COLORS.unlocked : BADGE_COLORS.locked

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isUnlocked ? WB_COLORS[0] : WB_COLORS[10],
          borderColor: isUnlocked ? colors.border : WB_COLORS[20],
        },
        isUnlocked && styles.containerUnlocked,
        style,
      ]}
    >
      {/* 徽章圖標 */}
      <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
        <Icon size={32} color={colors.icon} />
        {isUnlocked && (
          <View style={[styles.checkBadge, { backgroundColor: BADGE_COLORS.indicator.bg }]}>
            <Check size={16} color={BADGE_COLORS.indicator.icon} />
          </View>
        )}
      </View>

      {/* 徽章名稱 */}
      <Text
        variant="bodyBold"
        color={isUnlocked ? 'main' : 'muted'}
        style={styles.name}
        numberOfLines={1}
      >
        {badgeData.name}
      </Text>

      {/* 徽章描述 */}
      <Text variant="caption" color="muted" style={styles.description} numberOfLines={2}>
        {badgeData.description}
      </Text>

      {/* 進度條 */}
      {!isUnlocked && progress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text variant="caption" color="muted">
              進度
            </Text>
            <Text variant="caption" color="muted">
              {progress.current_value}/{progress.target_value}
            </Text>
          </View>
          <ProgressBar
            value={progressPercent}
            height={8}
            color={BADGE_COLORS.progress.fill}
            backgroundColor={BADGE_COLORS.progress.bg}
          />
        </View>
      )}

      {/* 解鎖時間 */}
      {isUnlocked && progress?.unlocked_at && (
        <Text variant="caption" color="muted" style={styles.unlockedAt}>
          {new Date(progress.unlocked_at).toLocaleDateString('zh-TW')} 解鎖
        </Text>
      )}
    </View>
  )
}

// ============================================
// BadgeGrid 組件
// ============================================

export interface BadgeGridProps {
  /** 徽章資料列表 */
  badges: Array<{
    badgeId: string
    progress?: BadgeProgress
  }>
  /** 欄數 */
  columns?: 2 | 3 | 4
  /** 自定義樣式 */
  style?: ViewStyle
}

export function BadgeGrid({ badges, columns = 3, style }: BadgeGridProps) {
  // 計算每個項目的寬度比例
  const itemWidth = columns === 2 ? '48%' : columns === 3 ? '31%' : '23%'

  return (
    <View style={[styles.gridContainer, style]}>
      {badges.map(({ badgeId, progress }) => (
        <BadgeCard
          key={badgeId}
          badge={badgeId}
          progress={progress}
          style={{ width: itemWidth } as ViewStyle}
        />
      ))}
    </View>
  )
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  containerUnlocked: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    position: 'relative',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    textAlign: 'center',
    marginBottom: 12,
  },
  progressContainer: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  unlockedAt: {
    marginTop: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
})
