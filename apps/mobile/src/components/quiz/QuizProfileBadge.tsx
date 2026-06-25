/**
 * QuizProfileBadge
 *
 * 個人資料頁的人格類型徽章，已測試時顯示類型，未測試時顯示 CTA
 */

import {
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  getPersonalityType,
  SEMANTIC_COLORS,
  SPACING,
} from '@nobodyclimb/constants'
import type { PersonalityTypeCode } from '@nobodyclimb/types'
import { Sparkles } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'

import { Text } from '@/components/ui'

interface QuizProfileBadgeProps {
  /** 人格類型代碼（null 或 undefined 表示尚未測驗） */
  typeCode?: PersonalityTypeCode | null
  /** 尺寸 */
  size?: 'sm' | 'md'
  /** 點擊回調 */
  onPress?: () => void
}

export function QuizProfileBadge({ typeCode, size = 'md', onPress }: QuizProfileBadgeProps) {
  const isSmall = size === 'sm'
  const personalityType = typeCode ? getPersonalityType(typeCode) : undefined

  if (personalityType) {
    // 已測驗：顯示人格類型徽章
    return (
      <Pressable
        style={({ pressed }) => [
          styles.badge,
          {
            backgroundColor: personalityType.color + '1A',
            paddingVertical: isSmall ? SPACING[1] : SPACING[1.5],
            paddingHorizontal: isSmall ? SPACING[2] : SPACING[3],
            opacity: pressed ? 0.7 : 1,
          },
        ]}
        onPress={onPress}
      >
        <View style={[styles.colorDot, { backgroundColor: personalityType.color }]} />
        <Text
          style={{
            fontSize: isSmall ? FONT_SIZE.xs : FONT_SIZE.sm,
            fontWeight: FONT_WEIGHT.semibold,
            color: personalityType.color,
          }}
        >
          {personalityType.code}
        </Text>
        <Text
          style={{
            fontSize: isSmall ? FONT_SIZE.xs : FONT_SIZE.sm,
            fontWeight: FONT_WEIGHT.medium,
            color: personalityType.color,
          }}
        >
          {personalityType.nameZh}
        </Text>
      </Pressable>
    )
  }

  // 未測驗：顯示 CTA
  return (
    <Pressable
      style={({ pressed }) => [
        styles.ctaCard,
        {
          paddingVertical: isSmall ? SPACING[2] : SPACING[3],
          paddingHorizontal: isSmall ? SPACING[3] : SPACING[4],
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      onPress={onPress}
    >
      <Sparkles size={isSmall ? 16 : 20} color={SEMANTIC_COLORS.accent} />
      <View style={styles.ctaTextContainer}>
        <Text
          style={{
            fontSize: isSmall ? FONT_SIZE.sm : FONT_SIZE.base,
            fontWeight: FONT_WEIGHT.semibold,
            color: SEMANTIC_COLORS.textMain,
          }}
        >
          探索你的攀岩人格
        </Text>
        <Text
          style={{
            fontSize: isSmall ? FONT_SIZE.xs : FONT_SIZE.sm,
            fontWeight: FONT_WEIGHT.medium,
            color: SEMANTIC_COLORS.accent,
          }}
        >
          測測看
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING[1.5],
    alignSelf: 'flex-start',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    gap: SPACING[3],
  },
  ctaTextContainer: {
    flex: 1,
    gap: SPACING[0.5],
  },
})
