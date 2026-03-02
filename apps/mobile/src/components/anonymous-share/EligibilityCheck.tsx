/**
 * 資格檢查組件
 *
 * 對應 apps/web/src/components/anonymous-share/EligibilityCheck.tsx
 */
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Lock, User } from 'lucide-react-native'

import { Text, Button, ProgressBar } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS } from '@nobodyclimb/constants'
import type { GuestSession } from '@/store/guestSessionStore'
import { SHARE_ELIGIBILITY_THRESHOLD } from '@/store/guestSessionStore'

// 方便使用的別名
const PADDING = {
  md: SPACING[4],
  xl: SPACING[6],
  lg: SPACING[5],
  sm: SPACING[3],
  xs: SPACING[2],
}
const RADIUS = {
  md: BORDER_RADIUS.md,
  xl: BORDER_RADIUS.xl,
}

interface EligibilityCheckProps {
  session: GuestSession
}

/**
 * 資格檢查組件
 * 當用戶未達到分享資格時顯示
 */
export function EligibilityCheck({ session }: EligibilityCheckProps) {
  const router = useRouter()
  const progress = Math.min((session.biographyViews / SHARE_ELIGIBILITY_THRESHOLD) * 100, 100)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Lock size={32} color="#CA8A04" />
          </View>
          <Text variant="h3" fontWeight="700" style={styles.title}>
            再多看看別人的故事
          </Text>
          <Text variant="body" color="subtle" style={styles.subtitle}>
            瀏覽更多攀岩者的故事後，就可以開始分享
          </Text>

          <View style={styles.progressSection}>
            <Text variant="caption" color="muted">
              已瀏覽 {session.biographyViews} 個故事
            </Text>
            <View style={styles.progressBar}>
              <ProgressBar value={progress} color="#FFE70C" />
            </View>
          </View>

          <Button
            variant="primary"
            fullWidth
            onPress={() => router.push('/biography')}
          >
            探索攀岩者故事
          </Button>
        </View>
      </View>
    </SafeAreaView>
  )
}

/**
 * 已登入用戶提示組件
 */
export function AlreadyAuthenticated() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={[styles.iconContainer, styles.iconContainerGreen]}>
            <User size={32} color="#16A34A" />
          </View>
          <Text variant="h3" fontWeight="700" style={styles.title}>
            你已經登入了
          </Text>
          <Text variant="body" color="subtle" style={styles.subtitle}>
            可以直接在個人頁面編輯你的故事
          </Text>

          <Button
            variant="primary"
            fullWidth
            onPress={() => router.push('/profile/edit')}
          >
            前往編輯我的故事
          </Button>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: PADDING.md,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: PADDING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: PADDING.md,
  },
  iconContainerGreen: {
    backgroundColor: '#DCFCE7',
  },
  title: {
    marginBottom: PADDING.xs,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: PADDING.lg,
  },
  progressSection: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.md,
    padding: PADDING.md,
    marginBottom: PADDING.lg,
  },
  progressBar: {
    marginTop: PADDING.sm,
  },
})
