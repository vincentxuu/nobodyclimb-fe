/**
 * BiographyLikeButton 組件
 *
 * 傳記按讚按鈕，對應 apps/web/src/components/biography/biography-like-button.tsx
 */

import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import { Mountain } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'
import { biographyService } from '@/lib/biographyService'
import { useAuthStore } from '@/store/authStore'

interface BiographyLikeButtonProps {
  biographyId: string
  initialLiked?: boolean
  initialCount?: number
  onLikeChange?: (isLiked: boolean, count: number) => void
  showCount?: boolean
}

export function BiographyLikeButton({
  biographyId,
  initialLiked = false,
  initialCount = 0,
  onLikeChange,
  showCount = true,
}: BiographyLikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const status = useAuthStore((state) => state.status)
  const router = useRouter()

  useEffect(() => {
    if (hasFetched) return

    const fetchLikeStatus = async () => {
      try {
        const response = await biographyService.getLikeStatus(biographyId)
        if (response.success && response.data) {
          setIsLiked(response.data.liked)
          setCount(response.data.likes)
        }
      } catch (error) {
        console.error('Failed to fetch like status:', error)
      } finally {
        setHasFetched(true)
      }
    }

    fetchLikeStatus()
  }, [biographyId, hasFetched])

  const handlePress = async () => {
    if (status !== 'signIn') {
      router.push('/auth/login')
      return
    }

    setIsLoading(true)
    try {
      const response = await biographyService.toggleLike(biographyId)
      if (response.success && response.data) {
        setIsLiked(response.data.liked)
        setCount(response.data.likes)
        onLikeChange?.(response.data.liked, response.data.likes)
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      onPress={handlePress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={SEMANTIC_COLORS.textMuted} />
      ) : (
        <Mountain
          size={16}
          color={isLiked ? SEMANTIC_COLORS.success : SEMANTIC_COLORS.textMuted}
          fill={isLiked ? SEMANTIC_COLORS.success : 'transparent'}
        />
      )}
      {showCount && <Text style={[styles.count, isLiked && styles.countLiked]}>{count}</Text>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: SPACING.xs,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  count: {
    fontSize: 14,
    color: SEMANTIC_COLORS.textMuted,
  },
  countLiked: {
    color: SEMANTIC_COLORS.success,
  },
})

export default BiographyLikeButton
