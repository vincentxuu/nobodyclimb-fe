/**
 * 分享邀請組件
 *
 * 對應 apps/web/src/components/shared/share-invitation.tsx
 */

import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { ChevronRight, Pen, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import { Button, Text } from '@/components/ui'
import { useGuestSession } from '@/lib/hooks/useGuestSession'
import { useAuthStore } from '@/store/authStore'

const DISMISSED_KEY = 'share_invitation_dismissed'

interface ShareInvitationProps {
  onStartShare?: () => void
}

export function ShareInvitation({ onStartShare }: ShareInvitationProps) {
  const router = useRouter()
  const status = useAuthStore((state) => state.status)
  const { isEligibleToShare, justBecameEligible, session } = useGuestSession()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    let mounted = true

    AsyncStorage.getItem(DISMISSED_KEY)
      .then((value) => {
        if (mounted && value === 'true') {
          setIsDismissed(true)
        }
      })
      .catch(() => undefined)

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!isEligibleToShare || status === 'signIn' || isDismissed) {
      setIsVisible(false)
      return
    }

    const timer = setTimeout(
      () => {
        setIsVisible(true)
      },
      justBecameEligible ? 500 : 2000
    )

    return () => clearTimeout(timer)
  }, [isDismissed, isEligibleToShare, justBecameEligible, status])

  const handleDismiss = async () => {
    setIsVisible(false)
    setIsDismissed(true)
    await AsyncStorage.setItem(DISMISSED_KEY, 'true')
  }

  const handleStartShare = async () => {
    await handleDismiss()
    onStartShare?.()
    router.push('/share/anonymous' as never)
  }

  const handleLogin = async () => {
    await handleDismiss()
    router.push('/auth/login' as never)
  }

  if (status === 'signIn' || !isEligibleToShare || isDismissed || !isVisible) {
    return null
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(250)}
      exiting={FadeOutDown.duration(200)}
      style={styles.container}
    >
      <View style={styles.card}>
        <Pressable
          onPress={handleDismiss}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="關閉分享邀請"
          hitSlop={10}
        >
          <X size={18} color={SEMANTIC_COLORS.textMuted} />
        </Pressable>

        <View style={styles.contentRow}>
          <View style={styles.iconCircle}>
            <Pen size={24} color={SEMANTIC_COLORS.textMain} />
          </View>

          <View style={styles.copy}>
            <Text variant="h4" fontWeight="700" style={styles.title}>
              想分享你的攀岩故事嗎？
            </Text>
            <Text variant="small" color="textSubtle" style={styles.description}>
              每個攀岩者都有獨特的故事，匿名分享也可以
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            variant="primary"
            size="sm"
            onPress={handleStartShare}
            style={styles.actionButton}
          >
            <View style={styles.actionContent}>
              <Text fontWeight="600" style={styles.primaryActionText}>
                開始分享
              </Text>
              <ChevronRight size={16} color={SEMANTIC_COLORS.textMain} />
            </View>
          </Button>
          <Button variant="secondary" size="sm" onPress={handleLogin} style={styles.actionButton}>
            登入後分享
          </Button>
        </View>

        {session && (
          <View style={styles.progress}>
            <Text variant="caption" color="textMuted">
              你已瀏覽 {session.biographyViews} 個攀岩者故事
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    bottom: SPACING.lg,
    zIndex: 20,
  },
  card: {
    borderRadius: 14,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    zIndex: 1,
    padding: 4,
    borderRadius: 999,
  },
  contentRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingRight: SPACING.lg,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE70C',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: SEMANTIC_COLORS.textMain,
  },
  description: {
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  actionButton: {
    minWidth: 112,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  primaryActionText: {
    color: SEMANTIC_COLORS.textMain,
  },
  progress: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
})

export default ShareInvitation
