/**
 * EmptyStateCard 組件
 *
 * 空狀態卡片組件，用於新手引導和內容缺失提示
 * 對應 apps/web/src/components/onboarding/EmptyStateCard.tsx
 */
import React, { ReactNode } from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import {
  SEMANTIC_COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  WB_COLORS,
  BRAND_YELLOW,
} from '@nobodyclimb/constants'
import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'

// ═══════════════════════════════════════════
// 針對不同場景的鼓勵文案
// ═══════════════════════════════════════════

export const EMPTY_STATE_MESSAGES = {
  // 人物誌相關
  biography: {
    noStories: {
      title: '你的故事值得被分享',
      description: '每位攀岩者都有獨特的經歷，分享你的故事，讓更多人認識你。',
      actionLabel: '開始寫故事',
    },
    noOneLiners: {
      title: '用一句話介紹自己',
      description: '簡短的自我介紹，讓其他岩友快速認識你。',
      actionLabel: '填寫一句話',
    },
    noTags: {
      title: '選擇你的攀岩標籤',
      description: '讓大家知道你喜歡的攀岩類型和風格。',
      actionLabel: '選擇標籤',
    },
    noAvatar: {
      title: '上傳一張照片',
      description: '讓其他岩友認識你，一張攀岩照片最能代表你！',
      actionLabel: '上傳照片',
    },
  },
  // 社群相關
  social: {
    noFollowing: {
      title: '探索更多小人物',
      description: '追蹤你感興趣的攀岩者，獲取他們的最新動態。',
      actionLabel: '探索人物誌',
    },
    noLikes: {
      title: '為喜歡的內容按讚',
      description: '瀏覽其他岩友的故事，為你喜歡的內容點個讚吧！',
      actionLabel: '瀏覽故事',
    },
    noComments: {
      title: '留下你的想法',
      description: '與其他岩友互動，分享你的經驗和建議。',
      actionLabel: '瀏覽內容',
    },
  },
  // 書籤相關
  bookmarks: {
    noBookmarks: {
      title: '收藏你喜歡的內容',
      description: '將感興趣的故事、路線或岩場加入收藏，方便之後查看。',
      actionLabel: '探索內容',
    },
  },
  // 通用
  generic: {
    noContent: {
      title: '這裡還沒有內容',
      description: '開始探索或創建你的第一個內容吧！',
      actionLabel: '開始探索',
    },
  },
}

// ═══════════════════════════════════════════
// 類型定義
// ═══════════════════════════════════════════

export type EmptyStateVariant = 'default' | 'encouragement' | 'minimal'

export interface EmptyStateCardProps {
  /** 自定義圖標元素 */
  icon?: ReactNode
  /** 標題 */
  title: string
  /** 描述文字 */
  description: string
  /** 主要操作按鈕文字 */
  actionLabel?: string
  /** 主要操作按鈕回調 */
  onAction?: () => void
  /** 次要操作按鈕文字 */
  secondaryActionLabel?: string
  /** 次要操作按鈕回調 */
  onSecondaryAction?: () => void
  /** 自定義樣式 */
  style?: ViewStyle
  /** 變體樣式 */
  variant?: EmptyStateVariant
}

// ═══════════════════════════════════════════
// 組件
// ═══════════════════════════════════════════

export function EmptyStateCard({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
  variant = 'default',
}: EmptyStateCardProps) {
  const variantStyles = {
    default: {
      container: styles.containerDefault,
      iconBg: styles.iconBgDefault,
    },
    encouragement: {
      container: styles.containerEncouragement,
      iconBg: styles.iconBgEncouragement,
    },
    minimal: {
      container: styles.containerMinimal,
      iconBg: styles.iconBgDefault,
    },
  }

  const currentVariant = variantStyles[variant]

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={[styles.container, currentVariant.container, style]}
    >
      {icon && (
        <View style={[styles.iconContainer, currentVariant.iconBg]}>
          {icon}
        </View>
      )}

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      <View style={styles.actionsContainer}>
        {actionLabel && onAction && (
          <Button
            onPress={onAction}
            variant={variant === 'encouragement' ? 'primary' : 'primary'}
            style={styles.actionButton}
          >
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button
            variant="outline"
            onPress={onSecondaryAction}
            style={styles.actionButton}
          >
            {secondaryActionLabel}
          </Button>
        )}
      </View>
    </Animated.View>
  )
}

// ═══════════════════════════════════════════
// 樣式
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING[8],
    alignItems: 'center',
  },
  containerDefault: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  containerEncouragement: {
    backgroundColor: `${SEMANTIC_COLORS.accent}08`,
    borderWidth: 1,
    borderColor: `${SEMANTIC_COLORS.accent}20`,
  },
  containerMinimal: {
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[4],
  },
  iconBgDefault: {
    backgroundColor: WB_COLORS[10],
  },
  iconBgEncouragement: {
    backgroundColor: `${SEMANTIC_COLORS.accent}15`,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.medium,
    color: SEMANTIC_COLORS.textMain,
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  description: {
    fontSize: FONT_SIZE.base,
    color: SEMANTIC_COLORS.textSubtle,
    textAlign: 'center',
    marginBottom: SPACING[6],
    lineHeight: FONT_SIZE.base * 1.5,
  },
  actionsContainer: {
    flexDirection: 'column',
    gap: SPACING[3],
    alignItems: 'center',
    width: '100%',
  },
  actionButton: {
    minWidth: 140,
  },
})

export default EmptyStateCard
