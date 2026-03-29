/**
 * ContentLikeButton 組件
 *
 * 內容按讚按鈕，對應 apps/web/src/components/biography/display/ContentLikeButton.tsx
 */

import { SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { Mountain } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated'
import { Text } from '@/components/ui'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface ContentLikeButtonProps {
  /** 是否已按讚 */
  isLiked: boolean
  /** 按讚數 */
  likeCount: number
  /** 按讚切換回呼 */
  onToggle: () => Promise<{ liked: boolean; like_count: number }>
  /** 按鈕大小 */
  size?: 'sm' | 'md'
}

export function ContentLikeButton({
  isLiked: initialIsLiked,
  likeCount: initialLikeCount,
  onToggle,
  size = 'sm',
}: ContentLikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLoading, setIsLoading] = useState(false)

  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePress = useCallback(async () => {
    if (isLoading) return

    // 樂觀更新
    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    setLikeCount((prev) => (newIsLiked ? prev + 1 : Math.max(0, prev - 1)))

    // 動畫效果
    scale.value = withSequence(withSpring(1.2, { damping: 10 }), withSpring(1, { damping: 10 }))

    setIsLoading(true)
    try {
      const result = await onToggle()
      setIsLiked(result.liked)
      setLikeCount(result.like_count)
    } catch (_error) {
      // 回滾
      setIsLiked(!newIsLiked)
      setLikeCount((prev) => (!newIsLiked ? prev + 1 : Math.max(0, prev - 1)))
    } finally {
      setIsLoading(false)
    }
  }, [isLiked, isLoading, onToggle, scale])

  const iconSize = size === 'sm' ? 16 : 20
  const iconColor = isLiked ? SEMANTIC_COLORS.success : WB_COLORS[60]

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
      onPress={handlePress}
      disabled={isLoading}
    >
      <Mountain size={iconSize} color={iconColor} />
      <Text variant="small" style={isLiked ? styles.likedText : styles.unlikedText}>
        {likeCount}
      </Text>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.xs,
  },
  likedText: {
    color: SEMANTIC_COLORS.success,
  },
  unlikedText: {
    color: WB_COLORS[60],
  },
})

export default ContentLikeButton
