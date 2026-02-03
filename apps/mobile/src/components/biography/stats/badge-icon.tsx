/**
 * 徽章圖標組件
 *
 * 對應 apps/web/src/components/biography/stats/badge-icon.tsx
 */
import React from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import { Text } from '../../ui/Text'
import {
  type BadgeDefinition,
  getBadgeById,
  BADGE_COLORS,
} from '../../../lib/constants/badges'

// ============================================
// BadgeIcon 組件
// ============================================

export interface BadgeIconProps {
  /** 徽章 (可以是 BadgeDefinition 或 badge ID 字串) */
  badge: BadgeDefinition | string
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** 是否已解鎖 */
  unlocked?: boolean
  /** 是否顯示 Tooltip（在 RN 中改為長按提示） */
  showTooltip?: boolean
  /** 自定義樣式 */
  style?: ViewStyle
}

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 80,
}

const iconSizeMap = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
}

export function BadgeIcon({
  badge,
  size = 'md',
  unlocked = true,
  showTooltip = false,
  style,
}: BadgeIconProps) {
  const badgeData = typeof badge === 'string' ? getBadgeById(badge) : badge

  if (!badgeData) {
    return null
  }

  const Icon = badgeData.icon
  const colors = unlocked ? BADGE_COLORS.unlocked : BADGE_COLORS.locked
  const sizePx = sizeMap[size]
  const iconSize = iconSizeMap[size]

  return (
    <View
      style={[
        styles.container,
        {
          width: sizePx,
          height: sizePx,
          borderRadius: sizePx / 2,
          backgroundColor: colors.bg,
          opacity: unlocked ? 1 : 0.6,
        },
        style,
      ]}
    >
      <Icon size={iconSize} color={colors.icon} />
      {!unlocked && (
        <View
          style={[
            styles.lockedOverlay,
            {
              borderRadius: sizePx / 2,
            },
          ]}
        />
      )}
    </View>
  )
}

// ============================================
// BadgeList 組件
// ============================================

export interface BadgeListProps {
  /** 徽章 ID 列表 */
  badgeIds: string[]
  /** 已解鎖的徽章 ID 列表 */
  unlockedIds?: string[]
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 最大顯示數量 */
  maxDisplay?: number
  /** 自定義樣式 */
  style?: ViewStyle
}

export function BadgeList({
  badgeIds,
  unlockedIds = [],
  size = 'sm',
  maxDisplay,
  style,
}: BadgeListProps) {
  const displayBadges = maxDisplay ? badgeIds.slice(0, maxDisplay) : badgeIds
  const remainingCount = maxDisplay ? Math.max(0, badgeIds.length - maxDisplay) : 0
  const sizePx = sizeMap[size]

  return (
    <View style={[styles.listContainer, style]}>
      {displayBadges.map((badgeId) => (
        <BadgeIcon
          key={badgeId}
          badge={badgeId}
          size={size}
          unlocked={unlockedIds.includes(badgeId)}
          showTooltip
        />
      ))}
      {remainingCount > 0 && (
        <View
          style={[
            styles.remainingBadge,
            {
              width: sizePx,
              height: sizePx,
              borderRadius: sizePx / 2,
            },
          ]}
        >
          <Text variant="caption" color="muted">
            +{remainingCount}
          </Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 245, 0.3)',
  },
  listContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  remainingBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
})
