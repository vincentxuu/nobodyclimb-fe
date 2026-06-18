/**
 * Profile Setup - 完成頁面
 *
 * 對應 apps/web/src/app/auth/profile-setup/complete/page.tsx
 */

import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import {
  ArrowRight,
  CheckCircle,
  Edit3,
  Home,
  Mountain,
  PartyPopper,
  Sparkles,
  User,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { YStack } from 'tamagui'
import { ChoiceQuestion, GuidedQuestions } from '@/components/onboarding'
import { Button, ProgressBar, Text } from '@/components/ui'
import biographyService from '@/lib/biographyService'
import { useChoiceQuestions, useQuestions, useSubmitChoiceAnswer } from '@/lib/hooks/useQuestions'

const GUIDED_QUESTIONS_CONFIG = [
  { id: 'best_moment', category: '攀岩的樂趣' },
  { id: 'current_goal', category: '目標與挑戰' },
  { id: 'climbing_takeaway', category: '成長與收穫' },
]

type FlowPhase = 'complete' | 'choice' | 'guided'

function buildOneLinersData(answers: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(answers)
      .map(([questionId, answer]) => [questionId, answer.trim()] as const)
      .filter(([, answer]) => answer)
      .map(([questionId, answer]) => [questionId, { answer, visibility: 'public' }])
  )
}

function unwrapBiographyId(data: unknown) {
  if (!data || typeof data !== 'object') return undefined
  const record = data as { id?: unknown; data?: unknown }
  if (typeof record.id === 'string') return record.id
  if (record.data && typeof record.data === 'object') {
    const nested = record.data as { id?: unknown }
    if (typeof nested.id === 'string') return nested.id
  }
  return undefined
}

export default function CompleteScreen() {
  const router = useRouter()
  const { data: questionsData } = useQuestions()
  const { data: choiceQuestions } = useChoiceQuestions()
  const submitChoiceAnswer = useSubmitChoiceAnswer()
  const [flowPhase, setFlowPhase] = useState<FlowPhase>('complete')
  const [currentChoiceIndex, setCurrentChoiceIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const { data: myBiography } = useQuery({
    queryKey: ['my-biography'],
    queryFn: async () => {
      const response = await biographyService.getMyBiography()
      return response.data
    },
  })

  // 動畫
  const scale = useSharedValue(1)
  const rotation = useSharedValue(0)

  const biographyId = unwrapBiographyId(myBiography)
  const guidedQuestions = useMemo(() => {
    if (!questionsData) return []

    return GUIDED_QUESTIONS_CONFIG.map((config) => {
      const oneLiner = questionsData.oneLiners.find((question) => question.id === config.id)
      if (oneLiner) {
        return {
          id: oneLiner.id,
          question: oneLiner.question,
          subtitle: oneLiner.format_hint || undefined,
          placeholder: oneLiner.placeholder || undefined,
          type: 'text' as const,
          category: config.category,
        }
      }

      const coreStory = questionsData.coreStories.find((question) => question.id === config.id)
      if (coreStory) {
        return {
          id: coreStory.id,
          question: coreStory.title,
          subtitle: coreStory.subtitle || undefined,
          placeholder: coreStory.placeholder || undefined,
          type: 'textarea' as const,
          category: config.category,
        }
      }

      return null
    }).filter((question): question is NonNullable<typeof question> => question !== null)
  }, [questionsData])

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.1, { duration: 500 }), withTiming(1, { duration: 500 })),
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
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }))

  const handleStartGuided = useCallback(() => {
    if (choiceQuestions && choiceQuestions.length > 0) {
      setFlowPhase('choice')
      setCurrentChoiceIndex(0)
    } else {
      setFlowPhase('guided')
    }
  }, [choiceQuestions])

  const handleChoiceSubmit = useCallback(
    async (optionId: string, customText?: string, followUpText?: string) => {
      const currentQuestion = choiceQuestions?.[currentChoiceIndex]
      if (!biographyId || !currentQuestion) {
        throw new Error('Biography or question not found')
      }

      const result = await submitChoiceAnswer.mutateAsync({
        biographyId,
        questionId: currentQuestion.id,
        optionId,
        customText,
        followUpText,
      })

      const response = result as { response_message?: string; community_count?: number }
      return {
        responseMessage: response.response_message || '謝謝你的回答',
        communityCount: response.community_count || 1,
      }
    },
    [biographyId, choiceQuestions, currentChoiceIndex, submitChoiceAnswer]
  )

  const handleChoiceComplete = useCallback(() => {
    if (choiceQuestions && currentChoiceIndex < choiceQuestions.length - 1) {
      setCurrentChoiceIndex((prev) => prev + 1)
      return
    }

    if (guidedQuestions.length > 0) {
      setFlowPhase('guided')
    } else {
      router.push('/profile')
    }
  }, [choiceQuestions, currentChoiceIndex, guidedQuestions.length, router])

  const handleChoiceSkip = useCallback(() => {
    if (guidedQuestions.length > 0) {
      setFlowPhase('guided')
    } else {
      setFlowPhase('complete')
    }
  }, [guidedQuestions.length])

  const handleGuidedComplete = useCallback(
    async (answers: Record<string, string>) => {
      setIsSaving(true)
      try {
        const oneLinersData = buildOneLinersData(answers)
        if (Object.keys(oneLinersData).length > 0) {
          await biographyService.updateRegistrationBiography({
            one_liners_data: JSON.stringify(oneLinersData),
          })
        }
        router.push('/profile')
      } catch (error) {
        console.error('Failed to save guided answers:', error)
        Alert.alert('儲存失敗', '請稍後再試')
      } finally {
        setIsSaving(false)
      }
    },
    [router]
  )

  const handleGuidedSkip = useCallback(() => {
    setFlowPhase('complete')
  }, [])

  const handleGoHome = () => {
    router.replace('/')
  }

  if (flowPhase === 'choice' && choiceQuestions && choiceQuestions.length > 0) {
    const currentQuestion = choiceQuestions[currentChoiceIndex]
    if (currentQuestion) {
      return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <ChoiceQuestion
            question={currentQuestion}
            onSubmit={handleChoiceSubmit}
            onSkip={handleChoiceSkip}
            onComplete={handleChoiceComplete}
          />
        </SafeAreaView>
      )
    }
  }

  if (flowPhase === 'guided' && guidedQuestions.length > 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {isSaving ? (
          <View style={styles.savingContainer}>
            <Text color="textSubtle">儲存中...</Text>
          </View>
        ) : (
          <GuidedQuestions
            questions={guidedQuestions}
            onComplete={handleGuidedComplete}
            onSkip={handleGuidedSkip}
            title="讓更多人認識你"
            subtitle="回答幾個簡單問題，讓你的人物誌更加完整"
          />
        )}
      </SafeAreaView>
    )
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
                <PartyPopper size={24} color={SEMANTIC_COLORS.brand} style={styles.decorIcon} />
                <Mountain size={32} color={SEMANTIC_COLORS.textMain} />
                <PartyPopper
                  size={24}
                  color={SEMANTIC_COLORS.brand}
                  style={[styles.decorIcon, styles.decorIconFlipped]}
                />
              </View>
            </Animated.View>

            {guidedQuestions.length > 0 && (
              <View style={styles.guidedCard}>
                <Sparkles size={22} color={SEMANTIC_COLORS.textMain} />
                <YStack flex={1} gap={SPACING.xs}>
                  <Text fontWeight="600">回答更多問題</Text>
                  <Text variant="small" color="textSubtle">
                    補上幾個簡短回答，讓人物誌更有內容
                  </Text>
                </YStack>
                <Button variant="secondary" onPress={handleStartGuided} style={styles.inlineButton}>
                  <ArrowRight size={16} color={SEMANTIC_COLORS.textMain} />
                </Button>
              </View>
            )}
          </YStack>
        </Animated.View>

        {/* 按鈕 */}
        <Animated.View entering={FadeInUp.delay(600).duration(400)} style={styles.buttonContainer}>
          <Button
            variant="primary"
            onPress={() => router.push('/profile')}
            style={styles.completeButton}
          >
            <Edit3 size={18} color="#FFFFFF" />
            <Text style={styles.buttonText}>繼續編輯人物誌</Text>
          </Button>
          <Button
            variant="secondary"
            onPress={() => router.push('/profile')}
            style={styles.completeButton}
          >
            <User size={18} color={SEMANTIC_COLORS.textMain} />
            <Text>查看個人頁</Text>
          </Button>
          <Button variant="ghost" onPress={handleGoHome} style={styles.completeButton}>
            <Home size={18} color={SEMANTIC_COLORS.textMain} />
            <Text color="textSubtle">回到首頁</Text>
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
    gap: SPACING.sm,
  },
  completeButton: {
    width: '100%',
    height: 48,
  },
  inlineButton: {
    width: 42,
    height: 42,
    paddingHorizontal: 0,
  },
  guidedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    width: '100%',
    borderWidth: 1,
    borderColor: '#D3D3D3',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  savingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
})
