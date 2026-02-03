/**
 * BiographyLikeButton 組件
 *
 * 傳記按讚按鈕，對應 apps/web/src/components/biography/biography-like-button.tsx
 */
import React, { useState, useEffect } from 'react'
import { StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { Mountain } from 'lucide-react-native'
import { useRouter } from 'expo-router'

import { Text } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { biographyService } from '@/lib/biographyService'
import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'

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
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
      onPress={handlePress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={SEMANTIC_COLORS.textMuted} />
      ) : (
        <Mountain
          size={16}
          color={isLiked ? '#10B981' : SEMANTIC_COLORS.textMuted}
          fill={isLiked ? '#10B981' : 'transparent'}
        />
      )}
      {showCount && (
        <Text
          style={[
            styles.count,
            isLiked && styles.countLiked,
          ]}
        >
          {count}
        </Text>
      )}
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
    color: '#10B981',
  },
})

export default BiographyLikeButton
