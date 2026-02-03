/**
 * FollowButton 組件
 *
 * 追蹤按鈕，對應 apps/web/src/components/biography/follow-button.tsx
 */
import React, { useState, useEffect } from 'react'
import { StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { UserPlus, UserMinus } from 'lucide-react-native'
import { useRouter } from 'expo-router'

import { Text } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { biographyService } from '@nobodyclimb/api-client'
import { SEMANTIC_COLORS, SPACING, RADIUS, BRAND_YELLOW } from '@nobodyclimb/constants'

interface FollowButtonProps {
  biographyId: string
  initialFollowing?: boolean
  onFollowChange?: (isFollowing: boolean) => void
  size?: 'sm' | 'default' | 'lg'
}

export function FollowButton({
  biographyId,
  initialFollowing = false,
  onFollowChange,
  size = 'default',
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const status = useAuthStore((state) => state.status)
  const router = useRouter()

  useEffect(() => {
    const fetchFollowStatus = async () => {
      try {
        const response = await biographyService.getFollowStatus(biographyId)
        if (response.success && response.data) {
          setIsFollowing(response.data.following)
        }
      } catch (error) {
        console.error('Failed to fetch follow status:', error)
      }
    }

    fetchFollowStatus()
  }, [biographyId])

  const handlePress = async () => {
    if (status !== 'signIn') {
      router.push('/auth/login')
      return
    }

    setIsLoading(true)
    try {
      if (isFollowing) {
        await biographyService.unfollow(biographyId)
        setIsFollowing(false)
        onFollowChange?.(false)
      } else {
        await biographyService.follow(biographyId)
        setIsFollowing(true)
        onFollowChange?.(true)
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const buttonSize = size === 'sm' ? styles.buttonSm : size === 'lg' ? styles.buttonLg : styles.button

  return (
    <Pressable
      style={({ pressed }) => [
        buttonSize,
        isFollowing ? styles.buttonSecondary : styles.buttonPrimary,
        pressed && styles.buttonPressed,
      ]}
      onPress={handlePress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={isFollowing ? SEMANTIC_COLORS.textMain : '#fff'} />
      ) : isFollowing ? (
        <>
          <UserMinus size={16} color={SEMANTIC_COLORS.textMain} />
          <Text style={styles.textSecondary}>取消追蹤</Text>
        </>
      ) : (
        <>
          <UserPlus size={16} color="#fff" />
          <Text style={styles.textPrimary}>追蹤</Text>
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    minWidth: 100,
  },
  buttonSm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    minWidth: 80,
  },
  buttonLg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    minWidth: 120,
  },
  buttonPrimary: {
    backgroundColor: BRAND_YELLOW[100],
  },
  buttonSecondary: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  textPrimary: {
    color: SEMANTIC_COLORS.textMain,
    fontWeight: '600',
  },
  textSecondary: {
    color: SEMANTIC_COLORS.textMain,
    fontWeight: '500',
  },
})

export default FollowButton
