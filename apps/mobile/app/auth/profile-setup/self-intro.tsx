/**
 * Profile Setup - 自我介紹頁面
 *
 * 對應 apps/web/src/app/auth/profile-setup/self-intro/page.tsx
 */
import React, { useState, useCallback } from 'react'
import {
  StyleSheet,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { YStack, XStack } from 'tamagui'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Text, Button, ProgressBar } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, FONT_SIZE, RADIUS } from '@nobodyclimb/constants'

// 自我介紹提示問題
const INTRO_PROMPTS = [
  '您是如何開始攀岩的？',
  '攀岩對您來說意味著什麼？',
  '您最喜歡的攀岩地點是哪裡？',
]

export default function SelfIntroScreen() {
  const router = useRouter()

  const [intro, setIntro] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 處理下一步
  const handleNext = useCallback(async () => {
    setIsLoading(true)
    try {
      // TODO: 儲存自我介紹到後端
      router.push('/auth/profile-setup/complete')
    } catch (error) {
      console.error('儲存失敗', error)
    } finally {
      setIsLoading(false)
    }
  }, [router])

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(400)}>
            <YStack gap={SPACING.lg}>
              {/* 進度條 */}
              <YStack gap={SPACING.xs}>
                <XStack justifyContent="space-between">
                  <Text variant="small" color="textSubtle">
                    步驟 3/4
                  </Text>
                  <Text variant="small" color="textSubtle">
                    自我介紹
                  </Text>
                </XStack>
                <ProgressBar value={75} />
              </YStack>

              {/* 標題 */}
              <YStack gap={SPACING.xs}>
                <Text variant="h2">分享您的攀岩故事</Text>
                <Text color="textSubtle">
                  讓其他攀岩愛好者更了解您
                </Text>
              </YStack>

              {/* 提示問題 */}
              <YStack gap={SPACING.sm}>
                <Text variant="body" fontWeight="500">
                  您可以回答以下問題：
                </Text>
                {INTRO_PROMPTS.map((prompt, index) => (
                  <XStack key={index} gap={SPACING.xs} alignItems="flex-start">
                    <Text color="textSubtle">•</Text>
                    <Text color="textSubtle">{prompt}</Text>
                  </XStack>
                ))}
              </YStack>

              {/* 自我介紹輸入 */}
              <YStack gap={SPACING.xs}>
                <View style={styles.textAreaContainer}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="寫下您的攀岩故事..."
                    placeholderTextColor={SEMANTIC_COLORS.textMuted}
                    value={intro}
                    onChangeText={setIntro}
                    multiline
                    numberOfLines={8}
                    maxLength={500}
                    textAlignVertical="top"
                  />
                </View>
                <Text variant="caption" color="textMuted">
                  {intro.length}/500
                </Text>
              </YStack>

              {/* 按鈕 */}
              <YStack gap={SPACING.sm} marginTop={SPACING.lg}>
                <Button
                  variant="primary"
                  onPress={handleNext}
                  disabled={isLoading}
                  style={styles.nextButton}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? '處理中...' : '下一步'}
                  </Text>
                </Button>
                <Button
                  variant="ghost"
                  onPress={() => router.push('/auth/profile-setup/complete')}
                  style={styles.skipButton}
                >
                  <Text color="textSubtle">跳過此步驟</Text>
                </Button>
              </YStack>
            </YStack>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  textAreaContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D3D3D3',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    minHeight: 160,
  },
  textArea: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: SEMANTIC_COLORS.textMain,
    lineHeight: 22,
  },
  nextButton: {
    width: '100%',
    height: 44,
  },
  skipButton: {
    width: '100%',
    height: 44,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
})
