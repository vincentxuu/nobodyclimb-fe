/**
 * QuickReactionBar 組件
 *
 * 快速回應列，對應 apps/web/src/components/biography/display/QuickReactionBar.tsx
 */
import React, { useState, useCallback } from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated'

import { Text } from '@/components/ui'
import { BRAND_YELLOW, RADIUS, SPACING, WB_COLORS } from '@nobodyclimb/constants'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

type ContentType = 'core-stories' | 'one-liners' | 'stories'

// 快速回應類型
interface QuickReaction {
  id: string
  label: string
  emoji: string
}

const QUICK_REACTIONS: QuickReaction[] = [
  { id: 'me_too', label: '我也是', emoji: '🙋' },
  { id: 'plus_one', label: '+1', emoji: '👍' },
  { id: 'well_said', label: '說得好', emoji: '💯' },
]

interface QuickReactionButtonProps {
  reaction: QuickReaction
  count: number
  isReacted: boolean
  onPress: () => void
  size: 'sm' | 'md'
}

function QuickReactionButton({
  reaction,
  count,
  isReacted,
  onPress,
  size,
}: QuickReactionButtonProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.15, { damping: 10 }),
      withSpring(1, { damping: 10 })
    )
    onPress()
  }

  const buttonSize = size === 'sm' ? styles.buttonSm : styles.buttonMd
  const fontSize = size === 'sm' ? 12 : 14

  return (
    <AnimatedPressable
      style={[
        styles.button,
        buttonSize,
        isReacted && styles.buttonReacted,
        animatedStyle,
      ]}
      onPress={handlePress}
    >
      <Text style={{ fontSize }}>{reaction.emoji}</Text>
      <Text
        variant="small"
        style={isReacted ? styles.labelReacted : styles.label}
      >
        {reaction.label}
      </Text>
      {count > 0 && (
        <Text
          variant="small"
          style={isReacted ? styles.countReacted : styles.count}
        >
          {count}
        </Text>
      )}
    </AnimatedPressable>
  )
}

interface QuickReactionBarProps {
  /** 內容類型 */
  contentType: ContentType
  /** 內容 ID */
  contentId: string
  /** 按鈕大小 */
  size?: 'sm' | 'md'
}

export function QuickReactionBar({
  contentType,
  contentId,
  size = 'sm',
}: QuickReactionBarProps) {
  // 本地狀態 (實際應從 API 獲取)
  const [reactions, setReactions] = useState<Record<string, { count: number; isReacted: boolean }>>({
    me_too: { count: 0, isReacted: false },
    plus_one: { count: 0, isReacted: false },
    well_said: { count: 0, isReacted: false },
  })

  const handleReaction = useCallback(
    async (reactionId: string) => {
      // 樂觀更新
      setReactions((prev) => {
        const current = prev[reactionId]
        const newIsReacted = !current.isReacted
        return {
          ...prev,
          [reactionId]: {
            count: newIsReacted
              ? current.count + 1
              : Math.max(0, current.count - 1),
            isReacted: newIsReacted,
          },
        }
      })

      try {
        // TODO: 整合 API
        // await quickReactionService.toggleReaction(contentType, contentId, reactionId)
      } catch (error) {
        // 回滾
        setReactions((prev) => {
          const current = prev[reactionId]
          const newIsReacted = !current.isReacted
          return {
            ...prev,
            [reactionId]: {
              count: newIsReacted
                ? current.count + 1
                : Math.max(0, current.count - 1),
              isReacted: newIsReacted,
            },
          }
        })
      }
    },
    [contentType, contentId]
  )

  return (
    <View style={styles.container}>
      {QUICK_REACTIONS.map((reaction) => (
        <QuickReactionButton
          key={reaction.id}
          reaction={reaction}
          count={reactions[reaction.id]?.count || 0}
          isReacted={reactions[reaction.id]?.isReacted || false}
          onPress={() => handleReaction(reaction.id)}
          size={size}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: WB_COLORS[10],
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  buttonSm: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  buttonMd: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  buttonReacted: {
    backgroundColor: 'rgba(255, 231, 12, 0.2)',
    borderColor: BRAND_YELLOW[100],
  },
  label: {
    color: WB_COLORS[70],
  },
  labelReacted: {
    color: WB_COLORS[100],
  },
  count: {
    color: WB_COLORS[60],
  },
  countReacted: {
    color: WB_COLORS[100],
    fontWeight: '500',
  },
})

export default QuickReactionBar
