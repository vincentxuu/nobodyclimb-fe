/**
 * 提交成功頁面組件
 *
 * 對應 apps/web/src/components/anonymous-share/SubmissionComplete.tsx
 */
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Check, Sparkles } from 'lucide-react-native'
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated'

import { Text, Button } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS } from '@nobodyclimb/constants'

interface SubmissionCompleteProps {
  slug: string
  anonymousName: string
  totalStories: number
}

/**
 * 提交成功頁面組件
 * 顯示匿名故事發布成功後的資訊
 */
export function SubmissionComplete({
  slug,
  anonymousName,
  totalStories,
}: SubmissionCompleteProps) {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          entering={SlideInUp.springify().damping(15)}
          style={styles.card}
        >
          {/* Success Icon */}
          <Animated.View entering={FadeIn.delay(200)} style={styles.iconContainer}>
            <Check size={32} color="#16A34A" />
          </Animated.View>

          {/* Title */}
          <Text variant="h3" style={styles.title}>
            故事已分享！
          </Text>
          <Text variant="body" color="subtle" style={styles.subtitle}>
            你的故事已經以匿名方式發布
          </Text>

          {/* Anonymous Name */}
          <Text variant="h4" style={styles.anonymousName}>
            {anonymousName}
          </Text>
          <Text variant="caption" color="muted" style={styles.storyCount}>
            共 {totalStories} 則故事
          </Text>

          {/* Hint Box */}
          <View style={styles.hintBox}>
            <View style={styles.hintHeader}>
              <Sparkles size={20} color="#CA8A04" />
              <Text variant="bodyBold" style={styles.hintTitle}>
                之後想認領這個故事？
              </Text>
            </View>
            <Text variant="caption" style={styles.hintText}>
              用同一個裝置登入，系統會自動幫你連結
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              variant="primary"
              fullWidth
              onPress={() => router.push(`/biography/${slug}`)}
            >
              查看我的故事
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onPress={() => router.push('/biography')}
              style={styles.secondaryButton}
            >
              繼續探索其他故事
            </Button>
          </View>
        </Animated.View>
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
    paddingHorizontal: SPACING[4],
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING[6],
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
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[4],
  },
  title: {
    marginBottom: SPACING[1],
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: SPACING[3],
  },
  anonymousName: {
    color: SEMANTIC_COLORS.textMain,
    marginBottom: SPACING[1],
  },
  storyCount: {
    marginBottom: SPACING[5],
  },
  hintBox: {
    width: '100%',
    backgroundColor: '#FEF9C3',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING[4],
    marginBottom: SPACING[5],
  },
  hintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[2],
  },
  hintTitle: {
    color: '#92400E',
  },
  hintText: {
    color: '#A16207',
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    gap: SPACING[3],
  },
  secondaryButton: {
    marginTop: SPACING[2],
  },
})
