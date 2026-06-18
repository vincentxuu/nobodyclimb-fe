/**
 * QuickReactionBar 組件
 *
 * 快速回應列，對應 apps/web/src/components/biography/display/QuickReactionBar.tsx
 */

import { BRAND_YELLOW, RADIUS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated'
import { Text } from '@/components/ui'
import { apiClient } from '@/lib/api'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

type ContentType = 'core-stories' | 'one-liners' | 'stories'
type ReactionType = 'me_too' | 'plus_one' | 'well_said'

// 快速回應類型
interface QuickReaction {
  id: ReactionType
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
    scale.value = withSequence(withSpring(1.15, { damping: 10 }), withSpring(1, { damping: 10 }))
    onPress()
  }

  const buttonSize = size === 'sm' ? styles.buttonSm : styles.buttonMd
  const fontSize = size === 'sm' ? 12 : 14

  return (
    <AnimatedPressable
      style={[styles.button, buttonSize, isReacted && styles.buttonReacted, animatedStyle]}
      onPress={handlePress}
    >
      <Text style={{ fontSize }}>{reaction.emoji}</Text>
      <Text variant="small" style={isReacted ? styles.labelReacted : styles.label}>
        {reaction.label}
      </Text>
      {count > 0 && (
        <Text variant="small" style={isReacted ? styles.countReacted : styles.count}>
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

export function QuickReactionBar({ contentType, contentId, size = 'sm' }: QuickReactionBarProps) {
  const [reactions, setReactions] = useState<
    Record<ReactionType, { count: number; isReacted: boolean }>
  >({
    me_too: { count: 0, isReacted: false },
    plus_one: { count: 0, isReacted: false },
    well_said: { count: 0, isReacted: false },
  })

  // 從 API 獲取初始回應狀態
  useEffect(() => {
    const fetchReactions = async () => {
      try {
        const response = await apiClient.get(`/content/${contentType}/${contentId}/reactions`)
        const data = response.data?.data ?? response.data

        if (Array.isArray(data)) {
          const mapped: Record<ReactionType, { count: number; isReacted: boolean }> = {
            me_too: { count: 0, isReacted: false },
            plus_one: { count: 0, isReacted: false },
            well_said: { count: 0, isReacted: false },
          }
          data.forEach((item: any) => {
            const reactionId = item.reaction_id as ReactionType
            if (mapped[reactionId]) {
              mapped[reactionId] = {
                count: item.count ?? 0,
                isReacted: item.is_reacted ?? false,
              }
            }
          })
          setReactions(mapped)
          return
        }

        const counts = data?.counts ?? data?.reaction_counts ?? {}
        const userReactions = new Set<ReactionType>(data?.user_reactions ?? [])

        setReactions({
          me_too: {
            count: counts.me_too ?? 0,
            isReacted: userReactions.has('me_too'),
          },
          plus_one: {
            count: counts.plus_one ?? 0,
            isReacted: userReactions.has('plus_one'),
          },
          well_said: {
            count: counts.well_said ?? 0,
            isReacted: userReactions.has('well_said'),
          },
        })
      } catch (_error) {
        // 靜默失敗，保持預設值
      }
    }
    fetchReactions()
  }, [contentType, contentId])

  const handleReaction = useCallback(
    async (reactionId: ReactionType) => {
      // 樂觀更新
      setReactions((prev) => {
        const current = prev[reactionId]
        const newIsReacted = !current.isReacted
        return {
          ...prev,
          [reactionId]: {
            count: newIsReacted ? current.count + 1 : Math.max(0, current.count - 1),
            isReacted: newIsReacted,
          },
        }
      })

      try {
        const response = await apiClient.post(`/content/${contentType}/${contentId}/reaction`, {
          reaction_type: reactionId,
        })
        const data = response.data?.data ?? response.data
        const counts = data?.reaction_counts
        if (counts) {
          setReactions((prev) => ({
            ...prev,
            me_too: { ...prev.me_too, count: counts.me_too ?? prev.me_too.count },
            plus_one: { ...prev.plus_one, count: counts.plus_one ?? prev.plus_one.count },
            well_said: { ...prev.well_said, count: counts.well_said ?? prev.well_said.count },
          }))
        }
      } catch (_error) {
        // 回滾
        setReactions((prev) => {
          const current = prev[reactionId]
          const newIsReacted = !current.isReacted
          return {
            ...prev,
            [reactionId]: {
              count: newIsReacted ? current.count + 1 : Math.max(0, current.count - 1),
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
