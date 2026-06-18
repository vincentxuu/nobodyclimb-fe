/**
 * ContentLikeButton 組件
 *
 * 內容按讚按鈕，對應 apps/web/src/components/biography/display/ContentLikeButton.tsx
 */

import { SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { Mountain } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated'
import { Avatar, Text } from '@/components/ui'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface InteractorUser {
  user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

interface ContentLikeButtonProps {
  /** 是否已按讚 */
  isLiked: boolean
  /** 按讚數 */
  likeCount: number
  /** 按讚切換回呼 */
  onToggle: () => Promise<{ liked: boolean; like_count: number }>
  /** 取得按讚者列表（選填，有傳才顯示可點擊的讚數） */
  onFetchLikers?: () => Promise<InteractorUser[]>
  /** 按下按讚者 */
  onPressLiker?: (user: InteractorUser) => void
  /** 按鈕大小 */
  size?: 'sm' | 'md'
}

export function ContentLikeButton({
  isLiked: initialIsLiked,
  likeCount: initialLikeCount,
  onToggle,
  onFetchLikers,
  onPressLiker,
  size = 'sm',
}: ContentLikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLoading, setIsLoading] = useState(false)
  const [isLikersOpen, setIsLikersOpen] = useState(false)
  const [likers, setLikers] = useState<InteractorUser[]>([])
  const [isLoadingLikers, setIsLoadingLikers] = useState(false)

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
      setLikers([])
    } catch (_error) {
      // 回滾
      setIsLiked(!newIsLiked)
      setLikeCount((prev) => (!newIsLiked ? prev + 1 : Math.max(0, prev - 1)))
    } finally {
      setIsLoading(false)
    }
  }, [isLiked, isLoading, onToggle, scale])

  const handleShowLikers = useCallback(async () => {
    if (!onFetchLikers || likeCount === 0) return

    const nextOpen = !isLikersOpen
    setIsLikersOpen(nextOpen)
    if (!nextOpen || likers.length > 0) return

    setIsLoadingLikers(true)
    try {
      const data = await onFetchLikers()
      setLikers(data)
    } catch (error) {
      console.error('Failed to fetch likers:', error)
    } finally {
      setIsLoadingLikers(false)
    }
  }, [isLikersOpen, likeCount, likers.length, onFetchLikers])

  const iconSize = size === 'sm' ? 16 : 20
  const iconColor = isLiked ? SEMANTIC_COLORS.success : WB_COLORS[60]

  return (
    <View>
      <View style={styles.container}>
        <AnimatedPressable style={animatedStyle} onPress={handlePress} disabled={isLoading}>
          <Mountain size={iconSize} color={iconColor} />
        </AnimatedPressable>
        {likeCount > 0 ? (
          <Pressable
            onPress={onFetchLikers ? handleShowLikers : handlePress}
            disabled={isLoading || (!onFetchLikers && isLoading)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text variant="small" style={isLiked ? styles.likedText : styles.unlikedText}>
              {likeCount}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {onFetchLikers && isLikersOpen ? (
        <View style={styles.interactorsPanel}>
          {isLoadingLikers ? (
            <ActivityIndicator size="small" color={WB_COLORS[60]} />
          ) : likers.length > 0 ? (
            <View style={styles.interactorsList}>
              {likers.map((user) => {
                const displayName = user.display_name || user.username
                return (
                  <Pressable
                    key={user.user_id}
                    style={styles.interactorChip}
                    onPress={() => onPressLiker?.(user)}
                    disabled={!onPressLiker}
                  >
                    <Avatar
                      size="xs"
                      source={user.avatar_url ? { uri: user.avatar_url } : undefined}
                      alt={displayName}
                    />
                    <Text variant="small" style={styles.interactorName} numberOfLines={1}>
                      {displayName}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          ) : (
            <Text variant="small" style={styles.emptyText}>
              還沒有人按讚
            </Text>
          )}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.xs,
  },
  interactorsPanel: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#EBEAEA',
  },
  interactorsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  interactorChip: {
    maxWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  interactorName: {
    color: WB_COLORS[70],
  },
  emptyText: {
    color: WB_COLORS[50],
    textAlign: 'center',
    paddingVertical: SPACING.xs,
  },
  likedText: {
    color: SEMANTIC_COLORS.success,
  },
  unlikedText: {
    color: WB_COLORS[60],
  },
})

export default ContentLikeButton
