/**
 * Profile Setup - 自我介紹頁面
 *
 * 對應 apps/web/src/app/auth/profile-setup/self-intro/page.tsx
 */

import { FONT_SIZE, RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import { Check } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { XStack, YStack } from 'tamagui'
import { Button, ProgressBar, Text } from '@/components/ui'
import biographyService from '@/lib/biographyService'
import { useQuestions } from '@/lib/hooks/useQuestions'

const CORE_STORY_IDS = {
  CLIMBING_ORIGIN: 'climbing_origin',
  CLIMBING_MEANING: 'climbing_meaning',
  ADVICE_TO_SELF: 'advice_to_self',
} as const

const FALLBACK_CORE_STORIES = [
  {
    id: CORE_STORY_IDS.CLIMBING_ORIGIN,
    title: '你是怎麼開始攀岩的？',
    subtitle: '分享與攀岩相遇的契機',
    placeholder: '例如：朋友揪去抱石館，結果一試成主顧...',
  },
  {
    id: CORE_STORY_IDS.CLIMBING_MEANING,
    title: '攀岩對你來說意味著什麼？',
    subtitle: '可以是成就感、社群、生活節奏或任何感受',
    placeholder: '例如：攀岩讓我學會慢慢解題，也更相信身體...',
  },
  {
    id: CORE_STORY_IDS.ADVICE_TO_SELF,
    title: '你想給剛開始攀岩的自己什麼建議？',
    subtitle: '一句實用或溫柔的提醒都可以',
    placeholder: '例如：別急著追 grade，先享受每一次嘗試...',
  },
]

export default function SelfIntroScreen() {
  const router = useRouter()
  const { data: questionsData, isLoading: questionsLoading } = useQuestions()

  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isPublic, setIsPublic] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const questionsToShow =
    questionsData?.coreStories && questionsData.coreStories.length > 0
      ? questionsData.coreStories
      : FALLBACK_CORE_STORIES

  const filledCount = Object.values(formData).filter((value) => value.trim()).length

  // 處理下一步
  const handleNext = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await biographyService.updateRegistrationBiography({
        climbing_origin: formData[CORE_STORY_IDS.CLIMBING_ORIGIN]?.trim() || undefined,
        climbing_meaning: formData[CORE_STORY_IDS.CLIMBING_MEANING]?.trim() || undefined,
        advice_to_self: formData[CORE_STORY_IDS.ADVICE_TO_SELF]?.trim() || undefined,
        visibility: isPublic ? 'public' : 'private',
      })

      if (!response.success) {
        throw new Error(response.error || '儲存自我介紹失敗')
      }

      router.push('/auth/profile-setup/complete')
    } catch (error) {
      console.error('儲存失敗', error)
      const message = error instanceof Error ? error.message : '請稍後再試'
      Alert.alert('儲存失敗', message)
    } finally {
      setIsLoading(false)
    }
  }, [formData, isPublic, router])

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
                <Text variant="h2">分享你的攀岩故事</Text>
                <Text color="textSubtle">回答幾個核心問題，讓人物誌更完整</Text>
                {filledCount > 0 && (
                  <Text variant="small" color="textSubtle">
                    已填寫 {filledCount}/{questionsToShow.length}
                  </Text>
                )}
              </YStack>

              {questionsLoading ? (
                <Text color="textSubtle">載入題目中...</Text>
              ) : (
                <YStack gap={SPACING.md}>
                  {questionsToShow.map((question) => (
                    <YStack key={question.id} gap={SPACING.xs}>
                      <Text variant="body" fontWeight="600">
                        {question.title}
                      </Text>
                      {question.subtitle && (
                        <Text variant="small" color="textMuted">
                          {question.subtitle}
                        </Text>
                      )}
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.input}
                          placeholder={question.placeholder || ''}
                          placeholderTextColor={SEMANTIC_COLORS.textMuted}
                          value={formData[question.id] || ''}
                          onChangeText={(text) =>
                            setFormData((prev) => ({ ...prev, [question.id]: text }))
                          }
                          maxLength={160}
                          autoCapitalize="sentences"
                        />
                      </View>
                    </YStack>
                  ))}
                </YStack>
              )}

              <Pressable
                onPress={() => setIsPublic((current) => !current)}
                style={styles.visibilityRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isPublic }}
              >
                <View style={[styles.checkbox, isPublic && styles.checkboxChecked]}>
                  {isPublic && <Check size={14} color="#FFFFFF" />}
                </View>
                <Text color="textSubtle">公開我的人物誌</Text>
              </Pressable>

              {/* 按鈕 */}
              <YStack gap={SPACING.sm} marginTop={SPACING.lg}>
                <Button
                  variant="primary"
                  onPress={handleNext}
                  disabled={isLoading || questionsLoading}
                  style={styles.nextButton}
                >
                  <Text style={styles.buttonText}>{isLoading ? '處理中...' : '完成設定'}</Text>
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
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D3D3D3',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    height: 46,
    justifyContent: 'center',
  },
  input: {
    fontSize: FONT_SIZE.sm,
    color: SEMANTIC_COLORS.textMain,
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D3D3D3',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    borderColor: SEMANTIC_COLORS.textMain,
    backgroundColor: SEMANTIC_COLORS.textMain,
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
