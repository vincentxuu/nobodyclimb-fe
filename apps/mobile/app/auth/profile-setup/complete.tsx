/**
 * Profile Setup - 完成頁面
 *
 * 對應 apps/web/src/app/auth/profile-setup/complete/page.tsx
 */
import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { YStack } from 'tamagui'
import { CheckCircle, PartyPopper, Mountain } from 'lucide-react-native'
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated'

import { Text, Button, ProgressBar } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'

export default function CompleteScreen() {
  const router = useRouter()

  // 動畫
  const scale = useSharedValue(1)
  const rotation = useSharedValue(0)

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      3
    )

    rotation.value = withSequence(
      withTiming(-5, { duration: 100 }),
      withTiming(5, { duration: 100 }),
      withTiming(-5, { duration: 100 }),
      withTiming(0, { duration: 100 })
    )
  }, [scale, rotation])

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }))

  // 處理完成
  const handleComplete = () => {
    router.replace('/')
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <YStack flex={1} padding={SPACING.lg} justifyContent="center">
        {/* 進度條 */}
        <YStack gap={SPACING.xs} marginBottom={SPACING.xl}>
          <ProgressBar value={100} color="#22C55E" />
          <Text variant="small" color="textSubtle" textAlign="center">
            設定完成！
          </Text>
        </YStack>

        <Animated.View entering={FadeInDown.duration(600)}>
          <YStack alignItems="center" gap={SPACING.lg}>
            {/* 圖標 */}
            <Animated.View style={iconAnimatedStyle}>
              <View style={styles.iconContainer}>
                <CheckCircle size={80} color="#22C55E" />
              </View>
            </Animated.View>

            {/* 標題 */}
            <YStack alignItems="center" gap={SPACING.sm}>
              <Text variant="h1" style={styles.title}>
                歡迎加入 NobodyClimb！
              </Text>
              <Text color="textSubtle" style={styles.subtitle}>
                您的個人資料已設定完成，現在可以開始探索攀岩社群了
              </Text>
            </YStack>

            {/* 裝飾圖標 */}
            <Animated.View entering={FadeInUp.delay(300).duration(400)}>
              <View style={styles.decorationContainer}>
                <PartyPopper
                  size={24}
                  color={SEMANTIC_COLORS.brand}
                  style={styles.decorIcon}
                />
                <Mountain
                  size={32}
                  color={SEMANTIC_COLORS.textMain}
                />
                <PartyPopper
                  size={24}
                  color={SEMANTIC_COLORS.brand}
                  style={[styles.decorIcon, styles.decorIconFlipped]}
                />
              </View>
            </Animated.View>
          </YStack>
        </Animated.View>

        {/* 按鈕 */}
        <Animated.View
          entering={FadeInUp.delay(600).duration(400)}
          style={styles.buttonContainer}
        >
          <Button
            variant="primary"
            onPress={handleComplete}
            style={styles.completeButton}
          >
            <Text style={styles.buttonText}>開始探索</Text>
          </Button>
        </Animated.View>
      </YStack>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  iconContainer: {
    padding: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    lineHeight: 22,
  },
  decorationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  decorIcon: {
    opacity: 0.8,
  },
  decorIconFlipped: {
    transform: [{ scaleX: -1 }],
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingTop: SPACING.xl,
  },
  completeButton: {
    width: '100%',
    height: 48,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
})
